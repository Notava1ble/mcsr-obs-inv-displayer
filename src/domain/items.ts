import type { TrackedItem } from "./types";

export const trackedItems = [
  "obsidian",
  "glowstone_dust",
  "respawn_anchor",
  "potion",
  "splash_potion",
  "wools",
  "glowstone",
  "blaze_powder",
  "ender_eye",
  "crying_obsidian",
  "string",
  "blaze_rod",
  "beds",
  "ender_pearl",
  "piglinBarters",
  "blazeKills",
] as const satisfies readonly TrackedItem[];

export type CraftableItem = {
  key: string;
  label: string;
  count: number;
};

export type InventoryCounts = Partial<Record<TrackedItem | string, unknown>>;

function inventoryCount(items: InventoryCounts, key: string): number {
  const count = Number(items[key] ?? 0);
  return Number.isFinite(count) ? count : 0;
}

export function buildCraftableItems(items: InventoryCounts): CraftableItem[] {
  const count = (key: string) => inventoryCount(items, key);
  const glowstone = count("glowstone") + Math.floor(count("glowstone_dust") / 4);
  const anchors =
    count("respawn_anchor") +
    Math.min(
      Math.floor(glowstone / 3),
      Math.floor(count("crying_obsidian") / 6),
    );
  const wool = count("wools") + Math.floor(count("string") / 4);
  const beds = count("beds") + Math.floor(wool / 3);
  const powder = count("blaze_powder") + count("blaze_rod") * 2;
  const eyes = count("ender_eye") + Math.min(powder, count("ender_pearl"));

  return [
    { key: "anchors", label: "Anchors", count: anchors },
    { key: "beds", label: "Beds", count: beds },
    { key: "eyes", label: "Eyes", count: eyes },
    { key: "obsidian", label: "Obsidian", count: count("obsidian") },
    { key: "pearls", label: "Pearls", count: count("ender_pearl") },
    {
      key: "potions",
      label: "Potions",
      count: count("potion") + count("splash_potion"),
    },
  ];
}

export function sumCraftableItems(items: InventoryCounts): number {
  return buildCraftableItems(items).reduce((total, item) => total + item.count, 0);
}
