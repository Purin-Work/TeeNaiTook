'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, RefreshCw } from 'lucide-react';
import { useApi } from '@/lib/use-api';
import { api } from '@/lib/api';
import type { ScrapeJob } from '@/lib/admin-types';
import type { PageResult } from '@/lib/types';
import { dateTime } from '@/lib/utils';
import { AdminError, AdminLoading, AdminPagination, StatusBadge } from '@/components/admin/common';
import { ErrorMessage } from '@/components/states';
import { Button } from '@/components/ui/button';
export default function JobsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [mutationError, setMutationError] = useState('');
  const { data, loading, error, refresh } = useApi<PageResult<ScrapeJob>>(
    `/admin/scrape-jobs?page=${page}&limit=15`,
  );
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Scrape Jobs</h1>
          <p>ตรวจสอบผลการดึงราคาและข้อผิดพลาดราย Source</p>
        </div>
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setMutationError('');
            try {
              const job = await api<ScrapeJob>('/admin/scrape-jobs', { method: 'POST' });
              router.push(`/admin/scrape-jobs/${job.id}`);
            } catch (err) {
              setMutationError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Play />
          ดึงราคาทั้งหมด
        </Button>
      </div>
      <Button size="sm" variant="outline" onClick={refresh} disabled={loading} className="mb-5">
        <RefreshCw />
        รีเฟรช
      </Button>
      {mutationError && <ErrorMessage message={mutationError} />}
      {error ? (
        <AdminError error={error} retry={refresh} />
      ) : loading || !data ? (
        <AdminLoading />
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>เวลา</th>
                  <th>Trigger</th>
                  <th>สถานะ</th>
                  <th>สำเร็จ / ล้มเหลว</th>
                  <th>ระยะเวลา</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <Link href={`/admin/scrape-jobs/${job.id}`}>{dateTime(job.createdAt)}</Link>
                    </td>
                    <td>{job.triggerType}</td>
                    <td>
                      <StatusBadge status={job.status} />
                    </td>
                    <td>
                      {job.successCount} / {job.failureCount}
                    </td>
                    <td>
                      {job.startedAt && job.finishedAt
                        ? `${((new Date(job.finishedAt).getTime() - new Date(job.startedAt).getTime()) / 1000).toFixed(1)}s`
                        : '—'}
                    </td>
                  </tr>
                ))}
                {!data.data.length && (
                  <tr>
                    <td colSpan={5}>ยังไม่มีงานดึงราคา</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <AdminPagination page={page} totalPages={data.meta.totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}
