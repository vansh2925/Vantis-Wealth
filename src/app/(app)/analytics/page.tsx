"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, PiggyBank, Sparkles, Wallet } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/analytics/stat-tile";
import { ChartCard } from "@/components/charts/chart-card";

// Code-split the heavy Recharts bundle — loaded only on the analytics page.
const IncomeExpenseChart = dynamic(
  () => import("@/components/charts/charts").then((m) => m.IncomeExpenseChart),
  { ssr: false, loading: () => <Skeleton className="h-72" /> }
);
const CashflowChart = dynamic(
  () => import("@/components/charts/charts").then((m) => m.CashflowChart),
  { ssr: false, loading: () => <Skeleton className="h-64" /> }
);
const CategoryDonut = dynamic(
  () => import("@/components/charts/charts").then((m) => m.CategoryDonut),
  { ssr: false, loading: () => <Skeleton className="h-64" /> }
);
const NetWorthChart = dynamic(
  () => import("@/components/charts/charts").then((m) => m.NetWorthChart),
  { ssr: false, loading: () => <Skeleton className="h-64" /> }
);
const Heatmap = dynamic(
  () => import("@/components/charts/charts").then((m) => m.Heatmap),
  { ssr: false, loading: () => <Skeleton className="h-40" /> }
);
import { useAnalytics } from "@/hooks/use-analytics";
import { useAuth } from "@/contexts/auth-context";
import { useMoney } from "@/contexts/display-currency-context";
import {
  currentMonthKey,
  monthKeys,
  generateInsights,
  financialHealthScore,
  isOptionalCategory,
  type Insight,
} from "@/lib/analytics";
import { cn } from "@/lib/utils";

function monthLabel(month: string): string {
  return new Date(`${month}T00:00:00`).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

const TONE_STYLE: Record<Insight["tone"], string> = {
  good: "border-emerald-500/30 bg-emerald-500/5",
  warning: "border-amber-500/30 bg-amber-500/5",
  info: "border-blue-500/30 bg-blue-500/5",
};

export default function AnalyticsPage() {
  const { profile } = useAuth();
  const { format } = useMoney();
  const currency = profile?.currency_code ?? "INR";
  const months = useMemo(() => monthKeys(12), []);
  const [month, setMonth] = useState(currentMonthKey());
  const { data, isLoading } = useAnalytics(month);

  const insights = useMemo(() => {
    if (!data) return [];
    const nameById = new Map(data.expenseByCategory.map((c) => [c.categoryId, c.name]));
    const expByCat: Record<string, number> = {};
    for (const c of data.expenseByCategory) expByCat[c.categoryId] = c.amount;
    const optional = data.expenseByCategory
      .filter((c) => isOptionalCategory(c.name))
      .sort((a, b) => b.amount - a.amount)[0];
    return generateInsights({
      currency,
      income: data.income,
      expense: data.expense,
      prevExpenseByCategory: data.prevExpenseByCategory,
      expenseByCategory: expByCat,
      categoryName: (id) => nameById.get(id) ?? "a category",
      budgets: data.budgets,
      largestOptionalSpend: optional?.amount ?? null,
      prevNetSavings: data.prevNetSavings,
      netSavings: data.netSavings,
    });
  }, [data, currency]);

  const health = useMemo(() => {
    if (!data) return null;
    return financialHealthScore({
      income: data.income,
      expense: data.expense,
      budgetTotal: data.budgets.reduce((s, b) => s + b.amount, 0),
      budgetUsed: data.budgets.reduce((s, b) => s + b.spent, 0),
      netWorth: data.netWorthCurrent,
      hasHistory: data.monthlySeries.some((m) => m.income > 0 || m.expense > 0),
    });
  }, [data]);

  const healthColor = health ? (health.score >= 70 ? "text-emerald-600" : health.score >= 40 ? "text-amber-600" : "text-rose-600") : "text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your money at a glance.</p>
        </div>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-40">
            <SelectValue>{monthLabel(month)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m} value={m}>
                {monthLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total income" value={isLoading ? "—" : format(data?.income ?? 0, currency)} icon={TrendingUp} tone="positive" />
        <StatTile label="Total expense" value={isLoading ? "—" : format(data?.expense ?? 0, currency)} icon={TrendingDown} tone="negative" />
        <StatTile label="Net savings" value={isLoading ? "—" : format(data?.netSavings ?? 0, currency)} icon={PiggyBank} sub={data && data.income > 0 ? `${Math.round(data.savingsRate)}% of income` : undefined} tone={(data?.netSavings ?? 0) >= 0 ? "accent" : "negative"} />
        <StatTile label="Net worth" value={isLoading ? "—" : format(data?.netWorthCurrent ?? 0, currency)} icon={Wallet} tone="accent" />
      </div>

      {/* Insights */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4" /> Smart insights
        </h2>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : insights.length === 0 ? (
          <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            Add a few transactions to see insights.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {insights.map((ins) => (
              <div key={ins.id} className={cn("rounded-xl border p-4", TONE_STYLE[ins.tone])}>
                <p className="text-sm font-medium">{ins.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{ins.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Health + charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Financial health" description="An explainable 0–100 score" className="lg:col-span-1">
          {isLoading || !health ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Not enough data yet.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <span className={cn("text-4xl font-bold tabular-nums", healthColor)}>{health.score}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
              <div className="space-y-3">
                {health.factors.map((f) => (
                  <div key={f.label}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{f.label}</span>
                      <span className="text-muted-foreground">{Math.round(f.score * 100)}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-emerald-500"
                        style={{ width: `${f.score * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Income vs expenses" description="Last 12 months" className="lg:col-span-2">
          {isLoading ? <Skeleton className="h-72" /> : <IncomeExpenseChart data={data!.monthlySeries} currency={currency} />}
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Category breakdown" description="Where it went this month">
          {isLoading ? <Skeleton className="h-64" /> : <CategoryDonut data={data!.expenseByCategory} currency={currency} />}
        </ChartCard>

        <ChartCard title="Daily spending" description={monthLabel(month)}>
          {isLoading ? <Skeleton className="h-40" /> : <Heatmap monthKey={month} dailySpending={data!.dailySpending} currency={currency} />}
          <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="h-3 w-3 rounded bg-muted" /> none
            <span className="ml-2 h-3 w-3 rounded bg-emerald-300" /> low
            <span className="ml-2 h-3 w-3 rounded bg-emerald-600" /> medium
            <span className="ml-2 h-3 w-3 rounded bg-amber-500" /> high
            <span className="ml-2 h-3 w-3 rounded bg-rose-500" /> highest
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Cash flow" description="Net (income − expense) per month">
          {isLoading ? <Skeleton className="h-64" /> : <CashflowChart data={data!.monthlySeries} currency={currency} />}
        </ChartCard>

        <ChartCard title="Net worth trend" description="Assets minus liabilities">
          {isLoading ? <Skeleton className="h-64" /> : data!.netWorthSeries.length === 0 ? (
            <p className="py-20 text-center text-sm text-muted-foreground">No history yet.</p>
          ) : (
            <NetWorthChart data={data!.netWorthSeries} currency={currency} />
          )}
        </ChartCard>
      </div>

      {/* Largest expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Largest expenses</CardTitle>
          <CardDescription>This month's biggest outflows</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <Skeleton className="h-24" />
          ) : data!.largestExpenses.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No expenses recorded.</p>
          ) : (
            data!.largestExpenses.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-xs font-medium">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.merchant || t.category?.name || "Expense"}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.category?.name ?? "—"} · {t.date}
                  </p>
                </div>
                <span className="tabular-nums font-semibold text-rose-600">{format(t.amount, currency)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
