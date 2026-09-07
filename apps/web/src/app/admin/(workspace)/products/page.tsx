'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { useApi } from '@/lib/use-api';
import type { AdminProduct } from '@/lib/admin-types';
import type { PageResult } from '@/lib/types';
import { AdminError, AdminLoading, AdminPagination } from '@/components/admin/common';
import { Button } from '@/components/ui/button';
export default function ProductsPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data, error, loading, refresh } = useApi<PageResult<AdminProduct>>(
    `/admin/products?q=${encodeURIComponent(q)}&page=${page}&limit=15`,
  );
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Products</h1>
          <p>จัดการข้อมูลกลางของสินค้า</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus />
            เพิ่มสินค้า
          </Link>
        </Button>
      </div>
      <form
        className="admin-search"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(String(new FormData(e.currentTarget).get('q') || ''));
          setPage(1);
        }}
      >
        <input name="q" aria-label="ค้นหาสินค้าในระบบ" placeholder="ค้นหาชื่อสินค้าหรือ slug" />
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
                  <th>สินค้า</th>
                  <th>หมวดหมู่</th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.name}
                      <small>
                        {p.modelNumber || p.slug}
                        {p.isDemo ? ' · DEMO' : ''}
                      </small>
                    </td>
                    <td>
                      {p.category}
                      <small>{p.brand}</small>
                    </td>
                    <td>{p.isActive ? 'เปิดใช้งาน' : 'เก็บถาวร'}</td>
                    <td>
                      <Link href={`/admin/products/${p.id}`}>แก้ไข / Sources</Link>
                    </td>
                  </tr>
                ))}
                {!data.data.length && (
                  <tr>
                    <td colSpan={4}>ไม่พบสินค้า</td>
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
