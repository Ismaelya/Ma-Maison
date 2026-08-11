import { z } from "zod";

/** Schéma objet "brut", sans la validation conditionnelle rentalPeriod/transactionType.
 * Exporté séparément car `.partial()` (utilisé pour les mises à jour PATCH) n'est
 * disponible que sur un ZodObject, pas sur le ZodEffects produit par superRefine/transform. */
export const listingObjectSchema = z
  .object({
    title: z
      .string()
      .min(5, "Le titre doit contenir au moins 5 caractères")
      .max(200, "Le titre est trop long"),
    description: z
      .string()
      .min(20, "La description doit contenir au moins 20 caractères")
      .max(5000, "La description est trop longue"),
    propertyType: z.enum(
      ["HOUSE", "APARTMENT", "ROOM", "VILLA", "OFFICE", "SHOP", "LAND", "RESIDENCE", "COMMERCIAL", "house", "apartment", "room", "villa", "office", "shop", "land", "residence", "commercial"],
      {
        errorMap: () => ({ message: "Veuillez sélectionner un type de bien" }),
      }
    ),
    transactionType: z.enum(["RENT", "SALE", "rent", "sale"], {
      errorMap: () => ({ message: "Veuillez sélectionner le type de transaction (Location ou Vente)" }),
    }),
    price: z.coerce
      .number({ invalid_type_error: "Le prix doit être un nombre" })
      .min(1000, "Le prix minimum est de 1 000 FCFA")
      .max(1_000_000_000, "Le prix est trop élevé"),
    city: z
      .string()
      .min(2, "La ville est requise"),
    district: z
      .string()
      .min(1, "Le quartier/district est requis"),
    address: z
      .string()
      .optional()
      .or(z.literal("")),
    rooms: z.coerce
      .number()
      .min(0, "Le nombre de pièces ne peut pas être négatif")
      .max(50, "Valeur trop élevée"),
    bathrooms: z.coerce
      .number()
      .min(0, "Le nombre de salles de bain ne peut pas être négatif")
      .max(50, "Valeur trop élevée"),
    surface: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? undefined : val),
      z.coerce
        .number({ invalid_type_error: "La superficie doit être un nombre" })
        .positive("La superficie doit être supérieure à 0")
        .max(100_000, "Valeur trop élevée")
        .optional()
    ),
    furnished: z.boolean().optional().default(false),
    rentalPeriod: z
      .enum(["DAILY", "MONTHLY", "YEARLY", "daily", "monthly", "yearly"])
      .optional(),
    images: z.array(z.string()).default([]),
  });

/** Schéma complet pour la création (POST) : impose rentalPeriod si RENT, et
 * l'ignore (le retire) si SALE, même s'il a été envoyé par erreur. */
export const listingSchema = listingObjectSchema
  .superRefine((data, ctx) => {
    const isRent = String(data.transactionType).toUpperCase() === "RENT";
    if (isRent && !data.rentalPeriod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Veuillez sélectionner une période de location",
        path: ["rentalPeriod"],
      });
    }
  })
  .transform((data) => {
    const isRent = String(data.transactionType).toUpperCase() === "RENT";
    return { ...data, rentalPeriod: isRent ? data.rentalPeriod : undefined };
  });

export type ListingFormData = z.infer<typeof listingSchema>;

export const AMENITIES_OPTIONS = [
  "Climatisation",
  "Ventilateur",
  "Eau courante",
  "Électricité",
  "Groupe électrogène",
  "Panneau solaire",
  "Internet / WiFi",
  "Parking",
  "Garage",
  "Jardin",
  "Terrasse",
  "Balcon",
  "Cuisine équipée",
  "Gardien",
  "Piscine",
  "Meublé",
] as const;

export const NIGER_CITIES = [
  "Niamey",
  "Zinder",
  "Maradi",
  "Tahoua",
  "Agadez",
  "Dosso",
  "Diffa",
  "Tillabéri",
  "Arlit",
  "Birni N'Konni",
  "Tessaoua",
  "Gaya",
  "Mirriah",
  "Dogondoutchi",
  "Konni",
  "Kollo",
  "Say",
  "Tera",
] as const;
