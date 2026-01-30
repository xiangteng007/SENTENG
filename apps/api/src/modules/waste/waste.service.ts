import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { WasteRecord, WasteMonthlyReport, WasteType } from './waste.entity';
import {
  CreateWasteRecordDto,
  UpdateWasteRecordDto,
  WasteRecordQueryDto,
  GenerateMonthlyReportDto,
  WasteStatistics,
} from './waste.dto';

@Injectable()
export class WasteService {
  constructor(
    @InjectRepository(WasteRecord)
    private readonly recordRepository: Repository<WasteRecord>,
    @InjectRepository(WasteMonthlyReport)
    private readonly reportRepository: Repository<WasteMonthlyReport>
  ) {}

  // === Waste Records ===

  async findRecords(query: WasteRecordQueryDto): Promise<WasteRecord[]> {
    const qb = this.recordRepository
      .createQueryBuilder('wr')
      .where('wr.projectId = :projectId', { projectId: query.projectId });

    if (query.wasteType) qb.andWhere('wr.wasteType = :wasteType', { wasteType: query.wasteType });
    if (query.status) qb.andWhere('wr.status = :status', { status: query.status });
    if (query.isRecyclable !== undefined)
      qb.andWhere('wr.isRecyclable = :isRecyclable', { isRecyclable: query.isRecyclable });
    if (query.startDate) qb.andWhere('wr.wasteDate >= :startDate', { startDate: query.startDate });
    if (query.endDate) qb.andWhere('wr.wasteDate <= :endDate', { endDate: query.endDate });

    return qb.orderBy('wr.wasteDate', 'DESC').getMany();
  }

  async findRecordById(id: string): Promise<WasteRecord> {
    const record = await this.recordRepository.findOne({ where: { id } });
    if (!record) throw new NotFoundException(`Waste record ${id} not found`);
    return record;
  }

  async createRecord(dto: CreateWasteRecordDto, userId?: string): Promise<WasteRecord> {
    const record = this.recordRepository.create({
      ...dto,
      wasteDate: new Date(dto.wasteDate),
      status: 'generated',
      createdBy: userId,
    });
    return this.recordRepository.save(record);
  }

  async updateRecord(id: string, dto: UpdateWasteRecordDto): Promise<WasteRecord> {
    const record = await this.findRecordById(id);
    Object.assign(record, dto);
    if (dto.wasteDate) record.wasteDate = new Date(dto.wasteDate);
    if (dto.transportDate) record.transportDate = new Date(dto.transportDate);
    if (dto.disposalDate) record.disposalDate = new Date(dto.disposalDate);
    if (dto.manifestSubmitted) record.manifestSubmittedAt = new Date();
    return this.recordRepository.save(record);
  }

  async deleteRecord(id: string): Promise<void> {
    const record = await this.findRecordById(id);
    await this.recordRepository.remove(record);
  }

  async approveRecord(id: string, userId: string): Promise<WasteRecord> {
    const record = await this.findRecordById(id);
    record.approvedBy = userId;
    record.approvedAt = new Date();
    return this.recordRepository.save(record);
  }

  // === Monthly Reports ===

  async getMonthlyReports(projectId: string): Promise<WasteMonthlyReport[]> {
    return this.reportRepository.find({
      where: { projectId },
      order: { year: 'DESC', month: 'DESC' },
    });
  }

  async getMonthlyReportById(id: string): Promise<WasteMonthlyReport> {
    const report = await this.reportRepository.findOne({ where: { id } });
    if (!report) throw new NotFoundException(`Monthly report ${id} not found`);
    return report;
  }

  async generateMonthlyReport(dto: GenerateMonthlyReportDto): Promise<WasteMonthlyReport> {
    const startDate = new Date(dto.year, dto.month - 1, 1);
    const endDate = new Date(dto.year, dto.month, 0);

    const existing = await this.reportRepository.findOne({
      where: { projectId: dto.projectId, year: dto.year, month: dto.month },
    });
    if (existing)
      throw new BadRequestException(`Report for ${dto.year}/${dto.month} already exists`);

    const records = await this.recordRepository.find({
      where: {
        projectId: dto.projectId,
        wasteDate: Between(startDate, endDate),
      },
    });

    const byType = new Map<WasteType, { quantity: number; recycled: number; cost: number }>();
    let totalTransport = 0;

    records.forEach(r => {
      const existing = byType.get(r.wasteType) || { quantity: 0, recycled: 0, cost: 0 };
      existing.quantity += Number(r.quantity);
      existing.recycled += Number(r.recycledQuantity || 0);
      existing.cost += Number(r.disposalCost || 0);
      byType.set(r.wasteType, existing);
      totalTransport += Number(r.transportCost || 0);
    });

    const summary = Array.from(byType.entries()).map(([wasteType, data]) => ({
      wasteType,
      totalQuantity: data.quantity,
      unit: 'ton',
      recycledQuantity: data.recycled,
      recycleRate: data.quantity > 0 ? Math.round((data.recycled / data.quantity) * 100) : 0,
      disposalCost: data.cost,
    }));

    const totalQuantity = summary.reduce((sum, s) => sum + s.totalQuantity, 0);
    const totalRecycled = summary.reduce((sum, s) => sum + s.recycledQuantity, 0);

    const report = this.reportRepository.create({
      projectId: dto.projectId,
      year: dto.year,
      month: dto.month,
      summary,
      totalDisposalCost: summary.reduce((sum, s) => sum + s.disposalCost, 0),
      totalTransportCost: totalTransport,
      overallRecycleRate: totalQuantity > 0 ? Math.round((totalRecycled / totalQuantity) * 100) : 0,
      status: 'draft',
    });

    return this.reportRepository.save(report);
  }

  async submitMonthlyReport(id: string, epaReportNumber?: string): Promise<WasteMonthlyReport> {
    const report = await this.getMonthlyReportById(id);
    report.status = 'submitted';
    report.submittedAt = new Date();
    if (epaReportNumber) report.epaReportNumber = epaReportNumber;
    return this.reportRepository.save(report);
  }

  // === Statistics ===

  async getStatistics(
    projectId: string,
    startDate?: string,
    endDate?: string
  ): Promise<WasteStatistics> {
    const qb = this.recordRepository
      .createQueryBuilder('wr')
      .where('wr.projectId = :projectId', { projectId });

    const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];
    qb.andWhere('wr.wasteDate >= :start', { start });
    qb.andWhere('wr.wasteDate <= :end', { end });

    const records = await qb.getMany();

    const byType = new Map<WasteType, { quantity: number; count: number }>();
    let totalQty = 0,
      recycledQty = 0,
      disposalCost = 0,
      transportCost = 0,
      pendingManifests = 0;

    records.forEach(r => {
      const existing = byType.get(r.wasteType) || { quantity: 0, count: 0 };
      existing.quantity += Number(r.quantity);
      existing.count += 1;
      byType.set(r.wasteType, existing);

      totalQty += Number(r.quantity);
      recycledQty += Number(r.recycledQuantity || 0);
      disposalCost += Number(r.disposalCost || 0);
      transportCost += Number(r.transportCost || 0);
      if (!r.manifestSubmitted && r.status !== 'generated') pendingManifests++;
    });

    return {
      projectId,
      period: { startDate: start, endDate: end },
      byType: Array.from(byType.entries()).map(([wasteType, data]) => ({
        wasteType,
        quantity: data.quantity,
        unit: 'ton',
        count: data.count,
      })),
      totals: {
        totalQuantity: totalQty,
        recycledQuantity: recycledQty,
        recycleRate: totalQty > 0 ? Math.round((recycledQty / totalQty) * 100) : 0,
        disposalCost,
        transportCost,
      },
      pendingManifests,
    };
  }
}
