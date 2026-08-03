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
      obsidian: 7,
      splash_potion: 2,
    });

    expect(items).toEqual([
      { key: "anchors", label: "Anchors", count: 0 },
      { key: "beds", label: "Beds", count: 0 },
      { key: "eyes", label: "Eyes", count: 4 },
      { key: "obsidian", label: "Obsidian", count: 7 },
      { key: "pearls", label: "Pearls", count: 5 },
      { key: "potions", label: "Potions", count: 3 },
    ]);
  });

  test("treats missing and malformed inventory values as zero", () => {
    const items = buildCraftableItems({
      glowstone: Number.NaN,
      glowstone_dust: "many",
      crying_obsidian: undefined,
      potion: 1,
      splash_potion: Number.POSITIVE_INFINITY,
    });

    expect(items).toEqual([
      { key: "anchors", label: "Anchors", count: 0 },
      { key: "beds", label: "Beds", count: 0 },
      { key: "eyes", label: "Eyes", count: 0 },
      { key: "obsidian", label: "Obsidian", count: 0 },
      { key: "pearls", label: "Pearls", count: 0 },
      { key: "potions", label: "Potions", count: 1 },
    ]);
  });

  describe("anchors edge cases", () => {
    test("counts only new anchors when starting from zero crafted anchors", () => {
      const items = buildCraftableItems({
        glowstone_dust: 64, // 64 / 4 = 16 glowstone
        crying_obsidian: 25,
      });
      const anchors = items.find((i) => i.key === "anchors");
      expect(anchors?.count).toBe(4);
    });

    test("caps at available glowstone when there is not enough to charge all crafted anchors", () => {
      const items = buildCraftableItems({
        respawn_anchor: 5,
        glowstone: 2,
      });
      const anchors = items.find((i) => i.key === "anchors");
      expect(anchors?.count).toBe(2);
    });

    test("counts all crafted anchors when glowstone exactly matches", () => {
      const items = buildCraftableItems({
        respawn_anchor: 4,
        glowstone: 4,
      });
      const anchors = items.find((i) => i.key === "anchors");
      expect(anchors?.count).toBe(4);
    });

    test("charges all existing anchors and crafts additional ones from leftover resources", () => {
      const items = buildCraftableItems({
        respawn_anchor: 2,
        glowstone: 20,
        crying_obsidian: 60,
      });
      const anchors = items.find((i) => i.key === "anchors");
      expect(anchors?.count).toBe(6);
    });

    test("is bottlenecked by crying obsidian even with abundant glowstone", () => {
      const items = buildCraftableItems({
        respawn_anchor: 1,
        glowstone: 40,
        crying_obsidian: 6,
      });
      const anchors = items.find((i) => i.key === "anchors");
      expect(anchors?.count).toBe(2);
    });

    test("is bottlenecked by glowstone even with abundant crying obsidian", () => {
      const items = buildCraftableItems({
        respawn_anchor: 1,
        glowstone: 5,
        crying_obsidian: 60,
      });
      const anchors = items.find((i) => i.key === "anchors");
      expect(anchors?.count).toBe(2);
    });

    test("rounds down leftover glowstone that doesn't fill a full new anchor", () => {
      const items = buildCraftableItems({
        respawn_anchor: 0,
        glowstone: 7,
        crying_obsidian: 12,
      });
      const anchors = items.find((i) => i.key === "anchors");
      expect(anchors?.count).toBe(1);
    });

    test("returns zero anchors with no glowstone and no crafted anchors", () => {
      const items = buildCraftableItems({
        crying_obsidian: 60,
      });
      const anchors = items.find((i) => i.key === "anchors");
      expect(anchors?.count).toBe(0);
    });

    test("returns zero anchors with no crying obsidian even if glowstone is abundant", () => {
      const items = buildCraftableItems({
        glowstone: 40,
      });
      const anchors = items.find((i) => i.key === "anchors");
      expect(anchors?.count).toBe(0);
    });

    test("never goes negative when crafted anchors vastly exceed glowstone", () => {
      const items = buildCraftableItems({
        respawn_anchor: 100,
        glowstone: 1,
      });
      const anchors = items.find((i) => i.key === "anchors");
      expect(anchors?.count).toBe(1);
      expect(anchors!.count).toBeGreaterThanOrEqual(0);
    });

    test("combines glowstone from raw glowstone and glowstone_dust", () => {
      const items = buildCraftableItems({
        glowstone: 1,
        glowstone_dust: 12,
        crying_obsidian: 6,
      });
      const anchors = items.find((i) => i.key === "anchors");
      expect(anchors?.count).toBe(1);
    });

    test("ignores malformed respawn_anchor value by treating it as zero", () => {
      const items = buildCraftableItems({
        respawn_anchor: "lots",
        glowstone: 8,
        crying_obsidian: 6,
      });
      const anchors = items.find((i) => i.key === "anchors");
      expect(anchors?.count).toBe(1);
    });
  });

  describe("other overlay calculations", () => {
    test("caps eyes by the smaller of blaze powder and ender pearls", () => {
      const items = buildCraftableItems({
        ender_eye: 2,
        blaze_powder: 3,
        blaze_rod: 1,
        ender_pearl: 4,
      });
      const eyes = items.find((i) => i.key === "eyes");
      expect(eyes?.count).toBe(6);
    });

    test("derives beds from wool crafted out of leftover string", () => {
      const items = buildCraftableItems({
        beds: 1,
        wools: 1,
        string: 11,
      });
      const beds = items.find((i) => i.key === "beds");
      expect(beds?.count).toBe(2);
    });

    test("sums potion and splash_potion counts", () => {
      const items = buildCraftableItems({
        potion: 2,
        splash_potion: 3,
      });
      const potions = items.find((i) => i.key === "potions");
      expect(potions?.count).toBe(5);
    });
  });
});

describe("sumCraftableItems", () => {
  test("sums all craftable item counts together", () => {
    const total = sumCraftableItems({
      obsidian: 7,
      ender_pearl: 5,
      potion: 1,
      splash_potion: 2,
      respawn_anchor: 2,
      glowstone: 20,
      crying_obsidian: 60,
    });
    expect(total).toBe(7 + 5 + 3 + 6 + 0 + 0);
  });

  test("returns 0 for an entirely empty inventory", () => {
    expect(sumCraftableItems({})).toBe(0);
  });
});

describe("sumCraftableItems", () => {
  test("adds the displayed craftable counts", () => {
    expect(sumCraftableItems({ beds: 2, wools: 3, string: 4 })).toBe(3);
  });
});
