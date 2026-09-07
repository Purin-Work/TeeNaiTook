import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, ArrowRight, Clock3 } from 'lucide-react';
import type { Product } from '@/lib/types';
import { money, relativeTime } from '@/lib/utils';
import { CategoryArt } from './category-art';
export function PriceMovement({ change }: { change: number | null }) {
  if (change === null) return <span className="muted text-xs">ประวัติยังไม่เพียงพอ</span>;
  return (
    <span
      className={`price-movement ${change < 0 ? 'positive' : change > 0 ? 'negative' : 'muted'}`}
    >
      {change < 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
      {Math.abs(change).toFixed(1)}% <span className="movement-label">จากค่าเฉลี่ย 7 วัน</span>
    </span>
  );
}
export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.slug}`} className="product-card">
      <div className="product-art-wrap">
        <CategoryArt category={product.category} />
        <span className="category-label">{product.category}</span>
        {product.priceChange !== null && product.priceChange < 0 && (
          <span className="drop-badge">
            <ArrowDownRight size={13} />
            {Math.abs(product.priceChange).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="product-card-body">
        <span className="eyebrow small">{product.brand}</span>
        <h3>{product.name}</h3>
        <p className="product-model">{product.modelNumber || 'เปรียบเทียบราคาล่าสุด'}</p>
        <div className="product-price-row">
          <div>
            <span className="muted text-xs">ราคาเริ่มต้น</span>
            <div className="card-price">{money(product.minimumPrice)}</div>
          </div>
          {product.referencePrice && (
            <span className="reference-price" title="ค่าเฉลี่ยราคาต่ำสุดรายวันใน 7 วันก่อนหน้า">
              {money(product.referencePrice)}
            </span>
          )}
        </div>
        <div className="card-retailer">
          <span>
            <span className={`status-dot ${product.inStock ? '' : 'status-neutral'}`} />
            {product.cheapestRetailer || 'รอข้อมูลราคา'}
            <span className="muted"> · {product.retailerCount} ร้านค้า</span>
          </span>
          <ArrowRight size={16} />
        </div>
        <div className="card-updated">
          <Clock3 size={12} />
          {relativeTime(product.lastUpdated)}
          {product.isDemo && <span className="demo-mini">DEMO</span>}
        </div>
      </div>
    </Link>
  );
}
