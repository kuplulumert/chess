import { useState } from "react";

function readDismissed(storageKey: string): boolean {
  try {
    return localStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

interface HowToUseBannerProps {
  text: string;
  dismissLabel: string;
  storageKey: string;
  /** "boxed" (default) is a standalone bordered banner; "inline" drops the
   * box styling so it can sit inside an existing bar (e.g. the view switcher)
   * instead of opening its own area. */
  variant?: "boxed" | "inline";
}

export function HowToUseBanner({ text, dismissLabel, storageKey, variant = "boxed" }: HowToUseBannerProps) {
  const [dismissed, setDismissed] = useState(() => readDismissed(storageKey));

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // Not persisted this time — the banner just reappears on the next visit.
    }
  };

  return (
    <div className={variant === "inline" ? "how-to-use how-to-use-inline" : "how-to-use"}>
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
