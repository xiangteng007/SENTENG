import { Injectable, NestMiddleware } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response, NextFunction } from "express";
import * as crypto from "crypto";

/**
 * CSRF Protection Middleware using Double Submit Cookie Pattern
 *
 * This is optimized for SPA + REST API architecture:
 * 1. On first request, generates a CSRF token and sets it in a cookie
 * 2. Frontend reads the cookie and sends it back in X-CSRF-TOKEN header
 * 3. Middleware validates that cookie value matches header value
 *
 * Safe methods (GET, HEAD, OPTIONS) are excluded from validation.
 * Auth endpoints are excluded since user can't have CSRF token before login.
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly CSRF_COOKIE_NAME = "XSRF-TOKEN";
  private readonly CSRF_HEADER_NAME = "x-csrf-token";
  private readonly SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];
  private readonly TOKEN_LENGTH = 32;

  constructor(private readonly configService: ConfigService) {}

  // Paths that should skip CSRF validation (user can't have token yet)
  // Include both with and without /api/v1 prefix for compatibility
  private readonly SKIP_PATHS = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/firebase",
    "/health",
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
    "/api/v1/auth/firebase",
    "/api/v1/health",
  ];

  use(req: Request, res: Response, next: NextFunction): void {
    // Always ensure CSRF token exists in cookie
    let csrfToken = req.cookies?.[this.CSRF_COOKIE_NAME];

    if (!csrfToken) {
      csrfToken = this.generateToken();
      res.cookie(this.CSRF_COOKIE_NAME, csrfToken, {
        httpOnly: false, // Must be readable by JavaScript
        secure: this.configService.get("NODE_ENV") === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
    }

    // Skip validation for safe methods
    if (this.SAFE_METHODS.includes(req.method.toUpperCase())) {
      return next();
    }

    // Skip validation for auth endpoints (user can't have token before login)
    const requestPath = req.path;
    if (
      this.SKIP_PATHS.some(
        (path) => requestPath === path || requestPath.startsWith(path + "/"),
      )
    ) {
      return next();
    }

    // Validate CSRF token for state-changing requests
    const headerToken = req.headers[this.CSRF_HEADER_NAME] as string;

    if (!headerToken || headerToken !== csrfToken) {
      res.status(403).json({
        statusCode: 403,
        error: "Forbidden",
        message: "Invalid CSRF token",
      });
      return;
    }

    next();
  }

  private generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString("hex");
  }
}
