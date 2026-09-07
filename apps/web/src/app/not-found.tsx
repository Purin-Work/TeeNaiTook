import Link from 'next/link';
import { Button } from '@/components/ui/button';
export default function NotFound() {
  return (
    <div className="container empty-state">
      <span className="eyebrow">404 / NOT FOUND</span>
      <h1>ไม่พบหน้าที่คุณค้นหา</h1>
      <p>สินค้านี้อาจถูกปิดการติดตาม หรือ URL ไม่ถูกต้อง</p>
      <Button asChild>
        <Link href="/search">ค้นหาสินค้าอื่น</Link>
      </Button>
    </div>
  );
}
