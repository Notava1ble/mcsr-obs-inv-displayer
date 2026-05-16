import { buildSnapshot } from "../domain/snapshot";
import type { DashboardSnapshot, ErrorSnapshot, SpectateMatch } from "../domain/types";

export function parseDashboardSnapshot(
  content: string,
  kind: DashboardSnapshot["kind"],
  file: string,
  overlayPlayerLimit = 5,
): DashboardSnapshot {
  return buildSnapshot(
    JSON.parse(content) as SpectateMatch,
    kind,
    file,
    overlayPlayerLimit,
  );
}

export async function loadDashboardSnapshot(
  file: string,
  kind: DashboardSnapshot["kind"],
  overlayPlayerLimit = 5,
): Promise<DashboardSnapshot> {
  const content = await Bun.file(file).text();

  return parseDashboardSnapshot(content, kind, file, overlayPlayerLimit);
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
