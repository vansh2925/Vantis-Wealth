"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/supabase/query-keys";
import type { Category } from "@/types";
import type { CategoryValues } from "@/lib/validations/finance";
import { useAuth } from "@/contexts/auth-context";

export function useCategories() {
  const { user } = useAuth();
  const supabase = createClient();

  const query = useQuery({
    queryKey: queryKeys.categories.list(),
    enabled: !!user,
    queryFn: async () => {
      // Shared defaults (user_id IS NULL) + the user's own custom ones.
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .or(`user_id.eq.${user!.id},user_id.is.null`)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Category[];
    },
  });

  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.categories.all });

  const createCategory = useMutation({
    mutationFn: async (values: CategoryValues) => {
      const { data, error } = await supabase
        .from("categories")
        .insert({
          user_id: user!.id,
          type: values.type,
          name: values.name,
          icon: values.icon,
          color: values.color,
          parent_id: values.parentId ?? null,
          is_custom: true,
          is_default: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidate(),
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: CategoryValues }) => {
      const { data, error } = await supabase
        .from("categories")
        .update({
          type: values.type,
          name: values.name,
          icon: values.icon,
          color: values.color,
          parent_id: values.parentId ?? null,
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

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  return {
    categories: query.data,
    isLoading: query.isLoading,
    error: query.error,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
