export type DashboardConfig = {
  inputFile: string;
  overlayPlayerLimit: number;
  websocketPort: number;
};

type DashboardEnv = Record<string, string | undefined>;

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getDashboardConfig(env: DashboardEnv = process.env): DashboardConfig {
  const websocketPort = positiveInteger(
    env.PORT,
    positiveInteger(env.WS_PORT, 4455),
  );

  return {
    inputFile: env.INPUT_FILE ?? "./input.txt",
    overlayPlayerLimit: positiveInteger(env.OVERLAY_PLAYER_LIMIT, 5),
    websocketPort,
  };
}
