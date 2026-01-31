import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Clients
import { Client } from './clients/client.entity';
import { ClientsService } from './clients/clients.service';
import { ClientsController } from './clients/clients.controller';
import { ClientContactsController } from './clients/client-contacts.controller';

// Contacts
import { Contact } from './contacts/contact.entity';
import { ContactsService } from './contacts/contacts.service';
import { ContactsController } from './contacts/contacts.controller';

/**
 * CRM 領域模組 - 統一客戶關係管理
 * 
 * 整併 clients + contacts，提供統一的 CRM 功能
 * 注意：原 customers 模組已於 Phase 2 合併至此
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Client, Contact]),
  ],
  controllers: [
    ClientsController,
    ClientContactsController,
    ContactsController,
  ],
  providers: [
    ClientsService,
    ContactsService,
  ],
  exports: [
    ClientsService,
    ContactsService,
  ],
})
export class CrmModule {}
