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
import { useQuery } from "@tanstack/react-query";
import { formatMoney, formatMoneyCompact } from "@/lib/money";
import { useAuth } from "./auth-context";

/**
 * Static fallback rate: how many INR equal one unit of each currency.
 * Used only if the live rate fetch fails (offline / API down).
 */
export const CURRENCY_RATES: Record<string, number> = {
  INR: 1,
  USD: 83,
};

/** The currencies offered by the display toggle. */
export const DISPLAY_CURRENCIES = ["INR", "USD"] as const;
export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

const STORAGE_KEY = "display-currency";

/** Free, keyless, CORS-enabled rate source (ECB via Frankfurter). */
const RATE_URL = "https://api.frankfurter.dev/v1/latest?from=USD&to=INR";
const RATE_STALE_MS = 60 * 60 * 1000; // 1 hour

/** Fetch live "how many INR per 1 USD". Throws so react-query can retry/fallback. */
async function fetchInrPerUsd(): Promise<number> {
  const res = await fetch(RATE_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Rate service responded ${res.status}`);
  const json = (await res.json()) as { rates?: { INR?: number } };
  const rate = Number(json?.rates?.INR);
  if (!Number.isFinite(rate) || rate <= 0) throw new Error("Invalid rate from service");
  return rate;
}

interface DisplayCurrencyValue {
  currency: DisplayCurrency;
  /** Live INR-per-USD rate (falls back to the static rate on failure). */
  rate: number;
  format: (amount: number, fromCurrency?: string) => string;
  formatCompact: (amount: number, fromCurrency?: string) => string;
  toggle: () => void;
  setCurrency: (c: DisplayCurrency) => void;
}

const DisplayCurrencyContext = createContext<DisplayCurrencyValue | undefined>(undefined);

export function DisplayCurrencyProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const base: DisplayCurrency = profile?.currency_code === "USD" ? "USD" : "INR";

  // Live rate with an hourly stale/refetch window. On failure the fallback
  // static rate is used, so the app never breaks if the API is unreachable.
  const { data: liveRate } = useQuery({
    queryKey: ["fx-rate", "USD", "INR"],
    staleTime: RATE_STALE_MS,
    refetchInterval: RATE_STALE_MS,
    queryFn: fetchInrPerUsd,
    retry: 1,
  });

  const rate = liveRate ?? CURRENCY_RATES.USD;

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

  const convert = useCallback(
    (amount: number, from: string, to: string): number => {
      const rFrom = from === "USD" ? rate : from === "INR" ? 1 : CURRENCY_RATES[from] ?? 1;
      const rTo = to === "USD" ? rate : to === "INR" ? 1 : CURRENCY_RATES[to] ?? 1;
      return (amount * rFrom) / rTo;
    },
    [rate]
  );

  const format = useCallback(
    (amount: number, fromCurrency?: string) =>
      formatMoney(convert(amount, fromCurrency ?? base, currency), currency),
    [convert, currency, base]
  );

  const formatCompact = useCallback(
    (amount: number, fromCurrency?: string) =>
      formatMoneyCompact(convert(amount, fromCurrency ?? base, currency), currency),
    [convert, currency, base]
  );

  const value = useMemo<DisplayCurrencyValue>(
    () => ({ currency, rate, format, formatCompact, toggle, setCurrency }),
    [currency, rate, format, formatCompact, toggle, setCurrency]
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
