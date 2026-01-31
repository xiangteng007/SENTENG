import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Client } from './client.entity';
import { CreateClientDto, UpdateClientDto } from './client.dto';
import { isAdminRole } from '../../common/constants/roles';
import { IdGeneratorService, checkResourceOwnership } from '../../core';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async findAll(
    options: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
    },
    userId?: string,
    userRole?: string
  ): Promise<{ items: Client[]; total: number }> {
    const { page = 1, limit = 20, status, search } = options;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.name = Like(`%${search}%`);
    }

    // IDOR Protection: Non-admin users see only their created clients
    if (userId && userRole && !isAdminRole(userRole)) {
      where.createdBy = userId;
    }

    const [items, total] = await this.clientsRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { items, total };
  }

  async findOne(id: string, userId?: string, userRole?: string): Promise<Client> {
    const client = await this.clientsRepository.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException(`Client ${id} not found`);
    }
    checkResourceOwnership(client, userId, userRole, 'client');
    return client;
  }

  async create(dto: CreateClientDto, userId?: string): Promise<Client> {
    const id = await this.idGenerator.generateForTable('clients', 'CLT');
    const client = this.clientsRepository.create({
      ...dto,
      id,
      createdBy: userId,
    });
    return this.clientsRepository.save(client);
  }

  async update(
    id: string,
    dto: UpdateClientDto,
    userId?: string,
    userRole?: string
  ): Promise<Client> {
    const client = await this.findOne(id, userId, userRole);
    Object.assign(client, dto, { updatedBy: userId });
    return this.clientsRepository.save(client);
  }

  async remove(id: string, userId?: string, userRole?: string): Promise<void> {
    const client = await this.findOne(id, userId, userRole);
    await this.clientsRepository.remove(client);
  }

  // checkOwnership and generateId moved to Core Layer

  /**
   * Export clients to Excel/CSV
   */
  async exportToExcel(
    options: { status?: string; search?: string; format?: 'xlsx' | 'csv' },
    userId?: string,
    userRole?: string
  ): Promise<Buffer> {
    const ExcelJS = await import('exceljs');
    const { status, search, format = 'xlsx' } = options;

    // Get all clients matching filters (no pagination for export)
    const where: any = {};
    if (status) where.status = status;
    if (search) where.name = Like(`%${search}%`);
    if (userId && userRole && !isAdminRole(userRole)) {
      where.createdBy = userId;
    }

    const clients = await this.clientsRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Clients');

    // Define columns
    sheet.columns = [
      { header: '客戶編號', key: 'id', width: 20 },
      { header: '客戶名稱', key: 'name', width: 30 },
      { header: '聯絡人', key: 'contactPerson', width: 20 },
      { header: '電話', key: 'phone', width: 15 },
      { header: '電子郵件', key: 'email', width: 30 },
      { header: '地址', key: 'address', width: 40 },
      { header: '狀態', key: 'status', width: 10 },
      { header: '建立日期', key: 'createdAt', width: 15 },
    ];

    // Add data rows
    for (const client of clients) {
      sheet.addRow({
        id: client.id,
        name: client.name,
        contactPerson: client.contactName || '',
        phone: client.phone || '',
        email: client.email || '',
        address: client.address || '',
        status: client.status,
        createdAt: client.createdAt ? new Date(client.createdAt).toLocaleDateString('zh-TW') : '',
      });
    }

    // Style header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    if (format === 'csv') {
      return Buffer.from(await workbook.csv.writeBuffer());
    }
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
