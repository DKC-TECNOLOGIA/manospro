import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/services/supabase/client";
import { createSupabaseServerClient } from "@/services/supabase/server";

export default async function ProfessionalAreaLayout({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured()) redirect("/entrar");

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/entrar?next=%2Fprofissional");

  return children;
}
