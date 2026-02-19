import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Lang } from './types';
import { en, type TranslationKey } from './en-US';
import { ko } from './ko-KR';

// ─── Dictionary lookup ────────────────────────────────────────────────────────
const DICTS: Record<Lang, Record<TranslationKey, string>> = {
  'en-US': en as Record<TranslationKey, string>,
  'ko-KR': ko,
};

// ─── Detect initial language ──────────────────────────────────────────────────
function detectLang(): Lang {
  const stored = localStorage.getItem('lorekit-lang');
  if (stored === 'en-US' || stored === 'ko-KR') return stored;
  return navigator.language.startsWith('ko') ? 'ko-KR' : 'en-US';
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface LangContextValue {
  lang:    Lang;
  setLang: (l: Lang) => void;
  t:       (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  function setLang(l: Lang) {
    localStorage.setItem('lorekit-lang', l);
    setLangState(l);
  }

  function t(key: TranslationKey, vars?: Record<string, string | number>): string {
    let str = DICTS[lang][key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return str;
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}

export type { Lang, TranslationKey };
