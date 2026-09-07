import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { Server } from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap';
import { PrismaService } from '../../src/prisma/prisma.service';
import { SafeHttpClient } from '../../src/scraper/http-client';
import { getConfig } from '../../src/common/config';
import { AppError } from '../../src/common/errors';

test('API integration against migrated, seeded PostgreSQL', async (t) => {
  const env = getConfig();
  if (env.NODE_ENV === 'production' || !env.DEMO_MODE)
    throw new Error('Integration tests require a development/test database in DEMO_MODE');
  const originalScraper = env.SCRAPER_ENABLED;
  const originalDelay = env.SCRAPER_DELAY_MS;
  env.SCRAPER_ENABLED = true;
  env.SCRAPER_DELAY_MS = 500;
  let failFetch = false;
  const fixture = readFileSync('test/fixtures/product.html', 'utf8');
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(SafeHttpClient)
    .useValue({
      fetchHtml: async () => {
        if (failFetch) throw new AppError('SCRAPER_TIMEOUT', 'Fixture timeout');
        return fixture;
      },
    })
    .compile();
  const app = module.createNestApplication({ bodyParser: false });
  app.useLogger(false);
  configureApp(app);
  await app.init();
  const server = app.getHttpServer() as Server;
  const db = app.get(PrismaService);
  const agent = request.agent(server);
  const origin = env.FRONTEND_URL.split(',')[0];
  let productId = '';
  let sourceId = '';
  const jobIds: string[] = [];
  const slug = `integration-${randomUUID()}`;
  async function completed(id: string) {
    for (let i = 0; i < 100; i++) {
      const job = await db.scrapeJob.findUniqueOrThrow({ where: { id } });
      if (!['RUNNING', 'PENDING'].includes(job.status)) return job;
      await delay(50);
    }
    throw new Error('Job did not complete');
  }
  try {
    await t.test(
      'health, public products, search, filters, pagination, Swagger and protected routes',
      async () => {
        const health = await request(server).get('/api/health').expect(200);
        assert.equal(health.body.database, 'connected');
        const products = await request(server)
          .get('/api/products?q=Ryzen%209800x3d&limit=1')
          .expect(200);
        assert.equal(products.body.data.length, 1);
        assert.equal(products.body.data[0].minimumPrice, '17490.00');
        const detail = await request(server).get('/api/products/amd-ryzen-7-9800x3d').expect(200);
        assert.equal(detail.body.offers.length, 3);
        assert.equal(detail.body.offers[0].isCheapest, true);
        assert.equal(detail.body.offers[0].url, null);
        const offers = await request(server)
          .get('/api/products/amd-ryzen-7-9800x3d/offers')
          .expect(200);
        assert.equal(offers.body.data.length, 3);
        const paged = await request(server)
          .get('/api/products?category=CPU&limit=1&page=2')
          .expect(200);
        assert.equal(paged.body.meta.total, 3);
        assert.equal(paged.body.data.length, 1);
        const filtered = await request(server)
          .get('/api/products?brand=amd&minPrice=15000&maxPrice=18000&inStock=true&retailer=advice')
          .expect(200);
        assert.equal(filtered.body.data.length, 1);
        const brands = await request(server).get('/api/brands').expect(200);
        assert.deepEqual(brands.body.data, ['AMD', 'Intel', 'Kingston', 'NVIDIA', 'Samsung', 'WD']);
        assert.deepEqual(
          (await request(server).get('/api/brands?category=CPU').expect(200)).body.data,
          ['AMD', 'Intel'],
        );
        assert.deepEqual(
          (await request(server).get('/api/brands?category=GPU').expect(200)).body.data,
          ['NVIDIA'],
        );
        assert.deepEqual(
          (await request(server).get('/api/brands?category=RAM').expect(200)).body.data,
          ['Kingston'],
        );
        assert.deepEqual(
          (await request(server).get('/api/brands?category=SSD').expect(200)).body.data,
          ['Samsung', 'WD'],
        );
        await request(server).get('/api/brands?category=PHONE').expect(400);
        await request(server).get('/api/products?limit=101').expect(400);
        await request(server).get('/api/products?minPrice=50&maxPrice=10').expect(400);
        await request(server).get('/api/products?inStock=invalid').expect(400);
        await request(server).get('/api/products/does-not-exist').expect(404);
        await request(server).get('/api/deals').expect(404);
        await request(server).get('/api/docs-json').expect(200);
        await request(server).get('/api/admin/dashboard').expect(401);
        await request(server).post('/api/internal/scrape').expect(401);
      },
    );
    await t.test(
      'price history uses bounded Bangkok-day aggregation and exact summary strings',
      async () => {
        const latest = await db.priceSnapshot.findFirstOrThrow({
          where: { isDemo: true, productSource: { product: { slug: 'amd-ryzen-7-9800x3d' } } },
          orderBy: { checkedAt: 'desc' },
        });
        const bangkokDay = (time: number) => Math.floor((time + 7 * 3600000) / 86400000);
        const daysSinceSeed = bangkokDay(Date.now()) - bangkokDay(latest.checkedAt.getTime());
        for (const range of ['7d', '30d', '90d', 'all']) {
          const res = await request(server)
            .get(`/api/products/amd-ryzen-7-9800x3d/price-history?range=${range}`)
            .expect(200);
          assert.equal(res.body.timezone, 'Asia/Bangkok');
          assert.equal(res.body.summary.low, '17490.00');
          assert.ok(res.body.points.length <= 365 && res.body.points.length > 0);
          assert.equal(
            res.body.summary.days,
            range === 'all' ? 91 : Math.max(0, parseInt(range, 10) - daysSinceSeed),
          );
        }
        const stores = await request(server)
          .get('/api/products/amd-ryzen-7-9800x3d/price-history?mode=retailers&range=7d')
          .expect(200);
        assert.ok(stores.body.points.some((p: { retailer: string }) => p.retailer === 'advice'));
      },
    );
    await t.test(
      'admin login sets HTTP-only cookie, blocks bad origins and excludes secrets',
      async () => {
        const res = await agent
          .post('/api/auth/login')
          .set('Origin', origin)
          .send({ email: process.env.ADMIN_SEED_EMAIL, password: process.env.ADMIN_SEED_PASSWORD })
          .expect(201);
        assert.ok(String(res.headers['set-cookie']).includes('HttpOnly'));
        assert.equal(res.body.token, undefined);
        assert.equal(res.body.user.passwordHash, undefined);
        await agent.get('/api/auth/me').expect(200);
        await agent
          .post('/api/admin/products')
          .set('Origin', 'https://untrusted.example')
          .send({})
          .expect(403);
        await agent.post('/api/admin/products').send({}).expect(403);
      },
    );
    await t.test(
      'create/edit product, map source, reject SSRF/duplicate mappings, and validate payload',
      async () => {
        const product = await agent
          .post('/api/admin/products')
          .set('Origin', origin)
          .send({
            name: 'Integration CPU',
            slug,
            brand: 'Test',
            category: 'CPU',
            specs: { Socket: 'Fixture' },
          })
          .expect(201);
        productId = product.body.id;
        const retailer = await db.retailer.findUniqueOrThrow({ where: { slug: 'jib' } });
        await agent
          .patch(`/api/admin/products/${productId}`)
          .set('Origin', origin)
          .send({ description: 'Integration fixture' })
          .expect(200);
        await agent
          .post('/api/admin/sources')
          .set('Origin', origin)
          .send({ productId, retailerId: retailer.id, url: 'https://localhost/private' })
          .expect(400);
        const source = await agent
          .post('/api/admin/sources')
          .set('Origin', origin)
          .send({
            productId,
            retailerId: retailer.id,
            url: 'https://www.jib.co.th/product/integration-fixture',
          })
          .expect(201);
        sourceId = source.body.id;
        await agent
          .post('/api/admin/sources')
          .set('Origin', origin)
          .send({
            productId,
            retailerId: retailer.id,
            url: 'https://www.jib.co.th/product/integration-fixture',
          })
          .expect(409);
        await agent
          .patch(`/api/admin/products/${productId}`)
          .set('Origin', origin)
          .send({ passwordHash: 'unexpected' })
          .expect(400);
      },
    );
    await t.test(
      'single-source job parses fixture, records history/log and prevents overlap',
      async () => {
        const res = await agent
          .post(`/api/admin/sources/${sourceId}/scrape`)
          .set('Origin', origin)
          .expect(202);
        jobIds.push(res.body.id);
        await agent.post('/api/admin/scrape-jobs').set('Origin', origin).expect(409);
        assert.equal((await completed(res.body.id)).status, 'COMPLETED');
        const source = await db.productSource.findUniqueOrThrow({ where: { id: sourceId } });
        assert.equal(source.currentPrice?.toFixed(2), '17490.00');
        const result = await agent.get(`/api/admin/scrape-jobs/${res.body.id}`).expect(200);
        assert.equal(result.body.logs.data[0].parser, 'json-ld');
        assert.equal(result.body.logs.data[0].price, '17490');
        assert.equal(
          await db.priceSnapshot.count({ where: { productSourceId: sourceId, status: 'SUCCESS' } }),
          1,
        );
      },
    );
    await t.test('failed scrape preserves last valid price and successful timestamp', async () => {
      const before = await db.productSource.findUniqueOrThrow({ where: { id: sourceId } });
      failFetch = true;
      const res = await agent
        .post(`/api/admin/sources/${sourceId}/scrape`)
        .set('Origin', origin)
        .expect(202);
      jobIds.push(res.body.id);
      assert.equal((await completed(res.body.id)).status, 'FAILED');
      const after = await db.productSource.findUniqueOrThrow({ where: { id: sourceId } });
      assert.equal(after.currentPrice?.toFixed(2), before.currentPrice?.toFixed(2));
      assert.equal(after.lastSuccessAt?.toISOString(), before.lastSuccessAt?.toISOString());
      assert.match(after.lastError || '', /SCRAPER_TIMEOUT/);
    });
    await t.test(
      'live catalogue excludes demo data; stale price is not cheapest; remapping clears state',
      async () => {
        env.DEMO_MODE = false;
        await request(server).get('/api/products/amd-ryzen-7-9800x3d').expect(404);
        await request(server).post('/api/products/amd-ryzen-7-9800x3d/view').expect(404);
        await request(server).post(`/api/products/${slug}/view`).expect(200, { recorded: true });
        assert.equal(
          (await db.product.findUniqueOrThrow({ where: { id: productId } })).viewCount,
          1,
        );
        const ranked = await request(server)
          .get('/api/products?q=Integration&sort=popular')
          .expect(200);
        assert.equal(ranked.body.data[0].id, productId);
        const live = await request(server).get(`/api/products/${slug}`).expect(200);
        assert.equal(live.body.minimumPrice, '17490.00');
        await db.productSource.update({
          where: { id: sourceId },
          data: { lastSuccessAt: new Date(Date.now() - 48 * 3600000) },
        });
        const stale = await request(server).get(`/api/products/${slug}`).expect(200);
        assert.equal(stale.body.minimumPrice, null);
        assert.equal(stale.body.offers[0].isCheapest, false);
        await agent
          .patch(`/api/admin/sources/${sourceId}`)
          .set('Origin', origin)
          .send({ url: 'https://www.jib.co.th/product/changed-fixture' })
          .expect(200);
        assert.equal(
          (await db.productSource.findUniqueOrThrow({ where: { id: sourceId } })).currentPrice,
          null,
        );
        await agent
          .patch(`/api/admin/products/${productId}`)
          .set('Origin', origin)
          .send({ isActive: false })
          .expect(200);
        await request(server).get(`/api/products/${slug}`).expect(404);
        await request(server).post(`/api/products/${slug}/view`).expect(404);
        await agent.post('/api/auth/logout').set('Origin', origin).expect(201);
        await agent.get('/api/admin/products').expect(401);
      },
    );
  } finally {
    env.DEMO_MODE = true;
    env.SCRAPER_ENABLED = originalScraper;
    env.SCRAPER_DELAY_MS = originalDelay;
    if (jobIds.length) await db.scrapeJob.deleteMany({ where: { id: { in: jobIds } } });
    if (sourceId) {
      await db.priceSnapshot.deleteMany({ where: { productSourceId: sourceId } });
      await db.productSource.delete({ where: { id: sourceId } });
    }
    if (productId) await db.product.delete({ where: { id: productId } });
    await app.close();
  }
});
