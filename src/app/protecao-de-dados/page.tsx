import { redirect } from "next/navigation";

/**
 * Rota canônica consolidada em /politica-de-privacidade#lgpd para evitar
 * duplicação de conteúdo jurídico mantendo compatibilidade com links diretos.
 */
export default function ProtecaoDeDadosRedirectPage() {
  redirect("/politica-de-privacidade#lgpd");
}
