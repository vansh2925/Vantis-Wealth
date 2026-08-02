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
import { formatMoney, formatMoneyCompact } from "@/lib/money";
import { useAuth } from "./auth-context";

/**
 * Approximate static rate: how many INR equal one unit of each currency.
 * Used only for the quick INR<->USD display toggle. A live rate service can
 * replace this later without changing call sites.
 */
export const CURRENCY_RATES: Record<string, number> = {
  INR: 1,
  USD: 83,
};

/** The currencies offered by the display toggle. */
export const DISPLAY_CURRENCIES = ["INR", "USD"] as const;
export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

const STORAGE_KEY = "display-currency";

function convert(amount: number, from: string, to: string): number {
  const rFrom = CURRENCY_RATES[from] ?? 1;
  const rTo = CURRENCY_RATES[to] ?? 1;
  return (amount * rFrom) / rTo;
}

interface DisplayCurrencyValue {
  currency: DisplayCurrency;
  format: (amount: number, fromCurrency?: string) => string;
  formatCompact: (amount: number, fromCurrency?: string) => string;
  toggle: () => void;
  setCurrency: (c: DisplayCurrency) => void;
}

const DisplayCurrencyContext = createContext<DisplayCurrencyValue | undefined>(undefined);

export function DisplayCurrencyProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const base: DisplayCurrency = profile?.currency_code === "USD" ? "USD" : "INR";

  // Deterministic initial value matches SSR; stored preference is applied in a
  // mount effect (avoids a hydration mismatch).
  const [currency, setCurrencyState] = useState<DisplayCurrency>(base);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "INR" || stored === "USD") setCurrencyState(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const setCurrency = useCallback((c: DisplayCurrency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setCurrencyState((c) => {
      const next: DisplayCurrency = c === "INR" ? "USD" : "INR";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const format = useCallback(
    (amount: number, fromCurrency?: string) =>
      formatMoney(convert(amount, fromCurrency ?? base, currency), currency),
    [currency, base]
  );

  const formatCompact = useCallback(
    (amount: number, fromCurrency?: string) =>
      formatMoneyCompact(convert(amount, fromCurrency ?? base, currency), currency),
    [currency, base]
  );

  const value = useMemo<DisplayCurrencyValue>(
    () => ({ currency, format, formatCompact, toggle, setCurrency }),
    [currency, format, formatCompact, toggle, setCurrency]
  );

  return (
    <DisplayCurrencyContext.Provider value={value}>
      {children}
    </DisplayCurrencyContext.Provider>
  );
}

export function useMoney() {
  const ctx = useContext(DisplayCurrencyContext);
  if (!ctx) throw new Error("useMoney must be used within a DisplayCurrencyProvider");
  return ctx;
}
