'use client';
import { use } from 'react';
import { ProductEditor } from '@/components/admin/product-editor';
import { AdminError, AdminLoading } from '@/components/admin/common';
import { useApi } from '@/lib/use-api';
import type { AdminProduct } from '@/lib/admin-types';
export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error, refresh } = useApi<AdminProduct>(`/admin/products/${id}`);
  if (error) return <AdminError error={error} retry={refresh} />;
  if (!data) return <AdminLoading />;
  return <ProductEditor product={data} onSaved={refresh} />;
}
