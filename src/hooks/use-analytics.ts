"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { monthKeys, monthRange } from "@/lib/analytics";
import type { Category } from "@/types";
import { useAuth } from "@/contexts/auth-context";

export interface CategorySpend {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
}

export interface MonthlyPoint {
  month: string;
  income: number;
  expense: number;
}

export interface NetWorthPoint {
  month: string;
  value: number;
}

export interface AnalyticsData {
  income: number;
  expense: number;
  netSavings: number;
  savingsRate: number;
  expenseByCategory: CategorySpend[];
  dailySpending: { date: string; amount: number }[];
  largestExpenses: {
    id: string;
    date: string;
    amount: number;
    merchant: string | null;
    category: Category | null;
  }[];
  monthlySeries: MonthlyPoint[];
  netWorthSeries: NetWorthPoint[];
  netWorthCurrent: number;
  budgets: { categoryId: string | null; amount: number; spent: number }[];
  prevNetSavings: number | null;
  prevExpenseByCategory: Record<string, number>;
}

type RawTxn = {
  id: string;
  date: string;
  amount: number;
  type: string;
  merchant: string | null;
  category_id: string | null;
  category: Pick<Category, "id" | "name" | "icon" | "color"> | null;
};

export function useAnalytics(monthKey: string) {
  const { user } = useAuth();
  const supabase = createClient();
  const queryKey = ["analytics", monthKey, user?.id];

  const query = useQuery<AnalyticsData>({
    queryKey,
    enabled: !!user,
    queryFn: async () => {
      const { start, end } = monthRange(monthKey);
      const prevStart = monthRange(monthKeys(2, monthKey)[0]).start;
      const twelveKeys = monthKeys(12, monthKey);
      const twelveAgo = twelveKeys[0];

      const [cur, prev, analytics, accountsRes, budgetsRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("id, date, amount, type, merchant, category_id, category:categories(id,name,icon,color)")
          .eq("user_id", user!.id)
          .gte("date", start)
          .lt("date", end),
        supabase
          .from("transactions")
          .select("amount, category_id, type")
          .eq("user_id", user!.id)
          .gte("date", prevStart)
          .lt("date", start),
        supabase
          .from("monthly_analytics")
          .select("month, total_income, total_expense, net_savings, net_worth")
          .eq("user_id", user!.id)
          .gte("month", twelveAgo)
          .lte("month", start),
        supabase.from("accounts").select("balance, currency_code").eq("user_id", user!.id),
        supabase
          .from("budgets")
          .select("category_id, amount, category:categories(id,name)")
          .eq("user_id", user!.id)
          .eq("month", start),
      ]);

      if (cur.error) throw cur.error;
      if (prev.error) throw prev.error;
      if (analytics.error) throw analytics.error;
      if (accountsRes.error) throw accountsRes.error;
      if (budgetsRes.error) throw budgetsRes.error;

      const current = (cur.data ?? []) as RawTxn[];

      // Month totals
      let income = 0;
      let expense = 0;
      for (const t of current) {
        if (t.type === "income") income += Number(t.amount);
        else if (t.type === "expense") expense += Number(t.amount);
      }
      const netSavings = income - expense;
      const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;

      // Category breakdown (expenses)
      const catMap = new Map<string, CategorySpend>();
      for (const t of current) {
        if (t.type !== "expense") continue;
        const id = t.category_id ?? "none";
        const existing = catMap.get(id);
        if (existing) {
          existing.amount += Number(t.amount);
        } else {
          catMap.set(id, {
            categoryId: id,
            name: t.category?.name ?? "Uncategorised",
            icon: t.category?.icon ?? "circle-minus",
            color: t.category?.color ?? "#64748b",
            amount: Number(t.amount),
          });
        }
      }
      const expenseByCategory = [...catMap.values()].sort((a, b) => b.amount - a.amount);

      // Daily spending
      const dayMap = new Map<string, number>();
      for (const t of current) {
        if (t.type !== "expense") continue;
        dayMap.set(t.date, (dayMap.get(t.date) ?? 0) + Number(t.amount));
      }
      const dailySpending = [...dayMap.entries()]
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => (a.date < b.date ? -1 : 1));

      // Largest expenses
      const largestExpenses = current
        .filter((t) => t.type === "expense")
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map((t) => ({
          id: t.id as string,
          date: t.date,
          amount: Number(t.amount),
          merchant: t.merchant,
          category: t.category as Category | null,
        }));

      // 12-month income/expense series (fill gaps with zero)
      const anByMonth = new Map(
        (analytics.data ?? []).map((r) => [
          (r as { month: string }).month.slice(0, 10),
          r as { total_income: number; total_expense: number; net_savings: number; net_worth: number },
        ])
      );
      const monthlySeries: MonthlyPoint[] = twelveKeys.map((m) => {
        const r = anByMonth.get(m);
        return {
          month: m,
          income: r ? Number(r.total_income) : 0,
          expense: r ? Number(r.total_expense) : 0,
        };
      });

      const netWorthSeries: NetWorthPoint[] = [];
      for (const m of twelveKeys) {
        const r = anByMonth.get(m);
        if (r) netWorthSeries.push({ month: m, value: Number(r.net_worth) });
      }

      const netWorthCurrent = (accountsRes.data ?? []).reduce(
        (s, a) => s + Number((a as { balance: number }).balance),
        0
      );

      // Budgets + spent (reuse current month expenses by category)
      const spentByCat = new Map<string, number>();
      for (const [id, cs] of catMap) if (id !== "none") spentByCat.set(id, cs.amount);
      const budgets = (budgetsRes.data ?? []).map((b) => {
        const raw = b as { category_id: string | null; amount: number };
        return {
          categoryId: raw.category_id,
          amount: Number(raw.amount),
          spent: raw.category_id ? spentByCat.get(raw.category_id) ?? 0 : expense,
        };
      });

      // Previous month comparison
      const prevTxs = (prev.data ?? []) as { amount: number; category_id: string | null; type: string }[];
      let prevExpense = 0;
      const prevExpenseByCategory: Record<string, number> = {};
      for (const t of prevTxs) {
        if (t.type === "expense") {
          prevExpense += Number(t.amount);
          const id = t.category_id ?? "none";
          prevExpenseByCategory[id] = (prevExpenseByCategory[id] ?? 0) + Number(t.amount);
        }
      }
      let prevIncome = 0;
      for (const t of prevTxs) if (t.type === "income") prevIncome += Number(t.amount);
      const prevNetSavings = prevTxs.length > 0 ? prevIncome - prevExpense : null;

      return {
        income,
        expense,
        netSavings,
        savingsRate,
        expenseByCategory,
        dailySpending,
        largestExpenses,
        monthlySeries,
        netWorthSeries,
        netWorthCurrent,
        budgets,
        prevNetSavings,
        prevExpenseByCategory,
      };
    },
  });

  return { data: query.data, isLoading: query.isLoading, isError: query.isError };
}
