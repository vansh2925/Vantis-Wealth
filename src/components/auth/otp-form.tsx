"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { otpSchema, type OtpValues } from "@/lib/validations/auth";
import { sendOtp, verifyOtp } from "@/app/(auth)/actions";

export function OtpForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const form = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { email: "", token: "" },
  });

  async function onSend() {
    const email = form.getValues("email");
    if (!email) {
      toast.error("Enter your email first.");
      return;
    }
    setPending(true);
    try {
      const result = await sendOtp({ email });
      if (result.error) toast.error(result.error);
      else toast.success(result.success ?? "Code sent.");
    } finally {
      setPending(false);
    }
  }

  async function onSubmit(values: OtpValues) {
    setPending(true);
    try {
      const result = await verifyOtp(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success ?? "Signed in.");
      router.refresh();
      router.push("/dashboard");
    } finally {
      setPending(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-end gap-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="button" variant="outline" onClick={onSend} disabled={pending}>
            Send code
          </Button>
        </div>
        <FormField
          control={form.control}
          name="token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>6-digit code</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  className="text-center tracking-[0.5em]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify &amp; sign in
        </Button>
      </form>
    </Form>
  );
}
