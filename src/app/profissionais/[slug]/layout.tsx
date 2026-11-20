import React from "react";
import type { Metadata } from "next";
import { getCachedPublicProfessionalBySlugServer } from "@/services/supabase/publicServer";
import { InitialProfileProvider } from "@/features/professionals/components/InitialProfileContext";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const outcome = await getCachedPublicProfessionalBySlugServer(slug);

  if (outcome.status === "ok" && outcome.data) {
    const pro = outcome.data;
    const specialty = pro.primarySpecialtyPtBr || pro.primarySpecialtyEsAr;
    const location = [pro.neighborhood, pro.city].filter(Boolean).join(", ");
    const description = pro.bio
      ? pro.bio.slice(0, 155)
      : [specialty, location].filter(Boolean).join(" · ");

    return {
      title: pro.fullName,
      description:
        description ||
        "Perfil profissional publicado e verificado no ManosPro.",
    };
  }

  return {
    title: "Perfil profissional",
    description:
      "Consulte profissionais autônomos verificados no Brasil e na Argentina pelo ManosPro.",
  };
}

export default async function ProfessionalSlugLayout({
  params,
  children,
}: {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}) {
  const { slug } = await params;
  const outcome = await getCachedPublicProfessionalBySlugServer(slug);

  return (
    <InitialProfileProvider slug={slug} outcome={outcome}>
      {children}
    </InitialProfileProvider>
  );
}
