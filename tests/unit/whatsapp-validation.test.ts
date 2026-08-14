import { describe, it, expect } from "vitest";
import { listingSchema, normalizeWhatsAppNumber } from "@/lib/validations/listing";

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

  it("should accept French international phone number +33612345678", () => {
    const res = listingSchema.safeParse({
      title: "Appartement de standing à Niamey par proprio français",
      description: "Superbe appartement entièrement meublé, bailleur joignable sur WhatsApp France.",
      propertyType: "APARTMENT",
      transactionType: "RENT",
      price: 350000,
      city: "Niamey",
      district: "Koubia",
      rooms: 3,
      bathrooms: 1,
      rentalPeriod: "MONTHLY",
      whatsappNumber: "+33 6 12 34 56 78",
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.whatsappNumber).toBe("+33612345678");
    }
  });

  it("should accept Ivorian international phone number +22507000000", () => {
    const res = listingSchema.safeParse({
      title: "Villa F5 quartier Chic",
      description: "Belle résidence sécurisée pour diplomate ou expat.",
      propertyType: "VILLA",
      transactionType: "RENT",
      price: 500000,
      city: "Niamey",
      district: "Harobanda",
      rooms: 5,
      bathrooms: 3,
      rentalPeriod: "MONTHLY",
      whatsappNumber: "+22507000000",
    });

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.whatsappNumber).toBe("+22507000000");
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

  it("normalizeWhatsAppNumber helper test", () => {
    expect(normalizeWhatsAppNumber("96707116")).toBe("+22796707116");
    expect(normalizeWhatsAppNumber("+227 96 70 71 16")).toBe("+22796707116");
    expect(normalizeWhatsAppNumber("+33 6 12 34 56 78")).toBe("+33612345678");
    expect(normalizeWhatsAppNumber("+22507000000")).toBe("+22507000000");
    expect(normalizeWhatsAppNumber("")).toBeUndefined();
    expect(normalizeWhatsAppNumber(null)).toBeUndefined();
  });
});
