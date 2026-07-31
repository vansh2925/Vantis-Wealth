"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/supabase/query-keys";
import type { TransactionWithRelations } from "@/types";
import type {
  TransactionFilters,
  TransactionSort,
  TransactionSortDir,
} from "@/lib/validations/finance";
import { useAuth } from "@/contexts/auth-context";

export interface TransactionsParams {
  filters: TransactionFilters;
  sort: TransactionSort;
  dir: TransactionSortDir;
  page: number;
  pageSize: number;
}

const SELECT = `*, account:accounts(id,name,type,color), transfer_account:accounts(id,name,type), category:categories(id,name,icon,color,type), transaction_tags(tag:tags(id,name,color))`;

/**
 * Paginated transaction list query with search/filter/sort/relations.
 * Mutations are in useTransactionMutations (stable, query-independent).
 */
export function useTransactions({
  filters,
  sort,
  dir,
  page,
  pageSize,
}: TransactionsParams) {
  const { user } = useAuth();
  const supabase = createClient();

  const query = useQuery({
    queryKey: queryKeys.transactions.list({ filters, sort, dir, page, pageSize }),
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from("transactions")
        .select(SELECT, { count: "exact" })
        .eq("user_id", user!.id);

      if (filters.search) {
        q = q.or(`merchant.ilike.%${filters.search}%,note.ilike.%${filters.search}%`);
      }
      if (filters.type !== "all") q = q.eq("type", filters.type);
      if (filters.accountId !== "all") q = q.eq("account_id", filters.accountId);
      if (filters.categoryId !== "all") q = q.eq("category_id", filters.categoryId);
      if (filters.status !== "all") q = q.eq("status", filters.status);

      q = q.order(sort === "amount" ? "amount" : "date", {
        ascending: dir === "asc",
      });

      const from = (page - 1) * pageSize;
      q = q.range(from, from + pageSize - 1);

      const { data, error, count } = await q;
      if (error) throw error;
      // Supabase embeds tags as transaction_tags: { tag: {...} }[] — flatten to tags.
      type RawRow = TransactionWithRelations & {
        transaction_tags?: { tag: TransactionWithRelations["tags"][number] }[];
      };
      const rows = ((data ?? []) as unknown as RawRow[]).map((r) => ({
        ...r,
        tags: r.transaction_tags?.map((tt) => tt.tag) ?? [],
      }));
      return { rows, count: count ?? 0 };
    },
  });

  return {
    rows: query.data?.rows ?? [],
    count: query.data?.count ?? 0,
    isLoading: query.isLoading,
    isError: !!query.error,
    error: query.error,
    refetch: query.refetch,
  };
}
