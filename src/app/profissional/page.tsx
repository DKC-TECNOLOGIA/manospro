"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  Image as ImageIcon,
  Loader2,
  Lock,
  MessageSquare,
  Plus,
  Save,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  UserMinus,
  Wrench,
  X,
} from "lucide-react";
import { useLocale } from "@/features/i18n/LocaleContext";
import { useAuth } from "@/features/auth/AuthProvider";
import { ProfileAvatarUploader } from "@/features/auth/components/ProfileAvatarUploader";
import { CITY_ZONES, formatRegionalCurrency } from "@/features/i18n/regions";
import { createSupabaseBrowserClient } from "@/services/supabase/client";
import {
  fetchOwnVerificationNote,
  fetchRealCategories,
  requestOwnProfessionalVerification,
  saveOwnProfessionalProfile,
  switchOwnAccountToClient,
  type RealPortfolioPhoto,
  type RealServiceItem,
} from "@/services/supabase/professionals";
import {
  deleteOwnPortfolioPhoto,
  uploadOwnPortfolioPhoto,
  validatePortfolioPhotoFile,
} from "@/services/supabase/portfolioStorage";
import { ChatWorkspace } from "@/features/messaging/components/ChatWorkspace";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { CategorySlug, CountryCode, ServiceCategory } from "@/types/domain";

type ProTabId = "profile" | "services" | "portfolio" | "messages";

export default function ProfessionalWorkspacePage() {
  const router = useRouter();
  const { dictionary, locale, tText } = useLocale();
  const { updateProfileAvatar } = useAuth();

  const [activeTab, setActiveTab] = useState<ProTabId>("profile");
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [accountRole, setAccountRole] = useState<"client" | "professional" | "admin">("client");
  const [isAccountSuspended, setIsAccountSuspended] = useState(false);
  const [hasProfessionalProfile, setHasProfessionalProfile] = useState(false);
  const [proProfileStatus, setProProfileStatus] = useState<"draft" | "published" | "suspended" | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"unverified" | "pending" | "verified">("unverified");
  const [verificationNoteInput, setVerificationNoteInput] = useState("");
  const [savedVerificationNote, setSavedVerificationNote] = useState<string | null>(null);
  const [isRequestingVerification, setIsRequestingVerification] = useState(false);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [isSwitchingToClient, setIsSwitchingToClient] = useState(false);

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
  const portfolioFileInputId = useId();
  const portfolioFileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<RealPortfolioPhoto[]>([]);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<string | null>(null);
  const [photoFeedback, setPhotoFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [newPhotoZone, setNewPhotoZone] = useState("");
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  useEffect(() => {
    return () => {
      if (selectedPhotoPreview) URL.revokeObjectURL(selectedPhotoPreview);
    };
  }, [selectedPhotoPreview]);

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

      const [profileRes, proProfileRes, verificationNote, servicesRes, photosRes] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, role, is_suspended, full_name, country, city, avatar_url")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("professional_profiles")
            .select(
              "slug, category_slug, primary_specialty_es_ar, primary_specialty_pt_br, secondary_specialties, bio, years_of_experience, neighborhood, coverage_zones, languages, schedule_summary, accepts_direct_contact, accepts_quote_requests, reference_starting_price, status, verification_status"
            )
            .eq("user_id", user.id)
            .maybeSingle(),
          fetchOwnVerificationNote(),
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
        const nextRole =
          profileRes.data.role === "professional" || profileRes.data.role === "admin"
            ? profileRes.data.role
            : "client";
        setAccountRole(nextRole);
        setIsAccountSuspended(Boolean(profileRes.data.is_suspended));
        setFullName(String(profileRes.data.full_name ?? ""));
        const c = (profileRes.data.country as CountryCode) || "AR";
        setProCountry(c);
        setCity(String(profileRes.data.city ?? ""));
        setAvatarUrl(String(profileRes.data.avatar_url ?? ""));
      }

      setSavedVerificationNote(verificationNote);
      if (verificationNote) {
        setVerificationNoteInput(verificationNote);
      }

      if (proProfileRes.data) {
        const pp = proProfileRes.data;
        setHasProfessionalProfile(true);
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
        const rawStatus =
          pp.status === "published" || pp.status === "suspended"
            ? pp.status
            : "draft";
        setProProfileStatus(rawStatus);
        setStatus(rawStatus === "published" ? "published" : "draft");
        const rawVerification =
          pp.verification_status === "verified" || pp.verification_status === "pending"
            ? pp.verification_status
            : "unverified";
        setVerificationStatus(rawVerification);
      } else {
        setHasProfessionalProfile(false);
        setProProfileStatus(null);
        setVerificationStatus("unverified");
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
          storagePath: typeof p.storage_path === "string" ? p.storage_path : undefined,
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
        status: canPublish ? status : "draft",
        locale,
      });

      setSlug(saved.slug);
      setHasProfessionalProfile(true);
      if (accountRole === "client") {
        setAccountRole("professional");
      }
      setProProfileStatus(canPublish ? status : "draft");
      setProfileFeedback({
        type: "success",
        message:
          locale === "es-AR"
            ? "¡Perfil profesional guardado correctamente!"
            : "Perfil profissional salvo com sucesso!",
      });
    } catch (err) {
      setProfileFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : locale === "es-AR"
              ? "No se pudo guardar el perfil profesional."
              : "Não foi possível salvar o perfil profissional.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const isBlocked = isAccountSuspended || proProfileStatus === "suspended";
  const canPublish = !isBlocked && verificationStatus === "verified";
  const needsPublication = canPublish && proProfileStatus !== "published";

  const handleQuickPublish = async () => {
    if (!canPublish || isSavingProfile) return;
    setProfileFeedback(null);

    if (fullName.trim().length < 3 || primarySpecialtyEs.trim().length < 3) {
      setProfileFeedback({
        type: "error",
        message:
          locale === "es-AR"
            ? "Completá tu nombre público y tu especialidad principal antes de publicar."
            : "Preencha seu nome público e sua especialidade principal antes de publicar.",
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
        status: "published",
        locale,
      });

      setSlug(saved.slug);
      setHasProfessionalProfile(true);
      setStatus("published");
      setProProfileStatus("published");
      setProfileFeedback({
        type: "success",
        message:
          locale === "es-AR"
            ? "¡Tu perfil fue publicado y ya aparece en el directorio público!"
            : "Seu perfil foi publicado e já aparece no diretório público!",
      });
    } catch (err) {
      setProfileFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : locale === "es-AR"
              ? "No se pudo publicar el perfil."
              : "Não foi possível publicar o perfil.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRequestVerification = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setProfileFeedback(null);

    if (isBlocked) {
      setProfileFeedback({
        type: "error",
        message:
          locale === "es-AR"
            ? "Tu cuenta o perfil está bloqueado y no puede solicitar verificación."
            : "Sua conta ou perfil está bloqueado e não pode solicitar verificação.",
      });
      return;
    }

    if (verificationNoteInput.trim().length < 5) {
      setProfileFeedback({
        type: "error",
        message:
          locale === "es-AR"
            ? "Ingresá al menos 5 caracteres con los datos de tu matrícula o documento."
            : "Informe pelo menos 5 caracteres com os dados da sua matrícula ou documento.",
      });
      return;
    }

    setIsRequestingVerification(true);
    try {
      await requestOwnProfessionalVerification(verificationNoteInput, locale);
      setVerificationStatus("pending");
      setSavedVerificationNote(verificationNoteInput.trim());
      setStatus("draft");
      setProProfileStatus("draft");
      setProfileFeedback({
        type: "success",
        message:
          locale === "es-AR"
            ? "Solicitud de verificación enviada. Nuestro equipo revisará tus datos antes de habilitar la publicación."
            : "Solicitação de verificação enviada. Nossa equipe analisará seus dados antes de liberar a publicação.",
      });
    } catch (err) {
      setProfileFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : locale === "es-AR"
              ? "No se pudo enviar la solicitud de verificación."
              : "Não foi possível enviar a solicitação de verificação.",
      });
    } finally {
      setIsRequestingVerification(false);
    }
  };

  const handleSwitchToClient = async () => {
    setProfileFeedback(null);
    setIsSwitchingToClient(true);
    try {
      await switchOwnAccountToClient(locale);
      setAccountRole("client");
      setStatus("draft");
      setProProfileStatus("draft");
      setShowSwitchConfirm(false);
      setProfileFeedback({
        type: "success",
        message:
          locale === "es-AR"
            ? "Tu cuenta volvió a modo cliente y tu ficha profesional quedó oculta en borrador."
            : "Sua conta voltou para o modo cliente e sua ficha profissional foi despublicada (mantida em rascunho).",
      });
      router.push("/cliente");
      router.refresh();
    } catch (err) {
      setProfileFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : locale === "es-AR"
              ? "No se pudo cambiar la cuenta a cliente."
              : "Não foi possível converter a conta para cliente.",
      });
    } finally {
      setIsSwitchingToClient(false);
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

  const clearSelectedPortfolioPhoto = () => {
    if (selectedPhotoPreview) URL.revokeObjectURL(selectedPhotoPreview);
    setSelectedPhotoFile(null);
    setSelectedPhotoPreview(null);
    if (portfolioFileInputRef.current) {
      portfolioFileInputRef.current.value = "";
    }
  };

  const handleSelectPortfolioPhoto = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPhotoFeedback(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validatePortfolioPhotoFile(file, locale);
    if (!validation.valid) {
      clearSelectedPortfolioPhoto();
      setPhotoFeedback({ type: "error", message: validation.error });
      return;
    }

    if (selectedPhotoPreview) URL.revokeObjectURL(selectedPhotoPreview);
    setSelectedPhotoFile(file);
    setSelectedPhotoPreview(URL.createObjectURL(file));
  };

  const handleAddPhoto = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPhotoFeedback(null);
    if (!authUserId) return;

    if (!selectedPhotoFile) {
      setPhotoFeedback({
        type: "error",
        message:
          locale === "es-AR"
            ? "Seleccioná una imagen JPEG, PNG o WebP antes de guardar."
            : "Selecione uma imagem JPEG, PNG ou WebP antes de salvar.",
      });
      return;
    }

    setIsSavingPhoto(true);
    try {
      const created = await uploadOwnPortfolioPhoto({
        file: selectedPhotoFile,
        caption: newPhotoCaption,
        zoneLabel: newPhotoZone.trim() || city,
        workYear: new Date().getFullYear(),
        locale,
      });

      setPhotos((prev) => [created, ...prev]);
      clearSelectedPortfolioPhoto();
      setNewPhotoCaption("");
      setNewPhotoZone("");
      setPhotoFeedback({
        type: "success",
        message:
          locale === "es-AR"
            ? "Imagen del trabajo subida y guardada correctamente."
            : "Imagem do trabalho enviada e salva com sucesso.",
      });
    } catch (err) {
      setPhotoFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : locale === "es-AR"
              ? "No se pudo subir la imagen del trabajo."
              : "Não foi possível enviar a imagem do trabalho.",
      });
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photo: RealPortfolioPhoto) => {
    if (!authUserId) return;
    setPhotoFeedback(null);
    try {
      await deleteOwnPortfolioPhoto({
        photoId: photo.id,
        storagePath: photo.storagePath,
        locale,
      });
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      setPhotoFeedback({
        type: "success",
        message:
          locale === "es-AR"
            ? "Imagen eliminada de tu galería."
            : "Imagem removida da sua galeria.",
      });
    } catch (err) {
      setPhotoFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : locale === "es-AR"
              ? "No se pudo eliminar la imagen."
              : "Não foi possível remover a imagem.",
      });
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
            <div className="space-y-6">
              {/* Banner de estado de verificação / bloqueio */}
              <div
                className={`rounded-xl border p-4 text-xs ${
                  isBlocked
                    ? "border-[#E5A49B] bg-[#FDF2F0] text-[#9F2D20]"
                    : verificationStatus === "verified"
                      ? "border-[#A7D7C2] bg-[#EAF5F0] text-[#176041]"
                      : verificationStatus === "pending"
                        ? "border-[#F2C794] bg-[#FFF8EE] text-[#8A4A0A]"
                        : "border-[#DFD8CC] bg-[#F7F4EE] text-[#3D4249]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold">
                    {isBlocked ? (
                      <ShieldAlert className="h-4 w-4 shrink-0" />
                    ) : verificationStatus === "verified" ? (
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                    ) : verificationStatus === "pending" ? (
                      <Clock className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-[#B66A16]" />
                    )}
                    <span>
                      {isBlocked
                        ? locale === "es-AR"
                          ? "Perfil bloqueado / suspendido"
                          : "Perfil bloqueado / suspenso"
                        : verificationStatus === "verified"
                          ? locale === "es-AR"
                            ? "Verificación aprobada"
                            : "Verificação aprovada"
                          : verificationStatus === "pending"
                            ? locale === "es-AR"
                              ? "Verificación pendiente de revisión"
                              : "Verificação pendente de análise"
                            : locale === "es-AR"
                              ? "Perfil no verificado"
                              : "Perfil não verificado"}
                    </span>
                  </div>
                  <Badge
                    variant={
                      isBlocked
                        ? "graphite"
                        : verificationStatus === "verified"
                          ? "emerald"
                          : verificationStatus === "pending"
                            ? "orange"
                            : "cream"
                    }
                  >
                    {isBlocked
                      ? locale === "es-AR"
                        ? "Bloqueado"
                        : "Bloqueado"
                      : verificationStatus === "verified"
                        ? locale === "es-AR"
                          ? "Aprobado"
                          : "Aprovado"
                        : verificationStatus === "pending"
                          ? locale === "es-AR"
                            ? "Pendiente"
                            : "Pendente"
                          : locale === "es-AR"
                            ? "No verificado"
                            : "Não verificado"}
                  </Badge>
                </div>
                <p className="mt-1.5 leading-relaxed">
                  {isBlocked
                    ? locale === "es-AR"
                      ? "Tu cuenta o ficha profesional se encuentra suspendida. Las acciones de edición, verificación y cambio de rol están deshabilitadas."
                      : "Sua conta ou ficha profissional está suspensa. As ações de edição, verificação e troca de papel estão desabilitadas."
                    : verificationStatus === "verified"
                      ? needsPublication
                        ? locale === "es-AR"
                          ? "Tu verificación fue aprobada, pero tu ficha sigue en borrador (oculta en el directorio). Publicá ahora para aparecer en las búsquedas."
                          : "Sua verificação foi aprovada, mas seu perfil ainda está em rascunho (oculto no diretório). Publique agora para aparecer nas buscas."
                        : locale === "es-AR"
                          ? "Tu ficha está verificada y publicada en el directorio público."
                          : "Seu perfil está verificado e publicado no diretório público."
                      : verificationStatus === "pending"
                        ? locale === "es-AR"
                          ? "Recibimos tu solicitud de verificación. Mientras esté en análisis, tu ficha permanecerá en borrador."
                          : "Recebemos sua solicitação de verificação. Enquanto estiver em análise, seu perfil permanecerá em rascunho."
                        : locale === "es-AR"
                          ? "Guardá tu perfil en borrador y enviá tus datos de verificación abajo para poder publicarlo en el directorio."
                          : "Salve seu perfil em rascunho e envie seus dados de verificação abaixo para liberar a publicação no diretório."}
                </p>
                {needsPublication && (
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      isLoading={isSavingProfile}
                      onClick={() => void handleQuickPublish()}
                    >
                      {locale === "es-AR"
                        ? "Publicar perfil en el directorio ahora"
                        : "Publicar perfil no diretório agora"}
                    </Button>
                  </div>
                )}
              </div>

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
                    value={canPublish ? status : "draft"}
                    disabled={isBlocked}
                    onChange={(e) =>
                      setStatus(e.target.value as "draft" | "published")
                    }
                    className="rounded-lg border border-[#D4CCC0] bg-[#F7F4EE] px-3 py-1.5 text-xs font-bold text-[#24272B] disabled:opacity-60"
                  >
                    <option value="draft">
                      {locale === "es-AR"
                        ? "Borrador (Oculto en directorio)"
                        : "Rascunho (Oculto no diretório)"}
                    </option>
                    <option value="published" disabled={!canPublish}>
                      {locale === "es-AR"
                        ? canPublish
                          ? "Publicado (Visible en directorio)"
                          : "Publicado (Requiere verificación aprobada)"
                        : canPublish
                          ? "Publicado (Visível no diretório)"
                          : "Publicado (Exige verificação aprovada)"}
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

                <div className="sm:col-span-3">
                  <ProfileAvatarUploader
                    currentAvatarUrl={avatarUrl || null}
                    displayName={fullName || authEmail || "MP"}
                    locale={locale}
                    disabled={isBlocked}
                    onAvatarChange={(nextUrl) => {
                      setAvatarUrl(nextUrl ?? "");
                      updateProfileAvatar(nextUrl);
                    }}
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
                  disabled={isBlocked}
                  isLoading={isSavingProfile}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  {locale === "es-AR"
                    ? "Guardar perfil profesional"
                    : "Salvar perfil profissional"}
                </Button>
              </div>
            </form>

              {/* Solicitação de verificação profissional */}
              <div className="rounded-2xl border border-[#DFD8CC] bg-[#F7F4EE]/70 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-base font-bold text-[#24272B]">
                    <ShieldCheck className="h-4 w-4 text-[#F28C28]" />
                    <span>
                      {locale === "es-AR"
                        ? "Verificación profesional"
                        : "Verificação profissional"}
                    </span>
                  </h3>
                  <span className="text-xs font-semibold text-[#525860]">
                    {verificationStatus === "verified"
                      ? locale === "es-AR"
                        ? "Aprobada"
                        : "Aprovada"
                      : verificationStatus === "pending"
                        ? locale === "es-AR"
                          ? "En revisión"
                          : "Em análise"
                        : locale === "es-AR"
                          ? "No enviada"
                          : "Não enviada"}
                  </span>
                </div>

                {verificationStatus === "verified" ? (
                  <p className="mt-2 text-xs text-[#176041]">
                    {locale === "es-AR"
                      ? "Tu matrícula/documentación ya fue validada por el equipo de ManosPro."
                      : "Sua matrícula/documentação já foi validada pela equipe ManosPro."}
                  </p>
                ) : (
                  <form onSubmit={handleRequestVerification} className="mt-3 space-y-3">
                    <p className="text-xs text-[#525860]">
                      {locale === "es-AR"
                        ? "Informá tu matrícula, registro profesional o referencia verificable (mínimo 5 caracteres). Esta información solo es visible para vos y el equipo de revisión."
                        : "Informe sua matrícula, registro profissional ou referência verificável (mínimo 5 caracteres). Essa informação é visível apenas para você e a equipe de revisão."}
                    </p>
                    {savedVerificationNote && verificationStatus === "pending" && (
                      <p className="rounded-lg border border-[#E6DFD3] bg-white px-3 py-2 text-xs text-[#3D4249]">
                        <span className="font-bold">
                          {locale === "es-AR" ? "Último envío: " : "Último envio: "}
                        </span>
                        {savedVerificationNote}
                      </p>
                    )}
                    <textarea
                      rows={3}
                      value={verificationNoteInput}
                      disabled={isBlocked || !hasProfessionalProfile || accountRole !== "professional"}
                      onChange={(e) => setVerificationNoteInput(e.target.value)}
                      placeholder={
                        locale === "es-AR"
                          ? "Ej: Matrícula ENARGAS #12345 / Registro profesional y ciudad de emisión"
                          : "Ex: Registro CREA/CFT #12345 ou referência profissional verificável"
                      }
                      className="w-full rounded-xl border border-[#D4CCC0] bg-white p-3 text-sm disabled:opacity-60"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="submit"
                        variant="graphite"
                        size="sm"
                        disabled={isBlocked || !hasProfessionalProfile || accountRole !== "professional"}
                        isLoading={isRequestingVerification}
                        leftIcon={<ShieldCheck className="h-4 w-4" />}
                      >
                        {verificationStatus === "pending"
                          ? locale === "es-AR"
                            ? "Actualizar solicitud de verificación"
                            : "Atualizar solicitação de verificação"
                          : locale === "es-AR"
                            ? "Solicitar verificación profesional"
                            : "Solicitar verificação profissional"}
                      </Button>
                      {(!hasProfessionalProfile || accountRole !== "professional") && !isBlocked && (
                        <span className="text-xs text-[#666C75]">
                          {locale === "es-AR"
                            ? "Guardá primero tu perfil en borrador para habilitar esta opción."
                            : "Salve primeiro seu perfil em rascunho para habilitar esta opção."}
                        </span>
                      )}
                    </div>
                  </form>
                )}
              </div>

              {/* Transição de profissional para cliente */}
              {accountRole === "professional" && (
                <div className="rounded-2xl border border-[#DFD8CC] bg-white p-5">
                  <h3 className="flex items-center gap-2 text-base font-bold text-[#24272B]">
                    <UserMinus className="h-4 w-4 text-[#B93829]" />
                    <span>
                      {locale === "es-AR"
                        ? "Volver a cuenta de cliente"
                        : "Voltar para conta de cliente"}
                    </span>
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#525860]">
                    {locale === "es-AR"
                      ? "Tu ficha profesional será despublicada (se conserva el historial en borrador). Solo es posible si no tenés presupuestos ni servicios activos."
                      : "Sua ficha profissional será despublicada (o histórico é mantido em rascunho). Só é possível quando não há orçamentos ou serviços ativos."}
                  </p>

                  {!showSwitchConfirm ? (
                    <div className="mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isBlocked}
                        leftIcon={<UserMinus className="h-4 w-4" />}
                        onClick={() => setShowSwitchConfirm(true)}
                      >
                        {locale === "es-AR"
                          ? "Cambiar a cuenta de cliente"
                          : "Converter para conta de cliente"}
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#E5A49B] bg-[#FDF2F0] p-3">
                      <span className="text-xs font-semibold text-[#9F2D20]">
                        {locale === "es-AR"
                          ? "¿Confirmás volver a cuenta de cliente y ocultar tu ficha profesional?"
                          : "Confirma voltar para conta de cliente e despublicar sua ficha profissional?"}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          disabled={isBlocked}
                          isLoading={isSwitchingToClient}
                          onClick={() => void handleSwitchToClient()}
                        >
                          {locale === "es-AR" ? "Sí, cambiar ahora" : "Sim, converter agora"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isSwitchingToClient}
                          onClick={() => setShowSwitchConfirm(false)}
                        >
                          {locale === "es-AR" ? "Cancelar" : "Cancelar"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
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
                    ? "Subí fotos reales de tus trabajos desde tu dispositivo (JPEG, PNG o WebP, máximo 5 MB por imagen)."
                    : "Envie fotos reais dos seus trabalhos diretamente do seu dispositivo (JPEG, PNG ou WebP, máximo 5 MB por imagem)."}
                </p>
              </div>

              {photoFeedback && (
                <div
                  role={photoFeedback.type === "error" ? "alert" : "status"}
                  className={`rounded-xl border p-3.5 text-xs font-semibold ${
                    photoFeedback.type === "error"
                      ? "border-[#E5A49B] bg-[#FDF2F0] text-[#B93829]"
                      : "border-[#A7D7C2] bg-[#EAF5F0] text-[#176041]"
                  }`}
                >
                  {photoFeedback.message}
                </div>
              )}

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
                        loading="lazy"
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
                          onClick={() => void handleDeletePhoto(photo)}
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
                className="rounded-xl border border-[#DFD8CC] bg-[#F7F4EE]/50 p-4 space-y-4"
              >
                <h3 className="text-sm font-bold text-[#24272B]">
                  {locale === "es-AR"
                    ? "Subir imagen de trabajo"
                    : "Enviar imagem de trabalho"}
                </h3>

                <input
                  ref={portfolioFileInputRef}
                  id={portfolioFileInputId}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  onChange={handleSelectPortfolioPhoto}
                  disabled={isSavingPhoto || isBlocked}
                  className="sr-only"
                />

                {selectedPhotoPreview ? (
                  <div className="overflow-hidden rounded-xl border border-[#D8D0C2] bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedPhotoPreview}
                      alt={
                        locale === "es-AR"
                          ? "Vista previa de la imagen seleccionada"
                          : "Pré-visualização da imagem selecionada"
                      }
                      className="h-48 w-full object-cover"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-xs">
                      <span className="truncate font-medium text-[#3D4249]">
                        {selectedPhotoFile?.name}
                      </span>
                      <button
                        type="button"
                        disabled={isSavingPhoto}
                        onClick={() => {
                          clearSelectedPortfolioPhoto();
                          setPhotoFeedback(null);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#E5A49B] bg-[#FDF2F0] px-2.5 py-1 text-xs font-semibold text-[#9F2D20] hover:bg-[#FCE6E2] disabled:opacity-60"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>
                          {locale === "es-AR"
                            ? "Quitar imagen"
                            : "Remover imagem"}
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor={portfolioFileInputId}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#D4CCC0] bg-white px-4 py-6 text-center transition-colors hover:border-[#F28C28] hover:bg-[#FFF8EE] ${
                      isSavingPhoto || isBlocked ? "pointer-events-none opacity-60" : ""
                    }`}
                  >
                    <Upload className="h-6 w-6 text-[#C86D14]" aria-hidden="true" />
                    <span className="text-xs font-bold text-[#24272B]">
                      {locale === "es-AR"
                        ? "Seleccionar imagen desde el dispositivo"
                        : "Selecionar imagem do dispositivo"}
                    </span>
                    <span className="text-[11px] text-[#666C75]">
                      JPEG, PNG ou WebP · máx. 5 MB
                    </span>
                  </label>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={newPhotoCaption}
                    onChange={(e) => setNewPhotoCaption(e.target.value)}
                    placeholder={
                      locale === "es-AR"
                        ? "Descripción del trabajo"
                        : "Descrição do trabalho"
                    }
                    className="h-10 rounded-xl border border-[#D4CCC0] bg-white px-3 text-sm"
                    required
                  />
                  <input
                    type="text"
                    value={newPhotoZone}
                    onChange={(e) => setNewPhotoZone(e.target.value)}
                    placeholder={
                      locale === "es-AR" ? "Barrio / Ciudad" : "Bairro / Cidade"
                    }
                    className="h-10 rounded-xl border border-[#D4CCC0] bg-white px-3 text-sm"
                  />
                </div>
                <Button
                  type="submit"
                  variant="graphite"
                  size="sm"
                  disabled={!selectedPhotoFile || isBlocked}
                  isLoading={isSavingPhoto}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  {isSavingPhoto
                    ? locale === "es-AR"
                      ? "Subiendo imagen…"
                      : "Enviando imagem…"
                    : locale === "es-AR"
                      ? "Subir y guardar foto"
                      : "Enviar e salvar foto"}
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
