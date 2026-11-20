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
  const examples = category.examples[locale].slice(0, 3);
  const categoryName = tText(category.name);

  return (
    <Link
      href={`/categorias/${category.slug}`}
      aria-label={`${categoryName} — ${dictionary.categoriesSection.exploreCategory}`}
      className="group flex h-full flex-col justify-between rounded-2xl border border-[#DFD8CC] bg-white p-5 shadow-[0_1px_2px_rgba(27,30,34,0.03)] transition-all duration-150 hover:border-[#F28C28] hover:shadow-[0_8px_20px_rgba(27,30,34,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#24272B] text-[#F28C28] transition-colors group-hover:bg-[#F28C28] group-hover:text-[#1B1E22]">
            <CategoryIcon name={category.iconName} className="h-5 w-5" />
          </div>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#6B717A] transition-colors group-hover:bg-[#FEF3E7] group-hover:text-[#A65206]">
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>

        <h3 className="mt-4 text-base font-extrabold text-[#24272B] transition-colors group-hover:text-[#A65206]">
          {categoryName}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#565C64] sm:text-sm">
          {tText(category.shortDescription)}
        </p>
      </div>

      {examples.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[#ECE6DC] pt-3.5">
          {examples.map((example) => (
            <span
              key={example}
              className="rounded-md bg-[#F7F4EE] px-2 py-0.5 text-[11px] font-medium text-[#3D4249]"
            >
              {example}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
