import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Customer, PipelineStage } from './customer.entity';
import { CustomerContact } from './customer-contact.entity';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerQueryDto,
  CreateContactDto,
} from './customer.dto';
import { isAdminRole } from '../../common/constants/roles';
import { IdGeneratorService, checkResourceOwnership } from '../../core';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
    @InjectRepository(CustomerContact)
    private contactRepo: Repository<CustomerContact>,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async findAll(
    query: CustomerQueryDto,
    userId?: string,
    userRole?: string
  ): Promise<{ items: Customer[]; total: number }> {
    const { page = 1, limit = 20, status, pipelineStage, search, tag } = query;
    const qb = this.customerRepo.createQueryBuilder('c');

    // Filters
    if (status) qb.andWhere('c.status = :status', { status });
    if (pipelineStage) qb.andWhere('c.pipelineStage = :pipelineStage', { pipelineStage });
    if (search) {
      qb.andWhere('(c.name ILIKE :search OR c.phone ILIKE :search OR c.email ILIKE :search)', {
        search: `%${search}%`,
      });
    }
    if (tag) qb.andWhere(':tag = ANY(c.tags)', { tag });

    // IDOR: Non-admin sees only their created customers
    if (userId && userRole && !isAdminRole(userRole)) {
      qb.andWhere('c.createdBy = :userId', { userId });
    }

    const [items, total] = await qb
      .orderBy('c.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }

  async findOne(id: string, userId?: string, userRole?: string): Promise<Customer> {
    const customer = await this.customerRepo.findOne({
      where: { id },
      relations: ['contacts'],
    });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    checkResourceOwnership(customer, userId, userRole, 'customer');
    return customer;
  }

  async findProjects(customerId: string): Promise<any[]> {
    // Will be implemented with Project module integration
    // For now, return empty array
    return [];
  }

  async create(dto: CreateCustomerDto, userId?: string): Promise<Customer> {
    const id = await this.idGenerator.generateForTable('customers', 'CLT');
    const customer = this.customerRepo.create({
      ...dto,
      id,
      createdBy: userId,
    });
    return this.customerRepo.save(customer);
  }

  async update(
    id: string,
    dto: UpdateCustomerDto,
    userId?: string,
    userRole?: string
  ): Promise<Customer> {
    const customer = await this.findOne(id, userId, userRole);
    Object.assign(customer, dto, { updatedBy: userId });
    return this.customerRepo.save(customer);
  }

  async updatePipelineStage(
    id: string,
    stage: PipelineStage,
    userId?: string,
    userRole?: string
  ): Promise<Customer> {
    const customer = await this.findOne(id, userId, userRole);
    customer.pipelineStage = stage;
    customer.updatedBy = userId ?? null;
    return this.customerRepo.save(customer);
  }

  async remove(id: string, userId?: string, userRole?: string): Promise<void> {
    const customer = await this.findOne(id, userId, userRole);
    await this.customerRepo.softRemove(customer);
  }

  // Contact management
  async addContact(
    customerId: string,
    dto: CreateContactDto,
    userId?: string,
    userRole?: string
  ): Promise<CustomerContact> {
    await this.findOne(customerId, userId, userRole);
    const contact = this.contactRepo.create({
      ...dto,
      customerId,
    });
    return this.contactRepo.save(contact);
  }

  async removeContact(contactId: string): Promise<void> {
    await this.contactRepo.delete(contactId);
  }

  // checkOwnership and generateId moved to Core Layer
  // Use: checkResourceOwnership(entity, userId, userRole, 'entityName')
  // Use: this.idGenerator.generateForTable('tableName', 'PREFIX')
}
