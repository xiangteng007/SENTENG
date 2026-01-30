import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quotation, QuotationItem } from './quotation.entity';
import { CreateQuotationDto, UpdateQuotationDto, QuotationItemDto } from './quotation.dto';

@Injectable()
export class QuotationsService {
  constructor(
    @InjectRepository(Quotation)
    private quotationsRepository: Repository<Quotation>,
    @InjectRepository(QuotationItem)
    private itemsRepository: Repository<QuotationItem>
  ) {}

  async findAll(options: { projectId?: string; status?: string }): Promise<Quotation[]> {
    const where: any = { isCurrent: true };
    if (options.projectId) where.projectId = options.projectId;
    if (options.status) where.status = options.status;

    return this.quotationsRepository.find({
      where,
      relations: ['project', 'items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Quotation> {
    const quotation = await this.quotationsRepository.findOne({
      where: { id },
      relations: ['project', 'items'],
    });
    if (!quotation) {
      throw new NotFoundException(`Quotation ${id} not found`);
    }
    return quotation;
  }

  async getVersions(id: string): Promise<Quotation[]> {
    const quotation = await this.findOne(id);
    const rootId = quotation.parentId || id;

    return this.quotationsRepository.find({
      where: [{ id: rootId }, { parentId: rootId }],
      order: { versionNo: 'ASC' },
    });
  }

  async create(dto: CreateQuotationDto, userId?: string): Promise<Quotation> {
    const id = await this.generateId();

    // 計算金額
    const items =
      dto.items?.map((item, idx) => ({
        ...item,
        id: `${id}-${String(idx + 1).padStart(3, '0')}`,
        quotationId: id,
        itemOrder: idx + 1,
        amount: item.quantity * item.unitPrice,
      })) || [];

    const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0);
    const taxRate = dto.taxRate || 5;
    const taxAmount = dto.isTaxIncluded ? 0 : subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    const quotation = this.quotationsRepository.create({
      ...dto,
      id,
      subtotal,
      taxAmount,
      totalAmount,
      status: 'QUO_DRAFT',
    });

    const saved = await this.quotationsRepository.save(quotation);

    // 儲存項目
    if (items.length > 0) {
      await this.itemsRepository.save(items);
    }

    return this.findOne(id);
  }

  async update(id: string, dto: UpdateQuotationDto, userId?: string): Promise<Quotation> {
    const quotation = await this.findOne(id);

    // 檢查鎖定
    if (quotation.lockedAt) {
      throw new ForbiddenException({
        code: 'LOCKED',
        message: '估價單已鎖定，不可修改',
      });
    }

    // 更新項目
    if (dto.items) {
      await this.itemsRepository.delete({ quotationId: id });

      const items = dto.items.map((item, idx) => ({
        ...item,
        id: `${id}-${String(idx + 1).padStart(3, '0')}`,
        quotationId: id,
        itemOrder: idx + 1,
        amount: item.quantity * item.unitPrice,
      }));

      await this.itemsRepository.save(items);

      // 重算金額
      const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0);
      const taxRate = dto.taxRate || quotation.taxRate;
      const isTaxIncluded = dto.isTaxIncluded ?? quotation.isTaxIncluded;
      const taxAmount = isTaxIncluded ? 0 : subtotal * (Number(taxRate) / 100);
      const totalAmount = subtotal + taxAmount;

      Object.assign(quotation, dto, { subtotal, taxAmount, totalAmount });
    } else {
      Object.assign(quotation, dto);
    }

    await this.quotationsRepository.save(quotation);
    return this.findOne(id);
  }

  async submit(id: string, userId?: string): Promise<Quotation> {
    const quotation = await this.findOne(id);

    if (quotation.status !== 'QUO_DRAFT') {
      throw new BadRequestException('只有草稿狀態可提交');
    }
    if (!quotation.items?.length) {
      throw new BadRequestException('估價單必須有至少一個項目');
    }
    if (quotation.totalAmount <= 0) {
      throw new BadRequestException('總金額必須大於 0');
    }

    quotation.status = 'QUO_PENDING';
    return this.quotationsRepository.save(quotation);
  }

  async approve(id: string, userId?: string): Promise<Quotation> {
    const quotation = await this.findOne(id);

    if (quotation.status !== 'QUO_PENDING') {
      throw new BadRequestException('只有待審核狀態可核准');
    }

    quotation.status = 'QUO_APPROVED';
    quotation.lockedAt = new Date();
    if (userId) quotation.lockedBy = userId;
    return this.quotationsRepository.save(quotation);
  }

  async reject(id: string, reason: string, userId?: string): Promise<Quotation> {
    const quotation = await this.findOne(id);

    if (quotation.status !== 'QUO_PENDING') {
      throw new BadRequestException('只有待審核狀態可駁回');
    }

    quotation.status = 'QUO_DRAFT';
    quotation.notes = `[駁回原因] ${reason}\n${quotation.notes || ''}`;
    return this.quotationsRepository.save(quotation);
  }

  async createNewVersion(id: string, userId?: string): Promise<Quotation> {
    const original = await this.findOne(id);

    if (!original.lockedAt) {
      throw new BadRequestException('只有已鎖定的估價單可建立新版本');
    }

    // 標記舊版本為非當前
    original.isCurrent = false;
    await this.quotationsRepository.save(original);

    // 建立新版本
    const newId = await this.generateId();
    const newQuotation = this.quotationsRepository.create({
      projectId: original.projectId,
      title: original.title,
      currency: original.currency,
      exchangeRate: original.exchangeRate,
      isTaxIncluded: original.isTaxIncluded,
      taxRate: original.taxRate,
      subtotal: original.subtotal,
      taxAmount: original.taxAmount,
      totalAmount: original.totalAmount,
      validUntil: original.validUntil,
      notes: original.notes,
      id: newId,
      parentId: original.parentId || id,
      versionNo: original.versionNo + 1,
      isCurrent: true,
      status: 'QUO_DRAFT',
      lockedAt: undefined,
      lockedBy: undefined,
    });

    await this.quotationsRepository.save(newQuotation);

    // 複製項目
    if (original.items?.length > 0) {
      const newItems = original.items.map((item, idx) =>
        this.itemsRepository.create({
          id: `${newId}-${String(idx + 1).padStart(3, '0')}`,
          quotationId: newId,
          itemOrder: item.itemOrder,
          category: item.category,
          itemName: item.itemName,
          spec: item.spec,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          remark: item.remark,
        })
      );
      await this.itemsRepository.save(newItems);
    }

    return this.findOne(newId);
  }

  private async generateId(): Promise<string> {
    const date = new Date();
    const prefix = `QUO-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-`;

    const last = await this.quotationsRepository
      .createQueryBuilder('q')
      .where('q.id LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('q.id', 'DESC')
      .getOne();

    let seq = 1;
    if (last) {
      const lastSeq = parseInt(last.id.split('-')[2], 10);
      seq = lastSeq + 1;
    }

    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  /**
   * Export quotations to Excel/CSV
   */
  async exportToExcel(options: {
    projectId?: string;
    status?: string;
    format?: 'xlsx' | 'csv';
  }): Promise<Buffer> {
    const ExcelJS = await import('exceljs');
    const { projectId, status, format = 'xlsx' } = options;

    const where: any = { isCurrent: true };
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const quotations = await this.quotationsRepository.find({
      where,
      relations: ['project', 'items'],
      order: { createdAt: 'DESC' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Quotations');

    sheet.columns = [
      { header: '報價編號', key: 'id', width: 20 },
      { header: '專案名稱', key: 'projectName', width: 25 },
      { header: '標題', key: 'title', width: 30 },
      { header: '小計', key: 'subtotal', width: 15 },
      { header: '稅額', key: 'taxAmount', width: 15 },
      { header: '總金額', key: 'totalAmount', width: 15 },
      { header: '狀態', key: 'status', width: 15 },
      { header: '有效期限', key: 'validUntil', width: 15 },
      { header: '版本', key: 'versionNo', width: 8 },
      { header: '建立日期', key: 'createdAt', width: 15 },
    ];

    for (const q of quotations) {
      sheet.addRow({
        id: q.id,
        projectName: q.project?.name || '',
        title: q.title || '',
        subtotal: q.subtotal,
        taxAmount: q.taxAmount,
        totalAmount: q.totalAmount,
        status: q.status,
        validUntil: q.validUntil ? new Date(q.validUntil).toLocaleDateString('zh-TW') : '',
        versionNo: q.versionNo,
        createdAt: q.createdAt ? new Date(q.createdAt).toLocaleDateString('zh-TW') : '',
      });
    }

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
