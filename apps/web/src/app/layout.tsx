import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';
import { siteUrl } from '@/lib/site-url';
import './globals.css';
const notoThai = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource/noto-sans-thai/files/noto-sans-thai-thai-400-normal.woff2',
      weight: '400',
    },
    {
      path: '../../node_modules/@fontsource/noto-sans-thai/files/noto-sans-thai-thai-500-normal.woff2',
      weight: '500',
    },
    {
      path: '../../node_modules/@fontsource/noto-sans-thai/files/noto-sans-thai-thai-600-normal.woff2',
      weight: '600',
    },
    {
      path: '../../node_modules/@fontsource/noto-sans-thai/files/noto-sans-thai-thai-700-normal.woff2',
      weight: '700',
    },
  ],
  variable: '--font-thai',
  display: 'swap',
  fallback: ['Arial', 'sans-serif'],
});
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: 'TeeNaiTook | เช็กราคา CPU GPU RAM SSD', template: '%s | TeeNaiTook' },
  description:
    'เปรียบเทียบราคาสินค้าไอทีจาก JIB, Advice และ iHAVECPU พร้อมดูประวัติราคาก่อนตัดสินใจซื้อ',
  openGraph: { siteName: 'TeeNaiTook', locale: 'th_TH', type: 'website' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={notoThai.variable}>
      <body>
        <a className="skip-link" href="#main">
          ข้ามไปยังเนื้อหา
        </a>
        <Navigation />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
