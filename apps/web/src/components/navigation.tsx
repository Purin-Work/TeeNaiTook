'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { Brand } from './brand';
import { cn } from '@/lib/utils';
const links = [
  { href: '/', label: 'หน้าแรก' },
  { href: '/search', label: 'ค้นหาสินค้า' },
  { href: '/categories', label: 'หมวดหมู่' },
  { href: '/about', label: 'เกี่ยวกับเรา' },
];
export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="เมนูหลัก">
          {links.map((link) => (
            <Link
              className={cn(pathname === link.href && 'active')}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <span className="header-note"></span>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button className="mobile-menu icon-button" aria-label="เปิดเมนู">
              <Menu />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="drawer-overlay" />
            <Dialog.Content className="drawer-content">
              <Dialog.Title className="text-lg font-semibold">TeeNaiTook</Dialog.Title>
              <Dialog.Description className="muted text-sm mt-2">
                เช็กราคาไอที ก่อนตัดสินใจซื้อ
              </Dialog.Description>
              <Dialog.Close className="drawer-close icon-button" aria-label="ปิดเมนู">
                <X />
              </Dialog.Close>
              <nav className="drawer-links" aria-label="เมนูมือถือ">
                {links.map((link) => (
                  <Link href={link.href} key={link.href} onClick={() => setOpen(false)}>
                    {link.label}
                    <ArrowUpRight size={16} />
                  </Link>
                ))}
              </nav>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  );
}
