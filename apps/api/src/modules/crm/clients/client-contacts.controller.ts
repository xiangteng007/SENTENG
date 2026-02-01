/**
 * client-contacts.controller.ts
 *
 * 客戶聯絡人 CRUD API
 * @deprecated This API is deprecated. Please migrate to /api/v1/customers/:id/contacts
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../../common/guards/permission.guard";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { ClientContact } from "../../integrations/entities/client-contact.entity";
import {
  Deprecated,
  DeprecationInterceptor,
} from "../../../common/interceptors/deprecation.interceptor";

class CreateContactDto {
  name: string;
  phone?: string;
  mobile?: string;
  email?: string;
  title?: string;
  department?: string;
  note?: string;
}

class UpdateContactDto {
  name?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  title?: string;
  department?: string;
  note?: string;
}

@ApiTags("CRM - Client Contacts (Deprecated)")
@ApiBearerAuth()
@Controller("clients/:clientId/contacts")
@UseGuards(JwtAuthGuard, PermissionGuard)
@UseInterceptors(DeprecationInterceptor)
@Deprecated(
  "The /clients/:clientId/contacts API is deprecated. Please migrate to /customers/:id/contacts API.",
  "Sat, 01 Jun 2026 00:00:00 GMT",
)
export class ClientContactsController {
  constructor(
    @InjectRepository(ClientContact)
    private readonly contactRepo: Repository<ClientContact>,
  ) {}

  @Get()
  @RequirePermissions("client-contacts:read")
  async findAll(@Param("clientId") clientId: string) {
    return this.contactRepo.find({
      where: { clientId },
      order: { createdAt: "DESC" },
    });
  }

  @Get(":id")
  @RequirePermissions("client-contacts:read")
  async findOne(@Param("clientId") clientId: string, @Param("id") id: string) {
    return this.contactRepo.findOne({
      where: { id, clientId },
    });
  }

  @Post()
  @RequirePermissions("client-contacts:create")
  async create(
    @Param("clientId") clientId: string,
    @Body() dto: CreateContactDto,
  ) {
    const contact = this.contactRepo.create({
      clientId,
      fullName: dto.name,
      phone: dto.phone || "",
      mobile: dto.mobile || "",
      email: dto.email || "",
      title: dto.title || "",
      department: dto.department || "",
      note: dto.note || "",
      syncStatus: "PENDING",
    });
    return this.contactRepo.save(contact);
  }

  @Patch(":id")
  @RequirePermissions("client-contacts:update")
  async update(
    @Param("clientId") clientId: string,
    @Param("id") id: string,
    @Body() dto: UpdateContactDto,
  ) {
    const contact = await this.contactRepo.findOne({
      where: { id, clientId },
    });
    if (!contact) {
      return { error: "Contact not found" };
    }

    if (dto.name !== undefined) contact.fullName = dto.name;
    if (dto.phone !== undefined) contact.phone = dto.phone;
    if (dto.mobile !== undefined) contact.mobile = dto.mobile;
    if (dto.email !== undefined) contact.email = dto.email;
    if (dto.title !== undefined) contact.title = dto.title;
    if (dto.department !== undefined) contact.department = dto.department;
    if (dto.note !== undefined) contact.note = dto.note;

    // Reset sync status when contact is updated
    contact.syncStatus = "PENDING";

    return this.contactRepo.save(contact);
  }

  @Delete(":id")
  @RequirePermissions("client-contacts:delete")
  async remove(@Param("clientId") clientId: string, @Param("id") id: string) {
    const contact = await this.contactRepo.findOne({
      where: { id, clientId },
    });
    if (!contact) {
      return { error: "Contact not found" };
    }
    await this.contactRepo.remove(contact);
    return { success: true };
  }
}
