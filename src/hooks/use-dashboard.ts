"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { monthRange } from "@/lib/analytics";
import { useAuth } from "@/contexts/auth-context";

export interface DashboardTotals {
  income: number;
  expense: number;
  netWorth: number;
}

/** Lightweight monthly income/expense + current net worth for the dashboard. */
export function useDashboardTotals(monthKey: string) {
  const { user } = useAuth();
  const supabase = createClient();
  const { start, end } = monthRange(monthKey);

  return useQuery({
    queryKey: ["dashboard", "totals", monthKey, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [tx, acct] = await Promise.all([
        supabase.from("transactions").select("type, amount").eq("user_id", user!.id).gte("date", start).lt("date", end),
        supabase.from("accounts").select("balance").eq("user_id", user!.id),
      ]);
      if (tx.error) throw tx.error;
      if (acct.error) throw acct.error;

      let income = 0;
      let expense = 0;
      for (const t of (tx.data ?? []) as { type: string; amount: number }[]) {
        if (t.type === "income") income += Number(t.amount);
        else if (t.type === "expense") expense += Number(t.amount);
      }
      const netWorth = ((acct.data ?? []) as { balance: number }[]).reduce((s, a) => s + Number(a.balance), 0);

      return { income, expense, netWorth } satisfies DashboardTotals;
    },
  });
}
