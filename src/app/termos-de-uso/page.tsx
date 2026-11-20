import type { Metadata } from "next";
import { LegalPageClient } from "@/features/legal/LegalPageClient";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Condições de utilização do ManosPro, cadastro, verificação de perfis, regras de publicação e responsabilidades de clientes e profissionais.",
};

export default function TermosDeUsoPage() {
  return <LegalPageClient docKey="terms" />;
}
