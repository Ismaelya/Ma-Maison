import { describe, it, expect } from "vitest";
import { formatHeroProperties, type RawPropertyItem } from "@/lib/properties/hero-selection";

describe("Hero Carousel Property Selection & Fallback Logic", () => {
  it("uses featured properties directly if 4 or more are available", () => {
    const featured: RawPropertyItem[] = Array.from({ length: 5 }, (_, i) => ({
      id: `feat-${i + 1}`,
      title: `Villa Prestige ${i + 1}`,
      city: "Niamey",
      district: "Plateau",
      price: 500000,
      type: "VILLA",
      transactionType: "RENT",
      isFeatured: true,
      property_images: [{ url: `https://example.com/img-${i + 1}.jpg` }],
    }));

    const result = formatHeroProperties(featured, []);

    expect(result).toHaveLength(5);
    expect(result[0]!.id).toBe("feat-1");
    expect(result[0]!.imageUrl).toBe("https://example.com/img-1.jpg");
  });

  it("complements featured properties with recent approved properties if fewer than 4 featured exist", () => {
    const featured: RawPropertyItem[] = [
      {
        id: "feat-1",
        title: "Villa 1",
        city: "Niamey",
        price: 400000,
        type: "VILLA",
        property_images: [{ url: "https://example.com/feat-1.jpg" }],
      },
    ];

    const recent: RawPropertyItem[] = Array.from({ length: 5 }, (_, i) => ({
      id: `recent-${i + 1}`,
      title: `Appartement ${i + 1}`,
      city: "Zinder",
      price: 200000,
      type: "APARTMENT",
      property_images: [{ url: `https://example.com/recent-${i + 1}.jpg` }],
    }));

    const result = formatHeroProperties(featured, recent);

    expect(result.length).toBeGreaterThanOrEqual(4);
    expect(result.length).toBeLessThanOrEqual(6);
    expect(result[0]!.id).toBe("feat-1");
    expect(result[1]!.id).toBe("recent-1");
  });

  it("excludes properties without a real uploaded photo instead of falling back to a placeholder", () => {
    const featured: RawPropertyItem[] = [
      {
        id: "feat-no-img",
        title: "Terrain Plateau",
        city: "Niamey",
        price: 15000000,
        type: "LAND",
        property_images: [],
      },
      {
        id: "feat-with-img",
        title: "Villa Plateau",
        city: "Niamey",
        price: 20000000,
        type: "VILLA",
        property_images: [{ url: "https://example.com/feat-with-img.jpg" }],
      },
    ];

    const result = formatHeroProperties(featured, []);

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("feat-with-img");
    expect(result[0]!.imageUrl).toBe("https://example.com/feat-with-img.jpg");
  });

  it("skips recent complements that lack a photo when filling out the fallback selection", () => {
    const featured: RawPropertyItem[] = [
      {
        id: "feat-1",
        title: "Villa 1",
        city: "Niamey",
        price: 400000,
        type: "VILLA",
        property_images: [{ url: "https://example.com/feat-1.jpg" }],
      },
    ];

    const recent: RawPropertyItem[] = [
      { id: "recent-no-img", title: "Sans photo", city: "Zinder", price: 100000, type: "APARTMENT", property_images: [] },
      { id: "recent-1", title: "Appartement 1", city: "Zinder", price: 200000, type: "APARTMENT", property_images: [{ url: "https://example.com/recent-1.jpg" }] },
    ];

    const result = formatHeroProperties(featured, recent);

    expect(result.map((r) => r.id)).toEqual(["feat-1", "recent-1"]);
  });
});
