import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ProductsService } from '../../src/products/products.service';
import type { PrismaService } from '../../src/prisma/prisma.service';
import { ProductsQueryDto } from '../../src/products/products.dto';
test('products service rejects contradictory price ranges before accessing the database', async () => {
  const service = new ProductsService({} as PrismaService);
  await assert.rejects(
    service.list(Object.assign(new ProductsQueryDto(), { minPrice: 1000, maxPrice: 10 })),
    /ราคาต่ำสุด/,
  );
});
