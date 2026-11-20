"use client";

import { useState } from "react";
import { getAvatarInitials } from "@/services/supabase/avatarStorage";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src: string | null | undefined;
  name: string | null | undefined;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  shape?: "circle" | "rounded";
  className?: string;
}

const SIZE_CLASSES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-15 w-15 text-base",
  lg: "h-20 w-20 text-lg",
  xl: "h-22 w-22 text-xl",
};

export function UserAvatar({
  src,
  name,
  size = "md",
  shape = "rounded",
  className,
}: UserAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const cleanSrc = src?.trim() || null;
  const showImage = Boolean(cleanSrc && failedSrc !== cleanSrc);
  const radiusClass = shape === "circle" ? "rounded-full" : "rounded-xl";

  if (showImage && cleanSrc) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={cleanSrc}
        alt={name?.trim() || "Foto de perfil"}
        onError={() => setFailedSrc(cleanSrc)}
        loading="lazy"
        className={cn(
          "shrink-0 object-cover border border-[#E4DDD2] bg-[#EFEAE1]",
          SIZE_CLASSES[size],
          radiusClass,
          className
        )}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-[#24272B] font-bold text-[#F28C28]",
        SIZE_CLASSES[size],
        radiusClass,
        className
      )}
    >
      {getAvatarInitials(name)}
    </span>
  );
}
