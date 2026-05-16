import { describe, expect, test } from "bun:test";
import { buildErrorSnapshot, parseDashboardSnapshot } from "../../src/server/fileSnapshot";

describe("parseDashboardSnapshot", () => {
  test("builds a dashboard snapshot from raw spectate JSON", () => {
    const snapshot = parseDashboardSnapshot(
      JSON.stringify({
        matchType: "ranked",
        category: "any%",
        gameMode: "normal",
        startTime: 100,
        players: [{ uuid: "player-1", nickname: "Player", roleType: 0 }],
        completes: [],
        inventories: { "player-1": { beds: 1 } },
        counts: [],
        timelines: [],
      }),
      "initial",
      "input.txt",
    );

    expect(snapshot.kind).toBe("initial");
    expect(snapshot.players[0]?.items.beds).toBe(1);
  });
});

describe("buildErrorSnapshot", () => {
  test("formats initial and update read failures for clients", () => {
    expect(buildErrorSnapshot(new Error("bad json"), "update", "input.txt")).toEqual({
      kind: "error",
      text: "File change failed: bad json",
      file: "input.txt",
    });
  });
});
