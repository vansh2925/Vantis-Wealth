import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { createServerClientInstance } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";

export const metadata: Metadata = { title: "Profile" };

function initials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email || "";
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "U";
}

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createServerClientInstance();

  const [profileRes, settingsRes, currencyRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("currencies").select("*").order("code"),
  ]);

  const profile = profileRes.data;
  const name = profile?.full_name || user.email?.split("@")[0] || "User";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal details and currency.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={name} />}
              <AvatarFallback className="text-lg">{initials(name, user.email)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileForm
            profile={profile}
            settings={settingsRes.data}
            currencies={currencyRes.data ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
