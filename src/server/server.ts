import type { ServerWebSocket } from "bun";
import { broadcastToClients, type OutgoingMessage } from "./broadcast";
import { getDashboardConfig, type DashboardConfig } from "./config";
import { buildErrorSnapshot, loadDashboardSnapshot } from "./fileSnapshot";
import { watchFileChanges } from "./fileWatcher";
import type { DashboardSnapshot } from "../domain/types";

type DashboardServerOptions = Partial<DashboardConfig>;

export function startDashboardServer(options: DashboardServerOptions = {}) {
  const config = { ...getDashboardConfig(), ...options };
  const clients = new Set<ServerWebSocket<unknown>>();

  const broadcast = (message: OutgoingMessage) => {
    const sent = broadcastToClients(clients, message);
    console.log(`Broadcast ${message.kind} to ${sent} client(s)`);
  };

  const processFile = async (kind: DashboardSnapshot["kind"]) => {
    try {
      broadcast(
        await loadDashboardSnapshot(
          config.inputFile,
          kind,
          config.overlayPlayerLimit,
        ),
      );
    } catch (error) {
      const payload = buildErrorSnapshot(error, kind, config.inputFile);
      console.error(payload.text);
      broadcast(payload);
    }
  };

  const server = Bun.serve({
    port: config.websocketPort,
    fetch(req, bunServer) {
      if (bunServer.upgrade(req)) return;
      return new Response("WebSocket server", { status: 200 });
    },
    websocket: {
      open(ws) {
        clients.add(ws);
        console.log(`Client connected (${clients.size} total)`);
        processFile("initial").catch(console.error);
      },
      close(ws) {
        clients.delete(ws);
        console.log(`Client disconnected (${clients.size} remaining)`);
      },
      message() {},
    },
  });

  const stopWatching = watchFileChanges(config.inputFile, () => {
    processFile("update").catch(console.error);
  });

  console.log(`WebSocket server listening on ws://localhost:${config.websocketPort}`);
  console.log(`Watching ${config.inputFile}...`);
  processFile("initial").catch(console.error);

  return {
    server,
    stop() {
      stopWatching();
      server.stop();
    },
  };
}
