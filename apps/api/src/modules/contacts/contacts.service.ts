import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Contact, ContactOwnerType, ContactSyncStatus } from './contact.entity';
import { CreateContactDto, UpdateContactDto, ContactQueryDto } from './contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>
  ) {}

  async findAll(query: ContactQueryDto): Promise<{ items: Contact[]; total: number }> {
    const where: FindOptionsWhere<Contact> = { isActive: true };

    if (query.ownerType) {
      where.ownerType = query.ownerType;
    }
    if (query.ownerId) {
      where.ownerId = query.ownerId;
    }
    if (query.role) {
      where.role = query.role;
    }
    if (query.isPrimary !== undefined) {
      where.isPrimary = query.isPrimary;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    if (query.search) {
      where.name = Like(`%${query.search}%`);
    }

    const [items, total] = await this.contactRepository.findAndCount({
      where,
      order: { isPrimary: 'DESC', name: 'ASC' },
    });

    return { items, total };
  }

  async findByOwner(ownerType: ContactOwnerType, ownerId: string): Promise<Contact[]> {
    return this.contactRepository.find({
      where: { ownerType, ownerId, isActive: true },
      order: { isPrimary: 'DESC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Contact> {
    const contact = await this.contactRepository.findOne({ where: { id } });
    if (!contact) {
      throw new NotFoundException(`Contact ${id} not found`);
    }
    return contact;
  }

  async create(dto: CreateContactDto): Promise<Contact> {
    // If new contact is primary, unset other primary contacts for same owner
    if (dto.isPrimary) {
      await this.contactRepository.update(
        { ownerType: dto.ownerType, ownerId: dto.ownerId, isPrimary: true },
        { isPrimary: false }
      );
    }

    const contact = this.contactRepository.create({
      ...dto,
      syncStatus: ContactSyncStatus.PENDING,
    });
    return this.contactRepository.save(contact);
  }

  async update(id: string, dto: UpdateContactDto): Promise<Contact> {
    const contact = await this.findOne(id);

    // If updating to primary, unset other primary contacts
    if (dto.isPrimary && !contact.isPrimary) {
      await this.contactRepository.update(
        {
          ownerType: contact.ownerType,
          ownerId: contact.ownerId,
          isPrimary: true,
        },
        { isPrimary: false }
      );
    }

    Object.assign(contact, dto);
    contact.syncStatus = ContactSyncStatus.PENDING;
    return this.contactRepository.save(contact);
  }

  async remove(id: string): Promise<void> {
    const contact = await this.findOne(id);
    contact.isActive = false;
    await this.contactRepository.save(contact);
  }

  async hardRemove(id: string): Promise<void> {
    await this.contactRepository.delete(id);
  }

  // Google Contacts sync helpers
  async markSynced(id: string, googleContactId: string): Promise<void> {
    await this.contactRepository.update(id, {
      googleContactId,
      syncStatus: ContactSyncStatus.SYNCED,
      lastSyncedAt: new Date(),
      lastSyncError: undefined,
    });
  }

  async markSyncFailed(id: string, error: string): Promise<void> {
    await this.contactRepository.update(id, {
      syncStatus: ContactSyncStatus.FAILED,
      lastSyncError: error,
    });
  }

  async getPendingSyncContacts(): Promise<Contact[]> {
    return this.contactRepository.find({
      where: { syncStatus: ContactSyncStatus.PENDING, isActive: true },
      take: 100,
    });
  }
}
