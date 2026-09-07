import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { setTimeout as delay } from 'node:timers/promises';
import { PrismaService } from '../prisma/prisma.service';
import { ScraperService } from '../scraper/scraper.service';
import { PricesService } from '../prices/prices.service';
import { AppError } from '../common/errors';
import { getConfig } from '../common/config';
import { PaginationDto } from '../products/products.dto';
import { Prisma, TriggerType } from '../generated/prisma/client';

@Injectable()
export class JobsService {
  private readonly logger = new Logger('ScrapeJobs');
  constructor(
    private readonly db: PrismaService,
    private readonly scraper: ScraperService,
    private readonly prices: PricesService,
  ) {}

  @Cron('0 0 */6 * * *', { timeZone: 'UTC', waitForCompletion: true })
  async scheduled() {
    if (!getConfig().SCRAPER_ENABLED || getConfig().DEMO_MODE) return;
    try {
      await this.trigger('SCHEDULED');
    } catch (error) {
      this.logger.warn(
        JSON.stringify({ event: 'schedule_skipped', code: this.errorMessage(error).code }),
      );
    }
  }

  async trigger(trigger: TriggerType, sourceId?: string) {
    const sourceWhere: Prisma.ProductSourceWhereInput = {
      isActive: true,
      isDemo: false,
      product: { isActive: true, isDemo: false },
      retailer: { isActive: true },
      ...(sourceId ? { id: sourceId } : {}),
    };
    if (sourceId && !(await this.db.productSource.findFirst({ where: sourceWhere })))
      throw new AppError('SOURCE_NOT_FOUND', 'ไม่พบ Source จริงที่เปิดใช้งาน', 404);
    const totalSources = await this.db.productSource.count({ where: sourceWhere });
    let job;
    try {
      job = await this.db.$transaction(async (tx) => {
        // Recover leases from crashed workers. A partial unique index arbitrates across instances.
        await tx.scrapeJob.updateMany({
          where: {
            status: { in: ['PENDING', 'RUNNING'] },
            heartbeatAt: { lt: new Date(Date.now() - 300000) },
          },
          data: { status: 'FAILED', finishedAt: new Date() },
        });
        return tx.scrapeJob.create({
          data: { triggerType: trigger, status: 'PENDING', totalSources, heartbeatAt: new Date() },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new AppError('SCRAPE_ALREADY_RUNNING', 'มีงานดึงราคากำลังทำงานอยู่', 409);
      throw error;
    }
    setImmediate(() => {
      void this.execute(job.id, sourceWhere).catch(() =>
        this.logger.error(JSON.stringify({ event: 'job_worker_failed', jobId: job.id })),
      );
    });
    return job;
  }

  private async execute(jobId: string, where: Prisma.ProductSourceWhereInput) {
    const started = Date.now();
    await this.db.scrapeJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt: new Date(), heartbeatAt: new Date() },
    });
    this.logger.log(JSON.stringify({ event: 'job_started', jobId }));
    let successCount = 0;
    let failureCount = 0;
    try {
      let cursor: string | undefined;
      while (true) {
        const sources = await this.db.productSource.findMany({
          where,
          include: { retailer: true },
          orderBy: { id: 'asc' },
          take: 50,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });
        if (!sources.length) break;
        for (const source of sources) {
          const lease = await this.db.scrapeJob.updateMany({
            where: { id: jobId, status: 'RUNNING' },
            data: { heartbeatAt: new Date() },
          });
          if (!lease.count) return;
          const start = Date.now();
          try {
            const result = await this.scraper.scrape(source.url, source.retailer.slug);
            const complete = result.price !== null && result.inStock !== null;
            await this.db.$transaction(async (tx) => {
              const lease = await tx.scrapeJob.updateMany({
                where: { id: jobId, status: 'RUNNING' },
                data: { heartbeatAt: new Date() },
              });
              if (!lease.count) throw new AppError('JOB_LEASE_LOST', 'งานนี้ถูกยกเลิกแล้ว');
              const updated = await tx.productSource.updateMany({
                where: { id: source.id, url: source.url, isActive: true },
                data: {
                  currentPrice: result.price,
                  regularPrice: result.regularPrice,
                  inStock: result.inStock,
                  retailerProductName: result.retailerProductName,
                  retailerSku: result.retailerSku,
                  lastCheckedAt: result.checkedAt,
                  ...(complete ? { lastSuccessAt: result.checkedAt } : {}),
                  lastError: complete ? null : 'SCRAPER_PARTIAL: ไม่ทราบสถานะสินค้า',
                },
              });
              if (!updated.count)
                throw new AppError(
                  'SOURCE_CHANGED',
                  'Source เปลี่ยนระหว่างการตรวจสอบ กรุณาทดสอบใหม่',
                );
              await tx.priceSnapshot.create({
                data: {
                  productSourceId: source.id,
                  price: result.price,
                  regularPrice: result.regularPrice,
                  inStock: result.inStock,
                  checkedAt: result.checkedAt,
                  status: complete ? 'SUCCESS' : 'PARTIAL',
                },
              });
              await tx.scrapeLog.create({
                data: {
                  scrapeJobId: jobId,
                  productSourceId: source.id,
                  retailerId: source.retailerId,
                  level: complete ? 'INFO' : 'WARN',
                  message: complete
                    ? 'SUCCESS: ตรวจสอบราคาสำเร็จ'
                    : 'PARTIAL: พบราคา แต่ไม่ทราบสถานะสินค้า',
                  durationMs: result.durationMs,
                  price: result.price,
                  parser: result.parser,
                  retailerProductName: result.retailerProductName,
                },
              });
            });
            if (complete) successCount++;
            else failureCount++;
            // A reference refresh failure must not turn a committed observation into a failed scrape.
            await this.prices.refreshReference(source.productId, false).catch(() => {
              this.logger.warn(
                JSON.stringify({ event: 'reference_refresh_failed', productId: source.productId }),
              );
            });
          } catch (error) {
            failureCount++;
            const checkedAt = new Date();
            const failure = this.errorMessage(error);
            const message = `${failure.code}: ${failure.message}`;
            // Failures never update currentPrice or lastSuccessAt.
            await this.db.$transaction([
              this.db.priceSnapshot.create({
                data: { productSourceId: source.id, checkedAt, status: 'FAILED' },
              }),
              this.db.productSource.updateMany({
                where: { id: source.id, url: source.url },
                data: { lastCheckedAt: checkedAt, lastError: message },
              }),
              this.db.scrapeLog.create({
                data: {
                  scrapeJobId: jobId,
                  productSourceId: source.id,
                  retailerId: source.retailerId,
                  level: 'ERROR',
                  message,
                  durationMs: Date.now() - start,
                },
              }),
            ]);
          }
          await this.db.scrapeJob.updateMany({
            where: { id: jobId, status: 'RUNNING' },
            data: { successCount, failureCount, heartbeatAt: new Date() },
          });
          await delay(getConfig().SCRAPER_DELAY_MS);
        }
        cursor = sources.at(-1)!.id;
      }
      await this.db.scrapeJob.updateMany({
        where: { id: jobId, status: 'RUNNING' },
        data: {
          status: failureCount === 0 ? 'COMPLETED' : successCount === 0 ? 'FAILED' : 'PARTIAL',
          finishedAt: new Date(),
          successCount,
          failureCount,
        },
      });
    } catch {
      await this.db.scrapeJob.updateMany({
        where: { id: jobId, status: 'RUNNING' },
        data: { status: 'FAILED', finishedAt: new Date() },
      });
      await this.db.scrapeLog.create({
        data: {
          scrapeJobId: jobId,
          level: 'ERROR',
          message: 'JOB_FAILED: งานหยุดก่อนเสร็จสมบูรณ์',
        },
      });
    }
    this.logger.log(
      JSON.stringify({
        event: 'job_finished',
        jobId,
        successCount,
        failureCount,
        durationMs: Date.now() - started,
      }),
    );
  }
  private errorMessage(error: unknown): { code: string; message: string } {
    return error instanceof AppError
      ? (error.getResponse() as { code: string; message: string })
      : { code: 'SCRAPER_INTERNAL_ERROR', message: 'ไม่สามารถดึงข้อมูลได้ กรุณาตรวจสอบการตั้งค่า' };
  }
  async list(query: PaginationDto) {
    const [data, total] = await this.db.$transaction([
      this.db.scrapeJob.findMany({
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.scrapeJob.count(),
    ]);
    return { data, meta: { ...query, total, totalPages: Math.ceil(total / query.limit) } };
  }
  async find(id: string, query: PaginationDto) {
    const job = await this.db.scrapeJob.findUnique({ where: { id } });
    if (!job) throw new AppError('JOB_NOT_FOUND', 'ไม่พบงานดึงราคา', 404);
    const [data, total] = await this.db.$transaction([
      this.db.scrapeLog.findMany({
        where: { scrapeJobId: id },
        include: {
          retailer: { select: { name: true } },
          productSource: { select: { product: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'asc' },
        take: query.limit,
        skip: (query.page - 1) * query.limit,
      }),
      this.db.scrapeLog.count({ where: { scrapeJobId: id } }),
    ]);
    return {
      ...job,
      logs: { data, meta: { ...query, total, totalPages: Math.ceil(total / query.limit) } },
    };
  }
}
