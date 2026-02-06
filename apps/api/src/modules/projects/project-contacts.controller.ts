import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ProjectContactsService } from "./project-contacts.service";
import { CreateProjectContactDto, UpdateProjectContactDto } from "./project-contact.dto";

@Controller("projects/:projectId/contacts")
@UseGuards(JwtAuthGuard)
export class ProjectContactsController {
  constructor(private readonly projectContactsService: ProjectContactsService) {}

  /**
   * GET /projects/:projectId/contacts
   * 取得專案所有聯絡人
   */
  @Get()
  async findAll(@Param("projectId") projectId: string) {
    return this.projectContactsService.findByProject(projectId);
  }

  /**
   * POST /projects/:projectId/contacts
   * 指派聯絡人到專案
   */
  @Post()
  async assignContact(
    @Param("projectId") projectId: string,
    @Body() dto: CreateProjectContactDto,
    @Request() req: { user?: { userId?: string } },
  ) {
    return this.projectContactsService.assignContact(
      projectId,
      dto,
      req.user?.userId,
    );
  }

  /**
   * PUT /projects/:projectId/contacts/:contactAssignmentId
   * 更新專案聯絡人
   */
  @Put(":contactAssignmentId")
  async update(
    @Param("projectId") projectId: string,
    @Param("contactAssignmentId") contactAssignmentId: string,
    @Body() dto: UpdateProjectContactDto,
  ) {
    return this.projectContactsService.update(projectId, contactAssignmentId, dto);
  }

  /**
   * DELETE /projects/:projectId/contacts/:contactAssignmentId
   * 移除專案聯絡人
   */
  @Delete(":contactAssignmentId")
  async remove(
    @Param("projectId") projectId: string,
    @Param("contactAssignmentId") contactAssignmentId: string,
  ) {
    await this.projectContactsService.remove(projectId, contactAssignmentId);
    return { success: true, message: "聯絡人已從專案移除" };
  }
}
