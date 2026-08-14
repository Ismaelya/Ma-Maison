import { describe, it, expect } from "vitest";
import { listingSchema, normalizeNigerPhone } from "@/lib/validations/listing";

describe("WhatsApp Number Validation & Normalization", () => {
  it("should accept valid 8-digit Niger phone number and normalize to +227", () => {
    const res = listingSchema.safeParse({
      title: "Superbe villa F4 au Plateau",
      description: "Superbe villa F4 entièrement meublée avec piscine et sécurité 24h/24.",
      propertyType: "VILLA",
      transactionType: "RENT",
      price: 250000,
      city: "Niamey",
      district: "Plateau",
      rooms: 4,
      bathrooms: 2,
      rentalPeriod: "MONTHLY",
      whatsappNumber: "96707116",
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.whatsappNumber).toBe("+22796707116");
    }
  });

  it("should accept international formatted number +22796707116", () => {
    const res = listingSchema.safeParse({
      title: "Superbe villa F4 au Plateau",
      description: "Superbe villa F4 entièrement meublée avec piscine et sécurité 24h/24.",
      propertyType: "VILLA",
      transactionType: "RENT",
      price: 250000,
      city: "Niamey",
      district: "Plateau",
      rooms: 4,
      bathrooms: 2,
      rentalPeriod: "MONTHLY",
      whatsappNumber: "+227 96 70 71 16",
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.whatsappNumber).toBe("+22796707116");
    }
  });

  it("should accept empty or missing whatsappNumber as undefined", () => {
    const res = listingSchema.safeParse({
      title: "Superbe villa F4 au Plateau",
      description: "Superbe villa F4 entièrement meublée avec piscine et sécurité 24h/24.",
      propertyType: "VILLA",
      transactionType: "RENT",
      price: 250000,
      city: "Niamey",
      district: "Plateau",
      rooms: 4,
      bathrooms: 2,
      rentalPeriod: "MONTHLY",
      whatsappNumber: "",
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.whatsappNumber).toBeUndefined();
    }
  });

  it("should reject invalid digit length for whatsappNumber", () => {
    const res = listingSchema.safeParse({
      title: "Superbe villa F4 au Plateau",
      description: "Superbe villa F4 entièrement meublée avec piscine et sécurité 24h/24.",
      propertyType: "VILLA",
      transactionType: "RENT",
      price: 250000,
      city: "Niamey",
      district: "Plateau",
      rooms: 4,
      bathrooms: 2,
      rentalPeriod: "MONTHLY",
      whatsappNumber: "12345",
    });

    expect(res.success).toBe(false);
  });

  it("normalizeNigerPhone helper test", () => {
    expect(normalizeNigerPhone("96707116")).toBe("+22796707116");
    expect(normalizeNigerPhone("+227 96 70 71 16")).toBe("+22796707116");
    expect(normalizeNigerPhone("")).toBeUndefined();
    expect(normalizeNigerPhone(null)).toBeUndefined();
  });
});
