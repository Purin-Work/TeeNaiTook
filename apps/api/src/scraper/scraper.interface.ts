export type ParsedProduct = {
  retailerProductName: string | null;
  retailerSku: string | null;
  price: string | null;
  regularPrice: string | null;
  inStock: boolean | null;
  parser: 'json-ld' | 'meta' | 'selectors';
};
export interface RetailerScraper {
  readonly retailer: string;
  supports(slug: string): boolean;
  parse(html: string): ParsedProduct;
}
