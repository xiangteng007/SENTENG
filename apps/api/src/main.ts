// Sentry must be imported first before any other modules
import './instrument';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API Server running on http://localhost:${port}/api/v1`);
  console.log(
    `🔐 Security features enabled: HttpOnly Cookies, Audit Logging, Rate Limiting, Helmet`
  );
}
bootstrap();
