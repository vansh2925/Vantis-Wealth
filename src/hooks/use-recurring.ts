"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/supabase/query-keys";
import type { RecurringTransaction } from "@/types";
import type { RecurringValues } from "@/lib/validations/finance";
import { useAuth } from "@/contexts/auth-context";

const SELECT = `*, account:accounts(id,name,color,type), category:categories(id,name,icon,color)`;

/** Compute the first next_run_date for a new template from its start date. */
export function computeNextRun(values: RecurringValues): string {
  const d = new Date(`${values.startDate}T00:00:00`);
  return d.toISOString().slice(0, 10);
}

export function useRecurring() {
  const { user } = useAuth();
  const supabase = createClient();

  const query = useQuery({
    queryKey: queryKeys.recurring.list(),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_transactions")
        .select(SELECT)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (RecurringTransaction & {
        account?: { id: string; name: string; color: string; type: string } | null;
        category?: { id: string; name: string; icon: string; color: string } | null;
      })[];
    },
  });

  const qc = useQueryClient();

  const createRecurring = useMutation({
    mutationFn: async (values: RecurringValues) => {
      const { data, error } = await supabase
        .from("recurring_transactions")
        .insert({
          user_id: user!.id,
          account_id: values.accountId,
          category_id: values.categoryId ?? null,
          type: values.type,
          amount: values.amount,
          currency_code: values.currencyCode,
          merchant: values.merchant || null,
          note: values.note || null,
          frequency: values.frequency,
          interval_every: values.intervalEvery,
          start_date: values.startDate,
          end_date: values.endDate || null,
          next_run_date: computeNextRun(values),
          is_active: true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.recurring.all }),
  });

  const updateRecurring = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: RecurringValues }) => {
      const { data, error } = await supabase
        .from("recurring_transactions")
        .update({
          account_id: values.accountId,
          category_id: values.categoryId ?? null,
          type: values.type,
          amount: values.amount,
          currency_code: values.currencyCode,
          merchant: values.merchant || null,
          note: values.note || null,
          frequency: values.frequency,
          interval_every: values.intervalEvery,
          start_date: values.startDate,
          end_date: values.endDate || null,
        })
        .eq("id", id)
        .eq("user_id", user!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.recurring.all }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("recurring_transactions")
        .update({ is_active: active })
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.recurring.all }),
  });

  const deleteRecurring = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("recurring_transactions")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.recurring.all }),
  });

  /** Run due recurring templates now; returns how many were created. */
  const runDue = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("process_due_recurring", {
        p_user_id: user!.id,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.recurring.all });
      qc.invalidateQueries({ queryKey: queryKeys.transactions.all });
      qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
    },
  });

  return {
    recurring: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createRecurring,
    updateRecurring,
    toggleActive,
    deleteRecurring,
    runDue,
  };
}
