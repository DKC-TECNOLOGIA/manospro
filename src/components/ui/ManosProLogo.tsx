import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ManosProLogoProps {
  variant?: "dark-on-light" | "light-on-dark";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export function ManosProLogo({
  variant = "dark-on-light",
  size = "md",
  className,
}: ManosProLogoProps) {
  const dimensions = {
    xs: "h-9 w-9",
    sm: "h-11 w-11",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  }[size];

  return (
    <span className={cn("inline-flex shrink-0 select-none", className)}>
      <span
        className={cn(
          "relative inline-block shrink-0 overflow-hidden rounded-xl shadow-xs ring-1",
          variant === "dark-on-light"
            ? "bg-white ring-[#D8D0C2]"
            : "bg-[#1B1E22] ring-white/15",
          dimensions
        )}
      >
        <Image
          src="/manospro-logo.png"
          alt=""
          fill
          sizes="64px"
          quality={95}
          priority
          className="object-contain object-center p-0.5 contrast-[1.06]"
        />
      </span>
    </span>
  );
}
