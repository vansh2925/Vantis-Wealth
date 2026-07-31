import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpForm } from "@/components/auth/otp-form";

export const metadata: Metadata = { title: "Email OTP sign in" };

export default function OtpPage() {
  return (
    <AuthShell title="Magic link sign in" subtitle="Receive a code and sign in without a password">
      <OtpForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Prefer a password?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in with email
        </Link>
      </p>
    </AuthShell>
  );
}
