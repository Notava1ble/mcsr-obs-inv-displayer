const DEFAULT_URL = "ws://localhost:1234";
const RECONNECT_DELAY = 2000;

let websocket = null;
let reconnectTimer = null;

const playersElement = document.getElementById("players");
const emptyState = document.getElementById("empty-state");
const alertBox = document.getElementById("alert");

const previousCounts = new Map();

const itemImages = {
  anchors: "anchor",
  beds: "bed",
  eyes: "eye",
  obsidian: "obsidian",
  pearls: "pearls",
  potions: "potion",
};

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

function animateIncrease(element, key, value) {
  const previousValue = previousCounts.get(key);
  if (previousValue !== undefined && value > previousValue) {
    element.classList.add("pulse-up");
    element.addEventListener(
      "animationend",
      () => element.classList.remove("pulse-up"),
      { once: true },
    );
  }
  previousCounts.set(key, value);
}

function playerCraftableItems(player) {
  if (Array.isArray(player.craftableItems)) return player.craftableItems;
  throw new Error("Overlay and server are out of sync. Restart the Bun server.");
}

function renderItem(item, playerUuid, isChampMode) {
  const classNames = isChampMode
    ? { slot: "champ-item-slot", image: "champ-item-image", count: "champ-item-count" }
    : { slot: "item-stat", image: "item-image", count: "count" };
  const stat = createElement("div", classNames.slot);
  const image = createElement("img", classNames.image);
  image.src = `./public/assets/${itemImages[item.key]}.png`;
  image.alt = item.label;

  stat.dataset.zero = String(item.count === 0);
  stat.title = item.label;

  const countSpan = createElement("span", classNames.count, String(item.count));
  stat.append(image, countSpan);
  animateIncrease(stat, `${playerUuid}_${item.key}`, item.count);

  return stat;
}

function renderPlayer(player, index, isChampMode) {
  if (isChampMode) {
    const card = createElement("div", `player-card champ player-${index + 1}`);

    const identityRow = createElement("div", "champ-identity-row");

    const avatarContainer = createElement("div", "champ-avatar-container");
    const avatarImg = createElement("img", "champ-avatar");
    avatarImg.src = player.avatarUrl;
    avatarImg.alt = player.nickname;
    avatarContainer.append(avatarImg);

    const nameDiv = createElement("div", "champ-name", player.nickname);
    identityRow.append(avatarContainer, nameDiv);

    const itemGrid = createElement("div", "champ-item-grid");
    itemGrid.append(...playerCraftableItems(player).map((item) => renderItem(item, player.uuid, true)));

    card.append(identityRow, itemGrid);
    return card;
  }

  const card = createElement("div", "player-card");
  const playerName = createElement("div", "player-name", player.nickname);
  const itemGrid = createElement("div", "item-grid");
  itemGrid.append(...playerCraftableItems(player).map((item) => renderItem(item, player.uuid, false)));
  card.append(playerName, itemGrid);
  return card;
}

function ratio(left, right) {
  const total = left + right;
  return total ? { left: (left / total) * 100, right: (right / total) * 100 } : { left: 50, right: 50 };
}

function renderMetric(label, leftPlayer, rightPlayer, itemKey) {
  const leftValue = Number(leftPlayer.items[itemKey] ?? 0);
  const rightValue = Number(rightPlayer.items[itemKey] ?? 0);
  const row = createElement("div", "champ-metric-row");
  const stats = createElement("div", "champ-metric-stats");
  const left = createElement("div", "champ-metric-val left-val", String(leftValue));
  const right = createElement("div", "champ-metric-val right-val", String(rightValue));

  left.classList.toggle("leader", leftValue > rightValue);
  right.classList.toggle("leader", rightValue > leftValue);
  animateIncrease(left, `${leftPlayer.uuid}_${itemKey}`, leftValue);
  animateIncrease(right, `${rightPlayer.uuid}_${itemKey}`, rightValue);
  stats.append(left, createElement("div", "champ-metric-label", label), right);

  const values = ratio(leftValue, rightValue);
  const track = createElement("div", "champ-ratio-track");
  const leftFill = createElement("div", "champ-ratio-fill-left");
  const rightFill = createElement("div", "champ-ratio-fill-right");
  leftFill.style.width = `${values.left}%`;
  rightFill.style.width = `${values.right}%`;
  track.append(leftFill, rightFill);

  row.append(stats, track);
  return row;
}

function renderSnapshot(payload) {
  showAlert("");

  const overlayMain = document.querySelector(".overlay");
  const isChampMode = Boolean(payload.champMode);
  overlayMain.classList.toggle("champ-mode", isChampMode);

  let champHeader = document.getElementById("champ-header");
  if (isChampMode) {
    if (!champHeader) {
      champHeader = createElement("div", "champ-header");
      champHeader.id = "champ-header";
      overlayMain.insertBefore(champHeader, playersElement);
    }
  } else {
    if (champHeader) {
      champHeader.remove();
    }
  }

  const visiblePlayers = payload.overlayPlayers || payload.players;

  if (!visiblePlayers.length) {
    clearPlayers();
    if (champHeader) champHeader.innerHTML = "";
    emptyState.textContent = payload.players.length
      ? "No active split leaders."
      : "No players in snapshot.";
    return;
  }

  const playersToRender = isChampMode ? visiblePlayers.slice(0, 2) : visiblePlayers;

  emptyState.remove();
  playersElement.innerHTML = "";
  playersToRender.forEach((player, index) => {
    playersElement.appendChild(renderPlayer(player, index, isChampMode));
  });

  if (isChampMode && playersToRender.length) {
    const [leftPlayer, rightPlayer = { uuid: "waiting", items: {} }] = playersToRender;
    champHeader.innerHTML = "";
    champHeader.append(
      renderMetric("Gold Bartered", leftPlayer, rightPlayer, "piglinBarters"),
      renderMetric("Blazes Killed", leftPlayer, rightPlayer, "blazeKills"),
    );
  }
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bad message from server.";
    showAlert(message);
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
  websocket.onerror = () => {};
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
