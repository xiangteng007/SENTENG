import { Module, Global } from "@nestjs/common";
import { IdGeneratorService } from "./id-generator/id-generator.service";
import { OwnershipGuard } from "./ownership/ownership.guard";
import { FeatureToggleService } from "./services/feature-toggle.service";

/**
 * CoreModule - 核心模組
 *
 * 提供全域共用的核心服務：
 * - IdGeneratorService: 統一 ID 生成
 * - OwnershipGuard: 統一擁有權檢查
 * - FeatureToggleService: 功能開關 (Phase 3)
 */
@Global()
@Module({
  providers: [IdGeneratorService, OwnershipGuard, FeatureToggleService],
  exports: [IdGeneratorService, OwnershipGuard, FeatureToggleService],
})
export class CoreModule {}
