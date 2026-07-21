"use client";

import { useState } from "react";
import { Upload, X, FileImage, Loader2 } from "lucide-react";

type ImageUploaderProps = {
  maxFiles?: number;
  maxSizeMB?: number;
  onImagesCompressed?: (files: File[]) => void;
  className?: string;
};

/**
 * Compresses an image file in the browser using HTML5 Canvas.
 * Resizes max dimension to 1600px and converts to WebP @ 80% quality.
 * Reduces raw mobile upload payload by 70-90%!
 */
async function compressImageToWebP(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;
      const MAX_DIM = 1600;

      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file); // Fallback if canvas context fails
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const compressedName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
          const compressedFile = new File([blob], compressedName, {
            type: "image/webp",
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        "image/webp",
        0.8
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Erreur de chargement de l'image"));
    };

    img.src = url;
  });
}

export function ImageUploader({
  maxFiles = 5,
  maxSizeMB = 5,
  onImagesCompressed,
  className,
}: ImageUploaderProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileSelection(selectedFiles: FileList | File[]) {
    setError(null);
    const fileList = Array.from(selectedFiles);

    if (files.length + fileList.length > maxFiles) {
      setError(`Vous ne pouvez pas ajouter plus de ${maxFiles} images.`);
      return;
    }

    // Validate size before compression
    for (const f of fileList) {
      if (f.size > maxSizeMB * 1024 * 1024) {
        setError(`Le fichier "${f.name}" dépasse la taille maximale de ${maxSizeMB} Mo.`);
        return;
      }
      if (!f.type.startsWith("image/")) {
        setError(`Le fichier "${f.name}" n'est pas une image valide.`);
        return;
      }
    }

    setIsCompressing(true);

    try {
      const compressedList: File[] = [];
      const newPreviews: string[] = [];

      for (const f of fileList) {
        const compressed = await compressImageToWebP(f);
        compressedList.push(compressed);
        newPreviews.push(URL.createObjectURL(compressed));
      }

      const updatedFiles = [...files, ...compressedList];
      const updatedPreviews = [...previews, ...newPreviews];

      setFiles(updatedFiles);
      setPreviews(updatedPreviews);

      if (onImagesCompressed) {
        onImagesCompressed(updatedFiles);
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de la compression des images.");
    } finally {
      setIsCompressing(false);
    }
  }

  function removeImage(index: number) {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setPreviews(updatedPreviews);

    if (onImagesCompressed) {
      onImagesCompressed(updatedFiles);
    }
  }

  return (
    <div className={className}>
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Image Preview Grid */}
      {previews.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {previews.map((src, index) => (
            <div
              key={index}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--border)] bg-neutral-100"
            >
              <img src={src} alt={`Aperçu ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File Dropzone */}
      {files.length < maxFiles && (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-6 text-center transition-colors hover:border-primary-400 hover:bg-primary-50/30">
          {isCompressing ? (
            <div className="flex flex-col items-center gap-2 text-primary-600">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-xs font-semibold">Optimization WebP en cours...</span>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-neutral-400" />
              <p className="mt-2 text-sm font-semibold text-neutral-700">
                Ajouter des photos ({files.length}/{maxFiles})
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                JPG, PNG, WEBP (compression automatique WebP)
              </p>
            </>
          )}

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={isCompressing}
            onChange={(e) => e.target.files && handleFileSelection(e.target.files)}
            className="sr-only"
          />
        </label>
      )}
    </div>
  );
}
