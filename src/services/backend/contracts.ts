import type {
  AccountRole,
  CategorySlug,
  CountryCode,
  ProfessionalFilterParams,
  ProfessionalProfile,
  ServiceCategory,
} from "@/types/domain";

/**
 * Contratos de acceso a datos preparados para la Fase 2 (Supabase PostgreSQL + Auth + RLS + Storage).
 *
 * REGLA ARQUITECTÓNICA DE SEGURIDAD:
 * - Ninguna operación de escritura, cambio de rol, verificación de matrícula ni moderación
 *   confiará jamás en parámetros enviados por el cliente (país, rol o ID de usuario).
 * - Todas las mutaciones reales en Fase 2 verificarán `auth.uid()` mediante Server Actions / Route Handlers
 *   y políticas Row Level Security (RLS) en PostgreSQL.
 */

export interface AuthSessionSummary {
  userId: string;
  email: string;
  role: AccountRole;
  country: CountryCode;
  isEmailVerified: boolean;
}

export interface ProfessionalsRepositoryContract {
  listProfessionals(params: ProfessionalFilterParams): Promise<ProfessionalProfile[]>;
  getProfessionalBySlug(slug: string): Promise<ProfessionalProfile | null>;
  listByCategory(categorySlug: CategorySlug): Promise<ProfessionalProfile[]>;
}

export interface CategoriesRepositoryContract {
  listCategories(): Promise<ServiceCategory[]>;
  getCategoryBySlug(slug: string): Promise<ServiceCategory | null>;
}

/**
 * Esquema relacional previsto para Supabase (según documento funcional ManosPro Sección 9):
 * 1. `profiles` (id uuid PK ref auth.users, role, full_name, country, city, avatar_url, created_at)
 * 2. `professional_profiles` (user_id uuid PK ref profiles, slug unique, bio, years_experience, status ['draft'|'published'|'suspended'], verification_status ['unverified'|'pending'|'verified'])
 * 3. `categories` (id uuid PK, slug unique, name_es_ar, name_pt_br, icon_name)
 * 4. `services` (id uuid PK, professional_id uuid ref professional_profiles, title, description, ref_price_amount, currency ['ARS'|'BRL'])
 * 5. `favorites` (client_id uuid ref profiles, professional_id uuid ref professional_profiles, PRIMARY KEY (client_id, professional_id))
 * 6. `conversations` (id uuid PK, created_at, updated_at, quote_status)
 * 7. `conversation_participants` (conversation_id uuid, user_id uuid, PRIMARY KEY (conversation_id, user_id))
 * 8. `messages` (id uuid PK, conversation_id uuid, sender_id uuid, body text, attachment_url text, read_at timestamptz)
 * 9. `reviews` (id uuid PK, professional_id uuid, client_id uuid, rating smallint check 1..5, comment text, UNIQUE (professional_id, client_id))
 * 10. `professional_photos` (id uuid PK, professional_id uuid, storage_path text, caption text, year int)
 */
export const PLANNED_SUPABASE_TABLES = [
  "profiles",
  "professional_profiles",
  "categories",
  "services",
  "favorites",
  "conversations",
  "conversation_participants",
  "messages",
  "reviews",
  "professional_photos",
] as const;
