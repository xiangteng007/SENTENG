import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ExportSmartHomeItemDto {
  @ApiProperty({ description: "Product ID" })
  @IsString()
  productId: string;

  @ApiProperty({ description: "Product name" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: "Subcategory" })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiPropertyOptional({ description: "Specification" })
  @IsOptional()
  @IsString()
  spec?: string;

  @ApiProperty({ description: "Quantity" })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: "Unit price" })
  @IsNumber()
  unitPrice: number;
}

export class ExportSmartHomeOptionsDto {
  @ApiPropertyOptional({ description: "Sheet title" })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: "Project name" })
  @IsOptional()
  @IsString()
  projectName?: string;
}

export class ExportSmartHomeDto {
  @ApiProperty({
    type: [ExportSmartHomeItemDto],
    description: "Items to export",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExportSmartHomeItemDto)
  items: ExportSmartHomeItemDto[];

  @ApiPropertyOptional({ type: ExportSmartHomeOptionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ExportSmartHomeOptionsDto)
  options?: ExportSmartHomeOptionsDto;
}

export class ExportSmartHomeResponseDto {
  @ApiProperty({ description: "Google Sheet ID" })
  sheetId: string;

  @ApiProperty({ description: "Google Sheet URL" })
  sheetUrl: string;

  @ApiProperty({ description: "Creation timestamp" })
  createdAt: string;
}
