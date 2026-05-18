import { describe, expect, test } from "bun:test";
import { getDashboardConfig } from "../../src/server/config";

describe("getDashboardConfig", () => {
  test("uses explicit input and websocket port values from the environment", () => {
    expect(
      getDashboardConfig({
        INPUT_FILE: "match.json",
        WS_PORT: "5000",
        OVERLAY_PLAYER_LIMIT: "3",
      }),
    ).toEqual({
      inputFile: "match.json",
      overlayPlayerLimit: 3,
      websocketPort: 5000,
    });
  });

  test("falls back to PORT before the default websocket port", () => {
    expect(getDashboardConfig({ PORT: "3333" }).websocketPort).toBe(3333);
  });

  test("shows five overlay players by default", () => {
    expect(getDashboardConfig({}).overlayPlayerLimit).toBe(5);
  });

  test("falls back to defaults when numeric environment values are invalid", () => {
    expect(
      getDashboardConfig({
        PORT: "not-a-port",
        WS_PORT: "also-bad",
        OVERLAY_PLAYER_LIMIT: "0",
      }),
    ).toEqual({
      inputFile: "./input.txt",
      overlayPlayerLimit: 5,
      websocketPort: 4455,
    });
  });

  test("uses WS_PORT when PORT is present but invalid", () => {
    expect(getDashboardConfig({ PORT: "nope", WS_PORT: "5001" }).websocketPort).toBe(
      5001,
    );
  });
});
