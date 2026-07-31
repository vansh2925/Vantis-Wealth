"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { AuthError } from "@supabase/supabase-js";
import { createServerClientInstance } from "@/lib/supabase/server";
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  otpSchema,
  type LoginValues,
  type SignupValues,
  type ForgotPasswordValues,
  type ResetPasswordValues,
  type OtpValues,
} from "@/lib/validations/auth";

export interface AuthActionResult {
  error?: string;
  success?: string;
}

function friendlyError(err: AuthError): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "Incorrect email or password.",
    "Email not confirmed": "Please verify your email address before logging in.",
    "User already registered": "An account with this email already exists.",
    "Password should be at least 6 characters": "Password must be at least 6 characters.",
  };
  return map[err.message] ?? err.message;
}

/**
 * Base origin for auth redirect URLs (email confirmation, password reset, OTP).
 * Prefers an explicit NEXT_PUBLIC_APP_URL, else derives it from the request
 * headers so links point to the actual deployment (Vercel, etc.), falling back
 * to localhost for local dev.
 */
async function getOrigin(): Promise<string> {
  const envOrigin = process.env.NEXT_PUBLIC_APP_URL;
  if (envOrigin) return envOrigin;

  try {
    const h = await headers();
    const proto = h.get("x-forwarded-proto") ?? "http";
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) return `${proto}://${host}`;
  } catch {
    /* headers unavailable — fall through to default */
  }
  return "http://localhost:3000";
}

export async function signIn(
  values: LoginValues
): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  const supabase = await createServerClientInstance();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return { error: friendlyError(error) };
  return { success: "Welcome back." };
}

export async function signUp(
  values: SignupValues
): Promise<AuthActionResult> {
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  const supabase = await createServerClientInstance();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        currency: parsed.data.currency,
      },
      // emailRedirectTo ensures the verification link returns to the app.
      emailRedirectTo: `${await getOrigin()}/dashboard`,
    },
  });

  if (error) return { error: friendlyError(error) };

  if (data.session) {
    // Auto-confirmed (e.g. email confirmation disabled) — signed in already.
    return { success: "Account created." };
  }

  return {
    success:
      "Account created. Check your email to confirm your address before signing in.",
  };
}

export async function sendOtp(
  values: Pick<OtpValues, "email">
): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid email." };
  }

  const supabase = await createServerClientInstance();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo: `${await getOrigin()}/dashboard` },
  });

  if (error) return { error: friendlyError(error) };
  return { success: "A 6-digit code has been sent to your email." };
}

export async function verifyOtp(
  values: OtpValues
): Promise<AuthActionResult> {
  const parsed = otpSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid code." };
  }

  const supabase = await createServerClientInstance();
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: "email",
  });

  if (error) return { error: friendlyError(error) };
  return { success: "Verified. You are now signed in." };
}

export async function requestPasswordReset(
  values: ForgotPasswordValues
): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid email." };
  }

  const supabase = await createServerClientInstance();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await getOrigin()}/reset-password`,
  });

  if (error) return { error: friendlyError(error) };
  return { success: "If that email exists, a reset link has been sent." };
}

export async function updatePassword(
  values: ResetPasswordValues
): Promise<AuthActionResult> {
  const parsed = resetPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  const supabase = await createServerClientInstance();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) return { error: friendlyError(error) };
  return { success: "Password updated. You can now sign in." };
}

export async function signOutAction() {
  const supabase = await createServerClientInstance();
  await supabase.auth.signOut();
  redirect("/login");
}
