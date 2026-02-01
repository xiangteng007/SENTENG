/**
 * Sentry Error Tracking - 錯誤追蹤初始化
 *
 * 在 main.ts 最頂部 import 此檔案：
 * import './instrument';
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nestjs/
 */
import * as Sentry from "@sentry/nestjs";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// 僅在生產環境初始化 Sentry
if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // 效能追蹤樣本率 (生產環境建議 0.1-0.3)
    tracesSampleRate: parseFloat(
      process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1",
    ),

    // Profiling 樣本率
    profilesSampleRate: parseFloat(
      process.env.SENTRY_PROFILES_SAMPLE_RATE || "0.1",
    ),

    // 環境標識
    environment: process.env.NODE_ENV,

    // 版本標識 (使用 package.json 版本或 Git SHA)
    release: process.env.SENTRY_RELEASE || process.env.npm_package_version,

    // 整合
    integrations: [nodeProfilingIntegration()],

    // 忽略特定錯誤
    ignoreErrors: [
      // 忽略常見的非錯誤
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
    ],

    // 過濾敏感資料
    beforeSend(event) {
      // 移除敏感 headers
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }
      return event;
    },
  });

  console.log("✅ Sentry initialized for error tracking");
} else {
  console.log("ℹ️ Sentry disabled (development mode or no DSN configured)");
}

export { Sentry };
