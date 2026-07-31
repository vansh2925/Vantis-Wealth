"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/supabase/query-keys";
import type { SavingsGoal } from "@/types";
import type { GoalValues } from "@/lib/validations/finance";
import { useAuth } from "@/contexts/auth-context";

export function useGoals() {
  const { user } = useAuth();
  const supabase = createClient();

  const query = useQuery({
    queryKey: queryKeys.goals.list(),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("savings_goals")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_archived", false)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as SavingsGoal[];
    },
  });

  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.goals.all });

  const createGoal = useMutation({
    mutationFn: async (values: GoalValues) => {
      const { data, error } = await supabase
        .from("savings_goals")
        .insert({
          user_id: user!.id,
          name: values.name,
          target_amount: values.targetAmount,
          current_amount: values.currentAmount,
          currency_code: values.currencyCode,
          target_date: values.targetDate || null,
          icon: values.icon,
          color: values.color,
          is_archived: values.isArchived,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidate(),
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: GoalValues }) => {
      const { data, error } = await supabase
        .from("savings_goals")
        .update({
          name: values.name,
          target_amount: values.targetAmount,
          current_amount: values.currentAmount,
          currency_code: values.currencyCode,
          target_date: values.targetDate || null,
          icon: values.icon,
          color: values.color,
          is_archived: values.isArchived,
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

  /** Add a contribution to a goal's current amount. */
  const contribute = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const { data, error } = await supabase
        .rpc("contribute_to_goal", {
          p_goal_id: id,
          p_user_id: user!.id,
          p_amount: amount,
        });
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidate(),
  });

  const archiveGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("savings_goals")
        .update({ is_archived: true })
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("savings_goals")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  return {
    goals: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createGoal,
    updateGoal,
    contribute,
    archiveGoal,
    deleteGoal,
  };
}
