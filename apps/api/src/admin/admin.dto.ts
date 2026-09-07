import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Category } from '../generated/prisma/client';
import { PaginationDto } from '../products/products.dto';

export class AdminListDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) q?: string;
}
export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @MinLength(2, { message: 'กรุณากรอกชื่อสินค้า' })
  @MaxLength(200)
  name!: string;
  @ApiProperty() @IsString() @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) @MaxLength(180) slug!: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(60) brand!: string;
  @ApiProperty({ enum: Category }) @IsEnum(Category) category!: Category;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) modelNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @ApiPropertyOptional({ type: Object }) @IsOptional() @IsObject() specs?: Record<
    string,
    string | number | boolean
  >;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateProductDto extends PartialType(CreateProductDto) {}
export class CreateSourceDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiProperty() @IsUUID() retailerId!: string;
  @ApiProperty({ example: 'https://www.jib.co.th/web/product/readProduct/...' })
  @IsString()
  @MaxLength(2048)
  url!: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateSourceDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2048) url?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateRetailerDto {
  @ApiProperty() @IsBoolean() isActive!: boolean;
}
