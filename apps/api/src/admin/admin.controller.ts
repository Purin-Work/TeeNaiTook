import {
  Body,
  Controller,
  Get,
  HttpCode,
  Module,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthModule } from '../auth/auth.controller';
import { AdminGuard } from '../auth/auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from './admin.service';
import {
  AdminListDto,
  CreateProductDto,
  CreateSourceDto,
  UpdateProductDto,
  UpdateRetailerDto,
  UpdateSourceDto,
} from './admin.dto';
import { JobsService } from '../scrape-jobs/jobs.service';
import { PaginationDto } from '../products/products.dto';
import { ScraperModule } from '../scraper/scraper.module';

@ApiTags('Admin')
@ApiCookieAuth()
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly db: PrismaService,
    private readonly jobs: JobsService,
  ) {}
  @Get('dashboard') dashboard() {
    return this.admin.dashboard();
  }
  @Get('products') products(@Query() query: AdminListDto) {
    return this.admin.products(query);
  }
  @Post('products') createProduct(@Body() data: CreateProductDto) {
    return this.admin.createProduct(data);
  }
  @Get('products/:id') product(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.product(id);
  }
  @Patch('products/:id') updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateProductDto,
  ) {
    return this.admin.updateProduct(id, data);
  }
  @Get('retailers') async retailers() {
    return { data: await this.db.retailer.findMany({ orderBy: { name: 'asc' } }) };
  }
  @Patch('retailers/:id') retailer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateRetailerDto,
  ) {
    return this.db.retailer.update({ where: { id }, data });
  }
  @Get('sources') sources(@Query() query: AdminListDto) {
    return this.admin.sources(query);
  }
  @Post('sources') createSource(@Body() data: CreateSourceDto) {
    return this.admin.createSource(data);
  }
  @Patch('sources/:id') updateSource(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateSourceDto,
  ) {
    return this.admin.updateSource(id, data);
  }
  @Post('sources/:id/scrape')
  @HttpCode(202)
  @ApiOperation({
    summary:
      'Test a saved source; returns an asynchronous job with parser, price, duration and errors.',
  })
  scrapeOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobs.trigger('MANUAL', id);
  }
  @Post('scrape-jobs') @HttpCode(202) scrapeAll() {
    return this.jobs.trigger('MANUAL');
  }
  @Get('scrape-jobs') jobsList(@Query() query: PaginationDto) {
    return this.jobs.list(query);
  }
  @Get('scrape-jobs/:id') job(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: PaginationDto,
  ) {
    return this.jobs.find(id, query);
  }
}
@Module({
  imports: [AuthModule, ScraperModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
