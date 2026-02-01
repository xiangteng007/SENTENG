import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PaymentApplication, PaymentReceipt } from "./payment.entity";
import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";
import { ContractsModule } from "../contracts/contracts.module";
import { FinanceModule } from "../finance/finance.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentApplication, PaymentReceipt]),
    ContractsModule,
    FinanceModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
