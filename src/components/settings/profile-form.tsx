"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  profileSchema,
  type ProfileValues,
} from "@/lib/validations/settings";
import { updateProfile } from "@/app/(app)/actions/settings";
import type { Currency, Profile, Settings } from "@/types";

export function ProfileForm({
  profile,
  settings,
  currencies,
}: {
  profile: Profile | null;
  settings: Settings | null;
  currencies: Currency[];
}) {
  const [pending, setPending] = useState(false);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.full_name ?? "",
      currency: settings?.currency_code ?? profile?.currency_code ?? "INR",
      bio: profile?.bio ?? "",
    },
  });

  // Sync when server-provided data arrives after navigation.
  useEffect(() => {
    form.reset({
      fullName: profile?.full_name ?? "",
      currency: settings?.currency_code ?? profile?.currency_code ?? "INR",
      bio: profile?.bio ?? "",
    });
  }, [profile, settings, form]);

  async function onSubmit(values: ProfileValues) {
    setPending(true);
    try {
      const result = await updateProfile(values);
      if (result.error) toast.error(result.error);
      else toast.success(result.success ?? "Saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" {...form.register("fullName")} />
        {form.formState.errors.fullName && (
          <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Primary currency</Label>
        <Select
          value={form.watch("currency")}
          onValueChange={(v) => form.setValue("currency", v, { shouldValidate: true })}
        >
          <SelectTrigger id="currency">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.symbol} {c.code} — {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          placeholder="A short line about you"
          rows={3}
          {...form.register("bio")}
        />
        {form.formState.errors.bio && (
          <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}
