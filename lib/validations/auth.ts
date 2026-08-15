import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Veuillez entrer une adresse e-mail valide"),
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
      .min(1, "L'email est requis (obligatoire pour tous les rôles)")
      .email("Veuillez entrer une adresse e-mail valide"),
    phone: z
      .string()
      .min(8, "Le numéro de téléphone doit contenir au moins 8 chiffres")
      .regex(/^[+]?[0-9\s-]+$/, "Numéro de téléphone invalide")
      .optional()
      .or(z.literal("")),
    role: z.enum(["TENANT", "OWNER", "AGENCY", "tenant", "owner", "agency"], {
      errorMap: () => ({ message: "Veuillez sélectionner votre type de profil" }),
    }),
    agencyName: z
      .string()
      .max(150, "Le nom de l'agence est trop long")
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
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Vous devez accepter les Conditions Générales et la Politique de Confidentialité",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Veuillez entrer une adresse e-mail valide"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
      .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
    confirmPassword: z
      .string()
      .min(1, "Veuillez confirmer votre mot de passe"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type NewPasswordFormData = z.infer<typeof newPasswordSchema>;

