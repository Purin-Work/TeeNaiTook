import { Controller, Headers, HttpCode, Module, Post } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { ProductsModule } from '../products/products.controller';
import { JobsService } from '../scrape-jobs/jobs.service';
import { SafeHttpClient } from './http-client';
import { ScraperService } from './scraper.service';
import { getConfig } from '../common/config';
import { AppError } from '../common/errors';

@Controller('internal')
@ApiTags('Internal')
export class CronController {
  constructor(private readonly jobs: JobsService) {}
  @Post('scrape')
  @HttpCode(202)
  @ApiHeader({ name: 'x-cron-secret', required: true })
  trigger(@Headers('x-cron-secret') secret?: string) {
    const expected = Buffer.from(getConfig().CRON_SECRET);
    const supplied = Buffer.from(secret || '');
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied))
      throw new AppError('AUTH_REQUIRED', 'Unauthorized', 401);
    return this.jobs.trigger('SCHEDULED');
  }
}
@Module({
  imports: [ProductsModule],
  controllers: [CronController],
  providers: [SafeHttpClient, ScraperService, JobsService],
  exports: [JobsService],
})
export class ScraperModule {}
