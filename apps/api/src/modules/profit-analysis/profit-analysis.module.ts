import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProfitAnalysisService } from "./profit-analysis.service";
import { ProfitAnalysisController } from "./profit-analysis.controller";
import { Contract } from "../contracts/contract.entity";
import { PaymentApplication, PaymentReceipt } from "../payments/payment.entity";
import { CostEntry } from "../cost-entries/cost-entry.entity";
import { Invoice } from "../invoices/invoice.entity";
import { ChangeOrder } from "../change-orders/change-order.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contract,
      PaymentApplication,
      PaymentReceipt,
      CostEntry,
      Invoice,
      ChangeOrder,
    ]),
  ],
  controllers: [ProfitAnalysisController],
  providers: [ProfitAnalysisService],
  exports: [ProfitAnalysisService],
})
export class ProfitAnalysisModule {}
