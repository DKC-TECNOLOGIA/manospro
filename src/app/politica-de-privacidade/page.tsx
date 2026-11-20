import type { Metadata } from "next";
import { LegalPageClient } from "@/features/legal/LegalPageClient";

export const metadata: Metadata = {
  title: "Política de Privacidade e LGPD",
  description:
    "Política de Privacidade e Proteção de Dados do ManosPro conforme a LGPD (Brasil) e a Ley 25.326 (Argentina).",
};

export default function PoliticaDePrivacidadePage() {
  return <LegalPageClient docKey="privacy" />;
}
