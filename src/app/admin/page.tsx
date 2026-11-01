import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/services/supabase/server";
import { AdminPanel, type AdminPanelData } from "@/features/admin/AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/entrar?next=%2Fadmin");

  const { data: authorized, error: authorizationError } = await supabase.rpc("is_admin");
  if (authorizationError || authorized !== true) redirect("/");

  const [metricsResult, usersResult, categoriesResult, reportsResult, verificationResult, activityResult, ownerResult, adminMembersResult] =
    await Promise.all([
      supabase.rpc("admin_get_dashboard_metrics"),
      supabase.rpc("admin_list_users", { p_search: "", p_status: "all", p_page: 1, p_page_size: 20 }),
      supabase.from("categories").select("id,slug,icon_name,name_es_ar,name_pt_br,description_es_ar,description_pt_br,examples_es_ar,examples_pt_br,display_order,is_active").order("display_order"),
      supabase.from("moderation_reports").select("id,reporter_id,target_type,target_user_id,target_entity_id,reason,details,status,resolution_note,resolved_by,resolved_at,created_at").order("created_at", { ascending: false }).limit(30),
      supabase.from("professional_profiles").select("user_id,slug,verification_status,matricula_note,created_at,profiles:profiles!professional_profiles_user_id_fkey(full_name,country,city)").eq("verification_status", "pending").order("created_at", { ascending: true }).limit(30),
      supabase.from("admin_audit_logs").select("id,action_type,target_type,target_id,summary,created_at").order("created_at", { ascending: false }).limit(12),
      supabase.rpc("admin_is_owner"),
      supabase.rpc("admin_list_members"),
    ]);

  const payload: AdminPanelData = {
    adminName: authData.user.user_metadata?.full_name || authData.user.email || "Admin",
    metrics: (metricsResult.data ?? null) as AdminPanelData["metrics"],
    users: (usersResult.data?.users ?? []) as AdminPanelData["users"],
    userCount: Number(usersResult.data?.totalCount ?? 0),
    categories: (categoriesResult.data ?? []) as AdminPanelData["categories"],
    reports: (reportsResult.data ?? []) as AdminPanelData["reports"],
    verifications: (verificationResult.data ?? []) as AdminPanelData["verifications"],
    activity: (activityResult.data ?? []) as AdminPanelData["activity"],
    canManageAdmins: ownerResult.data === true,
    adminMembers: (adminMembersResult.data ?? []) as AdminPanelData["adminMembers"],
    loadErrors: [metricsResult.error && "indicadores", usersResult.error && "usuários", categoriesResult.error && "categorias", reportsResult.error && "denúncias", verificationResult.error && "verificações", activityResult.error && "auditoria", (ownerResult.error || adminMembersResult.error) && "administradores"].filter(Boolean) as string[],
  };
  return <AdminPanel initialData={payload} />;
}
