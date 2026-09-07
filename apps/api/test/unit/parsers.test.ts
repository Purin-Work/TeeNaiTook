import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parsePrice, parseStock, parseProductHtml } from '../../src/scraper/parsers';
import {
  JibScraper,
  AdviceScraper,
  IHaveCpuScraper,
  ScraperRegistry,
} from '../../src/scraper/adapters/retailers';
const fixture = readFileSync('test/fixtures/product.html', 'utf8');
test('THB prices preserve cents and reject malformed or installment amounts', () => {
  for (const value of ['17,900', '฿17,900', '17,900 บาท', '17,900.00', 17900])
    assert.equal(parsePrice(value), '17900.00');
  assert.equal(parsePrice('1,234.56'), '1234.56');
  for (const value of [
    '17,90',
    '1.799,00',
    '1790 / เดือน',
    'ผ่อน 1,790',
    '-5',
    '0',
    'NaN',
    '10.001',
    '1e3',
    '17900 18000',
    Infinity,
    null,
    {},
    '10000000000',
  ])
    assert.equal(parsePrice(value), null, String(value));
});
test('stock parsing is conservative', () => {
  for (const value of ['InStock', 'https://schema.org/InStock', 'มีสินค้า'])
    assert.equal(parseStock(value), true);
  for (const value of ['OutOfStock', 'สินค้าหมด', 'https://schema.org/Discontinued'])
    assert.equal(parseStock(value), false);
  for (const value of ['PreOrder', 'สอบถาม', 'limited stock', undefined, 'not in stock'])
    assert.equal(parseStock(value), null);
});
for (const adapter of [new JibScraper(), new AdviceScraper(), new IHaveCpuScraper()]) {
  test(`${adapter.retailer}: JSON-LD, out of stock, sale price, metadata fallback, malformed document`, () => {
    const normal = adapter.parse(fixture);
    assert.equal(normal.price, '17490.00');
    assert.equal(normal.inStock, true);
    assert.equal(normal.parser, 'json-ld');
    assert.equal(normal.retailerSku, 'FIXTURE-CPU');
    assert.equal(adapter.parse(fixture.replace('InStock', 'OutOfStock')).inStock, false);
    assert.equal(adapter.parse(fixture.replace('17490.00', '14990.00')).price, '14990.00');
    const meta = adapter.parse(
      '<meta property="product:price:amount" content="8900"><meta property="product:availability" content="InStock">',
    );
    assert.equal(meta.price, '8900.00');
    assert.equal(meta.parser, 'meta');
    assert.throws(() => adapter.parse('<script type="application/ld+json">{bad</script>'));
    assert.throws(() => adapter.parse('<title>Just a moment...</title>'));
    assert.throws(() => adapter.parse(fixture.replace('THB', 'USD')));
    assert.throws(() => adapter.parse(fixture.replace('17490.00', '17,49')));
    assert.equal(adapter.supports(adapter.retailer), true);
  });
}
test('parser refuses ambiguous variants and does not guess unknown stock', () => {
  assert.throws(() => parseProductHtml(fixture + fixture.replace('17490.00', '18900.00')));
  assert.equal(parseProductHtml(fixture.replace('InStock', 'PreOrder')).inStock, null);
  assert.throws(() => parseProductHtml(fixture.replace('"price":', '"lowPrice":')));
  assert.throws(() => new ScraperRegistry().get('unapproved'));
});
