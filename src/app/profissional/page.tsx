"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  Image as ImageIcon,
  Loader2,
  Lock,
  MessageSquare,
  Plus,
  Save,
  Trash2,
  Wrench,
} from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { CITY_ZONES, formatRegionalCurrency } from "@/features/i18n/regions";
import { createSupabaseBrowserClient } from "@/services/supabase/client";
import {
  fetchRealCategories,
  saveOwnProfessionalProfile,
  type RealPortfolioPhoto,
  type RealServiceItem,
} from "@/services/supabase/professionals";
import { ChatWorkspace } from "@/features/messaging/components/ChatWorkspace";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { CategorySlug, CountryCode, ServiceCategory } from "@/types/domain";

type ProTabId = "profile" | "services" | "portfolio" | "messages";

export default function ProfessionalWorkspacePage() {
  const { dictionary, locale, tText } = useLocale();

  const [activeTab, setActiveTab] = useState<ProTabId>("profile");
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);

  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  // Campos del formulario de perfil profesional
  const [fullName, setFullName] = useState("");
  const [proCountry, setProCountry] = useState<CountryCode>("AR");
  const [city, setCity] = useState("Buenos Aires (CABA)");
  const [neighborhood, setNeighborhood] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [categorySlug, setCategorySlug] =
    useState<CategorySlug>("electricidad-y-gas");
  const [primarySpecialtyEs, setPrimarySpecialtyEs] = useState("");
  const [primarySpecialtyPt, setPrimarySpecialtyPt] = useState("");
  const [secondarySpecialtiesInput, setSecondarySpecialtiesInput] =
    useState("");
  const [bio, setBio] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("5");
  const [coverageZonesInput, setCoverageZonesInput] = useState("");
  const [languagesInput, setLanguagesInput] = useState("Español, Português");
  const [scheduleSummary, setScheduleSummary] = useState(
    "Lun a Vie 08:30 a 18:30"
  );
  const [acceptsDirectContact, setAcceptsDirectContact] = useState(true);
  const [acceptsQuoteRequests, setAcceptsQuoteRequests] = useState(true);
  const [referenceStartingPrice, setReferenceStartingPrice] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Servicios registrados en `public.services`
  const [services, setServices] = useState<RealServiceItem[]>([]);
  const [newServiceTitle, setNewServiceTitle] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceUnit, setNewServiceUnit] = useState("servicio base");
  const [isSavingService, setIsSavingService] = useState(false);

  // Fotos registradas en `public.professional_photos`
  const [photos, setPhotos] = useState<RealPortfolioPhoto[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [newPhotoZone, setNewPhotoZone] = useState("");
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  const proCurrency = proCountry === "BR" ? "BRL" : "ARS";
  const regionalCities = CITY_ZONES.filter((z) => z.country === proCountry);

  const loadWorkspaceData = useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      const [cats, userRes] = await Promise.all([
        fetchRealCategories(),
        supabase.auth.getUser(),
      ]);
      setCategories(cats);

      const user = userRes.data.user;
      if (!user) {
        setAuthUserId(null);
        setAuthEmail(null);
        return;
      }

      setAuthUserId(user.id);
      setAuthEmail(user.email ?? null);

      const [profileRes, proProfileRes, servicesRes, photosRes] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, country, city, avatar_url")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("professional_profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("services")
            .select("*")
            .eq("professional_id", user.id)
            .order("created_at", { ascending: true }),
          supabase
            .from("professional_photos")
            .select("*")
            .eq("professional_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

      if (profileRes.data) {
        setFullName(String(profileRes.data.full_name ?? ""));
        const c = (profileRes.data.country as CountryCode) || "AR";
        setProCountry(c);
        setCity(String(profileRes.data.city ?? ""));
        setAvatarUrl(String(profileRes.data.avatar_url ?? ""));
      }

      if (proProfileRes.data) {
        const pp = proProfileRes.data;
        setSlug(String(pp.slug ?? ""));
        setCategorySlug(
          (pp.category_slug as CategorySlug) || "electricidad-y-gas"
        );
        setPrimarySpecialtyEs(String(pp.primary_specialty_es_ar ?? ""));
        setPrimarySpecialtyPt(String(pp.primary_specialty_pt_br ?? ""));
        setSecondarySpecialtiesInput(
          Array.isArray(pp.secondary_specialties)
            ? pp.secondary_specialties.join(", ")
            : ""
        );
        setBio(String(pp.bio ?? ""));
        setYearsOfExperience(String(pp.years_of_experience ?? 0));
        setNeighborhood(String(pp.neighborhood ?? ""));
        setCoverageZonesInput(
          Array.isArray(pp.coverage_zones) ? pp.coverage_zones.join(", ") : ""
        );
        setLanguagesInput(
          Array.isArray(pp.languages) ? pp.languages.join(", ") : "Español"
        );
        setScheduleSummary(String(pp.schedule_summary ?? ""));
        setAcceptsDirectContact(Boolean(pp.accepts_direct_contact));
        setAcceptsQuoteRequests(Boolean(pp.accepts_quote_requests));
        setReferenceStartingPrice(
          pp.reference_starting_price ? String(pp.reference_starting_price) : ""
        );
        setStatus(pp.status === "published" ? "published" : "draft");
      }

      setServices(
        (servicesRes.data ?? []).map((s) => ({
          id: String(s.id),
          professionalId: String(s.professional_id),
          title: String(s.title),
          description: String(s.description ?? ""),
          referencePriceAmount: s.reference_price_amount
            ? Number(s.reference_price_amount)
            : null,
          currency: s.currency === "BRL" ? "BRL" : "ARS",
          priceUnitLabel: String(s.price_unit_label ?? ""),
        }))
      );

      setPhotos(
        (photosRes.data ?? []).map((p) => ({
          id: String(p.id),
          professionalId: String(p.professional_id),
          publicUrl: String(p.public_url),
          caption: String(p.caption ?? ""),
          zoneLabel: String(p.zone_label ?? ""),
          workYear: Number(p.work_year ?? 2026),
        }))
      );
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadWorkspaceData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadWorkspaceData]);

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileFeedback(null);

    if (fullName.trim().length < 3 || primarySpecialtyEs.trim().length < 3) {
      setProfileFeedback({
        type: "error",
        message:
          locale === "es-AR"
            ? "Completá tu nombre público y tu especialidad principal."
            : "Preencha seu nome público e sua especialidade principal.",
      });
      return;
    }

    setIsSavingProfile(true);
    try {
      const secondaryList = secondarySpecialtiesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const zonesList = coverageZonesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const langsList = languagesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const parsedPrice = referenceStartingPrice.trim()
        ? Number(referenceStartingPrice)
        : null;

      const saved = await saveOwnProfessionalProfile({
        fullName,
        country: proCountry,
        city: city || regionalCities[0]?.city || "Buenos Aires (CABA)",
        avatarUrl: avatarUrl.trim() || null,
        slug:
          slug.trim() ||
          `${fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        categorySlug,
        primarySpecialtyEsAr: primarySpecialtyEs,
        primarySpecialtyPtBr: primarySpecialtyPt || primarySpecialtyEs,
        secondarySpecialties: secondaryList,
        bio,
        yearsOfExperience: Number(yearsOfExperience) || 0,
        neighborhood,
        coverageZones: zonesList,
        languages: langsList,
        scheduleSummary,
        acceptsDirectContact,
        acceptsQuoteRequests,
        referenceStartingPrice: parsedPrice,
        status,
      });

      setSlug(saved.slug);
      setProfileFeedback({
        type: "success",
        message:
          locale === "es-AR"
            ? "¡Perfil profesional guardado correctamente en Supabase!"
            : "Perfil profissional salvo com sucesso no Supabase!",
      });
    } catch (err) {
      setProfileFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "No se pudo guardar el perfil profesional.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!authUserId || newServiceTitle.trim().length < 3) return;

    setIsSavingService(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const priceVal = newServicePrice.trim() ? Number(newServicePrice) : null;

      const { data, error } = await supabase
        .from("services")
        .insert({
          professional_id: authUserId,
          title: newServiceTitle.trim(),
          description: newServiceDesc.trim(),
          reference_price_amount: priceVal && priceVal > 0 ? priceVal : null,
          currency: proCurrency,
          price_unit_label: newServiceUnit.trim() || "servicio base",
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      if (data) {
        setServices((prev) => [
          ...prev,
          {
            id: String(data.id),
            professionalId: String(data.professional_id),
            title: String(data.title),
            description: String(data.description ?? ""),
            referencePriceAmount: data.reference_price_amount
              ? Number(data.reference_price_amount)
              : null,
            currency: data.currency === "BRL" ? "BRL" : "ARS",
            priceUnitLabel: String(data.price_unit_label ?? ""),
          },
        ]);
        setNewServiceTitle("");
        setNewServiceDesc("");
        setNewServicePrice("");
      }
    } catch (err) {
      setProfileFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Guardá primero tu ficha principal antes de agregar servicios.",
      });
    } finally {
      setIsSavingService(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!authUserId) return;
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", serviceId)
      .eq("professional_id", authUserId);

    if (!error) {
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
    }
  };

  const handleAddPhoto = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!authUserId || !newPhotoUrl.trim().startsWith("https://")) return;

    setIsSavingPhoto(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("professional_photos")
        .insert({
          professional_id: authUserId,
          storage_path: "external-url",
          public_url: newPhotoUrl.trim(),
          caption: newPhotoCaption.trim() || "Trabajo realizado",
          zone_label: newPhotoZone.trim() || city,
          work_year: new Date().getFullYear(),
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      if (data) {
        setPhotos((prev) => [
          {
            id: String(data.id),
            professionalId: String(data.professional_id),
            publicUrl: String(data.public_url),
            caption: String(data.caption ?? ""),
            zoneLabel: String(data.zone_label ?? ""),
            workYear: Number(data.work_year ?? 2026),
          },
          ...prev,
        ]);
        setNewPhotoUrl("");
        setNewPhotoCaption("");
        setNewPhotoZone("");
      }
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!authUserId) return;
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("professional_photos")
      .delete()
      .eq("id", photoId)
      .eq("professional_id", authUserId);

    if (!error) {
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    }
  };

  if (isLoadingSession) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#F28C28]" />
        <p className="mt-3 text-sm font-semibold text-[#24272B]">
          {locale === "es-AR"
            ? "Verificando sesión con Supabase Auth..."
            : "Verificando sessão com Supabase Auth..."}
        </p>
      </div>
    );
  }

  if (!authUserId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14 text-center">
        <div className="rounded-2xl border border-[#DFD8CC] bg-white p-8 shadow-xs">
          <Lock className="mx-auto h-10 w-10 text-[#F28C28]" />
          <h1 className="mt-4 text-2xl font-extrabold text-[#24272B]">
            {dictionary.privateAreas.proTitle}
          </h1>
          <p className="mt-2 text-sm text-[#525860]">
            {locale === "es-AR"
              ? "Para crear o editar tu perfil profesional y gestionar tus servicios en Supabase, primero ingresá con tu cuenta."
              : "Para criar ou editar seu perfil profissional e gerenciar seus serviços no Supabase, entre primeiro com sua conta."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/entrar">
              <Button variant="primary">{dictionary.nav.login}</Button>
            </Link>
            <Link href="/cadastro?role=professional">
              <Button variant="graphite">
                {dictionary.proCtaSection.primaryCta}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Cabecera */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#DFD8CC] pb-6 sm:flex-row sm:items-end">
        <div>
          <Badge variant="emerald">
            Sesión activa: {authEmail} · Moneda {proCurrency}
          </Badge>
          <h1 className="mt-2 text-3xl font-extrabold text-[#24272B]">
            {dictionary.privateAreas.proTitle}
          </h1>
          <p className="mt-1 text-sm text-[#525860]">
            {locale === "es-AR"
              ? "Gestioná los datos reales de tu perfil profesional, tus servicios en " +
                proCurrency +
                " y el estado de publicación."
              : "Gerencie os dados reais do seu perfil profissional, seus serviços em " +
                proCurrency +
                " e o status de publicação."}
          </p>
        </div>

        {slug && (
          <Link
            href={`/profissionais/${slug}`}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#24272B] px-4 text-xs font-semibold text-[#F7F4EE] hover:bg-[#32363C]"
          >
            <span>
              {locale === "es-AR"
                ? "Ver mi perfil público"
                : "Ver meu perfil público"}
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-[#F28C28]" />
          </Link>
        )}
      </div>

      {profileFeedback && (
        <div
          role={profileFeedback.type === "error" ? "alert" : "status"}
          className={`mt-6 rounded-xl border p-4 text-xs font-semibold ${
            profileFeedback.type === "error"
              ? "border-[#E5A49B] bg-[#FDF2F0] text-[#B93829]"
              : "border-[#A7D7C2] bg-[#EAF5F0] text-[#176041]"
          }`}
        >
          <p className="flex items-center gap-2">
            {profileFeedback.type === "error" ? (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            <span>{profileFeedback.message}</span>
          </p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Navegación lateral */}
        <nav className="space-y-1.5 lg:col-span-3">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-semibold ${
              activeTab === "profile"
                ? "bg-[#24272B] text-[#F7F4EE]"
                : "border border-[#DFD8CC] bg-white text-[#3D4249]"
            }`}
          >
            <FileCheck2 className="h-4 w-4 text-[#F28C28]" />
            <span>
              {locale === "es-AR"
                ? "Datos del Perfil"
                : "Dados do Perfil"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("services")}
            className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-semibold ${
              activeTab === "services"
                ? "bg-[#24272B] text-[#F7F4EE]"
                : "border border-[#DFD8CC] bg-white text-[#3D4249]"
            }`}
          >
            <Wrench className="h-4 w-4 text-[#F28C28]" />
            <span>
              {locale === "es-AR"
                ? `Servicios y Precios (${proCurrency})`
                : `Serviços e Preços (${proCurrency})`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("portfolio")}
            className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-semibold ${
              activeTab === "portfolio"
                ? "bg-[#24272B] text-[#F7F4EE]"
                : "border border-[#DFD8CC] bg-white text-[#3D4249]"
            }`}
          >
            <ImageIcon className="h-4 w-4 text-[#F28C28]" />
            <span>
              {locale === "es-AR"
                ? "Fotos de Trabajos"
                : "Fotos de Trabalhos"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("messages")}
            className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-semibold ${
              activeTab === "messages"
                ? "bg-[#24272B] text-[#F7F4EE]"
                : "border border-[#DFD8CC] bg-white text-[#3D4249]"
            }`}
          >
            <MessageSquare className="h-4 w-4 text-[#F28C28]" />
            <span>
              {locale === "es-AR"
                ? "Mensajes y Presupuestos"
                : "Mensagens e Orçamentos"}
            </span>
          </button>
        </nav>

        {/* Contenido principal */}
        <section className="rounded-2xl border border-[#DFD8CC] bg-white p-6 shadow-2xs lg:col-span-9">
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ECE6DC] pb-4">
                <h2 className="text-lg font-bold text-[#24272B]">
                  {locale === "es-AR"
                    ? "Ficha pública y configuración regional"
                    : "Perfil público e configuração regional"}
                </h2>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="pro-status"
                    className="text-xs font-bold text-[#24272B]"
                  >
                    Estado:
                  </label>
                  <select
                    id="pro-status"
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as "draft" | "published")
                    }
                    className="rounded-lg border border-[#D4CCC0] bg-[#F7F4EE] px-3 py-1.5 text-xs font-bold text-[#24272B]"
                  >
                    <option value="draft">
                      {locale === "es-AR"
                        ? "Borrador (Oculto en directorio)"
                        : "Rascunho (Oculto no diretório)"}
                    </option>
                    <option value="published">
                      {locale === "es-AR"
                        ? "Publicado (Visible en directorio)"
                        : "Publicado (Visível no diretório)"}
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#24272B]">
                    {dictionary.auth.fullNameLabel}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[#D4CCC0] px-3 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-[#24272B]">
                    Slug URL (`/profissionais/[slug]`)
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="ej: martin-echeverria-gas"
                    className="h-10 w-full rounded-xl border border-[#D4CCC0] px-3 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#24272B]">
                    {dictionary.auth.countryLabel}
                  </label>
                  <select
                    value={proCountry}
                    onChange={(e) => {
                      const nextC = e.target.value as CountryCode;
                      setProCountry(nextC);
                      const firstCity = CITY_ZONES.find(
                        (z) => z.country === nextC
                      )?.city;
                      if (firstCity) setCity(firstCity);
                    }}
                    className="h-10 w-full rounded-xl border border-[#D4CCC0] bg-white px-3 text-sm"
                  >
                    <option value="AR">Argentina (ARS)</option>
                    <option value="BR">Brasil (BRL)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-[#24272B]">
                    {dictionary.auth.cityLabel}
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[#D4CCC0] bg-white px-3 text-sm"
                  >
                    {regionalCities.map((z) => (
                      <option key={z.id} value={z.city}>
                        {z.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-[#24272B]">
                    {locale === "es-AR" ? "Barrio base" : "Bairro principal"}
                  </label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Ej: Palermo / Pinheiros"
                    className="h-10 w-full rounded-xl border border-[#D4CCC0] px-3 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#24272B]">
                    {dictionary.directoryPage.categoryFilterLabel}
                  </label>
                  <select
                    value={categorySlug}
                    onChange={(e) =>
                      setCategorySlug(e.target.value as CategorySlug)
                    }
                    className="h-10 w-full rounded-xl border border-[#D4CCC0] bg-white px-3 text-sm"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {tText(cat.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-[#24272B]">
                    {locale === "es-AR"
                      ? "Años de experiencia"
                      : "Anos de experiência"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={70}
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[#D4CCC0] px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-[#24272B]">
                    {locale === "es-AR"
                      ? `Precio inicial ref. (${proCurrency}, opcional)`
                      : `Preço inicial ref. (${proCurrency}, opcional)`}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={referenceStartingPrice}
                    onChange={(e) => setReferenceStartingPrice(e.target.value)}
                    placeholder={proCountry === "AR" ? "28000" : "160"}
                    className="h-10 w-full rounded-xl border border-[#D4CCC0] px-3 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#24272B]">
                    Especialidad principal (Español AR)
                  </label>
                  <input
                    type="text"
                    value={primarySpecialtyEs}
                    onChange={(e) => setPrimarySpecialtyEs(e.target.value)}
                    placeholder="Ej: Gasista Matriculado y Electricista"
                    className="h-10 w-full rounded-xl border border-[#D4CCC0] px-3 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-[#24272B]">
                    Especialidade principal (Português BR)
                  </label>
                  <input
                    type="text"
                    value={primarySpecialtyPt}
                    onChange={(e) => setPrimarySpecialtyPt(e.target.value)}
                    placeholder="Ex: Instalador de Gás e Eletricista"
                    className="h-10 w-full rounded-xl border border-[#D4CCC0] px-3 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#24272B]">
                  {locale === "es-AR"
                    ? "Descripción y experiencia profesional"
                    : "Descrição e experiência profissional"}
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-xl border border-[#D4CCC0] p-3 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#24272B]">
                    {locale === "es-AR"
                      ? "Especialidades secundarias (separadas por coma)"
                      : "Especialidades secundárias (separadas por vírgula)"}
                  </label>
                  <input
                    type="text"
                    value={secondarySpecialtiesInput}
                    onChange={(e) =>
                      setSecondarySpecialtiesInput(e.target.value)
                    }
                    placeholder="Tableros eléctricos, Termotanques, Estufas"
                    className="h-10 w-full rounded-xl border border-[#D4CCC0] px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-[#24272B]">
                    {locale === "es-AR"
                      ? "Barrios / Zonas de atención (separados por coma)"
                      : "Bairros / Regiões atendidas (separados por vírgula)"}
                  </label>
                  <input
                    type="text"
                    value={coverageZonesInput}
                    onChange={(e) => setCoverageZonesInput(e.target.value)}
                    placeholder="Palermo, Belgrano, Recoleta"
                    className="h-10 w-full rounded-xl border border-[#D4CCC0] px-3 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#24272B]">
                    Idiomas
                  </label>
                  <input
                    type="text"
                    value={languagesInput}
                    onChange={(e) => setLanguagesInput(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[#D4CCC0] px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-[#24272B]">
                    {locale === "es-AR"
                      ? "Días y horarios habituales"
                      : "Dias e horários habituais"}
                  </label>
                  <input
                    type="text"
                    value={scheduleSummary}
                    onChange={(e) => setScheduleSummary(e.target.value)}
                    className="h-10 w-full rounded-xl border border-[#D4CCC0] px-3 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-[#24272B]">
                    URL de foto de perfil (`https://...`)
                  </label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="h-10 w-full rounded-xl border border-[#D4CCC0] px-3 text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6 pt-2 text-xs font-semibold text-[#24272B]">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptsDirectContact}
                    onChange={(e) => setAcceptsDirectContact(e.target.checked)}
                    className="h-4 w-4 accent-[#F28C28]"
                  />
                  <span>{dictionary.profileCard.directContactBadge}</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptsQuoteRequests}
                    onChange={(e) => setAcceptsQuoteRequests(e.target.checked)}
                    className="h-4 w-4 accent-[#F28C28]"
                  />
                  <span>{dictionary.profileCard.quoteRequestBadge}</span>
                </label>
              </div>

              <div className="border-t border-[#ECE6DC] pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSavingProfile}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  {locale === "es-AR"
                    ? "Guardar perfil profesional en Supabase"
                    : "Salvar perfil profissional no Supabase"}
                </Button>
              </div>
            </form>
          )}

          {activeTab === "services" && (
            <div className="space-y-6">
              <div className="border-b border-[#ECE6DC] pb-4">
                <h2 className="text-lg font-bold text-[#24272B]">
                  {locale === "es-AR"
                    ? `Catálogo de servicios (${proCurrency})`
                    : `Catálogo de serviços (${proCurrency})`}
                </h2>
                <p className="mt-1 text-xs text-[#525860]">
                  {locale === "es-AR"
                    ? "Los servicios registrados aquí permiten que los clientes te encuentren también al buscar por trabajo específico."
                    : "Os serviços cadastrados aqui permitem que clientes encontrem seu perfil ao buscar por serviços específicos."}
                </p>
              </div>

              {/* Lista de servicios reales */}
              {services.length === 0 ? (
                <p className="text-sm text-[#525860]">
                  {locale === "es-AR"
                    ? "Aún no tenés servicios cargados en tu perfil."
                    : "Você ainda não possui serviços cadastrados no seu perfil."}
                </p>
              ) : (
                <div className="space-y-3">
                  {services.map((srv) => (
                    <div
                      key={srv.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-[#E4DDD2] bg-[#F7F4EE]/70 p-4"
                    >
                      <div>
                        <p className="text-sm font-bold text-[#24272B]">
                          {srv.title}
                        </p>
                        <p className="text-xs text-[#525860]">
                          {srv.description}
                        </p>
                        {srv.referencePriceAmount && (
                          <p className="mt-1 font-mono text-xs font-bold text-[#C86D14]">
                            {formatRegionalCurrency(
                              srv.referencePriceAmount,
                              srv.currency,
                              srv.currency === "BRL" ? "pt-BR" : "es-AR"
                            )}{" "}
                            · {srv.priceUnitLabel}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDeleteService(srv.id)}
                      >
                        <Trash2 className="h-4 w-4 text-[#B93829]" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario para agregar nuevo servicio */}
              <form
                onSubmit={handleAddService}
                className="rounded-xl border border-[#DFD8CC] bg-[#F7F4EE]/50 p-4 space-y-3"
              >
                <h3 className="text-sm font-bold text-[#24272B]">
                  {locale === "es-AR"
                    ? "Agregar nuevo servicio"
                    : "Adicionar novo serviço"}
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    value={newServiceTitle}
                    onChange={(e) => setNewServiceTitle(e.target.value)}
                    placeholder={
                      locale === "es-AR"
                        ? "Título del servicio"
                        : "Título do serviço"
                    }
                    className="h-10 rounded-xl border border-[#D4CCC0] bg-white px-3 text-sm sm:col-span-2"
                    required
                  />
                  <input
                    type="number"
                    min={0}
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    placeholder={`Precio ref. (${proCurrency})`}
                    className="h-10 rounded-xl border border-[#D4CCC0] bg-white px-3 font-mono text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    value={newServiceDesc}
                    onChange={(e) => setNewServiceDesc(e.target.value)}
                    placeholder={
                      locale === "es-AR"
                        ? "Descripción breve del trabajo"
                        : "Descrição breve do serviço"
                    }
                    className="h-10 rounded-xl border border-[#D4CCC0] bg-white px-3 text-sm sm:col-span-2"
                  />
                  <input
                    type="text"
                    value={newServiceUnit}
                    onChange={(e) => setNewServiceUnit(e.target.value)}
                    placeholder="Unidad (ej: por unidad)"
                    className="h-10 rounded-xl border border-[#D4CCC0] bg-white px-3 text-sm"
                  />
                </div>
                <Button
                  type="submit"
                  variant="graphite"
                  size="sm"
                  isLoading={isSavingService}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  {locale === "es-AR"
                    ? "Guardar servicio"
                    : "Salvar serviço"}
                </Button>
              </form>
            </div>
          )}

          {activeTab === "portfolio" && (
            <div className="space-y-6">
              <div className="border-b border-[#ECE6DC] pb-4">
                <h2 className="text-lg font-bold text-[#24272B]">
                  {locale === "es-AR"
                    ? "Galería de trabajos realizados"
                    : "Galeria de trabalhos realizados"}
                </h2>
                <p className="mt-1 text-xs text-[#525860]">
                  {locale === "es-AR"
                    ? "Nota de seguridad de Supabase Storage: el proyecto aún no tiene un bucket público con políticas RLS de objetos configurado, por lo que la subida directa de archivos binarios permanece deshabilitada. Podés vincular imágenes HTTPS seguras en `public.professional_photos`."
                    : "Nota de segurança do Supabase Storage: o projeto ainda não possui um bucket com políticas RLS de objetos configurado, portanto o upload direto de arquivos binários permanece desativado. Você pode vincular imagens HTTPS seguras em `public.professional_photos`."}
                </p>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="overflow-hidden rounded-xl border border-[#E4DDD2] bg-[#F7F4EE]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.publicUrl}
                        alt={photo.caption}
                        className="h-40 w-full object-cover"
                      />
                      <div className="flex items-center justify-between p-3">
                        <div>
                          <p className="text-xs font-bold text-[#24272B]">
                            {photo.caption}
                          </p>
                          <p className="text-[11px] text-[#666C75]">
                            {photo.zoneLabel} · {photo.workYear}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleDeletePhoto(photo.id)}
                        >
                          <Trash2 className="h-4 w-4 text-[#B93829]" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form
                onSubmit={handleAddPhoto}
                className="rounded-xl border border-[#DFD8CC] bg-[#F7F4EE]/50 p-4 space-y-3"
              >
                <h3 className="text-sm font-bold text-[#24272B]">
                  {locale === "es-AR"
                    ? "Vincular imagen de trabajo (HTTPS)"
                    : "Vincular imagem de trabalho (HTTPS)"}
                </h3>
                <input
                  type="url"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="h-10 w-full rounded-xl border border-[#D4CCC0] bg-white px-3 text-xs"
                  required
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={newPhotoCaption}
                    onChange={(e) => setNewPhotoCaption(e.target.value)}
                    placeholder="Descripción del trabajo"
                    className="h-10 rounded-xl border border-[#D4CCC0] bg-white px-3 text-sm"
                    required
                  />
                  <input
                    type="text"
                    value={newPhotoZone}
                    onChange={(e) => setNewPhotoZone(e.target.value)}
                    placeholder="Barrio / Ciudad"
                    className="h-10 rounded-xl border border-[#D4CCC0] bg-white px-3 text-sm"
                  />
                </div>
                <Button
                  type="submit"
                  variant="graphite"
                  size="sm"
                  isLoading={isSavingPhoto}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  {locale === "es-AR" ? "Agregar foto" : "Adicionar foto"}
                </Button>
              </form>
            </div>
          )}

          {activeTab === "messages" && <ChatWorkspace />}
        </section>
      </div>
    </div>
  );
}
