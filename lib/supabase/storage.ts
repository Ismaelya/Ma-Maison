import { createClient } from "@/lib/supabase/client";

/**
 * Uploads a compressed image file (e.g. WebP) to a Supabase Storage bucket.
 * Returns the public URL of the uploaded image.
 */
export async function uploadPropertyImage(
  file: File,
  bucketName: string = "property-images"
): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilisateur non authentifié pour le téléversement d'image.");
  }

  const fileExt = file.name.split(".").pop() || "webp";
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `${user.id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      contentType: file.type || "image/webp",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Erreur lors du téléversement vers Supabase Storage: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new Error("Impossible d'obtenir l'URL publique de l'image téléversée.");
  }

  return publicUrlData.publicUrl;
}
