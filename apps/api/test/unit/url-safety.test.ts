import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPublicAddress, validateRetailerUrl } from '../../src/scraper/url-safety';
test('only exact retailer HTTPS public hosts and paths are accepted', () => {
  assert.equal(
    validateRetailerUrl('https://www.jib.co.th/web/product/readProduct/123', 'jib').hostname,
    'www.jib.co.th',
  );
  for (const value of [
    'http://www.jib.co.th/product',
    'https://jib.co.th.attacker.test/x',
    'https://eviljib.co.th/x',
    'https://www.advice.co.th/x',
    'https://127.0.0.1/x',
    'https://[::1]/x',
    'https://169.254.169.254/latest/meta-data',
    'https://www.jib.co.th:444/x',
    'https://user:password@www.jib.co.th/x',
    'https://www.jib.co.th/api/products',
    'https://www.jib.co.th/%61ccount/profile',
    'https://www.jib.co.th/checkout',
    'https://www.jib.co.th/x?token=secret',
    'https://www.jib.co.th/x#secret',
    'not a url',
  ])
    assert.throws(() => validateRetailerUrl(value, 'jib'), value);
});
test('rejects private, link-local, loopback, mapped IPv4, multicast and special IPs', () => {
  for (const value of [
    '127.0.0.1',
    '10.0.0.1',
    '172.16.0.1',
    '192.168.0.2',
    '169.254.169.254',
    '0.0.0.0',
    '100.64.0.1',
    '224.0.0.1',
    '::1',
    'fe80::1',
    'fc00::1',
    '::ffff:127.0.0.1',
    '::ffff:10.0.0.1',
    'invalid',
  ])
    assert.equal(isPublicAddress(value), false, value);
  assert.equal(isPublicAddress('1.1.1.1'), true);
  assert.equal(isPublicAddress('2606:4700:4700::1111'), true);
});
