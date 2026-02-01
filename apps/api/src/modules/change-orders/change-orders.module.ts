import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChangeOrder, ChangeOrderItem } from "./change-order.entity";
import { ChangeOrdersService } from "./change-orders.service";
import { ChangeOrdersController } from "./change-orders.controller";
import { ContractsModule } from "../contracts/contracts.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ChangeOrder, ChangeOrderItem]),
    ContractsModule,
  ],
  controllers: [ChangeOrdersController],
  providers: [ChangeOrdersService],
  exports: [ChangeOrdersService],
})
export class ChangeOrdersModule {}
