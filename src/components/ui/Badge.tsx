import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "orange" | "graphite" | "cream" | "demo" | "emerald";
  className?: string;
}

export function Badge({
  children,
  variant = "cream",
  className,
}: BadgeProps) {
  const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
    orange:
      "bg-[#FEF3E7] text-[#9A4E06] border-[#F28C28]/40",
    graphite:
      "bg-[#24272B] text-[#F7F4EE] border-[#24272B]",
    cream:
      "bg-[#EFEAE1] text-[#353940] border-[#DCD4C6]",
    demo:
      "bg-[#FFF8EB] text-[#8F530B] border-[#E8B26B] font-mono",
    emerald:
      "bg-[#EAF5F0] text-[#176041] border-[#A7D7C2]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
