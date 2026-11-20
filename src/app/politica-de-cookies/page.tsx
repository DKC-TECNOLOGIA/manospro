import type { Metadata } from "next";
import { LegalPageClient } from "@/features/legal/LegalPageClient";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description:
    "Informações transparentes sobre cookies essenciais de sessão e armazenamento local utilizados pelo ManosPro.",
};

export default function PoliticaDeCookiesPage() {
  return <LegalPageClient docKey="cookies" />;
}
