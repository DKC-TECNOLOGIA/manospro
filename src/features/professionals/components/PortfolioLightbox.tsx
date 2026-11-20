"use client";

import React, { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import type { RealPortfolioPhoto } from "@/services/supabase/professionals";

interface PortfolioLightboxProps {
  photos: RealPortfolioPhoto[];
  activeIndex: number;
  locale: "es-AR" | "pt-BR";
  onClose: () => void;
  onChangeIndex: (nextIndex: number) => void;
}

export function PortfolioLightbox({
  photos,
  activeIndex,
  locale,
  onClose,
  onChangeIndex,
}: PortfolioLightboxProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isPortuguese = locale === "pt-BR";
  const current = photos[activeIndex];

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowRight" && photos.length > 1) {
        onChangeIndex((activeIndex + 1) % photos.length);
      } else if (event.key === "ArrowLeft" && photos.length > 1) {
        onChangeIndex((activeIndex - 1 + photos.length) % photos.length);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus?.();
    };
  }, [activeIndex, photos.length, onClose, onChangeIndex]);

  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        isPortuguese
          ? `Galeria de trabalhos — foto ${activeIndex + 1} de ${photos.length}`
          : `Galería de trabajos — foto ${activeIndex + 1} de ${photos.length}`
      }
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111316]/85 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#1B1E22] text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <span className="font-mono text-xs font-semibold text-[#CFCAC0] tabular-nums">
            {activeIndex + 1} / {photos.length}
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={isPortuguese ? "Fechar galeria" : "Cerrar galería"}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="relative flex min-h-[300px] flex-1 items-center justify-center bg-[#111316] p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.publicUrl}
            alt={current.caption || "Trabalho realizado"}
            className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain"
          />

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  onChangeIndex((activeIndex - 1 + photos.length) % photos.length)
                }
                aria-label={isPortuguese ? "Foto anterior" : "Foto anterior"}
                className="absolute top-1/2 left-3 inline-flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-[#1B1E22]/85 text-white hover:bg-[#F28C28] hover:text-[#1B1E22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onChangeIndex((activeIndex + 1) % photos.length)}
                aria-label={isPortuguese ? "Próxima foto" : "Próxima foto"}
                className="absolute top-1/2 right-3 inline-flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-[#1B1E22]/85 text-white hover:bg-[#F28C28] hover:text-[#1B1E22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </>
          )}
        </div>

        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-sm font-bold text-white">{current.caption}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#C4BEB4]">
            <MapPin className="h-3.5 w-3.5 text-[#F28C28]" aria-hidden="true" />
            <span>
              {current.zoneLabel} · {current.workYear}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
