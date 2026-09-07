import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getConfig, publicDatasetIsDemo } from '../common/config';
import { AppError } from '../common/errors';
import { ProductsQueryDto } from './products.dto';
import { serializeOffers } from './offers';
import { priceChange } from '../prices/price-math';

@Injectable()
export class ProductsService {
  constructor(private readonly db: PrismaService) {}

  async list(query: ProductsQueryDto) {
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new AppError('INVALID_PRICE_RANGE', 'ราคาต่ำสุดต้องไม่เกินราคาสูงสุด');
    }
    const env = getConfig();
    const cutoff = new Date(Date.now() - env.SCRAPER_FRESHNESS_HOURS * 3600000);
    const referenceCutoff = new Date(Date.now() - 36 * 3600000);
    const conditions: Prisma.Sql[] = [
      Prisma.sql`p."isActive" = true`,
      Prisma.sql`p."isDemo" = ${publicDatasetIsDemo()}`,
    ];
    for (const word of query.q?.split(' ').filter(Boolean) ?? []) {
      // Escape LIKE wildcards; user text is a bound parameter, never SQL syntax.
      const token = `%${word.replace(/[\\%_]/g, '\\$&')}%`;
      conditions.push(
        Prisma.sql`(p.name ILIKE ${token} OR p.brand ILIKE ${token} OR p."modelNumber" ILIKE ${token})`,
      );
    }
    if (query.category) conditions.push(Prisma.sql`p.category::text = ${query.category}`);
    if (query.brand) conditions.push(Prisma.sql`lower(p.brand) = lower(${query.brand})`);
    if (query.retailer)
      conditions.push(
        Prisma.sql`EXISTS (SELECT 1 FROM "ProductSource" ss JOIN "Retailer" rr ON rr.id=ss."retailerId" WHERE ss."productId"=p.id AND ss."isActive" AND rr."isActive" AND ss."isDemo"=${publicDatasetIsDemo()} AND rr.slug=${query.retailer})`,
      );
    if (query.inStock) conditions.push(Prisma.sql`o.minimum IS NOT NULL`);
    if (query.minPrice !== undefined) conditions.push(Prisma.sql`o.minimum >= ${query.minPrice}`);
    if (query.maxPrice !== undefined) conditions.push(Prisma.sql`o.minimum <= ${query.maxPrice}`);
    const from = Prisma.sql`FROM "Product" p LEFT JOIN LATERAL (
      SELECT MIN(s."currentPrice") FILTER (WHERE s."inStock"=true AND s."lastSuccessAt">=${cutoff} AND s."currentPrice">0) AS minimum,
      MAX(s."lastSuccessAt") AS updated
      FROM "ProductSource" s JOIN "Retailer" r ON r.id=s."retailerId"
      WHERE s."productId"=p.id AND s."isActive" AND r."isActive" AND s."isDemo"=${publicDatasetIsDemo()}
    ) o ON true WHERE ${Prisma.join(conditions, ' AND ')}`;
    const order = {
      price_asc: Prisma.sql`o.minimum ASC NULLS LAST, p.name ASC`,
      price_drop: Prisma.sql`CASE WHEN p."historyDays">=7 AND p."referenceComputedAt">=${referenceCutoff} AND p."referencePrice">0 THEN (o.minimum-p."referencePrice")/p."referencePrice" END ASC NULLS LAST, p.name ASC`,
      updated: Prisma.sql`o.updated DESC NULLS LAST, p.name ASC`,
      name: Prisma.sql`p.name ASC`,
      popular: Prisma.sql`p."viewCount" DESC, p.name ASC`,
    }[query.sort];
    const [ids, counts] = await this.db.$transaction([
      this.db.$queryRaw<{ id: string }[]>(
        Prisma.sql`SELECT p.id ${from} ORDER BY ${order}, p.id LIMIT ${query.limit} OFFSET ${(query.page - 1) * query.limit}`,
      ),
      this.db.$queryRaw<{ total: bigint }[]>(Prisma.sql`SELECT count(*) AS total ${from}`),
    ]);
    const products = await this.db.product.findMany({
      where: { id: { in: ids.map((p) => p.id) } },
      include: {
        sources: { where: { isDemo: publicDatasetIsDemo() }, include: { retailer: true } },
      },
    });
    const data = ids.map(({ id }) => this.serialize(products.find((p) => p.id === id)!));
    const total = Number(counts[0].total);
    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
        isDemo: publicDatasetIsDemo(),
      },
    };
  }

  async find(slug: string) {
    const product = await this.db.product.findFirst({
      where: { slug, isActive: true, isDemo: publicDatasetIsDemo() },
      include: {
        sources: { where: { isDemo: publicDatasetIsDemo() }, include: { retailer: true } },
      },
    });
    if (!product) throw new AppError('PRODUCT_NOT_FOUND', 'ไม่พบสินค้านี้', 404);
    return {
      ...this.serialize(product),
      description: product.description,
      specs: product.specs,
      offers: serializeOffers(product.sources, getConfig().SCRAPER_FRESHNESS_HOURS),
    };
  }

  async recordView(slug: string) {
    const result = await this.db.product.updateMany({
      where: { slug, isActive: true, isDemo: publicDatasetIsDemo() },
      data: { viewCount: { increment: 1 } },
    });
    if (!result.count) throw new AppError('PRODUCT_NOT_FOUND', 'ไม่พบสินค้านี้', 404);
    return { recorded: true };
  }

  private serialize(
    product: Prisma.ProductGetPayload<{ include: { sources: { include: { retailer: true } } } }>,
  ) {
    const offers = serializeOffers(product.sources, getConfig().SCRAPER_FRESHNESS_HOURS);
    const best = offers.find((o) => o.isCheapest);
    const referenceValid =
      product.historyDays >= 7 &&
      product.referenceComputedAt &&
      product.referenceComputedAt.getTime() >= Date.now() - 36 * 3600000;
    const reference = referenceValid ? (product.referencePrice?.toFixed(2) ?? null) : null;
    const lastUpdated =
      offers
        .map((o) => o.lastSuccessAt)
        .filter((s): s is string => s !== null)
        .sort()
        .at(-1) ?? null;
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      category: product.category,
      modelNumber: product.modelNumber,
      isDemo: product.isDemo,
      minimumPrice: best?.price ?? null,
      cheapestRetailer: best?.retailer.name ?? null,
      retailerCount: offers.length,
      inStock: !!best,
      lastUpdated,
      referencePrice: reference,
      priceChange: priceChange(
        best?.price ? Number(best.price) : null,
        reference ? Number(reference) : null,
      ),
    };
  }
}
