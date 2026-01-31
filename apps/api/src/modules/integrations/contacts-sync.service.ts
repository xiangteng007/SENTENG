/**
 * contacts-sync.service.ts
 *
 * Google Contacts 同步服務（正式實作）
 * ERP Client/Vendor Contacts → Google Contacts（單向同步）
 * 支援建立、更新同步（避免重複建立）
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { google, people_v1 } from 'googleapis';
import { ClientContact } from './entities/client-contact.entity';
import { VendorContact } from '../supply-chain/vendors/vendor-contact.entity';
import { GoogleOAuthService } from './google-oauth.service';
import { SyncResultDto, BulkSyncResultDto } from './dto';
import { AuditService, AuditContext } from '../platform/audit/audit.service';

@Injectable()
export class ContactsSyncService {
  private readonly logger = new Logger(ContactsSyncService.name);

  constructor(
    @InjectRepository(ClientContact)
    private readonly clientContactRepo: Repository<ClientContact>,
    @InjectRepository(VendorContact)
    private readonly vendorContactRepo: Repository<VendorContact>,
    private readonly oauthService: GoogleOAuthService,
    private readonly auditService: AuditService
  ) {}

  /**
   * 同步客戶聯絡人到 Google Contacts
   */
  async syncClientContact(
    contactId: string,
    userId: string,
    context?: AuditContext
  ): Promise<SyncResultDto> {
    const contact = await this.clientContactRepo.findOne({
      where: { id: contactId },
      relations: ['client'],
    });
    if (!contact) {
      return {
        success: false,
        syncedAt: new Date().toISOString(),
        error: '聯絡人不存在',
      };
    }

    return this.syncContact(contact, 'client', userId, context);
  }

  /**
   * 同步廠商聯絡人到 Google Contacts
   */
  async syncVendorContact(
    contactId: string,
    userId: string,
    context?: AuditContext
  ): Promise<SyncResultDto> {
    const contact = await this.vendorContactRepo.findOne({
      where: { id: contactId },
      relations: ['vendor'],
    });
    if (!contact) {
      return {
        success: false,
        syncedAt: new Date().toISOString(),
        error: '聯絡人不存在',
      };
    }

    return this.syncContact(contact, 'vendor', userId, context);
  }

  /**
   * 同步某客戶的所有聯絡人
   */
  async syncAllClientContacts(
    clientId: string,
    userId: string,
    context?: AuditContext
  ): Promise<BulkSyncResultDto> {
    const contacts = await this.clientContactRepo.find({
      where: { clientId, isActive: true },
      relations: ['client'],
    });

    return this.syncMultiple(contacts, 'client', userId, context);
  }

  /**
   * 同步某廠商的所有聯絡人
   */
  async syncAllVendorContacts(
    vendorId: string,
    userId: string,
    context?: AuditContext
  ): Promise<BulkSyncResultDto> {
    const contacts = await this.vendorContactRepo.find({
      where: { vendorId, isActive: true },
      relations: ['vendor'],
    });

    return this.syncMultiple(contacts, 'vendor', userId, context);
  }

  /**
   * 同步單一聯絡人
   * 支援「更新同步」：若 googleResourceName 存在則 update，否則 create
   */
  private async syncContact(
    contact: ClientContact | VendorContact,
    type: 'client' | 'vendor',
    userId: string,
    context?: AuditContext
  ): Promise<SyncResultDto> {
    // 檢查是否可同步
    if (contact.syncStatus === 'DISABLED') {
      return {
        success: false,
        syncedAt: new Date().toISOString(),
        error: '此聯絡人已停用同步',
      };
    }

    const previousStatus = contact.syncStatus;

    try {
      const account = await this.oauthService.getAccountByUserId(userId);
      if (!account) {
        return {
          success: false,
          syncedAt: new Date().toISOString(),
          error: 'Google 帳號未連結',
        };
      }

      // 取得 OAuth2 Client 並建立 People API
      const auth = await this.oauthService.getOAuth2Client(userId);
      const people = google.people({ version: 'v1', auth });

      // 決定組織名稱和群組標籤
      const orgName =
        type === 'client'
          ? (contact as ClientContact).client?.name || 'Unknown Client'
          : (contact as VendorContact).vendor?.name || 'Unknown Vendor';
      const groupLabel = account.contactsLabel || 'Senteng ERP';

      // 建立 Google Contacts 資料
      const personData: people_v1.Schema$Person = {
        names: [{ givenName: contact.fullName }],
        emailAddresses: contact.email ? [{ value: contact.email, type: 'work' }] : [],
        phoneNumbers: this.buildPhoneNumbers(contact),
        organizations: [
          {
            name: orgName,
            title: contact.title || '',
            department: contact.department || '',
          },
        ],
        biographies: contact.note ? [{ value: contact.note, contentType: 'TEXT_PLAIN' }] : [],
        userDefined: [
          { key: 'Source', value: 'Senteng ERP' },
          {
            key: 'Type',
            value: type === 'client' ? 'Client Contact' : 'Vendor Contact',
          },
          { key: 'ERP ID', value: contact.id },
        ],
      };

      let googleResourceName: string;

      if (contact.googleResourceName) {
        // 更新現有聯絡人
        this.logger.log(`Updating existing Google Contact: ${contact.googleResourceName}`);

        // 先取得現有聯絡人的 etag
        const existingContact = await people.people.get({
          resourceName: contact.googleResourceName,
          personFields: 'names,emailAddresses,phoneNumbers,organizations',
        });

        personData.etag = existingContact.data.etag;

        const response = await people.people.updateContact({
          resourceName: contact.googleResourceName,
          updatePersonFields:
            'names,emailAddresses,phoneNumbers,organizations,biographies,userDefined',
          requestBody: personData,
        });
        googleResourceName = response.data.resourceName || contact.googleResourceName;
      } else {
        // 建立新聯絡人
        this.logger.log(`Creating new Google Contact for: ${contact.fullName}`);
        const response = await people.people.createContact({
          requestBody: personData,
        });
        googleResourceName = response.data.resourceName || '';
      }

      // 更新 ERP 聯絡人狀態
      contact.googleResourceName = googleResourceName;
      contact.syncStatus = 'SYNCED';
      contact.lastSyncedAt = new Date();
      contact.lastSyncError = '';

      if (type === 'client') {
        await this.clientContactRepo.save(contact as ClientContact);
      } else {
        await this.vendorContactRepo.save(contact as VendorContact);
      }

      // Audit log
      await this.auditService.logUpdate(
        type === 'client' ? 'ClientContact' : 'VendorContact',
        contact.id,
        { syncStatus: previousStatus },
        { syncStatus: 'SYNCED', googleResourceName },
        context
      );

      this.logger.log(`Contact ${contact.id} synced to Google Contacts: ${googleResourceName}`);

      return {
        success: true,
        syncedAt: new Date().toISOString(),
        googleId: googleResourceName,
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';

      // 更新失敗狀態
      contact.syncStatus = 'FAILED';
      contact.lastSyncError = errorMessage;

      if (type === 'client') {
        await this.clientContactRepo.save(contact as ClientContact);
      } else {
        await this.vendorContactRepo.save(contact as VendorContact);
      }

      // Audit log 失敗
      await this.auditService.logUpdate(
        type === 'client' ? 'ClientContact' : 'VendorContact',
        contact.id,
        { syncStatus: previousStatus },
        { syncStatus: 'FAILED', lastSyncError: errorMessage },
        context
      );

      this.logger.error(`Contact sync failed for ${contact.id}: ${errorMessage}`);

      return {
        success: false,
        syncedAt: new Date().toISOString(),
        error: errorMessage,
      };
    }
  }

  /**
   * 批量同步多個聯絡人
   */
  private async syncMultiple(
    contacts: Array<ClientContact | VendorContact>,
    type: 'client' | 'vendor',
    userId: string,
    context?: AuditContext
  ): Promise<BulkSyncResultDto> {
    const result: BulkSyncResultDto = {
      total: contacts.length,
      synced: 0,
      failed: 0,
      errors: [],
    };

    for (const contact of contacts) {
      const syncResult = await this.syncContact(contact, type, userId, context);
      if (syncResult.success) {
        result.synced++;
      } else {
        result.failed++;
        result.errors.push({
          id: contact.id,
          error: syncResult.error || 'Unknown error',
        });
      }
    }

    await this.oauthService.updateLastSync(
      userId,
      result.failed > 0 ? `${result.failed} contacts failed to sync` : undefined
    );

    return result;
  }

  /**
   * 建立電話號碼陣列
   */
  private buildPhoneNumbers(
    contact: ClientContact | VendorContact
  ): people_v1.Schema$PhoneNumber[] {
    const phones: people_v1.Schema$PhoneNumber[] = [];

    if (contact.phone) {
      phones.push({ value: contact.phone, type: 'work' });
    }
    if (contact.mobile) {
      phones.push({ value: contact.mobile, type: 'mobile' });
    }

    return phones;
  }

  /**
   * 從 Google Contacts 刪除聯絡人
   */
  async deleteContactFromGoogle(
    contactId: string,
    userId: string,
    context?: AuditContext
  ): Promise<SyncResultDto> {
    // Try to find in client contacts first
    let contact: ClientContact | VendorContact | null = await this.clientContactRepo.findOne({
      where: { id: contactId },
    });
    let type: 'client' | 'vendor' = 'client';

    if (!contact) {
      contact = await this.vendorContactRepo.findOne({
        where: { id: contactId },
      });
      type = 'vendor';
    }

    if (!contact) {
      return {
        success: false,
        syncedAt: new Date().toISOString(),
        error: '聯絡人不存在',
      };
    }

    if (!contact.googleResourceName) {
      return {
        success: true,
        syncedAt: new Date().toISOString(),
        // No Google contact to delete, consider it success
      };
    }

    try {
      const auth = await this.oauthService.getOAuth2Client(userId);
      const people = google.people({ version: 'v1', auth });

      this.logger.log(`Deleting Google Contact: ${contact.googleResourceName}`);

      await people.people.deleteContact({
        resourceName: contact.googleResourceName,
      });

      // Clear the googleResourceName from ERP contact
      contact.googleResourceName = '';
      contact.syncStatus = 'PENDING';

      if (type === 'client') {
        await this.clientContactRepo.save(contact as ClientContact);
      } else {
        await this.vendorContactRepo.save(contact as VendorContact);
      }

      // Audit log
      await this.auditService.logUpdate(
        type === 'client' ? 'ClientContact' : 'VendorContact',
        contact.id,
        { googleResourceName: contact.googleResourceName },
        { googleResourceName: '', syncStatus: 'PENDING' },
        context
      );

      this.logger.log(`Contact ${contact.id} deleted from Google Contacts`);

      return {
        success: true,
        syncedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      this.logger.error(`Delete from Google failed for ${contact.id}: ${errorMessage}`);

      return {
        success: false,
        syncedAt: new Date().toISOString(),
        error: errorMessage,
      };
    }
  }

  /**
   * 刪除客戶的所有聯絡人從 Google Contacts
   */
  async deleteAllClientContactsFromGoogle(
    clientId: string,
    userId: string,
    context?: AuditContext
  ): Promise<BulkSyncResultDto> {
    const contacts = await this.clientContactRepo.find({
      where: { clientId },
    });

    const result: BulkSyncResultDto = {
      total: contacts.length,
      synced: 0,
      failed: 0,
      errors: [],
    };

    for (const contact of contacts) {
      if (contact.googleResourceName) {
        const deleteResult = await this.deleteContactFromGoogle(contact.id, userId, context);
        if (deleteResult.success) {
          result.synced++;
        } else {
          result.failed++;
          result.errors.push({
            id: contact.id,
            error: deleteResult.error || 'Unknown error',
          });
        }
      }
    }

    return result;
  }

  /**
   * 刪除廠商的所有聯絡人從 Google Contacts
   */
  async deleteAllVendorContactsFromGoogle(
    vendorId: string,
    userId: string,
    context?: AuditContext
  ): Promise<BulkSyncResultDto> {
    const contacts = await this.vendorContactRepo.find({
      where: { vendorId },
    });

    const result: BulkSyncResultDto = {
      total: contacts.length,
      synced: 0,
      failed: 0,
      errors: [],
    };

    for (const contact of contacts) {
      if (contact.googleResourceName) {
        const deleteResult = await this.deleteContactFromGoogle(contact.id, userId, context);
        if (deleteResult.success) {
          result.synced++;
        } else {
          result.failed++;
          result.errors.push({
            id: contact.id,
            error: deleteResult.error || 'Unknown error',
          });
        }
      }
    }

    return result;
  }
}
