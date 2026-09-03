import type { OpeningLine } from "../data/openings";
import type { MoveFeedback, PlayerColor, TrainerMode } from "../hooks/useOpeningTrainer";
import type { Dictionary } from "../i18n/translations";
import { MovePurpose } from "./MovePurpose";

interface InfoPanelProps {
  line: OpeningLine;
  playerColor: PlayerColor;
  mode: TrainerMode;
  history: string[];
  moveIndex: number;
  totalMoves: number;
  isDone: boolean;
  feedback: MoveFeedback;
  wrongAttempts: number;
  revealedHint: string | null;
  currentComment: string | null;
  whiteStrategy: string | null;
  blackStrategy: string | null;
  isPlayerTurn: boolean;
  canExtend: boolean;
  t: Dictionary;
  onColorChange: (color: PlayerColor) => void;
  onModeChange: (mode: TrainerMode) => void;
  onRestart: () => void;
  onHint: () => void;
  onNextLine: () => void;
  onExtend: () => void;
}

function formatHistory(history: string[]): string {
  const parts: string[] = [];
  for (let i = 0; i < history.length; i += 2) {
    const moveNo = i / 2 + 1;
    const white = history[i];
    const black = history[i + 1];
    parts.push(black ? `${moveNo}. ${white} ${black}` : `${moveNo}. ${white}`);
  }
  return parts.join("  ");
}

export function InfoPanel({
  line,
  playerColor,
  mode,
  history,
  moveIndex,
  totalMoves,
  isDone,
  feedback,
  wrongAttempts,
  revealedHint,
  currentComment,
  whiteStrategy,
  blackStrategy,
  isPlayerTurn,
  canExtend,
  t,
  onColorChange,
  onModeChange,
  onRestart,
  onHint,
  onNextLine,
  onExtend,
}: InfoPanelProps) {
  const progressPercent = totalMoves === 0 ? 0 : Math.round((moveIndex / totalMoves) * 100);
  const colorLabel = playerColor === "w" ? t.white : t.black;

  return (
    <aside className="info-panel" data-tour="info-panel">
      <div className="info-card">
        <div className="opening-name-wrap" tabIndex={0}>
          <h2>{line.name}</h2>
          <div className="opening-description-tooltip">{line.description}</div>
        </div>
        <p className="info-eco">
          {line.eco} · {line.family}
        </p>
      </div>

      <div className="info-card">
        <div className="control-row">
          <span className="control-label">{t.playAs}</span>
          <div className="segmented">
            <button
              type="button"
              className={playerColor === "w" ? "segmented-active" : ""}
              onClick={() => onColorChange("w")}
            >
              {t.white}
            </button>
            <button
              type="button"
              className={playerColor === "b" ? "segmented-active" : ""}
              onClick={() => onColorChange("b")}
            >
              {t.black}
            </button>
          </div>
        </div>
        <div className="control-row">
          <span className="control-label">{t.mode}</span>
          <div className="segmented">
            <button
              type="button"
              className={mode === "quiz" ? "segmented-active" : ""}
              onClick={() => onModeChange("quiz")}
            >
              {t.quiz}
            </button>
            <button
              type="button"
              className={mode === "study" ? "segmented-active" : ""}
              onClick={() => onModeChange("study")}
            >
              {t.study}
            </button>
          </div>
        </div>
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={onRestart}>
            {t.restart}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={onHint}
            disabled={mode !== "quiz" || isDone}
          >
            {t.hintButton}
          </button>
        </div>
      </div>

      <MovePurpose
        comment={currentComment}
        moveIndex={moveIndex}
        awaitingMove={isPlayerTurn}
        title={t.moveHintTitle}
      />

      {whiteStrategy && (
        <div className="info-card strategy-card-white">
          <h3 className="moves-title">{t.white}</h3>
          <p className="strategy-text">{whiteStrategy}</p>
        </div>
      )}

      {blackStrategy && (
        <div className="info-card strategy-card-black">
          <h3 className="moves-title">{t.black}</h3>
          <p className="strategy-text">{blackStrategy}</p>
        </div>
      )}

      <div className="info-card status-card">
        <div className="progress-track" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="progress-label">{t.progressLabel(Math.min(moveIndex, totalMoves), totalMoves)}</p>

        {isDone ? (
          <>
            <p className="status-line status-done">{t.lineComplete(mode)}</p>
            <div className="button-row">
              <button type="button" className="secondary-button" onClick={onRestart}>
                {t.playAgain}
              </button>
              <button type="button" className="secondary-button" onClick={onNextLine}>
                {t.nextOpening}
              </button>
            </div>
            {canExtend && (
              <div className="extend-offer">
                <p className="extend-offer-text">{t.extendPrompt}</p>
                <button type="button" className="secondary-button" onClick={onExtend}>
                  {t.extendButton}
                </button>
              </div>
            )}
          </>
        ) : !isPlayerTurn ? (
          <p className="status-line">{t.replayingLine}</p>
        ) : (
          <>
            <p className="status-line">{feedback === "wrong" ? t.notQuite : t.yourMove(colorLabel)}</p>
            {revealedHint && (
              <p className="hint-line">
                {t.hintLabel} <strong>{revealedHint}</strong>
              </p>
            )}
            {wrongAttempts > 0 && !revealedHint && (
              <p className="hint-line hint-line-muted">{t.wrongAttempts(wrongAttempts)}</p>
            )}
          </>
        )}
      </div>

      <div className="info-card">
        <h3 className="moves-title">{t.movesHeading}</h3>
        <p className="moves-list">{history.length ? formatHistory(history) : t.emptyMoves}</p>
      </div>
    </aside>
  );
}
