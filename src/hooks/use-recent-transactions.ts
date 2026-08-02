"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/supabase/query-keys";
import type { TransactionWithRelations } from "@/types";
import { useAuth } from "@/contexts/auth-context";

const SELECT = `*, account:accounts(id,name,type,color), category:categories(id,name,icon,color), transaction_tags(tag:tags(id,name,color))`;

/** Latest N transactions (for the dashboard and elsewhere). */
export function useRecentTransactions(limit = 6) {
  const { user } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ["transactions", "recent", limit, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(SELECT)
        .eq("user_id", user!.id)
        .order("date", { ascending: false })
        .limit(limit);
      if (error) throw error;
      type Raw = TransactionWithRelations & { transaction_tags?: { tag: TransactionWithRelations["tags"][number] }[] };
      const rows = ((data ?? []) as unknown as Raw[]).map((r) => ({
        ...r,
        tags: r.transaction_tags?.map((t) => t.tag) ?? [],
      }));
      return rows as TransactionWithRelations[];
    },
  });
}
