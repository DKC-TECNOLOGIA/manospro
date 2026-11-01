"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ServiceCategory } from "@/types/domain";
import { useLocale } from "@/features/i18n/LocaleContext";
import { CategoryCard } from "./CategoryCard";

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
    const slide = track.querySelector<HTMLElement>("[data-category-slide]");
    const slideWidth = slide?.getBoundingClientRect().width ?? track.clientWidth;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    const nextIndex = Math.round(track.scrollLeft / (slideWidth + gap));
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
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] [&::-webkit-scrollbar]:hidden"
        style={{ scrollBehavior: reducedMotion ? "auto" : "smooth", scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {categories.map((category, index) => (
          <div
            key={category.id}
            data-category-slide
            onFocusCapture={() => setActiveIndex(index)}
            className="w-full min-w-0 shrink-0 snap-start"
            aria-roledescription="slide"
            aria-label={`${index + 1} de ${categories.length}`}
          >
            <CategoryCard category={category} />
          </div>
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
