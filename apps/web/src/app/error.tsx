'use client';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container empty-state">
      <AlertCircle size={36} />
      <h1>ไม่สามารถโหลดข้อมูลได้</h1>
      <p>กรุณาลองใหม่อีกครั้ง</p>
      <Button onClick={reset}>ลองใหม่</Button>
    </div>
  );
}
