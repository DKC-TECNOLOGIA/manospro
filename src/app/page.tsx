import React from "react";
import {
  fetchPublicCategoriesServer,
  searchPublicProfessionalsServer,
} from "@/services/supabase/publicServer";
import { HomeClient } from "@/features/home/HomeClient";

export const revalidate = 60;

export default async function HomePage() {
  const [categoriesOutcome, featuredOutcome] = await Promise.all([
    fetchPublicCategoriesServer(),
    searchPublicProfessionalsServer({
      country: "ALL",
      page: 1,
      pageSize: 6,
    }),
  ]);

  return (
    <HomeClient
      initialCategories={categoriesOutcome.data}
      initialCategoriesStatus={categoriesOutcome.status}
      initialFeatured={featuredOutcome.data.items}
      initialFeaturedStatus={featuredOutcome.status}
    />
  );
}
