'use client';
import { Button } from '../ui/button';
import { ErrorMessage } from '../states';
export function AdminLoading() {
  return <div className="skeleton h-52" role="status" aria-label="กำลังโหลดข้อมูล" />;
}
export function AdminError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <>
      <ErrorMessage message={error.message} />
      <Button variant="outline" onClick={retry}>
        ลองใหม่
      </Button>
    </>
  );
}
export function AdminPagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="pagination">
      <Button variant="outline" size="sm" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        ก่อนหน้า
      </Button>
      <span>
        หน้า {page} / {Math.max(1, totalPages)}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        ถัดไป
      </Button>
    </div>
  );
}
export function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status}`}>{status}</span>;
}
