/**
 * Clients Module
 *
 * @deprecated This module is deprecated. Please use CustomersModule instead.
 * The /clients API endpoints will be removed after 2026-06-01.
 *
 * Migration Guide:
 * - Replace `/clients` with `/customers`
 * - ClientsService → CustomersService
 * - Client entity → Customer entity (includes client data + CRM features)
 *
 * @see CustomersModule for the replacement implementation
 */
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Client } from "./client.entity";
import { ClientContact } from "../../integrations/entities/client-contact.entity";
import { ClientsService } from "./clients.service";
import { ClientsController } from "./clients.controller";
import { ClientContactsController } from "./client-contacts.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Client, ClientContact])],
  controllers: [ClientsController, ClientContactsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
