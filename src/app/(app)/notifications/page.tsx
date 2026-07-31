"use client";

import { toast } from "sonner";
import { Bell, CheckCheck, Trash2, Wallet, PiggyBank, Repeat, CalendarClock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import type { Notification, NotificationType } from "@/types";

const TYPE_META: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  budget_alert: { icon: Wallet, color: "#f59e0b" },
  goal_reached: { icon: PiggyBank, color: "#10b981" },
  bill_upcoming: { icon: CalendarClock, color: "#3b82f6" },
  recurring_reminder: { icon: Repeat, color: "#8b5cf6" },
  system: { icon: Sparkles, color: "#64748b" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

export default function NotificationsPage() {
  const { notifications, isLoading, markRead, markAllRead, clearAll } = useNotifications();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Alerts about budgets, goals and bills.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void markAllRead.mutateAsync().then(() => toast.success("All marked read."))}
            disabled={notifications.length === 0}
          >
            <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => void clearAll.mutateAsync().then(() => toast.success("Cleared."))}
            disabled={notifications.length === 0}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Clear all
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">You're all caught up.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.system;
            const Icon = meta.icon;
            return (
              <Card
                key={n.id}
                className={cn("cursor-pointer transition-colors hover:bg-muted/40", !n.is_read && "border-primary/40")}
                onClick={() => !n.is_read && void markRead.mutateAsync(n.id)}
              >
                <CardContent className="flex items-start gap-3 py-3">
                  <div
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${meta.color}1a`, color: meta.color }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{n.title}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                    {n.body && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                    )}
                  </div>
                  {!n.is_read && <Badge variant="default" className="shrink-0">New</Badge>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
