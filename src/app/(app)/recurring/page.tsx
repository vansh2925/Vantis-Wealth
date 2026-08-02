"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Play, Repeat, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RecurringFormDialog } from "@/components/recurring/recurring-form-dialog";
import { useRecurring } from "@/hooks/use-recurring";
import { useAuth } from "@/contexts/auth-context";
import { useMoney } from "@/contexts/display-currency-context";
import { categoryIcon } from "@/lib/constants/categories";
import { cn } from "@/lib/utils";
import type { RecurringTransaction } from "@/types";

const FREQ_LABEL: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export default function RecurringPage() {
  const { profile } = useAuth();
  const { format } = useMoney();
  const currency = profile?.currency_code ?? "INR";
  const { recurring, isLoading, toggleActive, deleteRecurring, runDue } = useRecurring();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringTransaction | null>(null);

  function handleRunDue() {
    void runDue
      .mutateAsync()
      .then((n) => toast.success(`Created ${n} transaction${n === 1 ? "" : "s"}.`))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Run failed."));
  }

  function handleDelete() {
    if (!deleteTarget) return;
    void deleteRecurring
      .mutateAsync(deleteTarget.id)
      .then(() => {
        toast.success("Recurring removed.");
        setDeleteTarget(null);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Delete failed."));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recurring transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bills and income that repeat automatically.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRunDue} disabled={runDue.isPending}>
            {runDue.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run due
          </Button>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> New
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : recurring.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          No recurring transactions yet. Add rent, subscriptions or salary.
        </div>
      ) : (
        <div className="space-y-2">
          {recurring.map((r) => {
            const CatIcon = r.category ? categoryIcon(r.category.icon) : Repeat;
            const isIncome = r.type === "income";
            return (
              <Card key={r.id} className={cn(!r.is_active && "opacity-60")}>
                <CardContent className="flex items-center gap-4 py-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background: r.category ? `${r.category.color}1a` : "var(--muted)",
                      color: r.category?.color,
                    }}
                  >
                    {CatIcon ? <CatIcon className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-medium">
                      {r.merchant || "Recurring"}
                      <Badge variant="secondary" className="capitalize">
                        {FREQ_LABEL[r.frequency]}
                        {r.interval_every > 1 ? ` · every ${r.interval_every}` : ""}
                      </Badge>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.account?.name ?? "No account"} · next run: {r.next_run_date ?? "—"}
                      {r.note ? ` · ${r.note}` : ""}
                    </p>
                  </div>
                  <div className={cn("text-right font-semibold tabular-nums", isIncome ? "text-emerald-600" : "text-rose-600")}>
                    {isIncome ? "+" : "-"}
                    {format(r.amount, r.currency_code || currency)}
                  </div>
                  <Switch
                    checked={r.is_active}
                    onCheckedChange={(v) =>
                      void toggleActive
                        .mutateAsync({ id: r.id, active: v })
                        .catch((e) => toast.error(e instanceof Error ? e.message : "Update failed."))
                    }
                    aria-label="Active"
                  />
                  <div className="flex gap-0.5">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(r)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <RecurringFormDialog
        open={dialogOpen || !!editing}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
        editing={editing}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this recurring transaction?</AlertDialogTitle>
            <AlertDialogDescription>Future runs will stop. Already-created transactions stay.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
