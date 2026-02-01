import { Injectable, NestMiddleware } from "@nestjs/common";
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
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly CSRF_COOKIE_NAME = "XSRF-TOKEN";
  private readonly CSRF_HEADER_NAME = "x-csrf-token";
  private readonly SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];
  private readonly TOKEN_LENGTH = 32;

  use(req: Request, res: Response, next: NextFunction): void {
    // Always ensure CSRF token exists in cookie
    let csrfToken = req.cookies?.[this.CSRF_COOKIE_NAME];

    if (!csrfToken) {
      csrfToken = this.generateToken();
      res.cookie(this.CSRF_COOKIE_NAME, csrfToken, {
        httpOnly: false, // Must be readable by JavaScript
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
    }

    // Skip validation for safe methods
    if (this.SAFE_METHODS.includes(req.method.toUpperCase())) {
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
