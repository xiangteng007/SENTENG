import { ApiProperty } from "@nestjs/swagger";

/**
 * Generic paginated response wrapper.
 * Used by controllers returning lists with pagination metadata.
 *
 * Usage:
 *   return new PaginatedResponseDto(items, total, page, limit);
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ description: "Array of items for this page" })
  items: T[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 3, description: "Total number of pages" })
  totalPages: number;

  constructor(items: T[], total: number, page: number, limit: number) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}

/**
 * Standard API success response wrapper.
 *
 * Usage:
 *   return new ApiSuccessResponseDto(data, 'Resource created');
 */
export class ApiSuccessResponseDto<T = unknown> {
  @ApiProperty({ example: true })
  success = true as const;

  @ApiProperty({ description: "Response payload" })
  data: T;

  @ApiProperty({ example: "Operation completed", required: false })
  message?: string;

  constructor(data: T, message?: string) {
    this.data = data;
    this.message = message;
  }
}
