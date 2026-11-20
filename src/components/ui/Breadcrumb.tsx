import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  ariaLabel?: string;
  className?: string;
  variant?: "on-light" | "on-dark";
}

export function Breadcrumb({
  items,
  ariaLabel = "Breadcrumb",
  className = "",
  variant = "on-light",
}: BreadcrumbProps) {
  if (items.length === 0) return null;

  const isDark = variant === "on-dark";

  return (
    <nav aria-label={ariaLabel} className={className}>
      <ol
        className={`flex flex-wrap items-center gap-1.5 text-xs font-medium ${
          isDark ? "text-[#C4BEB4]" : "text-[#565C64]"
        }`}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex min-w-0 items-center gap-1.5">
              {index > 0 && (
                <ChevronRight
                  className={`h-3.5 w-3.5 shrink-0 ${
                    isDark ? "text-[#7A8089]" : "text-[#9B958B]"
                  }`}
                  aria-hidden="true"
                />
              )}
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={`truncate font-semibold ${
                    isDark ? "text-white" : "text-[#24272B]"
                  }`}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={`truncate rounded-md px-1 py-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] ${
                    isDark ? "hover:text-[#F28C28]" : "hover:text-[#A65206]"
                  }`}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
