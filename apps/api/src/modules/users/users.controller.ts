import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { CreateUserDto, UpdateUserDto, ListUsersQueryDto } from "./user.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";

@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: "List users" })
  @RequirePermissions("users:read")
  async findAll(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get user" })
  @RequirePermissions("users:read")
  async findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create user" })
  @RequirePermissions("users:create")
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update user" })
  @RequirePermissions("users:update")
  async update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Deactivate user" })
  @RequirePermissions("users:delete")
  async deactivate(@Param("id") id: string) {
    return this.usersService.deactivate(id);
  }
}
