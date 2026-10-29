"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ServiceCategory } from "@/types/domain";
import { useLocale } from "@/features/i18n/LocaleContext";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

interface CategoryCardProps {
  category: ServiceCategory;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const { dictionary, locale, tText } = useLocale();
  const examples = category.examples[locale];

  return (
    <Link
      href={`/categorias/${category.slug}`}
      className="group flex flex-col justify-between rounded-2xl border border-[#DFD8CC] bg-white p-5 shadow-xs transition-colors duration-150 hover:border-[#F28C28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#24272B] text-[#F28C28] transition-colors group-hover:bg-[#F28C28] group-hover:text-[#1B1E22]">
            <CategoryIcon name={category.iconName} className="h-5 w-5" />
          </div>
        </div>

        <h3 className="mt-4 text-lg font-bold text-[#24272B] group-hover:text-[#C86D14] transition-colors">
          {tText(category.name)}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-[#525860]">
          {tText(category.shortDescription)}
        </p>
      </div>

      <div className="mt-4 border-t border-[#ECE6DC] pt-3.5">
        {examples.length > 0 && (
          <>
            <p className="text-[11px] font-medium text-[#6B717A]">
              {dictionary.categoriesSection.examplesLabel}
            </p>
            <p className="mt-1 text-xs font-medium text-[#24272B]">
              {examples.join(" · ")}
            </p>
          </>
        )}
        <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#C86D14] group-hover:text-[#24272B]">
          <span>{dictionary.categoriesSection.exploreCategory}</span>
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}
