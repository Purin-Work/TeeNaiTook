import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '../generated/prisma/client';

export class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;
  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
export class ProductsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: '9800x3d' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value,
  )
  q?: string;
  @ApiPropertyOptional({ enum: Category })
  @IsOptional()
  @IsEnum(Category)
  category?: Category;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  brand?: string;
  @ApiPropertyOptional({ enum: ['jib', 'advice', 'ihavecpu'] })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  retailer?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  inStock?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(9999999999)
  minPrice?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(9999999999)
  maxPrice?: number;
  @ApiPropertyOptional({ enum: ['price_asc', 'price_drop', 'updated', 'name', 'popular'] })
  @IsEnum(['price_asc', 'price_drop', 'updated', 'name', 'popular'])
  sort: 'price_asc' | 'price_drop' | 'updated' | 'name' | 'popular' = 'price_asc';
}
export class BrandsQueryDto {
  @ApiPropertyOptional({ enum: Category })
  @IsOptional()
  @IsEnum(Category)
  category?: Category;
}
export class HistoryQueryDto {
  @ApiPropertyOptional({ enum: ['7d', '30d', '90d', 'all'] })
  @IsEnum(['7d', '30d', '90d', 'all'])
  range: '7d' | '30d' | '90d' | 'all' = '30d';
  @ApiPropertyOptional({ enum: ['lowest', 'retailers'] })
  @IsEnum(['lowest', 'retailers'])
  mode: 'lowest' | 'retailers' = 'lowest';
}
