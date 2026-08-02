"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Command as CommandPrimitive } from "cmdk";
import { CornerDownLeft, ArrowLeftRight } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { NAV_ITEMS_FLAT } from "@/lib/constants/navigation";
import { useHotkey } from "@/hooks/use-hotkey";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

type PaletteTxn = {
  id: string;
  type: string;
  amount: number;
  date: string;
  merchant: string | null;
  note: string | null;
  currency_code: string;
  category: { id: string; name: string } | null;
  account: { id: string; name: string } | null;
};

/**
 * Global command palette (Ctrl/Cmd+K or the header search bar).
 * Searches navigation pages AND the user's recent transactions by merchant,
 * note, category, account and amount.
 */
export function CommandMenu() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  useHotkey("k", () => setOpen((o) => !o), { enabled: true });

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("open-command", onOpen);
    return () => window.removeEventListener("open-command", onOpen);
  }, []);

  const { data: txns } = useQuery({
    queryKey: ["command", "transactions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, merchant, note, amount, type, date, currency_code, category:categories(id,name), account:accounts!account_id(id,name)")
        .eq("user_id", user!.id)
        .order("date", { ascending: false })
        .limit(60);
      if (error) throw error;
      return data as PaletteTxn[];
    },
  });

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  const recentTxns = txns?.slice(0, 8) ?? [];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandPrimitive.Input placeholder="Search transactions, pages…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Navigation */}
        <CommandGroup heading="Navigate">
          {NAV_ITEMS_FLAT.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.href}
                value={`nav ${item.title}`}
                onSelect={() => go(item.href)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.title}
              </CommandItem>
            );
          })}
        </CommandGroup>

        {/* Transaction search */}
        {recentTxns.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Transactions">
              {recentTxns.map((t) => {
                const label = t.merchant || t.category?.name || t.account?.name || "Transaction";
                const searchText = [
                  "txn",
                  t.merchant ?? "",
                  t.note ?? "",
                  t.category?.name ?? "",
                  t.account?.name ?? "",
                  t.amount,
                ].join(" ");
                return (
                  <CommandItem key={t.id} value={searchText} onSelect={() => go("/transactions")}>
                    <span className="mr-2 flex h-6 w-6 items-center justify-center rounded bg-muted">
                      {t.type === "transfer" ? (
                        <ArrowLeftRight className="h-3.5 w-3.5 text-blue-500" />
                      ) : (
                        <span
                          className={cn("h-2 w-2 rounded-full", t.type === "income" ? "bg-emerald-500" : "bg-rose-500")}
                        />
                      )}
                    </span>
                    <span className="flex-1 truncate">{label}</span>
                    <span className="ml-auto pl-3 text-xs tabular-nums text-muted-foreground">
                      {t.type === "expense" ? "-" : "+"}
                      {formatMoney(t.amount, t.currency_code)}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Shortcuts">
          <CommandItem value="new-transaction" onSelect={() => go("/transactions")}>
            <CornerDownLeft className="mr-2 h-4 w-4" />
            Quick add transaction
            <span className="ml-auto text-xs text-muted-foreground">Q</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
