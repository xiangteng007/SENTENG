// Sentry must be imported first before any other modules
import "./instrument";

// Early environment logging - MUST be before any other imports that might use env vars
// Note: Using console.log here as Logger isn't available yet at module load time
console.log("[BOOT] Starting with DB_HOST:", process.env.DB_HOST);

import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import * as Sentry from "@sentry/nestjs";
import helmet from "helmet";
import { DataSource } from "typeorm";
import cors from "cors";
import { Request, Response, NextFunction } from "express";

const cookieParser = require("cookie-parser");
import { AppModule } from "./app.module";
import { AuditLogInterceptor } from "./common/interceptors/audit-log.interceptor";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { CsrfMiddleware } from "./common/middleware/csrf.middleware";

async function runMigrations() {
  const logger = new Logger("Migrations");
  if (process.env.RUN_MIGRATIONS === "true") {
    logger.log("Running database migrations...");
    const dbHost = process.env.DB_HOST || "localhost";
    const isUnixSocket = dbHost.startsWith("/cloudsql/");
    logger.log(`DB_HOST: ${dbHost}, isUnixSocket: ${isUnixSocket}`);

    try {
      const dataSource = new DataSource({
        type: "postgres",
        host: dbHost,
        // Port must be undefined for Unix socket connections
        port: isUnixSocket
          ? undefined
          : parseInt(process.env.DB_PORT || "5432", 10),
        username: process.env.DB_USERNAME || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        database: process.env.DB_DATABASE || "erp",
        migrations: [__dirname + "/migrations/*.js"],
        logging: true,
        // Unix socket doesn't need SSL
        ssl: isUnixSocket ? false : undefined,
      });
      await dataSource.initialize();
      const pendingMigrations = await dataSource.showMigrations();
      if (pendingMigrations) {
        await dataSource.runMigrations({ transaction: "each" });
        logger.log("Migrations completed successfully");
      } else {
        logger.log("No pending migrations");
      }
      await dataSource.destroy();
    } catch (error) {
      logger.error("Migration failed:", error);
      // Fatal: schema-entity mismatch will cause runtime errors
      process.exit(1);
    }
  }
}

async function bootstrap() {
  // Run migrations before starting the app
  await runMigrations();

  // Create app WITHOUT NestJS CORS (we'll use cors middleware directly)
  const app = await NestFactory.create(AppModule);

  // ========================================
  // CORS - Using cors middleware directly (MOST RELIABLE)
  // Firebase Project: SENTENG (ID: senteng-4d9cb, Number: 738698283482)
  // ========================================
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
    : ["http://localhost:5173", "http://localhost:3000"];
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-CSRF-Token",
        "X-Requested-With",
      ],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    }),
  );

  // Enable cookie parsing for HttpOnly JWT tokens
  app.use(cookieParser());

  // Security headers with Helmet (after CORS)
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable CSP for API (frontend handles it)
      crossOriginEmbedderPolicy: false, // Allow embedding from other origins
    }),
  );

  // CSRF Protection using Double Submit Cookie pattern
  // Must be after cookie-parser and CORS
  const configService = app.get(ConfigService);
  const csrfMiddleware = new CsrfMiddleware(configService);
  app.use((req: Request, res: Response, next: NextFunction) =>
    csrfMiddleware.use(req, res, next),
  );

  // Global exception filter (unified error format)
  app.useGlobalFilters(new AllExceptionsFilter(configService));

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global security audit logging
  app.useGlobalInterceptors(new AuditLogInterceptor());

  // Global prefix
  app.setGlobalPrefix("api/v1");

  // OpenAPI/Swagger Documentation — only in non-production
  if (process.env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("SENTENG ERP API")
      .setDescription("盛騰 ERP 系統 API 文檔")
      .setVersion("1.0.0")
      .setContact("SENTENG Tech", "https://senteng.co", "dev@senteng.co")
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token",
        },
        "JWT-auth",
      )
      .addTag("auth", "認證相關 API")
      .addTag("users", "使用者管理")
      .addTag("projects", "專案管理")
      .addTag("partners", "合作夥伴 CRM")
      .addTag("quotations", "報價單")
      .addTag("contracts", "合約管理")
      .addTag("payments", "請款管理")
      .addTag("finance", "財務管理")
      .addTag("inventory", "庫存管理")
      .addTag("invoices", "發票管理")
      .addTag("integrations", "Google 整合")
      .addTag("health", "健康檢查")
      .addTag("cost-entries", "成本分錄")
      .addTag("change-orders", "變更單管理")
      .addTag("site-logs", "工地日誌")
      .addTag("construction", "營建管理")
      .addTag("drone", "無人機管理")
      .addTag("bim", "BIM 模型")
      .addTag("cmm", "施工材料計算")
      .addTag("schedules", "排程管理")
      .addTag("regulations", "法規爬蟲")
      .addTag("smart-home", "智慧家庭")
      .addTag("insurance", "保險管理")
      .addTag("waste", "廢棄物管理")
      .addTag("events", "事件管理")
      .addTag("telegram", "Telegram Bot")
      .addTag("platform", "平台管理 (RBAC/Audit)")
      .addTag("profit-analysis", "毛利分析")
      .addTag("storage", "檔案儲存")
      .addTag("realtime", "即時通訊")
      .addTag("notifications", "通知服務")
      .addTag("reports", "報表匯出")
      .addTag("supply-chain", "供應鏈管理")
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document, {
      customSiteTitle: "SENTENG ERP API Docs",
      customCss: ".swagger-ui .topbar { display: none }",
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: "none",
        filter: true,
        showExtensions: true,
      },
    });
  }

  const port = process.env.PORT || 3000;
  const logger = new Logger("Bootstrap");
  await app.listen(port, "0.0.0.0");
  logger.log(`🚀 API Server running on http://localhost:${port}/api/v1`);
  if (process.env.NODE_ENV !== "production") {
    logger.log(`📚 Swagger Docs: http://localhost:${port}/api/docs`);
  }
  logger.log(`🔐 Security: HttpOnly Cookies, Audit Logging, Rate Limiting`);
}
bootstrap();
