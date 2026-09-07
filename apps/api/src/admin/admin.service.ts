import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppError } from '../common/errors';
import { Prisma } from '../generated/prisma/client';
import { validateRetailerUrl } from '../scraper/url-safety';
import {
  AdminListDto,
  CreateProductDto,
  CreateSourceDto,
  UpdateProductDto,
  UpdateSourceDto,
} from './admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly db: PrismaService) {}
  async dashboard() {
    const [products, activeSources, snapshots, lastScrape, totals] = await Promise.all([
      this.db.product.count(),
      this.db.productSource.count({ where: { isActive: true, isDemo: false } }),
      this.db.priceSnapshot.count(),
      this.db.scrapeJob.findFirst({ orderBy: { createdAt: 'desc' } }),
      this.db.scrapeJob.aggregate({ _sum: { successCount: true, failureCount: true } }),
    ]);
    const success = totals._sum.successCount ?? 0;
    const failed = totals._sum.failureCount ?? 0;
    return {
      products,
      activeSources,
      snapshots,
      failedScrapes: failed,
      successRate: success + failed ? Math.round((success / (success + failed)) * 100) : null,
      lastScrape,
    };
  }
  async products(query: AdminListDto) {
    const where: Prisma.ProductWhereInput = query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' } },
            { slug: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {};
    const [data, total] = await this.db.$transaction([
      this.db.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.db.product.count({ where }),
    ]);
    return { data, meta: { ...query, total, totalPages: Math.ceil(total / query.limit) } };
  }
  async product(id: string) {
    const product = await this.db.product.findUnique({
      where: { id },
      include: { sources: { include: { retailer: true } } },
    });
    if (!product) throw new AppError('PRODUCT_NOT_FOUND', 'ไม่พบสินค้า', 404);
    return product;
  }
  createProduct(data: CreateProductDto) {
    return this.db.product.create({ data });
  }
  updateProduct(id: string, data: UpdateProductDto) {
    return this.db.product.update({ where: { id }, data });
  }
  async sources(query: AdminListDto) {
    const where: Prisma.ProductSourceWhereInput = query.q
      ? { product: { name: { contains: query.q, mode: 'insensitive' } } }
      : {};
    const [data, total] = await this.db.$transaction([
      this.db.productSource.findMany({
        where,
        include: {
          product: { select: { id: true, name: true } },
          retailer: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: (query.page - 1) * query.limit,
      }),
      this.db.productSource.count({ where }),
    ]);
    return { data, meta: { ...query, total, totalPages: Math.ceil(total / query.limit) } };
  }
  async createSource(data: CreateSourceDto) {
    const [product, retailer] = await Promise.all([
      this.db.product.findUnique({ where: { id: data.productId } }),
      this.db.retailer.findUnique({ where: { id: data.retailerId } }),
    ]);
    if (!product || !retailer)
      throw new AppError('SOURCE_NOT_FOUND', 'ไม่พบสินค้าหรือร้านค้า', 404);
    if (product.isDemo)
      throw new AppError('DEMO_SOURCE_READ_ONLY', 'กรุณาสร้างสินค้าจริงแยกจากข้อมูลตัวอย่าง');
    validateRetailerUrl(data.url, retailer.slug);
    if (
      await this.db.productSource.findUnique({
        where: { productId_retailerId: { productId: data.productId, retailerId: data.retailerId } },
      })
    )
      throw new AppError('DUPLICATE_SOURCE', 'สินค้านี้มี Source ของร้านค้านี้แล้ว', 409);
    return this.db.productSource.create({ data });
  }
  async updateSource(id: string, data: UpdateSourceDto) {
    const source = await this.db.productSource.findUnique({
      where: { id },
      include: { retailer: true },
    });
    if (!source) throw new AppError('SOURCE_NOT_FOUND', 'ไม่พบ Source', 404);
    if (source.isDemo)
      throw new AppError(
        'DEMO_SOURCE_READ_ONLY',
        'ข้อมูล Source ตัวอย่างไม่สามารถแก้ไขเป็นข้อมูลจริง',
      );
    if (data.url) validateRetailerUrl(data.url, source.retailer.slug);
    return this.db.productSource.update({
      where: { id },
      data: {
        ...data,
        // A changed mapping must not inherit the old listing's current price.
        ...(data.url && data.url !== source.url
          ? {
              currentPrice: null,
              regularPrice: null,
              inStock: null,
              lastSuccessAt: null,
              lastCheckedAt: null,
              lastError: null,
            }
          : {}),
      },
    });
  }
}
