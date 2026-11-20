import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/features/i18n/LocaleContext";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AuthProvider } from "@/features/auth/AuthProvider";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ManosPro — Profesionales cerca de vos | Argentina y Brasil",
    template: "%s | ManosPro",
  },
  description:
    "Conectamos clientes con profesionales autónomos verificados en Argentina y Brasil. Buscá por oficio, compará servicios, conversá y solicitá presupuestos en ARS o BRL.",
  icons: {
    icon: "/manospro-logo.png",
    apple: "/manospro-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-AR"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-[#F7F4EE] font-sans text-[#24272B] antialiased selection:bg-[#F28C28]/25 selection:text-[#1B1E22]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-[#F28C28] focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-[#1B1E22] focus:shadow-lg focus:outline-none"
        >
          Ir al contenido principal / Ir para o conteúdo principal
        </a>
        <AuthProvider>
          <LocaleProvider>
            <SiteHeader />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
