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
} from "@nestjs/common";
import { ContactsService } from "./contacts.service";
import {
  CreateContactDto,
  UpdateContactDto,
  ContactQueryDto,
} from "./contact.dto";
import { ContactOwnerType } from "./contact.entity";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";

@Controller("contacts")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @RequirePermissions("contacts:read")
  async findAll(@Query() query: ContactQueryDto) {
    return this.contactsService.findAll(query);
  }

  @Get("owner/:ownerType/:ownerId")
  @RequirePermissions("contacts:read")
  async findByOwner(
    @Param("ownerType") ownerType: ContactOwnerType,
    @Param("ownerId") ownerId: string,
  ) {
    return this.contactsService.findByOwner(ownerType, ownerId);
  }

  @Get(":id")
  @RequirePermissions("contacts:read")
  async findOne(@Param("id") id: string) {
    return this.contactsService.findOne(id);
  }

  @Post()
  @RequirePermissions("contacts:create")
  async create(@Body() dto: CreateContactDto) {
    return this.contactsService.create(dto);
  }

  @Patch(":id")
  @RequirePermissions("contacts:update")
  async update(@Param("id") id: string, @Body() dto: UpdateContactDto) {
    return this.contactsService.update(id, dto);
  }

  @Delete(":id")
  @RequirePermissions("contacts:delete")
  async remove(@Param("id") id: string) {
    await this.contactsService.remove(id);
    return { success: true };
  }
}
