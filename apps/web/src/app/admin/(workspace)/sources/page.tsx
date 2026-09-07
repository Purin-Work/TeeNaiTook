'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import type { AdminSource } from '@/lib/admin-types';
import type { PageResult } from '@/lib/types';
import { useApi } from '@/lib/use-api';
import { money, dateTime } from '@/lib/utils';
import { AdminError, AdminLoading, AdminPagination } from '@/components/admin/common';
import { Button } from '@/components/ui/button';
export default function SourcesPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const { data, loading, error, refresh } = useApi<PageResult<AdminSource>>(
    `/admin/sources?page=${page}&limit=15&q=${encodeURIComponent(q)}`,
  );
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Product Sources</h1>
          <p>URL ร้านค้าและสถานะการตรวจสอบล่าสุด</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/products">
            <Plus />
            เพิ่มจากสินค้า
          </Link>
        </Button>
      </div>
      <form
        className="admin-search"
        onSubmit={(event) => {
          event.preventDefault();
          setQ(String(new FormData(event.currentTarget).get('q') || ''));
          setPage(1);
        }}
      >
        <input name="q" placeholder="ค้นหาชื่อสินค้า" aria-label="ค้นหา Source" />
        <Button type="submit" variant="outline">
          <Search />
          ค้นหา
        </Button>
      </form>
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
                  <th>สินค้า / ร้านค้า</th>
                  <th>ราคาปัจจุบัน</th>
                  <th>สำเร็จล่าสุด</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {s.product?.name}
                      <small>
                        {s.retailer.name}
                        {s.isDemo ? ' · DEMO' : ''}
                        {!s.isActive ? ' · INACTIVE' : ''}
                      </small>
                    </td>
                    <td>
                      {money(s.currentPrice)}
                      <small>
                        {s.lastError ||
                          (s.inStock
                            ? 'มีสินค้า'
                            : s.inStock === false
                              ? 'สินค้าหมด'
                              : 'ไม่ทราบสถานะ')}
                      </small>
                    </td>
                    <td>{dateTime(s.lastSuccessAt)}</td>
                    <td>
                      <Link href={`/admin/products/${s.productId}`}>แก้ไข / ทดสอบ</Link>
                    </td>
                  </tr>
                ))}
                {!data.data.length && (
                  <tr>
                    <td colSpan={4}>ยังไม่มี Source</td>
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
