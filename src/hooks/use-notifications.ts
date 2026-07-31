"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/supabase/query-keys";
import type { Notification } from "@/types";
import { useAuth } from "@/contexts/auth-context";

export function useNotifications() {
  const { user } = useAuth();
  const supabase = createClient();

  const query = useQuery({
    queryKey: queryKeys.notifications.list(),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Notification[];
    },
  });

  const unreadQuery = useQuery({
    queryKey: queryKeys.notifications.unread(),
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: queryKeys.notifications.all });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  const clearAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  return {
    notifications: query.data ?? [],
    unread: unreadQuery.data ?? 0,
    isLoading: query.isLoading,
    markRead,
    markAllRead,
    clearAll,
  };
}
