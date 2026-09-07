import type {
  Category,
  Offer,
  PageResult,
  PriceHistory,
  Product,
  ProductDetail,
  Retailer,
  ShopeeOffer,
} from './types';

type DemoSeed = {
  name: string;
  slug: string;
  brand: string;
  category: Category;
  modelNumber: string;
  price: number;
  specs: Record<string, string>;
  views: number;
};

type DemoResult = { status: number; body: unknown };

const seeds: DemoSeed[] = [
  {
    name: 'AMD Ryzen 7 9800X3D',
    slug: 'amd-ryzen-7-9800x3d',
    brand: 'AMD',
    category: 'CPU',
    modelNumber: '100-100001084WOF',
    price: 17490,
    specs: { Socket: 'AM5', Cores: '8 Core / 16 Thread', Series: 'Ryzen 9000' },
    views: 980,
  },
  {
    name: 'AMD Ryzen 5 9600X',
    slug: 'amd-ryzen-5-9600x',
    brand: 'AMD',
    category: 'CPU',
    modelNumber: '100-100001405WOF',
    price: 7990,
    specs: { Socket: 'AM5', Cores: '6 Core / 12 Thread', Series: 'Ryzen 9000' },
    views: 760,
  },
  {
    name: 'Intel Core Ultra 7 265K',
    slug: 'intel-core-ultra-7-265k',
    brand: 'Intel',
    category: 'CPU',
    modelNumber: 'BX80768265K',
    price: 11900,
    specs: { Socket: 'LGA1851', Cores: '20 Core / 20 Thread', Series: 'Core Ultra 200' },
    views: 610,
  },
  {
    name: 'GeForce RTX 5070 Ti · Demo edition',
    slug: 'geforce-rtx-5070-ti-demo',
    brand: 'NVIDIA',
    category: 'GPU',
    modelNumber: 'DEMO-5070TI-16G',
    price: 29900,
    specs: { Memory: '16GB GDDR7', Series: 'RTX 50 · ตัวอย่าง', Interface: 'PCIe 5.0' },
    views: 920,
  },
  {
    name: 'GeForce RTX 5070 · Demo edition',
    slug: 'geforce-rtx-5070-demo',
    brand: 'NVIDIA',
    category: 'GPU',
    modelNumber: 'DEMO-5070-12G',
    price: 20900,
    specs: { Memory: '12GB GDDR7', Series: 'RTX 50 · ตัวอย่าง', Interface: 'PCIe 5.0' },
    views: 840,
  },
  {
    name: 'Kingston FURY Beast DDR5 32GB · Demo',
    slug: 'kingston-fury-beast-ddr5-32gb-demo',
    brand: 'Kingston',
    category: 'RAM',
    modelNumber: 'DEMO-DDR5-32GB',
    price: 3290,
    specs: { Capacity: '32GB (16GB × 2)', Speed: 'DDR5-6000 · ตัวอย่าง', Type: 'DDR5' },
    views: 570,
  },
  {
    name: 'Samsung 990 PRO 1TB · Demo',
    slug: 'samsung-990-pro-1tb-demo',
    brand: 'Samsung',
    category: 'SSD',
    modelNumber: 'DEMO-990PRO-1TB',
    price: 3190,
    specs: { Capacity: '1TB', Interface: 'PCIe 4.0 NVMe', Size: 'M.2 2280' },
    views: 690,
  },
  {
    name: 'WD Black SN850X 2TB · Demo',
    slug: 'wd-black-sn850x-2tb-demo',
    brand: 'WD',
    category: 'SSD',
    modelNumber: 'DEMO-SN850X-2TB',
    price: 4990,
    specs: { Capacity: '2TB', Interface: 'PCIe 4.0 NVMe', Size: 'M.2 2280' },
    views: 640,
  },
];

const retailers: Retailer[] = [
  { id: 'demo-advice', name: 'Advice', slug: 'advice', baseUrl: 'https://www.advice.co.th' },
  { id: 'demo-jib', name: 'JIB', slug: 'jib', baseUrl: 'https://www.jib.co.th' },
  { id: 'demo-ihavecpu', name: 'iHAVECPU', slug: 'ihavecpu', baseUrl: 'https://www.ihavecpu.com' },
];

const now = () => new Date().toISOString();
const decimal = (value: number) => value.toFixed(2);

function offers(seed: DemoSeed, productIndex: number): Offer[] {
  const checkedAt = now();
  return retailers.map((retailer, index) => {
    const price = seed.price + index * Math.max(100, Math.round(seed.price * 0.012));
    const inStock = index !== 2 || productIndex % 3 !== 0;
    return {
      id: `${seed.slug}-${retailer.slug}`,
      retailer: { name: retailer.name, slug: retailer.slug },
      url: null,
      price: decimal(price),
      regularPrice: decimal(price * 1.12),
      inStock,
      isStale: false,
      isDemo: true,
      lastCheckedAt: checkedAt,
      lastSuccessAt: checkedAt,
      isCheapest: index === 0,
    };
  });
}

function shopeeOffers(seed: DemoSeed, productIndex: number): ShopeeOffer[] {
  const checkedAt = now();
  return retailers.map((retailer, index) => {
    const listedPrice = seed.price + 190 + index * Math.max(80, Math.round(seed.price * 0.009));
    const shopDiscount = Math.min(300, Math.floor((listedPrice * 0.03) / 10) * 10);
    const platformDiscount = Math.min(
      500,
      Math.floor(((listedPrice - shopDiscount) * 0.05) / 10) * 10,
    );
    return {
      id: `${seed.slug}-shopee-${retailer.slug}`,
      retailer: { name: retailer.name, slug: retailer.slug },
      url: null,
      listedPrice: decimal(listedPrice),
      estimatedPrice: decimal(listedPrice - shopDiscount - platformDiscount),
      discounts: [
        { label: 'โค้ดร้านตัวอย่าง', amount: decimal(shopDiscount) },
        { label: 'โค้ด Shopee ตัวอย่าง', amount: decimal(platformDiscount) },
      ],
      inStock: index !== 2 || productIndex % 3 !== 0,
      isDemo: true,
      lastCheckedAt: checkedAt,
    };
  });
}

function product(seed: DemoSeed, index: number): ProductDetail {
  const reference = seed.price * 1.085;
  return {
    id: `demo-product-${index + 1}`,
    name: seed.name,
    slug: seed.slug,
    brand: seed.brand,
    category: seed.category,
    modelNumber: seed.modelNumber,
    minimumPrice: decimal(seed.price),
    cheapestRetailer: 'Advice',
    retailerCount: 3,
    inStock: true,
    referencePrice: decimal(reference),
    priceChange: Number((((seed.price - reference) / reference) * 100).toFixed(1)),
    lastUpdated: now(),
    isDemo: true,
    description:
      'สินค้าตัวอย่างสำหรับสาธิตระบบ ราคาและประวัติทั้งหมดถูกสร้างขึ้น ไม่ใช่ราคาจริงของร้านค้า',
    specs: seed.specs,
    offers: offers(seed, index),
    shopeeOffers: shopeeOffers(seed, index),
  };
}

function history(seed: DemoSeed, index: number, search: URLSearchParams): PriceHistory {
  const range = search.get('range') || '30d';
  const mode = search.get('mode') || 'lowest';
  const requestedDays = range === 'all' ? 91 : Number.parseInt(range, 10);
  const days = [7, 30, 90, 91].includes(requestedDays) ? requestedDays : 30;
  const dailyLow: number[] = [];
  const points: PriceHistory['points'] = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10);
    const progress = (days - 1 - offset) / Math.max(1, days - 1);
    const baseline = seed.price * (1.1 - progress * 0.1 + Math.sin((offset + index) / 6) * 0.012);
    const prices = retailers.map((retailer, storeIndex) => ({
      retailer: retailer.slug,
      price: Math.round((baseline + storeIndex * Math.max(100, seed.price * 0.012)) / 10) * 10,
    }));
    if (offset === 0) prices[0].price = seed.price;
    dailyLow.push(Math.min(...prices.map(({ price }) => price)));
    if (mode === 'retailers') {
      prices.forEach((item) =>
        points.push({ day: date, retailer: item.retailer, price: decimal(item.price) }),
      );
    } else {
      points.push({ day: date, retailer: 'lowest', price: decimal(dailyLow.at(-1)!) });
    }
  }
  const low = Math.min(...dailyLow);
  const high = Math.max(...dailyLow);
  const average = dailyLow.reduce((total, value) => total + value, 0) / dailyLow.length;
  return {
    bucketDays: 1,
    range,
    mode,
    timezone: 'Asia/Bangkok',
    isDemo: true,
    points,
    summary: { low: decimal(low), average: decimal(average), high: decimal(high), days },
    trackedLow: decimal(Math.min(seed.price, low)),
    priceStatus: { label: 'ราคาดีมาก', percentile: 4.3 },
  };
}

function error(status: number, code: string, message: string): DemoResult {
  return { status, body: { error: { code, message }, timestamp: now() } };
}

function list(search: URLSearchParams): DemoResult {
  let data = seeds.map(product);
  const q = search.get('q')?.trim().toLocaleLowerCase('th') || '';
  const category = search.get('category');
  const brand = search.get('brand');
  const minPrice = search.get('minPrice');
  const maxPrice = search.get('maxPrice');
  if (category && !['CPU', 'GPU', 'RAM', 'SSD'].includes(category))
    return error(400, 'BAD_REQUEST', 'หมวดหมู่ไม่ถูกต้อง');
  if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice))
    return error(400, 'INVALID_PRICE_RANGE', 'ราคาต่ำสุดต้องไม่เกินราคาสูงสุด');
  if (q) {
    const words = q.split(/\s+/).filter(Boolean);
    data = data.filter((item) => {
      const searchable = `${item.name} ${item.brand} ${item.modelNumber}`.toLocaleLowerCase('th');
      return words.every((word) => searchable.includes(word));
    });
  }
  if (category) data = data.filter((item) => item.category === category);
  if (brand) data = data.filter((item) => item.brand.toLowerCase() === brand.toLowerCase());
  if (search.get('inStock') === 'true') data = data.filter((item) => item.inStock);
  if (minPrice) data = data.filter((item) => Number(item.minimumPrice) >= Number(minPrice));
  if (maxPrice) data = data.filter((item) => Number(item.minimumPrice) <= Number(maxPrice));
  const sort = search.get('sort') || 'price_asc';
  const views = new Map(seeds.map((seed) => [seed.slug, seed.views]));
  data.sort((left, right) => {
    if (sort === 'name') return left.name.localeCompare(right.name);
    if (sort === 'updated') return right.slug.localeCompare(left.slug);
    if (sort === 'popular') return (views.get(right.slug) || 0) - (views.get(left.slug) || 0);
    if (sort === 'price_drop') return (left.priceChange || 0) - (right.priceChange || 0);
    return Number(left.minimumPrice) - Number(right.minimumPrice);
  });
  const page = Math.max(1, Number.parseInt(search.get('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(search.get('limit') || '20', 10) || 20));
  const total = data.length;
  const result: PageResult<Product> = {
    data: data.slice((page - 1) * limit, page * limit),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit), isDemo: true },
  };
  return { status: 200, body: result };
}

export function standaloneDemoEnabled() {
  const configured = process.env.NEXT_PUBLIC_STANDALONE_DEMO;
  if (configured !== undefined) return configured === 'true';
  return process.env.VERCEL === '1' && !process.env.API_INTERNAL_URL;
}

export function handleStandaloneDemo(pathWithQuery: string, method = 'GET'): DemoResult {
  const url = new URL(pathWithQuery, 'https://demo.teenaitook.local');
  const path = url.pathname.replace(/^\/api/, '').replace(/\/$/, '') || '/';
  if (method === 'GET' && path === '/health')
    return { status: 200, body: { status: 'ok', database: 'standalone-demo', timestamp: now() } };
  if (method === 'GET' && path === '/products') return list(url.searchParams);
  if (method === 'GET' && path === '/brands') {
    const category = url.searchParams.get('category');
    if (category && !['CPU', 'GPU', 'RAM', 'SSD'].includes(category))
      return error(400, 'BAD_REQUEST', 'หมวดหมู่ไม่ถูกต้อง');
    const data = Array.from(
      new Set(
        seeds.filter((seed) => !category || seed.category === category).map((seed) => seed.brand),
      ),
    ).sort();
    return { status: 200, body: { data } };
  }
  if (method === 'GET' && path === '/categories')
    return { status: 200, body: { data: ['CPU', 'GPU', 'RAM', 'SSD'] } };
  if (method === 'GET' && path === '/retailers') return { status: 200, body: { data: retailers } };
  const match = path.match(/^\/products\/([^/]+)(?:\/(offers|price-history|view))?$/);
  if (match) {
    const index = seeds.findIndex((seed) => seed.slug === decodeURIComponent(match[1]));
    if (index < 0) return error(404, 'PRODUCT_NOT_FOUND', 'ไม่พบสินค้านี้');
    const detail = product(seeds[index], index);
    if (match[2] === 'view' && method === 'POST') return { status: 200, body: { recorded: true } };
    if (match[2] === 'offers' && method === 'GET')
      return { status: 200, body: { data: detail.offers } };
    if (match[2] === 'price-history' && method === 'GET')
      return { status: 200, body: history(seeds[index], index, url.searchParams) };
    if (!match[2] && method === 'GET') return { status: 200, body: detail };
  }
  return error(404, 'NOT_FOUND', 'ไม่พบข้อมูลที่ร้องขอ');
}
