import { z } from "zod";

export const profileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom est trop long"),
  phone: z
    .string()
    .min(8, "Le numéro de téléphone doit contenir au moins 8 chiffres")
    .regex(/^[+]?[0-9\s-]+$/, "Numéro de téléphone invalide")
    .optional()
    .or(z.literal("")),
  avatarUrl: z.string().optional().or(z.literal("")),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
