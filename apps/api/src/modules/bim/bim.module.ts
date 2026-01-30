import { Module } from '@nestjs/common';
import { BimModelsModule } from './models/bim-models.module';
import { BimIssuesModule } from './issues/bim-issues.module';

/**
 * BimModule
 *
 * BIM 領域模組，包含：
 * - Models: BIM 模型管理 (BimModel, BimModelVersion, BimElement, BimQuantity)
 * - Issues: BCF 議題追蹤 (BcfIssue, IssueComment)
 */
@Module({
  imports: [BimModelsModule, BimIssuesModule],
  exports: [BimModelsModule, BimIssuesModule],
})
export class BimModule {}
