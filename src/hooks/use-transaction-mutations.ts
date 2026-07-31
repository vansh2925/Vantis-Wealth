"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/supabase/query-keys";
import type { TransactionValues } from "@/lib/validations/finance";
import { useAuth } from "@/contexts/auth-context";

function toRpcArgs(values: TransactionValues, userId: string) {
  return {
    p_user_id: userId,
    p_account_id: values.accountId,
    p_transfer_account_id: values.type === "transfer" ? values.transferAccountId! : null,
    p_category_id: values.type === "transfer" ? null : (values.categoryId ?? null),
    p_type: values.type,
    p_amount: values.amount,
    p_currency_code: values.currencyCode,
    p_date: values.date,
    p_merchant: values.merchant || null,
    p_note: values.note || null,
    p_status: values.status,
  };
}

/**
 * Money-write mutations for transactions. All writes go through the
 * transactional RPC functions so balances + analytics stay consistent.
 * These are stable (no query params), so any component can use them.
 */
export function useTransactionMutations() {
  const { user } = useAuth();
  const supabase = createClient();
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: queryKeys.transactions.all });
    qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
    qc.invalidateQueries({ queryKey: queryKeys.categories.all });
  };

  const createTransaction = useMutation({
    mutationFn: async (values: TransactionValues) => {
      const { data, error } = await supabase.rpc("create_transaction", {
        ...toRpcArgs(values, user!.id),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidate(),
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TransactionValues }) => {
      const { data, error } = await supabase.rpc("update_transaction", {
        ...toRpcArgs(values, user!.id),
        p_txn_id: id,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidate(),
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("delete_transaction", {
        p_txn_id: id,
        p_user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        const { error } = await supabase.rpc("delete_transaction", {
          p_txn_id: id,
          p_user_id: user!.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => invalidate(),
  });

  const duplicateTransaction = useMutation({
    mutationFn: async (txn: TransactionValues) => {
      const { data, error } = await supabase.rpc("create_transaction", {
        ...toRpcArgs(txn, user!.id),
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidate(),
  });

  return { createTransaction, updateTransaction, deleteTransaction, bulkDelete, duplicateTransaction };
}
