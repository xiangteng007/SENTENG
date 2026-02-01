/**
 * Supply Chain Module - Barrel Export
 * Phase 2 optimization - Domain consolidation
 */

// Module
export { SupplyChainModule } from "./supply-chain.module";

// Vendors
export { Vendor } from "./vendors/vendor.entity";
export { VendorContact } from "./vendors/vendor-contact.entity";
export { VendorTrade } from "./vendors/vendor-trade.entity";
export { VendorRating } from "./vendors/vendor-rating.entity";
export { VendorsService } from "./vendors/vendors.service";

// Procurements
export { Procurement, ProcurementBid } from "./procurements/procurement.entity";
export { ProcurementsService } from "./procurements/procurements.service";
