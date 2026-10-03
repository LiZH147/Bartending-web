"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getDictionary,
  persistLocale,
  translate,
  type Dictionary,
  type Interpolation,
  type Locale,
} from "./dictionaries";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Interpolation) => string;
  enLocale: Locale;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLocale = "en",
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // The locale can change via the URL segment (when the language switcher
  // navigates), so keep state in sync with the prop between navigations.
  useEffect(() => {
    setLocaleState(initialLocale);
    if (typeof document !== "undefined") document.documentElement.lang = initialLocale;
  }, [initialLocale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const dict = getDictionary(locale);
    const fallback = getDictionary("en");
    return {
      locale,
      setLocale,
      enLocale: "en",
      t: (key, vars) => translate(dict, fallback, key, vars),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}

export type { Dictionary, Locale };