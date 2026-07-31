"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/supabase/query-keys";
import type { Account } from "@/types";
import type { AccountValues } from "@/lib/validations/finance";
import { useAuth } from "@/contexts/auth-context";

const ACCOUNT_SELECT = "*";

export function useAccounts(includeArchived = false) {
  const { user } = useAuth();
  const supabase = createClient();

  const query = useQuery({
    queryKey: [...queryKeys.accounts.list(), { archived: includeArchived }],
    enabled: !!user,
    queryFn: async () => {
      const q = supabase
        .from("accounts")
        .select(ACCOUNT_SELECT)
        .eq("user_id", user!.id);
      if (!includeArchived) q.eq("is_archived", false);
      const { data, error } = await q.order("created_at", { ascending: true });
      if (error) throw error;
      return data as Account[];
    },
  });

  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.accounts.all });

  const createAccount = useMutation({
    mutationFn: async (values: AccountValues) => {
      const { data, error } = await supabase
        .from("accounts")
        .insert({
          user_id: user!.id,
          name: values.name,
          type: values.type,
          balance: values.balance,
          currency_code: values.currencyCode,
          bank_name: values.bankName || null,
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

  const updateAccount = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: AccountValues }) => {
      const { data, error } = await supabase
        .from("accounts")
        .update({
          name: values.name,
          type: values.type,
          balance: values.balance,
          currency_code: values.currencyCode,
          bank_name: values.bankName || null,
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

  const archiveAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("accounts")
        .update({ is_archived: true })
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("accounts")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  return {
    accounts: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createAccount,
    updateAccount,
    archiveAccount,
    deleteAccount,
  };
}
