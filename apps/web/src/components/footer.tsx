import Link from 'next/link';
import { Brand } from './brand';
import { standaloneDemoEnabled } from '@/lib/standalone-demo';
export function Footer() {
  const standaloneDemo = standaloneDemoEnabled();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Brand />
          </div>
          <div className="footer-links">
            <Link href="/search">ค้นหาสินค้า</Link>
            <Link href="/about">แหล่งข้อมูลและข้อจำกัด</Link>
            {!standaloneDemo && <Link href="/admin/login">Admin</Link>}
          </div>
        </div>
        <p className="footer-disclaimer">
          ราคาและสถานะสินค้าอาจมีการเปลี่ยนแปลง กรุณาตรวจสอบราคาล่าสุดกับร้านค้าก่อนสั่งซื้อ
          <br />
          ข้อมูลราคาบน TeeNaiTook ใช้เพื่อเปรียบเทียบราคาเท่านั้น เว็บไซต์ไม่ได้เป็นผู้จำหน่ายสินค้า
        </p>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} TeeNaiTook</span>
          <span>
            Made for your next upgrade. <span className="text-cyan-300">↗</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
