import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createServerClientInstance } from "@/lib/supabase/server";
import { StatSkeleton } from "@/components/dashboard/stat-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Wallet, Target } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createServerClientInstance();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,currency_code")
    .eq("id", user.id)
    .maybeSingle();

  const name = profile?.full_name || user.email?.split("@")[0] || "there";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Good to see you, {name} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s your financial snapshot. Live numbers arrive in Phase 3.
          </p>
        </div>
      </div>

      {/* Stat tiles (skeleton until real data ships) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>

      {/* Empty-state placeholder for the main content */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="flex gap-3 text-muted-foreground">
            <Wallet className="h-8 w-8" />
            <Target className="h-8 w-8" />
            <ArrowUpRight className="h-8 w-8" />
            <ArrowDownRight className="h-8 w-8" />
          </div>
          <div>
            <p className="text-base font-medium">Your dashboard is coming together</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Add your first transaction in Phase 3 to see balances, budgets,
              and insights appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
