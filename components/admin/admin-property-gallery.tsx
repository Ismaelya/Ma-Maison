"use client";

import { useState } from "react";
import { Camera, ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

type PropertyImageItem = {
  id?: string;
  url: string;
};

type AdminPropertyGalleryProps = {
  images: (string | PropertyImageItem)[];
  title?: string;
};

export function AdminPropertyGallery({ images, title }: AdminPropertyGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Normalize image URLs
  const formattedImages: string[] = (images || [])
    .map((img) => (typeof img === "string" ? img : img?.url))
    .filter((url): url is string => Boolean(url && url.length > 0));

  if (formattedImages.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800 text-neutral-500 mb-3">
          <Camera className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-neutral-400">Aucune photo fournie</p>
        <p className="text-xs text-neutral-500 mt-1">
          L&apos;annonceur n&apos;a pas ajouté d&apos;images lors de la soumission.
        </p>
      </div>
    );
  }

  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => (prev === 0 ? formattedImages.length - 1 : (prev as number) - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => (prev === formattedImages.length - 1 ? 0 : (prev as number) + 1));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary-400" />
          Photos du bien ({formattedImages.length})
        </h3>
        <span className="text-xs text-neutral-400">Cliquez sur une photo pour l&apos;agrandir</span>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {formattedImages.map((url, idx) => (
          <button
            key={`${url}-${idx}`}
            type="button"
            onClick={() => openLightbox(idx)}
            className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <img
              src={url}
              alt={`${title || "Photo"} ${idx + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30 flex items-center justify-center">
              <Maximize2 className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100 drop-shadow-md" />
            </div>
            {idx === 0 && (
              <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white uppercase backdrop-blur-sm">
                Principale
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {selectedIndex !== null && (
        <div
          onClick={closeLightbox}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-fade-in"
        >
          {/* Top Bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10">
            <span className="text-sm font-medium bg-neutral-900/80 px-3 py-1.5 rounded-full border border-neutral-800">
              Photo {selectedIndex + 1} sur {formattedImages.length}
            </span>
            <button
              onClick={closeLightbox}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900/80 text-white hover:bg-neutral-800 border border-neutral-800 transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Prev */}
          {formattedImages.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900/80 text-white hover:bg-neutral-800 border border-neutral-800 transition-colors z-10"
              aria-label="Photo précédente"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Image display */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-2xl border border-neutral-800 shadow-2xl"
          >
            <img
              src={formattedImages[selectedIndex]}
              alt={`${title || "Photo"} ${selectedIndex + 1}`}
              className="max-h-[85vh] max-w-[90vw] object-contain"
            />
          </div>

          {/* Navigation Next */}
          {formattedImages.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900/80 text-white hover:bg-neutral-800 border border-neutral-800 transition-colors z-10"
              aria-label="Photo suivante"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
