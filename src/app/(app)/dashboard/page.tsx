"use client";

import Link from "next/link";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowLeftRight, CalendarClock, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/analytics/stat-tile";
import { useAuth } from "@/contexts/auth-context";
import { useDashboardTotals } from "@/hooks/use-dashboard";
import { useBudgets } from "@/hooks/use-budgets";
import { useGoals } from "@/hooks/use-goals";
import { useRecurring } from "@/hooks/use-recurring";
import { useRecentTransactions } from "@/hooks/use-recent-transactions";
import { formatMoney } from "@/lib/money";
import { currentMonthKey } from "@/lib/analytics";
import { categoryIcon } from "@/lib/constants/categories";
import { cn } from "@/lib/utils";
import type { TransactionWithRelations } from "@/types";

const month = currentMonthKey();
const monthLabel = new Date(`${month}T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const currency = profile?.currency_code ?? "INR";
  const name = profile?.full_name || user?.email?.split("@")[0] || "there";

  const totals = useDashboardTotals(month);
  const { budgets } = useBudgets(month);
  const { goals } = useGoals();
  const { recurring } = useRecurring();
  const recent = useRecentTransactions(6);

  const overall = budgets.find((b) => b.category_id === null);
  const categoryBudgets = budgets.filter((b) => b.category_id !== null).slice(0, 4);
  const topGoals = goals.slice(0, 3);
  const upcomingBills = recurring
    .filter((r) => r.is_active && r.next_run_date && r.next_run_date >= month)
    .sort((a, b) => (a.next_run_date! < b.next_run_date! ? -1 : 1))
    .slice(0, 5);

  const income = totals.data?.income ?? 0;
  const expense = totals.data?.expense ?? 0;
  const netSavings = income - expense;
  const savingsRate = income > 0 ? Math.round((netSavings / income) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Good to see you, {name} 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">{monthLabel}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total balance" value={totals.isLoading ? "—" : formatMoney(totals.data?.netWorth ?? 0, currency)} icon={Wallet} tone="accent" />
        <StatTile label="Income" value={totals.isLoading ? "—" : formatMoney(income, currency)} icon={TrendingUp} tone="positive" />
        <StatTile label="Expense" value={totals.isLoading ? "—" : formatMoney(expense, currency)} icon={TrendingDown} tone="negative" />
        <StatTile label="Net savings" value={totals.isLoading ? "—" : formatMoney(netSavings, currency)} icon={PiggyBank} sub={income > 0 ? `${savingsRate}% of income` : undefined} tone={netSavings >= 0 ? "accent" : "negative"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Budgets */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Budget</CardTitle>
            <Link href="/budgets" className="text-sm text-primary hover:underline">Manage</Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {overall ? (
              <div>
                <div className="flex items-end justify-between">
                  <span className="text-lg font-semibold tabular-nums">{formatMoney(overall.spent, currency)}</span>
                  <span className="text-xs text-muted-foreground">of {formatMoney(overall.amount, currency)}</span>
                </div>
                <Progress value={Math.min(overall.percent, 100)} className="mt-2 h-2" indicatorClassName={overall.remaining < 0 ? "bg-rose-500" : "bg-emerald-500"} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No monthly budget set.</p>
            )}
            <div className="space-y-3">
              {categoryBudgets.map((b) => {
                const Icon = b.category ? categoryIcon(b.category.icon) : Wallet;
                return (
                  <div key={b.id} className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0" style={{ color: b.category?.color }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between text-xs">
                        <span className="truncate">{b.category?.name ?? "Overall"}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {formatMoney(b.spent, currency)} / {formatMoney(b.amount, currency)}
                        </span>
                      </div>
                      <Progress value={Math.min(b.percent, 100)} className="mt-1 h-1.5" indicatorClassName={b.remaining < 0 ? "bg-rose-500" : "bg-blue-500"} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Goals */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base"><Target className="h-4 w-4" /> Goals</CardTitle>
            <Link href="/goals" className="text-sm text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {topGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No goals yet.</p>
            ) : (
              topGoals.map((g) => {
                const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
                const Icon = categoryIcon(g.icon);
                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <Icon className="h-4 w-4" style={{ color: g.color }} />
                        {g.name}
                      </span>
                      <span className="tabular-nums text-muted-foreground">{pct}%</span>
                    </div>
                    <Progress value={pct} className="mt-1.5 h-1.5" indicatorClassName="bg-emerald-500" />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Upcoming bills */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base"><CalendarClock className="h-4 w-4" /> Upcoming bills</CardTitle>
            <Link href="/recurring" className="text-sm text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingBills.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
            ) : (
              upcomingBills.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <span className="truncate font-medium">{r.merchant || "Recurring"}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{r.next_run_date?.slice(8, 10)} {new Date(r.next_run_date! + "T00:00:00").toLocaleDateString("en-IN", { month: "short" })}</span>
                    <span className={cn("tabular-nums font-medium", r.type === "income" ? "text-emerald-600" : "text-rose-600")}>
                      {r.type === "income" ? "+" : "-"}{formatMoney(r.amount, r.currency_code || currency)}
                    </span>
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Recent transactions</CardTitle>
          <Link href="/transactions" className="text-sm text-primary hover:underline">View all</Link>
        </CardHeader>
        <CardContent className="space-y-1">
          {recent.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : recent.data?.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            recent.data?.map((t) => <TransactionRow key={t.id} txn={t} currency={currency} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TransactionRow({ txn, currency }: { txn: TransactionWithRelations; currency: string }) {
  const CatIcon = txn.category ? categoryIcon(txn.category.icon) : null;
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/40">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        {txn.type === "transfer" ? (
          <ArrowLeftRight className="h-4 w-4 text-blue-500" />
        ) : txn.type === "income" ? (
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-rose-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{txn.merchant || txn.category?.name || "Transaction"}</p>
        <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
          {CatIcon && <CatIcon className="h-3 w-3" style={{ color: txn.category?.color }} />}
          {txn.category?.name ?? txn.account?.name ?? txn.date}
          {txn.category && txn.account ? ` · ${txn.account.name}` : ""}
        </p>
      </div>
      <div className="flex flex-col items-end">
        <span className={cn("tabular-nums text-sm font-semibold", txn.type === "income" && "text-emerald-600", txn.type === "expense" && "text-rose-600", txn.type === "transfer" && "text-blue-600")}>
          {txn.type === "expense" ? "-" : "+"}{formatMoney(txn.amount, txn.currency_code || currency)}
        </span>
        <span className="text-xs text-muted-foreground">{txn.date}</span>
      </div>
    </div>
  );
}
