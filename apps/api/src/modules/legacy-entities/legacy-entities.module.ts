/**
 * LegacyEntitiesModule
 *
 * 僅註冊舊模組的 Entity 到 TypeORM，不包含 Service/Controller
 * 其他模組（projects, invoices, integrations 等）仍需要這些 Entity 的 metadata
 * 當所有 entity reference 都遷移到 Partner 後就可以移除此模組
 */
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

// Legacy entities - still mapped to existing database tables
import { Customer } from "../customers/customer.entity";
import { CustomerContact } from "../customers/customer-contact.entity";
import { Contact } from "../contacts/contact.entity";
import { Client } from "../crm/clients/client.entity";
import { Vendor } from "../supply-chain/vendors/vendor.entity";
import { VendorContact } from "../supply-chain/vendors/vendor-contact.entity";
import { VendorRating } from "../supply-chain/vendors/vendor-rating.entity";
import { VendorTrade } from "../supply-chain/vendors/vendor-trade.entity";
import {
  Procurement,
  ProcurementBid,
} from "../supply-chain/procurements/procurement.entity";

// Integration entities that reference legacy entities
import { ClientContact } from "../integrations/entities/client-contact.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      CustomerContact,
      Contact,
      Client,
      ClientContact,
      Vendor,
      VendorContact,
      VendorRating,
      VendorTrade,
      Procurement,
      ProcurementBid,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class LegacyEntitiesModule {}
