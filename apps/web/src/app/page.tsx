import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  ShieldCheck,
  Store,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { PageResult, Product } from '@/lib/types';
import { SearchBox } from '@/components/search-box';
import { ProductCard } from '@/components/product-card';
import { categoryIcons } from '@/components/category-art';
import { ApiUnavailable, DemoNotice, EmptyState } from '@/components/states';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const products = await api<PageResult<Product>>('/products?limit=4&sort=popular').catch(
    () => null,
  );
  return (
    <>
      <section className="hero">
        <div className="hero-grid" />
        <div className="container hero-inner">
          <h1>
            ของไอทีชิ้นนี้
            <br />
            <span className="hero-highlight">
              ที่ไหนถูกที่สุด<span className="hero-question">?</span>
            </span>
          </h1>
          <p className="hero-description">
            เช็กราคาให้ชัวร์ ก่อนกดซื้อ
            <br className="mobile-only" /> เปรียบเทียบ CPU, GPU, RAM และ SSD
            <br className="desktop-only" /> จากร้านไอทีชั้นนำ พร้อมดูราคาย้อนหลังก่อนตัดสินใจซื้อ
          </p>
          <SearchBox hero />
          <div className="trending-searches">
            <span>ลองค้นหา</span>
            {['Ryzen 7 9800X3D', 'RTX 5070 Ti', 'DDR5 32GB'].map((q) => (
              <Link href={`/search?q=${encodeURIComponent(q)}`} key={q}>
                {q}
                <ArrowUpRight size={12} />
              </Link>
            ))}
          </div>
          <div className="hero-trust">
            <span>
              <Store size={15} /> 3 ร้านไอทีชั้นนำ
            </span>
            <i />
            <span>
              <ChartNoAxesCombined size={15} /> ดูแนวโน้มราคา
            </span>
            <i />
            <span>
              <ShieldCheck size={15} /> เช็กฟรี ไม่ต้องสมัคร
            </span>
          </div>
        </div>
        <span className="hero-coordinate">TNT / PRICE INTELLIGENCE</span>
      </section>
      <div className="container home-content">
        {products?.meta.isDemo && <DemoNotice />}
        <div className="category-shortcuts">
          {Object.entries(categoryIcons).map(([category, Icon]) => (
            <Link href={`/search?category=${category}`} key={category}>
              <span className={`category-shortcut-icon category-${category.toLowerCase()}`}>
                <Icon size={25} strokeWidth={1.5} />
              </span>
              <span>
                <strong>{category}</strong>
                <small>
                  {category === 'CPU'
                    ? 'หน่วยประมวลผล'
                    : category === 'GPU'
                      ? 'การ์ดจอ'
                      : category === 'RAM'
                        ? 'หน่วยความจำ'
                        : 'พื้นที่จัดเก็บ'}
                </small>
              </span>
              <ArrowUpRight size={17} className="muted" />
            </Link>
          ))}
        </div>
        <section className="insight-strip">
          <div className="insight-icon">
            <ChartNoAxesCombined size={30} strokeWidth={1.4} />
          </div>
          <div>
            <span className="eyebrow">DON’T JUST GUESS. CHECK THE HISTORY.</span>
            <h2>ราคาดีจริง หรือแค่ป้ายลดราคา?</h2>
            <p>ย้อนดูประวัติราคา แล้วเลือกจังหวะอัปเกรดที่ใช่สำหรับคุณ</p>
          </div>
          <Link href="/about#price-method" className="text-link">
            เราดูราคาอย่างไร <ArrowUpRight size={17} />
          </Link>
          <div className="insight-spark" aria-hidden="true">
            <svg viewBox="0 0 220 65">
              <path
                d="M0 15L30 21L55 15L80 33L110 29L130 39L150 35L175 52L195 46L220 55"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
        </section>
        <section className="product-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                <Zap size={14} /> EXPLORE YOUR NEXT UPGRADE
              </div>
              <h2>สินค้ายอดนิยม</h2>
              <p>รุ่นที่ถูกเปิดดูบน TeeNaiTook แล้วเทียบราคาก่อนซื้อ</p>
            </div>
            <Link href="/search" className="text-link">
              สินค้าทั้งหมด <ArrowRight size={16} />
            </Link>
          </div>
          {products?.data.length ? (
            <div className="product-grid">
              {products.data.map((product) => (
                <ProductCard product={product} key={product.id} />
              ))}
            </div>
          ) : products ? (
            <EmptyState />
          ) : (
            <ApiUnavailable />
          )}
        </section>
        <section className="retailers-section">
          <div>
            <span className="eyebrow">ONE SEARCH. MORE CHOICES.</span>
            <h2>ร้านค้าที่รองรับ</h2>
            <p>รวมร้านไอทีที่คุณคุ้นเคย ไว้ในที่เดียว</p>
          </div>
          <div className="retailer-marks">
            <span className="retailer-jib">
              JIB<span>COMPUTER GROUP</span>
            </span>
            <span className="retailer-advice">
              Advice<span>IT INFINITE</span>
            </span>
            <span className="retailer-ihave">
              iHAVECPU<span>YOUR PC. YOUR WAY.</span>
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
