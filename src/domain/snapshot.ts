import { buildPlayerTimelineSummary, rankPlayersByTimeline } from "./timeline";
import { buildCraftableItems, trackedItems } from "./items";
import type {
  DashboardSnapshot,
  PlayerInventorySummary,
  SpectateMatch,
  TrackedItem,
} from "./types";

function buildPlayerSummary(
  player: SpectateMatch["players"][number],
  content: SpectateMatch,
): PlayerInventorySummary {
  const uuid = player.uuid;
  const inventory = content.inventories[uuid] ?? {};
  const items = Object.fromEntries(
    trackedItems.map((item) => [item, inventory[item] ?? 0]),
  ) as Record<TrackedItem, number>;

  return {
    uuid,
    nickname: player.nickname ?? "Unknown",
    avatarUrl: `https://mc-heads.net/avatar/${uuid}`,
    items,
    craftableItems: buildCraftableItems(items),
    timeline: buildPlayerTimelineSummary(uuid, content.timelines),
  };
}

export function buildSnapshot(
  content: SpectateMatch,
  kind: DashboardSnapshot["kind"],
  file: string,
  overlayPlayerLimit = 5,
): DashboardSnapshot {
  const players = content.players.map((player) =>
    buildPlayerSummary(player, content),
  );
  const rankedPlayers = rankPlayersByTimeline(
    players,
    content.timelines,
    overlayPlayerLimit,
  );

  return {
    kind,
    file,
    matchType: content.matchType,
    category: content.category,
    gameMode: content.gameMode,
    startTime: content.startTime,
    players,
    overlayPlayers: rankedPlayers,
  };
}
