import React from "react";
import {
  fetchPublicCategoriesServer,
  searchPublicProfessionalsServer,
} from "@/services/supabase/publicServer";
import { SERVICE_CATEGORIES } from "@/features/categories/data";
import { DirectoryClient } from "@/features/professionals/components/DirectoryClient";
import type { CategorySlug, CountryCode } from "@/types/domain";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 6;
const VALID_CATEGORIES = new Set<string>(SERVICE_CATEGORIES.map((c) => c.slug));

type RawSearchParams = Record<string, string | string[] | undefined>;

function readParam(params: RawSearchParams, key: string): string {
  const val = params[key];
  return Array.isArray(val) ? (val[0] ?? "") : (val ?? "");
}

export default async function ProfessionalsDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const resolved = await searchParams;

  const query = readParam(resolved, "q").trim();
  const rawCategory = readParam(resolved, "category").trim();
  const category: CategorySlug | "all" = VALID_CATEGORIES.has(rawCategory)
    ? (rawCategory as CategorySlug)
    : "all";

  const rawCountry = readParam(resolved, "country").toUpperCase();
  const country: CountryCode | "ALL" =
    rawCountry === "AR" || rawCountry === "BR" ? rawCountry : "ALL";

  const city = readParam(resolved, "city").trim() || "all";

  const rawContact = readParam(resolved, "contact").toLowerCase();
  const contactMode: "all" | "direct" | "quote" =
    rawContact === "direct" || rawContact === "quote" ? rawContact : "all";

  const rawSort = readParam(resolved, "sort").toLowerCase();
  const sortBy: "recent" | "experience" | "rating" =
    rawSort === "experience" || rawSort === "rating" ? rawSort : "recent";

  const parsedPage = Number.parseInt(readParam(resolved, "page"), 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const [categoriesOutcome, searchOutcome] = await Promise.all([
    fetchPublicCategoriesServer(),
    searchPublicProfessionalsServer({
      query,
      categorySlug: category,
      country,
      city,
      contactMode,
      sortBy,
      page,
      pageSize: PAGE_SIZE,
    }),
  ]);

  return (
    <DirectoryClient
      initialCategories={categoriesOutcome.data}
      initialCategoriesStatus={categoriesOutcome.status}
      initialResult={searchOutcome.data}
      initialResultStatus={searchOutcome.status}
      initialFilters={{
        query,
        category,
        country,
        city,
        contactMode,
        sortBy,
        page,
      }}
    />
  );
}
