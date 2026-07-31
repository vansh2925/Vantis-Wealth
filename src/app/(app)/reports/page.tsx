"use client";

import { useMemo, useState } from "react";
import { Download, TrendingUp, TrendingDown, PiggyBank, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/analytics/stat-tile";
import { useAnalytics } from "@/hooks/use-analytics";
import { useAuth } from "@/contexts/auth-context";
import { formatMoney } from "@/lib/money";
import { currentMonthKey, monthKeys } from "@/lib/analytics";
import { downloadFile } from "@/lib/export";
import { categoryIcon } from "@/lib/constants/categories";

function monthLabel(month: string): string {
  return new Date(`${month}T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default function ReportsPage() {
  const { profile } = useAuth();
  const currency = profile?.currency_code ?? "INR";
  const months = useMemo(() => monthKeys(12), []);
  const [month, setMonth] = useState(currentMonthKey());
  const { data, isLoading } = useAnalytics(month);

  function exportReport() {
    if (!data) return;
    const header = ["Metric", "Value"];
    const rows: (string | number)[][] = [
      ["Month", monthLabel(month)],
      ["Total income", data.income],
      ["Total expense", data.expense],
      ["Net savings", data.netSavings],
      ["Savings rate (%)", data.income > 0 ? Math.round(data.savingsRate) : 0],
      ["Net worth", data.netWorthCurrent],
      [],
      ["Category", "Amount"],
      ...data.expenseByCategory.map((c) => [c.name, c.amount]),
      [],
      ["Merchant", "Date", "Category", "Amount"],
      ...data.largestExpenses.map((t) => [t.merchant ?? "", t.date, t.category?.name ?? "", t.amount]),
    ];
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    downloadFile(`report-${month}.csv`, csv, "text/csv;charset=utf-8");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">A summary of one month, exported or reviewed.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-44">
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
          <Button variant="outline" onClick={exportReport} disabled={isLoading || !data}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Income" value={isLoading ? "—" : formatMoney(data?.income ?? 0, currency)} icon={TrendingUp} tone="positive" />
        <StatTile label="Expense" value={isLoading ? "—" : formatMoney(data?.expense ?? 0, currency)} icon={TrendingDown} tone="negative" />
        <StatTile label="Net savings" value={isLoading ? "—" : formatMoney(data?.netSavings ?? 0, currency)} icon={PiggyBank} tone="accent" />
        <StatTile label="Net worth" value={isLoading ? "—" : formatMoney(data?.netWorthCurrent ?? 0, currency)} icon={Wallet} tone="accent" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category summary</CardTitle>
            <CardDescription>Expenses by category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <Skeleton className="h-40" />
            ) : (data?.expenseByCategory.length ?? 0) === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No expenses this month.</p>
            ) : (
              data!.expenseByCategory.map((c) => {
                const Icon = categoryIcon(c.icon);
                return (
                  <div key={c.categoryId} className="flex items-center gap-3">
                    <Icon className="h-4 w-4" style={{ color: c.color }} />
                    <span className="flex-1 text-sm">{c.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {data!.income > 0 ? Math.round((c.amount / data!.expense) * 100) : 0}%
                    </span>
                    <span className="w-24 text-right tabular-nums font-medium">{formatMoney(c.amount, currency)}</span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Largest expenses</CardTitle>
            <CardDescription>Top 5 outflows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <Skeleton className="h-40" />
            ) : (data?.largestExpenses.length ?? 0) === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No expenses this month.</p>
            ) : (
              data!.largestExpenses.map((t, i) => (
                <div key={t.id} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-xs font-medium">{i + 1}</span>
                  <span className="flex-1 truncate text-sm">{t.merchant || t.category?.name || "Expense"}</span>
                  <span className="text-xs text-muted-foreground">{t.category?.name ?? "—"}</span>
                  <span className="tabular-nums font-medium text-rose-600">{formatMoney(t.amount, currency)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
