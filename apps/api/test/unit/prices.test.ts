import { test } from 'node:test';
import assert from 'node:assert/strict';
import { priceStatus, priceChange } from '../../src/prices/price-math';
import { serializeOffers, type SourceWithRetailer } from '../../src/products/offers';
import { Prisma } from '../../src/generated/prisma/client';
const now = new Date('2026-09-06T12:00:00Z');
function source(price: string, inStock: boolean | null, ageHours: number): SourceWithRetailer {
  return {
    id: price,
    retailer: { name: price, slug: price, isActive: true },
    isActive: true,
    isDemo: false,
    url: 'https://www.jib.co.th/product',
    currentPrice: new Prisma.Decimal(price),
    regularPrice: null,
    inStock,
    lastSuccessAt: new Date(now.getTime() - ageHours * 3600000),
    lastCheckedAt: now,
  } as SourceWithRetailer;
}
test('cheapest badge excludes stale, out-of-stock and unknown offers; ties are valid', () => {
  const offers = serializeOffers(
    [
      source('100', true, 13),
      source('200', false, 1),
      source('250', null, 1),
      source('300', true, 1),
      source('300', true, 2),
    ],
    12,
    now,
  );
  assert.equal(offers.filter((o) => o.isCheapest).length, 2);
  assert.ok(offers.filter((o) => o.isCheapest).every((o) => o.price === '300.00'));
  assert.equal(serializeOffers([source('100', true, 13)], 12, now)[0].isCheapest, false);
});
test('price status requires 30 distinct daily observations and deterministic percentiles', () => {
  const prices = Array.from({ length: 100 }, (_, i) => 100 + i);
  assert.equal(priceStatus(50, prices.slice(0, 29)).percentile, null);
  assert.equal(priceStatus(null, prices).percentile, null);
  assert.equal(priceStatus(100, prices).label, 'ราคาดีมาก');
  assert.equal(priceStatus(125, prices).label, 'ราคาดี');
  assert.equal(priceStatus(150, prices).label, 'ราคาปกติ');
  assert.equal(priceStatus(190, prices).label, 'ราคาค่อนข้างสูง');
  assert.equal(priceChange(90, 100), -10);
  assert.equal(priceChange(90, null), null);
});
