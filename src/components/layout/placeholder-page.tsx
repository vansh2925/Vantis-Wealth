import { Hammer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Temporary page for routes whose full implementation lands in a later phase.
 * Kept intentionally simple; replaced module-by-module as phases ship.
 */
export function PlaceholderPage({
  title,
  phase,
}: {
  title: string;
  phase: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Coming in {phase}.
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
            <Hammer className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            This module is under construction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
