import { useCallback, useLayoutEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "chess-opening-trainer-theme";

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — fall through to the default.
  }
  return "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  // A layout effect (not a regular effect) so the attribute is set before the
  // browser paints — index.html already sets it once on load to avoid a
  // flash; this keeps it in sync whenever the user toggles.
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Persistence is a nice-to-have; the toggle still works for this tab.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme };
}
