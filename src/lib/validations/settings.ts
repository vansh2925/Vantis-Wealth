import { z } from "zod";

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be under 80 characters."),
  currency: z.string().min(3, "Select a currency."),
  bio: z.string().trim().max(240, "Bio must be under 240 characters.").optional(),
});

export const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  language: z.string().min(2),
  weekStart: z.enum(["monday", "sunday"]),
  dateFormat: z.string().min(1),
  showIncome: z.boolean(),
  showExpense: z.boolean(),
  notifyBudgetAlerts: z.boolean(),
  notifyGoalReached: z.boolean(),
  notifyBillsUpcoming: z.boolean(),
  notifyRecurring: z.boolean(),
});

export type ProfileValues = z.infer<typeof profileSchema>;
export type SettingsValues = z.infer<typeof settingsSchema>;
