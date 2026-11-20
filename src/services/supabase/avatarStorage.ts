import { createSupabaseBrowserClient, isSupabaseConfigured } from "./client";

export const PROFILE_AVATARS_BUCKET = "profile-avatars";
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

type AllowedMimeType = (typeof ALLOWED_AVATAR_MIME_TYPES)[number];
export type AvatarLocale = "es-AR" | "pt-BR";

const MIME_TO_EXT: Record<AllowedMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface AvatarFileLike {
  name: string;
  size: number;
  type: string;
}

export function getAvatarInitials(name: string | null | undefined): string {
  const clean = (name ?? "").trim();
  if (!clean) return "MP";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return (parts[0] ?? "MP").slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
}

export function validateAvatarFile(
  file: AvatarFileLike,
  locale: AvatarLocale = "pt-BR"
): { valid: true; mimeType: AllowedMimeType } | { valid: false; error: string } {
  const isEs = locale === "es-AR";
  const mime = (file.type || "").toLowerCase();
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();

  if (
    !ALLOWED_AVATAR_MIME_TYPES.includes(mime as AllowedMimeType) ||
    (ext && !ALLOWED_EXTENSIONS.has(ext))
  ) {
    return {
      valid: false,
      error: isEs
        ? "Formato no permitido. Usá una imagen JPG, JPEG, PNG o WebP."
        : "Formato não permitido. Escolha uma imagem JPG, JPEG, PNG ou WebP.",
    };
  }

  if (!Number.isFinite(file.size) || file.size <= 0) {
    return {
      valid: false,
      error: isEs
        ? "El archivo seleccionado está vacío."
        : "O arquivo selecionado está vazio.",
    };
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return {
      valid: false,
      error: isEs
        ? "La imagen supera el límite máximo de 5 MB."
        : "A imagem ultrapassa o limite máximo de 5 MB.",
    };
  }

  return { valid: true, mimeType: mime as AllowedMimeType };
}

export function buildAvatarStoragePath(
  userId: string,
  mimeType: AllowedMimeType
): string {
  if (!UUID_REGEX.test(userId)) {
    throw new Error("invalid_avatar_owner");
  }
  const ext = MIME_TO_EXT[mimeType];
  const randomSuffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${userId}/avatar-${Date.now()}-${randomSuffix}.${ext}`;
}

/**
 * Extrai o caminho interno no bucket `profile-avatars` somente se a URL pertencer
 * à pasta do próprio usuário autenticado. URLs externas legadas retornam `null`.
 */
export function extractOwnAvatarStoragePath(
  avatarUrl: string | null | undefined,
  userId: string
): string | null {
  if (!avatarUrl || !UUID_REGEX.test(userId)) return null;
  try {
    const parsed = new URL(avatarUrl);
    const marker = `/storage/v1/object/public/${PROFILE_AVATARS_BUCKET}/`;
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;
    const objectPath = decodeURIComponent(parsed.pathname.slice(idx + marker.length));
    const prefix = `${userId}/`;
    if (!objectPath.startsWith(prefix)) return null;
    const relative = objectPath.slice(prefix.length);
    if (!relative || relative.includes("/") || relative.includes("..")) return null;
    return objectPath;
  } catch {
    return null;
  }
}

function friendlyStorageError(locale: AvatarLocale, action: "upload" | "remove"): string {
  const isEs = locale === "es-AR";
  if (action === "remove") {
    return isEs
      ? "No se pudo eliminar la foto de perfil. Intentá nuevamente."
      : "Não foi possível remover a foto de perfil. Tente novamente.";
  }
  return isEs
    ? "No se pudo subir la foto de perfil. Verificá tu conexión e intentá nuevamente."
    : "Não foi possível enviar a foto de perfil. Verifique sua conexão e tente novamente.";
}

/**
 * Envia nova foto para `profile-avatars/{userId}/avatar-...`, atualiza `profiles.avatar_url`
 * e só remove o arquivo anterior após o sucesso do banco (preservando a foto anterior em caso de falha).
 */
export async function uploadOwnProfileAvatar(
  file: File,
  previousAvatarUrl: string | null,
  locale: AvatarLocale = "pt-BR"
): Promise<{ avatarUrl: string }> {
  if (!isSupabaseConfigured()) {
    throw new Error(friendlyStorageError(locale, "upload"));
  }

  const validation = validateAvatarFile(file, locale);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error(
      locale === "es-AR"
        ? "Tu sesión expiró. Iniciá sesión nuevamente."
        : "Sua sessão expirou. Entre novamente para enviar a foto."
    );
  }

  const newPath = buildAvatarStoragePath(user.id, validation.mimeType);
  const { error: uploadError } = await supabase.storage
    .from(PROFILE_AVATARS_BUCKET)
    .upload(newPath, file, {
      cacheControl: "3600",
      contentType: validation.mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(friendlyStorageError(locale, "upload"));
  }

  const { data: publicUrlData } = supabase.storage
    .from(PROFILE_AVATARS_BUCKET)
    .getPublicUrl(newPath);
  const nextAvatarUrl = publicUrlData.publicUrl;

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update({
      avatar_url: nextAvatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (updateError || !updatedProfile) {
    // Preserva a imagem anterior removendo o arquivo órfão recém-enviado.
    await supabase.storage.from(PROFILE_AVATARS_BUCKET).remove([newPath]).catch(() => undefined);
    throw new Error(friendlyStorageError(locale, "upload"));
  }

  // Limpeza best-effort do arquivo anterior somente se pertencer ao bucket e à pasta do próprio usuário.
  const oldPath = extractOwnAvatarStoragePath(previousAvatarUrl, user.id);
  if (oldPath && oldPath !== newPath) {
    await supabase.storage.from(PROFILE_AVATARS_BUCKET).remove([oldPath]).catch(() => undefined);
  }

  return { avatarUrl: nextAvatarUrl };
}

/**
 * Remove `profiles.avatar_url` e limpa o arquivo anterior no Storage se pertencer à pasta do usuário.
 */
export async function removeOwnProfileAvatar(
  previousAvatarUrl: string | null,
  locale: AvatarLocale = "pt-BR"
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error(friendlyStorageError(locale, "remove"));
  }

  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error(
      locale === "es-AR"
        ? "Tu sesión expiró. Iniciá sesión nuevamente."
        : "Sua sessão expirou. Entre novamente para remover a foto."
    );
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update({
      avatar_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (updateError || !updatedProfile) {
    throw new Error(friendlyStorageError(locale, "remove"));
  }

  const oldPath = extractOwnAvatarStoragePath(previousAvatarUrl, user.id);
  if (oldPath) {
    await supabase.storage.from(PROFILE_AVATARS_BUCKET).remove([oldPath]).catch(() => undefined);
  }
}
