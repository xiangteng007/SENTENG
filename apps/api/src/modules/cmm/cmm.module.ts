import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

// Legacy entities
import { CmmMaterialMaster } from "./cmm-material-master.entity";
import { CmmBuildingProfile } from "./cmm-building-profile.entity";
import { CmmUnitConversion } from "./cmm-unit-conversion.entity";

// New taxonomy & calculation entities
import {
  CmmCategoryL1,
  CmmCategoryL2,
  CmmCategoryL3,
  CmmRuleSet,
  CmmConversionRule,
  CmmCalculationRun,
  CmmMaterialBreakdown,
} from "./entities";

import { CmmService } from "./cmm.service";
import { CmmController } from "./cmm.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Legacy
      CmmMaterialMaster,
      CmmBuildingProfile,
      CmmUnitConversion,
      // Taxonomy
      CmmCategoryL1,
      CmmCategoryL2,
      CmmCategoryL3,
      // Rules
      CmmRuleSet,
      CmmConversionRule,
      // Calculation tracking
      CmmCalculationRun,
      CmmMaterialBreakdown,
    ]),
  ],
  controllers: [CmmController],
  providers: [CmmService],
  exports: [CmmService],
})
export class CmmModule {}
