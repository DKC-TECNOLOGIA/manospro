"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Shield, UserCircle2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useLocale } from "@/features/i18n/LocaleContext";

interface AccountMenuProps {
  user: User;
  dashboardHref: string | null;
  isAdmin: boolean;
  isMobile?: boolean;
  onSignOut: () => Promise<void>;
  onNavigate?: () => void;
}

export function AccountMenu({
  user,
  dashboardHref,
  isAdmin,
  isMobile = false,
  onSignOut,
  onNavigate,
}: AccountMenuProps) {
  const { locale } = useLocale();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  const isPortuguese = locale === "pt-BR";

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const closeMenu = () => {
    setIsOpen(false);
    onNavigate?.();
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setSignOutError(false);
    try {
      await onSignOut();
      closeMenu();
      router.replace("/");
      router.refresh();
    } catch {
      setSignOutError(true);
    } finally {
      setIsSigningOut(false);
    }
  };

  const itemClass = "flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-[#343A40] transition-colors hover:bg-[#F3F0E9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]";

  return (
    <div ref={rootRef} className={isMobile ? "w-full" : "relative"}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={isPortuguese ? "Abrir menu da conta" : "Abrir menú de la cuenta"}
        onClick={() => setIsOpen((open) => !open)}
        className={isMobile
          ? "flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
          : "inline-flex h-10 items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-3 text-sm font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
        }
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <UserCircle2 className="h-4 w-4 shrink-0 text-[var(--mp-muted-on-forest)]" aria-hidden="true" />
          <span>{isPortuguese ? "Minha conta" : "Mi cuenta"}</span>
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          id={menuId}
          className={isMobile
            ? "mt-2 rounded-xl border border-[var(--mp-forest-border)] bg-white p-2 text-[#24272B] shadow-lg"
            : "absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-[#DFD8CC] bg-white p-2 text-[#24272B] shadow-xl"
          }
        >
          <div className="truncate border-b border-[#ECE6DC] px-3 py-2.5 text-xs text-[#565C64]">
            {user.email}
          </div>
          <nav aria-label={isPortuguese ? "Opções da conta" : "Opciones de la cuenta"} className="py-1">
            <Link href="/conta" onClick={closeMenu} className={itemClass}>
              {isPortuguese ? "Minha conta" : "Mi cuenta"}
            </Link>
            <Link href="/conta#perfil" onClick={closeMenu} className={itemClass}>
              {isPortuguese ? "Editar perfil" : "Editar perfil"}
            </Link>
            <Link href="/conta#configuracoes" onClick={closeMenu} className={itemClass}>
              {isPortuguese ? "Configurações" : "Configuración"}
            </Link>
            <Link href="/conta#seguranca" onClick={closeMenu} className={itemClass}>
              {isPortuguese ? "Segurança" : "Seguridad"}
            </Link>
            <Link href={dashboardHref ?? "/cliente"} onClick={closeMenu} className={itemClass}>
              {isAdmin ? <Shield className="h-4 w-4" aria-hidden="true" /> : <UserCircle2 className="h-4 w-4" aria-hidden="true" />}
              {isAdmin
                ? (isPortuguese ? "Painel administrativo" : "Panel de administración")
                : dashboardHref === "/profissional"
                  ? (isPortuguese ? "Área profissional" : "Área profesional")
                  : (isPortuguese ? "Área do cliente" : "Área del cliente")}
            </Link>
          </nav>
          <div className="border-t border-[#ECE6DC] pt-1">
            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={isSigningOut}
              className={`${itemClass} w-full text-left disabled:cursor-wait disabled:opacity-60`}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {isSigningOut
                ? (isPortuguese ? "Saindo…" : "Saliendo…")
                : (isPortuguese ? "Sair da conta" : "Cerrar sesión")}
            </button>
          </div>
          {signOutError && (
            <p role="alert" className="px-3 py-2 text-xs font-medium text-red-700">
              {isPortuguese ? "Não foi possível sair. Tente novamente." : "No se pudo cerrar sesión. Intentá de nuevo."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
