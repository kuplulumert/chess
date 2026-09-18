import { Chess } from "./vendor/chess.esm.js";
import {
  joinNostr,
  socketsNostr,
  joinMqtt,
  socketsMqtt,
  joinTorrent,
  socketsTorrent,
} from "./vendor/trystero-multi.mjs";

const APP_ID = "kuplulumert-online-chess";
const WHITE_GLYPHS = { p: "♙", n: "♘", b: "♗", r: "♖", q: "♕", k: "♔" };
const BLACK_GLYPHS = { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚" };

// Peer discovery runs over every one of these at once: ISPs block these
// networks inconsistently, so a player only needs one of the three to be
// reachable. Whichever pairs the two players first carries the game.
const TRANSPORTS = [
  { key: "mqtt", label: "MQTT", join: joinMqtt, getSockets: socketsMqtt },
  { key: "nostr", label: "Nostr", join: joinNostr, getSockets: socketsNostr },
  { key: "torrent", label: "Torrent", join: joinTorrent, getSockets: socketsTorrent },
];

// The WebRTC link itself still needs a relay whenever both players sit behind
// carrier-grade NAT, which is the norm on mobile data.
const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

const GUEST_TIMEOUT_MS = 90000;
const PING_INTERVAL_MS = 4000;
const RELAY_POLL_MS = 1000;
const RELAY_GIVEUP_MS = 25000;

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
  turnLabel: document.getElementById("turn-label"),
  gameStatus: document.getElementById("game-status"),
  lastMove: document.getElementById("last-move"),
  leaveBtn: document.getElementById("leave-btn"),
};

const chess = new Chess();
const links = new Map(); // transport key -> {transport, room, action, peerId, stateEl}
let myColor = null;
let selected = null;
let legalTargets = [];
let lastMoveSquares = null;
let squareEls = new Map();
let gameStarted = false;
let joinTimeoutId = null;
let pingIntervalId = null;
let waitClockId = null;
let relayPollId = null;

function setStep(name, state) {
  const li = els.steps.querySelector(`[data-step="${name}"]`);
  if (!li) return;
  li.dataset.state = state;
  li.querySelector(".step-icon").textContent =
    state === "done" ? "✓" : state === "active" ? "•" : state === "failed" ? "✕" : "○";
}

function setTransportState(key, text, kind) {
  const link = links.get(key);
  if (!link) return;
  link.stateEl.textContent = text;
  link.stateEl.parentElement.dataset.state = kind;
}

function showRetry(message) {
  els.lobbyStatus.textContent = message;
  els.retryBtn.classList.remove("hidden");
}

function randomRoomId(length = 6) {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let id = "";
  for (let i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
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
      const span = document.createElement("span");
      span.className = `piece ${piece.color === "w" ? "white-piece" : "black-piece"}`;
      span.textContent = (piece.color === "w" ? WHITE_GLYPHS : BLACK_GLYPHS)[piece.type];
      div.appendChild(span);
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

function pairedLinks() {
  return [...links.values()].filter((link) => link.peerId);
}

function onSquareClick(square) {
  if (!gameStarted || pairedLinks().length === 0 || chess.isGameOver()) return;
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

  // Sent over every paired transport; the index makes the duplicates harmless.
  for (const link of pairedLinks()) {
    link.action.send({ index, from, to, promotion: promotion ?? null });
  }
}

function applyRemoteMove({ index, from, to, promotion }) {
  if (index !== chess.history().length) return; // already applied via another transport
  let move;
  try {
    move = chess.move({ from, to, promotion: promotion ?? undefined });
  } catch (err) {
    console.error("Rakipten gelen hamle uygulanamadı:", err);
    els.gameStatus.textContent = "Hamleler senkron dışı kaldı, yeni oyun başlatın.";
    return;
  }
  clearSelection();
  lastMoveSquares = { from, to };
  render();
  els.lastMove.textContent = `Rakibin hamlesi: ${move.san}`;
}

function startGame() {
  if (gameStarted) return;
  gameStarted = true;
  clearTimeout(joinTimeoutId);
  clearInterval(waitClockId);
  clearInterval(relayPollId);
  els.waitClock.textContent = "";
  setStep("net", "done");
  setStep("wait", "done");
  setStep("ready", "done");
  els.lobby.classList.add("hidden");
  els.game.classList.remove("hidden");
  buildBoard(myColor);
  render();
  els.lastMove.textContent = "Oyun başladı. Beyaz başlar.";
  updateConnLabel();
  startPinging();
}

function updateConnLabel(latency) {
  const paired = pairedLinks();
  if (paired.length === 0) {
    els.connLabel.className = "conn-lost";
    els.connLabel.textContent = "● bağlantı koptu";
    return;
  }
  const via = paired.map((link) => link.transport.label.toLowerCase()).join(", ");
  els.connLabel.className = "conn-ok";
  els.connLabel.textContent = `● ${via}${latency === undefined ? "" : ` · ${latency} ms`}`;
}

function startPinging() {
  clearInterval(pingIntervalId);
  pingIntervalId = setInterval(async () => {
    const [link] = pairedLinks();
    if (!link) {
      updateConnLabel();
      return;
    }
    try {
      updateConnLabel(await link.room.ping(link.peerId));
    } catch {
      updateConnLabel();
    }
  }, PING_INTERVAL_MS);
}

function countOpenSockets(getSockets) {
  try {
    const sockets = getSockets();
    return Object.values(sockets ?? {}).filter((s) => s && s.readyState === 1).length;
  } catch {
    return 0;
  }
}

function watchRelays() {
  const startedAt = Date.now();
  relayPollId = setInterval(() => {
    let anyOnline = false;
    for (const link of links.values()) {
      if (link.peerId) continue;
      const open = countOpenSockets(link.transport.getSockets);
      if (open > 0) {
        anyOnline = true;
        setTransportState(link.transport.key, `ağa bağlı (${open})`, "ok");
      } else if (Date.now() - startedAt > RELAY_GIVEUP_MS) {
        setTransportState(link.transport.key, "ulaşılamıyor", "fail");
      }
    }

    if (anyOnline) {
      setStep("net", "done");
    } else if (Date.now() - startedAt > RELAY_GIVEUP_MS) {
      setStep("net", "failed");
      els.lobbyStatus.textContent =
        "Hiçbir sinyal ağına ulaşılamadı — ağın bu bağlantıları engelliyor olabilir. Farklı bir ağ (örneğin mobil veri) dene.";
    }
  }, RELAY_POLL_MS);
}

function startWaitClock() {
  const startedAt = Date.now();
  waitClockId = setInterval(() => {
    els.waitClock.textContent = `${Math.round((Date.now() - startedAt) / 1000)} sn bekleniyor...`;
  }, 1000);
}

function connect(roomId, { isHost }) {
  myColor = isHost ? "w" : "b";
  els.steps.classList.remove("hidden");
  els.transports.classList.remove("hidden");
  els.stepWaitText.textContent = isHost ? "Rakip bekleniyor" : "Oyun aranıyor";
  els.roomLabel.textContent = `Oda kodu: ${roomId}`;
  setStep("net", "active");
  setStep("wait", "active");

  for (const transport of TRANSPORTS) {
    const li = document.createElement("li");
    li.dataset.state = "pending";
    const name = document.createElement("span");
    name.textContent = transport.label;
    const state = document.createElement("span");
    state.className = "t-state";
    state.textContent = "bağlanıyor...";
    li.append(name, state);
    els.transports.appendChild(li);

    let room;
    try {
      room = transport.join({ appId: APP_ID, rtcConfig: RTC_CONFIG }, roomId, {
        onJoinError: (details) => {
          console.error(`${transport.key} odaya katılamadı:`, details);
          setTransportState(transport.key, "hata", "fail");
        },
      });
    } catch (err) {
      console.error(`${transport.key} başlatılamadı:`, err);
      state.textContent = "başlatılamadı";
      li.dataset.state = "fail";
      continue;
    }

    const action = room.makeAction("move");
    const link = { transport, room, action, peerId: null, stateEl: state };
    links.set(transport.key, link);

    action.onMessage = (data, context) => {
      if (context.peerId !== link.peerId) return;
      applyRemoteMove(data);
    };

    room.onPeerJoin = (peerId) => {
      if (link.peerId) return; // two players per game; ignore extra joiners
      link.peerId = peerId;
      setTransportState(transport.key, "rakip bağlandı", "paired");
      startGame();
      updateConnLabel();
    };

    room.onPeerLeave = (peerId) => {
      if (peerId !== link.peerId) return;
      link.peerId = null;
      setTransportState(transport.key, "rakip ayrıldı", "fail");
      updateConnLabel();
      if (pairedLinks().length === 0) {
        els.gameStatus.textContent = "Rakibin ayrıldı. Aynı linki tekrar açarsa bağlanır.";
      }
    };
  }

  watchRelays();
  startWaitClock();
  els.lobbyStatus.textContent = isHost
    ? "Link hazır. Arkadaşın linke tıkladığı anda burada göreceksin."
    : "Oyunu açan arkadaşın aranıyor...";

  if (!isHost) {
    joinTimeoutId = setTimeout(() => {
      clearInterval(waitClockId);
      setStep("wait", "failed");
      showRetry(
        "Rakip bulunamadı. Arkadaşının sayfayı açık tuttuğundan emin ol; yukarıdaki listede hangi ağların bağlandığı görünüyor.",
      );
    }, GUEST_TIMEOUT_MS);
  }
}

els.createBtn.addEventListener("click", () => {
  const roomId = randomRoomId();
  els.createBtn.classList.add("hidden");
  els.shareLink.value = `${location.origin}${location.pathname}?room=${roomId}`;
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

els.leaveBtn.addEventListener("click", () => {
  for (const link of links.values()) link.room.leave();
  location.href = location.pathname;
});

const roomParam = new URLSearchParams(location.search).get("room");
if (roomParam) {
  els.createBtn.classList.add("hidden");
  connect(roomParam, { isHost: false });
}
