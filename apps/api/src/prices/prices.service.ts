import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { publicDatasetIsDemo } from '../common/config';
import { priceStatus } from './price-math';
import { HistoryQueryDto } from '../products/products.dto';

type DayRow = { day: string; price: Prisma.Decimal; retailer: string; bucketDays: number };
@Injectable()
export class PricesService {
  constructor(private readonly db: PrismaService) {}

  async history(product: { id: string; minimumPrice: string | null }, query: HistoryQueryDto) {
    const days = query.range === 'all' ? null : parseInt(query.range, 10);
    const rangeFilter =
      days === null
        ? Prisma.empty
        : Prisma.sql`AND (ps."checkedAt" AT TIME ZONE 'Asia/Bangkok')::date >= (now() AT TIME ZONE 'Asia/Bangkok')::date - ${days - 1}::int`;
    const base = Prisma.sql`FROM "PriceSnapshot" ps JOIN "ProductSource" s ON s.id=ps."productSourceId"
      JOIN "Retailer" r ON r.id=s."retailerId"
      WHERE s."productId"=${product.id}::uuid AND ps.status='SUCCESS' AND ps."inStock"=true AND ps.price>0
      AND ps."isDemo"=${publicDatasetIsDemo()} AND ps."checkedAt"<=now()`;
    const points = await this.db.$queryRaw<DayRow[]>(Prisma.sql`
      WITH daily AS (
        SELECT (ps."checkedAt" AT TIME ZONE 'Asia/Bangkok')::date AS day, MIN(ps.price) AS price,
        ${query.mode === 'retailers' ? Prisma.sql`r.slug` : Prisma.sql`'lowest'`} AS retailer
        ${base} ${rangeFilter} GROUP BY day, retailer
      ), bounds AS (SELECT GREATEST(1, CEIL((MAX(day)-MIN(day)+1)::numeric/365))::int AS step, MIN(day) AS first FROM daily)
      SELECT (b.first + ((d.day-b.first)/b.step)*b.step)::text AS day, MIN(d.price) AS price, d.retailer, b.step AS "bucketDays"
      FROM daily d CROSS JOIN bounds b GROUP BY 1,d.retailer,b.step ORDER BY 1, d.retailer`);
    const [summary] = await this.db.$queryRaw<
      {
        low: Prisma.Decimal | null;
        average: Prisma.Decimal | null;
        high: Prisma.Decimal | null;
        days: bigint;
      }[]
    >(Prisma.sql`
      SELECT MIN(price) AS low, AVG(price) AS average, MAX(price) AS high, count(*) AS days FROM (
        SELECT MIN(ps.price) AS price ${base} ${rangeFilter} GROUP BY (ps."checkedAt" AT TIME ZONE 'Asia/Bangkok')::date
      ) daily`);
    const [allTime] = await this.db.$queryRaw<{ price: Prisma.Decimal | null }[]>(
      Prisma.sql`SELECT MIN(ps.price) AS price ${base}`,
    );
    const statusRows = await this.db.$queryRaw<{ price: Prisma.Decimal }[]>(Prisma.sql`
      SELECT MIN(ps.price) AS price ${base}
      AND (ps."checkedAt" AT TIME ZONE 'Asia/Bangkok')::date >= (now() AT TIME ZONE 'Asia/Bangkok')::date - 90
      AND (ps."checkedAt" AT TIME ZONE 'Asia/Bangkok')::date < (now() AT TIME ZONE 'Asia/Bangkok')::date
      GROUP BY (ps."checkedAt" AT TIME ZONE 'Asia/Bangkok')::date`);
    return {
      range: query.range,
      mode: query.mode,
      timezone: 'Asia/Bangkok',
      isDemo: publicDatasetIsDemo(),
      bucketDays: points[0]?.bucketDays ?? 1,
      points: points.map((p) => ({ ...p, price: p.price.toFixed(2) })),
      summary: {
        low: summary.low?.toFixed(2) ?? null,
        average: summary.average?.toFixed(2) ?? null,
        high: summary.high?.toFixed(2) ?? null,
        days: Number(summary.days),
      },
      trackedLow: allTime.price?.toFixed(2) ?? null,
      priceStatus: priceStatus(
        product.minimumPrice ? Number(product.minimumPrice) : null,
        statusRows.map((r) => Number(r.price)),
      ),
      bucketNote:
        query.range === 'all'
          ? 'Daily minima; histories longer than 365 days are grouped into equal day buckets.'
          : 'Daily minimum valid in-stock prices.',
    };
  }

  async refreshReference(productId: string, isDemo: boolean) {
    const [result] = await this.db.$queryRaw<
      { average: Prisma.Decimal | null; days: bigint }[]
    >(Prisma.sql`
      SELECT AVG(price) AS average, count(*) AS days FROM (
        SELECT MIN(ps.price) AS price FROM "PriceSnapshot" ps JOIN "ProductSource" s ON s.id=ps."productSourceId"
        WHERE s."productId"=${productId}::uuid AND ps.status='SUCCESS' AND ps."inStock"=true AND ps.price>0 AND ps."isDemo"=${isDemo}
        AND (ps."checkedAt" AT TIME ZONE 'Asia/Bangkok')::date >= (now() AT TIME ZONE 'Asia/Bangkok')::date-7
        AND (ps."checkedAt" AT TIME ZONE 'Asia/Bangkok')::date < (now() AT TIME ZONE 'Asia/Bangkok')::date
        GROUP BY (ps."checkedAt" AT TIME ZONE 'Asia/Bangkok')::date
      ) daily`);
    await this.db.product.update({
      where: { id: productId },
      data: {
        referencePrice: result.average,
        historyDays: Number(result.days),
        referenceComputedAt: new Date(),
      },
    });
  }
}
