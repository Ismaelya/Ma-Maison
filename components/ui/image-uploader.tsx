"use client";

import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadPropertyImage } from "@/lib/supabase/storage";

type ImageUploaderProps = {
  maxFiles?: number;
  maxSizeMB?: number;
  bucketName?: string;
  onUpload?: (file: File) => Promise<string>;
  onImagesChange?: (urls: string[]) => void;
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
  maxFiles = 10,
  maxSizeMB = 5,
  bucketName = "property-images",
  onUpload,
  onImagesChange,
  onImagesCompressed,
  className,
}: ImageUploaderProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
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

    setIsUploading(true);

    try {
      const compressedList: File[] = [];
      const newPreviews: string[] = [];
      const newUrls: string[] = [];

      const uploader = onUpload ?? ((file: File) => uploadPropertyImage(file, bucketName));

      for (const f of fileList) {
        const compressed = await compressImageToWebP(f);
        compressedList.push(compressed);
        newPreviews.push(URL.createObjectURL(compressed));

        // Upload using passed handler or default Supabase Storage service
        const publicUrl = await uploader(compressed);
        newUrls.push(publicUrl);
      }

      const updatedFiles = [...files, ...compressedList];
      const updatedPreviews = [...previews, ...newPreviews];
      const updatedUrls = [...uploadedUrls, ...newUrls];

      setFiles(updatedFiles);
      setPreviews(updatedPreviews);
      setUploadedUrls(updatedUrls);

      if (onImagesChange) {
        onImagesChange(updatedUrls);
      }

      if (onImagesCompressed) {
        onImagesCompressed(updatedFiles);
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'optimisation ou du téléversement des images.");
    } finally {
      setIsUploading(false);
    }
  }

  function removeImage(index: number) {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    const updatedUrls = uploadedUrls.filter((_, i) => i !== index);

    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
    setUploadedUrls(updatedUrls);

    if (onImagesChange) {
      onImagesChange(updatedUrls);
    }

    if (onImagesCompressed) {
      onImagesCompressed(updatedFiles);
    }
  }

  return (
    <div className={className}>
      {error && (
        <div className="mb-4 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-3 text-xs text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {/* Image Preview Grid */}
      {previews.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {previews.map((src, index) => (
            <div
              key={index}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]"
            >
              <img src={src} alt={`Aperçu ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-[var(--color-danger)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File Dropzone */}
      {files.length < maxFiles && (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-[var(--color-muted)]/50 p-6 text-center transition-colors hover:border-[var(--color-primary-text)] hover:bg-[var(--color-primary)]/10">
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-[var(--color-primary-text)]">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-xs font-semibold">Optimisation WebP et téléversement en cours...</span>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-neutral-400" />
              <p className="mt-2 text-sm font-semibold text-neutral-700">
                Ajouter des photos ({files.length}/{maxFiles})
              </p>
              <p className="mt-1 text-xs text-neutral-400">
                JPG, PNG, WEBP (compression automatique WebP & Storage Supabase)
              </p>
            </>
          )}

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={isUploading}
            onChange={(e) => e.target.files && handleFileSelection(e.target.files)}
            className="sr-only"
          />
        </label>
      )}
    </div>
  );
}
