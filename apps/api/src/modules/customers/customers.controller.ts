import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import type { AuthenticatedRequest } from "../../common/types";
import { CustomersService } from "./customers.service";
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerQueryDto,
  CreateContactDto,
} from "./customer.dto";
import { PipelineStage } from "./customer.entity";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";

@ApiTags("Customers")
@ApiBearerAuth()
@Controller("customers")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: "List customers" })
  @RequirePermissions("customers:read")
  async findAll(
    @Query() query: CustomerQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.sub || req.user?.id;
    const userRole = req.user?.role;
    return this.customersService.findAll(query, userId, userRole);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get customer" })
  @RequirePermissions("customers:read")
  async findOne(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.sub || req.user?.id;
    const userRole = req.user?.role;
    return this.customersService.findOne(id, userId, userRole);
  }

  @Get(":id/projects")
  @ApiOperation({ summary: "List customer projects" })
  @RequirePermissions("customers:read")
  async findProjects(@Param("id") id: string) {
    return this.customersService.findProjects(id);
  }

  @Post()
  @ApiOperation({ summary: "Create customer" })
  @RequirePermissions("customers:create")
  async create(
    @Body() dto: CreateCustomerDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.sub || req.user?.id;
    return this.customersService.create(dto, userId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update customer" })
  @RequirePermissions("customers:update")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateCustomerDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.sub || req.user?.id;
    const userRole = req.user?.role;
    return this.customersService.update(id, dto, userId, userRole);
  }

  @Patch(":id/pipeline")
  @RequirePermissions("customers:pipeline")
  async updatePipeline(
    @Param("id") id: string,
    @Body("stage") stage: PipelineStage,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.sub || req.user?.id;
    const userRole = req.user?.role;
    return this.customersService.updatePipelineStage(
      id,
      stage,
      userId,
      userRole,
    );
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete customer" })
  @RequirePermissions("customers:delete")
  async remove(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    const userId = req.user?.sub || req.user?.id;
    const userRole = req.user?.role;
    return this.customersService.remove(id, userId, userRole);
  }

  // Contact endpoints
  @Post(":id/contacts")
  @RequirePermissions("customers:update")
  async addContact(
    @Param("id") id: string,
    @Body() dto: CreateContactDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.sub || req.user?.id;
    const userRole = req.user?.role;
    return this.customersService.addContact(id, dto, userId, userRole);
  }

  @Delete("contacts/:contactId")
  @RequirePermissions("customers:delete")
  async removeContact(@Param("contactId") contactId: string) {
    return this.customersService.removeContact(contactId);
  }
}
