'use client';
import { useState } from 'react';
import type { Retailer } from '@/lib/types';
import { useApi } from '@/lib/use-api';
import { api } from '@/lib/api';
import { AdminError, AdminLoading } from '@/components/admin/common';
import { ErrorMessage } from '@/components/states';
import { Button } from '@/components/ui/button';
export default function RetailersPage() {
  const { data, loading, error, refresh } = useApi<{ data: Retailer[] }>('/admin/retailers');
  const [busy, setBusy] = useState('');
  const [mutationError, setMutationError] = useState('');
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Retailers</h1>
          <p>ร้านค้าที่รองรับและสถานะการติดตาม</p>
        </div>
      </div>
      {mutationError && <ErrorMessage message={mutationError} />}
      {error ? (
        <AdminError error={error} retry={refresh} />
      ) : loading || !data ? (
        <AdminLoading />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ร้านค้า</th>
                <th>เว็บไซต์</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((retailer) => (
                <tr key={retailer.id}>
                  <td>{retailer.name}</td>
                  <td>{new URL(retailer.baseUrl).hostname}</td>
                  <td>{retailer.isActive ? 'เปิดใช้งาน' : 'หยุดติดตาม'}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!busy}
                      onClick={async () => {
                        setBusy(retailer.id);
                        setMutationError('');
                        try {
                          await api(`/admin/retailers/${retailer.id}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ isActive: !retailer.isActive }),
                          });
                          refresh();
                        } catch (err) {
                          setMutationError((err as Error).message);
                        } finally {
                          setBusy('');
                        }
                      }}
                    >
                      {retailer.isActive ? 'หยุดติดตาม' : 'เปิดใช้งาน'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
