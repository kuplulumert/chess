import { Chess } from "./vendor/chess.esm.js";

const WHITE_GLYPHS = { p: "♙", n: "♘", b: "♗", r: "♖", q: "♕", k: "♔" };
const BLACK_GLYPHS = { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚" };

const els = {
  lobby: document.getElementById("lobby"),
  createBtn: document.getElementById("create-btn"),
  sharePanel: document.getElementById("share-panel"),
  shareLink: document.getElementById("share-link"),
  copyBtn: document.getElementById("copy-btn"),
  lobbyStatus: document.getElementById("lobby-status"),
  game: document.getElementById("game"),
  board: document.getElementById("board"),
  colorLabel: document.getElementById("color-label"),
  turnLabel: document.getElementById("turn-label"),
  gameStatus: document.getElementById("game-status"),
  leaveBtn: document.getElementById("leave-btn"),
};

const ICE_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const chess = new Chess();
let peer = null;
let conn = null;
let myColor = null; // 'w' | 'b'
let selected = null;
let legalTargets = [];
let squareEls = new Map();

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

  const turn = chess.turn();
  els.turnLabel.textContent = turn === myColor ? "Sıra sende" : "Rakibin sırası";
  els.gameStatus.textContent = chess.isCheck() ? "Şah!" : "";
}

function clearSelection() {
  selected = null;
  legalTargets = [];
}

function onSquareClick(square) {
  if (!conn || !conn.open || chess.isGameOver()) return;
  if (chess.turn() !== myColor) return;

  const piece = chess.get(square);

  if (selected) {
    if (square === selected) {
      clearSelection();
      render();
      return;
    }
    const target = legalTargets.find((m) => m.to === square);
    if (target) {
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

  try {
    chess.move({ from, to, promotion });
  } catch {
    clearSelection();
    render();
    return;
  }

  clearSelection();
  render();
  conn.send({ type: "move", from, to, promotion });
}

function applyRemoteMove({ from, to, promotion }) {
  try {
    chess.move({ from, to, promotion });
  } catch (err) {
    console.error("Rakipten gelen hamle uygulanamadı, senkron bozuldu.", err);
    els.gameStatus.textContent = "Bağlantı senkron dışı kaldı, yeni oyun başlatın.";
    return;
  }
  clearSelection();
  render();
}

function showGame() {
  els.lobby.classList.add("hidden");
  els.game.classList.remove("hidden");
  buildBoard(myColor);
  render();
}

function setupConnection(connection, { announceReady }) {
  conn = connection;

  conn.on("open", () => {
    showGame();
    if (announceReady) {
      els.lobbyStatus.textContent = "";
    }
  });

  conn.on("data", (data) => {
    if (data && data.type === "move") {
      applyRemoteMove(data);
    }
  });

  conn.on("close", () => {
    els.gameStatus.textContent = "Rakibin bağlantısı kesildi.";
  });

  conn.on("error", (err) => {
    console.error(err);
    els.gameStatus.textContent = "Bağlantı hatası oluştu.";
  });
}

function startHost() {
  const roomId = randomRoomId();
  myColor = "w";

  els.createBtn.disabled = true;
  els.lobbyStatus.textContent = "Oda oluşturuluyor...";

  peer = new Peer(roomId, { config: ICE_CONFIG });

  peer.on("open", (id) => {
    const link = `${location.origin}${location.pathname}?room=${id}`;
    els.shareLink.value = link;
    els.sharePanel.classList.remove("hidden");
    els.lobbyStatus.textContent = "Arkadaşının bağlanması bekleniyor...";
  });

  peer.on("connection", (connection) => {
    setupConnection(connection, { announceReady: true });
  });

  peer.on("error", (err) => {
    console.error(err);
    if (err.type === "unavailable-id") {
      els.createBtn.disabled = false;
      els.lobbyStatus.textContent = "Oda oluşturulamadı, tekrar deneniyor...";
      peer.destroy();
      startHost();
      return;
    }
    els.lobbyStatus.textContent = "Bağlantı sunucusuna ulaşılamadı. Sayfayı yenileyip tekrar dene.";
  });
}

function startGuest(roomId) {
  myColor = "b";
  els.lobbyStatus.textContent = "Oyuna bağlanılıyor...";

  peer = new Peer(undefined, { config: ICE_CONFIG });

  peer.on("open", () => {
    const connection = peer.connect(roomId, { reliable: true });
    setupConnection(connection, { announceReady: false });
  });

  peer.on("error", (err) => {
    console.error(err);
    if (err.type === "peer-unavailable") {
      els.lobbyStatus.textContent = "Bu oyun bulunamadı. Link geçersiz olabilir ya da rakip ayrıldı.";
      return;
    }
    els.lobbyStatus.textContent = "Bağlantı sunucusuna ulaşılamadı. Sayfayı yenileyip tekrar dene.";
  });
}

els.createBtn.addEventListener("click", startHost);

els.copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(els.shareLink.value);
    els.copyBtn.textContent = "Kopyalandı!";
    setTimeout(() => (els.copyBtn.textContent = "Kopyala"), 1500);
  } catch {
    els.shareLink.select();
  }
});

els.leaveBtn.addEventListener("click", () => {
  location.href = location.pathname;
});

const roomParam = new URLSearchParams(location.search).get("room");
if (roomParam) {
  els.createBtn.classList.add("hidden");
  startGuest(roomParam);
}
