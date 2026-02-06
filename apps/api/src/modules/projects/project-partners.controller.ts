/**
 * ProjectPartnersController
 *
 * 專案合作夥伴 API 端點
 * 提供專案與合作夥伴關聯的 CRUD 操作
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ProjectPartnersService } from "./project-partners.service";
import {
  CreateProjectPartnerDto,
  UpdateProjectPartnerDto,
} from "./project-partners.dto";
import { Request } from "express";

interface AuthRequest extends Request {
  user?: { sub?: string };
}

@ApiTags("Project Partners")
@ApiBearerAuth()
@Controller("projects/:projectId/partners")
@UseGuards(JwtAuthGuard)
export class ProjectPartnersController {
  constructor(private readonly projectPartnersService: ProjectPartnersService) {}

  @Get()
  @ApiOperation({ summary: "取得專案的所有合作夥伴" })
  async findAll(@Param("projectId") projectId: string) {
    return this.projectPartnersService.findByProject(projectId);
  }

  @Get(":id")
  @ApiOperation({ summary: "取得單一專案合作夥伴關聯" })
  async findOne(@Param("id") id: string) {
    return this.projectPartnersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "新增專案合作夥伴關聯" })
  async create(
    @Param("projectId") projectId: string,
    @Body() body: Omit<CreateProjectPartnerDto, "projectId">,
    @Req() req: AuthRequest,
  ) {
    return this.projectPartnersService.create(
      { ...body, projectId },
      req.user?.sub,
    );
  }

  @Patch(":id")
  @ApiOperation({ summary: "更新專案合作夥伴關聯" })
  async update(@Param("id") id: string, @Body() body: UpdateProjectPartnerDto) {
    return this.projectPartnersService.update(id, body);
  }

  @Delete(":id")
  @ApiOperation({ summary: "刪除專案合作夥伴關聯" })
  async remove(@Param("id") id: string) {
    await this.projectPartnersService.remove(id);
    return { message: "Deleted successfully" };
  }

  @Post("bulk")
  @ApiOperation({ summary: "批量新增專案合作夥伴" })
  async bulkCreate(
    @Param("projectId") projectId: string,
    @Body() body: { partnerIds: string[]; role?: string },
    @Req() req: AuthRequest,
  ) {
    return this.projectPartnersService.bulkCreate(
      projectId,
      body.partnerIds,
      body.role as never,
      req.user?.sub,
    );
  }
}
