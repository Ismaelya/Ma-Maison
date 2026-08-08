export interface RawPropertyItem {
  id: string;
  title: string;
  city: string;
  district?: string | null;
  price: number;
  type: string;
  transactionType?: string | null;
  isFeatured?: boolean;
  createdAt?: string;
  property_images?: { url: string }[] | null;
}

export interface HeroFeaturedItem {
  id: string;
  title: string;
  city: string;
  district: string;
  price: number;
  type: string;
  transactionType: string;
  imageUrl: string;
}

function hasPhoto(p: RawPropertyItem): boolean {
  return Array.isArray(p.property_images) && p.property_images.length > 0 && !!p.property_images[0]?.url;
}

/**
 * Combine featured properties with recent approved properties as a graceful fallback,
 * ensuring between 4 and 6 items are available for the Hero Banner carousel when possible.
 * Only properties with a real uploaded photo are eligible — the hero never falls back to
 * a stock/placeholder image, so photo-less listings are simply excluded from the selection.
 */
export function formatHeroProperties(
  featured: RawPropertyItem[] = [],
  recent: RawPropertyItem[] = []
): HeroFeaturedItem[] {
  let combined = featured.filter(hasPhoto);

  if (combined.length < 4 && recent.length > 0) {
    const existingIds = new Set(combined.map((p) => p.id));
    const complement = recent.filter((p) => hasPhoto(p) && !existingIds.has(p.id));
    combined = [...combined, ...complement];
  }

  // Cap at maximum 6 items
  const finalSelection = combined.slice(0, 6);

  return finalSelection.map((p) => ({
    id: p.id,
    title: p.title,
    city: p.city,
    district: p.district || p.city,
    price: p.price,
    type: p.type,
    transactionType: p.transactionType || "RENT",
    imageUrl: p.property_images![0]!.url,
  }));
}
