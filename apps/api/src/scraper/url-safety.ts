import { lookup } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';
import { AppError } from '../common/errors';

export const RETAILER_HOSTS: Record<string, readonly string[]> = {
  jib: ['jib.co.th', 'www.jib.co.th'],
  advice: ['advice.co.th', 'www.advice.co.th'],
  ihavecpu: ['ihavecpu.com', 'www.ihavecpu.com'],
};
export function validateRetailerUrl(raw: string, retailer: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new AppError('INVALID_RETAILER_URL', 'URL ไม่ถูกต้อง');
  }
  let path: string;
  try {
    path = decodeURIComponent(url.pathname);
  } catch {
    throw new AppError('INVALID_RETAILER_URL', 'URL ไม่ถูกต้อง');
  }
  if (
    url.protocol !== 'https:' ||
    url.port ||
    url.username ||
    url.password ||
    !RETAILER_HOSTS[retailer]?.includes(url.hostname) ||
    /(?:^|\/)(?:api|account|accounts|myaccount|login|auth|order|orders|checkout|payment|cart|member|admin|customer|users?)(?:[/.]|$)/i.test(
      path,
    ) ||
    /(?:token|password|session|auth|redirect|callback)/i.test(url.search) ||
    url.hash ||
    raw.length > 2048
  ) {
    throw new AppError(
      'INVALID_RETAILER_URL',
      'URL ไม่ตรงกับร้านค้าที่เลือก หรือไม่ใช่หน้าสินค้าสาธารณะ',
    );
  }
  return url;
}
export function isPublicAddress(address: string): boolean {
  try {
    let parsed = ipaddr.parse(address);
    if (parsed.kind() === 'ipv6' && (parsed as ipaddr.IPv6).isIPv4MappedAddress())
      parsed = (parsed as ipaddr.IPv6).toIPv4Address();
    return parsed.range() === 'unicast';
  } catch {
    return false;
  }
}
export async function resolvePublicHost(hostname: string) {
  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((entry) => !isPublicAddress(entry.address)))
    throw new AppError('INVALID_RETAILER_URL', 'ปลายทางเครือข่ายไม่ปลอดภัย');
  return addresses[0];
}
