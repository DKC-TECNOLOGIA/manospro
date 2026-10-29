import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/features/i18n/LocaleContext";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: {
    default: "ManosPro — Profesionales cerca de vos | Argentina y Brasil",
    template: "%s | ManosPro",
  },
  description:
    "Conectamos clientes con profesionales autónomos en Argentina y Brasil. Buscá por oficio, consultá perfiles, conversá y solicitá presupuestos en ARS o BRL.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR">
      <body className="flex min-h-screen flex-col bg-[#F7F4EE] text-[#24272B] antialiased">
        <LocaleProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}
