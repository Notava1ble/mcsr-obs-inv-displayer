import { describe, expect, test } from "bun:test";
import { broadcastToClients, type DashboardClient } from "../../src/server/broadcast";
import type { ErrorSnapshot } from "../../src/domain/types";

function fakeClient(messages: string[]): DashboardClient {
  return {
    send(message: string) {
      messages.push(message);
    },
  } as DashboardClient;
}

describe("broadcastToClients", () => {
  test("serializes a payload once per connected client", () => {
    const messages: string[] = [];
    const payload: ErrorSnapshot = {
      kind: "error",
      file: "input.txt",
      text: "Initial load failed: bad json",
    };

    const sent = broadcastToClients(
      [fakeClient(messages), fakeClient(messages)],
      payload,
    );

    expect(sent).toBe(2);
    expect(messages).toEqual([JSON.stringify(payload), JSON.stringify(payload)]);
  });

  test("returns zero when there are no connected clients", () => {
    expect(
      broadcastToClients([], {
        kind: "error",
        file: "input.txt",
        text: "No clients",
      }),
    ).toBe(0);
  });
});
