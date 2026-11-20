import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const read = (path) => readFile(resolve(root, path), "utf8");

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

test("portfolio photos migration enforces 5 MB limit, allowed MIME types, and strict own-folder RLS", async () => {
  const sql = await read("supabase/migrations/20261119190000_portfolio_photos_storage.sql");

  assert.match(sql, /'portfolio-photos'/);
  assert.match(sql, /5242880/);
  assert.match(sql, /array\['image\/jpeg',\s*'image\/png',\s*'image\/webp'\]/i);
  assert.match(sql, /on storage\.objects for select\s+to authenticated/i);
  assert.match(sql, /on storage\.objects for insert/i);
  assert.match(sql, /on storage\.objects for delete/i);
  assert.match(sql, /\(storage\.foldername\(name\)\)\[1\]\s*=\s*\(select auth\.uid\(\)\)::text/i);
  assert.match(sql, /work-\[a-z0-9-\]\+\\\.\(jpg\|jpeg\|png\|webp\)/i);
  assert.match(sql, /p\.role = 'professional'::public\.account_role/i);
  assert.match(sql, /not p\.is_suspended/i);
  assert.match(sql, /pp\.status <> 'suspended'::public\.professional_status/i);
});

test("portfolio UI removes HTTPS URL input, adds device file preview/removal, and preserves Disponibilidad habitual", async () => {
  const [proPage, portfolioSvc, messagingSvc, profileDetail, esDict] = await Promise.all([
    read("src/app/profissional/page.tsx"),
    read("src/services/supabase/portfolioStorage.ts"),
    read("src/services/supabase/messaging.ts"),
    read("src/app/profissionais/[slug]/page.tsx"),
    read("src/features/i18n/dictionaries/es-AR.ts"),
  ]);

  // Portfolio URL input removed and replaced with real device upload + preview + remove
  assert.doesNotMatch(proPage, /Vincular imagem de trabalho \(HTTPS\)/i);
  assert.doesNotMatch(proPage, /Vincular imagen de trabajo \(HTTPS\)/i);
  assert.match(proPage, /accept="image\/jpeg,image\/png,image\/webp,\.jpg,\.jpeg,\.png,\.webp"/);
  assert.match(proPage, /URL\.createObjectURL\(file\)/);
  assert.match(proPage, /clearSelectedPortfolioPhoto/);
  assert.match(proPage, /uploadOwnPortfolioPhoto/);
  assert.match(proPage, /deleteOwnPortfolioPhoto/);

  // Orphan cleanup & legacy external-url protection
  assert.match(portfolioSvc, /remove\(\[storagePath\]\)/);
  assert.match(portfolioSvc, /isOwnPortfolioStoragePath/);
  assert.doesNotMatch(portfolioSvc, /service_role|SUPABASE_SECRET_KEY/);

  // Conversation auth guard before RPC + error sanitization + explicit loading/expired session UX
  assert.match(messagingSvc, /supabase\.auth\.getUser\(\)/);
  assert.match(messagingSvc, /class ConversationAuthError/);
  assert.match(messagingSvc, /isConversationAuthError/);
  assert.match(messagingSvc, /mapConversationRpcError/);
  assert.match(
    messagingSvc,
    /start_or_get_conversation[\s\S]{0,450}mapConversationRpcError\([\s\S]{0,80}error\.message/
  );
  assert.match(profileDetail, /useAuth/);
  assert.match(profileDetail, /\{isAuthLoading \? \(/);
  assert.match(profileDetail, /setContactRequiresLogin\(isConversationAuthError\(err\)\)/);
  assert.match(profileDetail, /contactRequiresLogin && \(/);
  assert.match(profileDetail, /contactError && contactRequiresLogin/);
  assert.match(profileDetail, /\/entrar\?next=/);

  // "Disponibilidad habitual" strictly preserved untouched
  assert.match(esDict, /sidebarAvailabilityLabel:\s*"Disponibilidad habitual"/);
});

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stagingRef = process.env.MANOSPRO_STAGING_PROJECT_REF;
const enabled = Boolean(
  url && anonKey && serviceRoleKey && stagingRef && process.env.MANOSPRO_TEST_STORAGE === "1"
);

test(
  "end-to-end staging: portfolio Storage RLS (upload, >5MB, bad MIME, cross-user, legacy compat, orphan cleanup) & conversations (start, reuse, third-party RLS block, anon block)",
  { skip: enabled ? false : "requires local staging with storage (MANOSPRO_TEST_STORAGE=1)" },
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
    const password = `FlowTest!${suffix}99`;
    const proEmail = `pf-pro-${suffix}@example.invalid`;
    const clientEmail = `pf-client-${suffix}@example.invalid`;
    const intruderEmail = `pf-intruder-${suffix}@example.invalid`;
    const adminEmail = `pf-admin-${suffix}@example.invalid`;
    const proSlug = `pf-pro-${suffix}`;

    const mkUser = async (email, fullName) => {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: "client", full_name: fullName },
      });
      assert.ifError(error);
      return data.user.id;
    };

    const proId = await mkUser(proEmail, "Profissional Portfolio");
    const clientId = await mkUser(clientEmail, "Cliente Conversa");
    const intruderId = await mkUser(intruderEmail, "Terceiro Intruso");
    const adminId = await mkUser(adminEmail, "Admin Teste");

    try {
      assert.ifError(
        (await admin.from("admin_memberships").insert({ user_id: adminId, role: "admin" })).error
      );

      const signIn = async (email) => {
        const c = createClient(url, anonKey, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        });
        assert.ifError((await c.auth.signInWithPassword({ email, password })).error);
        return c;
      };

      const proClient = await signIn(proEmail);
      const clientClient = await signIn(clientEmail);
      const intruderClient = await signIn(intruderEmail);
      const adminClient = await signIn(adminEmail);

      // 0a. Client account (role='client') must NOT upload to portfolio-photos
      const { error: clientPortfolioErr } = await clientClient.storage
        .from("portfolio-photos")
        .upload(`${clientId}/work-${Date.now()}-client.png`, TINY_PNG, {
          contentType: "image/png",
        });
      assert.ok(clientPortfolioErr, "client account must be blocked from uploading to portfolio-photos");

      // Prepare professional profile: draft -> pending -> verified -> published
      const baseProfile = {
        full_name: "Profissional Portfolio",
        country: "BR",
        city: "São Paulo",
        avatar_url: null,
        slug: proSlug,
        category_slug: "hogar",
        primary_specialty_es_ar: "Electricista",
        primary_specialty_pt_br: "Eletricista",
        secondary_specialties: [],
        bio: "Profissional verificado para testes de portfólio e conversa.",
        years_of_experience: 5,
        neighborhood: "Centro",
        coverage_zones: ["Centro"],
        languages: ["Português"],
        schedule_summary: "Seg-Sex 09:00-18:00",
        accepts_direct_contact: true,
        accepts_quote_requests: true,
        reference_starting_price: 120,
        status: "draft",
      };
      assert.ifError((await proClient.rpc("save_own_professional_profile", { p_profile: baseProfile })).error);

      // 0b. Active professional in DRAFT (unverified) MUST be allowed to upload portfolio photo
      const draftWorkPath = `${proId}/work-${Date.now()}-draft.png`;
      assert.ifError(
        (
          await proClient.storage
            .from("portfolio-photos")
            .upload(draftWorkPath, TINY_PNG, { contentType: "image/png", upsert: false })
        ).error
      );
      assert.ifError((await proClient.storage.from("portfolio-photos").remove([draftWorkPath])).error);

      assert.ifError(
        (await proClient.rpc("request_professional_verification", { matricula_or_document_note: "CREA-SP 998877" }))
          .error
      );

      // 0c. Active professional in PENDING verification (still draft) MUST be allowed to upload portfolio photo
      const pendingWorkPath = `${proId}/work-${Date.now()}-pending.png`;
      assert.ifError(
        (
          await proClient.storage
            .from("portfolio-photos")
            .upload(pendingWorkPath, TINY_PNG, { contentType: "image/png", upsert: false })
        ).error
      );
      assert.ifError((await proClient.storage.from("portfolio-photos").remove([pendingWorkPath])).error);

      assert.ifError(
        (
          await adminClient.rpc("admin_decide_professional_verification", {
            target_user_id: proId,
            new_status: "verified",
            decision_note: "Verificado no staging",
          })
        ).error
      );
      assert.ifError(
        (
          await proClient.rpc("save_own_professional_profile", {
            p_profile: { ...baseProfile, status: "published" },
          })
        ).error
      );

      // --- PART A: PORTFOLIO UPLOAD, VALIDATION, ENUMERATION BLOCK, RLS, SUSPENSION, LEGACY COMPAT ---
      // 1. Valid upload + DB persistence + direct public GET (200) after reload
      const workPath = `${proId}/work-${Date.now()}-sample.png`;
      assert.ifError(
        (
          await proClient.storage
            .from("portfolio-photos")
            .upload(workPath, TINY_PNG, { contentType: "image/png", upsert: false })
        ).error
      );
      const { data: pubData } = proClient.storage.from("portfolio-photos").getPublicUrl(workPath);
      const { data: photoRow, error: insPhotoErr } = await proClient
        .from("professional_photos")
        .insert({
          professional_id: proId,
          storage_path: workPath,
          public_url: pubData.publicUrl,
          caption: "Instalação elétrica residencial",
          zone_label: "Centro",
          work_year: 2026,
        })
        .select("id, storage_path, public_url")
        .single();
      assert.ifError(insPhotoErr);

      // Reload check (anon reads public photo record & binary URL returns HTTP 200)
      const { data: reloadedPhotos, error: reloadErr } = await anon
        .from("professional_photos")
        .select("id, public_url, storage_path")
        .eq("professional_id", proId);
      assert.ifError(reloadErr);
      assert.equal(reloadedPhotos?.length, 1);
      assert.equal((await fetch(reloadedPhotos[0].public_url)).status, 200);

      // 1b. Enumeration checks: anon cannot list, third-party cannot list, owner can list own folder
      const { data: anonRootList } = await anon.storage.from("portfolio-photos").list("");
      assert.equal(anonRootList?.length ?? 0, 0, "anon must not enumerate portfolio-photos root");
      const { data: anonProList } = await anon.storage.from("portfolio-photos").list(proId);
      assert.equal(anonProList?.length ?? 0, 0, "anon must not enumerate professional folder");
      const { data: intruderList } = await intruderClient.storage.from("portfolio-photos").list(proId);
      assert.equal(intruderList?.length ?? 0, 0, "third party must not list professional folder");
      const { data: ownProList, error: ownProListErr } = await proClient.storage
        .from("portfolio-photos")
        .list(proId);
      assert.ifError(ownProListErr);
      assert.ok(ownProList && ownProList.length >= 1, "owner should list own portfolio photos");

      // 1c. Suspended professional account must NOT upload to portfolio-photos (via real admin RPC)
      assert.ifError(
        (
          await adminClient.rpc("admin_moderate_user_suspension", {
            target_user_id: proId,
            suspend: true,
            reason: "Suspensão sintética para teste de portfólio",
          })
        ).error
      );
      const { error: suspProErr } = await proClient.storage
        .from("portfolio-photos")
        .upload(`${proId}/work-${Date.now()}-suspended.png`, TINY_PNG, {
          contentType: "image/png",
        });
      assert.ok(suspProErr, "suspended professional must be blocked from uploading to portfolio-photos");
      assert.ifError(
        (
          await adminClient.rpc("admin_moderate_user_suspension", {
            target_user_id: proId,
            suspend: false,
            reason: "Reativação sintética após teste de portfólio",
          })
        ).error
      );
      // Re-publish after reactivation since suspension moved professional_profiles.status to suspended/draft
      assert.ifError(
        (
          await proClient.rpc("save_own_professional_profile", {
            p_profile: { ...baseProfile, status: "published" },
          })
        ).error
      );

      // 2. Legacy HTTPS photo compatibility
      const { data: legacyRow, error: legacyErr } = await proClient
        .from("professional_photos")
        .insert({
          professional_id: proId,
          storage_path: "external-url",
          public_url: "https://images.unsplash.com/photo-legacy-test",
          caption: "Foto antiga legada",
          zone_label: "Centro",
          work_year: 2025,
        })
        .select("id")
        .single();
      assert.ifError(legacyErr);
      assert.ok(legacyRow?.id);

      // 3. Reject > 5 MB
      const bigBuf = Buffer.alloc(5 * 1024 * 1024 + 1024, 0);
      const { error: bigErr } = await proClient.storage
        .from("portfolio-photos")
        .upload(`${proId}/work-${Date.now()}-big.png`, bigBuf, { contentType: "image/png" });
      assert.ok(bigErr, "portfolio photo > 5 MB must be rejected");

      // 4. Reject invalid MIME (SVG)
      const { error: mimeErr } = await proClient.storage
        .from("portfolio-photos")
        .upload(`${proId}/work-${Date.now()}-bad.svg`, Buffer.from("<svg/>"), {
          contentType: "image/svg+xml",
        });
      assert.ok(mimeErr, "invalid MIME type must be rejected");

      // 5. Reject cross-user upload and cross-user delete
      const { error: crossUpErr } = await intruderClient.storage
        .from("portfolio-photos")
        .upload(`${proId}/work-${Date.now()}-hijack.png`, TINY_PNG, { contentType: "image/png" });
      assert.ok(crossUpErr, "intruder must not upload to professional folder");

      await intruderClient.storage.from("portfolio-photos").remove([workPath]);
      assert.equal((await fetch(pubData.publicUrl)).status, 200, "intruder must not delete professional photo");

      // 6. Owner deletes photo row + Storage object cleanly
      assert.ifError(
        (await proClient.from("professional_photos").delete().eq("id", photoRow.id)).error
      );
      assert.ifError((await proClient.storage.from("portfolio-photos").remove([workPath])).error);

      // --- PART B: CONVERSATION FLOW, DEDUP, THIRD-PARTY ISOLATION, ANON BLOCK ---
      // 7. Unauthenticated (anon) cannot execute start_or_get_conversation
      const { error: anonRpcErr } = await anon.rpc("start_or_get_conversation", {
        target_user_id: proId,
        initial_subject: "Anon attempt",
        initial_quote_status: "direct_chat",
        initial_message: "Should fail",
      });
      assert.ok(anonRpcErr, "anon must remain denied on start_or_get_conversation");
      assert.equal(anonRpcErr.code, "42501");

      // 8. Authenticated client starts conversation with published verified professional
      const { data: convId1, error: convErr1 } = await clientClient.rpc("start_or_get_conversation", {
        target_user_id: proId,
        initial_subject: "Orçamento elétrica",
        initial_quote_status: "quote_requested",
        initial_message: "Preciso trocar o disjuntor do apartamento.",
      });
      assert.ifError(convErr1);
      assert.ok(convId1);

      // 9. Second call reuses existing conversation without duplicating
      const { data: convId2, error: convErr2 } = await clientClient.rpc("start_or_get_conversation", {
        target_user_id: proId,
        initial_subject: "Orçamento elétrica",
        initial_quote_status: "direct_chat",
        initial_message: "Qual sua disponibilidade?",
      });
      assert.ifError(convErr2);
      assert.equal(convId2, convId1, "existing open conversation must be reused without duplication");

      // 10. Third-party authenticated user cannot read conversation or messages (RLS)
      const { data: intruderConvs, error: intruderConvErr } = await intruderClient
        .from("conversations")
        .select("id")
        .eq("id", convId1);
      assert.ifError(intruderConvErr);
      assert.equal(intruderConvs?.length ?? 0, 0, "third party must not see private conversation");

      const { data: intruderMsgs, error: intruderMsgErr } = await intruderClient
        .from("messages")
        .select("id")
        .eq("conversation_id", convId1);
      assert.ifError(intruderMsgErr);
      assert.equal(intruderMsgs?.length ?? 0, 0, "third party must not see private messages");

      const { error: intruderSendErr } = await intruderClient.from("messages").insert({
        conversation_id: convId1,
        sender_id: intruderId,
        body: "Tentativa indevida",
      });
      assert.ok(intruderSendErr, "third party must not inject messages into foreign conversation");
    } finally {
      await admin.auth.admin.deleteUser(proId).catch(() => undefined);
      await admin.auth.admin.deleteUser(clientId).catch(() => undefined);
      await admin.auth.admin.deleteUser(intruderId).catch(() => undefined);
      await admin.auth.admin.deleteUser(adminId).catch(() => undefined);
    }
  }
);
