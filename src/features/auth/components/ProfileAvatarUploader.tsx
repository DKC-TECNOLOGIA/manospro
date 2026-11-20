"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { Camera, Check, LoaderCircle, Trash2, Upload, X } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  removeOwnProfileAvatar,
  uploadOwnProfileAvatar,
  validateAvatarFile,
  type AvatarLocale,
} from "@/services/supabase/avatarStorage";

interface ProfileAvatarUploaderProps {
  currentAvatarUrl: string | null;
  displayName: string;
  locale: AvatarLocale;
  disabled?: boolean;
  onAvatarChange: (nextUrl: string | null) => void;
}

type UploadFeedback = { type: "success" | "error"; message: string } | null;

export function ProfileAvatarUploader({
  currentAvatarUrl,
  displayName,
  locale,
  disabled = false,
  onAvatarChange,
}: ProfileAvatarUploaderProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [feedback, setFeedback] = useState<UploadFeedback>(null);

  const isPt = locale === "pt-BR";
  const busy = disabled || isUploading || isRemoving;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const clearSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFeedback(null);
    setConfirmRemove(false);
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateAvatarFile(file, locale);
    if (!validation.valid) {
      clearSelection();
      setFeedback({ type: "error", message: validation.error });
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const nextPreview = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(nextPreview);
  };

  const handleUpload = async () => {
    if (!selectedFile || busy) return;
    setFeedback(null);
    setIsUploading(true);
    try {
      const { avatarUrl } = await uploadOwnProfileAvatar(
        selectedFile,
        currentAvatarUrl,
        locale
      );
      clearSelection();
      onAvatarChange(avatarUrl);
      setFeedback({
        type: "success",
        message: isPt
          ? "Foto de perfil atualizada com sucesso."
          : "Foto de perfil actualizada correctamente.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : isPt
              ? "Não foi possível enviar a foto de perfil."
              : "No se pudo subir la foto de perfil.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (busy || !currentAvatarUrl) return;
    setFeedback(null);
    setIsRemoving(true);
    try {
      await removeOwnProfileAvatar(currentAvatarUrl, locale);
      clearSelection();
      setConfirmRemove(false);
      onAvatarChange(null);
      setFeedback({
        type: "success",
        message: isPt
          ? "Foto de perfil removida."
          : "Foto de perfil eliminada.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : isPt
              ? "Não foi possível remover a foto de perfil."
              : "No se pudo eliminar la foto de perfil.",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const displayedUrl = previewUrl ?? currentAvatarUrl;

  return (
    <div className="rounded-2xl border border-[#DFD8CC] bg-[#F7F4EE]/70 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative shrink-0 self-start sm:self-center">
          <UserAvatar
            src={displayedUrl}
            name={displayName}
            size="lg"
            shape="circle"
            className="border-2 border-white shadow-xs"
          />
          {previewUrl && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#24272B] px-2 py-0.5 text-[10px] font-bold text-[#F7F4EE]">
              {isPt ? "Prévia" : "Vista previa"}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2.5">
          <div>
            <p className="text-sm font-bold text-[#24272B]">
              {isPt ? "Foto de perfil" : "Foto de perfil"}
            </p>
            <p className="mt-0.5 text-xs text-[#565C64]">
              {isPt
                ? "Envie uma imagem JPG, JPEG, PNG ou WebP de até 5 MB."
                : "Subí una imagen JPG, JPEG, PNG o WebP de hasta 5 MB."}
            </p>
          </div>

          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            onChange={handleFileChange}
            disabled={busy}
            className="sr-only"
          />

          <div className="flex flex-wrap items-center gap-2">
            {!selectedFile ? (
              <>
                <label
                  htmlFor={inputId}
                  className={`inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#D8D0C2] bg-white px-3.5 text-xs font-bold text-[#24272B] transition-colors hover:border-[#F28C28] hover:bg-[#FFF8EE] focus-within:ring-2 focus-within:ring-[#F28C28] ${
                    busy ? "pointer-events-none opacity-60" : ""
                  }`}
                >
                  <Camera className="h-4 w-4 text-[#C86D14]" aria-hidden="true" />
                  <span>
                    {currentAvatarUrl
                      ? isPt
                        ? "Substituir foto"
                        : "Cambiar foto"
                      : isPt
                        ? "Escolher foto"
                        : "Elegir foto"}
                  </span>
                </label>

                {currentAvatarUrl && !confirmRemove && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setFeedback(null);
                      setConfirmRemove(true);
                    }}
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#E5A49B] bg-white px-3.5 text-xs font-semibold text-[#9F2D20] transition-colors hover:bg-[#FDF2F0] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B93829]"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{isPt ? "Remover foto" : "Eliminar foto"}</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleUpload()}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#24272B] px-4 text-xs font-bold text-[#F7F4EE] transition-colors hover:bg-[#343A40] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                >
                  {isUploading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Upload className="h-4 w-4 text-[#F28C28]" aria-hidden="true" />
                  )}
                  <span>
                    {isUploading
                      ? isPt
                        ? "Enviando…"
                        : "Subiendo…"
                      : isPt
                        ? "Confirmar envio"
                        : "Confirmar subida"}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    clearSelection();
                    setFeedback(null);
                  }}
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#D8D0C2] bg-white px-3.5 text-xs font-semibold text-[#343A40] transition-colors hover:bg-[#F7F4EE] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{isPt ? "Cancelar" : "Cancelar"}</span>
                </button>
              </>
            )}
          </div>

          {confirmRemove && currentAvatarUrl && !selectedFile && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#E5A49B] bg-[#FDF2F0] px-3 py-2 text-xs">
              <span className="font-semibold text-[#9F2D20]">
                {isPt
                  ? "Remover sua foto atual e exibir suas iniciais?"
                  : "¿Eliminar tu foto actual y mostrar tus iniciales?"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleRemove()}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-[#B93829] px-3 text-xs font-bold text-white hover:bg-[#9F2D20] disabled:opacity-60"
                >
                  {isRemoving ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>{isPt ? "Confirmar remoção" : "Confirmar eliminación"}</span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirmRemove(false)}
                  className="inline-flex min-h-8 items-center rounded-lg border border-[#D8D0C2] bg-white px-3 text-xs font-semibold text-[#343A40]"
                >
                  {isPt ? "Cancelar" : "Cancelar"}
                </button>
              </div>
            </div>
          )}

          {feedback && (
            <p
              role={feedback.type === "error" ? "alert" : "status"}
              className={`rounded-xl border px-3 py-2 text-xs font-medium ${
                feedback.type === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {feedback.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
