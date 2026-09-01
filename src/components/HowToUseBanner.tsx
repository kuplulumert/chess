import { useState } from "react";

const STORAGE_KEY = "chess-opening-trainer-guide-dismissed";

function readDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

interface HowToUseBannerProps {
  text: string;
  dismissLabel: string;
}

export function HowToUseBanner({ text, dismissLabel }: HowToUseBannerProps) {
  const [dismissed, setDismissed] = useState(readDismissed);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Not persisted this time — the banner just reappears on the next visit.
    }
  };

  return (
    <div className="how-to-use">
      <p className="how-to-use-text">{text}</p>
      <button
        type="button"
        className="how-to-use-dismiss"
        onClick={handleDismiss}
        aria-label={dismissLabel}
        title={dismissLabel}
      >
        ×
      </button>
    </div>
  );
}
