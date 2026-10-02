"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DICT } from "./i18n-dict";
import { setDateLang } from "./utils";

/** Site dilleri: Türkçe · Kurmancî · Zazakî */
export type Lang = "tr" | "ku" | "za";
export const LANGS: { key: Lang; short: string; label: string; html: string }[] = [
  { key: "tr", short: "TR", label: "Türkçe", html: "tr" },
  { key: "ku", short: "KU", label: "Kurmancî", html: "ku" },
  { key: "za", short: "ZA", label: "Zazakî", html: "zza" },
];
const STORAGE_KEY = "dgl:lang";

type Vars = Record<string, string | number>;
type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (s: string, vars?: Vars) => string };

function translate(lang: Lang, s: string, vars?: Vars) {
  let out = s;
  if (lang !== "tr") {
    const row = DICT[s];
    if (row) out = (lang === "ku" ? row[0] : row[1]) || s;
  }
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
  return out;
}

const LangContext = createContext<Ctx>({ lang: "tr", setLang: () => {}, t: (s, v) => translate("tr", s, v) });

export function LangProvider({ children }: { children: ReactNode }) {
  const [chosen, setLangState] = useState<Lang>("tr");
  // Yönetim paneli her zaman Türkçe
  const lang: Lang = usePathname().startsWith("/yonetim") ? "tr" : chosen;
  setDateLang(lang);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved && LANGS.some((l) => l.key === saved)) setLangState(saved);
    } catch { /* depolama kapalı olabilir */ }
  }, []);

  useEffect(() => {
    document.documentElement.lang = LANGS.find((l) => l.key === lang)?.html ?? "tr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* yok say */ }
  }, []);

  const value = useMemo<Ctx>(() => ({ lang, setLang, t: (s, v) => translate(lang, s, v) }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
export const useT = () => useContext(LangContext).t;

/** JSX içinde kısa kullanım: <T>Başvur</T> */
export function T({ children, vars }: { children: string; vars?: Vars }) {
  return <>{useT()(children, vars)}</>;
}
