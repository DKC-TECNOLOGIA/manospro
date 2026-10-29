"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCheck,
  Clock,
  History,
  ImagePlus,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { createSupabaseBrowserClient } from "@/services/supabase/client";
import {
  fetchConversationMessagesPage,
  fetchUserConversations,
  markConversationMessagesRead,
  MESSAGES_PAGE_SIZE,
  resolvePrivateAttachmentSignedUrl,
  sendChatMessage,
  updateConversationQuoteStatus,
  uploadPrivateChatAttachment,
  validateChatAttachmentFile,
  type ChatMessageItem,
  type ConversationListItem,
  type QuoteStatusType,
} from "@/services/supabase/messaging";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface ChatWorkspaceProps {
  initialConversationId?: string | null;
}

function getQuoteStatusLabel(
  status: QuoteStatusType,
  locale: "es-AR" | "pt-BR"
): string {
  const labels: Record<QuoteStatusType, { "es-AR": string; "pt-BR": string }> = {
    direct_chat: {
      "es-AR": "Contacto directo",
      "pt-BR": "Contato direto",
    },
    quote_requested: {
      "es-AR": "Presupuesto solicitado",
      "pt-BR": "Orçamento solicitado",
    },
    quote_sent: {
      "es-AR": "Propuesta enviada",
      "pt-BR": "Proposta enviada",
    },
    accepted: {
      "es-AR": "Presupuesto aceptado",
      "pt-BR": "Orçamento aceito",
    },
    closed: {
      "es-AR": "Finalizado",
      "pt-BR": "Encerrado",
    },
  };
  return labels[status][locale];
}

function formatShortTime(dateISO: string, locale: "es-AR" | "pt-BR"): string {
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function ChatWorkspace({ initialConversationId }: ChatWorkspaceProps) {
  const { locale } = useLocale();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    []
  );
  const [activeConvId, setActiveConvId] = useState<string | null>(
    initialConversationId ?? null
  );

  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Mensajes de la conversación activa + paginación de historial
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [messagesPage, setMessagesPage] = useState(1);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  // Envío de mensaje y adjunto de imagen
  const [draftBody, setDraftBody] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "sending" | "error"
  >("idle");
  const [sendFeedback, setSendFeedback] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  // Estado de conexión Realtime
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetchUserConversations();
      setCurrentUserId(res.currentUserId);
      setConversations(res.conversations);
      setListError(null);

      setActiveConvId((prev) => {
        if (prev && res.conversations.some((c) => c.id === prev)) {
          return prev;
        }
        if (
          initialConversationId &&
          res.conversations.some((c) => c.id === initialConversationId)
        ) {
          return initialConversationId;
        }
        return res.conversations[0]?.id ?? null;
      });
    } catch (err) {
      setListError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar tus conversaciones."
      );
    } finally {
      setIsLoadingList(false);
    }
  }, [initialConversationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadConversations();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadConversations]);

  const loadActiveConversationMessages = useCallback(
    async (convId: string) => {
      setIsLoadingMessages(true);
      setMessagesError(null);
      try {
        const res = await fetchConversationMessagesPage(
          convId,
          1,
          MESSAGES_PAGE_SIZE
        );
        setMessages(res.messages);
        setMessagesPage(1);
        setHasMoreOlder(res.hasMoreOlder);

        // Marcar mensajes recibidos como leídos
        await markConversationMessagesRead(convId);
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
        );
      } catch (err) {
        setMessagesError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar el historial de mensajes."
        );
      } finally {
        setIsLoadingMessages(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!activeConvId) {
      return;
    }
    const timer = window.setTimeout(() => {
      void loadActiveConversationMessages(activeConvId);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeConvId, loadActiveConversationMessages]);

  // Suscripción Supabase Realtime para la conversación activa
  useEffect(() => {
    if (!activeConvId) return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`chat-room-${activeConvId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConvId}`,
        },
        async (payload) => {
          const newRow = payload.new as Record<string, unknown>;
          const newId = String(newRow.id ?? "");
          if (!newId) return;

          const storagePath = newRow.attachment_url
            ? String(newRow.attachment_url)
            : null;
          const signedUrl = await resolvePrivateAttachmentSignedUrl(storagePath);

          setMessages((prev) => {
            if (prev.some((m) => m.id === newId)) return prev;
            const senderId = String(newRow.sender_id ?? "");
            return [
              ...prev,
              {
                id: newId,
                conversationId: String(newRow.conversation_id ?? activeConvId),
                senderId,
                senderName:
                  senderId === currentUserId
                    ? locale === "es-AR"
                      ? "Vos"
                      : "Você"
                    : "Participante",
                body: String(newRow.body ?? ""),
                attachmentStoragePath: storagePath,
                attachmentSignedUrl: signedUrl,
                readAt: newRow.read_at ? String(newRow.read_at) : null,
                createdAt: String(
                  newRow.created_at ?? new Date().toISOString()
                ),
              },
            ];
          });

          if (String(newRow.sender_id ?? "") !== currentUserId) {
            await markConversationMessagesRead(activeConvId);
          }
          void loadConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConvId}`,
        },
        (payload) => {
          const updatedRow = payload.new as Record<string, unknown>;
          const updatedId = String(updatedRow.id ?? "");
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updatedId
                ? {
                    ...m,
                    readAt: updatedRow.read_at
                      ? String(updatedRow.read_at)
                      : m.readAt,
                  }
                : m
            )
          );
        }
      )
      .subscribe((status) => {
        setRealtimeConnected(status === "SUBSCRIBED");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeConvId, currentUserId, locale, loadConversations]);

  const handleLoadOlderMessages = async () => {
    if (!activeConvId || !hasMoreOlder || isLoadingOlder) return;
    setIsLoadingOlder(true);
    try {
      const nextPage = messagesPage + 1;
      const olderRes = await fetchConversationMessagesPage(
        activeConvId,
        nextPage,
        MESSAGES_PAGE_SIZE
      );
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const uniqueOlder = olderRes.messages.filter(
          (m) => !existingIds.has(m.id)
        );
        return [...uniqueOlder, ...prev];
      });
      setMessagesPage(nextPage);
      setHasMoreOlder(olderRes.hasMoreOlder);
    } catch (err) {
      setSendFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "No se pudieron cargar mensajes anteriores.",
      });
    } finally {
      setIsLoadingOlder(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSendFeedback(null);
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validation = validateChatAttachmentFile(file, locale);
    if (!validation.valid) {
      setSendFeedback({ type: "error", message: validation.error });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeConvId) return;
    if (!draftBody.trim() && !selectedFile) return;

    setSendFeedback(null);
    let uploadedStoragePath: string | null = null;

    try {
      if (selectedFile) {
        setUploadStatus("uploading");
        uploadedStoragePath = await uploadPrivateChatAttachment(
          activeConvId,
          selectedFile,
          locale
        );
      }

      setUploadStatus("sending");
      const sentMsg = await sendChatMessage({
        conversationId: activeConvId,
        body: draftBody,
        attachmentStoragePath: uploadedStoragePath,
      });

      setMessages((prev) =>
        prev.some((m) => m.id === sentMsg.id) ? prev : [...prev, sentMsg]
      );
      setDraftBody("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadStatus("idle");

      if (uploadedStoragePath) {
        setSendFeedback({
          type: "success",
          message:
            locale === "es-AR"
              ? "Imagen adjunta subida y confirmada con acceso privado."
              : "Imagem anexada enviada e confirmada com acesso privado.",
        });
      }
      void loadConversations();
    } catch (err) {
      setUploadStatus("error");
      setSendFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : locale === "es-AR"
              ? "Falló el envío del mensaje o archivo adjunto."
              : "Falha ao enviar a mensagem ou arquivo anexo.",
      });
    }
  };

  const handleQuoteStatusChange = async (nextStatus: QuoteStatusType) => {
    if (!activeConvId) return;
    try {
      await updateConversationQuoteStatus(activeConvId, nextStatus);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId ? { ...c, quoteStatus: nextStatus } : c
        )
      );
      setSendFeedback({
        type: "success",
        message:
          locale === "es-AR"
            ? `Estado actualizado a "${getQuoteStatusLabel(nextStatus, locale)}".`
            : `Status atualizado para "${getQuoteStatusLabel(nextStatus, locale)}".`,
      });
    } catch (err) {
      setSendFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "No se pudo actualizar el estado del presupuesto.",
      });
    }
  };

  const activeConversation =
    conversations.find((c) => c.id === activeConvId) ?? null;

  if (isLoadingList) {
    return (
      <div className="rounded-2xl border border-[#DFD8CC] bg-white p-10 text-center">
        <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#F28C28]" />
        <p className="mt-2.5 text-sm font-semibold text-[#24272B]">
          {locale === "es-AR"
            ? "Cargando conversaciones privadas..."
            : "Carregando conversas privadas..."}
        </p>
      </div>
    );
  }

  if (listError) {
    return (
      <div className="rounded-2xl border border-[#E5A49B] bg-[#FDF2F0] p-8 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-[#B93829]" />
        <p className="mt-2 text-sm font-bold text-[#24272B]">{listError}</p>
        <div className="mt-4">
          <Button
            variant="graphite"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => {
              setIsLoadingList(true);
              void loadConversations();
            }}
          >
            {locale === "es-AR" ? "Reintentar" : "Tentar novamente"}
          </Button>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="rounded-2xl border border-[#DFD8CC] bg-white p-10 text-center">
        <MessageSquare className="mx-auto h-9 w-9 text-[#F28C28]" />
        <h3 className="mt-3 text-base font-bold text-[#24272B]">
          {locale === "es-AR"
            ? "Todavía no tenés conversaciones iniciadas"
            : "Você ainda não possui conversas iniciadas"}
        </h3>
        <p className="mx-auto mt-1 max-w-md text-xs text-[#525860]">
          {locale === "es-AR"
            ? "Visitá el perfil de un profesional en el directorio y pulsá 'Enviar mensaje directo' o 'Solicitar presupuesto' para abrir una conversación privada."
            : "Visite o perfil de um profissional no diretório e clique em 'Enviar mensagem direta' ou 'Solicitar orçamento' para abrir uma conversa privada."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-[#DFD8CC] bg-white shadow-2xs lg:grid-cols-12">
      {/* COLUMNA IZQUIERDA: LISTA DE CONVERSACIONES (4 cols) */}
      <div className="border-b border-[#ECE6DC] bg-[#F7F4EE]/50 lg:col-span-4 lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between border-b border-[#ECE6DC] px-4 py-3.5">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#24272B]">
            {locale === "es-AR" ? "Conversaciones" : "Conversas"} (
            {conversations.length})
          </h3>
          <button
            type="button"
            onClick={() => void loadConversations()}
            title={locale === "es-AR" ? "Actualizar lista" : "Atualizar lista"}
            className="cursor-pointer rounded-lg p-1.5 text-[#525860] hover:bg-[#EFEAE1]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="max-h-[520px] divide-y divide-[#ECE6DC] overflow-y-auto">
          {conversations.map((conv) => {
            const isSelected = conv.id === activeConvId;
            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => setActiveConvId(conv.id)}
                className={`flex w-full cursor-pointer flex-col gap-1.5 p-4 text-left transition-colors ${
                  isSelected
                    ? "bg-[#24272B] text-[#F7F4EE]"
                    : "hover:bg-[#EFEAE1]/70 text-[#24272B]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold">
                    {conv.peer.fullName}
                  </span>
                  {conv.unreadCount > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F28C28] px-1.5 font-mono text-[11px] font-bold text-[#1B1E22]">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`truncate text-xs font-medium ${
                      isSelected ? "text-[#F28C28]" : "text-[#C86D14]"
                    }`}
                  >
                    {conv.subject}
                  </span>
                  <span
                    className={`shrink-0 text-[10px] ${
                      isSelected ? "text-[#CFCAC0]" : "text-[#666C75]"
                    }`}
                  >
                    {getQuoteStatusLabel(conv.quoteStatus, locale)}
                  </span>
                </div>

                {conv.lastMessageBody && (
                  <p
                    className={`line-clamp-1 text-xs ${
                      isSelected ? "text-[#D4CFC6]" : "text-[#525860]"
                    }`}
                  >
                    {conv.lastMessageBody}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* COLUMNA DERECHA: HILO DE MENSAJES Y ADJUNTOS (8 cols) */}
      <div className="flex flex-col justify-between lg:col-span-8">
        {activeConversation ? (
          <>
            {/* Cabecera de la conversación activa */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ECE6DC] bg-white px-5 py-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-extrabold text-[#24272B]">
                    {activeConversation.peer.fullName}
                  </h4>
                  <Badge variant="cream">
                    {activeConversation.peer.city ||
                      activeConversation.peer.country}
                  </Badge>
                </div>
                <p className="text-xs text-[#525860]">
                  {activeConversation.subject}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    realtimeConnected
                      ? "bg-[#EAF5F0] text-[#176041]"
                      : "bg-[#FFF8EB] text-[#8F530B]"
                  }`}
                >
                  {realtimeConnected ? (
                    <>
                      <Wifi className="h-3 w-3" />
                      <span>Realtime</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3" />
                      <span>Sincronizando</span>
                    </>
                  )}
                </span>

                <select
                  aria-label={
                    locale === "es-AR"
                      ? "Estado de la solicitud"
                      : "Status da solicitação"
                  }
                  value={activeConversation.quoteStatus}
                  onChange={(e) =>
                    void handleQuoteStatusChange(
                      e.target.value as QuoteStatusType
                    )
                  }
                  className="rounded-lg border border-[#D4CCC0] bg-[#F7F4EE] px-2.5 py-1 text-xs font-semibold text-[#24272B]"
                >
                  <option value="direct_chat">
                    {getQuoteStatusLabel("direct_chat", locale)}
                  </option>
                  <option value="quote_requested">
                    {getQuoteStatusLabel("quote_requested", locale)}
                  </option>
                  <option value="quote_sent">
                    {getQuoteStatusLabel("quote_sent", locale)}
                  </option>
                  <option value="accepted">
                    {getQuoteStatusLabel("accepted", locale)}
                  </option>
                  <option value="closed">
                    {getQuoteStatusLabel("closed", locale)}
                  </option>
                </select>
              </div>
            </div>

            {/* Historial paginado de mensajes */}
            <div className="max-h-[420px] min-h-[300px] flex-1 space-y-3 overflow-y-auto bg-[#F7F4EE]/40 p-5">
              {hasMoreOlder && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    isLoading={isLoadingOlder}
                    leftIcon={<History className="h-3.5 w-3.5" />}
                    onClick={() => void handleLoadOlderMessages()}
                  >
                    {locale === "es-AR"
                      ? "Cargar mensajes anteriores"
                      : "Carregar mensagens anteriores"}
                  </Button>
                </div>
              )}

              {isLoadingMessages ? (
                <div className="py-12 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#F28C28]" />
                </div>
              ) : messagesError ? (
                <div className="rounded-xl border border-[#E5A49B] bg-[#FDF2F0] p-4 text-center text-xs text-[#B93829]">
                  <p className="font-bold">{messagesError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      void loadActiveConversationMessages(activeConversation.id)
                    }
                  >
                    {locale === "es-AR" ? "Reintentar" : "Tentar novamente"}
                  </Button>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#666C75]">
                  {locale === "es-AR"
                    ? "Conversación abierta. Escribí el primer mensaje o adjuntá una foto del trabajo."
                    : "Conversa aberta. Escreva a primeira mensagem ou anexe uma foto do serviço."}
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isMine ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-2xs ${
                          isMine
                            ? "bg-[#24272B] text-[#F7F4EE]"
                            : "border border-[#DFD8CC] bg-white text-[#24272B]"
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-3 text-[11px] opacity-80">
                          <span className="font-bold">
                            {isMine
                              ? locale === "es-AR"
                                ? "Vos"
                                : "Você"
                              : msg.senderName}
                          </span>
                          <span>{formatShortTime(msg.createdAt, locale)}</span>
                        </div>

                        <p className="whitespace-pre-wrap leading-relaxed">
                          {msg.body}
                        </p>

                        {msg.attachmentSignedUrl && (
                          <div className="mt-2.5 overflow-hidden rounded-xl border border-white/15">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={msg.attachmentSignedUrl}
                              alt="Adjunto privado de la conversación"
                              className="max-h-56 w-auto object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}

                        {isMine && (
                          <div className="mt-1.5 flex items-center justify-end gap-1 text-[10px] text-[#CFCAC0]">
                            {msg.readAt ? (
                              <>
                                <CheckCheck className="h-3.5 w-3.5 text-[#F28C28]" />
                                <span>
                                  {locale === "es-AR" ? "Leído" : "Lido"}
                                </span>
                              </>
                            ) : (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                <span>
                                  {locale === "es-AR" ? "Enviado" : "Enviado"}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Avisos de subida / error */}
            {sendFeedback && (
              <div
                role={sendFeedback.type === "error" ? "alert" : "status"}
                className={`mx-5 mt-2 rounded-xl border px-3.5 py-2 text-xs font-semibold ${
                  sendFeedback.type === "error"
                    ? "border-[#E5A49B] bg-[#FDF2F0] text-[#B93829]"
                    : "border-[#A7D7C2] bg-[#EAF5F0] text-[#176041]"
                }`}
              >
                {sendFeedback.message}
              </div>
            )}

            {/* Previsualización del archivo seleccionado antes de enviar */}
            {selectedFile && (
              <div className="mx-5 mt-2 flex items-center justify-between rounded-xl border border-[#D4CCC0] bg-[#F7F4EE] px-3.5 py-2 text-xs">
                <span className="truncate font-semibold text-[#24272B]">
                  📎 {selectedFile.name} (
                  {(selectedFile.size / 1024).toFixed(0)} KB)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="ml-2 cursor-pointer text-[#B93829]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Formulario de envío de mensaje + adjunto privado */}
            <form
              onSubmit={handleSendMessage}
              className="border-t border-[#ECE6DC] bg-white p-4"
            >
              <div className="flex items-center gap-2.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="chat-attachment-input"
                />
                <label
                  htmlFor="chat-attachment-input"
                  title={
                    locale === "es-AR"
                      ? "Adjuntar imagen privada (JPG, PNG, WebP máx. 5MB)"
                      : "Anexar imagem privada (JPG, PNG, WebP máx. 5MB)"
                  }
                  className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#D4CCC0] bg-[#F7F4EE] text-[#24272B] hover:border-[#F28C28]"
                >
                  <ImagePlus className="h-4 w-4 text-[#F28C28]" />
                </label>

                <input
                  type="text"
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  placeholder={
                    locale === "es-AR"
                      ? "Escribí tu mensaje o consulta..."
                      : "Digite sua mensagem ou dúvida..."
                  }
                  className="h-10 flex-1 rounded-xl border border-[#D4CCC0] bg-[#F7F4EE]/50 px-3.5 text-sm text-[#24272B] focus:border-[#F28C28] focus:bg-white focus:outline-none"
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="h-10 px-4"
                  isLoading={
                    uploadStatus === "uploading" || uploadStatus === "sending"
                  }
                  leftIcon={<Send className="h-4 w-4" />}
                >
                  {uploadStatus === "uploading"
                    ? locale === "es-AR"
                      ? "Subiendo foto..."
                      : "Enviando foto..."
                    : locale === "es-AR"
                      ? "Enviar"
                      : "Enviar"}
                </Button>
              </div>
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-[#666C75]">
                <Clock className="h-3 w-3" />
                <span>
                  {locale === "es-AR"
                    ? "Las imágenes se almacenan en un bucket privado de Supabase Storage accesible únicamente por los participantes."
                    : "As imagens são salvas em um bucket privado do Supabase Storage acessível apenas pelos participantes."}
                </span>
              </p>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
}
