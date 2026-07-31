"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createServerClientInstance } from "@/lib/supabase/server";
import {
  profileSchema,
  settingsSchema,
  type ProfileValues,
  type SettingsValues,
} from "@/lib/validations/settings";

export interface SaveResult {
  error?: string;
  success?: string;
}

export async function updateProfile(values: ProfileValues): Promise<SaveResult> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  const supabase = await createServerClientInstance();

  // Update display fields in profiles, and currency (mirrored to settings).
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      bio: parsed.data.bio || null,
      currency_code: parsed.data.currency,
      onboarded: true,
    })
    .eq("id", user.id);

  if (profileError) return { error: profileError.message };

  const { error: settingsError } = await supabase
    .from("settings")
    .update({ currency_code: parsed.data.currency })
    .eq("user_id", user.id);

  if (settingsError) return { error: settingsError.message };

  revalidatePath("/profile");
  revalidatePath("/settings");
  return { success: "Profile updated." };
}

export async function updateSettings(values: SettingsValues): Promise<SaveResult> {
  const user = await requireUser();
  const parsed = settingsSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  const supabase = await createServerClientInstance();
  const { error } = await supabase
    .from("settings")
    .update({
      theme: parsed.data.theme,
      language: parsed.data.language,
      week_start: parsed.data.weekStart,
      date_format: parsed.data.dateFormat,
      show_income: parsed.data.showIncome,
      show_expense: parsed.data.showExpense,
      notify_budget_alerts: parsed.data.notifyBudgetAlerts,
      notify_goal_reached: parsed.data.notifyGoalReached,
      notify_bills_upcoming: parsed.data.notifyBillsUpcoming,
      notify_recurring: parsed.data.notifyRecurring,
    })
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { success: "Settings saved." };
}
