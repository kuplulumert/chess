import { Chess } from "./vendor/chess.esm.js";
import mqtt from "./vendor/mqtt.esm.js";

// Moves are a few bytes a minute, so the game doesn't need a peer-to-peer
// link at all: it rides the same public MQTT brokers that are reachable from
// ordinary home and mobile networks. That sidesteps NAT traversal entirely —
// no STUN, no TURN relay, nothing to go silently missing mid-handshake.
const TOPIC_PREFIX = "kuplulumert-online-chess/v1";
const DEFAULT_BROKERS = [
  { label: "EMQX", url: "wss://broker.emqx.io:8084/mqtt" },
  { label: "HiveMQ", url: "wss://broker.hivemq.com:8884/mqtt" },
  { label: "Mosquitto", url: "wss://test.mosquitto.org:8081/mqtt" },
];

const PIECE_CODES = { p: "P", n: "N", b: "B", r: "R", q: "Q", k: "K" };
const LATENCY_STORAGE_KEY = "online-chess-show-latency";

const HELLO_INTERVAL_MS = 3000;
const PING_INTERVAL_MS = 5000;
const GUEST_TIMEOUT_MS = 90000;

const els = {
  lobby: document.getElementById("lobby"),
  createBtn: document.getElementById("create-btn"),
  sharePanel: document.getElementById("share-panel"),
  shareLink: document.getElementById("share-link"),
  copyBtn: document.getElementById("copy-btn"),
  steps: document.getElementById("steps"),
  stepWaitText: document.getElementById("step-wait-text"),
  transports: document.getElementById("transports"),
  waitClock: document.getElementById("wait-clock"),
  lobbyStatus: document.getElementById("lobby-status"),
  roomLabel: document.getElementById("room-label"),
  retryBtn: document.getElementById("retry-btn"),
  game: document.getElementById("game"),
  board: document.getElementById("board"),
  colorLabel: document.getElementById("color-label"),
  connLabel: document.getElementById("conn-label"),
  latencyToggle: document.getElementById("latency-toggle"),
  turnLabel: document.getElementById("turn-label"),
  gameStatus: document.getElementById("game-status"),
  lastMove: document.getElementById("last-move"),
  leaveBtn: document.getElementById("leave-btn"),
};

const chess = new Chess();
const clients = new Map(); // broker url -> {broker, client, stateEl, connected}
const lastSeqFrom = new Map(); // sender id -> highest seq applied
const selfId = randomId(8);

let topic = null;
let myColor = null;
let opponentId = null;
let seq = 0;
let selected = null;
let legalTargets = [];
let lastMoveSquares = null;
let squareEls = new Map();
let gameStarted = false;
let helloIntervalId = null;
let pingIntervalId = null;
let waitClockId = null;
let joinTimeoutId = null;
let pendingPing = null;

function randomId(length) {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let id = "";
  for (let i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function setStep(name, state) {
  const li = els.steps.querySelector(`[data-step="${name}"]`);
  if (!li) return;
  li.dataset.state = state;
  li.querySelector(".step-icon").textContent =
    state === "done" ? "✓" : state === "active" ? "•" : state === "failed" ? "✕" : "○";
}

function setBrokerState(url, text, kind) {
  const entry = clients.get(url);
  if (!entry) return;
  entry.stateEl.textContent = text;
  entry.stateEl.parentElement.dataset.state = kind;
}

function showRetry(message) {
  els.lobbyStatus.textContent = message;
  els.retryBtn.classList.remove("hidden");
}

function squareColorClass(square) {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1], 10) - 1;
  return (file + rank) % 2 === 0 ? "dark" : "light";
}

function orderedSquares(orientation) {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];
  const list = [];
  for (const r of ranks) {
    for (const f of files) list.push(f + r);
  }
  return orientation === "b" ? list.reverse() : list;
}

function buildBoard(orientation) {
  els.board.innerHTML = "";
  squareEls.clear();
  for (const square of orderedSquares(orientation)) {
    const div = document.createElement("div");
    div.className = `square ${squareColorClass(square)}`;
    div.dataset.square = square;
    div.addEventListener("click", () => onSquareClick(square));
    els.board.appendChild(div);
    squareEls.set(square, div);
  }
}

function render() {
  for (const [square, div] of squareEls) {
    div.classList.toggle("selected", square === selected);
    div.classList.toggle(
      "last-move",
      Boolean(lastMoveSquares) && (square === lastMoveSquares.from || square === lastMoveSquares.to),
    );
    div.innerHTML = "";
    const piece = chess.get(square);
    if (piece) {
      const img = document.createElement("img");
      img.className = "piece";
      img.src = `pieces/${piece.color}${PIECE_CODES[piece.type]}.svg`;
      img.alt = "";
      img.draggable = false;
      div.appendChild(img);
    }
    const target = legalTargets.find((m) => m.to === square);
    if (target) {
      const marker = document.createElement("div");
      marker.className = target.captured ? "capture-ring" : "move-dot";
      div.appendChild(marker);
    }
  }
  updateStatus();
}

function updateStatus() {
  els.colorLabel.textContent = myColor === "w" ? "Sen: Beyaz" : "Sen: Siyah";

  if (chess.isCheckmate()) {
    const winner = chess.turn() === "w" ? "Siyah" : "Beyaz";
    els.turnLabel.textContent = "";
    els.gameStatus.textContent = `Şah mat! ${winner} kazandı.`;
    return;
  }
  if (chess.isStalemate()) {
    els.turnLabel.textContent = "";
    els.gameStatus.textContent = "Pat! Oyun berabere.";
    return;
  }
  if (chess.isDraw()) {
    els.turnLabel.textContent = "";
    els.gameStatus.textContent = "Oyun berabere.";
    return;
  }

  els.turnLabel.textContent = chess.turn() === myColor ? "Sıra sende" : "Rakibin sırası";
  els.gameStatus.textContent = chess.isCheck() ? "Şah!" : "";
}

function clearSelection() {
  selected = null;
  legalTargets = [];
}

function connectedClients() {
  return [...clients.values()].filter((entry) => entry.connected);
}

function publish(message) {
  const payload = JSON.stringify({ ...message, id: selfId, seq: ++seq });
  for (const entry of connectedClients()) {
    try {
      entry.client.publish(topic, payload, { qos: 0 });
    } catch (err) {
      console.error(`${entry.broker.label} yayınlanamadı:`, err);
    }
  }
}

function onSquareClick(square) {
  if (!gameStarted || chess.isGameOver()) return;
  if (chess.turn() !== myColor) return;

  const piece = chess.get(square);

  if (selected) {
    if (square === selected) {
      clearSelection();
      render();
      return;
    }
    if (legalTargets.some((m) => m.to === square)) {
      makeMove(selected, square);
      return;
    }
    if (piece && piece.color === myColor) {
      selectSquare(square);
      return;
    }
    clearSelection();
    render();
    return;
  }

  if (piece && piece.color === myColor) {
    selectSquare(square);
  }
}

function selectSquare(square) {
  selected = square;
  legalTargets = chess.moves({ square, verbose: true });
  render();
}

function makeMove(from, to) {
  const piece = chess.get(from);
  const promotion =
    piece && piece.type === "p" && (to[1] === "8" || to[1] === "1") ? "q" : undefined;
  const index = chess.history().length;

  let move;
  try {
    move = chess.move({ from, to, promotion });
  } catch {
    clearSelection();
    render();
    return;
  }

  clearSelection();
  lastMoveSquares = { from, to };
  render();
  els.lastMove.textContent = `Oynadığın hamle: ${move.san}`;
  publish({ t: "move", index, from, to, promotion: promotion ?? null });
}

function applyMove({ index, from, to, promotion }) {
  if (index !== chess.history().length) return; // out of order or already applied
  let move;
  try {
    move = chess.move({ from, to, promotion: promotion ?? undefined });
  } catch (err) {
    console.error("Gelen hamle uygulanamadı:", err);
    return;
  }
  clearSelection();
  lastMoveSquares = { from, to };
  render();
  els.lastMove.textContent = `Rakibin hamlesi: ${move.san}`;
}

// A reconnecting opponent starts from an empty board, so whoever has the
// longer history replays it rather than the two drifting apart.
function applySync(moves) {
  if (!Array.isArray(moves) || moves.length <= chess.history().length) return;
  // Validated on a throwaway board first so a malformed list can't leave the
  // real one half-updated, then replayed as moves rather than loaded as a FEN:
  // the move history has to stay intact because it indexes every later move.
  const replay = new Chess();
  try {
    for (const move of moves) {
      replay.move({ from: move.from, to: move.to, promotion: move.promotion ?? undefined });
    }
  } catch (err) {
    console.error("Oyun durumu eşitlenemedi:", err);
    return;
  }
  chess.reset();
  for (const move of moves) {
    chess.move({ from: move.from, to: move.to, promotion: move.promotion ?? undefined });
  }
  const last = moves[moves.length - 1];
  lastMoveSquares = { from: last.from, to: last.to };
  clearSelection();
  render();
  els.lastMove.textContent = "Oyun rakibinle eşitlendi.";
}

function historyPayload() {
  return chess.history({ verbose: true }).map((move) => ({
    from: move.from,
    to: move.to,
    promotion: move.promotion ?? null,
  }));
}

function handleMessage(raw) {
  let message;
  try {
    message = JSON.parse(raw);
  } catch {
    return;
  }
  if (!message || message.id === selfId) return;

  // Same payload arrives once per broker; the sender's own counter drops the copies.
  const seen = lastSeqFrom.get(message.id) ?? 0;
  if (typeof message.seq === "number") {
    if (message.seq <= seen) return;
    lastSeqFrom.set(message.id, message.seq);
  }

  if (message.t === "hello") {
    if (message.side === myColor) return; // another window of my own side
    // Staying silent once paired matters: answering every hello would bounce
    // one back and forth between the two players for the rest of the game.
    if (message.id === opponentId) return;
    // A reload gives the opponent a new id, so a new one replaces the old.
    pairWith(message.id);
    publish({ t: "hello", side: myColor });
    if (chess.history().length > 0) publish({ t: "sync", moves: historyPayload() });
    return;
  }

  if (message.id !== opponentId) return;

  if (message.t === "move") applyMove(message);
  else if (message.t === "sync") applySync(message.moves);
  else if (message.t === "ping") publish({ t: "pong", ts: message.ts });
  else if (message.t === "pong" && pendingPing === message.ts) {
    updateConnLabel(Date.now() - message.ts);
    pendingPing = null;
  } else if (message.t === "bye") {
    opponentId = null;
    updateConnLabel();
    els.gameStatus.textContent = "Rakibin ayrıldı. Aynı linki tekrar açarsa devam edersiniz.";
    startHellos();
  }
}

function pairWith(id) {
  opponentId = id;
  clearTimeout(joinTimeoutId);
  clearInterval(helloIntervalId);
  helloIntervalId = null;
  startGame();
}

function startGame() {
  updateConnLabel();
  if (gameStarted) return;
  gameStarted = true;
  clearInterval(waitClockId);
  els.waitClock.textContent = "";
  setStep("wait", "done");
  setStep("ready", "done");
  els.lobby.classList.add("hidden");
  els.game.classList.remove("hidden");
  buildBoard(myColor);
  render();
  els.lastMove.textContent = "Oyun başladı. Beyaz başlar.";
  startPinging();
}

let showLatency = readLatencyPreference();
let lastLatency;

function readLatencyPreference() {
  try {
    return localStorage.getItem(LATENCY_STORAGE_KEY) !== "off";
  } catch {
    return true; // private mode and friends: the readout is simply on
  }
}

function updateConnLabel(latency) {
  if (latency !== undefined) lastLatency = latency;
  const live = connectedClients().length;
  if (!opponentId || live === 0) {
    els.connLabel.className = "conn-lost";
    els.connLabel.textContent = live === 0 ? "● sunucu bağlantısı yok" : "● rakip bekleniyor";
    return;
  }
  els.connLabel.className = "conn-ok";
  const suffix = showLatency && lastLatency !== undefined ? ` · ${lastLatency} ms` : "";
  els.connLabel.textContent = `● bağlı${suffix}`;
}

function setLatencyVisible(visible) {
  showLatency = visible;
  els.latencyToggle.textContent = visible ? "gecikmeyi gizle" : "gecikmeyi göster";
  els.latencyToggle.setAttribute("aria-pressed", String(visible));
  try {
    localStorage.setItem(LATENCY_STORAGE_KEY, visible ? "on" : "off");
  } catch {
    /* preference just won't persist */
  }
  updateConnLabel();
}

function startPinging() {
  clearInterval(pingIntervalId);
  pingIntervalId = setInterval(() => {
    if (!opponentId) {
      updateConnLabel();
      return;
    }
    pendingPing = Date.now();
    publish({ t: "ping", ts: pendingPing });
  }, PING_INTERVAL_MS);
}

function startHellos() {
  if (helloIntervalId) return;
  publish({ t: "hello", side: myColor });
  helloIntervalId = setInterval(() => {
    if (opponentId) {
      clearInterval(helloIntervalId);
      helloIntervalId = null;
      return;
    }
    publish({ t: "hello", side: myColor });
  }, HELLO_INTERVAL_MS);
}

function startWaitClock() {
  const startedAt = Date.now();
  waitClockId = setInterval(() => {
    els.waitClock.textContent = `${Math.round((Date.now() - startedAt) / 1000)} sn bekleniyor...`;
  }, 1000);
}

function brokerList() {
  const override = new URLSearchParams(location.search).get("broker");
  return override ? [{ label: "Test", url: override }] : DEFAULT_BROKERS;
}

function connect(roomId, { isHost }) {
  myColor = isHost ? "w" : "b";
  topic = `${TOPIC_PREFIX}/${roomId}`;
  els.steps.classList.remove("hidden");
  els.transports.classList.remove("hidden");
  els.stepWaitText.textContent = isHost ? "Rakip bekleniyor" : "Oyun aranıyor";
  els.roomLabel.textContent = `Oda kodu: ${roomId}`;
  setStep("net", "active");
  setStep("wait", "active");

  for (const broker of brokerList()) {
    const li = document.createElement("li");
    li.dataset.state = "pending";
    const name = document.createElement("span");
    name.textContent = broker.label;
    const state = document.createElement("span");
    state.className = "t-state";
    state.textContent = "bağlanıyor...";
    li.append(name, state);
    els.transports.appendChild(li);

    let client;
    try {
      client = mqtt.connect(broker.url, {
        clientId: `${selfId}-${randomId(4)}`,
        clean: true,
        connectTimeout: 10000,
        reconnectPeriod: 5000,
        keepalive: 30,
      });
    } catch (err) {
      console.error(`${broker.label} başlatılamadı:`, err);
      state.textContent = "başlatılamadı";
      li.dataset.state = "fail";
      continue;
    }

    const entry = { broker, client, stateEl: state, connected: false };
    clients.set(broker.url, entry);

    client.on("connect", () => {
      entry.connected = true;
      setBrokerState(broker.url, "bağlı", "ok");
      setStep("net", "done");
      client.subscribe(topic, { qos: 0 }, (err) => {
        if (err) {
          console.error(`${broker.label} konuya abone olunamadı:`, err);
          setBrokerState(broker.url, "abone olunamadı", "fail");
          return;
        }
        startHellos();
      });
      updateConnLabel();
    });

    client.on("message", (_topic, payload) => handleMessage(payload.toString()));

    client.on("error", (err) => {
      console.error(`${broker.label} hatası:`, err.message ?? err);
      setBrokerState(broker.url, "ulaşılamıyor", "fail");
    });

    client.on("close", () => {
      if (!entry.connected) return;
      entry.connected = false;
      setBrokerState(broker.url, "bağlantı koptu", "fail");
      updateConnLabel();
    });
  }

  startWaitClock();
  els.lobbyStatus.textContent = isHost
    ? "Link hazır. Arkadaşın linke tıkladığı anda oyun başlayacak."
    : "Oyunu açan arkadaşın aranıyor...";

  setTimeout(() => {
    if (connectedClients().length === 0) {
      setStep("net", "failed");
      showRetry("Hiçbir sunucuya bağlanılamadı. Farklı bir ağ (örneğin mobil veri) dene.");
    }
  }, 20000);

  if (!isHost) {
    joinTimeoutId = setTimeout(() => {
      if (opponentId) return;
      clearInterval(waitClockId);
      setStep("wait", "failed");
      showRetry("Rakip bulunamadı. Arkadaşının sayfayı açık tuttuğundan emin ol, sonra tekrar dene.");
    }, GUEST_TIMEOUT_MS);
  }
}

els.createBtn.addEventListener("click", () => {
  const roomId = randomId(6);
  els.createBtn.classList.add("hidden");
  const url = new URL(location.href);
  url.searchParams.set("room", roomId);
  els.shareLink.value = url.toString();
  els.sharePanel.classList.remove("hidden");
  connect(roomId, { isHost: true });
});

els.copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(els.shareLink.value);
    els.copyBtn.textContent = "Kopyalandı!";
    setTimeout(() => (els.copyBtn.textContent = "Kopyala"), 1500);
  } catch {
    els.shareLink.select();
  }
});

els.retryBtn.addEventListener("click", () => location.reload());

els.latencyToggle.addEventListener("click", () => setLatencyVisible(!showLatency));
setLatencyVisible(showLatency);

els.leaveBtn.addEventListener("click", () => {
  if (topic) publish({ t: "bye" });
  for (const entry of clients.values()) entry.client.end(true);
  const url = new URL(location.href);
  url.searchParams.delete("room");
  location.href = url.toString();
});

window.addEventListener("beforeunload", () => {
  if (topic && opponentId) publish({ t: "bye" });
});

const roomParam = new URLSearchParams(location.search).get("room");
if (roomParam) {
  els.createBtn.classList.add("hidden");
  connect(roomParam, { isHost: false });
}
