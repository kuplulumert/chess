import { useMemo } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard, type PieceDropHandlerArgs } from "react-chessboard";
import type { PlayerColor } from "../hooks/useOpeningTrainer";

interface BoardPanelProps {
  fen: string;
  playerColor: PlayerColor;
  isPlayerTurn: boolean;
  feedback: "idle" | "correct" | "wrong";
  lastWrongSquares: { from: Square; to: Square } | null;
  hintSan: string | null;
  onDrop: (from: Square, to: Square) => boolean;
}

function findMoveSquares(fen: string, san: string): { from: Square; to: Square } | null {
  const probe = new Chess(fen);
  const match = probe.moves({ verbose: true }).find((m) => m.san === san);
  return match ? { from: match.from as Square, to: match.to as Square } : null;
}

export function BoardPanel({
  fen,
  playerColor,
  isPlayerTurn,
  feedback,
  lastWrongSquares,
  hintSan,
  onDrop,
}: BoardPanelProps) {
  const hintSquares = useMemo(
    () => (hintSan ? findMoveSquares(fen, hintSan) : null),
    [fen, hintSan],
  );

  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};
    if (feedback === "wrong" && lastWrongSquares) {
      styles[lastWrongSquares.from] = { backgroundColor: "rgba(220, 68, 68, 0.55)" };
      styles[lastWrongSquares.to] = { backgroundColor: "rgba(220, 68, 68, 0.55)" };
    }
    if (hintSquares) {
      styles[hintSquares.from] = { ...styles[hintSquares.from], backgroundColor: "rgba(70, 170, 90, 0.45)" };
      styles[hintSquares.to] = { ...styles[hintSquares.to], backgroundColor: "rgba(70, 170, 90, 0.45)" };
    }
    return styles;
  }, [feedback, lastWrongSquares, hintSquares]);

  function handlePieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean {
    if (!targetSquare || !isPlayerTurn) return false;
    return onDrop(sourceSquare as Square, targetSquare as Square);
  }

  function canDragPiece(): boolean {
    return isPlayerTurn;
  }

  return (
    <div className={"board-wrap" + (feedback === "wrong" ? " board-shake" : "")}>
      <Chessboard
        options={{
          id: "opening-trainer-board",
          position: fen,
          boardOrientation: playerColor === "w" ? "white" : "black",
          onPieceDrop: handlePieceDrop,
          canDragPiece,
          squareStyles,
          animationDurationInMs: 200,
          allowDragging: isPlayerTurn,
          darkSquareStyle: { backgroundColor: "#7c8fa3" },
          lightSquareStyle: { backgroundColor: "#eef1f5" },
        }}
      />
    </div>
  );
}
