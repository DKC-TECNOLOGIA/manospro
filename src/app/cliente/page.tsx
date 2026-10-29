"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Loader2,
  Lock,
  MessageSquare,
} from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { createSupabaseBrowserClient } from "@/services/supabase/client";
import {
  fetchUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type InternalNotificationItem,
} from "@/services/supabase/messaging";
import { ChatWorkspace } from "@/features/messaging/components/ChatWorkspace";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type ClientTabId = "messages" | "notifications";

function ClientAreaContent() {
  const searchParams = useSearchParams();
  const initialConv = searchParams.get("conv");
  const { dictionary, formatDate, locale } = useLocale();

  const [activeTab, setActiveTab] = useState<ClientTabId>("messages");
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<
    InternalNotificationItem[]
  >([]);

  const loadClientSession = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserId(null);
        setUserEmail(null);
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email ?? null);

      const notifs = await fetchUserNotifications(30);
      setNotifications(notifs);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadClientSession();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadClientSession]);

  if (isLoadingAuth) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#F28C28]" />
        <p className="mt-3 text-sm font-semibold text-[#24272B]">
          {locale === "es-AR"
            ? "Verificando sesión en Supabase..."
            : "Verificando sessão no Supabase..."}
        </p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14 text-center">
        <div className="rounded-2xl border border-[#DFD8CC] bg-white p-8 shadow-xs">
          <Lock className="mx-auto h-10 w-10 text-[#F28C28]" />
          <h1 className="mt-4 text-2xl font-extrabold text-[#24272B]">
            {dictionary.privateAreas.clientTitle}
          </h1>
          <p className="mt-2 text-sm text-[#525860]">
            {locale === "es-AR"
              ? "Ingresá con tu cuenta para acceder a tus conversaciones privadas, adjuntos y notificaciones de presupuestos."
              : "Entre com sua conta para acessar suas conversas privadas, anexos e notificações de orçamentos."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/entrar">
              <Button variant="primary">{dictionary.nav.login}</Button>
            </Link>
            <Link href="/cadastro">
              <Button variant="graphite">{dictionary.nav.register}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const unreadNotifications = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Cabecera */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#DFD8CC] pb-6 sm:flex-row sm:items-end">
        <div>
          <Badge variant="emerald">Sesión activa: {userEmail}</Badge>
          <h1 className="mt-2 text-3xl font-extrabold text-[#24272B]">
            {dictionary.privateAreas.clientTitle}
          </h1>
          <p className="mt-1 text-sm text-[#525860]">
            {locale === "es-AR"
              ? "Conversaciones privadas en tiempo real, envío de fotos en almacenamiento protegido y seguimiento de presupuestos."
              : "Conversas privadas em tempo real, envio de fotos em armazenamento protegido e acompanhamento de orçamentos."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("messages")}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors ${
              activeTab === "messages"
                ? "bg-[#24272B] text-[#F7F4EE]"
                : "border border-[#D4CCC0] bg-white text-[#24272B]"
            }`}
          >
            <MessageSquare className="h-4 w-4 text-[#F28C28]" />
            <span>
              {locale === "es-AR"
                ? "Mensajes y Presupuestos"
                : "Mensagens e Orçamentos"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("notifications")}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors ${
              activeTab === "notifications"
                ? "bg-[#24272B] text-[#F7F4EE]"
                : "border border-[#D4CCC0] bg-white text-[#24272B]"
            }`}
          >
            <Bell className="h-4 w-4 text-[#F28C28]" />
            <span>
              {locale === "es-AR" ? "Notificaciones" : "Notificações"} (
              {unreadNotifications})
            </span>
          </button>

          <Link
            href="/profissionais"
            className="inline-flex h-10 items-center rounded-xl border border-[#D4CCC0] bg-white px-4 text-xs font-semibold text-[#24272B] hover:border-[#24272B]"
          >
            {dictionary.nav.professionals}
          </Link>
        </div>
      </div>

      <div className="mt-8">
        {activeTab === "messages" ? (
          <ChatWorkspace initialConversationId={initialConv} />
        ) : (
          <section className="rounded-2xl border border-[#DFD8CC] bg-white p-6 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ECE6DC] pb-4">
              <h2 className="text-lg font-bold text-[#24272B]">
                {locale === "es-AR"
                  ? "Historial de notificaciones internas"
                  : "Histórico de notificações internas"}
              </h2>
              {unreadNotifications > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<CheckCheck className="h-4 w-4" />}
                  onClick={async () => {
                    await markAllNotificationsRead();
                    const now = new Date().toISOString();
                    setNotifications((prev) =>
                      prev.map((n) => ({ ...n, readAt: now }))
                    );
                  }}
                >
                  {locale === "es-AR"
                    ? "Marcar todas como leídas"
                    : "Marcar todas como lidas"}
                </Button>
              )}
            </div>

            {notifications.length === 0 ? (
              <p className="py-10 text-center text-sm text-[#525860]">
                {locale === "es-AR"
                  ? "No tenés notificaciones registradas."
                  : "Você não possui notificações registradas."}
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${
                      n.readAt
                        ? "border-[#ECE6DC] bg-[#F7F4EE]/40 opacity-75"
                        : "border-[#F28C28] bg-[#FFF8EB]"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-[#24272B]">
                        {n.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[#525860]">{n.body}</p>
                      <span className="mt-1 block text-[11px] text-[#666C75]">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!n.readAt && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await markNotificationRead(n.id);
                            setNotifications((prev) =>
                              prev.map((item) =>
                                item.id === n.id
                                  ? {
                                      ...item,
                                      readAt: new Date().toISOString(),
                                    }
                                  : item
                              )
                            );
                          }}
                        >
                          {locale === "es-AR"
                            ? "Marcar leída"
                            : "Marcar lida"}
                        </Button>
                      )}
                      {n.conversationId && (
                        <Button
                          variant="graphite"
                          size="sm"
                          onClick={() => setActiveTab("messages")}
                        >
                          {locale === "es-AR"
                            ? "Ver conversación"
                            : "Ver conversa"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default function ClientAreaPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-[#525860]">
          Cargando área de cliente...
        </div>
      }
    >
      <ClientAreaContent />
    </Suspense>
  );
}
