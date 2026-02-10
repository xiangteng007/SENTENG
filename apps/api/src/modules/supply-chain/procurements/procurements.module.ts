import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Procurement, ProcurementBid } from "./procurement.entity";
import { ProcurementsService } from "./procurements.service";
import { ProcurementsController } from "./procurements.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Procurement, ProcurementBid])],
  controllers: [ProcurementsController],
  providers: [ProcurementsService],
  exports: [ProcurementsService],
})
export class ProcurementsModule {}
