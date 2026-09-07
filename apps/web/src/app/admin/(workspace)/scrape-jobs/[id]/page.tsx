'use client';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useApi } from '@/lib/use-api';
import type { ScrapeJob } from '@/lib/admin-types';
import { money, dateTime } from '@/lib/utils';
import { AdminError, AdminLoading, AdminPagination, StatusBadge } from '@/components/admin/common';
import { Button } from '@/components/ui/button';
export default function JobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [page, setPage] = useState(1);
  const { data, error, refresh } = useApi<ScrapeJob>(
    `/admin/scrape-jobs/${id}?page=${page}&limit=20`,
  );
  useEffect(() => {
    if (data && ['PENDING', 'RUNNING'].includes(data.status)) {
      const timer = setTimeout(refresh, 2000);
      return () => clearTimeout(timer);
    }
  }, [data, refresh]);
  if (error) return <AdminError error={error} retry={refresh} />;
  if (!data) return <AdminLoading />;
  return (
    <>
      <div className="admin-heading">
        <div>
          <Link href="/admin/scrape-jobs" className="text-link mb-3">
            <ArrowLeft size={13} /> Scrape Jobs
          </Link>
          <h1>ผลการดึงราคา</h1>
          <p>
            {dateTime(data.createdAt)} · {data.triggerType}
          </p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm">
          <RefreshCw />
          รีเฟรช
        </Button>
      </div>
      <div className="panel p-6 mb-6">
        <div className="flex items-center gap-4">
          <StatusBadge status={data.status} />
          <span className="muted text-xs">Source ทั้งหมด {data.totalSources}</span>
        </div>
        <p className="mt-4 text-sm">
          สำเร็จ {data.successCount} · ล้มเหลว / ข้อมูลไม่ครบ {data.failureCount}
        </p>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ร้านค้า / สินค้า</th>
              <th>ผลลัพธ์</th>
              <th>ราคา / Parser</th>
              <th>เวลา</th>
            </tr>
          </thead>
          <tbody>
            {data.logs?.data.map((log) => (
              <tr key={log.id}>
                <td>
                  {log.retailer?.name || 'ระบบ'}
                  <small>{log.productSource?.product.name}</small>
                </td>
                <td>
                  <StatusBadge status={log.level} />
                  <p className="mt-2 max-w-72 leading-6" data-testid="scrape-result">
                    {log.message}
                  </p>
                  {log.retailerProductName && <small>ชื่อที่พบ: {log.retailerProductName}</small>}
                </td>
                <td>
                  {money(log.price)}
                  <small>{log.parser || '—'}</small>
                </td>
                <td>{log.durationMs === null ? '—' : `${log.durationMs} ms`}</td>
              </tr>
            ))}
            {!data.logs?.data.length && (
              <tr>
                <td colSpan={4}>
                  {['PENDING', 'RUNNING'].includes(data.status)
                    ? 'กำลังตรวจสอบ Source…'
                    : 'ไม่มี Source ที่ต้องตรวจสอบ'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <AdminPagination
        page={page}
        totalPages={data.logs?.meta.totalPages || 0}
        onChange={setPage}
      />
    </>
  );
}
