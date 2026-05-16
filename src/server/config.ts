export type DashboardConfig = {
  inputFile: string;
  overlayPlayerLimit: number;
  websocketPort: number;
};

type DashboardEnv = Record<string, string | undefined>;

export function getDashboardConfig(env: DashboardEnv = process.env): DashboardConfig {
  return {
    inputFile: env.INPUT_FILE ?? "./input.txt",
    overlayPlayerLimit: Number(env.OVERLAY_PLAYER_LIMIT ?? 5),
    websocketPort: Number(env.PORT ?? env.WS_PORT ?? 4455),
  };
}
