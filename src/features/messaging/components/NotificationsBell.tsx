"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { createSupabaseBrowserClient } from "@/services/supabase/client";
import {
  fetchUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type InternalNotificationItem,
} from "@/services/supabase/messaging";

export function NotificationsBell() {
  const { locale } = useLocale();
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<
    InternalNotificationItem[]
  >([]);
  const [isOpen, setIsOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setUserId(null);
        setNotifications([]);
        return;
      }
      setUserId(user.id);
      const list = await fetchUserNotifications(20);
      setNotifications(list);
    } catch {
      // Silencioso en barra superior si no hay sesión
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadNotifications();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadNotifications]);

  // Suscripción en tiempo real a nuevas notificaciones del usuario autenticado
  useEffect(() => {
    if (!userId) return;
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`user-notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const id = String(row.id ?? "");
          if (!id) return;
          setNotifications((prev) => {
            if (prev.some((n) => n.id === id)) return prev;
            return [
              {
                id,
                userId: String(row.user_id ?? userId),
                actorId: row.actor_id ? String(row.actor_id) : null,
                conversationId: row.conversation_id
                  ? String(row.conversation_id)
                  : null,
                type:
                  row.type === "quote_update" ? "quote_update" : "new_message",
                title: String(row.title ?? "Notificación"),
                body: String(row.body ?? ""),
                readAt: row.read_at ? String(row.read_at) : null,
                createdAt: String(row.created_at ?? new Date().toISOString()),
              },
              ...prev,
            ];
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  if (!userId) return null;

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const handleMarkOneRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n
      )
    );
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: now })));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={
          locale === "es-AR" ? "Ver notificaciones" : "Ver notificações"
        }
        className="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/25 bg-white/5 text-white transition-colors hover:border-white/50 hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
      >
        <Bell className="h-4 w-4 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F28C28] px-1 font-mono text-[10px] font-bold text-[#1B1E22]">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-[#DFD8CC] bg-white p-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#ECE6DC] pb-2.5">
            <span className="text-xs font-extrabold text-[#24272B]">
              {locale === "es-AR"
                ? "Notificaciones internas"
                : "Notificações internas"}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void handleMarkAllRead()}
                className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-[#C86D14] hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>
                  {locale === "es-AR" ? "Marcar leídas" : "Marcar lidas"}
                </span>
              </button>
            )}
          </div>

          <div className="mt-2 max-h-72 divide-y divide-[#ECE6DC] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#666C75]">
                {locale === "es-AR"
                  ? "No tenés notificaciones pendientes."
                  : "Você não possui notificações pendentes."}
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`py-2.5 text-xs ${
                    n.readAt ? "opacity-65" : "font-semibold"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-[#24272B]">{n.title}</p>
                    {!n.readAt && (
                      <button
                        type="button"
                        onClick={() => void handleMarkOneRead(n.id)}
                        className="shrink-0 cursor-pointer text-[10px] text-[#C86D14] hover:underline"
                      >
                        {locale === "es-AR" ? "Leída" : "Lida"}
                      </button>
                    )}
                  </div>
                  {n.body && (
                    <p className="mt-0.5 line-clamp-2 text-[#525860]">
                      {n.body}
                    </p>
                  )}
                  {n.conversationId && (
                    <Link
                      href={`/cliente?conv=${n.conversationId}`}
                      onClick={() => {
                        void handleMarkOneRead(n.id);
                        setIsOpen(false);
                      }}
                      className="mt-1 inline-block text-[11px] font-bold text-[#C86D14] hover:underline"
                    >
                      {locale === "es-AR"
                        ? "Abrir conversación"
                        : "Abrir conversa"}
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
