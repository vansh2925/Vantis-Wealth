"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/theme-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  settingsSchema,
  type SettingsValues,
} from "@/lib/validations/settings";
import { updateSettings } from "@/app/(app)/actions/settings";
import type { Settings } from "@/types";

const DEFAULTS: SettingsValues = {
  theme: "system",
  language: "en",
  weekStart: "monday",
  dateFormat: "YYYY-MM-DD",
  showIncome: true,
  showExpense: true,
  notifyBudgetAlerts: true,
  notifyGoalReached: true,
  notifyBillsUpcoming: true,
  notifyRecurring: true,
};

export function SettingsForm({ settings }: { settings: Settings | null }) {
  const { setTheme } = useTheme();
  const [pending, setPending] = useState(false);

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings
      ? {
          theme: settings.theme,
          language: settings.language,
          weekStart: settings.week_start as "monday" | "sunday",
          dateFormat: settings.date_format,
          showIncome: settings.show_income,
          showExpense: settings.show_expense,
          notifyBudgetAlerts: settings.notify_budget_alerts,
          notifyGoalReached: settings.notify_goal_reached,
          notifyBillsUpcoming: settings.notify_bills_upcoming,
          notifyRecurring: settings.notify_recurring,
        }
      : DEFAULTS,
  });

  const watch = form.watch();

  // Keep the theme context in sync live as the dropdown changes.
  useEffect(() => {
    setTheme(watch.theme);
  }, [watch.theme, setTheme]);

  async function onSubmit(values: SettingsValues) {
    setPending(true);
    try {
      const result = await updateSettings(values);
      if (result.error) toast.error(result.error);
      else toast.success(result.success ?? "Settings saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Appearance */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium">Appearance</h3>
        <div className="space-y-2">
          <Label>Theme</Label>
          <Select
            value={form.watch("theme")}
            onValueChange={(v) =>
              form.setValue("theme", v as SettingsValues["theme"])
            }
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>First day of week</Label>
          <Select
            value={form.watch("weekStart")}
            onValueChange={(v) =>
              form.setValue("weekStart", v as SettingsValues["weekStart"])
            }
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monday">Monday</SelectItem>
              <SelectItem value="sunday">Sunday</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Display */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium">Display</h3>
        <ToggleRow
          label="Show income in totals"
          checked={form.watch("showIncome")}
          onCheckedChange={(v) => form.setValue("showIncome", v)}
        />
        <ToggleRow
          label="Show expenses in totals"
          checked={form.watch("showExpense")}
          onCheckedChange={(v) => form.setValue("showExpense", v)}
        />
      </section>

      {/* Notifications */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium">Notifications</h3>
        <ToggleRow
          label="Budget alerts"
          checked={form.watch("notifyBudgetAlerts")}
          onCheckedChange={(v) => form.setValue("notifyBudgetAlerts", v)}
        />
        <ToggleRow
          label="Goal reached"
          checked={form.watch("notifyGoalReached")}
          onCheckedChange={(v) => form.setValue("notifyGoalReached", v)}
        />
        <ToggleRow
          label="Upcoming bills"
          checked={form.watch("notifyBillsUpcoming")}
          onCheckedChange={(v) => form.setValue("notifyBillsUpcoming", v)}
        />
        <ToggleRow
          label="Recurring payment reminders"
          checked={form.watch("notifyRecurring")}
          onCheckedChange={(v) => form.setValue("notifyRecurring", v)}
        />
      </section>

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save settings
      </Button>
    </form>
  );
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
