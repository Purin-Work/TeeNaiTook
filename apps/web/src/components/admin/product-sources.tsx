'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Play, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { money, dateTime } from '@/lib/utils';
import type { AdminProduct, AdminSource, ScrapeJob } from '@/lib/admin-types';
import type { Retailer } from '@/lib/types';
import { Button } from '../ui/button';
import { ErrorMessage } from '../states';
export function ProductSources({
  product,
  onSaved,
}: {
  product: AdminProduct;
  onSaved?: () => void;
}) {
  const { data, error: retailerError } = useApi<{ data: Retailer[] }>('/admin/retailers');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <section className="source-section">
      <h2>Product Sources</h2>
      <p>จับคู่ URL หน้าสินค้าจริงกับร้านค้า แล้วทดสอบการดึงราคา</p>
      {retailerError && <ErrorMessage message={retailerError.message} />}
      {product.sources?.map((source) => (
        <SourceCard key={source.id} source={source} onSaved={onSaved} />
      ))}
      {product.isDemo ? (
        <p className="muted text-sm mt-5">
          ข้อมูลตัวอย่างไม่เชื่อมต่อร้านค้าจริง กรุณาสร้างสินค้าใหม่เพื่อเพิ่ม Source
        </p>
      ) : (
        <form
          className="panel admin-form mt-5"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const formData = new FormData(form);
            setError('');
            setBusy(true);
            try {
              await api('/admin/sources', {
                method: 'POST',
                body: JSON.stringify({
                  productId: product.id,
                  retailerId: formData.get('retailerId'),
                  url: formData.get('url'),
                }),
              });
              form.reset();
              onSaved?.();
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h3 className="text-base mb-5">เพิ่ม Source</h3>
          <label className="field">
            ร้านค้า
            <select name="retailerId" required defaultValue="">
              <option value="" disabled>
                เลือกร้านค้า
              </option>
              {data?.data
                .filter((r) => !product.sources?.some((s) => s.retailerId === r.id))
                .map((r) => (
                  <option value={r.id} key={r.id}>
                    {r.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="field">
            URL หน้าสินค้า
            <input
              name="url"
              type="url"
              required
              maxLength={2048}
              placeholder="https://www.jib.co.th/..."
            />
          </label>
          {error && <ErrorMessage message={error} />}
          <Button type="submit" disabled={busy || !data}>
            <Plus />
            {busy ? 'กำลังบันทึก…' : 'บันทึก Source'}
          </Button>
        </form>
      )}
    </section>
  );
}
function SourceCard({ source, onSaved }: { source: AdminSource; onSaved?: () => void }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <article className="source-card panel">
      <div className="source-card-top">
        <h3>{source.retailer.name}</h3>
        <span className="status-badge">
          {source.isDemo ? 'DEMO' : source.isActive ? 'ACTIVE' : 'INACTIVE'}
        </span>
      </div>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setError('');
          setBusy(true);
          try {
            await api(`/admin/sources/${source.id}`, {
              method: 'PATCH',
              body: JSON.stringify({
                url: form.get('url'),
                isActive: form.get('isActive') === 'on',
              }),
            });
            onSaved?.();
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="field">
          URL {source.retailer.name}
          <input
            name="url"
            type="url"
            defaultValue={source.url}
            required
            disabled={source.isDemo}
          />
        </label>
        <label className="checkbox-field">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked={source.isActive}
            disabled={source.isDemo}
          />
          เปิดการติดตาม
        </label>
        <div className="source-result">
          <span>
            ราคาล่าสุด <strong>{money(source.currentPrice)}</strong>
          </span>
          <span>
            สถานะ{' '}
            <strong>
              {source.inStock === true
                ? 'มีสินค้า'
                : source.inStock === false
                  ? 'สินค้าหมด'
                  : 'ยังไม่ทราบ'}
            </strong>
          </span>
          <span>
            สำเร็จล่าสุด <strong>{dateTime(source.lastSuccessAt)}</strong>
          </span>
        </div>
        {source.retailerProductName && (
          <p className="muted text-xs mb-3">ชื่อที่พบ: {source.retailerProductName}</p>
        )}
        {(error || source.lastError) && <ErrorMessage message={error || source.lastError!} />}
        <div className="form-actions">
          <Button type="submit" variant="outline" disabled={source.isDemo || busy}>
            <Save />
            บันทึกการแก้ไข
          </Button>
          <Button
            type="button"
            disabled={source.isDemo || !source.isActive || busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                const job = await api<ScrapeJob>(`/admin/sources/${source.id}/scrape`, {
                  method: 'POST',
                });
                router.push(`/admin/scrape-jobs/${job.id}`);
              } catch (err) {
                setError((err as Error).message);
                setBusy(false);
              }
            }}
          >
            <Play />
            {busy ? 'กำลังดำเนินการ…' : 'ทดสอบการดึงราคา'}
          </Button>
        </div>
      </form>
    </article>
  );
}
