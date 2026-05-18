import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildErrorSnapshot, loadDashboardSnapshot } from "../../src/server/fileSnapshot";

let tempDir: string | null = null;

afterEach(async () => {
  if (!tempDir) return;

  await rm(tempDir, { recursive: true, force: true });
  tempDir = null;
});

async function writeTempMatch(content: unknown) {
  tempDir = await mkdtemp(join(tmpdir(), "obs-inv-"));
  const file = join(tempDir, "match.json");
  await Bun.write(file, JSON.stringify(content));
  return file;
}

describe("loadDashboardSnapshot", () => {
  test("builds a dashboard snapshot from a spectate JSON file", async () => {
    const file = await writeTempMatch({
        matchType: "ranked",
        category: "any%",
        gameMode: "normal",
        startTime: 100,
        players: [{ uuid: "player-1", nickname: "Player", roleType: 0 }],
        completes: [],
        inventories: { "player-1": { beds: 1 } },
        counts: [],
        timelines: [],
      });
    const snapshot = await loadDashboardSnapshot(file, "initial");

    expect(snapshot.kind).toBe("initial");
    expect(snapshot.file).toBe(file);
    expect(snapshot.players[0]?.items.beds).toBe(1);
  });
});

describe("buildErrorSnapshot", () => {
  test("formats update read failures for clients", () => {
    expect(buildErrorSnapshot(new Error("bad json"), "update", "input.txt")).toEqual({
      kind: "error",
      text: "File change failed: bad json",
      file: "input.txt",
    });
  });

  test("formats initial non-error failures for clients", () => {
    expect(buildErrorSnapshot("missing file", "initial", "input.txt")).toEqual({
      kind: "error",
      text: "Initial load failed: missing file",
      file: "input.txt",
    });
  });
});
