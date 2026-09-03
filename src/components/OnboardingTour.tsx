import { useLayoutEffect, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { Dictionary } from "../i18n/translations";
import "./OnboardingTour.css";

const STORAGE_KEY = "chess-opening-trainer-onboarding-completed";
const SPOT_PAD = 8;
const TOOLTIP_WIDTH = 320;
const TOOLTIP_MIN_SPACE = 190;
const NARROW_LAYOUT_BREAKPOINT = 860; // matches App.css's mobile breakpoint, where columns stack

const STEP_SELECTORS = [
  "[data-tour='finder']",
  "[data-tour='sidebar']",
  "[data-tour='board']",
  "[data-tour='info-panel']",
] as const;
// Sidebar and info-panel are full-height sticky columns on desktop, so
// above/below placement has nowhere to go — point sideways at them instead.
// The finder button and board are normal-height elements, so below/above
// works fine for them.
const STEP_SIDE_PLACEMENT: Array<"right" | "left" | null> = [null, "right", null, "left"];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function measure(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function readCompleted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

interface OnboardingTourProps {
  t: Dictionary;
}

export function OnboardingTour({ t }: OnboardingTourProps) {
  const [active, setActive] = useState(() => !readCompleted());
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  useLayoutEffect(() => {
    if (!active) return;
    const update = () => setRect(measure(STEP_SELECTORS[step]));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [active, step]);

  useEffect(() => {
    if (!active) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [active]);

  if (!active) return null;

  const finish = () => {
    setActive(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Not persisted — the tour just shows again next visit.
    }
  };

  const handleNext = () => {
    if (step >= STEP_SELECTORS.length - 1) {
      finish();
      return;
    }
    setStep((s) => s + 1);
  };

  const isLast = step === STEP_SELECTORS.length - 1;
  const current = t.tour.steps[step];

  const spotlightStyle: CSSProperties = rect
    ? {
        top: rect.top - SPOT_PAD,
        left: rect.left - SPOT_PAD,
        width: rect.width + SPOT_PAD * 2,
        height: rect.height + SPOT_PAD * 2,
      }
    : { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };

  const clampTop = (top: number) => Math.min(Math.max(top, 16), window.innerHeight - TOOLTIP_MIN_SPACE);
  const clampLeft = (left: number) => Math.min(Math.max(left, 16), window.innerWidth - TOOLTIP_WIDTH - 16);

  const isNarrow = window.innerWidth < NARROW_LAYOUT_BREAKPOINT;
  const sidePlacement = isNarrow ? null : STEP_SIDE_PLACEMENT[step];

  let tooltipStyle: CSSProperties = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  if (rect) {
    const gap = SPOT_PAD + 14;
    if (sidePlacement === "right" && window.innerWidth - (rect.left + rect.width) > TOOLTIP_WIDTH + gap + 16) {
      tooltipStyle = { top: clampTop(rect.top), left: rect.left + rect.width + gap };
    } else if (sidePlacement === "left" && rect.left > TOOLTIP_WIDTH + gap + 16) {
      tooltipStyle = { top: clampTop(rect.top), left: rect.left - gap - TOOLTIP_WIDTH };
    } else {
      const belowSpace = window.innerHeight - (rect.top + rect.height);
      tooltipStyle =
        belowSpace > TOOLTIP_MIN_SPACE
          ? { top: rect.top + rect.height + gap, left: clampLeft(rect.left) }
          : {
              bottom: Math.min(window.innerHeight - rect.top + gap, window.innerHeight - 16),
              left: clampLeft(rect.left),
            };
    }
  }

  return (
    <div className="tour-overlay">
      <div className="tour-spotlight" style={spotlightStyle} />
      <div className="tour-tooltip" style={tooltipStyle}>
        <p className="tour-step-label">{t.tour.stepLabel(step + 1, STEP_SELECTORS.length)}</p>
        <h3 className="tour-title">{current.title}</h3>
        <p className="tour-body">{current.body}</p>
        <div className="tour-actions">
          <button type="button" className="tour-skip" onClick={finish}>
            {t.tour.skip}
          </button>
          <button type="button" className="tour-next" onClick={handleNext}>
            {isLast ? t.tour.getStarted : t.tour.next}
          </button>
        </div>
      </div>
    </div>
  );
}
