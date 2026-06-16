// Global app state: language (pt/en) and theme (dark/light), both persisted.

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { dict, interpolate } from "../lib/i18n";

const AppContext = createContext(null);

// Language is currently locked to Brazilian Portuguese. The full i18n machinery
// (EN strings, setLang, toggleLang) is kept intact so the toggle can be switched
// back on later by simply rendering the language button again.
function getInitialLang() {
  return "pt";
}

function getInitialTheme() {
  const saved = localStorage.getItem("pelada.theme");
  if (saved === "light" || saved === "dark") return saved;
  return "dark"; // dark by default
}

export function AppProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    localStorage.setItem("pelada.lang", lang);
    document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("pelada.theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const value = useMemo(() => {
    const strings = dict[lang];
    // t("home.heroTitle", {vars}) -> nested lookup with interpolation
    const t = (path, vars) => {
      const raw = path.split(".").reduce((o, k) => (o ? o[k] : undefined), strings);
      if (typeof raw !== "string") return path;
      return vars ? interpolate(raw, vars) : raw;
    };
    return {
      lang,
      setLang,
      toggleLang: () => setLang((l) => (l === "pt" ? "en" : "pt")),
      theme,
      setTheme,
      toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
      t,
      strings,
    };
  }, [lang, theme]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
