import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Veuillez entrer un email valide"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(100, "Le nom est trop long"),
    email: z
      .string()
      .min(1, "L'email est requis")
      .email("Veuillez entrer un email valide"),
    phone: z
      .string()
      .min(8, "Le numéro de téléphone doit contenir au moins 8 chiffres")
      .regex(/^[+]?[0-9\s-]+$/, "Numéro de téléphone invalide")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
      .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
    confirmPassword: z
      .string()
      .min(1, "Veuillez confirmer votre mot de passe"),
    role: z.enum(["tenant", "owner", "agency"], {
      errorMap: () => ({ message: "Veuillez sélectionner votre profil" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
