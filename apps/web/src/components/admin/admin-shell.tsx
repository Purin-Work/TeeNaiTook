'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { LayoutDashboard, Package, Store, Link2, Activity, LogOut, Menu, X } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useApi } from '@/lib/use-api';
import { ErrorMessage } from '../states';
import { CpuMark } from '../cpu-mark';
const links = [
  { href: '/admin', title: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', title: 'Products', icon: Package },
  { href: '/admin/retailers', title: 'Retailers', icon: Store },
  { href: '/admin/sources', title: 'Product Sources', icon: Link2 },
  { href: '/admin/scrape-jobs', title: 'Scrape Jobs', icon: Activity },
];
export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const { data, error, loading } = useApi<{ user: { email: string } }>('/auth/me');
  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) router.replace('/admin/login');
  }, [error, router]);
  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
      router.replace('/admin/login');
    } catch (err) {
      setLogoutError((err as Error).message);
    }
  };
  if (loading)
    return (
      <div className="container page-content">
        <div className="skeleton h-40" role="status" aria-label="กำลังตรวจสอบสิทธิ์" />
      </div>
    );
  if (error || !data)
    return (
      <div className="container page-content">
        <ErrorMessage message={error?.message || 'กรุณาเข้าสู่ระบบ'} />
      </div>
    );
  const navigation = (
    <>
      {links.map(({ href, title, icon: Icon }) => (
        <Link
          href={href}
          key={href}
          onClick={() => setOpen(false)}
          className={
            pathname === href || (href !== '/admin' && pathname.startsWith(href)) ? 'active' : ''
          }
        >
          <Icon size={17} />
          {title}
        </Link>
      ))}
    </>
  );
  return (
    <div className="container">
      <div className="admin-mobile-bar">
        <span className="admin-brand-label">
          <CpuMark size={22} /> Admin workspace
        </span>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button className="icon-button" aria-label="เปิดเมนูผู้ดูแล">
              <Menu size={19} />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="drawer-overlay" />
            <Dialog.Content className="drawer-content">
              <Dialog.Title className="admin-brand-label">
                <CpuMark size={24} /> Admin workspace
              </Dialog.Title>
              <Dialog.Description className="muted text-xs mt-3">
                จัดการสินค้าและการติดตามราคา
              </Dialog.Description>
              <Dialog.Close className="drawer-close icon-button" aria-label="ปิดเมนูผู้ดูแล">
                <X size={18} />
              </Dialog.Close>
              <nav className="drawer-links">
                {navigation}
                <button onClick={logout}>ออกจากระบบ</button>
              </nav>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <p className="eyebrow admin-brand-label">
            <CpuMark size={20} /> ADMIN WORKSPACE
          </p>
          <nav>{navigation}</nav>
          <button onClick={logout}>
            <LogOut size={16} />
            ออกจากระบบ
          </button>
          <span className="block muted text-[9px] break-all mt-6">{data.user.email}</span>
        </aside>
        <div className="admin-main">
          {logoutError && <ErrorMessage message={logoutError} />}
          {children}
        </div>
      </div>
    </div>
  );
}
