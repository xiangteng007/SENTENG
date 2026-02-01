import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

// Vendors
import { Vendor } from "./vendors/vendor.entity";
import { VendorContact } from "./vendors/vendor-contact.entity";
import { VendorTrade } from "./vendors/vendor-trade.entity";
import { VendorRating } from "./vendors/vendor-rating.entity";
import { VendorsService } from "./vendors/vendors.service";
import { VendorsController } from "./vendors/vendors.controller";

// Procurements
import { Procurement, ProcurementBid } from "./procurements/procurement.entity";
import { ProcurementsService } from "./procurements/procurements.service";
import { ProcurementsController } from "./procurements/procurements.controller";

/**
 * Supply Chain Domain Module
 * Consolidates vendors and procurements management
 * Phase 2 optimization - Domain consolidation
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vendor,
      VendorContact,
      VendorTrade,
      VendorRating,
      Procurement,
      ProcurementBid,
    ]),
  ],
  controllers: [VendorsController, ProcurementsController],
  providers: [VendorsService, ProcurementsService],
  exports: [VendorsService, ProcurementsService],
})
export class SupplyChainModule {}
