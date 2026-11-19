import { createSupabaseBrowserClient, isSupabaseConfigured } from "./client";
import type {
  CategorySlug,
  CountryCode,
  CurrencyCode,
  ServiceCategory,
} from "@/types/domain";

// Contas fictícias criadas pela migração 004 antiga. Mantidas no banco para
// preservar dados; excluídas das consultas públicas até uma revisão aprovada.
const RETIRED_SAMPLE_USER_IDS = [
  "a1111111-1111-1111-1111-111111111111",
  "a2222222-2222-2222-2222-222222222222",
  "a3333333-3333-3333-3333-333333333333",
  "a4444444-4444-4444-4444-444444444444",
  "a5555555-5555-5555-5555-555555555555",
  "a6666666-6666-6666-6666-666666666666",
  "a7777777-7777-7777-7777-777777777777",
].join(",");

export interface RealReviewSummary {
  id: string;
  rating: number;
  serviceProvided: string;
  comment: string;
  createdAt: string;
}

export interface RealServiceItem {
  id: string;
  professionalId: string;
  title: string;
  description: string;
  referencePriceAmount: number | null;
  currency: CurrencyCode;
  priceUnitLabel: string;
}

export interface RealPortfolioPhoto {
  id: string;
  professionalId: string;
  publicUrl: string;
  caption: string;
  zoneLabel: string;
  workYear: number;
}

export interface RealProfessionalListItem {
  userId: string;
  slug: string;
  fullName: string;
  avatarUrl: string | null;
  country: CountryCode;
  city: string;
  neighborhood: string;
  categorySlug: CategorySlug;
  primarySpecialtyEsAr: string;
  primarySpecialtyPtBr: string;
  secondarySpecialties: string[];
  bio: string;
  yearsOfExperience: number;
  coverageZones: string[];
  languages: string[];
  scheduleSummary: string;
  acceptsDirectContact: boolean;
  acceptsQuoteRequests: boolean;
  referenceStartingPrice: number | null;
  currency: CurrencyCode;
  status: "draft" | "published" | "suspended";
  realReviewCount: number;
  realAverageRating: number | null;
  matchedServiceTitles: string[];
}

export interface RealProfessionalDetail extends RealProfessionalListItem {
  services: RealServiceItem[];
  portfolio: RealPortfolioPhoto[];
  reviews: RealReviewSummary[];
}

export interface DirectoryQueryFilters {
  query?: string;
  categorySlug?: CategorySlug | "all";
  country?: CountryCode | "ALL";
  city?: string;
  sortBy?: "recent" | "experience" | "rating";
  page?: number;
  pageSize?: number;
}

export interface PaginatedProfessionalsResult {
  items: RealProfessionalListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasAnyReviewsInResult: boolean;
}

interface RawCategoryRow {
  id: string;
  slug: string;
  icon_name: string;
  name_es_ar: string;
  name_pt_br: string;
  description_es_ar: string;
  description_pt_br: string;
  examples_es_ar: string[] | null;
  examples_pt_br: string[] | null;
  display_order: number;
  is_active: boolean;
}

interface RawPublicProfileJoin {
  id: string;
  full_name: string;
  country: CountryCode;
  city: string;
  avatar_url: string | null;
  is_suspended: boolean;
}

interface RawServiceJoin {
  id: string;
  professional_id: string;
  title: string;
  description: string;
  reference_price_amount: number | string | null;
  currency: CurrencyCode;
  price_unit_label: string;
}

interface RawReviewJoin {
  id: string;
  rating: number;
  service_provided: string;
  comment: string;
  created_at: string;
}

interface RawPhotoJoin {
  id: string;
  professional_id: string;
  public_url: string;
  caption: string;
  zone_label: string;
  work_year: number;
}

interface RawProfessionalRow {
  user_id: string;
  slug: string;
  category_slug: CategorySlug;
  primary_specialty_es_ar: string;
  primary_specialty_pt_br: string;
  secondary_specialties: string[] | null;
  bio: string;
  years_of_experience: number;
  neighborhood: string;
  coverage_zones: string[] | null;
  languages: string[] | null;
  schedule_summary: string;
  accepts_direct_contact: boolean;
  accepts_quote_requests: boolean;
  reference_starting_price: number | string | null;
  currency: CurrencyCode;
  status: "draft" | "published" | "suspended";
  created_at: string;
  profiles: RawPublicProfileJoin | RawPublicProfileJoin[];
  services?: RawServiceJoin[];
  reviews?: RawReviewJoin[];
  professional_photos?: RawPhotoJoin[];
}

function normalizeIconName(
  icon: string
): ServiceCategory["iconName"] {
  const validIcons: ServiceCategory["iconName"][] = [
    "Hammer",
    "Wrench",
    "Zap",
    "Sparkles",
    "Trees",
    "Truck",
    "HeartPulse",
    "Layers",
  ];
  return validIcons.includes(icon as ServiceCategory["iconName"])
    ? (icon as ServiceCategory["iconName"])
    : "Wrench";
}

/**
 * Consulta las categorías reales activas en `public.categories`
 */
export async function fetchRealCategories(): Promise<ServiceCategory[]> {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("categories")
    .select(
      "id, slug, icon_name, name_es_ar, name_pt_br, description_es_ar, description_pt_br, examples_es_ar, examples_pt_br, display_order, is_active"
    )
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as RawCategoryRow[];

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug as CategorySlug,
    iconName: normalizeIconName(row.icon_name),
    name: {
      "es-AR": row.name_es_ar,
      "pt-BR": row.name_pt_br,
    },
    shortDescription: {
      "es-AR": row.description_es_ar,
      "pt-BR": row.description_pt_br,
    },
    examples: {
      "es-AR": row.examples_es_ar ?? [],
      "pt-BR": row.examples_pt_br ?? [],
    },
    subcategories: [],
  }));
}

export async function fetchRealCategoryBySlug(
  slug: string
): Promise<ServiceCategory | null> {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("categories")
    .select(
      "id, slug, icon_name, name_es_ar, name_pt_br, description_es_ar, description_pt_br, examples_es_ar, examples_pt_br, display_order, is_active"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;
  const row = data as RawCategoryRow;

  return {
    id: row.id,
    slug: row.slug as CategorySlug,
    iconName: normalizeIconName(row.icon_name),
    name: {
      "es-AR": row.name_es_ar,
      "pt-BR": row.name_pt_br,
    },
    shortDescription: {
      "es-AR": row.description_es_ar,
      "pt-BR": row.description_pt_br,
    },
    examples: {
      "es-AR": row.examples_es_ar ?? [],
      "pt-BR": row.examples_pt_br ?? [],
    },
    subcategories: [],
  };
}

function mapRawRowToListItem(row: RawProfessionalRow): RealProfessionalListItem {
  const profileObj = Array.isArray(row.profiles)
    ? row.profiles[0]
    : row.profiles;

  const reviewsList = row.reviews ?? [];
  const realReviewCount = reviewsList.length;
  const realAverageRating =
    realReviewCount > 0
      ? reviewsList.reduce((acc, r) => acc + Number(r.rating), 0) /
        realReviewCount
      : null;

  const parsedPrice =
    row.reference_starting_price !== null &&
    row.reference_starting_price !== undefined &&
    Number(row.reference_starting_price) > 0
      ? Number(row.reference_starting_price)
      : null;

  return {
    userId: row.user_id,
    slug: row.slug,
    fullName: profileObj?.full_name ?? "Profesional",
    avatarUrl: profileObj?.avatar_url ?? null,
    country: profileObj?.country ?? (row.currency === "BRL" ? "BR" : "AR"),
    city: profileObj?.city ?? "",
    neighborhood: row.neighborhood ?? "",
    categorySlug: row.category_slug,
    primarySpecialtyEsAr: row.primary_specialty_es_ar,
    primarySpecialtyPtBr: row.primary_specialty_pt_br,
    secondarySpecialties: row.secondary_specialties ?? [],
    bio: row.bio ?? "",
    yearsOfExperience: Number(row.years_of_experience ?? 0),
    coverageZones: row.coverage_zones ?? [],
    languages: row.languages ?? [],
    scheduleSummary: row.schedule_summary ?? "",
    acceptsDirectContact: Boolean(row.accepts_direct_contact),
    acceptsQuoteRequests: Boolean(row.accepts_quote_requests),
    referenceStartingPrice: parsedPrice,
    currency: row.currency,
    status: row.status,
    realReviewCount,
    realAverageRating,
    matchedServiceTitles: (row.services ?? []).map((s) => s.title),
  };
}

/**
 * Busca y filtra perfiles profesionales públicos directamente en Supabase con paginación.
 * Seguridad y Privacidad:
 * - Solo retorna perfiles con `status = 'published'` y `profiles.is_suspended = false`.
 * - Jamás selecciona `phone` ni correos electrónicos.
 */
export async function searchRealProfessionals(
  filters: DirectoryQueryFilters
): Promise<PaginatedProfessionalsResult> {
  const supabase = createSupabaseBrowserClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, Math.min(24, filters.pageSize ?? 6));
  const searchTerm = (filters.query ?? "").trim();

  // Si hay término de búsqueda libre, consultamos en paralelo coincidencias en:
  // 1) `profiles.full_name`
  // 2) `services.title` o `services.description`
  // para combinarlas con los campos de `professional_profiles` en el filtro de servidor.
  let matchedUserIdsFromNameOrService: string[] = [];

  if (searchTerm.length > 0) {
    const safePattern = `%${searchTerm.replace(/[%_]/g, "")}%`;
    const [nameMatchesRes, serviceMatchesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id")
        .eq("is_suspended", false)
        .ilike("full_name", safePattern)
        .limit(50),
      supabase
        .from("services")
        .select("professional_id")
        .or(`title.ilike.${safePattern},description.ilike.${safePattern}`)
        .limit(50),
    ]);

    const ids = new Set<string>();
    for (const row of nameMatchesRes.data ?? []) {
      if (row.id) ids.add(String(row.id));
    }
    for (const row of serviceMatchesRes.data ?? []) {
      if (row.professional_id) ids.add(String(row.professional_id));
    }
    matchedUserIdsFromNameOrService = Array.from(ids);
  }

  let queryBuilder = supabase
    .from("professional_profiles")
    .select(
      `
      user_id,
      slug,
      category_slug,
      primary_specialty_es_ar,
      primary_specialty_pt_br,
      secondary_specialties,
      bio,
      years_of_experience,
      neighborhood,
      coverage_zones,
      languages,
      schedule_summary,
      accepts_direct_contact,
      accepts_quote_requests,
      reference_starting_price,
      currency,
      status,
      created_at,
      profiles:profiles!professional_profiles_user_id_fkey!inner(id, full_name, country, city, avatar_url, is_suspended),
      services(id, professional_id, title, description, reference_price_amount, currency, price_unit_label),
      reviews(id, rating)
    `,
      { count: "exact" }
    )
    .eq("status", "published")
    .eq("verification_status", "verified")
    .eq("profiles.is_suspended", false)
    .not("user_id", "in", `(${RETIRED_SAMPLE_USER_IDS})`);

  if (filters.categorySlug && filters.categorySlug !== "all") {
    queryBuilder = queryBuilder.eq("category_slug", filters.categorySlug);
  }

  if (filters.country && filters.country !== "ALL") {
    queryBuilder = queryBuilder.eq("profiles.country", filters.country);
  }

  if (filters.city && filters.city !== "all") {
    const cleanCity = filters.city.replace(/[%_]/g, "").trim();
    if (cleanCity.length > 0) {
      queryBuilder = queryBuilder.ilike("profiles.city", `%${cleanCity}%`);
    }
  }

  if (searchTerm.length > 0) {
    const cleanTerm = searchTerm.replace(/[,()%_]/g, " ").trim();
    const orClauses = [
      `primary_specialty_es_ar.ilike.%${cleanTerm}%`,
      `primary_specialty_pt_br.ilike.%${cleanTerm}%`,
      `bio.ilike.%${cleanTerm}%`,
      `neighborhood.ilike.%${cleanTerm}%`,
    ];

    if (matchedUserIdsFromNameOrService.length > 0) {
      orClauses.push(
        `user_id.in.(${matchedUserIdsFromNameOrService.join(",")})`
      );
    }

    queryBuilder = queryBuilder.or(orClauses.join(","));
  }

  if (filters.sortBy === "experience") {
    queryBuilder = queryBuilder.order("years_of_experience", {
      ascending: false,
    });
  } else {
    queryBuilder = queryBuilder.order("created_at", { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  queryBuilder = queryBuilder.range(from, to);

  const { data, error, count } = await queryBuilder;

  if (error) {
    throw new Error(error.message);
  }

  const rawRows = (data ?? []) as unknown as RawProfessionalRow[];
  let items = rawRows.map(mapRawRowToListItem);

  const hasAnyReviewsInResult = items.some((i) => i.realReviewCount > 0);

  if (filters.sortBy === "rating" && hasAnyReviewsInResult) {
    items = [...items].sort(
      (a, b) => (b.realAverageRating ?? 0) - (a.realAverageRating ?? 0)
    );
  }

  const totalCount = count ?? items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages,
    hasAnyReviewsInResult,
  };
}

/**
 * Obtiene el perfil público completo por `slug` desde Supabase.
 * No expone correo electrónico ni teléfono privado.
 */
export async function fetchRealProfessionalBySlug(
  slug: string
): Promise<RealProfessionalDetail | null> {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("professional_profiles")
    .select(
      `
      user_id,
      slug,
      category_slug,
      primary_specialty_es_ar,
      primary_specialty_pt_br,
      secondary_specialties,
      bio,
      years_of_experience,
      neighborhood,
      coverage_zones,
      languages,
      schedule_summary,
      accepts_direct_contact,
      accepts_quote_requests,
      reference_starting_price,
      currency,
      status,
      created_at,
      profiles:profiles!professional_profiles_user_id_fkey!inner(id, full_name, country, city, avatar_url, is_suspended),
      services(id, professional_id, title, description, reference_price_amount, currency, price_unit_label),
      professional_photos(id, professional_id, public_url, caption, zone_label, work_year),
      reviews(id, rating, service_provided, comment, created_at)
    `
    )
    .eq("slug", slug)
    .eq("status", "published")
    .eq("verification_status", "verified")
    .eq("profiles.is_suspended", false)
    .not("user_id", "in", `(${RETIRED_SAMPLE_USER_IDS})`)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  const row = data as unknown as RawProfessionalRow;
  const base = mapRawRowToListItem(row);

  const services: RealServiceItem[] = (row.services ?? []).map((s) => ({
    id: s.id,
    professionalId: s.professional_id,
    title: s.title,
    description: s.description,
    referencePriceAmount:
      s.reference_price_amount !== null &&
      s.reference_price_amount !== undefined &&
      Number(s.reference_price_amount) > 0
        ? Number(s.reference_price_amount)
        : null,
    currency: s.currency,
    priceUnitLabel: s.price_unit_label,
  }));

  const portfolio: RealPortfolioPhoto[] = (row.professional_photos ?? []).map(
    (p) => ({
      id: p.id,
      professionalId: p.professional_id,
      publicUrl: p.public_url,
      caption: p.caption,
      zoneLabel: p.zone_label,
      workYear: Number(p.work_year),
    })
  );

  const reviews: RealReviewSummary[] = (row.reviews ?? []).map((r) => ({
    id: r.id,
    rating: Number(r.rating),
    serviceProvided: r.service_provided,
    comment: r.comment,
    createdAt: r.created_at,
  }));

  return {
    ...base,
    services,
    portfolio,
    reviews,
  };
}

export type UiLocale = "es-AR" | "pt-BR";

/**
 * Traduz erros vindos das RPCs do Supabase para mensagens amigáveis ao usuário,
 * sem expor códigos internos do PostgreSQL, nomes de tabelas ou funções.
 */
export function mapProfessionalRpcError(
  rawMessage: string | undefined,
  locale: UiLocale = "pt-BR"
): string {
  const msg = (rawMessage ?? "").toLowerCase();
  const isEs = locale === "es-AR";

  if (msg.includes("sign in")) {
    return isEs
      ? "Tu sesión expiró. Iniciá sesión nuevamente para continuar."
      : "Sua sessão expirou. Entre novamente para continuar.";
  }
  if (
    msg.includes("suspended") ||
    msg.includes("cannot create or edit") ||
    msg.includes("reactivate")
  ) {
    return isEs
      ? "Tu cuenta o perfil se encuentra suspendido y no puede modificarse en este momento."
      : "Sua conta ou perfil está suspenso e não pode ser alterado no momento.";
  }
  if (msg.includes("complete your public name")) {
    return isEs
      ? "Completá tu nombre público, ciudad y especialidad principal."
      : "Preencha seu nome público, cidade e especialidade principal.";
  }
  if (msg.includes("active service category")) {
    return isEs
      ? "Seleccioná una categoría de servicio activa."
      : "Selecione uma categoria de serviço ativa.";
  }
  if (
    msg.includes("start as a draft") ||
    msg.includes("verification is required before publication") ||
    msg.includes("verified professional can publish")
  ) {
    return isEs
      ? "Tu perfil debe guardarse como borrador y contar con verificación aprobada antes de publicarse."
      : "Seu perfil precisa ser salvo como rascunho e ter a verificação aprovada antes de ser publicado.";
  }
  if (msg.includes("at least five characters")) {
    return isEs
      ? "Ingresá al menos 5 caracteres con los datos de tu matrícula o habilitación."
      : "Informe pelo menos 5 caracteres com os dados da sua matrícula ou documento.";
  }
  if (msg.includes("already verified")) {
    return isEs
      ? "Tu perfil profesional ya se encuentra verificado."
      : "Seu perfil profissional já está verificado.";
  }
  if (
    msg.includes("cannot request verification") ||
    msg.includes("only an active professional")
  ) {
    return isEs
      ? "Guardá primero tu perfil profesional en borrador para poder solicitar la verificación."
      : "Salve primeiro seu perfil profissional em rascunho para solicitar a verificação.";
  }
  if (
    msg.includes("close active quote") ||
    msg.includes("complete or cancel active services")
  ) {
    return isEs
      ? "Tenés presupuestos o servicios activos. Cerralos antes de cambiar a cuenta de cliente."
      : "Você possui orçamentos ou serviços ativos. Encerre-os antes de mudar para conta de cliente.";
  }
  if (msg.includes("cannot change to client")) {
    return isEs
      ? "No es posible cambiar esta cuenta a cliente en este momento."
      : "Não é possível converter esta conta para cliente no momento.";
  }

  return isEs
    ? "No se pudo completar la operación. Intentá nuevamente en unos instantes."
    : "Não foi possível concluir a operação. Tente novamente em instantes.";
}

/**
 * Lê a nota de verificação do próprio profissional autenticado via RPC segura (Migration A),
 * sem depender de SELECT direto na coluna protegida `matricula_note`.
 */
export async function fetchOwnVerificationNote(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("get_own_verification_note");
  if (error) return null;
  return typeof data === "string" ? data : null;
}

/**
 * Envia solicitação de verificação profissional via RPC autenticada `request_professional_verification`.
 */
export async function requestOwnProfessionalVerification(
  note: string,
  locale: UiLocale = "pt-BR"
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error(mapProfessionalRpcError("not configured", locale));
  }

  const cleanNote = note.trim();
  if (cleanNote.length < 5) {
    throw new Error(mapProfessionalRpcError("at least five characters", locale));
  }

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.rpc("request_professional_verification", {
    matricula_or_document_note: cleanNote,
  });

  if (error) {
    throw new Error(mapProfessionalRpcError(error.message, locale));
  }
}

/**
 * Converte a conta profissional autenticada de volta para cliente via RPC transacional
 * `switch_own_account_to_client` (despublica a ficha preservando o histórico).
 */
export async function switchOwnAccountToClient(
  locale: UiLocale = "pt-BR"
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error(mapProfessionalRpcError("not configured", locale));
  }

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.rpc("switch_own_account_to_client");

  if (error) {
    throw new Error(mapProfessionalRpcError(error.message, locale));
  }
}

export interface UpsertOwnProfessionalInput {
  fullName: string;
  country: CountryCode;
  city: string;
  avatarUrl: string | null;
  slug: string;
  categorySlug: CategorySlug;
  primarySpecialtyEsAr: string;
  primarySpecialtyPtBr: string;
  secondarySpecialties: string[];
  bio: string;
  yearsOfExperience: number;
  neighborhood: string;
  coverageZones: string[];
  languages: string[];
  scheduleSummary: string;
  acceptsDirectContact: boolean;
  acceptsQuoteRequests: boolean;
  referenceStartingPrice: number | null;
  status: "draft" | "published";
  locale?: UiLocale;
}

/**
 * Crea o actualiza el perfil profesional del usuario autenticado (`auth.uid()`).
 * La moneda se asigna estrictamente según el país (`AR` -> `ARS`, `BR` -> `BRL`).
 */
export async function saveOwnProfessionalProfile(
  input: UpsertOwnProfessionalInput
): Promise<{ slug: string }> {
  const uiLocale: UiLocale = input.locale ?? "pt-BR";
  const supabase = createSupabaseBrowserClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error(mapProfessionalRpcError("sign in", uiLocale));
  }

  const normalizedSlug = input.slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const finalSlug =
    normalizedSlug.length >= 3
      ? normalizedSlug
      : `profesional-${user.id.slice(0, 8)}`;

  // Promotion and professional-profile save happen in one guarded database transaction.
  const { data, error } = await supabase.rpc("save_own_professional_profile", {
    p_profile: {
      full_name: input.fullName.trim(),
      country: input.country,
      city: input.city.trim(),
      avatar_url: input.avatarUrl?.trim() ? input.avatarUrl.trim() : null,
      slug: finalSlug,
      category_slug: input.categorySlug,
      primary_specialty_es_ar: input.primarySpecialtyEsAr.trim(),
      primary_specialty_pt_br:
        input.primarySpecialtyPtBr.trim() || input.primarySpecialtyEsAr.trim(),
      secondary_specialties: input.secondarySpecialties,
      bio: input.bio.trim(),
      years_of_experience: Math.max(0, Math.min(70, input.yearsOfExperience)),
      neighborhood: input.neighborhood.trim(),
      coverage_zones: input.coverageZones,
      languages: input.languages.length > 0 ? input.languages : ["Español"],
      schedule_summary: input.scheduleSummary.trim(),
      accepts_direct_contact: input.acceptsDirectContact,
      accepts_quote_requests: input.acceptsQuoteRequests,
      reference_starting_price:
        input.referenceStartingPrice && input.referenceStartingPrice > 0
          ? input.referenceStartingPrice
          : null,
      status: input.status,
    },
  });

  if (error) throw new Error(mapProfessionalRpcError(error.message, uiLocale));
  if (typeof data !== "string") {
    throw new Error(mapProfessionalRpcError(undefined, uiLocale));
  }
  return { slug: data };
}
