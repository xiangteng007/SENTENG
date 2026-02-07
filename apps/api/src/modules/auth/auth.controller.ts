import {
  Controller,
  Post,
  Body,
  Get,
  Res,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import type { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import {
  PermissionsResponseDto,
  ROLE_LEVELS,
  ROLE_PAGES,
  ROLE_ACTIONS,
} from "./permissions.dto";

interface JwtPayload {
  sub?: string;
  id?: string;
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
}

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  @Post("login")
  @ApiOperation({
    summary: "User login",
    description: "Authenticate user and return JWT token in cookie",
  })
  @ApiResponse({
    status: 200,
    description: "Login successful, JWT set in HttpOnly cookie",
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(
    @Body()
    body: {
      email: string;
      name: string;
      provider: string;
      uid: string;
      role?: string;
    },
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.loginOrCreate(body);

    // Set JWT in HttpOnly cookie for enhanced security
    response.cookie("access_token", result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000, // 1 hour
      path: "/",
    });

    // Also return token in response body for backward compatibility
    return result;
  }

  @Post("logout")
  @ApiOperation({
    summary: "User logout",
    description: "Clear JWT cookie and end session",
  })
  @ApiResponse({ status: 200, description: "Logout successful" })
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response) {
    // Clear the access token cookie
    response.cookie("access_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    return { success: true, message: "Logged out successfully" };
  }

  @Get("health")
  health() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }

  /**
   * Liveness probe - quick check, no DB
   * GET /api/v1/auth/healthz
   */
  @Get("healthz")
  healthz() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }

  /**
   * Readiness probe - includes DB connectivity check
   * GET /api/v1/auth/readyz
   */
  @Get("readyz")
  async readyz() {
    try {
      await this.dataSource.query("SELECT 1");
      return {
        status: "ok",
        database: "connected",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: "error",
        database: "disconnected",
        message: "Database connection failed",
      });
    }
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get current user",
    description: "Returns authenticated user info and permissions",
  })
  @ApiResponse({
    status: 200,
    description: "User information with permissions",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async me(@Req() request: Request) {
    const user = request["user"] as Record<string, unknown> | undefined;
    if (!user) return null;

    // Get database permissions for the user's role
    const role = user?.role;
    let dbPermissions: string[] = [];

    if (role) {
      try {
        const result = await this.dataSource.query(
          `SELECT permission_id FROM role_permissions WHERE role_id = $1`,
          [role],
        );
        dbPermissions = result.map(
          (r: { permission_id: string }) => r.permission_id,
        );
      } catch (error) {
        this.logger.error("Error fetching permissions:", error);
      }
    }

    return {
      ...user,
      permissions: dbPermissions,
    };
  }

  /**
   * 取得當前用戶的權限
   * GET /auth/permissions
   *
   * 此端點為前端 RBAC gating 的唯一權威來源
   * 前端應在登入後呼叫此端點並快取結果
   */
  @Get("permissions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get user permissions",
    description: "Authority source for frontend RBAC",
  })
  @ApiResponse({
    status: 200,
    description: "Permission matrix including pages and actions",
  })
  async getPermissions(
    @Req() request: Request,
  ): Promise<PermissionsResponseDto & { dbPermissions: string[] }> {
    const user = request["user"] as JwtPayload | undefined;
    const role = user?.role || "user";
    const roleLevel = ROLE_LEVELS[role] || ROLE_LEVELS["user"] || 1;

    // 取得該角色可存取的頁面
    // 累積較低層級的權限（較高層級繼承較低層級的頁面）
    let pages: string[] = [];
    for (let level = 1; level <= roleLevel; level++) {
      const levelPages = ROLE_PAGES[level] || [];
      pages = [...new Set([...pages, ...levelPages])];
    }

    // 取得該角色的操作權限
    // 使用該角色層級的權限（不累積，各層級獨立定義）
    const actions = ROLE_ACTIONS[roleLevel] || ROLE_ACTIONS[1] || {};

    // Get database permissions for unified platform modules
    let dbPermissions: string[] = [];
    try {
      const result = await this.dataSource.query(
        `SELECT permission_id FROM role_permissions WHERE role_id = $1`,
        [role],
      );
      dbPermissions = result.map(
        (r: { permission_id: string }) => r.permission_id,
      );
    } catch (error) {
      this.logger.error("Error fetching permissions:", error);
    }

    return {
      permissionsVersion: 1,
      userId: user?.sub || user?.id || "",
      roleLevel,
      role,
      pages,
      actions,
      dbPermissions, // 新增：資料庫權限
    };
  }
}
