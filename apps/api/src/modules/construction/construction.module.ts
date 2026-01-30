import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WbsItem, Schedule } from './wbs/entities';
import { SiteDiary } from './diary/entities';
import { QaqcIssue, SafetyInspection, SafetyIncident } from './safety/entities';
import { Subcontractor, SubContract, SubPayment } from './subcontractors/entities';

/**
 * ConstructionModule
 *
 * 營建工程領域模組，包含：
 * - WBS: 工作分解結構 (WbsItem, Schedule)
 * - Diary: 工地日誌 (SiteDiary)
 * - Safety: 品質與安全 (QaqcIssue, SafetyInspection, SafetyIncident)
 * - Subcontractors: 分包管理 (Subcontractor, SubContract, SubPayment)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      // WBS
      WbsItem,
      Schedule,
      // Diary
      SiteDiary,
      // Safety & QAQC
      QaqcIssue,
      SafetyInspection,
      SafetyIncident,
      // Subcontractors
      Subcontractor,
      SubContract,
      SubPayment,
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class ConstructionModule {}
