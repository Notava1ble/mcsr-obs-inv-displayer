import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { watchFileChanges, type StopWatching } from "../../src/server/fileWatcher";

let tempDir: string | null = null;
let stopWatching: StopWatching | null = null;

afterEach(async () => {
  stopWatching?.();
  stopWatching = null;

  if (!tempDir) return;

  await rm(tempDir, { recursive: true, force: true });
  tempDir = null;
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForChange(calls: number[]) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (calls.length > 0) return;
    await sleep(25);
  }
}

describe("watchFileChanges", () => {
  test("calls the change handler after a watched file changes", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "obs-inv-watch-"));
    const file = join(tempDir, "input.txt");
    const calls: number[] = [];

    await Bun.write(file, "first");
    stopWatching = watchFileChanges(file, () => calls.push(Date.now()), 5);

    await sleep(100);
    await Bun.write(file, "second");
    await waitForChange(calls);

    expect(calls.length).toBeGreaterThan(0);
  });
});
