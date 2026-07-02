"use client";
import * as React from "react";
import type { Locale } from "@/lib/format";
import { formatNumber, formatMoney, formatLocaleDate, toLocaleDigits } from "@/lib/format";
import { messages, type MessageKey } from "@/lib/i18n/messages";

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  t: (key: MessageKey) => string;
  num: (value: number | null | undefined) => string;
  money: (value: number | null | undefined) => string;
  date: (value: Date | string | null | undefined, opts?: Intl.DateTimeFormatOptions) => string;
  digits: (value: string | number) => string;
};

const I18nContext = React.createContext<I18nContextValue | null>(null);
const STORAGE_KEY = "sms.locale";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>("en");

  // Hydrate from localStorage after mount (avoids SSR mismatch).
  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved === "en" || saved === "bn") setLocaleState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = React.useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = React.useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      toggleLocale: () => setLocale(locale === "en" ? "bn" : "en"),
      t: (key) => messages[locale][key] ?? messages.en[key] ?? key,
      num: (v) => formatNumber(v, locale),
      money: (v) => formatMoney(v, locale),
      date: (v, opts) => formatLocaleDate(v, locale, opts),
      digits: (v) => toLocaleDigits(v, locale),
    }),
    [locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
