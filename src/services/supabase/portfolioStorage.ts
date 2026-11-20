import { createSupabaseBrowserClient, isSupabaseConfigured } from "./client";
import type { RealPortfolioPhoto } from "./professionals";

export const PORTFOLIO_PHOTOS_BUCKET = "portfolio-photos";
export const MAX_PORTFOLIO_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_PORTFOLIO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

type AllowedPortfolioMimeType = (typeof ALLOWED_PORTFOLIO_MIME_TYPES)[number];
export type PortfolioLocale = "es-AR" | "pt-BR";

const MIME_TO_EXT: Record<AllowedPortfolioMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface PortfolioFileLike {
  name: string;
  size: number;
  type: string;
}

export function validatePortfolioPhotoFile(
  file: PortfolioFileLike,
  locale: PortfolioLocale = "pt-BR"
):
  | { valid: true; mimeType: AllowedPortfolioMimeType }
  | { valid: false; error: string } {
  const isEs = locale === "es-AR";
  const mime = (file.type || "").toLowerCase();
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();

  if (
    !ALLOWED_PORTFOLIO_MIME_TYPES.includes(mime as AllowedPortfolioMimeType) ||
    (ext && !ALLOWED_EXTENSIONS.has(ext))
  ) {
    return {
      valid: false,
      error: isEs
        ? "Formato no permitido. Seleccioná una imagen JPEG, PNG o WebP."
        : "Formato não permitido. Selecione uma imagem JPEG, PNG ou WebP.",
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

  if (file.size > MAX_PORTFOLIO_PHOTO_BYTES) {
    return {
      valid: false,
      error: isEs
        ? "La imagen supera el tamaño máximo permitido de 5 MB."
        : "A imagem ultrapassa o limite máximo de 5 MB.",
    };
  }

  return { valid: true, mimeType: mime as AllowedPortfolioMimeType };
}

export function buildPortfolioStoragePath(
  userId: string,
  mimeType: AllowedPortfolioMimeType
): string {
  if (!UUID_REGEX.test(userId)) {
    throw new Error("invalid_portfolio_owner");
  }
  const ext = MIME_TO_EXT[mimeType];
  const randomSuffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${userId}/work-${Date.now()}-${randomSuffix}.${ext}`;
}

/**
 * Confirma que o `storage_path` salvo pertence ao bucket `portfolio-photos` na pasta
 * do próprio usuário (evitando tentar apagar registros legados `external-url` ou de terceiros).
 */
export function isOwnPortfolioStoragePath(
  storagePath: string | null | undefined,
  userId: string
): storagePath is string {
  if (!storagePath || !UUID_REGEX.test(userId)) return false;
  const prefix = `${userId}/work-`;
  if (!storagePath.startsWith(prefix)) return false;
  const relative = storagePath.slice(`${userId}/`.length);
  if (!relative || relative.includes("/") || relative.includes("..")) return false;
  return /^work-[a-z0-9-]+\.(jpg|jpeg|png|webp)$/.test(relative);
}

function friendlyPortfolioError(
  locale: PortfolioLocale,
  action: "upload" | "save_profile_first" | "delete"
): string {
  const isEs = locale === "es-AR";
  if (action === "save_profile_first") {
    return isEs
      ? "Guardá primero tu perfil profesional antes de subir fotos de trabajos."
      : "Salve primeiro seu perfil profissional antes de enviar fotos de trabalhos.";
  }
  if (action === "delete") {
    return isEs
      ? "No se pudo eliminar la imagen del trabajo. Intentá nuevamente."
      : "Não foi possível remover a imagem do trabalho. Tente novamente.";
  }
  return isEs
    ? "No se pudo subir la imagen del trabajo. Verificá tu conexión e intentá nuevamente."
    : "Não foi possível enviar a imagem do trabalho. Verifique sua conexão e tente novamente.";
}

/**
 * Envia uma foto de trabalho ao bucket `portfolio-photos` e grava a referência em
 * `public.professional_photos`. Em caso de falha no banco, remove o arquivo órfão do Storage.
 */
export async function uploadOwnPortfolioPhoto(params: {
  file: File;
  caption: string;
  zoneLabel: string;
  workYear?: number;
  locale?: PortfolioLocale;
}): Promise<RealPortfolioPhoto> {
  const locale = params.locale ?? "pt-BR";
  if (!isSupabaseConfigured()) {
    throw new Error(friendlyPortfolioError(locale, "upload"));
  }

  const validation = validatePortfolioPhotoFile(params.file, locale);
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
        ? "Tu sesión expiró. Iniciá sesión nuevamente para subir imágenes."
        : "Sua sessão expirou. Entre novamente para enviar imagens."
    );
  }

  const storagePath = buildPortfolioStoragePath(user.id, validation.mimeType);
  const { error: uploadError } = await supabase.storage
    .from(PORTFOLIO_PHOTOS_BUCKET)
    .upload(storagePath, params.file, {
      cacheControl: "3600",
      contentType: validation.mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(friendlyPortfolioError(locale, "upload"));
  }

  const { data: publicUrlData } = supabase.storage
    .from(PORTFOLIO_PHOTOS_BUCKET)
    .getPublicUrl(storagePath);

  const { data, error: insertError } = await supabase
    .from("professional_photos")
    .insert({
      professional_id: user.id,
      storage_path: storagePath,
      public_url: publicUrlData.publicUrl,
      caption: params.caption.trim() || (locale === "es-AR" ? "Trabajo realizado" : "Trabalho realizado"),
      zone_label: params.zoneLabel.trim(),
      work_year: params.workYear ?? new Date().getFullYear(),
    })
    .select("id, professional_id, storage_path, public_url, caption, zone_label, work_year")
    .single();

  if (insertError || !data) {
    // Limpeza de arquivo órfão no Storage quando a gravação no banco falha.
    await supabase.storage
      .from(PORTFOLIO_PHOTOS_BUCKET)
      .remove([storagePath])
      .catch(() => undefined);

    const msg = (insertError?.message ?? "").toLowerCase();
    if (msg.includes("foreign key") || insertError?.code === "23503") {
      throw new Error(friendlyPortfolioError(locale, "save_profile_first"));
    }
    throw new Error(friendlyPortfolioError(locale, "upload"));
  }

  return {
    id: String(data.id),
    professionalId: String(data.professional_id),
    storagePath: String(data.storage_path),
    publicUrl: String(data.public_url),
    caption: String(data.caption ?? ""),
    zoneLabel: String(data.zone_label ?? ""),
    workYear: Number(data.work_year ?? new Date().getFullYear()),
  };
}

/**
 * Remove a foto de `public.professional_photos` e, quando armazenada no bucket
 * `portfolio-photos` na pasta do próprio usuário, remove o arquivo correspondente.
 */
export async function deleteOwnPortfolioPhoto(params: {
  photoId: string;
  storagePath?: string | null;
  locale?: PortfolioLocale;
}): Promise<void> {
  const locale = params.locale ?? "pt-BR";
  if (!isSupabaseConfigured()) {
    throw new Error(friendlyPortfolioError(locale, "delete"));
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
        : "Sua sessão expirou. Entre novamente."
    );
  }

  const { error: deleteError } = await supabase
    .from("professional_photos")
    .delete()
    .eq("id", params.photoId)
    .eq("professional_id", user.id);

  if (deleteError) {
    throw new Error(friendlyPortfolioError(locale, "delete"));
  }

  if (isOwnPortfolioStoragePath(params.storagePath, user.id)) {
    await supabase.storage
      .from(PORTFOLIO_PHOTOS_BUCKET)
      .remove([params.storagePath])
      .catch(() => undefined);
  }
}
