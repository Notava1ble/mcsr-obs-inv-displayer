import type { CraftableItem } from "./items";
import type { PlayerTimelineSummary } from "./timeline";

export interface SpectateMatch {
  matchType: string;
  category: string;
  gameMode: string;
  startTime: number;
  players: Array<{
    uuid: string;
    nickname: string;
    roleType: number;
    eloRate?: number;
    eloRank?: number;
    country?: string;
  }>;
  completes: Array<{
    player: string;
    time: number;
  }>;
  inventories: Record<string, Record<string, number>>;
  counts: never[];
  timelines: Array<{
    uuid: string;
    type: string;
    time: number;
    data: string[];
    shown: boolean;
  }>;
}

export type TrackedItem =
  | "obsidian"
  | "glowstone_dust"
  | "respawn_anchor"
  | "potion"
  | "splash_potion"
  | "wools"
  | "glowstone"
  | "blaze_powder"
  | "ender_eye"
  | "crying_obsidian"
  | "string"
  | "blaze_rod"
  | "beds"
  | "ender_pearl"
  | "piglinBarters"
  | "blazeKills";

export type PlayerInventorySummary = {
  uuid: string;
  nickname: string;
  avatarUrl: string;
  items: Record<TrackedItem, number>;
  craftableItems: CraftableItem[];
  timeline: PlayerTimelineSummary;
};

export type DashboardSnapshot = {
  kind: "initial" | "update";
  file: string;
  matchType: string;
  category: string;
  gameMode: string;
  startTime: number;
  players: PlayerInventorySummary[];
  overlayPlayers: PlayerInventorySummary[];
  champMode?: boolean;
};

export type ErrorSnapshot = {
  kind: "error";
  file: string;
  text: string;
};
