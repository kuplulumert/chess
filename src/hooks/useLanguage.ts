import { useCallback, useLayoutEffect, useState } from "react";
import { dictionaries, type Language } from "../i18n/translations";

const STORAGE_KEY = "chess-opening-trainer-language";

function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "tr") return stored;
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — fall through to the default.
  }
  return "en";
}

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(readStoredLanguage);

  // A layout effect so the <html lang> attribute updates before paint, same
  // pattern as useTheme's data-theme attribute.
  useLayoutEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Persistence is a nice-to-have; the toggle still works for this tab.
    }
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage((l) => (l === "en" ? "tr" : "en"));
  }, []);

  return { language, t: dictionaries[language], toggleLanguage };
}
