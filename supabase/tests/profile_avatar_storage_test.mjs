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

// 1x1 valid PNG binary
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

test("avatar storage migration defines 5 MB limit, allowed MIME types, and strict per-user RLS policies", async () => {
  const sql = await read("supabase/migrations/20261119180000_profile_avatars_storage.sql");

  assert.match(sql, /'profile-avatars'/);
  assert.match(sql, /5242880/);
  assert.match(sql, /array\['image\/jpeg',\s*'image\/png',\s*'image\/webp'\]/i);
  assert.match(sql, /on storage\.objects for select\s+to authenticated/i);
  assert.match(sql, /on storage\.objects for insert/i);
  assert.match(sql, /on storage\.objects for update/i);
  assert.match(sql, /on storage\.objects for delete/i);
  assert.match(sql, /\(storage\.foldername\(name\)\)\[1\]\s*=\s*\(select auth\.uid\(\)\)::text/i);
  assert.match(sql, /avatar-\[a-z0-9-\]\+\\\.\(jpg\|jpeg\|png\|webp\)/i);
  assert.match(sql, /not p\.is_suspended/i);
});

test("AccountSettings and ProfessionalWorkspace replace URL input with ProfileAvatarUploader and sync AuthProvider", async () => {
  const [accountSettings, proPage, authProvider, accountMenu, avatarService] = await Promise.all([
    read("src/features/auth/components/AccountSettings.tsx"),
    read("src/app/profissional/page.tsx"),
    read("src/features/auth/AuthProvider.tsx"),
    read("src/features/auth/components/AccountMenu.tsx"),
    read("src/services/supabase/avatarStorage.ts"),
  ]);

  assert.match(accountSettings, /<ProfileAvatarUploader/);
  assert.doesNotMatch(accountSettings, /type="url"[^>]*avatarUrl/);
  assert.match(accountSettings, /updateProfileAvatar/);

  assert.match(proPage, /<ProfileAvatarUploader/);
  assert.doesNotMatch(proPage, /URL de foto de perfil/);
  assert.match(proPage, /updateProfileAvatar/);

  assert.match(authProvider, /select\("role, full_name, avatar_url"\)/);
  assert.match(authProvider, /updateProfileAvatar/);
  assert.match(accountMenu, /<UserAvatar/);

  // Service must never use service_role and must clean up orphan upload if DB update fails
  assert.doesNotMatch(avatarService, /SUPABASE_SECRET_KEY|service_role/);
  assert.match(avatarService, /remove\(\[newPath\]\)/);
  assert.match(avatarService, /extractOwnAvatarStoragePath\(previousAvatarUrl, user\.id\)/);
});

test("avatar path extraction preserves legacy external URLs and blocks cross-user or traversal paths", async () => {
  const serviceCode = await read("src/services/supabase/avatarStorage.ts");
  assert.match(serviceCode, /if \(!objectPath\.startsWith\(prefix\)\) return null/);
  assert.match(serviceCode, /relative\.includes\("\.\."\)/);
  assert.match(serviceCode, /MAX_AVATAR_BYTES = 5 \* 1024 \* 1024/);
});

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stagingRef = process.env.MANOSPRO_STAGING_PROJECT_REF;
const storageEnabled = Boolean(
  url && anonKey && serviceRoleKey && stagingRef && process.env.MANOSPRO_TEST_STORAGE === "1"
);

test(
  "end-to-end Storage RLS: valid upload, >5MB rejection, invalid MIME rejection, cross-user block, replace & remove",
  { skip: storageEnabled ? false : "requires local staging with storage enabled (MANOSPRO_TEST_STORAGE=1)" },
  async () => {
    const parsedUrl = new URL(url);
    assert.notEqual(stagingRef, "cvphriyjmrfijmcfblmz", "production project ref is forbidden");
    assert.ok(
      parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1",
      "storage integration test must target local loopback only"
    );

    const admin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const suffix = randomUUID().slice(0, 8);
    const password = `AvatarTest!${suffix}99`;
    const emailA = `avatar-a-${suffix}@example.invalid`;
    const emailB = `avatar-b-${suffix}@example.invalid`;

    const { data: createdA, error: errA } = await admin.auth.admin.createUser({
      email: emailA,
      password,
      email_confirm: true,
      user_metadata: { role: "client", full_name: "Avatar User A" },
    });
    assert.ifError(errA);
    const { data: createdB, error: errB } = await admin.auth.admin.createUser({
      email: emailB,
      password,
      email_confirm: true,
      user_metadata: { role: "client", full_name: "Avatar User B" },
    });
    assert.ifError(errB);

    const userA = createdA.user.id;
    const userB = createdB.user.id;

    try {
      const clientA = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      const { error: signInErrA } = await clientA.auth.signInWithPassword({
        email: emailA,
        password,
      });
      assert.ifError(signInErrA);

      // 1. Valid upload to own folder + direct public GET (200)
      const pathA1 = `${userA}/avatar-${Date.now()}-first.png`;
      const { error: up1Err } = await clientA.storage
        .from("profile-avatars")
        .upload(pathA1, TINY_PNG, { contentType: "image/png", upsert: false });
      assert.ifError(up1Err);

      const { data: pub1 } = clientA.storage.from("profile-avatars").getPublicUrl(pathA1);
      const imgResp = await fetch(pub1.publicUrl);
      assert.equal(imgResp.status, 200, "public avatar URL should be readable via direct GET");

      // 1b. Enumeration & listing checks: anon cannot list, owner can list own folder, user B cannot list user A
      const anonClient = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      const { data: anonRootList } = await anonClient.storage.from("profile-avatars").list("");
      assert.equal(anonRootList?.length ?? 0, 0, "anon must not enumerate profile-avatars root");
      const { data: anonFolderList } = await anonClient.storage.from("profile-avatars").list(userA);
      assert.equal(anonFolderList?.length ?? 0, 0, "anon must not enumerate user A avatar folder");

      const { data: ownList, error: ownListErr } = await clientA.storage
        .from("profile-avatars")
        .list(userA);
      assert.ifError(ownListErr);
      assert.ok(ownList && ownList.length >= 1, "owner should list own uploaded avatar");

      // 2. Reject file > 5 MB
      const oversized = Buffer.alloc(5 * 1024 * 1024 + 1024, 0);
      const { error: bigErr } = await clientA.storage
        .from("profile-avatars")
        .upload(`${userA}/avatar-${Date.now()}-big.png`, oversized, { contentType: "image/png" });
      assert.ok(bigErr, "files over 5 MB must be rejected by Storage");

      // 3. Reject invalid MIME type (SVG)
      const { error: svgErr } = await clientA.storage
        .from("profile-avatars")
        .upload(`${userA}/avatar-${Date.now()}-bad.svg`, Buffer.from("<svg></svg>"), {
          contentType: "image/svg+xml",
        });
      assert.ok(svgErr, "invalid MIME type must be rejected by Storage");

      // 4. Reject upload to another user's folder (cross-user RLS)
      const { error: crossUpErr } = await clientA.storage
        .from("profile-avatars")
        .upload(`${userB}/avatar-${Date.now()}-hijack.png`, TINY_PNG, {
          contentType: "image/png",
        });
      assert.ok(crossUpErr, "user A must not upload to user B folder");

      // 5. Reject nested/invalid filename path
      const { error: badNameErr } = await clientA.storage
        .from("profile-avatars")
        .upload(`${userA}/nested/avatar-bad.png`, TINY_PNG, { contentType: "image/png" });
      assert.ok(badNameErr, "nested paths must be rejected by RLS");

      // 6. Replace avatar & update profiles.avatar_url
      const pathA2 = `${userA}/avatar-${Date.now()}-second.png`;
      const { error: up2Err } = await clientA.storage
        .from("profile-avatars")
        .upload(pathA2, TINY_PNG, { contentType: "image/png", upsert: false });
      assert.ifError(up2Err);

      const { data: pub2 } = clientA.storage.from("profile-avatars").getPublicUrl(pathA2);
      const { error: dbUpdErr } = await clientA
        .from("profiles")
        .update({ avatar_url: pub2.publicUrl })
        .eq("id", userA);
      assert.ifError(dbUpdErr);

      // Remove old file
      const { error: rmOldErr } = await clientA.storage.from("profile-avatars").remove([pathA1]);
      assert.ifError(rmOldErr);

      // 7. Cross-user delete must not remove user A's file
      const clientB = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      const { error: signInErrB } = await clientB.auth.signInWithPassword({
        email: emailB,
        password,
      });
      assert.ifError(signInErrB);

      await clientB.storage.from("profile-avatars").remove([pathA2]);
      const stillThere = await fetch(pub2.publicUrl);
      assert.equal(stillThere.status, 200, "user B must not delete user A's avatar");

      const { data: crossList } = await clientB.storage.from("profile-avatars").list(userA);
      assert.equal(crossList?.length ?? 0, 0, "user B must not list user A's avatar folder");

      // 7b. Suspended account cannot upload avatar (suspended via real admin RPC)
      const adminEmail = `avatar-admin-${suffix}@example.invalid`;
      const { data: createdAdmin, error: admErr } = await admin.auth.admin.createUser({
        email: adminEmail,
        password,
        email_confirm: true,
        user_metadata: { role: "client", full_name: "Avatar Admin" },
      });
      assert.ifError(admErr);
      const adminId = createdAdmin.user.id;
      try {
        assert.ifError(
          (await admin.from("admin_memberships").insert({ user_id: adminId, role: "admin" })).error
        );
        const adminClient = createClient(url, anonKey, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        });
        assert.ifError(
          (await adminClient.auth.signInWithPassword({ email: adminEmail, password })).error
        );
        assert.ifError(
          (
            await adminClient.rpc("admin_moderate_user_suspension", {
              target_user_id: userB,
              suspend: true,
              reason: "Suspensão sintética para teste de Storage",
            })
          ).error
        );
        const { error: suspendedUpErr } = await clientB.storage
          .from("profile-avatars")
          .upload(`${userB}/avatar-${Date.now()}-suspended.png`, TINY_PNG, {
            contentType: "image/png",
          });
        assert.ok(suspendedUpErr, "suspended user must not upload profile avatar");
      } finally {
        await admin.auth.admin.deleteUser(adminId).catch(() => undefined);
      }

      // 8. Owner removes own avatar
      const { error: clearDbErr } = await clientA
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userA);
      assert.ifError(clearDbErr);
      const { error: rmOwnErr } = await clientA.storage.from("profile-avatars").remove([pathA2]);
      assert.ifError(rmOwnErr);
    } finally {
      await admin.auth.admin.deleteUser(userA).catch(() => undefined);
      await admin.auth.admin.deleteUser(userB).catch(() => undefined);
    }
  }
);
