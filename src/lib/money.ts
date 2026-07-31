import type { Currency } from "@/types";

/** RFC 4646 locale the app formats numbers for (en-IN gives ₹ 1,23,456.78). */
export const DEFAULT_LOCALE = "en-IN";

const cache = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: string, locale: string): Intl.NumberFormat {
  const key = `${locale}:${currency}`;
  let fmt = cache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    });
    cache.set(key, fmt);
  }
  return fmt;
}

/**
 * Format a numeric amount as a currency string, e.g. 123456.78 + 'INR'
 * → "₹1,23,456.78". Falls back gracefully for unknown codes.
 */
export function formatMoney(
  amount: number,
  currency: string,
  locale: string = DEFAULT_LOCALE
): string {
  try {
    return getFormatter(currency, locale).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/** Compact form for big numbers in stat tiles, e.g. ₹1.2L / $1.2M. */
export function formatMoneyCompact(
  amount: number,
  currency: string,
  locale: string = DEFAULT_LOCALE
): string {
  try {
    const symbol = currencySymbol(currency, locale);
    const abs = Math.abs(amount);
    const sign = amount < 0 ? "-" : "";
    if (abs >= 1_00_00_000) return `${sign}${symbol}${(abs / 1_00_00_000).toFixed(1)}Cr`;
    if (abs >= 1_00_000) return `${sign}${symbol}${(abs / 1_00_000).toFixed(1)}L`;
    if (abs >= 1_000) return `${sign}${symbol}${(abs / 1_000).toFixed(1)}k`;
    return `${sign}${symbol}${abs.toFixed(0)}`;
  } catch {
    return formatMoney(amount, currency, locale);
  }
}

function currencySymbol(currency: string, locale: string): string {
  try {
    return getFormatter(currency, locale)
      .formatToParts(1)
      .find((p) => p.type === "currency")?.value || currency;
  } catch {
    return currency;
  }
}

/** Render a currency symbol/code from a Currency row. */
export function currencyLabel(c: Currency): string {
  return `${c.symbol} ${c.code} — ${c.name}`;
}
