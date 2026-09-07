import Link from 'next/link';
import { CpuMark } from '@/components/cpu-mark';
import { Button } from '@/components/ui/button';
import { standaloneDemoEnabled } from '@/lib/standalone-demo';

export const metadata = { title: 'Admin', robots: { index: false, follow: false } };
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (standaloneDemoEnabled()) {
    return (
      <section className="login-wrap panel standalone-admin-note">
        <CpuMark className="text-cyan-300 cpu-mark-on-dark" size={42} />
        <h1>โหมดสาธิตสำหรับ Portfolio</h1>
        <p>
          เวอร์ชันบน Vercel เปิดให้ทดลองค้นหา เปรียบเทียบ และดูประวัติราคาแบบอ่านอย่างเดียว ระบบ
          Admin การบันทึกข้อมูล และงานดึงราคาอยู่ในโหมด Full stack ที่ใช้ NestJS และ PostgreSQL
        </p>
        <Button asChild className="w-full">
          <Link href="/">กลับไปทดลองหน้าเว็บไซต์</Link>
        </Button>
      </section>
    );
  }
  return children;
}
