import { createSupabaseBrowserClient } from "./client";

export type QuoteStatusType =
  | "direct_chat"
  | "quote_requested"
  | "quote_sent"
  | "accepted"
  | "closed";

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MESSAGES_PAGE_SIZE = 20;

export interface ConversationPeerSummary {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  city: string;
  country: "AR" | "BR";
  role: "client" | "professional" | "admin";
}

export interface ConversationListItem {
  id: string;
  subject: string;
  quoteStatus: QuoteStatusType;
  updatedAt: string;
  peer: ConversationPeerSummary;
  lastMessageBody: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface ChatMessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  body: string;
  attachmentStoragePath: string | null;
  attachmentSignedUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface PaginatedMessagesResult {
  messages: ChatMessageItem[];
  totalCount: number;
  hasMoreOlder: boolean;
  page: number;
}

export interface InternalNotificationItem {
  id: string;
  userId: string;
  actorId: string | null;
  conversationId: string | null;
  type: "new_message" | "quote_update";
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

/**
 * Contrato preparado para futuros adaptadores de Push (Expo Push / Web Push)
 * sin requerir servicios pagos de SMS o email en esta fase.
 */
export interface NotificationPushAdapterContract {
  readonly channelName: "in_app_realtime" | "expo_push_future" | "web_push_future";
  isSupported(): boolean;
}

export function validateChatAttachmentFile(
  file: File,
  locale: "es-AR" | "pt-BR" = "es-AR"
): { valid: true } | { valid: false; error: string } {
  if (
    !ALLOWED_ATTACHMENT_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number]
    )
  ) {
    return {
      valid: false,
      error:
        locale === "es-AR"
          ? "Formato no permitido. Solo se aceptan imágenes JPG, PNG o WebP."
          : "Formato não permitido. Apenas imagens JPG, PNG ou WebP são aceitas.",
    };
  }

  if (file.size <= 0 || file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      valid: false,
      error:
        locale === "es-AR"
          ? "La imagen supera el tamaño máximo permitido de 5 MB."
          : "A imagem excede o tamanho máximo permitido de 5 MB.",
    };
  }

  return { valid: true };
}

/**
 * Crea o reutiliza una conversación entre el usuario autenticado y otro usuario (`targetUserId`)
 * mediante la función RPC atómica `public.start_or_get_conversation`.
 */
export async function startOrGetConversation(params: {
  targetUserId: string;
  subject: string;
  quoteStatus: QuoteStatusType;
  initialMessage?: string;
}): Promise<string> {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase.rpc("start_or_get_conversation", {
    target_user_id: params.targetUserId,
    initial_subject: params.subject.trim() || "Consulta de servicio",
    initial_quote_status: params.quoteStatus,
    initial_message: params.initialMessage?.trim() || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("No se pudo obtener el identificador de la conversación.");
  }

  return String(data);
}

/**
 * Obtiene la lista de conversaciones del usuario autenticado con interlocutor,
 * último mensaje y cantidad de mensajes no leídos.
 */
export async function fetchUserConversations(): Promise<{
  currentUserId: string;
  conversations: ConversationListItem[];
}> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Debés iniciar sesión para consultar tus conversaciones.");
  }

  const { data: convRows, error: convErr } = await supabase
    .from("conversations")
    .select("id, subject, quote_status, updated_at")
    .order("updated_at", { ascending: false });

  if (convErr) {
    throw new Error(convErr.message);
  }

  if (!convRows || convRows.length === 0) {
    return { currentUserId: user.id, conversations: [] };
  }

  const convIds = convRows.map((c) => String(c.id));

  const [participantsRes, messagesRes] = await Promise.all([
    supabase
      .from("conversation_participants")
      .select(
        "conversation_id, user_id, profiles:profiles!conversation_participants_user_id_fkey(id, full_name, avatar_url, city, country, role)"
      )
      .in("conversation_id", convIds),
    supabase
      .from("messages")
      .select("id, conversation_id, sender_id, body, read_at, created_at")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false }),
  ]);

  if (participantsRes.error) {
    throw new Error(participantsRes.error.message);
  }
  if (messagesRes.error) {
    throw new Error(messagesRes.error.message);
  }

  const peerByConvId = new Map<string, ConversationPeerSummary>();
  for (const row of participantsRes.data ?? []) {
    const cid = String(row.conversation_id);
    const uid = String(row.user_id);
    if (uid === user.id) continue;

    const rawProfile = Array.isArray(row.profiles)
      ? row.profiles[0]
      : row.profiles;

    peerByConvId.set(cid, {
      id: uid,
      fullName: String(rawProfile?.full_name ?? "Usuario"),
      avatarUrl: rawProfile?.avatar_url ? String(rawProfile.avatar_url) : null,
      city: String(rawProfile?.city ?? ""),
      country: rawProfile?.country === "BR" ? "BR" : "AR",
      role:
        rawProfile?.role === "professional"
          ? "professional"
          : rawProfile?.role === "admin"
            ? "admin"
            : "client",
    });
  }

  const lastMsgByConv = new Map<
    string,
    { body: string; createdAt: string }
  >();
  const unreadCountByConv = new Map<string, number>();

  for (const msg of messagesRes.data ?? []) {
    const cid = String(msg.conversation_id);
    if (!lastMsgByConv.has(cid)) {
      lastMsgByConv.set(cid, {
        body: String(msg.body ?? ""),
        createdAt: String(msg.created_at),
      });
    }
    if (String(msg.sender_id) !== user.id && !msg.read_at) {
      unreadCountByConv.set(cid, (unreadCountByConv.get(cid) ?? 0) + 1);
    }
  }

  const items: ConversationListItem[] = convRows.map((c) => {
    const cid = String(c.id);
    const lastMsg = lastMsgByConv.get(cid);
    const fallbackPeer: ConversationPeerSummary = {
      id: user.id,
      fullName: "Participante",
      avatarUrl: null,
      city: "",
      country: "AR",
      role: "client",
    };

    return {
      id: cid,
      subject: String(c.subject ?? "Consulta"),
      quoteStatus: (c.quote_status as QuoteStatusType) || "direct_chat",
      updatedAt: String(c.updated_at),
      peer: peerByConvId.get(cid) ?? fallbackPeer,
      lastMessageBody: lastMsg?.body ?? null,
      lastMessageAt: lastMsg?.createdAt ?? null,
      unreadCount: unreadCountByConv.get(cid) ?? 0,
    };
  });

  return { currentUserId: user.id, conversations: items };
}

/**
 * Genera una URL firmada temporal (60 min) para un adjunto privado en `chat-attachments`.
 * Nunca expone URLs públicas permanentes.
 */
export async function resolvePrivateAttachmentSignedUrl(
  storagePath: string | null
): Promise<string | null> {
  if (!storagePath || !storagePath.trim()) return null;
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase.storage
    .from("chat-attachments")
    .createSignedUrl(storagePath, 3600);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

/**
 * Carga una página del historial de mensajes de una conversación (con paginación y URLs firmadas para adjuntos).
 */
export async function fetchConversationMessagesPage(
  conversationId: string,
  page: number = 1,
  pageSize: number = MESSAGES_PAGE_SIZE
): Promise<PaginatedMessagesResult> {
  const supabase = createSupabaseBrowserClient();
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("messages")
    .select(
      "id, conversation_id, sender_id, body, attachment_url, read_at, created_at, profiles:profiles!messages_sender_id_fkey(full_name)",
      { count: "exact" }
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const rows = [...(data ?? [])].reverse();

  const messages: ChatMessageItem[] = await Promise.all(
    rows.map(async (row) => {
      const senderProfile = Array.isArray(row.profiles)
        ? row.profiles[0]
        : row.profiles;
      const storagePath = row.attachment_url
        ? String(row.attachment_url)
        : null;
      const signedUrl = await resolvePrivateAttachmentSignedUrl(storagePath);

      return {
        id: String(row.id),
        conversationId: String(row.conversation_id),
        senderId: String(row.sender_id),
        senderName: String(senderProfile?.full_name ?? "Usuario"),
        body: String(row.body ?? ""),
        attachmentStoragePath: storagePath,
        attachmentSignedUrl: signedUrl,
        readAt: row.read_at ? String(row.read_at) : null,
        createdAt: String(row.created_at),
      };
    })
  );

  const totalCount = count ?? messages.length;
  const hasMoreOlder = totalCount > safePage * pageSize;

  return {
    messages,
    totalCount,
    hasMoreOlder,
    page: safePage,
  };
}

/**
 * Sube un archivo de imagen validado al bucket privado `chat-attachments`
 * bajo la ruta `<conversationId>/<senderId>/<timestamp>-<filename>`.
 */
export async function uploadPrivateChatAttachment(
  conversationId: string,
  file: File,
  locale: "es-AR" | "pt-BR" = "es-AR"
): Promise<string> {
  const validation = validateChatAttachmentFile(file, locale);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Debés iniciar sesión para adjuntar archivos.");
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeBaseName = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .slice(0, 40);

  const objectPath = `${conversationId}/${user.id}/${Date.now()}-${safeBaseName}.${ext}`;

  const { data, error } = await supabase.storage
    .from("chat-attachments")
    .upload(objectPath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error || !data?.path) {
    throw new Error(
      error?.message ?? "No se pudo subir la imagen al almacenamiento seguro."
    );
  }

  return data.path;
}

/**
 * Envía un mensaje persistente a `public.messages` verificando la sesión del remitente.
 */
export async function sendChatMessage(params: {
  conversationId: string;
  body: string;
  attachmentStoragePath?: string | null;
}): Promise<ChatMessageItem> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Debés iniciar sesión para enviar un mensaje.");
  }

  const trimmedBody = params.body.trim();
  const effectiveBody =
    trimmedBody.length > 0
      ? trimmedBody
      : params.attachmentStoragePath
        ? "📷 Imagen adjunta"
        : "";

  if (!effectiveBody) {
    throw new Error("Escribí un mensaje o seleccioná una imagen para enviar.");
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: params.conversationId,
      sender_id: user.id,
      body: effectiveBody,
      attachment_url: params.attachmentStoragePath ?? null,
    })
    .select(
      "id, conversation_id, sender_id, body, attachment_url, read_at, created_at, profiles:profiles!messages_sender_id_fkey(full_name)"
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "No se pudo enviar el mensaje.");
  }

  const senderProfile = Array.isArray(data.profiles)
    ? data.profiles[0]
    : data.profiles;
  const storagePath = data.attachment_url
    ? String(data.attachment_url)
    : null;
  const signedUrl = await resolvePrivateAttachmentSignedUrl(storagePath);

  return {
    id: String(data.id),
    conversationId: String(data.conversation_id),
    senderId: String(data.sender_id),
    senderName: String(senderProfile?.full_name ?? "Usuario"),
    body: String(data.body),
    attachmentStoragePath: storagePath,
    attachmentSignedUrl: signedUrl,
    readAt: data.read_at ? String(data.read_at) : null,
    createdAt: String(data.created_at),
  };
}

/**
 * Marca los mensajes recibidos de una conversación como leídos (`read_at`).
 */
export async function markConversationMessagesRead(
  conversationId: string
): Promise<number> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc(
    "mark_conversation_messages_read",
    {
      conv_id: conversationId,
    }
  );
  if (error) {
    return 0;
  }
  return Number(data ?? 0);
}

/**
 * Actualiza el estado de presupuesto de una conversación (`quote_status`).
 */
export async function updateConversationQuoteStatus(
  conversationId: string,
  nextStatus: QuoteStatusType
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("conversations")
    .update({ quote_status: nextStatus })
    .eq("id", conversationId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Consulta las notificaciones internas del usuario autenticado (`public.notifications`).
 */
export async function fetchUserNotifications(
  limit: number = 25
): Promise<InternalNotificationItem[]> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, user_id, actor_id, conversation_id, type, title, body, read_at, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((n) => ({
    id: String(n.id),
    userId: String(n.user_id),
    actorId: n.actor_id ? String(n.actor_id) : null,
    conversationId: n.conversation_id ? String(n.conversation_id) : null,
    type: n.type === "quote_update" ? "quote_update" : "new_message",
    title: String(n.title),
    body: String(n.body ?? ""),
    readAt: n.read_at ? String(n.read_at) : null,
    createdAt: String(n.created_at),
  }));
}

export async function markNotificationRead(
  notificationId: string
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    throw new Error(error.message);
  }
}
