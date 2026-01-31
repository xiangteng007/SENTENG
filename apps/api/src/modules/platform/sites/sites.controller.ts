import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import type { AuthenticatedRequest } from "../../../common/types";
import { SitesService } from './sites.service';
import { CreateJobSiteDto, UpdateJobSiteDto } from './dto/sites.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../../common/guards/permission.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('platform/sites')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Get()
  @RequirePermissions('sites:read')
  findAll(@Query('projectId') projectId?: string) {
    return this.sitesService.findAll(projectId);
  }

  @Get('nearby')
  @RequirePermissions('sites:read')
  findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius?: number
  ) {
    return this.sitesService.findNearby(Number(lat), Number(lng), Number(radius) || 10);
  }

  @Get(':id')
  @RequirePermissions('sites:read')
  findById(@Param('id') id: string) {
    return this.sitesService.findById(id);
  }

  @Post()
  @RequirePermissions('sites:create')
  create(@Body() dto: CreateJobSiteDto, @Request() req: AuthenticatedRequest) {
    return this.sitesService.create(dto, req.user?.sub);
  }

  @Patch(':id')
  @RequirePermissions('sites:update')
  update(@Param('id') id: string, @Body() dto: UpdateJobSiteDto) {
    return this.sitesService.update(id, dto);
  }
}
