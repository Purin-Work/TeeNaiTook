import type { Prisma } from '../generated/prisma/client';

export type SourceWithRetailer = Prisma.ProductSourceGetPayload<{ include: { retailer: true } }>;
export function serializeOffers(
  sources: SourceWithRetailer[],
  freshnessHours: number,
  now = new Date(),
) {
  const offers = sources
    .filter((s) => s.isActive && s.retailer.isActive)
    .map((s) => {
      const isStale =
        !s.lastSuccessAt || now.getTime() - s.lastSuccessAt.getTime() > freshnessHours * 3600000;
      return {
        id: s.id,
        retailer: { name: s.retailer.name, slug: s.retailer.slug },
        // Demo placeholders are deliberately never actionable retailer product links.
        url: s.isDemo ? null : s.url,
        price: s.currentPrice?.toFixed(2) ?? null,
        regularPrice: s.regularPrice?.toFixed(2) ?? null,
        inStock: s.inStock,
        isStale,
        isDemo: s.isDemo,
        lastCheckedAt: s.lastCheckedAt?.toISOString() ?? null,
        lastSuccessAt: s.lastSuccessAt?.toISOString() ?? null,
        isCheapest: false,
      };
    });
  offers.sort(
    (a, b) =>
      Number(b.inStock === true) - Number(a.inStock === true) ||
      Number(a.isStale) - Number(b.isStale) ||
      (a.price === null ? Infinity : Number(a.price)) -
        (b.price === null ? Infinity : Number(b.price)),
  );
  const eligible = offers.filter(
    (o) => o.inStock === true && !o.isStale && o.price !== null && Number(o.price) > 0,
  );
  const minimum = eligible.length ? Math.min(...eligible.map((o) => Number(o.price))) : null;
  offers.forEach((o) => {
    o.isCheapest = eligible.includes(o) && Number(o.price) === minimum;
  });
  return offers;
}
