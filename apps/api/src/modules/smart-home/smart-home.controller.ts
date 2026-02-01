import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  Request,
  UseGuards,
} from "@nestjs/common";
import type { AuthenticatedRequest } from "../../common/types";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { SmartHomeService } from "./smart-home.service";
import { SmartHomeProduct } from "./entities/smart-home-product.entity";
import { SmartHomeQueryDto, SyncResultDto } from "./dto/smart-home.dto";
import {
  ExportSmartHomeDto,
  ExportSmartHomeResponseDto,
} from "./dto/export-smart-home.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("Smart Home")
@Controller("api/v1/smart-home")
export class SmartHomeController {
  constructor(private readonly smartHomeService: SmartHomeService) {}

  @Get("products")
  @ApiOperation({ summary: "Get all smart home products" })
  @ApiResponse({ status: 200, description: "List of smart home products" })
  async findAll(
    @Query() query: SmartHomeQueryDto,
  ): Promise<SmartHomeProduct[]> {
    return this.smartHomeService.findAll(query);
  }

  @Get("products/:id")
  @ApiOperation({ summary: "Get a smart home product by ID" })
  @ApiResponse({ status: 200, description: "Smart home product details" })
  async findOne(@Param("id") id: string): Promise<SmartHomeProduct | null> {
    return this.smartHomeService.findOne(id);
  }

  @Get("categories")
  @ApiOperation({ summary: "Get all product categories with counts" })
  @ApiResponse({ status: 200, description: "List of categories" })
  async getCategories(): Promise<{ category: string; count: number }[]> {
    return this.smartHomeService.getCategories();
  }

  @Get("categories/:category/subcategories")
  @ApiOperation({ summary: "Get subcategories for a category" })
  @ApiResponse({ status: 200, description: "List of subcategories" })
  async getSubcategories(
    @Param("category") category: string,
  ): Promise<{ subcategory: string; count: number }[]> {
    return this.smartHomeService.getSubcategories(category);
  }

  @Get("sync/status")
  @ApiOperation({ summary: "Get current sync status" })
  @ApiResponse({ status: 200, description: "Sync status" })
  async getSyncStatus(): Promise<{
    isSyncing: boolean;
    lastSync: Date | null;
  }> {
    return this.smartHomeService.getSyncStatus();
  }

  @Post("sync")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Manually trigger product sync from Aqara" })
  @ApiResponse({ status: 200, description: "Sync result" })
  async syncProducts(): Promise<SyncResultDto> {
    return this.smartHomeService.syncProducts();
  }

  @Post("export")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Export quotation list to Google Sheets" })
  @ApiResponse({
    status: 200,
    description: "Export result with sheet URL",
    type: ExportSmartHomeResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized or Google account not connected",
  })
  async exportToGoogleSheets(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ExportSmartHomeDto,
  ): Promise<ExportSmartHomeResponseDto> {
    const userId = req.user.id || req.user.userId || req.user.sub;
    return this.smartHomeService.exportToGoogleSheets(
      userId,
      dto.items,
      dto.options,
    );
  }
}
