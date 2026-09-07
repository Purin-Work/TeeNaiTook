export default function Loading() {
  return (
    <div className="container page-content" role="status" aria-label="กำลังโหลดข้อมูล">
      <div className="skeleton h-12 w-64 mb-6" />
      <div className="skeleton h-16 mb-8" />
      <div className="product-grid">
        {[1, 2, 3, 4].map((i) => (
          <div className="skeleton h-80" key={i} />
        ))}
      </div>
      <span className="sr-only">กำลังโหลดข้อมูล</span>
    </div>
  );
}
