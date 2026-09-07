import { Injectable } from '@nestjs/common';
import { request as httpsRequest } from 'node:https';
import { setTimeout as delay } from 'node:timers/promises';
import { getConfig } from '../common/config';
import { AppError } from '../common/errors';
import { resolvePublicHost, validateRetailerUrl } from './url-safety';

@Injectable()
export class SafeHttpClient {
  async fetchHtml(raw: string, retailer: string): Promise<string> {
    let current = validateRetailerUrl(raw, retailer);
    for (let redirect = 0; redirect <= 3; redirect++) {
      let response: { body: string; location?: string; status: number } | undefined;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          response = await this.once(current);
          if ([502, 503, 504].includes(response.status) && attempt < 2) {
            await delay(1000 * 2 ** attempt);
            continue;
          }
          break;
        } catch (error) {
          if (
            error instanceof AppError &&
            ['SCRAPER_TIMEOUT', 'SCRAPER_NETWORK_ERROR'].includes(
              (error.getResponse() as { code: string }).code,
            ) &&
            attempt < 2
          ) {
            await delay(1000 * 2 ** attempt);
            continue;
          }
          throw error;
        }
      }
      if (!response) throw new AppError('SCRAPER_HTTP_ERROR', 'ไม่สามารถเชื่อมต่อร้านค้า', 422);
      if ([301, 302, 303, 307, 308].includes(response.status) && response.location) {
        current = validateRetailerUrl(new URL(response.location, current).href, retailer);
        continue;
      }
      if ([401, 403, 429].includes(response.status))
        throw new AppError(
          'SCRAPER_BLOCKED',
          `ร้านค้าจำกัดการเข้าถึง (HTTP ${response.status})`,
          422,
        );
      if (response.status !== 200)
        throw new AppError('SCRAPER_HTTP_ERROR', `ร้านค้าตอบกลับ HTTP ${response.status}`, 422);
      return response.body;
    }
    throw new AppError('SCRAPER_REDIRECT_LIMIT', 'ร้านค้าเปลี่ยนเส้นทางมากเกินไป', 422);
  }

  protected async once(url: URL): Promise<{ body: string; location?: string; status: number }> {
    const env = getConfig();
    // Pin the checked IP in the socket lookup; a second DNS lookup would permit rebinding.
    let dnsTimer: ReturnType<typeof setTimeout> | undefined;
    const address = await Promise.race([
      resolvePublicHost(url.hostname),
      new Promise<never>((_, reject) => {
        dnsTimer = setTimeout(
          () => reject(new AppError('SCRAPER_TIMEOUT', 'ตรวจสอบ DNS ช้าเกินกำหนด', 422)),
          env.SCRAPER_REQUEST_TIMEOUT_MS,
        );
      }),
    ]).finally(() => clearTimeout(dnsTimer));
    return new Promise((resolve, reject) => {
      const req = httpsRequest(
        url,
        {
          method: 'GET',
          agent: false,
          family: address.family,
          lookup: (_hostname, _options, callback) =>
            callback(null, address.address, address.family),
          headers: {
            'User-Agent': env.SCRAPER_USER_AGENT,
            Accept: 'text/html,application/xhtml+xml',
            'Accept-Encoding': 'identity',
          },
        },
        (res) => {
          const status = res.statusCode ?? 0;
          if (status !== 200) {
            res.destroy();
            resolve({ body: '', status, location: res.headers.location });
            return;
          }
          const type = res.headers['content-type']?.split(';')[0].trim().toLowerCase();
          if (!type || !['text/html', 'application/xhtml+xml'].includes(type)) {
            res.destroy();
            reject(new AppError('SCRAPER_CONTENT_TYPE', 'ร้านค้าตอบกลับข้อมูลที่ไม่ใช่ HTML', 422));
            return;
          }
          if (res.headers['content-encoding'] && res.headers['content-encoding'] !== 'identity') {
            res.destroy();
            reject(new AppError('SCRAPER_CONTENT_TYPE', 'รูปแบบการบีบอัดยังไม่รองรับ', 422));
            return;
          }
          let bytes = 0;
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => {
            bytes += chunk.length;
            if (bytes > env.SCRAPER_MAX_BODY_BYTES) {
              res.destroy();
              reject(
                new AppError('SCRAPER_BODY_TOO_LARGE', 'ข้อมูลจากร้านค้ามีขนาดใหญ่เกินกำหนด', 422),
              );
              return;
            }
            chunks.push(chunk);
          });
          res.on('end', () => resolve({ body: Buffer.concat(chunks).toString('utf8'), status }));
          res.on('error', () =>
            reject(new AppError('SCRAPER_NETWORK_ERROR', 'การเชื่อมต่อร้านค้าถูกตัด', 422)),
          );
        },
      );
      const timer = setTimeout(
        () => req.destroy(new Error('timeout')),
        env.SCRAPER_REQUEST_TIMEOUT_MS,
      );
      req.once('close', () => clearTimeout(timer));
      req.on('error', (error: Error) =>
        reject(
          new AppError(
            error.message === 'timeout' ? 'SCRAPER_TIMEOUT' : 'SCRAPER_NETWORK_ERROR',
            error.message === 'timeout'
              ? 'ร้านค้าตอบกลับช้าเกินกำหนด'
              : 'ไม่สามารถเชื่อมต่อร้านค้า',
            422,
          ),
        ),
      );
      req.end();
    });
  }
}
