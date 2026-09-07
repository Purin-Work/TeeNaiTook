import { SearchResults, type SearchParams } from '@/components/search-results';
export const metadata = { title: 'ค้นหาสินค้า', robots: { index: false } };
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <div className="container page-content">
      <div className="page-heading">
        <h1>ค้นหาสินค้า</h1>
        <p>ของที่ใช่ ในราคาที่ชอบ</p>
      </div>
      <SearchResults params={await searchParams} />
    </div>
  );
}
