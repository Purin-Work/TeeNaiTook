import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  Info,
  ShoppingBag,
  ShieldCheck,
  Store,
  TriangleAlert,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { PriceHistory, ProductDetail } from '@/lib/types';
import { money, dateTime, relativeTime } from '@/lib/utils';
import { CategoryArt } from '@/components/category-art';
import { DemoNotice } from '@/components/states';
import { PriceChart } from '@/components/price-chart';
import { PriceMovement } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { ProductView } from '@/components/product-view';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const p = await api<ProductDetail>(`/products/${encodeURIComponent(slug)}`);
    return {
      title: `${p.name} ราคา`,
      alternates: { canonical: `/product/${slug}` },
      robots: p.isDemo ? { index: false } : undefined,
    };
  } catch {
    return { title: 'ข้อมูลสินค้า' };
  }
}
export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  let product: ProductDetail;
  try {
    product = await api<ProductDetail>(`/products/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const history = await api<PriceHistory>(
    `/products/${encodeURIComponent(slug)}/price-history?range=30d`,
  );
  const best = product.offers.find((offer) => offer.isCheapest);
  return (
    <div className="container page-content product-detail">
      <ProductView slug={slug} />
      <nav className="breadcrumb" aria-label="เส้นทางหน้า">
        <Link href="/search">สินค้า</Link>
        <ChevronRight size={13} />
        <Link href={`/search?category=${product.category}`}>{product.category}</Link>
        <ChevronRight size={13} />
        <span>{product.brand}</span>
      </nav>
      {product.isDemo && <DemoNotice />}
      <section className="product-intro">
        <div className="detail-art">
          <CategoryArt category={product.category} large />
          <div className="detail-art-label">
            <span>{product.brand}</span>
            <span>PRODUCT / {product.category}</span>
          </div>
        </div>
        <div className="product-title">
          <span className="eyebrow">
            {product.category} / {product.brand}
          </span>
          <h1>{product.name}</h1>
          <p className="muted text-sm">รหัสรุ่น: {product.modelNumber || 'ไม่ระบุ'}</p>
          <div className="spec-chips">
            {Object.entries(product.specs || {})
              .slice(0, 5)
              .map(([key, value]) => (
                <span key={key}>{String(value)}</span>
              ))}
          </div>
          <div className="price-status">
            <ShieldCheck size={17} />
            <span>{history.priceStatus.label}</span>
            <Link href="/about#price-method" aria-label="วิธีประเมินราคา">
              <Info size={15} />
            </Link>
          </div>
        </div>
        <div className="best-offer panel">
          <span className="eyebrow">ราคาถูกสุดตอนนี้</span>
          <div className="detail-price">{money(product.minimumPrice)}</div>
          <PriceMovement change={product.priceChange} />
          <p className="best-retailer">
            <Store size={15} />
            {product.cheapestRetailer || 'ยังไม่มีข้อเสนอที่ตรวจสอบได้'}
          </p>
          {best?.url ? (
            <Button asChild className="w-full">
              <a href={best.url} target="_blank" rel="noopener noreferrer nofollow">
                ดูที่ร้านค้า <ArrowUpRight />
              </a>
            </Button>
          ) : (
            <Button className="w-full" disabled>
              {product.isDemo ? 'ลิงก์ร้านค้าไม่เปิดในข้อมูลตัวอย่าง' : 'รอราคาที่ตรวจสอบล่าสุด'}
            </Button>
          )}
          <span className="best-note">
            <Clock3 size={12} />
            {relativeTime(product.lastUpdated)}
          </span>
        </div>
      </section>
      <section className="comparison-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SAME PRODUCT. DIFFERENT PRICES.</span>
            <h2>
              เปรียบเทียบราคา <span className="count-pill">{product.offers.length} ร้านค้า</span>
            </h2>
          </div>
          <span className="muted text-xs">สินค้าพร้อมขายก่อน · ราคาต่ำไปสูง</span>
        </div>
        <div className="offer-list">
          {product.offers.length ? (
            product.offers.map((offer) => (
              <article
                key={offer.id}
                className={`offer-row ${offer.isCheapest ? 'offer-best' : ''}`}
              >
                <div className="offer-store">
                  <span className={`store-avatar store-${offer.retailer.slug}`}>
                    {offer.retailer.name === 'iHAVECPU' ? 'iH' : offer.retailer.name.slice(0, 2)}
                  </span>
                  <div>
                    <h3>{offer.retailer.name}</h3>
                    {offer.isCheapest && (
                      <span className="cheapest-badge">
                        <Check size={12} /> ถูกสุด{product.isDemo ? 'ในข้อมูลตัวอย่าง' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="offer-stock">
                  <span className={offer.inStock === true ? 'positive' : 'muted'}>
                    {offer.inStock === true
                      ? '● มีสินค้า'
                      : offer.inStock === false
                        ? '○ สินค้าหมด'
                        : '– ไม่ทราบสถานะ'}
                  </span>
                  <time title={dateTime(offer.lastSuccessAt)}>
                    {offer.isStale ? (
                      <span className="stale-warning">
                        <TriangleAlert size={12} />
                        ข้อมูลราคาอาจล้าสมัย
                      </span>
                    ) : (
                      `อัปเดต ${relativeTime(offer.lastSuccessAt)}`
                    )}
                  </time>
                </div>
                <div className="offer-price">{money(offer.price)}</div>
                {offer.url ? (
                  <Button asChild variant={offer.isCheapest ? 'default' : 'outline'}>
                    <a href={offer.url} target="_blank" rel="noopener noreferrer nofollow">
                      ไปยังร้านค้า <ArrowUpRight />
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" disabled>
                    ข้อมูลตัวอย่าง
                  </Button>
                )}
              </article>
            ))
          ) : (
            <div className="empty-state">
              <Store />
              <p>ยังไม่มีร้านค้าที่ติดตามสินค้านี้</p>
            </div>
          )}
        </div>
        <p className="comparison-note">
          <Info size={14} />
          ราคาอาจไม่รวมคูปอง ค่าจัดส่ง และเงื่อนไขของร้านค้า กรุณาตรวจสอบก่อนซื้อ
        </p>
      </section>
      {!!product.shopeeOffers?.length && (
        <section className="shopee-section" aria-labelledby="shopee-heading">
          <div className="section-heading">
            <div>
              <span className="eyebrow">MARKETPLACE PRICE</span>
              <h2 id="shopee-heading">
                ราคาใน Shopee <span className="count-pill">{product.shopeeOffers.length} ร้าน</span>
              </h2>
            </div>
            <span className="muted text-xs">รวมส่วนลดตัวอย่างแล้ว</span>
          </div>
          <div className="shopee-notice">
            <Info size={17} />
            <div>
              <strong>ราคาหลังโค้ดเป็นค่าประมาณ</strong>
              <p>
                สิทธิ์จริงขึ้นกับบัญชี ยอดขั้นต่ำ จำนวนโค้ด วิธีชำระเงิน และช่วงเวลา
                กรุณาตรวจยอดสุดท้ายในหน้าชำระเงินของ Shopee
              </p>
            </div>
          </div>
          <div className="shopee-grid">
            {product.shopeeOffers.map((offer) => (
              <article className="shopee-card panel" key={offer.id}>
                <div className="shopee-store">
                  <span className="shopee-icon" aria-hidden="true">
                    <ShoppingBag size={20} />
                  </span>
                  <div>
                    <span className="shopee-channel">SHOPEE</span>
                    <h3>{offer.retailer.name}</h3>
                  </div>
                  <span className={offer.inStock ? 'positive' : 'muted'}>
                    {offer.inStock ? '● มีสินค้า' : '○ สินค้าหมด'}
                  </span>
                </div>
                <dl className="shopee-breakdown">
                  <div>
                    <dt>ราคาบนรายการสินค้า</dt>
                    <dd>{money(offer.listedPrice)}</dd>
                  </div>
                  {offer.discounts.map((discount) => (
                    <div key={discount.label}>
                      <dt>{discount.label}</dt>
                      <dd className="discount-amount">−{money(discount.amount)}</dd>
                    </div>
                  ))}
                </dl>
                <div className="shopee-total">
                  <span>ราคาสุทธิโดยประมาณ</span>
                  <strong>{money(offer.estimatedPrice)}</strong>
                </div>
                {offer.url ? (
                  <Button asChild className="w-full">
                    <a href={offer.url} target="_blank" rel="noopener noreferrer nofollow">
                      ตรวจราคาใน Shopee <ArrowUpRight />
                    </a>
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    ข้อมูลตัวอย่าง
                  </Button>
                )}
                <span className="shopee-updated">
                  อัปเดต {relativeTime(offer.lastCheckedAt)} · ไม่รวมค่าส่งและ Shopee Coins
                </span>
              </article>
            ))}
          </div>
        </section>
      )}
      <PriceChart slug={slug} initial={history} />
      <section className="product-specs panel">
        <span className="eyebrow">THE DETAILS</span>
        <h2>ข้อมูลสินค้า</h2>
        <p>
          {product.description || 'ข้อมูลจำเพาะจัดทำโดย TeeNaiTook เพื่อช่วยเปรียบเทียบรุ่นสินค้า'}
        </p>
        <dl>
          {Object.entries(product.specs || {}).map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{String(value)}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
