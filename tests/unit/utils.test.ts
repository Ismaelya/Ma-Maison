import { describe, it, expect } from "vitest";
import { getTrialDaysRemaining, formatPrice, getPropertyTypeLabel, getTransactionTypeLabel, truncate, formatRelativeTime } from "@/lib/utils";

describe("getTrialDaysRemaining", () => {
  it("returns 30 for a trial that just started", () => {
    const now = new Date();
    const result = getTrialDaysRemaining(now.toISOString());
    expect(result).toBe(30);
  });

  it("returns 0 for a trial that started 31 days ago", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 31);
    const result = getTrialDaysRemaining(pastDate.toISOString());
    expect(result).toBe(0);
  });

  it("returns 0 for null trial_started_at", () => {
    const result = getTrialDaysRemaining(null);
    expect(result).toBe(0);
  });

  it("returns correct remaining days for a 15-day-old trial", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 15);
    const result = getTrialDaysRemaining(pastDate.toISOString());
    expect(result).toBe(15);
  });

  it("returns 0 and never goes negative", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 100);
    const result = getTrialDaysRemaining(pastDate.toISOString());
    expect(result).toBe(0);
  });
});

describe("formatPrice", () => {
  it("formats prices with FCFA suffix", () => {
    const result = formatPrice(150000);
    expect(result).toContain("FCFA");
    expect(result).toContain("150");
  });

  it("formats small prices", () => {
    const result = formatPrice(1500);
    expect(result).toContain("1");
    expect(result).toContain("500");
    expect(result).toContain("FCFA");
  });

  it("formats zero", () => {
    const result = formatPrice(0);
    expect(result).toContain("0");
    expect(result).toContain("FCFA");
  });
});

describe("getPropertyTypeLabel", () => {
  it("maps apartment correctly", () => {
    expect(getPropertyTypeLabel("apartment")).toBe("Appartement");
  });

  it("maps house correctly", () => {
    expect(getPropertyTypeLabel("house")).toBe("Maison");
  });

  it("maps studio correctly", () => {
    expect(getPropertyTypeLabel("studio")).toBe("Studio");
  });

  it("maps land correctly", () => {
    expect(getPropertyTypeLabel("land")).toBe("Terrain");
  });

  it("maps commercial correctly", () => {
    expect(getPropertyTypeLabel("commercial")).toBe("Local commercial");
  });

  it("returns unknown types as-is", () => {
    expect(getPropertyTypeLabel("unknown")).toBe("unknown");
  });
});

describe("getTransactionTypeLabel", () => {
  it("maps rent correctly", () => {
    expect(getTransactionTypeLabel("RENT")).toBe("Location");
    expect(getTransactionTypeLabel("rent")).toBe("Location");
  });

  it("maps sale correctly", () => {
    expect(getTransactionTypeLabel("SALE")).toBe("Vente");
    expect(getTransactionTypeLabel("sale")).toBe("Vente");
  });
});

describe("truncate", () => {
  it("does not truncate short text", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates long text with ellipsis", () => {
    const result = truncate("This is a very long text that should be truncated", 20);
    expect(result.length).toBeLessThanOrEqual(21); // 20 + ellipsis
    expect(result).toContain("…");
  });
});
