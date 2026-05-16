import type { ServerWebSocket } from "bun";
import type { DashboardSnapshot, ErrorSnapshot } from "../domain/types";

export type OutgoingMessage = DashboardSnapshot | ErrorSnapshot;
export type DashboardClient = ServerWebSocket<unknown>;

export function broadcastToClients(
  clients: Iterable<DashboardClient>,
  message: OutgoingMessage,
): number {
  const serialized = JSON.stringify(message);
  let sent = 0;

  for (const client of clients) {
    client.send(serialized);
    sent += 1;
  }

  return sent;
}
