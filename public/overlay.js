const DEFAULT_URL = "ws://localhost:4455";
const RECONNECT_DELAY = 2000;

let websocket = null;
let reconnectTimer = null;

const playersElement = document.getElementById("players");
const emptyState = document.getElementById("empty-state");
const alertBox = document.getElementById("alert");

function buildCraftableItems(rawItems) {
  const count = (key) => Number(rawItems?.[key] ?? 0);
  const glowstone = count("glowstone") + Math.floor(count("glowstone_dust") / 4);
  const anchors =
    count("respawn_anchor") +
    Math.min(
      Math.floor(glowstone / 3),
      Math.floor(count("crying_obsidian") / 6),
    );
  const wool = count("wools") + Math.floor(count("string") / 4);
  const beds = count("beds") + Math.floor(wool / 3);
  const powder = count("blaze_powder") + count("blaze_rod") * 2;
  const eyes = count("ender_eye") + Math.min(powder, count("ender_pearl"));

  return [
    { key: "anchors", label: "Anchors", count: anchors },
    { key: "beds", label: "Beds", count: beds },
    { key: "eyes", label: "Eyes", count: eyes },
    { key: "obsidian", label: "Obsidian", count: count("obsidian") },
    { key: "pearls", label: "Pearls", count: count("ender_pearl") },
    {
      key: "potions",
      label: "Potions",
      count: count("potion") + count("splash_potion"),
    },
  ];
}

function sumCraftableItems(rawItems) {
  return buildCraftableItems(rawItems).reduce((sum, item) => sum + item.count, 0);
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function showAlert(message) {
  alertBox.textContent = message || "";
  alertBox.classList.toggle("visible", Boolean(message));
}

function clearPlayers() {
  playersElement.innerHTML = "";
  playersElement.appendChild(emptyState);
}

function renderItem(item) {
  const stat = createElement("div", "item-stat");
  stat.dataset.zero = String(item.count === 0);
  stat.append(
    createElement("span", "label", item.label),
    createElement("span", "count", String(item.count)),
  );

  return stat;
}

function renderPlayer(player) {
  const craftableItems = buildCraftableItems(player.items);
  const card = createElement("div", "player-card");
  const playerName = createElement("div", "player-name", player.nickname);
  const inventoryRow = createElement("div", "inventory-row");
  const itemGrid = createElement("div", "item-grid");

  itemGrid.append(...craftableItems.map(renderItem));
  inventoryRow.append(itemGrid);
  card.append(playerName, inventoryRow);

  return card;
}

function renderSnapshot(payload) {
  showAlert("");
  clearPlayers();

  const visiblePlayers = payload.overlayPlayers || payload.players;

  if (!visiblePlayers.length) {
    emptyState.textContent = payload.players.length
      ? "No active split leaders."
      : "No players in snapshot.";
    return;
  }

  emptyState.remove();
  visiblePlayers.forEach((player) => {
    playersElement.appendChild(renderPlayer(player));
  });
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(connect, RECONNECT_DELAY);
}

function getWebsocketUrl() {
  return new URLSearchParams(location.search).get("ws")?.trim() || DEFAULT_URL;
}

function handleMessage(event) {
  try {
    const payload = JSON.parse(event.data);

    if (payload.kind === "error") {
      showAlert(payload.text || "Server error");
      return;
    }

    if (payload.kind === "initial" || payload.kind === "update") {
      renderSnapshot(payload);
    }
  } catch {
    showAlert("Bad message from server.");
  }
}

function connect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (websocket) {
    websocket.close();
    websocket = null;
  }

  try {
    websocket = new WebSocket(getWebsocketUrl());
  } catch (error) {
    showAlert(error.message || String(error));
    scheduleReconnect();
    return;
  }

  websocket.onopen = () => showAlert("");
  websocket.onerror = () => showAlert("WebSocket error.");
  websocket.onmessage = handleMessage;
  websocket.onclose = (event) => {
    if (event.target !== websocket) return;

    websocket = null;
    scheduleReconnect();
  };
}

window.addEventListener("beforeunload", () => {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (websocket) websocket.close();
});

clearPlayers();
connect();
