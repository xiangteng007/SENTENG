import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Account, Transaction, Loan } from "./entities";
import { Invoice } from "../invoices/invoice.entity";
import { FinanceService } from "./finance.service";
import { FinanceController } from "./finance.controller";
import { AgingAnalysisService } from "./aging-analysis.service";

@Module({
  imports: [TypeOrmModule.forFeature([Account, Transaction, Loan, Invoice])],
  controllers: [FinanceController],
  providers: [FinanceService, AgingAnalysisService],
  exports: [FinanceService, AgingAnalysisService],
})
export class FinanceModule {}

