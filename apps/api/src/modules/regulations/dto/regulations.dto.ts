import { IsArray, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SyncRegulationsDto {
  @ApiPropertyOptional({
    description:
      "Specific pcodes to sync. If empty, syncs all configured sources.",
    example: ["D0070115", "D0070148"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pcodes?: string[];
}

export class SearchRegulationsDto {
  @ApiProperty({ description: "Search query" })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: "Filter by pcode" })
  @IsOptional()
  @IsString()
  pcode?: string;

  @ApiPropertyOptional({ description: "Limit results", default: 20 })
  @IsOptional()
  limit?: number;
}
