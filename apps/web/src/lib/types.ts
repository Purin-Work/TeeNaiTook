export type Category = 'CPU' | 'GPU' | 'RAM' | 'SSD';
export type Product = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: Category;
  modelNumber: string | null;
  minimumPrice: string | null;
  cheapestRetailer: string | null;
  retailerCount: number;
  inStock: boolean;
  referencePrice: string | null;
  priceChange: number | null;
  lastUpdated: string | null;
  isDemo: boolean;
};
export type Offer = {
  id: string;
  retailer: { name: string; slug: string };
  url: string | null;
  price: string | null;
  regularPrice: string | null;
  inStock: boolean | null;
  isStale: boolean;
  isDemo: boolean;
  lastCheckedAt: string | null;
  lastSuccessAt: string | null;
  isCheapest: boolean;
};
export type ShopeeOffer = {
  id: string;
  retailer: { name: string; slug: string };
  url: string | null;
  listedPrice: string;
  estimatedPrice: string;
  discounts: { label: string; amount: string }[];
  inStock: boolean;
  isDemo: boolean;
  lastCheckedAt: string | null;
};
export type ProductDetail = Product & {
  description: string | null;
  specs: Record<string, string | number | boolean> | null;
  offers: Offer[];
  shopeeOffers?: ShopeeOffer[];
};
export type PageResult<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number; isDemo?: boolean };
};
export type Retailer = {
  id: string;
  name: string;
  slug: string;
  baseUrl: string;
  isActive?: boolean;
};
export type PriceHistory = {
  bucketDays: number;
  range: string;
  mode: string;
  timezone: string;
  isDemo: boolean;
  points: { day: string; price: string; retailer: string }[];
  summary: { low: string | null; average: string | null; high: string | null; days: number };
  trackedLow: string | null;
  priceStatus: { label: string; percentile: number | null };
};
