import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/services/supabase/server";
import { AccountSettings } from "@/features/auth/components/AccountSettings";
import type { CountryCode } from "@/types/domain";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/entrar");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/entrar?next=%2Fconta");

  const [{ data: profile, error }, { data: phone, error: phoneError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, country, city, avatar_url, created_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.rpc("get_own_phone"),
  ]);

  return (
    <AccountSettings
      account={{
        id: user.id,
        email: user.email ?? "",
        createdAt: user.created_at,
        // Sem o telefone confirmado, salvar sobrescreveria o valor real com vazio.
        profile: profile && !phoneError
          ? {
              id: profile.id,
              fullName: profile.full_name,
              phone: typeof phone === "string" ? phone : "",
              country: profile.country as CountryCode,
              city: profile.city,
              avatarUrl: profile.avatar_url ?? "",
              createdAt: profile.created_at,
            }
          : null,
        profileLoadFailed: Boolean(error || phoneError),
      }}
    />
  );
}
