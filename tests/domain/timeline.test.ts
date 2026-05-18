import { describe, expect, test } from "bun:test";
import {
  buildPlayerTimelineSummary,
  rankPlayersByTimeline,
} from "../../src/domain/timeline";
import type { SpectateMatch } from "../../src/domain/types";

const players: SpectateMatch["players"] = [
  { uuid: "done", nickname: "Done", roleType: 0 },
  { uuid: "forfeit", nickname: "Forfeit", roleType: 0 },
  { uuid: "reset", nickname: "Reset", roleType: 0 },
  { uuid: "end", nickname: "End", roleType: 0 },
  { uuid: "stronghold-fast", nickname: "StrongFast", roleType: 0 },
  { uuid: "stronghold-slow", nickname: "StrongSlow", roleType: 0 },
  { uuid: "eye-fast", nickname: "EyeFast", roleType: 0 },
  { uuid: "eye-slow", nickname: "EyeSlow", roleType: 0 },
];

function timeline(
  uuid: string,
  type: string,
  time: number,
): SpectateMatch["timelines"][number] {
  return { uuid, type, time, data: [], shown: true };
}

describe("rankPlayersByTimeline", () => {
  test("keeps post-reset timeline data and returns the five fastest latest splits", () => {
    const ranked = rankPlayersByTimeline(players, [
      timeline("done", "projectelo.timeline.complete", 4000),
      timeline("forfeit", "projectelo.timeline.forfeit", 3500),
      timeline("reset", "story.enter_the_end", 2000),
      timeline("reset", "projectelo.timeline.reset", 2500),
      timeline("reset", "story.smelt_iron", 3000),
      timeline("end", "story.follow_ender_eye", 3000),
      timeline("end", "story.enter_the_end", 5000),
      timeline("stronghold-fast", "story.follow_ender_eye", 3100),
      timeline("stronghold-slow", "story.follow_ender_eye", 4500),
      timeline("eye-fast", "projectelo.timeline.blind_travel", 2200),
      timeline("eye-slow", "projectelo.timeline.blind_travel", 2900),
    ]);

    expect(ranked.map((player) => player.uuid)).toEqual([
      "end",
      "stronghold-fast",
      "stronghold-slow",
      "eye-fast",
      "eye-slow",
    ]);
  });

  test("limits ranked players to the requested count", () => {
    const ranked = rankPlayersByTimeline(
      players,
      [
        timeline("end", "story.enter_the_end", 5000),
        timeline("stronghold-fast", "story.follow_ender_eye", 3100),
        timeline("stronghold-slow", "story.follow_ender_eye", 4500),
      ],
      2,
    );

    expect(ranked.map((player) => player.uuid)).toEqual([
      "end",
      "stronghold-fast",
    ]);
  });
});

describe("buildPlayerTimelineSummary", () => {
  test("provides relevant timeline data for a player after their latest reset", () => {
    const summary = buildPlayerTimelineSummary("reset", [
      timeline("reset", "story.enter_the_end", 2000),
      timeline("reset", "projectelo.timeline.reset", 2500),
      timeline("reset", "story.smelt_iron", 3000),
      timeline("reset", "story.lava_bucket", 3200),
      timeline("reset", "adventure.kill_a_mob", 3300),
    ]);

    expect(summary).toEqual({
      entries: [
        { type: "story.smelt_iron", time: 3000 },
        { type: "story.lava_bucket", time: 3200 },
      ],
      latestSplit: {
        type: "story.lava_bucket",
        time: 3200,
        rank: 1,
      },
      status: "active",
    });
  });

  test("uses the fastest repeated split after the latest reset", () => {
    const summary = buildPlayerTimelineSummary("reset", [
      timeline("reset", "projectelo.timeline.reset", 1000),
      timeline("reset", "story.enter_the_nether", 2500),
      timeline("reset", "story.enter_the_nether", 2000),
    ]);

    expect(summary.entries).toEqual([
      { type: "story.enter_the_nether", time: 2000 },
    ]);
    expect(summary.latestSplit).toEqual({
      type: "story.enter_the_nether",
      time: 2000,
      rank: 2,
    });
  });

  test("ignores terminal events before a reset", () => {
    expect(
      buildPlayerTimelineSummary("reset", [
        timeline("reset", "projectelo.timeline.complete", 1000),
        timeline("reset", "projectelo.timeline.reset", 1500),
        timeline("reset", "story.smelt_iron", 2000),
      ]).status,
    ).toBe("active");
  });
});
