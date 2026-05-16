import { describe, expect, test } from "bun:test";
import { buildCraftableItems, sumCraftableItems } from "../../src/domain/items";

describe("buildCraftableItems", () => {
  test("combines raw inventory counts into overlay craftable totals", () => {
    const items = buildCraftableItems({
      glowstone_dust: 12,
      crying_obsidian: 12,
      string: 8,
      blaze_rod: 2,
      ender_pearl: 5,
      potion: 1,
    });

    expect(items).toEqual([
      { key: "anchors", label: "Anchors", count: 1 },
      { key: "beds", label: "Beds", count: 0 },
      { key: "eyes", label: "Eyes", count: 4 },
      { key: "pearls", label: "Pearls", count: 5 },
      { key: "potions", label: "Potions", count: 1 },
    ]);
  });
});

describe("sumCraftableItems", () => {
  test("adds the displayed craftable counts", () => {
    expect(sumCraftableItems({ beds: 2, wools: 3, string: 4 })).toBe(3);
  });
});
