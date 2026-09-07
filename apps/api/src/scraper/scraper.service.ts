import { Injectable } from '@nestjs/common';
import { SafeHttpClient } from './http-client';
import { ScraperRegistry } from './adapters/retailers';
import { getConfig } from '../common/config';
import { AppError } from '../common/errors';

@Injectable()
export class ScraperService {
  private readonly registry = new ScraperRegistry();
  constructor(private readonly http: SafeHttpClient) {}
  async scrape(url: string, retailer: string) {
    if (!getConfig().SCRAPER_ENABLED)
      throw new AppError(
        'SCRAPER_DISABLED',
        'ปิดการดึงราคาจริงอยู่ ตั้งค่า SCRAPER_ENABLED เพื่อเปิดใช้งาน',
        422,
      );
    const start = Date.now();
    const adapter = this.registry.get(retailer);
    const html = await this.http.fetchHtml(url, retailer);
    return { ...adapter.parse(html), checkedAt: new Date(), durationMs: Date.now() - start };
  }
}
