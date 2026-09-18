import { Chess } from "./vendor/chess.esm.js";
import { joinRoom } from "./vendor/trystero-nostr.mjs";

const APP_ID = "kuplulumert-online-chess";
const WHITE_GLYPHS = { p: "♙", n: "♘", b: "♗", r: "♖", q: "♕", k: "♔" };
const BLACK_GLYPHS = { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚" };

// Peer discovery goes over public nostr relays, but the actual WebRTC link
// still needs a relay of its own whenever both players sit behind carrier-grade
// NAT (common on mobile data). Open Relay Project's free TURN covers that.
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

const GUEST_TIMEOUT_MS = 60000;
const PING_INTERVAL_MS = 4000;

// Trystero opens its own sockets to a large pool of public nostr relays and
// doesn't report when they come up, so probe one directly just to tell the
// player whether the signalling network is reachable at all from their network.
const PROBE_RELAYS = ["wss://nos.lol", "wss://relay.mostr.pub", "wss://purplerelay.com"];

const els = {
  lobby: document.getElementById("lobby"),
  createBtn: document.getElementById("create-btn"),
  sharePanel: document.getElementById("share-panel"),
  shareLink: document.getElementById("share-link"),
  copyBtn: document.getElementById("copy-btn"),
  steps: document.getElementById("steps"),
  stepWaitText: document.getElementById("step-wait-text"),
  waitClock: document.getElementById("wait-clock"),
  roomLabel: document.getElementById("room-label"),
  lobbyStatus: document.getElementById("lobby-status"),
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
let room = null;
let moveAction = null;
let opponentId = null;
let myColor = null;
let selected = null;
let legalTargets = [];
let lastMoveSquares = null;
let squareEls = new Map();
let joinTimeoutId = null;
let pingIntervalId = null;
let waitClockId = null;

function setStep(name, state) {
  const li = els.steps.querySelector(`[data-step="${name}"]`);
  if (!li) return;
  li.dataset.state = state;
  li.querySelector(".step-icon").textContent =
    state === "done" ? "✓" : state === "active" ? "•" : state === "failed" ? "✕" : "○";
}

function showRetry(message) {
  els.lobbyStatus.textContent = message;
  els.retryBtn.classList.remove("hidden");
}

function probeRelays() {
  return new Promise((resolve) => {
    let settled = false;
    const sockets = PROBE_RELAYS.map((url) => {
      let socket;
      try {
        socket = new WebSocket(url);
      } catch {
        return null;
      }
      socket.onopen = () => {
        if (!settled) {
          settled = true;
          resolve(true);
        }
        sockets.forEach((s) => s && s.close());
      };
      return socket;
    });

    setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(false);
        sockets.forEach((s) => s && s.close());
      }
    }, 10000);
  });
}

function startWaitClock() {
  const startedAt = Date.now();
  return setInterval(() => {
    const seconds = Math.round((Date.now() - startedAt) / 1000);
    els.waitClock.textContent = `${seconds} sn bekleniyor...`;
  }, 1000);
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

function onSquareClick(square) {
  if (!opponentId || chess.isGameOver()) return;
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
  els.lastMove.textContent = `Oynadığın hamle: ${move.san} — gönderildi`;
  moveAction.send({ from, to, promotion: promotion ?? null });
}

function applyRemoteMove(data) {
  const { from, to, promotion } = data;
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

function showGame() {
  els.lobby.classList.add("hidden");
  els.game.classList.remove("hidden");
  buildBoard(myColor);
  render();
  els.lastMove.textContent = "Oyun başladı. Beyaz başlar.";
}

function setConnected(isConnected, detail) {
  els.connLabel.className = isConnected ? "conn-ok" : "conn-lost";
  els.connLabel.textContent = isConnected ? `● ${detail ?? "bağlı"}` : "● bağlantı koptu";
}

function startPinging() {
  stopPinging();
  pingIntervalId = setInterval(async () => {
    if (!room || !opponentId) return;
    try {
      const ms = await room.ping(opponentId);
      setConnected(true, `bağlı · ${ms} ms`);
    } catch {
      setConnected(false);
    }
  }, PING_INTERVAL_MS);
}

function stopPinging() {
  if (pingIntervalId) {
    clearInterval(pingIntervalId);
    pingIntervalId = null;
  }
}

function connect(roomId, { isHost }) {
  myColor = isHost ? "w" : "b";
  els.steps.classList.remove("hidden");
  els.stepWaitText.textContent = isHost ? "Rakip bekleniyor" : "Oyun aranıyor";
  setStep("relay", "active");

  room = joinRoom({ appId: APP_ID, rtcConfig: RTC_CONFIG }, roomId, {
    onJoinError: (details) => {
      console.error("Odaya katılınamadı:", details);
      setStep("relay", "failed");
      showRetry("Sinyal ağına bağlanılamadı.");
    },
  });

  moveAction = room.makeAction("move");
  moveAction.onMessage = (data, context) => {
    if (context.peerId !== opponentId) return;
    applyRemoteMove(data);
  };

  els.roomLabel.textContent = `Oda kodu: ${roomId}`;
  setStep("wait", "active");
  waitClockId = startWaitClock();
  els.lobbyStatus.textContent = isHost
    ? "Link hazır. Arkadaşın linke tıkladığı anda burada göreceksin."
    : "Oyunu açan arkadaşın aranıyor...";

  probeRelays().then((reachable) => {
    setStep("relay", reachable ? "done" : "failed");
    if (!reachable) {
      els.lobbyStatus.textContent =
        "Sinyal ağına ulaşılamıyor (ağın WebSocket bağlantılarını engelliyor olabilir). Bağlantı yine de denenmeye devam ediyor.";
    }
  });

  if (!isHost) {
    joinTimeoutId = setTimeout(() => {
      clearInterval(waitClockId);
      setStep("wait", "failed");
      showRetry(
        "Rakip bulunamadı. Arkadaşının sayfayı hâlâ açık tuttuğundan emin ol, sonra tekrar dene.",
      );
    }, GUEST_TIMEOUT_MS);
  }

  room.onPeerJoin = (peerId) => {
    if (opponentId) return; // a game is two players; ignore extra joiners
    clearTimeout(joinTimeoutId);
    clearInterval(waitClockId);
    els.waitClock.textContent = "";
    // A peer arriving proves the signalling network worked, whatever the
    // standalone probe made of it.
    setStep("relay", "done");
    opponentId = peerId;
    setStep("wait", "done");
    setStep("peer", "done");
    setStep("ready", "done");
    setConnected(true);
    showGame();
    startPinging();
  };

  room.onPeerLeave = (peerId) => {
    if (peerId !== opponentId) return;
    opponentId = null;
    stopPinging();
    setConnected(false);
    els.gameStatus.textContent = "Rakibin ayrıldı. Aynı linki tekrar açarsa bağlanır.";
  };
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
  if (room) room.leave();
  location.href = location.pathname;
});

const roomParam = new URLSearchParams(location.search).get("room");
if (roomParam) {
  els.createBtn.classList.add("hidden");
  connect(roomParam, { isHost: false });
}
