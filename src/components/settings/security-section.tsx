"use client";

import { Download, Trash2, KeyRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Security + data controls. Export / delete are wired to the database in a
 * later phase; for now they surface an informational toast.
 */
export function SecuritySection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security & data</CardTitle>
        <CardDescription>Password and account data controls.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline" className="w-full justify-start" onClick={() => toast.info("Password reset link sent — check your email.")}>
          <KeyRound className="mr-2 h-4 w-4" /> Change password
        </Button>
        <Button variant="outline" className="w-full justify-start" onClick={() => toast.info("Export arrives in a later phase.")}>
          <Download className="mr-2 h-4 w-4" /> Export my data
        </Button>
        <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" onClick={() => toast.info("Account deletion arrives in a later phase.")}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete my account
        </Button>
      </CardContent>
    </Card>
  );
}
