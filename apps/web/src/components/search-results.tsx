import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { PageResult, Product } from '@/lib/types';
import { ProductCard } from './product-card';
import { SearchBox } from './search-box';
import { ApiUnavailable, DemoNotice, EmptyState, ErrorMessage } from './states';
import { Button } from './ui/button';
import { ProductFilters } from './product-filters';
export type SearchParams = Record<string, string | string[] | undefined>;
export async function SearchResults({ params }: { params: SearchParams }) {
  const allowed = [
    'q',
    'category',
    'brand',
    'retailer',
    'inStock',
    'minPrice',
    'maxPrice',
    'sort',
    'page',
  ];
  const query = new URLSearchParams();
  allowed.forEach((key) => {
    const value = params[key];
    if (typeof value === 'string' && value) query.set(key, value);
  });
  query.set('limit', '12');
  const route = '/search';
  let result: PageResult<Product>;
  let brands: string[];
  try {
    const categoryQuery = query.get('category');
    [result, { data: brands }] = await Promise.all([
      api<PageResult<Product>>(`/products?${query}`),
      api<{ data: string[] }>(
        `/brands${categoryQuery ? `?category=${encodeURIComponent(categoryQuery)}` : ''}`,
      ),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 400)
      return (
        <>
          <ErrorMessage message={error.message} />
          <Button asChild variant="outline">
            <Link href={route}>ล้างตัวกรอง</Link>
          </Button>
        </>
      );
    return <ApiUnavailable />;
  }
  const pageLink = (page: number) => {
    const next = new URLSearchParams(query);
    next.set('page', String(page));
    return `${route}?${next}`;
  };
  const sort = query.get('sort') || 'price_asc';
  return (
    <>
      <SearchBox key={query.get('q') || ''} initialQuery={query.get('q') || ''} />
      {result.meta.isDemo && <DemoNotice />}
      <div className="search-layout">
        <aside className="filters">
          <ProductFilters
            key={query.toString()}
            route={route}
            brands={brands}
            values={{
              q: query.get('q') || '',
              category: query.get('category') || '',
              brand: query.get('brand') || '',
              inStock: query.get('inStock') === 'true',
              minPrice: query.get('minPrice') || '',
              maxPrice: query.get('maxPrice') || '',
              sort,
            }}
          />
          <p className="filter-note">ราคาเริ่มต้นคำนวณจากสินค้าพร้อมขายที่ตรวจสอบล่าสุด</p>
        </aside>
        <div className="results">
          <div className="results-heading">
            <p>
              {query.get('q') ? (
                <>
                  ผลการค้นหา <strong>“{query.get('q')}”</strong>
                </>
              ) : (
                'สินค้าทั้งหมด'
              )}{' '}
              <span className="count-pill">{result.meta.total}</span>
            </p>
            <span className="muted text-xs">{query.get('category') || 'ทุกหมวดหมู่'}</span>
          </div>
          {result.data.length ? (
            <div className="product-grid results-grid">
              {result.data.map((p) => (
                <ProductCard product={p} key={p.id} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
          <nav className="pagination" aria-label="หน้าผลการค้นหา">
            {result.meta.page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={pageLink(result.meta.page - 1)}>
                  <ArrowLeft /> ก่อนหน้า
                </Link>
              </Button>
            )}
            <span>
              หน้า {result.meta.page} / {Math.max(1, result.meta.totalPages)}
            </span>
            {result.meta.page < result.meta.totalPages && (
              <Button asChild variant="outline" size="sm">
                <Link href={pageLink(result.meta.page + 1)}>
                  ถัดไป <ArrowRight />
                </Link>
              </Button>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}
