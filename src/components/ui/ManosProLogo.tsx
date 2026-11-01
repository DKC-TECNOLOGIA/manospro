import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ManosProLogoProps {
  variant?: "dark-on-light" | "light-on-dark";
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** Displays the supplied square logo without adding a second wordmark. */
export function ManosProLogo({
  variant = "dark-on-light",
  size = "md",
  className,
}: ManosProLogoProps) {
  const dimensions = {
    sm: "h-12 w-12",
    md: "h-[3.75rem] w-[3.75rem]",
    lg: "h-16 w-16",
  }[size];

  return (
    <span className={cn("inline-flex shrink-0 select-none", className)}>
      <span
        className={cn(
          "relative inline-block shrink-0 rounded-xl shadow-sm ring-1",
          variant === "dark-on-light" ? "ring-[#D8D0C2]" : "ring-white/20",
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
          className="object-contain object-center contrast-[1.08]"
        />
      </span>
    </span>
  );
}
