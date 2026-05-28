import { buildSnapshot } from "../domain/snapshot";
import type { DashboardSnapshot, ErrorSnapshot, SpectateMatch } from "../domain/types";

export async function loadDashboardSnapshot(
  file: string,
  kind: DashboardSnapshot["kind"],
  overlayPlayerLimit = 5,
): Promise<DashboardSnapshot> {
  const content = await Bun.file(file).text();
  const match = JSON.parse(content) as SpectateMatch;

  return buildSnapshot(match, kind, file, overlayPlayerLimit);
}

export function buildErrorSnapshot(
  error: unknown,
  kind: DashboardSnapshot["kind"],
  file: string,
): ErrorSnapshot {
  const message = error instanceof Error ? error.message : String(error);
  const label = kind === "initial" ? "Initial load" : "File change";

  return {
    kind: "error",
    text: `${label} failed: ${message}`,
    file,
  };
}

export function isIgnorableSnapshotError(
  error: unknown,
  kind: DashboardSnapshot["kind"],
): boolean {
  return kind === "update" && error instanceof SyntaxError;
}
