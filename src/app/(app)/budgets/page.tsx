"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wallet, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
import { BudgetFormDialog } from "@/components/budgets/budget-form-dialog";
import { useBudgets, type BudgetWithSpent } from "@/hooks/use-budgets";
import { useAuth } from "@/contexts/auth-context";
import { formatMoney } from "@/lib/money";
import { categoryIcon } from "@/lib/constants/categories";
import { cn } from "@/lib/utils";

function monthLabel(month: string): string {
  const d = new Date(`${month}T00:00:00`);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function barColor(percent: number) {
  if (percent >= 100) return "bg-rose-500";
  if (percent >= 80) return "bg-amber-500";
  return "bg-emerald-500";
}

function BudgetRow({
  budget,
  currency,
  onEdit,
  onDelete,
}: {
  budget: BudgetWithSpent;
  currency: string;
  onEdit: (b: BudgetWithSpent) => void;
  onDelete: (b: BudgetWithSpent) => void;
}) {
  const Icon = budget.category ? categoryIcon(budget.category.icon) : Wallet;
  const color = budget.category?.color ?? "#64748b";
  const over = budget.remaining < 0;

  return (
    <div className="space-y-2 rounded-lg border px-3 py-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4" style={{ color }} />
          {budget.category?.name ?? "Overall month"}
        </span>
        <span className="flex items-center gap-2">
          {over && (
            <span className="flex items-center gap-1 text-xs font-medium text-rose-600">
              <AlertTriangle className="h-3.5 w-3.5" /> Over by {formatMoney(-budget.remaining, currency)}
            </span>
          )}
          <span className="text-sm tabular-nums text-muted-foreground">
            {formatMoney(budget.spent, currency)} / {formatMoney(budget.amount, currency)}
          </span>
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(budget)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(budget)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </span>
      </div>
      <Progress value={Math.min(budget.percent, 100)} className="h-2" indicatorClassName={barColor(budget.percent)} />
    </div>
  );
}

export default function BudgetsPage() {
  const { profile } = useAuth();
  const currency = profile?.currency_code ?? "INR";
  const month = new Date();
  const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-01`;
  const { budgets, totalSpent, isLoading, deleteBudget } = useBudgets(monthKey);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetWithSpent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BudgetWithSpent | null>(null);

  const overall = budgets.find((b) => b.category_id === null);
  const categoryBudgets = budgets.filter((b) => b.category_id !== null);
  const overallSpent = overall?.spent ?? totalSpent;

  function handleDelete() {
    if (!deleteTarget) return;
    void deleteBudget
      .mutateAsync(deleteTarget.id)
      .then(() => {
        toast.success("Budget removed.");
        setDeleteTarget(null);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Delete failed."));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
          <p className="mt-1 text-sm text-muted-foreground">{monthLabel(monthKey)}</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Set budget
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <>
          {/* Overall budget card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-4 w-4" /> Overall monthly budget
              </CardTitle>
              <CardDescription>Spent vs your whole-month limit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {overall ? (
                <>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-semibold tabular-nums">
                      {formatMoney(overallSpent, currency)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      of {formatMoney(overall.amount, currency)} ·{" "}
                      <span className={overall.remaining < 0 ? "text-rose-600" : "text-emerald-600"}>
                        {overall.remaining >= 0 ? "left" : "over"}{" "}
                        {formatMoney(Math.abs(overall.remaining), currency)}
                      </span>
                    </span>
                  </div>
                  <Progress value={Math.min(overall.percent, 100)} className="h-2.5" indicatorClassName={barColor(overall.percent)} />
                </>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No overall budget set for this month.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Category budgets */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium">By category</h2>
            {categoryBudgets.length === 0 ? (
              <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                No category budgets yet.
              </p>
            ) : (
              categoryBudgets.map((b) => (
                <BudgetRow
                  key={b.id}
                  budget={b}
                  currency={currency}
                  onEdit={setEditing}
                  onDelete={setDeleteTarget}
                />
              ))
            )}
          </div>
        </>
      )}

      <BudgetFormDialog
        open={dialogOpen || !!editing}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
        editing={editing}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this budget?</AlertDialogTitle>
            <AlertDialogDescription>This only removes the limit — it won't delete any transactions.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={cn("bg-destructive text-white hover:bg-destructive/90")}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
