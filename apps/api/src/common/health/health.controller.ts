import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectConnection } from "@nestjs/typeorm";
import { Connection } from "typeorm";

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthCheckResult;
    memory: HealthCheckResult;
  };
}

export interface HealthCheckResult {
  status: "up" | "down";
  responseTime?: number;
  details?: Record<string, any>;
}

/**
 * Health Check Controller
 * Provides endpoints for load balancers and monitoring
 * Phase 3 optimization - Production readiness
 */
@Controller("health")
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Liveness probe - Quick check if the service is running
   * Used by Kubernetes/Cloud Run to determine if the container should be restarted
   */
  @Get()
  async liveness(): Promise<{ status: string }> {
    return { status: "ok" };
  }

  /**
   * Readiness probe - Full health check
   * Used by load balancers to determine if the service can receive traffic
   */
  @Get("ready")
  async readiness(): Promise<HealthStatus> {
    const dbCheck = await this.checkDatabase();
    const memoryCheck = this.checkMemory();

    const allUp = dbCheck.status === "up" && memoryCheck.status === "up";
    const anyDown = dbCheck.status === "down" || memoryCheck.status === "down";

    return {
      status: allUp ? "healthy" : anyDown ? "unhealthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: this.configService.get<string>("npm_package_version", "1.0.0"),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      checks: {
        database: dbCheck,
        memory: memoryCheck,
      },
    };
  }

  /**
   * Detailed health check for monitoring dashboards
   */
  @Get("details")
  async details(): Promise<
    HealthStatus & { environment: Record<string, any> }
  > {
    const health = await this.readiness();

    return {
      ...health,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
    };
  }

  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      await this.connection.query("SELECT 1");
      return {
        status: "up",
        responseTime: Date.now() - startTime,
        details: {
          connected: this.connection.isConnected,
          type: this.connection.options.type,
        },
      };
    } catch (error: unknown) {
      return {
        status: "down",
        responseTime: Date.now() - startTime,
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  private checkMemory(): HealthCheckResult {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    const heapTotalMB = usage.heapTotal / 1024 / 1024;
    const usagePercent = (heapUsedMB / heapTotalMB) * 100;

    return {
      status: usagePercent < 90 ? "up" : "down",
      details: {
        heapUsedMB: Math.round(heapUsedMB),
        heapTotalMB: Math.round(heapTotalMB),
        usagePercent: Math.round(usagePercent),
        rssBytes: usage.rss,
      },
    };
  }
}
