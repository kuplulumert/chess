# Opening Trainer

**Live: https://kuplulumert.github.io/chess/**

A focused chess app for one thing only: memorizing openings. Pick a line, choose a
colour, and play the book moves from memory — the app plays the opponent's replies
and tells you when you've gone off book.

There's also a separate, unrelated mini-site at
[`/online/`](https://kuplulumert.github.io/chess/online/) ([source](public/online)) for
playing a live game of chess against a friend: one person opens it, shares the
generated link, and whoever opens that link plays the other side. No accounts and no
server of our own — it's a static page, and the two browsers exchange moves through
public MQTT brokers (EMQX, HiveMQ, Mosquitto), subscribing to a topic named after the
random room code in the link.

A peer-to-peer link would have been the obvious choice, and the page did use WebRTC at
first, but it can't be relied on here: when both players sit behind carrier-grade NAT —
the norm on mobile and many home connections — a direct connection needs a TURN relay,
and free public TURN servers no longer answer. Chess moves are a few bytes each, so
routing them through a message broker costs nothing and works on any network that
allows an outbound WebSocket. All three brokers are used at once and duplicate messages
are discarded, so one broker being blocked or down doesn't stop the game. Note that
those brokers are public: a game's moves aren't private to anyone who knows the room
code.

## How it works

- **Quiz mode** — you play every move for your colour. A move that isn't the book
  move is rejected and the piece snaps back, so the board never leaves the line.
  The opponent's replies are played automatically.
- **Study mode** — the whole line replays itself so you can watch it before drilling it.
- **Hints** — press `? Hint` any time, or make two wrong attempts in a row and the
  correct move is revealed automatically.
- **Progress** — finishing a line in quiz mode marks it with a ✓ in the sidebar,
  per colour. Progress is stored in the browser's `localStorage`.

Each line stops at a sensible point (6–7 moves), which is where memorization actually
pays off — deep enough to reach the opening's characteristic structure, short enough
to drill in a few minutes.

## Openings included

27 lines across the major families: Italian Game, Ruy Lopez, Scotch, Petrov, Vienna,
King's Gambit, Sicilian (Najdorf, Dragon, Sveshnikov, Rossolimo), French, Caro-Kann,
Pirc, Scandinavian, Queen's Gambit (Declined and Accepted), Slav, King's Indian,
Nimzo-Indian, Grünfeld, English, London System, and the Catalan.

## Running it

```bash
npm install
npm run dev      # dev server on http://localhost:5173
npm run build    # typecheck + production build into dist/
npm run lint
```

## Adding your own lines

Openings live in [`src/data/openings.ts`](src/data/openings.ts). Add an entry with the
moves in SAN and it shows up in the sidebar, grouped under its `family`:

```ts
{
  id: "my-line",
  family: "Ruy Lopez",
  name: "Marshall Attack",
  eco: "C89",
  moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", /* … */],
  description: "…",
}
```

Moves are validated by `chess.js` at runtime, so a typo in a SAN string will simply
fail to play — worth double-checking new lines in the app after adding them.

## Stack

React + TypeScript on Vite, [`chess.js`](https://github.com/jhlywa/chess.js) for move
legality and [`react-chessboard`](https://github.com/Clariity/react-chessboard) for the
board.
