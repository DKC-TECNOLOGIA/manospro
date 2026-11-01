"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { ServiceCategory } from "@/types/domain";
import { useLocale } from "@/features/i18n/LocaleContext";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

const subscribeToMotionPreference = (callback: () => void) => {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};

const getReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const getServerMotionPreference = () => false;

export function MobileCategoryCarousel({ categories }: { categories: ServiceCategory[] }) {
  const { locale, tText } = useLocale();
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = useSyncExternalStore(
    subscribeToMotionPreference,
    getReducedMotion,
    getServerMotionPreference
  );

  const moveTo = (index: number) => {
    const nextIndex = (index + categories.length) % categories.length;
    const track = trackRef.current;
    const slide = track?.children[nextIndex] as HTMLElement | undefined;
    if (!track || !slide) return;
    setActiveIndex(nextIndex);
    track.scrollTo({
      left: slide.offsetLeft - track.offsetLeft,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const nextIndex = Math.round(track.scrollLeft / track.clientWidth);
    setActiveIndex(Math.min(categories.length - 1, Math.max(0, nextIndex)));
  };

  if (categories.length === 0) return null;

  return (
    <div role="region" aria-label={locale === "es-AR" ? "Carrusel de categorías" : "Carrossel de categorias"} aria-roledescription="carousel" className="sm:hidden">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            moveTo(activeIndex + 1);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            moveTo(activeIndex - 1);
          }
        }}
        tabIndex={0}
        aria-label={locale === "es-AR" ? "Categorías de servicios" : "Categorias de serviços"}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]"
        style={{ scrollBehavior: reducedMotion ? "auto" : "smooth", scrollbarWidth: "none" }}
      >
        {categories.map((category, index) => (
          <Link
            key={category.id}
            href={`/categorias/${category.slug}`}
            onFocus={() => setActiveIndex(index)}
            className="group relative flex min-h-[15.5rem] w-full shrink-0 snap-center flex-col justify-between overflow-hidden rounded-2xl border border-[#41685C] bg-[#183F35] p-5 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2"
            aria-roledescription="slide"
            aria-label={`${index + 1} de ${categories.length}: ${tText(category.name)}. ${tText(category.shortDescription)}`}
          >
            <span aria-hidden="true" className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#F28C28]/15 blur-2xl" />
            <span aria-hidden="true" className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
            <div className="relative flex items-start justify-between gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 text-[#FFB15C]">
                <CategoryIcon name={category.iconName} className="h-6 w-6" />
              </span>
              <ArrowUpRight className="mt-1 h-5 w-5 text-white/70 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </div>
            <div className="relative mt-6">
              <h3 className="text-xl font-extrabold leading-tight tracking-tight text-white">
                {tText(category.name)}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/80">
                {tText(category.shortDescription)}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5" role="group" aria-label={locale === "es-AR" ? "Elegir categoría" : "Escolher categoria"}>
          {categories.map((category, index) => (
            <button
              key={category.id}
              type="button"
              onClick={() => moveTo(index)}
              aria-label={`${locale === "es-AR" ? "Ver" : "Ver"} ${tText(category.name)}`}
              aria-current={index === activeIndex ? "true" : undefined}
              className={`h-2.5 rounded-full transition-[width,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] ${index === activeIndex ? "w-6 bg-[#F28C28]" : "w-2.5 bg-[#B9B4AA] hover:bg-[#777D80]"}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span aria-live="polite" className="min-w-10 text-center text-xs font-semibold tabular-nums text-[#565C64]">
            {activeIndex + 1} / {categories.length}
          </span>
          <button type="button" onClick={() => moveTo(activeIndex - 1)} aria-label={locale === "es-AR" ? "Categoría anterior" : "Categoria anterior"} className="grid h-9 w-9 place-items-center rounded-full border border-[#D8D0C2] bg-white text-[#24272B] transition hover:bg-[#EFEAE1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => moveTo(activeIndex + 1)} aria-label={locale === "es-AR" ? "Siguiente categoría" : "Próxima categoria"} className="grid h-9 w-9 place-items-center rounded-full border border-[#D8D0C2] bg-white text-[#24272B] transition hover:bg-[#EFEAE1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28]">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
