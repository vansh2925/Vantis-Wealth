"use client";

import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMoney } from "@/contexts/display-currency-context";
import { cn } from "@/lib/utils";

const SYMBOL: Record<string, string> = { INR: "₹", USD: "$" };

/**
 * Sidebar toggle that switches displayed amounts between the user's currency
 * and the other one (INR <-> USD), converting values on the fly.
 */
export function CurrencyToggle({ collapsed }: { collapsed?: boolean }) {
  const { currency, toggle } = useMoney();
  const symbol = SYMBOL[currency] ?? currency;

  const button = (
    <Button
      variant="ghost"
      onClick={toggle}
      className={cn("h-9 w-full justify-start gap-2 px-2", collapsed && "justify-center px-0")}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs font-semibold">
        {symbol}
      </span>
      {!collapsed && (
        <span className="flex min-w-0 flex-col items-start text-left">
          <span className="text-xs font-medium">Display currency</span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            {currency} <ArrowRightLeft className="h-3 w-3" />
            {currency === "INR" ? "USD" : "INR"}
          </span>
        </span>
      )}
    </Button>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">Switch to {currency === "INR" ? "USD" : "INR"}</TooltipContent>
      </Tooltip>
    );
  }
  return button;
}
