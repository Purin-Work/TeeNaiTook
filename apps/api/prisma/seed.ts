import { config } from 'dotenv';
import { hash } from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Category, type Retailer } from '../src/generated/prisma/client';
import { parseEnvironment } from '../src/common/config';

config({ path: '../../.env', quiet: true });
const env = parseEnvironment(process.env);
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });
const examples: {
  name: string;
  slug: string;
  brand: string;
  category: Category;
  model: string;
  price: number;
  specs: Record<string, string>;
}[] = [
  {
    name: 'AMD Ryzen 7 9800X3D',
    slug: 'amd-ryzen-7-9800x3d',
    brand: 'AMD',
    category: 'CPU',
    model: '100-100001084WOF',
    price: 17490,
    specs: { Socket: 'AM5', Cores: '8 Core / 16 Thread', Series: 'Ryzen 9000' },
  },
  {
    name: 'AMD Ryzen 5 9600X',
    slug: 'amd-ryzen-5-9600x',
    brand: 'AMD',
    category: 'CPU',
    model: '100-100001405WOF',
    price: 7990,
    specs: { Socket: 'AM5', Cores: '6 Core / 12 Thread' },
  },
  {
    name: 'GeForce RTX 5070 Ti · Demo edition',
    slug: 'geforce-rtx-5070-ti-demo',
    brand: 'NVIDIA',
    category: 'GPU',
    model: 'DEMO-5070TI-16G',
    price: 29900,
    specs: { Memory: '16GB GDDR7', Series: 'RTX 50 · ตัวอย่าง' },
  },
  {
    name: 'GeForce RTX 5070 · Demo edition',
    slug: 'geforce-rtx-5070-demo',
    brand: 'NVIDIA',
    category: 'GPU',
    model: 'DEMO-5070-12G',
    price: 20900,
    specs: { Memory: '12GB GDDR7', Series: 'RTX 50 · ตัวอย่าง' },
  },
  {
    name: 'Kingston FURY Beast DDR5 32GB · Demo',
    slug: 'kingston-fury-beast-ddr5-32gb-demo',
    brand: 'Kingston',
    category: 'RAM',
    model: 'DEMO-DDR5-32GB',
    price: 3290,
    specs: { Capacity: '32GB (16GB × 2)', Speed: 'DDR5-6000 · ตัวอย่าง' },
  },
  {
    name: 'Samsung 990 PRO 1TB · Demo',
    slug: 'samsung-990-pro-1tb-demo',
    brand: 'Samsung',
    category: 'SSD',
    model: 'DEMO-990PRO-1TB',
    price: 3190,
    specs: { Capacity: '1TB', Interface: 'PCIe 4.0 NVMe', Size: 'M.2 2280' },
  },
];

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!email || !password || password.length < 12 || Buffer.byteLength(password) > 72)
    throw new Error('Set ADMIN_SEED_EMAIL and a 12–72 byte ADMIN_SEED_PASSWORD');
  await db.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash: await hash(password, 12) },
  });
  const retailers: Retailer[] = [];
  for (const retailer of [
    { name: 'Advice', slug: 'advice', baseUrl: 'https://www.advice.co.th' },
    { name: 'JIB', slug: 'jib', baseUrl: 'https://www.jib.co.th' },
    { name: 'iHAVECPU', slug: 'ihavecpu', baseUrl: 'https://www.ihavecpu.com' },
  ]) {
    retailers.push(
      await db.retailer.upsert({ where: { slug: retailer.slug }, update: {}, create: retailer }),
    );
  }
  if (!env.DEMO_MODE && !env.SAMPLE_DATA_ENABLED) {
    console.log('Seeded admin and retailers; no demo data inserted.');
    return;
  }
  if (env.NODE_ENV === 'production' && env.DEMO_MODE)
    throw new Error('DEMO_MODE is forbidden in production');
  const now = new Date();
  for (let index = 0; index < examples.length; index++) {
    const example = examples[index];
    const exists = await db.product.findUnique({ where: { slug: example.slug } });
    if (exists) continue;
    const reference = (example.price * 1.085).toFixed(2);
    await db.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: example.name,
          slug: example.slug,
          brand: example.brand,
          category: example.category,
          modelNumber: example.model,
          specs: example.specs,
          description:
            'สินค้าตัวอย่างสำหรับสาธิตระบบ ราคาและประวัติทั้งหมดถูกสร้างขึ้น ไม่ใช่ราคาจริงของร้านค้า',
          isDemo: true,
          referencePrice: reference,
          historyDays: 7,
          referenceComputedAt: now,
        },
      });
      for (let storeIndex = 0; storeIndex < retailers.length; storeIndex++) {
        const retailer = retailers[storeIndex];
        const current =
          example.price + storeIndex * Math.max(100, Math.round(example.price * 0.012));
        const source = await tx.productSource.create({
          data: {
            productId: product.id,
            retailerId: retailer.id,
            url: `${retailer.baseUrl}/`,
            isDemo: true,
            retailerProductName: example.name,
            currentPrice: current.toFixed(2),
            regularPrice: (current * 1.12).toFixed(2),
            inStock: storeIndex !== 2 || index % 3 !== 0,
            lastCheckedAt: now,
            lastSuccessAt: now,
          },
        });
        await tx.priceSnapshot.createMany({
          data: Array.from({ length: 91 }, (_, day) => {
            const age = 90 - day;
            const checkedAt = new Date(now.getTime() - age * 86400000);
            const historical =
              age === 0
                ? current
                : Math.round(
                    (current * (1.06 + age / 900 + Math.sin((day + index) / 7) * 0.018)) / 10,
                  ) * 10;
            return {
              productSourceId: source.id,
              price: historical.toFixed(2),
              regularPrice: (historical * 1.1).toFixed(2),
              inStock: storeIndex !== 2 || index % 3 !== 0,
              checkedAt,
              status: 'SUCCESS' as const,
              isDemo: true,
            };
          }),
        });
      }
      const [result] = await tx.$queryRaw<{ average: string }[]>`
        SELECT AVG(price)::text AS average FROM (
          SELECT MIN(ps.price) AS price FROM "PriceSnapshot" ps JOIN "ProductSource" s ON s.id=ps."productSourceId"
          WHERE s."productId"=${product.id}::uuid AND ps."inStock"=true
          AND (ps."checkedAt" AT TIME ZONE 'Asia/Bangkok')::date >= (now() AT TIME ZONE 'Asia/Bangkok')::date-7
          AND (ps."checkedAt" AT TIME ZONE 'Asia/Bangkok')::date < (now() AT TIME ZONE 'Asia/Bangkok')::date
          GROUP BY (ps."checkedAt" AT TIME ZONE 'Asia/Bangkok')::date
        ) daily`;
      await tx.product.update({
        where: { id: product.id },
        data: { referencePrice: result.average },
      });
    });
  }
  console.log(
    'Seed complete: 6 demo products, 3 retailers, and 91 days of clearly labeled synthetic history. Existing records preserved.',
  );
}
main()
  .catch(() => {
    console.error('Seed failed. Verify database access and required seed environment variables.');
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
