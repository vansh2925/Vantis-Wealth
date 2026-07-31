"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/supabase/query-keys";
import { useAuth } from "@/contexts/auth-context";

/**
 * Bell with an unread-count badge. Clicking routes to the notifications page
 * (the full notification centre is built out in Phase 4). Fails silently when
 * the DB isn't configured yet.
 */
export function NotificationBell() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const { data: unread = 0 } = useQuery({
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
    retry: false,
  });

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Notifications"
      onClick={() => router.push("/notifications")}
      className="relative"
    >
      <Bell className="h-[18px] w-[18px]" />
      {unread > 0 && (
        <Badge
          variant="destructive"
          className="absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full px-1 text-[10px] font-semibold"
        >
          {unread > 99 ? "99+" : unread}
        </Badge>
      )}
    </Button>
  );
}
