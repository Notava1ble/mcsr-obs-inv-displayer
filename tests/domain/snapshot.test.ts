import { describe, expect, test } from "bun:test";
import { buildSnapshot } from "../../src/domain/snapshot";
import type { SpectateMatch } from "../../src/domain/types";

function makeMatch(): SpectateMatch {
  return {
    matchType: "ranked",
    category: "any%",
    gameMode: "normal",
    startTime: 100,
    players: [
      { uuid: "completed", nickname: "Completed", roleType: 0 },
      { uuid: "end", nickname: "End", roleType: 0 },
      { uuid: "stronghold", nickname: "Stronghold", roleType: 0 },
    ],
    completes: [],
    inventories: {
      completed: {},
      end: { beds: 1 },
      stronghold: { beds: 2 },
    },
    counts: [],
    timelines: [
      {
        uuid: "completed",
        type: "projectelo.timeline.complete",
        time: 1000,
        data: [],
        shown: true,
      },
      {
        uuid: "end",
        type: "story.enter_the_end",
        time: 3000,
        data: [],
        shown: true,
      },
      {
        uuid: "stronghold",
        type: "story.follow_ender_eye",
        time: 2000,
        data: [],
        shown: true,
      },
    ],
  };
}

describe("buildSnapshot", () => {
  test("provides timeline data for every player and only ranks active overlay players", () => {
    const snapshot = buildSnapshot(makeMatch(), "update", "input.txt");

    expect(snapshot.players.map((player) => player.uuid)).toEqual([
      "completed",
      "end",
      "stronghold",
    ]);
    expect(snapshot.players[0]?.timeline.status).toBe("completed");
    expect(snapshot.players[1]?.timeline.latestSplit?.type).toBe(
      "story.enter_the_end",
    );
    expect(snapshot.overlayPlayers.map((player) => player.uuid)).toEqual([
      "end",
      "stronghold",
    ]);
  });
});
