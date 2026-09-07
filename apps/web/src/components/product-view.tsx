'use client';
import { useEffect } from 'react';
import { api } from '@/lib/api';
export function ProductView({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `tnt-view:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
      void api(`/products/${slug}/view`, { method: 'POST' }).catch(() => {
        try {
          sessionStorage.removeItem(key);
        } catch {
          /* Storage access may have been revoked. */
        }
      });
    } catch {
      /* Browsing remains available when session storage is blocked. */
    }
  }, [slug]);
  return null;
}
