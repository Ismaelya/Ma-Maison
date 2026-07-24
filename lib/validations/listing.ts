import { z } from "zod";

export const listingSchema = z.object({
  title: z
    .string()
    .min(5, "Le titre doit contenir au moins 5 caractères")
    .max(200, "Le titre est trop long"),
  description: z
    .string()
    .min(20, "La description doit contenir au moins 20 caractères")
    .max(5000, "La description est trop longue"),
  propertyType: z.enum(
    ["HOUSE", "APARTMENT", "ROOM", "VILLA", "OFFICE", "SHOP", "LAND", "COMMERCIAL", "house", "apartment", "room", "villa", "office", "shop", "land", "commercial"],
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
  surface: z.coerce
    .number()
    .min(1, "La superficie doit être supérieure à 0")
    .max(100_000, "Valeur trop élevée")
    .optional()
    .nullable(),
  images: z.array(z.string().url()).optional().default([]),
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
