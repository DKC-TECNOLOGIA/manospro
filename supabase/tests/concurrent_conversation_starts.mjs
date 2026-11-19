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
  "parallel RPC starts for one client/provider pair return one conversation",
  { skip: enabled ? false : "requires an explicitly configured isolated staging branch" },
  async () => {
    const parsedUrl = new URL(url);
    assert.notEqual(stagingRef, "cvphriyjmrfijmcfblmz", "production project ref is forbidden");
    assert.ok(
      parsedUrl.hostname === "localhost" ||
        parsedUrl.hostname === "127.0.0.1" ||
        parsedUrl.hostname.startsWith(`${stagingRef}.`),
      "SUPABASE_URL must match the declared staging ref or local loopback"
    );

    const admin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const client = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const professional = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const reviewer = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const password = `Race-${randomUUID()}-Aa1!`;
    const unique = randomUUID();
    let clientId;
    let professionalId;
    let reviewerId;
    let stage = "create synthetic users";

    try {
      const createdClient = await admin.auth.admin.createUser({
        email: `race-client-${unique}@example.invalid`,
        password,
        email_confirm: true,
        user_metadata: { role: "client", full_name: "Synthetic Race Client" },
      });
      if (createdClient.error) throw createdClient.error;
      clientId = createdClient.data.user.id;

      const createdProfessional = await admin.auth.admin.createUser({
        email: `race-pro-${unique}@example.invalid`,
        password,
        email_confirm: true,
        user_metadata: {
          role: "client",
          full_name: "Synthetic Race Professional",
          category_slug: "hogar",
        },
      });
      if (createdProfessional.error) throw createdProfessional.error;
      professionalId = createdProfessional.data.user.id;

      stage = "sign in professional and create draft profile";
      const professionalLogin = await professional.auth.signInWithPassword({
        email: `race-pro-${unique}@example.invalid`,
        password,
      });
      if (professionalLogin.error) throw professionalLogin.error;
      const draft = await professional.rpc("save_own_professional_profile", {
        p_profile: {
          full_name: "Synthetic Race Professional",
          country: "BR",
          city: "Sao Paulo",
          avatar_url: null,
          slug: `race-pro-${unique.slice(0, 8)}`,
          category_slug: "hogar",
          primary_specialty_es_ar: "Instalacao eletrica",
          primary_specialty_pt_br: "Instalacao eletrica",
          secondary_specialties: [],
          bio: "Synthetic profile for a local concurrency integration test.",
          years_of_experience: 5,
          neighborhood: "Centro",
          coverage_zones: ["Centro"],
          languages: ["Portugues"],
          schedule_summary: "Monday to Friday",
          accepts_direct_contact: true,
          accepts_quote_requests: true,
          reference_starting_price: null,
          status: "draft",
        },
      });
      if (draft.error) throw draft.error;

      stage = "create reviewer and approve synthetic profile";
      const createdReviewer = await admin.auth.admin.createUser({
        email: `race-reviewer-${unique}@example.invalid`,
        password,
        email_confirm: true,
        user_metadata: { role: "client", full_name: "Synthetic Verification Reviewer" },
      });
      if (createdReviewer.error) throw createdReviewer.error;
      reviewerId = createdReviewer.data.user.id;
      const membership = await admin.from("admin_memberships").insert({ user_id: reviewerId });
      if (membership.error) throw membership.error;

      const reviewerLogin = await reviewer.auth.signInWithPassword({
        email: `race-reviewer-${unique}@example.invalid`,
        password,
      });
      if (reviewerLogin.error) throw reviewerLogin.error;
      const verified = await reviewer.rpc("admin_decide_professional_verification", {
        target_user_id: professionalId,
        new_status: "verified",
        decision_note: "Synthetic integration approval",
      });
      if (verified.error) throw verified.error;

      stage = "publish verified synthetic profile";
      const published = await professional.rpc("save_own_professional_profile", {
        p_profile: {
          full_name: "Synthetic Race Professional",
          country: "BR",
          city: "São Paulo",
          avatar_url: null,
          slug: `race-pro-${unique.slice(0, 8)}`,
          category_slug: "hogar",
          primary_specialty_es_ar: "Instalação elétrica",
          primary_specialty_pt_br: "Instalação elétrica",
          secondary_specialties: [],
          bio: "Synthetic profile for a local concurrency integration test.",
          years_of_experience: 5,
          neighborhood: "Centro",
          coverage_zones: ["Centro"],
          languages: ["Português"],
          schedule_summary: "Monday to Friday",
          accepts_direct_contact: true,
          accepts_quote_requests: true,
          reference_starting_price: null,
          status: "published",
        },
      });
      if (published.error) throw published.error;

      stage = "start concurrent conversations";
      const signedIn = await client.auth.signInWithPassword({
        email: `race-client-${unique}@example.invalid`,
        password,
      });
      if (signedIn.error) throw signedIn.error;

      const params = {
        target_user_id: professionalId,
        initial_subject: "Synthetic concurrency check",
        initial_quote_status: "direct_chat",
        initial_message: null,
      };
      const [first, second] = await Promise.all([
        client.rpc("start_or_get_conversation", params),
        client.rpc("start_or_get_conversation", params),
      ]);
      if (first.error) throw first.error;
      if (second.error) throw second.error;

      assert.equal(first.data, second.data, "both requests must return the same conversation id");

      const participants = await admin
        .from("conversation_participants")
        .select("conversation_id", { count: "exact", head: true })
        .eq("user_id", clientId);
      if (participants.error) throw participants.error;
      assert.equal(participants.count, 1, "the synthetic client must have exactly one new conversation");
    } catch (error) {
      console.error(`concurrency integration failed during: ${stage}`);
      throw error;
    } finally {
      if (reviewerId) {
        const revoked = await admin.from("admin_memberships").delete().eq("user_id", reviewerId);
        if (revoked.error) throw revoked.error;
      }
      // The synthetic reviewer owns an immutable admin audit row (ON DELETE RESTRICT).
      // Its identity remains only in this disposable local database, which is removed after validation.
      const cleanup = await Promise.all(
        [clientId, professionalId]
          .filter(Boolean)
          .map((id) => admin.auth.admin.deleteUser(id))
      );
      const cleanupError = cleanup.find((result) => result.error)?.error;
      if (cleanupError) throw cleanupError;
    }
  }
);
