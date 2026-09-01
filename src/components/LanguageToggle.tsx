import type { Language } from "../i18n/translations";

interface LanguageToggleProps {
  language: Language;
  label: string;
  onToggle: () => void;
}

export function LanguageToggle({ language, label, onToggle }: LanguageToggleProps) {
  return (
    <button
      type="button"
      className="language-toggle"
      onClick={onToggle}
      aria-label={label}
      title={label}
    >
      {language === "en" ? "TR" : "EN"}
    </button>
  );
}
