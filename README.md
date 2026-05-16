# obs_inv

Inventory overlay WebSocket server and browser overlay for spectate match data.

## Setup

```bash
bun install
```

## Commands

```bash
bun run start
bun run test
bun run typecheck
bun run timeline
```

## Project Layout

- `index.ts` starts the dashboard server.
- `src/domain` contains pure snapshot, inventory, timeline, and shared type logic.
- `src/server` contains WebSocket, file watching, config, and file parsing code.
- `src/scripts` contains one-off developer scripts.
- `tests` mirrors the source folders with focused Bun tests.
- `public` contains browser overlay assets used by `index.html`.

Set `INPUT_FILE`, `PORT`, `WS_PORT`, or `OVERLAY_PLAYER_LIMIT` to override the default input path, WebSocket port, and number of players shown in the overlay.
