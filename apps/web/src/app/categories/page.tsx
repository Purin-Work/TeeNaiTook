import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { CategoryArt } from '@/components/category-art';
import type { Category } from '@/lib/types';
export const metadata = { title: 'หมวดหมู่สินค้า' };
export default function CategoriesPage() {
  return (
    <div className="container page-content">
      <div className="page-heading">
        <span className="eyebrow">BUILD SOMETHING BETTER</span>
        <h1>เลือกชิ้นส่วนที่อยากอัปเกรด</h1>
        <p>เริ่มจากหมวดหมู่ แล้วหาในราคาที่คุ้มกว่า</p>
      </div>
      <div className="category-page-grid">
        {(['CPU', 'GPU', 'RAM', 'SSD'] as Category[]).map((category) => (
          <Link className="category-page-card" href={`/search?category=${category}`} key={category}>
            <CategoryArt category={category} large />
            <div>
              <h2>{category}</h2>
              <ArrowUpRight />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
