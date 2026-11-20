import React from "react";
import { Loader2 } from "lucide-react";

export default function ProfessionalProfileLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Carregando perfil profissional..."
      className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#DFD8CC] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#565C64] shadow-2xs">
        <Loader2
          className="h-3.5 w-3.5 animate-spin text-[#F28C28]"
          aria-hidden="true"
        />
        <span>Carregando perfil...</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-2xl border border-[#DFD8CC] bg-white p-6 lg:col-span-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 animate-pulse rounded-2xl bg-[#EAE4DA]" />
            <div className="flex-1 space-y-2.5">
              <div className="h-4 w-32 animate-pulse rounded bg-[#EAE4DA]" />
              <div className="h-6 w-56 animate-pulse rounded bg-[#E4DDD2]" />
              <div className="h-3.5 w-40 animate-pulse rounded bg-[#EFEAE1]" />
            </div>
          </div>
          <div className="mt-6 space-y-2.5 border-t border-[#ECE6DC] pt-5">
            <div className="h-3.5 w-full animate-pulse rounded bg-[#EFEAE1]" />
            <div className="h-3.5 w-5/6 animate-pulse rounded bg-[#EFEAE1]" />
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-[#EFEAE1]" />
          </div>
        </div>

        <div className="rounded-2xl border border-[#DFD8CC] bg-white p-6 lg:col-span-4">
          <div className="h-5 w-40 animate-pulse rounded bg-[#E4DDD2]" />
          <div className="mt-4 h-16 animate-pulse rounded-xl bg-[#F3EFE8]" />
          <div className="mt-4 h-10 animate-pulse rounded-xl bg-[#EAE4DA]" />
        </div>
      </div>
    </div>
  );
}
