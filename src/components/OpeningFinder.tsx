import { useMemo, useState } from "react";
import type { OpeningLine } from "../data/openings";
import { DEFAULT_FINDER_ANSWERS, recommendOpenings, type FinderAnswers } from "../data/openingFinder";
import type { Dictionary } from "../i18n/translations";

interface OpeningFinderProps {
  openings: OpeningLine[];
  canonicalOpenings: OpeningLine[];
  t: Dictionary;
  onSelect: (line: OpeningLine) => void;
  onClose: () => void;
}

type QuestionKey = "color" | "firstMove" | "risk" | "approach" | "theory";

const QUESTION_KEYS: QuestionKey[] = ["color", "firstMove", "risk", "approach", "theory"];

const OPTION_VALUES: Record<QuestionKey, string[]> = {
  color: ["white", "black", "any"],
  firstMove: ["e4", "d4", "flank", "any"],
  risk: ["low", "medium", "high", "any"],
  approach: ["classical", "hypermodern", "any"],
  theory: ["low", "medium", "high", "any"],
};

export function OpeningFinder({ openings, canonicalOpenings, t, onSelect, onClose }: OpeningFinderProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<FinderAnswers>(DEFAULT_FINDER_ANSWERS);

  const isResults = step >= QUESTION_KEYS.length;
  const currentKey = QUESTION_KEYS[step];

  const results = useMemo(
    () => (isResults ? recommendOpenings(answers, canonicalOpenings, openings) : []),
    [isResults, answers, canonicalOpenings, openings],
  );

  function handleAnswer(key: QuestionKey, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }) as FinderAnswers);
    setStep((s) => s + 1);
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  function handleRestart() {
    setAnswers(DEFAULT_FINDER_ANSWERS);
    setStep(0);
  }

  return (
    <div className="finder-overlay" onClick={onClose}>
      <div className="finder-modal" onClick={(e) => e.stopPropagation()}>
        <div className="finder-header">
          <h2>{t.finder.title}</h2>
          <button type="button" className="finder-close" onClick={onClose} aria-label={t.finder.close}>
            ×
          </button>
        </div>

        {!isResults ? (
          <>
            <p className="finder-step">{t.finder.step(step + 1, QUESTION_KEYS.length)}</p>
            <h3 className="finder-question">{t.finder.questions[currentKey].title}</h3>
            <div className="finder-options">
              {OPTION_VALUES[currentKey].map((value) => (
                <button
                  key={value}
                  type="button"
                  className="finder-option"
                  onClick={() => handleAnswer(currentKey, value)}
                >
                  {t.finder.questions[currentKey].options[value]}
                </button>
              ))}
            </div>
            {step > 0 && (
              <button type="button" className="finder-back" onClick={handleBack}>
                {t.finder.back}
              </button>
            )}
          </>
        ) : (
          <>
            <p className="finder-step">{t.finder.resultsSubtitle}</p>
            {results.length === 0 ? (
              <p className="finder-no-match">{t.finder.noMatch}</p>
            ) : (
              <ul className="finder-results">
                {results.map((line) => (
                  <li key={line.id} className="finder-result-card">
                    <div>
                      <p className="finder-result-eco">
                        {line.eco} · {line.family}
                      </p>
                      <p className="finder-result-name">{line.name}</p>
                      <p className="finder-result-desc">{line.description}</p>
                    </div>
                    <button type="button" className="secondary-button" onClick={() => onSelect(line)}>
                      {t.finder.studyThis}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className="finder-back" onClick={handleRestart}>
              {t.finder.restart}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
