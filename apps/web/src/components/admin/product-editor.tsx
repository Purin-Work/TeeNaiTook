'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft, LoaderCircle } from 'lucide-react';
import { api } from '@/lib/api';
import type { AdminProduct } from '@/lib/admin-types';
import { ErrorMessage } from '../states';
import { Button } from '../ui/button';
import { ProductSources } from './product-sources';

const schema = z.object({
  name: z.string().min(2, 'กรุณากรอกชื่อสินค้า').max(200),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'ใช้ a-z, ตัวเลข และขีดกลางเท่านั้น')
    .max(180),
  brand: z.string().min(1, 'กรุณากรอกแบรนด์').max(60),
  category: z.enum(['CPU', 'GPU', 'RAM', 'SSD']),
  modelNumber: z.string().max(100),
  description: z.string().max(2000),
  isActive: z.boolean(),
  specs: z.string().refine((value) => {
    try {
      const parsed: unknown = JSON.parse(value || '{}');
      return (
        typeof parsed === 'object' &&
        parsed !== null &&
        !Array.isArray(parsed) &&
        Object.values(parsed).every((v) => ['string', 'number', 'boolean'].includes(typeof v))
      );
    } catch {
      return false;
    }
  }, 'กรุณากรอก JSON object เช่น {"Socket":"AM5"}'),
});
type Values = z.infer<typeof schema>;
export function ProductEditor({
  product,
  onSaved,
}: {
  product?: AdminProduct;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name || '',
      slug: product?.slug || '',
      brand: product?.brand || '',
      category: product?.category || 'CPU',
      modelNumber: product?.modelNumber || '',
      description: product?.description || '',
      specs: JSON.stringify(product?.specs || {}, null, 2),
      isActive: product?.isActive ?? true,
    },
  });
  const save = async (values: Values) => {
    setError('');
    setSaved(false);
    try {
      const result = await api<AdminProduct>(
        product ? `/admin/products/${product.id}` : '/admin/products',
        {
          method: product ? 'PATCH' : 'POST',
          body: JSON.stringify({ ...values, specs: JSON.parse(values.specs || '{}') }),
        },
      );
      if (!product) router.replace(`/admin/products/${result.id}`);
      else {
        setSaved(true);
        onSaved?.();
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };
  return (
    <>
      <div className="admin-heading">
        <div>
          <Link className="text-link mb-3" href="/admin/products">
            <ArrowLeft size={13} /> Products
          </Link>
          <h1>{product ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h1>
          <p>
            {product?.isDemo
              ? 'ข้อมูลตัวอย่าง · แยกจากสินค้าจริง'
              : 'ข้อมูลกลางใช้จับคู่รุ่นเดียวกันจากแต่ละร้านค้า'}
          </p>
        </div>
      </div>
      <form className="admin-form panel" onSubmit={handleSubmit(save)}>
        <div className="form-grid">
          <label className="field span-full">
            ชื่อสินค้า
            <input
              {...register('name', {
                onChange: () => {
                  if (!product && !dirtyFields.slug)
                    setValue(
                      'slug',
                      getValues('name')
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, ''),
                      { shouldValidate: true },
                    );
                },
              })}
              placeholder="เช่น AMD Ryzen 7 9800X3D"
              aria-invalid={!!errors.name}
            />
            {errors.name && <span className="field-error">{errors.name.message}</span>}
          </label>
          <label className="field">
            Slug
            <input
              {...register('slug')}
              placeholder="amd-ryzen-7-9800x3d"
              aria-invalid={!!errors.slug}
            />
            {errors.slug && <span className="field-error">{errors.slug.message}</span>}
          </label>
          <label className="field">
            แบรนด์
            <input {...register('brand')} placeholder="AMD" aria-invalid={!!errors.brand} />
            {errors.brand && <span className="field-error">{errors.brand.message}</span>}
          </label>
          <label className="field">
            หมวดหมู่
            <select {...register('category')}>
              {['CPU', 'GPU', 'RAM', 'SSD'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            รหัสรุ่น / MPN
            <input {...register('modelNumber')} />
          </label>
          <label className="field span-full">
            คำอธิบาย
            <textarea {...register('description')} placeholder="ข้อมูลสินค้าโดย TeeNaiTook" />
          </label>
          <label className="field span-full">
            ข้อมูลจำเพาะ (JSON)
            <textarea {...register('specs')} className="font-mono" aria-invalid={!!errors.specs} />
            {errors.specs && <span className="field-error">{errors.specs.message}</span>}
          </label>
        </div>
        <label className="checkbox-field">
          <input type="checkbox" {...register('isActive')} />
          เปิดใช้งานสินค้า (นำเครื่องหมายออกเพื่อเก็บถาวร)
        </label>
        {error && <ErrorMessage message={error} />}
        {saved && (
          <p role="status" className="positive text-sm mb-4">
            บันทึกสินค้าเรียบร้อยแล้ว
          </p>
        )}
        <div className="form-actions">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LoaderCircle className="spin" /> : <Save />}บันทึกสินค้า
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/products">กลับรายการ</Link>
          </Button>
        </div>
      </form>
      {product && <ProductSources product={product} onSaved={onSaved} />}
    </>
  );
}
