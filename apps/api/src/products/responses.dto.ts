import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '../generated/prisma/client';
export class ProductResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'AMD Ryzen 7 9800X3D' }) name!: string;
  @ApiProperty({ example: 'amd-ryzen-7-9800x3d' }) slug!: string;
  @ApiProperty({ example: 'AMD' }) brand!: string;
  @ApiProperty({ enum: Category }) category!: Category;
  @ApiPropertyOptional({ nullable: true }) modelNumber!: string | null;
  @ApiProperty({
    type: String,
    nullable: true,
    example: '17490.00',
    description: 'THB decimal string; fresh in-stock minimum only.',
  })
  minimumPrice!: string | null;
  @ApiProperty({ type: String, nullable: true, example: 'Advice' }) cheapestRetailer!:
    string | null;
  @ApiProperty({ example: 3 }) retailerCount!: number;
  @ApiProperty() inStock!: boolean;
  @ApiProperty() isDemo!: boolean;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' }) lastUpdated!: string | null;
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Mean of the previous seven Bangkok-day minimums.',
  })
  referencePrice!: string | null;
  @ApiProperty({ type: Number, nullable: true, example: -5.6 }) priceChange!: number | null;
}
export class PageMetaDto {
  @ApiProperty({ example: 1 }) page!: number;
  @ApiProperty({ example: 20 }) limit!: number;
  @ApiProperty({ example: 8 }) total!: number;
  @ApiProperty({ example: 1 }) totalPages!: number;
  @ApiProperty() isDemo!: boolean;
}
export class ProductsPageDto {
  @ApiProperty({ type: [ProductResponseDto] }) data!: ProductResponseDto[];
  @ApiProperty({ type: PageMetaDto }) meta!: PageMetaDto;
}
export class OfferResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ type: Object, example: { name: 'Advice', slug: 'advice' } }) retailer!: object;
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'HTTPS retailer product URL; null for demo records.',
  })
  url!: string | null;
  @ApiProperty({ type: String, nullable: true, example: '17490.00' }) price!: string | null;
  @ApiProperty({ type: String, nullable: true }) regularPrice!: string | null;
  @ApiProperty({ type: Boolean, nullable: true }) inStock!: boolean | null;
  @ApiProperty() isStale!: boolean;
  @ApiProperty() isCheapest!: boolean;
  @ApiProperty() isDemo!: boolean;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' }) lastCheckedAt!: string | null;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' }) lastSuccessAt!: string | null;
}
export class ProductDetailDto extends ProductResponseDto {
  @ApiProperty({ type: String, nullable: true }) description!: string | null;
  @ApiProperty({ type: Object, nullable: true }) specs!: object | null;
  @ApiProperty({ type: [OfferResponseDto] }) offers!: OfferResponseDto[];
}
export class PriceHistoryResponseDto {
  @ApiProperty({ enum: ['7d', '30d', '90d', 'all'] }) range!: string;
  @ApiProperty({ enum: ['lowest', 'retailers'] }) mode!: string;
  @ApiProperty({ example: 'Asia/Bangkok' }) timezone!: string;
  @ApiProperty() isDemo!: boolean;
  @ApiProperty({ example: 1 }) bucketDays!: number;
  @ApiProperty({
    type: [Object],
    example: [{ day: '2026-09-06', retailer: 'lowest', price: '17490.00' }],
  })
  points!: object[];
  @ApiProperty({
    type: Object,
    example: { low: '17490.00', average: '18400.00', high: '18900.00', days: 30 },
  })
  summary!: object;
  @ApiProperty({ type: String, nullable: true }) trackedLow!: string | null;
  @ApiProperty({ type: Object, example: { label: 'ราคาดีมาก', percentile: 0 } })
  priceStatus!: object;
}
