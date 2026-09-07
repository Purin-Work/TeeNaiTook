'use client';
import Link from 'next/link';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { useApi } from '@/lib/use-api';
import { dateTime } from '@/lib/utils';
import { AdminError, AdminLoading, StatusBadge } from '@/components/admin/common';
import { Button } from '@/components/ui/button';
type Dashboard = {
  products: number;
  activeSources: number;
  snapshots: number;
  failedScrapes: number;
  successRate: number | null;
  lastScrape: { id: string; status: string; createdAt: string } | null;
};
export default function DashboardPage() {
  const { data, loading, error, refresh } = useApi<Dashboard>('/admin/dashboard');
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Dashboard</h1>
          <p>ภาพรวมการติดตามราคาสินค้า</p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw />
          รีเฟรช
        </Button>
      </div>
      {error ? (
        <AdminError error={error} retry={refresh} />
      ) : !data ? (
        <AdminLoading />
      ) : (
        <>
          <div className="admin-metrics">
            {[
              ['สินค้าทั้งหมด', data.products],
              ['Source จริงที่เปิดใช้งาน', data.activeSources],
              ['Price snapshots', data.snapshots.toLocaleString()],
              ['อัตราดึงราคาสำเร็จ', data.successRate === null ? '—' : `${data.successRate}%`],
              ['ผลลัพธ์ที่ล้มเหลว / ไม่ครบ', data.failedScrapes],
            ].map(([label, value]) => (
              <div className="metric-card panel" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
            <div className="metric-card panel">
              <span>งานดึงราคาล่าสุด</span>
              {data.lastScrape ? (
                <>
                  <p>{dateTime(data.lastScrape.createdAt)}</p>
                  <div className="mt-4">
                    <StatusBadge status={data.lastScrape.status} />
                  </div>
                  <Link
                    className="text-link mt-4"
                    href={`/admin/scrape-jobs/${data.lastScrape.id}`}
                  >
                    ดูผลลัพธ์ <ArrowUpRight size={14} />
                  </Link>
                </>
              ) : (
                <p>ยังไม่มีงานดึงราคา</p>
              )}
            </div>
          </div>
          <div className="panel p-6 mt-6">
            <h2 className="text-lg mb-3">เริ่มติดตามสินค้าจริง</h2>
            <p className="muted text-sm leading-7">
              สร้างสินค้า → เพิ่ม URL ร้านค้า → ทดสอบดึงราคา → ตรวจสอบผลใน Scrape Jobs
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link href="/admin/products/new">
                เพิ่มสินค้าใหม่ <ArrowUpRight />
              </Link>
            </Button>
          </div>
        </>
      )}
    </>
  );
}
