"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";
import { formatMoney } from "@/lib/money";
import { chartTick, chartGrid } from "./chart-card";
import type { CategorySpend, MonthlyPoint, NetWorthPoint } from "@/hooks/use-analytics";

function shortMonth(month: string): string {
  const d = new Date(`${month}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short" });
}

function MoneyTooltip({
  active,
  payload,
  label,
  currency,
  suffix,
}: {
  active?: boolean;
  payload?: { name?: string | number; value?: number | string }[];
  label?: string | number;
  currency: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{label == null ? "" : String(label)}</p>
      {payload.map((p, i) => (
        <p key={i} className="tabular-nums text-muted-foreground">
          {p.name}: {formatMoney(Number(p.value), currency)}
          {suffix ? ` ${suffix}` : ""}
        </p>
      ))}
    </div>
  );
}

export function IncomeExpenseChart({
  data,
  currency,
}: {
  data: MonthlyPoint[];
  currency: string;
}) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2}>
          <CartesianGrid vertical={false} {...chartGrid} />
          <XAxis dataKey="month" tickFormatter={shortMonth} tick={chartTick} axisLine={false} tickLine={false} />
          <YAxis tick={chartTick} axisLine={false} tickLine={false} width={52} />
          <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.4 }} content={<MoneyTooltip currency={currency} />} />
          <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={22} />
          <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CashflowChart({
  data,
  currency,
}: {
  data: MonthlyPoint[];
  currency: string;
}) {
  const series = data.map((p) => ({ month: p.month, net: p.income - p.expense }));
  const color = "var(--primary)";
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series}>
          <defs>
            <linearGradient id="net" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} {...chartGrid} />
          <XAxis dataKey="month" tickFormatter={shortMonth} tick={chartTick} axisLine={false} tickLine={false} />
          <YAxis tick={chartTick} axisLine={false} tickLine={false} width={52} />
          <Tooltip content={<MoneyTooltip currency={currency} />} />
          <Area type="monotone" dataKey="net" name="Net cash flow" stroke={color} fill="url(#net)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function NetWorthChart({ data, currency }: { data: NetWorthPoint[]; currency: string }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid vertical={false} {...chartGrid} />
          <XAxis dataKey="month" tickFormatter={shortMonth} tick={chartTick} axisLine={false} tickLine={false} />
          <YAxis tick={chartTick} axisLine={false} tickLine={false} width={52} />
          <Tooltip content={<MoneyTooltip currency={currency} />} />
          <Line type="monotone" dataKey="value" name="Net worth" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryDonut({
  data,
  currency,
}: {
  data: CategorySpend[];
  currency: string;
}) {
  const top = data.slice(0, 5);
  const others = data.slice(5).reduce((s, d) => s + d.amount, 0);
  const chartData =
    others > 0 ? [...top, { categoryId: "other", name: "Other", icon: "", color: "#cbd5e1", amount: others }] : top;
  const total = chartData.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-52 w-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="amount" nameKey="name" innerRadius={62} outerRadius={90} paddingAngle={2} strokeWidth={0}>
              {chartData.map((d) => (
                <Cell key={d.categoryId} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<MoneyTooltip currency={currency} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">{formatMoney(total, currency)}</span>
          <span className="text-xs text-muted-foreground">total spent</span>
        </div>
      </div>
      <ul className="w-full space-y-1.5">
        {chartData.map((d) => (
          <li key={d.categoryId} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
            <span className="flex-1 truncate">{d.name}</span>
            <span className="tabular-nums text-muted-foreground">
              {formatMoney(d.amount, currency)}
            </span>
            <span className="w-9 text-right tabular-nums text-muted-foreground/70">
              {total > 0 ? Math.round((d.amount / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Daily spending trend: a smooth area chart across the whole month, with
 * gradient fill and day-of-month axis.
 */
export function DailyTrendChart({
  monthKey,
  dailySpending,
  currency,
}: {
  monthKey: string;
  dailySpending: { date: string; amount: number }[];
  currency: string;
}) {
  const [y, m] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const spendByDay = new Map(dailySpending.map((d) => [Number(d.date.slice(8, 10)), d.amount]));
  const data = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    amount: spendByDay.get(i + 1) ?? 0,
  }));
  const total = dailySpending.reduce((s, d) => s + d.amount, 0);
  const avg = daysInMonth ? total / daysInMonth : 0;

  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <span className="text-xs text-muted-foreground">
          {dailySpending.length} spending day{dailySpending.length === 1 ? "" : "s"} · avg{" "}
          <span className="tabular-nums text-foreground">{formatMoney(avg, currency)}</span>/day
        </span>
        <span className="text-xs text-muted-foreground">
          total <span className="tabular-nums font-medium text-foreground">{formatMoney(total, currency)}</span>
        </span>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="dailySpend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              type="number"
              domain={[1, daysInMonth]}
              ticks={[1, 8, 15, 22, 29, daysInMonth]}
              tick={chartTick}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const amount = Number(payload[0].value);
                return (
                  <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                    <p className="font-medium text-foreground">Day {label}</p>
                    <p className="tabular-nums text-muted-foreground">{formatMoney(amount, currency)}</p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              name="Spent"
              stroke="#f43f5e"
              strokeWidth={2}
              fill="url(#dailySpend)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

