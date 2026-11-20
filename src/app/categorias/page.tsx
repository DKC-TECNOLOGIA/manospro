import React from "react";
import { fetchPublicCategoriesServer } from "@/services/supabase/publicServer";
import { CategoriesIndexClient } from "@/features/categories/components/CategoriesIndexClient";

export const revalidate = 60;

export default async function CategoriesIndexPage() {
  const outcome = await fetchPublicCategoriesServer();

  return (
    <CategoriesIndexClient
      initialCategories={outcome.data}
      initialStatus={outcome.status}
    />
  );
}
