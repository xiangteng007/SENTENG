import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PartnersService } from "./partners.service";
import {
  CreatePartnerDto,
  UpdatePartnerDto,
  CreatePartnerContactDto,
  UpdatePartnerContactDto,
  PartnerQueryDto,
} from "./partner.dto";

@Controller("partners")
@UseGuards(JwtAuthGuard)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  // ============ Partner CRUD ============

  @Get()
  async findAll(@Query() query: PartnerQueryDto) {
    return this.partnersService.findAll(query);
  }

  @Get("clients")
  async getClients() {
    return this.partnersService.getClients();
  }

  @Get("vendors")
  async getVendors() {
    return this.partnersService.getVendors();
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.partnersService.findOne(id);
  }

  @Post()
  async create(
    @Body() dto: CreatePartnerDto,
    @Request() req: { user?: { userId?: string } },
  ) {
    return this.partnersService.create(dto, req.user?.userId);
  }

  @Put(":id")
  async update(@Param("id") id: string, @Body() dto: UpdatePartnerDto) {
    return this.partnersService.update(id, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.partnersService.remove(id);
    return { success: true, message: "合作夥伴已刪除" };
  }

  // ============ PartnerContact CRUD ============

  @Post(":partnerId/contacts")
  async addContact(
    @Param("partnerId") partnerId: string,
    @Body() dto: CreatePartnerContactDto,
    @Request() req: { user?: { userId?: string } },
  ) {
    return this.partnersService.addContact(partnerId, dto, req.user?.userId);
  }

  @Put(":partnerId/contacts/:contactId")
  async updateContact(
    @Param("partnerId") partnerId: string,
    @Param("contactId") contactId: string,
    @Body() dto: UpdatePartnerContactDto,
  ) {
    return this.partnersService.updateContact(partnerId, contactId, dto);
  }

  @Delete(":partnerId/contacts/:contactId")
  async removeContact(
    @Param("partnerId") partnerId: string,
    @Param("contactId") contactId: string,
  ) {
    await this.partnersService.removeContact(partnerId, contactId);
    return { success: true, message: "聯絡人已刪除" };
  }
}
