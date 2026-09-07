import { Controller, Get, HttpCode, Module, Param, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductDetailDto, ProductsPageDto, PriceHistoryResponseDto } from './responses.dto';
import { Category } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';
import { BrandsQueryDto, HistoryQueryDto, ProductsQueryDto } from './products.dto';
import { PricesService } from '../prices/prices.service';
import { getConfig } from '../common/config';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly products: ProductsService,
    private readonly prices: PricesService,
  ) {}
  @Get()
  @ApiOkResponse({ type: ProductsPageDto })
  @ApiOperation({
    summary: 'Search, filter and paginate current offers. Decimal prices are strings.',
  })
  list(@Query() query: ProductsQueryDto) {
    return this.products.list(query);
  }
  @Get(':slug')
  @ApiOkResponse({ type: ProductDetailDto })
  find(@Param('slug') slug: string) {
    return this.products.find(slug);
  }
  @Get(':slug/offers')
  async offers(@Param('slug') slug: string) {
    return { data: (await this.products.find(slug)).offers };
  }
  @Post(':slug/view')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Increment an anonymous page-view counter; no visitor identity is stored.',
  })
  view(@Param('slug') slug: string) {
    return this.products.recordView(slug);
  }
  @Get(':slug/price-history')
  @ApiOkResponse({ type: PriceHistoryResponseDto })
  async history(@Param('slug') slug: string, @Query() query: HistoryQueryDto) {
    return this.prices.history(await this.products.find(slug), query);
  }
}
@ApiTags('Catalogue')
@Controller()
export class CatalogueController {
  constructor(private readonly db: PrismaService) {}
  @Get('retailers')
  async retailers() {
    return {
      data: await this.db.retailer.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true, baseUrl: true },
        orderBy: { name: 'asc' },
      }),
    };
  }
  @Get('categories')
  categories() {
    return { data: Object.values(Category) };
  }
  @Get('brands')
  async brands(@Query() query: BrandsQueryDto) {
    const products = await this.db.product.findMany({
      where: {
        isActive: true,
        isDemo: getConfig().DEMO_MODE,
        ...(query.category ? { category: query.category } : {}),
      },
      distinct: ['brand'],
      select: { brand: true },
      orderBy: { brand: 'asc' },
    });
    return { data: products.map(({ brand }) => brand) };
  }
}
@Module({
  controllers: [ProductsController, CatalogueController],
  providers: [ProductsService, PricesService],
  exports: [ProductsService, PricesService],
})
export class ProductsModule {}
