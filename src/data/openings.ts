export interface OpeningLine {
  id: string;
  family: string;
  name: string;
  eco: string;
  moves: string[]; // SAN, starting at 1.
  description: string;
}

export const openings: OpeningLine[] = [
  {
    id: "italian-giuoco-piano",
    family: "Italian Game",
    name: "Giuoco Piano",
    eco: "C50",
    moves: [
      "e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6",
      "d3", "d6", "O-O", "O-O",
    ],
    description:
      "A slow, classical build-up: both sides develop naturally and fight for the center before committing to a plan.",
  },
  {
    id: "italian-evans-gambit",
    family: "Italian Game",
    name: "Evans Gambit",
    eco: "C51",
    moves: [
      "e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "b4", "Bxb4",
      "c3", "Ba5", "d4", "exd4",
    ],
    description:
      "White sacrifices a pawn to seize the center and open lines for a quick attack on the black king.",
  },
  {
    id: "ruy-lopez-berlin",
    family: "Ruy Lopez",
    name: "Berlin Defence",
    eco: "C67",
    moves: [
      "e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6", "O-O", "Nxe4",
      "d4", "Nd6", "Bxc6", "dxc6", "dxe5", "Nf5",
    ],
    description:
      "The famous 'Berlin Wall': queens come off early and the position simplifies into a technical endgame battle.",
  },
  {
    id: "ruy-lopez-closed",
    family: "Ruy Lopez",
    name: "Morphy Defence (Closed)",
    eco: "C84",
    moves: [
      "e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6",
      "O-O", "Be7", "Re1", "b5", "Bb3", "d6",
    ],
    description:
      "The main line of the Ruy Lopez: a rich strategic struggle with slow maneuvering on both wings.",
  },
  {
    id: "scotch-game",
    family: "Scotch Game",
    name: "Main Line",
    eco: "C45",
    moves: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Nxd4", "Nf6", "Nc3", "Bb4"],
    description:
      "White opens the center immediately, trading pawns for quick piece activity.",
  },
  {
    id: "petrov-defence",
    family: "Petrov's Defence",
    name: "Main Line",
    eco: "C42",
    moves: [
      "e4", "e5", "Nf3", "Nf6", "Nxe5", "d6", "Nf3", "Nxe4",
      "d4", "d5", "Bd3", "Nc6",
    ],
    description:
      "Black meets 1.e4 e5 symmetrically, aiming for a solid, drawish, well-tested structure.",
  },
  {
    id: "vienna-game",
    family: "Vienna Game",
    name: "Main Line",
    eco: "C29",
    moves: ["e4", "e5", "Nc3", "Nf6", "g3", "d5", "exd5", "Nxd5", "Bg2"],
    description:
      "White develops the knight before f4 or a fianchetto, keeping options flexible.",
  },
  {
    id: "kings-gambit-accepted",
    family: "King's Gambit",
    name: "Accepted",
    eco: "C34",
    moves: ["e4", "e5", "f4", "exf4", "Nf3", "g5", "h4", "g4", "Ne5"],
    description:
      "A romantic, sharp gambit: White gives up a pawn for rapid development and attacking chances.",
  },
  {
    id: "sicilian-najdorf",
    family: "Sicilian Defence",
    name: "Najdorf Variation",
    eco: "B90",
    moves: [
      "e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6",
      "Nc3", "a6", "Be2", "e5", "Nb3", "Be7",
    ],
    description:
      "The most respected Sicilian: ...a6 prepares ...e5 and ...b5 while keeping the position flexible.",
  },
  {
    id: "sicilian-dragon",
    family: "Sicilian Defence",
    name: "Dragon Variation",
    eco: "B70",
    moves: [
      "e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6",
      "Nc3", "g6", "Be3", "Bg7", "f3", "O-O",
    ],
    description:
      "Black fianchettoes the bishop for long-diagonal pressure, usually leading to opposite-side castling races.",
  },
  {
    id: "sicilian-sveshnikov",
    family: "Sicilian Defence",
    name: "Sveshnikov Variation",
    eco: "B33",
    moves: [
      "e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "Nf6",
      "Nc3", "e5", "Ndb5", "d6",
    ],
    description:
      "Black accepts a weak d5-square for active piece play and a lead in development.",
  },
  {
    id: "sicilian-rossolimo",
    family: "Sicilian Defence",
    name: "Rossolimo Variation",
    eco: "B31",
    moves: [
      "e4", "c5", "Nf3", "Nc6", "Bb5", "g6", "O-O", "Bg7",
      "Re1", "Nf6", "e5", "Nd5",
    ],
    description:
      "White avoids the main theoretical battles by pinning/trading on c6 early.",
  },
  {
    id: "french-advance",
    family: "French Defence",
    name: "Advance Variation",
    eco: "C02",
    moves: ["e4", "e6", "d4", "d5", "e5", "c5", "c3", "Nc6", "Nf3", "Qb6"],
    description:
      "White grabs space with e5, and both sides fight over the d4/c-file structure.",
  },
  {
    id: "french-winawer",
    family: "French Defence",
    name: "Winawer Variation",
    eco: "C15",
    moves: [
      "e4", "e6", "d4", "d5", "Nc3", "Bb4", "e5", "c5",
      "a3", "Bxc3+", "bxc3", "Ne7",
    ],
    description:
      "Black doubles White's c-pawns in exchange for a bishop pair concession, creating imbalanced play.",
  },
  {
    id: "caro-kann-classical",
    family: "Caro-Kann Defence",
    name: "Classical Variation",
    eco: "B18",
    moves: [
      "e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5",
      "Ng3", "Bg6", "h4", "h6", "Nf3", "Nd7",
    ],
    description:
      "A rock-solid setup for Black: the light-squared bishop escapes before ...e6 closes it in.",
  },
  {
    id: "caro-kann-advance",
    family: "Caro-Kann Defence",
    name: "Advance Variation",
    eco: "B12",
    moves: ["e4", "c6", "d4", "d5", "e5", "Bf5", "Nf3", "e6", "Be2", "c5"],
    description:
      "White claims space with e5; Black chips away at the center with ...c5.",
  },
  {
    id: "pirc-defence",
    family: "Pirc Defence",
    name: "Main Line",
    eco: "B07",
    moves: ["e4", "d6", "d4", "Nf6", "Nc3", "g6", "Nf3", "Bg7", "Be2", "O-O", "O-O"],
    description:
      "Black allows White a big center and plans to strike back later with ...c5 or ...e5.",
  },
  {
    id: "scandinavian-defence",
    family: "Scandinavian Defence",
    name: "Main Line",
    eco: "B01",
    moves: [
      "e4", "d5", "exd5", "Qxd5", "Nc3", "Qa5", "d4", "Nf6",
      "Nf3", "c6",
    ],
    description:
      "Black recaptures on d5 with the queen immediately, accepting a small loss of time for simplicity.",
  },
  {
    id: "qgd-main-line",
    family: "Queen's Gambit Declined",
    name: "Main Line",
    eco: "D37",
    moves: [
      "d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7",
      "e3", "O-O", "Nf3", "h6", "Bh4",
    ],
    description:
      "A classical, rock-solid structure for Black; White develops naturally and pressures d5.",
  },
  {
    id: "qga-main-line",
    family: "Queen's Gambit Accepted",
    name: "Main Line",
    eco: "D20",
    moves: ["d4", "d5", "c4", "dxc4", "Nf3", "Nf6", "e3", "e6", "Bxc4", "c5"],
    description:
      "Black grabs the c4-pawn temporarily; White regains it while developing with tempo.",
  },
  {
    id: "slav-defence",
    family: "Slav Defence",
    name: "Main Line",
    eco: "D17",
    moves: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "dxc4", "a4", "Bf5"],
    description:
      "Black supports d5 with the c-pawn, keeping the dark-squared bishop free unlike the QGD.",
  },
  {
    id: "kings-indian-defence",
    family: "King's Indian Defence",
    name: "Classical Variation",
    eco: "E90",
    moves: [
      "d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6",
      "Nf3", "O-O", "Be2", "e5",
    ],
    description:
      "Black lets White build a big center, then counter-attacks it with ...e5 or ...c5 and kingside play.",
  },
  {
    id: "nimzo-indian-defence",
    family: "Nimzo-Indian Defence",
    name: "Main Line",
    eco: "E40",
    moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4", "e3", "O-O", "Bd3", "d5"],
    description:
      "Black pins the knight on c3 to control e4 and pressure White's center before it fully forms.",
  },
  {
    id: "grunfeld-defence",
    family: "Grünfeld Defence",
    name: "Exchange Variation",
    eco: "D85",
    moves: [
      "d4", "Nf6", "c4", "g6", "Nc3", "d5", "cxd5", "Nxd5",
      "e4", "Nxc3", "bxc3", "Bg7",
    ],
    description:
      "Black allows White a huge pawn center, then attacks it immediately with active piece play.",
  },
  {
    id: "english-opening",
    family: "English Opening",
    name: "Reversed Sicilian",
    eco: "A20",
    moves: [
      "c4", "e5", "Nc3", "Nf6", "Nf3", "Nc6", "g3", "d5",
      "cxd5", "Nxd5", "Bg2",
    ],
    description:
      "A flexible flank opening; White plays a Sicilian Defence with an extra tempo.",
  },
  {
    id: "london-system",
    family: "London System",
    name: "Main Line",
    eco: "D02",
    moves: [
      "d4", "d5", "Nf3", "Nf6", "Bf4", "e6", "e3", "Bd6",
      "Bg3", "O-O",
    ],
    description:
      "A simple, reliable setup for White with Bf4/e3/Bd3/Nbd2, playable against almost anything Black tries.",
  },
  {
    id: "catalan-opening",
    family: "Catalan Opening",
    name: "Main Line",
    eco: "E00",
    moves: [
      "d4", "Nf6", "c4", "e6", "g3", "d5", "Bg2", "Be7",
      "Nf3", "O-O", "O-O",
    ],
    description:
      "White fianchettoes the bishop to combine queen's-pawn structures with long-diagonal pressure.",
  },
];
