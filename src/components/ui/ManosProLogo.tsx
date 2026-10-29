import React from "react";
import { cn } from "@/lib/utils";

interface ManosProLogoProps {
  variant?: "dark-on-light" | "light-on-dark";
  size?: "sm" | "md" | "lg";
  showSlogan?: boolean;
  sloganText?: string;
  className?: string;
}

/**
 * Propuesta de logotipo original ManosPro:
 * Combina un isotipo geométrico de alta legibilidad en tamaños reducidos (24px–48px):
 * - Escudo octogonal suave en Grafite (#24272B) que transmite solidez técnica y oficio.
 * - Dos arcos entrelazados en Naranja (#F28C28) y Creme (#F7F4EE) que forman la letra "M"
 *   de "Manos", evocando simultáneamente un apretón de manos (conexión humana) y la silueta
 *   de una llave de ajuste / techo de hogar.
 */
export function ManosProLogo({
  variant = "dark-on-light",
  size = "md",
  showSlogan = false,
  sloganText = "Profesionales cerca de vos",
  className,
}: ManosProLogoProps) {
  const iconDimensions = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  }[size];

  const wordmarkSize = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }[size];

  const textColor =
    variant === "dark-on-light" ? "text-[#24272B]" : "text-[#F7F4EE]";
  const sloganColor =
    variant === "dark-on-light" ? "text-[#5A6068]" : "text-[#C7C2B8]";

  return (
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center rounded-xl bg-[#24272B] shadow-xs ring-1 ring-[#F28C28]/30",
          iconDimensions
        )}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-3/4 w-3/4"
        >
          {/* Arco estructural superior (Techo / Llave de oficio) */}
          <path
            d="M8 17.5L20 9L32 17.5"
            stroke="#F28C28"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* M entrelazada (Manos conectadas + Pilares de servicio) */}
          <path
            d="M10.5 29V19.5L16.8 25.2L20 21.8L23.2 25.2L29.5 19.5V29"
            stroke="#F7F4EE"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Punto de unión central (Tuerca / Vínculo cliente-profesional) */}
          <circle cx="20" cy="16" r="2.3" fill="#F28C28" />
        </svg>
      </div>

      <div className="flex flex-col leading-none">
        <span
          className={cn(
            "font-extrabold tracking-tight",
            wordmarkSize,
            textColor
          )}
        >
          Manos<span className="text-[#F28C28]">Pro</span>
        </span>
        {showSlogan && (
          <span className={cn("mt-1 text-[11px] font-medium", sloganColor)}>
            {sloganText}
          </span>
        )}
      </div>
    </div>
  );
}
