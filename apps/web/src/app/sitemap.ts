import type { MetadataRoute } from 'next';
import { api } from '@/lib/api';
import type { PageResult, Product } from '@/lib/types';
import { siteUrl } from '@/lib/site-url';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const entries: MetadataRoute.Sitemap = ['', '/categories', '/about'].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: 'daily',
  }));
  for (let page = 1; page <= 100; page++) {
    const result = await api<PageResult<Product>>(
      `/products?limit=100&page=${page}&sort=name`,
    ).catch(() => null);
    if (!result || result.meta.isDemo) break;
    entries.push(
      ...result.data.map((p) => ({
        url: `${base}/product/${p.slug}`,
        ...(p.lastUpdated ? { lastModified: new Date(p.lastUpdated) } : {}),
        changeFrequency: 'daily' as const,
      })),
    );
    if (page >= result.meta.totalPages) break;
  }
  return entries;
}
