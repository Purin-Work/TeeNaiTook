import type { RetailerScraper } from '../scraper.interface';
import { parseProductHtml } from '../parsers';
import { AppError } from '../../common/errors';

abstract class StructuredRetailerScraper implements RetailerScraper {
  abstract readonly retailer: string;
  supports(slug: string) {
    return slug === this.retailer;
  }
  parse(html: string) {
    return parseProductHtml(html);
  }
}
// Retailer selectors are deliberately omitted until a public product page is verified.
export class JibScraper extends StructuredRetailerScraper {
  readonly retailer = 'jib';
}
export class AdviceScraper extends StructuredRetailerScraper {
  readonly retailer = 'advice';
}
export class IHaveCpuScraper extends StructuredRetailerScraper {
  readonly retailer = 'ihavecpu';
}
export class ScraperRegistry {
  private readonly adapters: RetailerScraper[] = [
    new JibScraper(),
    new AdviceScraper(),
    new IHaveCpuScraper(),
  ];
  get(slug: string) {
    const adapter = this.adapters.find((a) => a.supports(slug));
    if (!adapter) throw new AppError('UNSUPPORTED_RETAILER', 'ยังไม่รองรับร้านค้านี้');
    return adapter;
  }
}
