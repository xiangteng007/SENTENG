import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from './contract.entity';
import { CreateContractDto, UpdateContractDto, ConvertFromQuotationDto } from './contract.dto';
import { QuotationsService } from '../quotations/quotations.service';
import { ProjectsService } from '../projects/projects.service';
import { isAdminRole } from '../../common/constants/roles';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private contractsRepository: Repository<Contract>,
    private quotationsService: QuotationsService,
    private projectsService: ProjectsService
  ) {}

  async findAll(
    options: { projectId?: string; status?: string },
    userId?: string,
    userRole?: string
  ): Promise<Contract[]> {
    const where: any = {};
    if (options.projectId) where.projectId = options.projectId;
    if (options.status) where.status = options.status;

    // IDOR Protection: Non-admin users see only contracts from their projects
    if (userId && userRole && !isAdminRole(userRole)) {
      where.createdBy = userId;
    }

    return this.contractsRepository.find({
      where,
      relations: ['project', 'quotation'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId?: string, userRole?: string): Promise<Contract> {
    const contract = await this.contractsRepository.findOne({
      where: { id },
      relations: ['project', 'quotation'],
    });
    if (!contract) {
      throw new NotFoundException(`Contract ${id} not found`);
    }

    // IDOR Protection: Check ownership for non-admin users
    this.checkOwnership(contract, userId, userRole);

    return contract;
  }

  async create(dto: CreateContractDto, userId?: string): Promise<Contract> {
    const id = await this.generateId();

    const contract = this.contractsRepository.create({
      ...dto,
      id,
      currentAmount: dto.originalAmount,
      retentionAmount: dto.originalAmount * ((dto.retentionRate || 0) / 100),
      status: 'CTR_DRAFT',
    });

    return this.contractsRepository.save(contract);
  }

  async convertFromQuotation(dto: ConvertFromQuotationDto, userId?: string): Promise<Contract> {
    // 取得估價單
    const quotation = await this.quotationsService.findOne(dto.quotationId);

    // 檢查估價單是否已核准
    if (quotation.status !== 'QUO_APPROVED') {
      throw new BadRequestException('只有已核准的估價單可轉換為合約');
    }

    // 檢查是否已有合約
    const existingContract = await this.contractsRepository.findOne({
      where: { quotationId: dto.quotationId },
    });
    if (existingContract) {
      throw new BadRequestException('此估價單已轉換為合約');
    }

    const id = await this.generateId();
    const originalAmount = Number(quotation.totalAmount);
    const retentionRate = dto.retentionRate || 0;

    const contract = this.contractsRepository.create({
      id,
      projectId: quotation.projectId,
      quotationId: dto.quotationId,
      contractNo: dto.contractNo,
      title: quotation.title || `${quotation.project?.name || ''} 合約`,
      currency: quotation.currency,
      originalAmount,
      currentAmount: originalAmount,
      retentionRate,
      retentionAmount: originalAmount * (retentionRate / 100),
      paymentTerms: dto.paymentTerms || 'PROGRESS',
      warrantyMonths: dto.warrantyMonths || 12,
      status: 'CTR_DRAFT',
    });

    return this.contractsRepository.save(contract);
  }

  async update(id: string, dto: UpdateContractDto, userId?: string): Promise<Contract> {
    const contract = await this.findOne(id);

    // 檢查鎖定
    if (contract.lockedAt) {
      // 簽約後只能改特定欄位
      const allowedFields = ['notes', 'warrantyMonths'];
      const updateKeys = Object.keys(dto);
      const hasDisallowed = updateKeys.some(key => !allowedFields.includes(key));
      if (hasDisallowed) {
        throw new ForbiddenException({
          code: 'LOCKED',
          message: '合約已簽訂，僅可修改備註',
        });
      }
    }

    // 更新保留款金額
    if (dto.retentionRate !== undefined && !contract.lockedAt) {
      (contract as any).retentionAmount =
        Number(contract.currentAmount) * (dto.retentionRate / 100);
    }

    Object.assign(contract, dto);
    return this.contractsRepository.save(contract);
  }

  async sign(id: string, signDate?: string, userId?: string): Promise<Contract> {
    const contract = await this.findOne(id);

    if (contract.status !== 'CTR_DRAFT') {
      throw new BadRequestException('只有草稿狀態可簽約');
    }

    contract.status = 'CTR_ACTIVE';
    contract.signDate = signDate ? new Date(signDate) : new Date();
    contract.lockedAt = new Date();
    if (userId) contract.lockedBy = userId;

    // 更新專案狀態
    if (contract.projectId) {
      await this.projectsService.update(contract.projectId, {
        status: 'IN_PROGRESS',
      });
    }

    return this.contractsRepository.save(contract);
  }

  async complete(id: string, userId?: string): Promise<Contract> {
    const contract = await this.findOne(id);

    if (contract.status !== 'CTR_ACTIVE') {
      throw new BadRequestException('只有執行中合約可完工');
    }

    contract.status = 'CTR_COMPLETED';

    // 計算保固到期日
    if (contract.warrantyMonths) {
      const warrantyEnd = new Date();
      warrantyEnd.setMonth(warrantyEnd.getMonth() + contract.warrantyMonths);
      contract.warrantyEnd = warrantyEnd;
      contract.status = 'CTR_WARRANTY';
    }

    return this.contractsRepository.save(contract);
  }

  async close(id: string, userId?: string): Promise<Contract> {
    const contract = await this.findOne(id);

    if (!['CTR_COMPLETED', 'CTR_WARRANTY'].includes(contract.status)) {
      throw new BadRequestException('只有已完工或保固中合約可結案');
    }

    contract.status = 'CTR_CLOSED';
    return this.contractsRepository.save(contract);
  }

  /**
   * IDOR Protection: Verify user has access to the contract
   */
  private checkOwnership(contract: Contract, userId?: string, userRole?: string): void {
    if (!userId || !userRole) return; // Skip if no user context
    if (isAdminRole(userRole)) return; // Admin bypass

    if (contract.createdBy !== userId) {
      throw new ForbiddenException('You do not have access to this contract');
    }
  }

  private async generateId(): Promise<string> {
    const date = new Date();
    const prefix = `CTR-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-`;

    const last = await this.contractsRepository
      .createQueryBuilder('c')
      .where('c.id LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('c.id', 'DESC')
      .getOne();

    let seq = 1;
    if (last) {
      const lastSeq = parseInt(last.id.split('-')[2], 10);
      seq = lastSeq + 1;
    }

    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  /**
   * Export contracts to Excel/CSV
   */
  async exportToExcel(
    options: { projectId?: string; status?: string; format?: 'xlsx' | 'csv' },
    userId?: string,
    userRole?: string
  ): Promise<Buffer> {
    const ExcelJS = await import('exceljs');
    const { projectId, status, format = 'xlsx' } = options;

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (userId && userRole && !isAdminRole(userRole)) {
      where.createdBy = userId;
    }

    const contracts = await this.contractsRepository.find({
      where,
      relations: ['project'],
      order: { createdAt: 'DESC' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Contracts');

    sheet.columns = [
      { header: '合約編號', key: 'id', width: 20 },
      { header: '合約號碼', key: 'contractNo', width: 20 },
      { header: '專案名稱', key: 'projectName', width: 25 },
      { header: '標題', key: 'title', width: 30 },
      { header: '原始金額', key: 'originalAmount', width: 15 },
      { header: '現行金額', key: 'currentAmount', width: 15 },
      { header: '保留款', key: 'retentionAmount', width: 15 },
      { header: '狀態', key: 'status', width: 15 },
      { header: '簽約日期', key: 'signDate', width: 15 },
      { header: '保固期限', key: 'warrantyEnd', width: 15 },
    ];

    for (const c of contracts) {
      sheet.addRow({
        id: c.id,
        contractNo: c.contractNo || '',
        projectName: c.project?.name || '',
        title: c.title || '',
        originalAmount: c.originalAmount,
        currentAmount: c.currentAmount,
        retentionAmount: c.retentionAmount,
        status: c.status,
        signDate: c.signDate ? new Date(c.signDate).toLocaleDateString('zh-TW') : '',
        warrantyEnd: c.warrantyEnd ? new Date(c.warrantyEnd).toLocaleDateString('zh-TW') : '',
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
