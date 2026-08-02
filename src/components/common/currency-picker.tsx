"use client";

import { cn } from "@/lib/utils";

const OPTIONS = [
  { code: "INR", symbol: "₹", label: "INR" },
  { code: "USD", symbol: "$", label: "USD" },
] as const;

/**
 * INR/USD segmented toggle for choosing a record's currency. Kept tiny so it
 * can sit in any form. If `value` is a currency outside INR/USD (e.g. a base
 * currency not offered here), no option is highlighted but the stored value is
 * preserved until the user picks INR or USD.
 */
export function CurrencyPicker({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (code: string) => void;
}) {
  return (
    <div className="grid w-fit grid-cols-2 gap-1 rounded-lg bg-muted p-1">
      {OPTIONS.map((opt) => {
        const active = value === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => onValueChange(opt.code)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="text-xs">{opt.symbol}</span>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
