// Sentry must be imported first before any other modules
import './instrument';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as Sentry from '@sentry/nestjs';
import helmet from 'helmet';

const cookieParser = require('cookie-parser');
import { AppModule } from './app.module';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable cookie parsing for HttpOnly JWT tokens
  app.use(cookieParser());

  // CSRF Protection using Double Submit Cookie pattern
  // Must be after cookie-parser
  const csrfMiddleware = new CsrfMiddleware();
  app.use((req: any, res: any, next: any) => csrfMiddleware.use(req, res, next));

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable CSP for API (frontend handles it)
      crossOriginEmbedderPolicy: false, // Allow embedding from other origins
    })
  );

  // Enable CORS with credentials for cookies
  // Production: Set CORS_ORIGINS env var (comma-separated)
  const isProduction = process.env.NODE_ENV === 'production';
  const defaultOrigins = isProduction
    ? [
        'https://senteng.co',
        'https://senteng-erp.web.app',
        'https://senteng-erp.firebaseapp.com',
        'https://senteng-4d9cb.web.app',
        'https://senteng-4d9cb.firebaseapp.com',
      ]
    : [
        'http://localhost:5173',
        'http://localhost:5176',
        'https://senteng.co',
        'https://senteng-erp.web.app',
        'https://senteng-erp.firebaseapp.com',
        'https://senteng-4d9cb.web.app',
        'https://senteng-4d9cb.firebaseapp.com',
      ];
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : defaultOrigins;
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Required for cookies
  });

  // Global exception filter (unified error format)
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // Global security audit logging
  app.useGlobalInterceptors(new AuditLogInterceptor());

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // OpenAPI/Swagger Documentation (P2 - Production Readiness)
  const config = new DocumentBuilder()
    .setTitle('SENTENG ERP API')
    .setDescription(`
## 盛騰 ERP 系統 API 文檔

### 模組概覽
- **認證 (Auth)**: JWT 認證、權限管理
- **用戶 (Users)**: 使用者 CRUD、角色管理
- **客戶 (Clients)**: 客戶資料、聯絡人管理
- **供應商 (Vendors)**: 供應商、評鑑、採購
- **專案 (Projects)**: 專案生命週期管理
- **報價 (Quotations)**: 估價單 CRUD
- **合約 (Contracts)**: 合約管理
- **財務 (Finance)**: 交易、統計
- **庫存 (Inventory)**: 物料管理
- **整合 (Integrations)**: Google Calendar/Contacts 同步

### 安全特性
- HttpOnly Cookie JWT 認證
- CSRF 雙重提交保護
- 速率限制 (60 req/min)
- Audit Log 安全日誌
    `)
    .setVersion('1.0.0')
    .setContact('SENTENG Tech', 'https://senteng.co', 'dev@senteng.co')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
      'JWT-auth'
    )
    .addTag('auth', '認證相關 API')
    .addTag('users', '使用者管理')
    .addTag('clients', '客戶管理')
    .addTag('vendors', '供應商管理')
    .addTag('projects', '專案管理')
    .addTag('quotations', '報價單')
    .addTag('contracts', '合約管理')
    .addTag('payments', '請款管理')
    .addTag('finance', '財務管理')
    .addTag('inventory', '庫存管理')
    .addTag('integrations', 'Google 整合')
    .addTag('health', '健康檢查')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'SENTENG ERP API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API Server running on http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger Docs: http://localhost:${port}/api/docs`);
  console.log(
    `🔐 Security features enabled: HttpOnly Cookies, Audit Logging, Rate Limiting, Helmet`
  );
}
bootstrap();

