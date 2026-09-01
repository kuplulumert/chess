import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import type { OpeningLine } from "../data/openings";

export type PlayerColor = "w" | "b";
export type TrainerMode = "quiz" | "study";
export type MoveFeedback = "idle" | "correct" | "wrong";

const OPPONENT_MOVE_DELAY_MS = 550;
const WRONG_ATTEMPTS_BEFORE_HINT = 2;

function moveColor(plyIndex: number): PlayerColor {
  return plyIndex % 2 === 0 ? "w" : "b";
}

export function useOpeningTrainer(line: OpeningLine, playerColor: PlayerColor, mode: TrainerMode) {
  const [game, setGame] = useState(() => new Chess());
  const [moveIndex, setMoveIndex] = useState(0);
  const [feedback, setFeedback] = useState<MoveFeedback>("idle");
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [lastWrongSquares, setLastWrongSquares] = useState<{ from: Square; to: Square } | null>(
    null,
  );
  const [hintRequested, setHintRequested] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  // Reset synchronously when the line, colour, or mode changes, rather than in an
  // effect: an effect resets one render too late, so consumers would briefly still
  // see the finished state of the *previous* run under the new line/colour.
  const runKey = `${line.id}:${playerColor}:${mode}`;
  const [activeRunKey, setActiveRunKey] = useState(runKey);
  if (activeRunKey !== runKey) {
    setActiveRunKey(runKey);
    setGame(new Chess());
    setMoveIndex(0);
    setFeedback("idle");
    setWrongAttempts(0);
    setLastWrongSquares(null);
    setHintRequested(false);
  }

  const isDone = moveIndex >= line.moves.length;
  const isPlayerTurn = mode === "quiz" && !isDone && moveColor(moveIndex) === playerColor;
  const isOpponentTurn = !isDone && moveColor(moveIndex) !== playerColor;

  const applyBookMove = useCallback((index: number) => {
    setGame((prev) => {
      const next = new Chess(prev.fen());
      next.move(line.moves[index]);
      return next;
    });
    setMoveIndex(index + 1);
    setFeedback("idle");
    setWrongAttempts(0);
    setLastWrongSquares(null);
    setHintRequested(false);
  }, [line.moves]);

  const reset = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setGame(new Chess());
    setMoveIndex(0);
    setFeedback("idle");
    setWrongAttempts(0);
    setLastWrongSquares(null);
    setHintRequested(false);
  }, []);

  // Auto-play the opponent's (or, in study mode, everyone's) book moves.
  useEffect(() => {
    if (isDone) return;
    const shouldAutoPlay = mode === "study" || moveColor(moveIndex) !== playerColor;
    if (!shouldAutoPlay) return;

    timeoutRef.current = window.setTimeout(() => {
      applyBookMove(moveIndex);
    }, OPPONENT_MOVE_DELAY_MS);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [moveIndex, isDone, mode, playerColor, applyBookMove]);

  const attemptMove = useCallback(
    (from: Square, to: Square): boolean => {
      if (!isPlayerTurn) return false;

      const probe = new Chess(game.fen());
      let result;
      try {
        result = probe.move({ from, to, promotion: "q" });
      } catch {
        result = null;
      }
      if (!result) return false;

      const expectedSan = line.moves[moveIndex];
      if (result.san === expectedSan) {
        applyBookMove(moveIndex);
        setFeedback("correct");
        window.setTimeout(() => setFeedback("idle"), 500);
      } else {
        setFeedback("wrong");
        setLastWrongSquares({ from, to });
        setWrongAttempts((n) => n + 1);
        window.setTimeout(() => setFeedback("idle"), 500);
      }
      return true;
    },
    [game, isPlayerTurn, line.moves, moveIndex, applyBookMove],
  );

  const showHint = hintRequested || wrongAttempts >= WRONG_ATTEMPTS_BEFORE_HINT;
  const revealedHint = showHint && !isDone ? line.moves[moveIndex] : null;

  // Derived from moveIndex rather than game.history(): chess.js loses move history
  // whenever a new Chess instance is constructed from a FEN string.
  const history = useMemo(() => line.moves.slice(0, moveIndex), [line.moves, moveIndex]);

  return {
    fen: game.fen(),
    history,
    moveIndex,
    isDone,
    isPlayerTurn,
    isOpponentTurn,
    feedback,
    wrongAttempts,
    lastWrongSquares,
    revealedHint,
    nextMoveSan: isDone ? null : line.moves[moveIndex],
    currentComment: isDone ? null : line.comments[moveIndex],
    totalMoves: line.moves.length,
    attemptMove,
    requestHint: () => setHintRequested(true),
    reset,
  };
}
