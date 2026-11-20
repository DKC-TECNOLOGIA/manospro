import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import type {
  CategorySlug,
  CountryCode,
  CurrencyCode,
  ServiceCategory,
} from "@/types/domain";
import type {
  DirectoryQueryFilters,
  PaginatedProfessionalsResult,
  RealPortfolioPhoto,
  RealProfessionalDetail,
  RealProfessionalListItem,
  RealReviewSummary,
  RealServiceItem,
} from "./professionals";

const RETIRED_SAMPLE_USER_IDS = [
  "a1111111-1111-1111-1111-111111111111",
  "a2222222-2222-2222-2222-222222222222",
  "a3333333-3333-3333-3333-333333333333",
  "a4444444-4444-4444-4444-444444444444",
  "a5555555-5555-5555-5555-555555555555",
  "a6666666-6666-6666-6666-666666666666",
  "a7777777-7777-7777-7777-777777777777",
].join(",");

export type PublicFetchStatus = "ok" | "unconfigured" | "error";

export interface PublicFetchOutcome<T> {
  status: PublicFetchStatus;
  data: T;
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
  service_provided?: string;
  comment?: string;
  created_at?: string;
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
  verification_status?: "unverified" | "pending" | "verified" | "rejected";
  created_at: string;
  profiles: RawPublicProfileJoin | RawPublicProfileJoin[];
  services?: RawServiceJoin[];
  reviews?: RawReviewJoin[];
  professional_photos?: RawPhotoJoin[];
}

function normalizeIconName(icon: string): ServiceCategory["iconName"] {
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

function mapCategoryRow(row: RawCategoryRow): ServiceCategory {
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

function mapProfessionalRow(row: RawProfessionalRow): RealProfessionalListItem {
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
    isVerified: row.verification_status === "verified",
    realReviewCount,
    realAverageRating,
    matchedServiceTitles: (row.services ?? []).map((s) => s.title),
  };
}

/**
 * Cliente público server-side sem cookies (usa somente anon key + RLS pública).
 * Não depende de `cookies()`, preservando compatibilidade com caching/prerender
 * do Next.js 16 e nunca expondo PII ou bypass de RLS.
 */
function createPublicAnonServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function fetchPublicCategoriesServer(): Promise<
  PublicFetchOutcome<ServiceCategory[]>
> {
  const supabase = createPublicAnonServerClient();
  if (!supabase) {
    return { status: "unconfigured", data: [] };
  }

  try {
    const { data, error } = await supabase
      .from("categories")
      .select(
        "id, slug, icon_name, name_es_ar, name_pt_br, description_es_ar, description_pt_br, examples_es_ar, examples_pt_br, display_order, is_active"
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      return { status: "error", data: [] };
    }

    return {
      status: "ok",
      data: ((data ?? []) as RawCategoryRow[]).map(mapCategoryRow),
    };
  } catch {
    return { status: "error", data: [] };
  }
}

export async function fetchPublicCategoryBySlugServer(
  slug: string
): Promise<PublicFetchOutcome<ServiceCategory | null>> {
  const supabase = createPublicAnonServerClient();
  if (!supabase) {
    return { status: "unconfigured", data: null };
  }

  try {
    const { data, error } = await supabase
      .from("categories")
      .select(
        "id, slug, icon_name, name_es_ar, name_pt_br, description_es_ar, description_pt_br, examples_es_ar, examples_pt_br, display_order, is_active"
      )
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      return { status: "error", data: null };
    }

    return {
      status: "ok",
      data: data ? mapCategoryRow(data as RawCategoryRow) : null,
    };
  } catch {
    return { status: "error", data: null };
  }
}

export async function searchPublicProfessionalsServer(
  filters: DirectoryQueryFilters
): Promise<PublicFetchOutcome<PaginatedProfessionalsResult>> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, Math.min(24, filters.pageSize ?? 6));
  const emptyResult: PaginatedProfessionalsResult = {
    items: [],
    totalCount: 0,
    page,
    pageSize,
    totalPages: 1,
    hasAnyReviewsInResult: false,
  };

  const supabase = createPublicAnonServerClient();
  if (!supabase) {
    return { status: "unconfigured", data: emptyResult };
  }

  try {
    const searchTerm = (filters.query ?? "").trim();
    let matchedUserIdsFromNameOrService: string[] = [];

    if (searchTerm.length > 0) {
      const safePattern = `%${searchTerm.replace(/[%_,()]/g, "")}%`;
      const [nameMatchesRes, serviceMatchesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id")
          .eq("is_suspended", false)
          .ilike("full_name", safePattern)
          .limit(200),
        supabase
          .from("services")
          .select("professional_id")
          .or(`title.ilike.${safePattern},description.ilike.${safePattern}`)
          .limit(200),
      ]);

      if (nameMatchesRes.error || serviceMatchesRes.error) {
        return { status: "error", data: emptyResult };
      }

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
        verification_status,
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
      const cleanCity = filters.city.replace(/[%_,()]/g, "").trim();
      if (cleanCity.length > 0) {
        queryBuilder = queryBuilder.ilike("profiles.city", `%${cleanCity}%`);
      }
    }

    if (filters.contactMode === "direct") {
      queryBuilder = queryBuilder.eq("accepts_direct_contact", true);
    } else if (filters.contactMode === "quote") {
      queryBuilder = queryBuilder.eq("accepts_quote_requests", true);
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
      return { status: "error", data: emptyResult };
    }

    const rawRows = (data ?? []) as unknown as RawProfessionalRow[];
    let items = rawRows.map(mapProfessionalRow);
    const hasAnyReviewsInResult = items.some((item) => item.realReviewCount > 0);

    if (filters.sortBy === "rating" && hasAnyReviewsInResult) {
      items = [...items].sort(
        (a, b) => (b.realAverageRating ?? 0) - (a.realAverageRating ?? 0)
      );
    }

    const totalCount = count ?? items.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return {
      status: "ok",
      data: {
        items,
        totalCount,
        page,
        pageSize,
        totalPages,
        hasAnyReviewsInResult,
      },
    };
  } catch {
    return { status: "error", data: emptyResult };
  }
}

const SERVER_PROFILE_FETCH_TIMEOUT_MS = 8_000;

export async function fetchPublicProfessionalBySlugServer(
  slug: string
): Promise<PublicFetchOutcome<RealProfessionalDetail | null>> {
  const supabase = createPublicAnonServerClient();
  if (!supabase) {
    return { status: "unconfigured", data: null };
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const queryPromise = supabase
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
        verification_status,
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

    const { data, error } = await Promise.race([
      queryPromise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("server_profile_fetch_timeout"));
        }, SERVER_PROFILE_FETCH_TIMEOUT_MS);
      }),
    ]);

    if (error) {
      return { status: "error", data: null };
    }

    if (!data) {
      return { status: "ok", data: null };
    }

    const row = data as unknown as RawProfessionalRow;
    const base = mapProfessionalRow(row);

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
      serviceProvided: r.service_provided ?? "",
      comment: r.comment ?? "",
      createdAt: r.created_at ?? "",
    }));

    return {
      status: "ok",
      data: {
        ...base,
        services,
        portfolio,
        reviews,
      },
    };
  } catch {
    return { status: "error", data: null };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export const getCachedPublicProfessionalBySlugServer = cache(
  fetchPublicProfessionalBySlugServer
);
