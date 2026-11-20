import React from "react";
import {
  fetchPublicCategoriesServer,
  fetchPublicCategoryBySlugServer,
  searchPublicProfessionalsServer,
} from "@/services/supabase/publicServer";
import { getCategoryBySlug } from "@/features/categories/data";
import { CategoryDetailClient } from "@/features/categories/components/CategoryDetailClient";
import type { CategorySlug } from "@/types/domain";

export const revalidate = 60;

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [allCategoriesOutcome, categoryOutcome, prosOutcome] =
    await Promise.all([
      fetchPublicCategoriesServer(),
      fetchPublicCategoryBySlugServer(slug),
      searchPublicProfessionalsServer({
        categorySlug: slug as CategorySlug,
        page: 1,
        pageSize: 6,
      }),
    ]);

  const resolvedCategory =
    categoryOutcome.data ??
    (categoryOutcome.status !== "ok" ? (getCategoryBySlug(slug) ?? null) : null);

  return (
    <CategoryDetailClient
      slug={slug}
      initialAllCategories={allCategoriesOutcome.data}
      initialCategory={resolvedCategory}
      initialCategoryStatus={categoryOutcome.status}
      initialResult={prosOutcome.data}
      initialProsStatus={prosOutcome.status}
    />
  );
}
