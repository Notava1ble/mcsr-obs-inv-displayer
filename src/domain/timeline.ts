import type { SpectateMatch } from "./types";

export const relevantTimelineTypes = [
  "story.smelt_iron",
  "story.lava_bucket",
  "story.enter_the_nether",
  "nether.find_bastion",
  "nether.find_fortress",
  "nether.obtain_blaze_rod",
  "projectelo.timeline.blind_travel",
  "story.follow_ender_eye",
  "story.enter_the_end",
  "end.kill_dragon",
  "projectelo.timeline.dragon_death",
] as const;

export type RelevantTimelineType = (typeof relevantTimelineTypes)[number];

export type PlayerTimelineStatus = "active" | "completed" | "forfeited";

export type PlayerTimelineEntry = {
  type: RelevantTimelineType;
  time: number;
};

export type PlayerLatestSplit = PlayerTimelineEntry & {
  rank: number;
};

export type PlayerTimelineSummary = {
  entries: PlayerTimelineEntry[];
  latestSplit: PlayerLatestSplit | null;
  status: PlayerTimelineStatus;
};

const relevantTypeRanks = new Map<string, number>(
  relevantTimelineTypes.map((type, index) => [type, index]),
);

function isRelevantTimelineType(type: string): type is RelevantTimelineType {
  return relevantTypeRanks.has(type);
}

export function buildPlayerTimelineSummary(
  uuid: string,
  timelines: SpectateMatch["timelines"],
): PlayerTimelineSummary {
  const playerTimelines = timelines
    .filter((timeline) => timeline.uuid === uuid)
    .sort((a, b) => a.time - b.time);
  const latestResetTime =
    playerTimelines.findLast(
      (timeline) => timeline.type === "projectelo.timeline.reset",
    )?.time ?? -Infinity;
  const currentTimelines = playerTimelines.filter(
    (timeline) => timeline.time > latestResetTime,
  );

  if (
    currentTimelines.some(
      (timeline) => timeline.type === "projectelo.timeline.complete",
    )
  ) {
    return { entries: [], latestSplit: null, status: "completed" };
  }

  if (
    currentTimelines.some(
      (timeline) => timeline.type === "projectelo.timeline.forfeit",
    )
  ) {
    return { entries: [], latestSplit: null, status: "forfeited" };
  }

  const fastestByType = new Map<RelevantTimelineType, PlayerTimelineEntry>();
  for (const timeline of currentTimelines) {
    if (!isRelevantTimelineType(timeline.type)) continue;

    const existing = fastestByType.get(timeline.type);
    if (!existing || timeline.time < existing.time) {
      fastestByType.set(timeline.type, {
        type: timeline.type,
        time: timeline.time,
      });
    }
  }

  const entries = [...fastestByType.values()].sort(
    (a, b) =>
      (relevantTypeRanks.get(a.type) ?? 0) -
        (relevantTypeRanks.get(b.type) ?? 0) || a.time - b.time,
  );
  const latestEntry = entries.at(-1) ?? null;

  return {
    entries,
    latestSplit: latestEntry
      ? {
          ...latestEntry,
          rank: relevantTypeRanks.get(latestEntry.type) ?? 0,
        }
      : null,
    status: "active",
  };
}

export function rankPlayersByTimeline<T extends { uuid: string }>(
  players: T[],
  timelines: SpectateMatch["timelines"],
  limit = 5,
): T[] {
  return players
    .map((player, index) => ({
      index,
      player,
      timeline: buildPlayerTimelineSummary(player.uuid, timelines),
    }))
    .filter(
      ({ timeline }) => timeline.status === "active" && timeline.latestSplit,
    )
    .sort((a, b) => {
      const aSplit = a.timeline.latestSplit;
      const bSplit = b.timeline.latestSplit;
      if (!aSplit || !bSplit) return a.index - b.index;

      return (
        bSplit.rank - aSplit.rank ||
        aSplit.time - bSplit.time ||
        a.index - b.index
      );
    })
    .slice(0, limit)
    .map(({ player }) => player);
}
