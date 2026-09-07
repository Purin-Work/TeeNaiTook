import { load } from 'cheerio';
import type { ParsedProduct } from './scraper.interface';
import { AppError } from '../common/errors';

export function parsePrice(input: unknown): string | null {
  if (typeof input !== 'string' && typeof input !== 'number') return null;
  const raw = String(input).trim();
  if (/ผ่อน|เดือน|installment|monthly|\//i.test(raw)) return null;
  const value = raw
    .replace(/^(?:฿|THB)\s*/i, '')
    .replace(/\s*(?:บาท|THB)$/i, '')
    .trim();
  if (!/^(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?$/.test(value)) return null;
  const number = Number(value.replaceAll(',', ''));
  if (!Number.isFinite(number) || number <= 0 || number >= 1e10) return null;
  return number.toFixed(2);
}
export function parseStock(input: unknown): boolean | null {
  if (typeof input !== 'string') return null;
  const value = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/schema.org\//, '');
  if (
    [
      'outofstock',
      'soldout',
      'discontinued',
      'out of stock',
      'สินค้าหมด',
      'หมดชั่วคราว',
      'ไม่มีสินค้า',
    ].includes(value)
  )
    return false;
  if (['instock', 'in stock', 'มีสินค้า', 'พร้อมจำหน่าย'].includes(value)) return true;
  return null;
}
function object(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
function products(value: unknown, depth = 0): Record<string, unknown>[] {
  if (depth > 12) return [];
  if (Array.isArray(value)) return value.flatMap((v) => products(v, depth + 1));
  const node = object(value);
  if (!node) return [];
  const type = node['@type'];
  if (type === 'Product' || (Array.isArray(type) && type.includes('Product'))) return [node];
  return ['@graph', 'mainEntity', 'itemListElement', 'item'].flatMap((key) =>
    products(node[key], depth + 1),
  );
}
const textValue = (value: unknown) => (typeof value === 'string' ? value.slice(0, 300) : null);

export function parseProductHtml(
  html: string,
  selectors?: { price: string; stock: string },
): ParsedProduct {
  const $ = load(html);
  if (/captcha|just a moment|access denied|verify you are human/i.test($('title').text()))
    throw new AppError('SCRAPER_BLOCKED', 'ร้านค้าปฏิเสธการเข้าถึงอัตโนมัติ', 422);
  const candidates: ParsedProduct[] = [];
  $('script[type="application/ld+json"]').each((_, element) => {
    let json: unknown;
    try {
      json = JSON.parse($(element).text());
    } catch {
      return;
    }
    for (const product of products(json)) {
      const rawOffers = Array.isArray(product.offers) ? product.offers : [product.offers];
      for (const raw of rawOffers) {
        const offer = object(raw);
        if (!offer || (offer.priceCurrency && offer.priceCurrency !== 'THB')) continue;
        // Do not substitute AggregateOffer.lowPrice: it can refer to a different variant.
        const price = parsePrice(offer.price);
        if (!price) continue;
        candidates.push({
          retailerProductName: textValue(product.name),
          retailerSku: textValue(product.sku),
          price,
          regularPrice: null,
          inStock: parseStock(offer.availability),
          parser: 'json-ld',
        });
      }
    }
  });
  if (candidates.length) {
    const distinct = new Set(candidates.map((c) => `${c.price}:${c.inStock}`));
    if (distinct.size > 1)
      throw new AppError(
        'SCRAPER_AMBIGUOUS_PRODUCT',
        'พบหลายราคาหรือหลายตัวเลือก กรุณาตรวจสอบ URL สินค้า',
        422,
      );
    return candidates[0];
  }
  const meta = (key: string) =>
    $(`meta[property="${key}"],meta[name="${key}"]`).first().attr('content');
  const currency = meta('product:price:currency') || meta('og:price:currency');
  const price =
    currency && currency !== 'THB'
      ? null
      : parsePrice(meta('product:price:amount') || meta('og:price:amount'));
  if (price)
    return {
      retailerProductName: textValue(meta('og:title')),
      retailerSku: null,
      price,
      regularPrice: null,
      inStock: parseStock(meta('product:availability')),
      parser: 'meta',
    };
  if (selectors) {
    const fallback = parsePrice($(selectors.price).first().text());
    if (fallback)
      return {
        retailerProductName: textValue($('h1').first().text()),
        retailerSku: null,
        price: fallback,
        regularPrice: null,
        inStock: parseStock($(selectors.stock).first().text()),
        parser: 'selectors',
      };
  }
  throw new AppError('SCRAPER_PARSE_ERROR', 'ไม่พบราคาสินค้าที่ตรวจสอบได้', 422);
}
