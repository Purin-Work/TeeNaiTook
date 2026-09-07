import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...values: ClassValue[]) {
  return twMerge(clsx(values));
}
export function money(value: string | number | null | undefined) {
  return value == null
    ? 'ยังไม่มีราคา'
    : new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        maximumFractionDigits: 0,
      }).format(Number(value));
}
export function dateTime(value: string | null | undefined) {
  return value
    ? new Intl.DateTimeFormat('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Bangkok',
      }).format(new Date(value))
    : 'ยังไม่ได้ตรวจสอบ';
}
export function relativeTime(value: string | null) {
  if (!value) return 'ยังไม่ได้ตรวจสอบ';
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return 'เมื่อสักครู่';
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(minutes / 1440)} วันที่แล้ว`;
}
