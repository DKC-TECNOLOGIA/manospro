import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import test from "node:test";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stagingRef = process.env.MANOSPRO_STAGING_PROJECT_REF;
const enabled = Boolean(url && anonKey && serviceRoleKey && stagingRef);

test(
  "full flow: approval -> publication -> immediate visibility in public directory (anon)",
  { skip: enabled ? false : "requires local staging credentials" },
  async () => {
    const parsedUrl = new URL(url);
    assert.notEqual(stagingRef, "cvphriyjmrfijmcfblmz", "production project ref is forbidden");
    assert.ok(
      parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1",
      "must target local loopback staging only"
    );

    const admin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const anon = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const suffix = randomUUID().slice(0, 8);
    const password = `DirFlow!${suffix}99`;
    const proEmail = `dir-pro-${suffix}@example.invalid`;
    const adminEmail = `dir-admin-${suffix}@example.invalid`;
    const proSlug = `prestador-fluxo-${suffix}`;

    const { data: createdPro, error: proErr } = await admin.auth.admin.createUser({
      email: proEmail,
      password,
      email_confirm: true,
      user_metadata: { role: "client", full_name: "Prestador Fluxo Diretório" },
    });
    assert.ifError(proErr);
    const { data: createdAdmin, error: admErr } = await admin.auth.admin.createUser({
      email: adminEmail,
      password,
      email_confirm: true,
      user_metadata: { role: "client", full_name: "Admin Fluxo Diretório" },
    });
    assert.ifError(admErr);

    const proId = createdPro.user.id;
    const adminId = createdAdmin.user.id;

    try {
      const { error: grantAdminErr } = await admin
        .from("admin_memberships")
        .insert({ user_id: adminId, role: "admin" });
      assert.ifError(grantAdminErr);

      const proClient = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      assert.ifError((await proClient.auth.signInWithPassword({ email: proEmail, password })).error);

      const adminClient = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      assert.ifError((await adminClient.auth.signInWithPassword({ email: adminEmail, password })).error);

      const basePayload = {
        full_name: "Prestador Fluxo Diretório",
        country: "BR",
        city: "São Paulo",
        avatar_url: null,
        slug: proSlug,
        category_slug: "hogar",
        primary_specialty_es_ar: "Electricista matriculado",
        primary_specialty_pt_br: "Eletricista residencial",
        secondary_specialties: ["Quadros elétricos"],
        bio: "Atendimento residencial rápido e garantido.",
        years_of_experience: 6,
        neighborhood: "Centro",
        coverage_zones: ["Centro"],
        languages: ["Português"],
        schedule_summary: "Seg a Sex 08:00-18:00",
        accepts_direct_contact: true,
        accepts_quote_requests: true,
        reference_starting_price: 150,
        status: "draft",
      };

      const queryPublicDirectory = async () =>
        anon
          .from("professional_profiles")
          .select(
            "user_id, slug, category_slug, status, verification_status, profiles:profiles!professional_profiles_user_id_fkey!inner(id, full_name, country, city, avatar_url, is_suspended)"
          )
          .eq("status", "published")
          .eq("verification_status", "verified")
          .eq("profiles.is_suspended", false)
          .eq("slug", proSlug);

      // 1. Save draft profile -> NOT visible in public directory
      const { data: savedSlug, error: saveDraftErr } = await proClient.rpc(
        "save_own_professional_profile",
        { p_profile: basePayload }
      );
      assert.ifError(saveDraftErr);
      assert.equal(savedSlug, proSlug);
      assert.equal((await queryPublicDirectory()).data?.length ?? 0, 0);

      // 2. Request verification -> pending; publishing before approval is blocked
      const { error: reqErr } = await proClient.rpc("request_professional_verification", {
        matricula_or_document_note: "CREA-SP 123456789",
      });
      assert.ifError(reqErr);

      const { error: earlyPubErr } = await proClient.rpc("save_own_professional_profile", {
        p_profile: { ...basePayload, status: "published" },
      });
      assert.ok(earlyPubErr, "unapproved professional must not publish");

      // 3. Admin approves -> verified, still draft until professional publishes
      const { error: approveErr } = await adminClient.rpc(
        "admin_decide_professional_verification",
        {
          target_user_id: proId,
          new_status: "verified",
          decision_note: "Documento conferido em staging",
        }
      );
      assert.ifError(approveErr);
      assert.equal(
        (await queryPublicDirectory()).data?.length ?? 0,
        0,
        "approved profile remains hidden while status is draft"
      );

      // 4. Professional publishes -> immediately appears in public directory (anon)
      const { data: pubSlug, error: pubErr } = await proClient.rpc(
        "save_own_professional_profile",
        { p_profile: { ...basePayload, status: "published" } }
      );
      assert.ifError(pubErr);
      assert.equal(pubSlug, proSlug);

      const { data: visibleRows, error: dirErr } = await queryPublicDirectory();
      assert.ifError(dirErr);
      assert.equal(visibleRows?.length, 1, "published verified professional must appear in public directory");
      assert.equal(visibleRows[0].slug, proSlug);
      assert.equal(visibleRows[0].status, "published");
      assert.equal(visibleRows[0].verification_status, "verified");
    } finally {
      await admin.auth.admin.deleteUser(proId).catch(() => undefined);
      await admin.auth.admin.deleteUser(adminId).catch(() => undefined);
    }
  }
);
