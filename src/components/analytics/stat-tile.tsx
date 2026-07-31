import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  tone?: "default" | "positive" | "negative" | "accent";
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              tone === "positive" && "bg-emerald-500/10 text-emerald-600",
              tone === "negative" && "bg-rose-500/10 text-rose-600",
              tone === "accent" && "bg-blue-500/10 text-blue-600",
              tone === "default" && "bg-muted text-muted-foreground"
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </div>
        </div>
        <p
          className={cn(
            "mt-2 text-2xl font-semibold tabular-nums tracking-tight",
            tone === "positive" && "text-emerald-600",
            tone === "negative" && "text-rose-600"
          )}
        >
          {value}
        </p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
