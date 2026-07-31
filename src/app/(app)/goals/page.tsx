"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { GoalFormDialog } from "@/components/goals/goal-form-dialog";
import { useGoals } from "@/hooks/use-goals";
import { useAuth } from "@/contexts/auth-context";
import { formatMoney } from "@/lib/money";
import { categoryIcon } from "@/lib/constants/categories";
import type { SavingsGoal } from "@/types";

function GoalCard({
  goal,
  currency,
  onEdit,
  onDelete,
}: {
  goal: SavingsGoal;
  currency: string;
  onEdit: (g: SavingsGoal) => void;
  onDelete: (g: SavingsGoal) => void;
}) {
  const { contribute } = useGoals();
  const [amount, setAmount] = useState("");
  const percent = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
  const Icon = categoryIcon(goal.icon);
  const done = goal.current_amount >= goal.target_amount;

  function addFunds() {
    const n = Number(amount);
    if (!n || n <= 0) {
      toast.error("Enter a positive amount.");
      return;
    }
    void contribute
      .mutateAsync({ id: goal.id, amount: n })
      .then(() => {
        toast.success("Contribution added.");
        setAmount("");
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not add."));
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: `${goal.color}1a`, color: goal.color }}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="flex items-center gap-2 font-medium leading-tight">
                {goal.name}
                {done && <PartyPopper className="h-4 w-4 text-amber-500" />}
              </p>
              <p className="text-xs text-muted-foreground">
                {goal.target_date
                  ? `Target ${new Date(goal.target_date + "T00:00:00").toLocaleDateString("en-IN")}`
                  : "No deadline"}
              </p>
            </div>
          </div>
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(goal)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(goal)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <div className="flex items-end justify-between">
            <span className="text-lg font-semibold tabular-nums">
              {formatMoney(goal.current_amount, goal.currency_code)}
            </span>
            <span className="text-sm text-muted-foreground">
              of {formatMoney(goal.target_amount, currency)} · {percent}%
            </span>
          </div>
          <Progress
            value={percent}
            className="mt-2 h-2.5"
            indicatorClassName={done ? "bg-emerald-500" : "bg-blue-500"}
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            placeholder="Add funds…"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-9"
          />
          <Button onClick={addFunds} className="h-9">
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GoalsPage() {
  const { profile } = useAuth();
  const { goals, isLoading, deleteGoal } = useGoals();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavingsGoal | null>(null);

  function handleDelete() {
    if (!deleteTarget) return;
    void deleteGoal
      .mutateAsync(deleteTarget.id)
      .then(() => {
        toast.success("Goal deleted.");
        setDeleteTarget(null);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Delete failed."));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Savings goals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {goals.length} active goal{goals.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> New goal
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          No goals yet. Start an emergency fund or a vacation fund.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              currency={profile?.currency_code ?? "INR"}
              onEdit={setEditing}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <GoalFormDialog
        open={dialogOpen || !!editing}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
        editing={editing}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this goal?</AlertDialogTitle>
            <AlertDialogDescription>This removes the goal and its saved amount. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
