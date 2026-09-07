import Link from 'next/link';
import { Database, SearchX, AlertCircle, FlaskConical } from 'lucide-react';
import { Button } from './ui/button';
export function DemoNotice() {
  return (
    <div className="demo-notice">
      <FlaskConical size={16} />
      <span>
        <strong>โหมดสาธิต</strong> ราคาและประวัติเป็นข้อมูลตัวอย่าง ไม่ใช่ราคาจริงจากร้านค้า
      </span>
    </div>
  );
}
export function EmptyState({
  title = 'ไม่พบสินค้าที่ค้นหา',
  description = 'ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง แล้วค้นหาอีกครั้ง',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="empty-state">
      <SearchX size={32} />
      <h2>{title}</h2>
      <p>{description}</p>
      <Button asChild variant="outline">
        <Link href="/search">ดูสินค้าทั้งหมด</Link>
      </Button>
    </div>
  );
}
export function ApiUnavailable() {
  return (
    <div className="empty-state">
      <Database size={32} />
      <h2>ไม่สามารถโหลดข้อมูลได้</h2>
      <p>กรุณาลองใหม่อีกครั้งในอีกสักครู่</p>
      <Button asChild variant="outline">
        <a href="/">ลองใหม่</a>
      </Button>
    </div>
  );
}
export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="error-message" role="alert">
      <AlertCircle size={18} />
      <span>{message}</span>
    </div>
  );
}
