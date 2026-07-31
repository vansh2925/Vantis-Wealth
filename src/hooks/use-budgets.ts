"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/supabase/query-keys";
import type { Budget, Category } from "@/types";
import type { BudgetValues } from "@/lib/validations/finance";
import { useAuth } from "@/contexts/auth-context";

export interface BudgetWithSpent extends Budget {
  spent: number;
  remaining: number;
  percent: number;
  category?: Pick<Category, "id" | "name" | "icon" | "color"> | null;
}

function monthRange(month: string) {
  const start = month.slice(0, 10); // YYYY-MM-DD (first day)
  const d = new Date(`${start}T00:00:00`);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().slice(0, 10);
  return { start, end };
}

export function useBudgets(month: string) {
  const { user } = useAuth();
  const supabase = createClient();

  const { start, end } = monthRange(month);

  const query = useQuery({
    queryKey: [...queryKeys.budgets.all, month],
    enabled: !!user,
    queryFn: async () => {
      const [budgetsRes, spendRes] = await Promise.all([
        supabase
          .from("budgets")
          .select("*, category:categories(id,name,icon,color)")
          .eq("user_id", user!.id)
          .eq("month", start),
        supabase
          .from("transactions")
          .select("category_id, amount")
          .eq("user_id", user!.id)
          .eq("type", "expense")
          .gte("date", start)
          .lt("date", end),
      ]);
      if (budgetsRes.error) throw budgetsRes.error;
      if (spendRes.error) throw spendRes.error;

      const spentByCategory = new Map<string, number>();
      for (const t of spendRes.data ?? []) {
        if (t.category_id) {
          spentByCategory.set(
            t.category_id,
            (spentByCategory.get(t.category_id) ?? 0) + Number(t.amount)
          );
        }
      }

      const budgets: BudgetWithSpent[] = (budgetsRes.data ?? []).map((b) => {
        const spent = b.category_id ? spentByCategory.get(b.category_id) ?? 0 : 0;
        const amount = Number(b.amount);
        return {
          ...b,
          spent,
          remaining: amount - spent,
          percent: amount > 0 ? Math.round((spent / amount) * 100) : 0,
        };
      });

      return { budgets, totalSpent: [...spentByCategory.values()].reduce((a, b) => a + b, 0) };
    },
  });

  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.budgets.all });

  const createBudget = useMutation({
    mutationFn: async (values: BudgetValues) => {
      const { data, error } = await supabase
        .from("budgets")
        .insert({
          user_id: user!.id,
          category_id: values.categoryId ?? null,
          month: values.month.slice(0, 10),
          amount: values.amount,
          currency_code: values.currencyCode,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidate(),
  });

  const updateBudget = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: BudgetValues }) => {
      const { data, error } = await supabase
        .from("budgets")
        .update({
          category_id: values.categoryId ?? null,
          month: values.month.slice(0, 10),
          amount: values.amount,
          currency_code: values.currencyCode,
        })
        .eq("id", id)
        .eq("user_id", user!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidate(),
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  return {
    budgets: query.data?.budgets ?? [],
    totalSpent: query.data?.totalSpent ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    createBudget,
    updateBudget,
    deleteBudget,
  };
}
