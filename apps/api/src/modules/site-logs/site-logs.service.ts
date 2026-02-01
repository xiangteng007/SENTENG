import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { SiteLog } from "./site-log.entity";
import {
  CreateSiteLogDto,
  UpdateSiteLogDto,
  SiteLogQueryDto,
} from "./site-log.dto";

@Injectable()
export class SiteLogsService {
  constructor(
    @InjectRepository(SiteLog)
    private siteLogRepo: Repository<SiteLog>,
  ) {}

  async findAll(
    query: SiteLogQueryDto,
  ): Promise<{ items: SiteLog[]; total: number }> {
    const {
      page = 1,
      limit = 20,
      projectId,
      startDate,
      endDate,
      approved,
    } = query;
    const qb = this.siteLogRepo
      .createQueryBuilder("s")
      .leftJoinAndSelect("s.project", "project");

    if (projectId) qb.andWhere("s.projectId = :projectId", { projectId });
    if (startDate) qb.andWhere("s.logDate >= :startDate", { startDate });
    if (endDate) qb.andWhere("s.logDate <= :endDate", { endDate });
    if (approved !== undefined)
      qb.andWhere("s.isApproved = :approved", { approved });

    const [items, total] = await qb
      .orderBy("s.logDate", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }

  async findOne(id: string): Promise<SiteLog> {
    const log = await this.siteLogRepo.findOne({
      where: { id },
      relations: ["project"],
    });
    if (!log) throw new NotFoundException(`Site Log ${id} not found`);
    return log;
  }

  async findByDate(projectId: string, date: string): Promise<SiteLog | null> {
    return this.siteLogRepo.findOne({
      where: { projectId, logDate: new Date(date) },
    });
  }

  async create(dto: CreateSiteLogDto, userId?: string): Promise<SiteLog> {
    // Check if log already exists for this date
    const existing = await this.findByDate(dto.projectId, dto.logDate);
    if (existing) {
      throw new BadRequestException(
        `Site log already exists for ${dto.logDate}`,
      );
    }

    const log = this.siteLogRepo.create({
      ...dto,
      submittedBy: userId,
    });
    return this.siteLogRepo.save(log);
  }

  async update(id: string, dto: UpdateSiteLogDto): Promise<SiteLog> {
    const log = await this.findOne(id);
    if (log.isApproved) {
      throw new BadRequestException("Cannot modify an approved site log");
    }
    Object.assign(log, dto);
    return this.siteLogRepo.save(log);
  }

  async submit(id: string, userId: string): Promise<SiteLog> {
    const log = await this.findOne(id);
    log.submittedBy = userId;
    log.submittedAt = new Date();
    return this.siteLogRepo.save(log);
  }

  async approve(id: string, userId: string): Promise<SiteLog> {
    const log = await this.findOne(id);
    if (!log.submittedAt) {
      throw new BadRequestException(
        "Site log must be submitted before approval",
      );
    }
    log.isApproved = true;
    log.approvedBy = userId;
    log.approvedAt = new Date();
    return this.siteLogRepo.save(log);
  }

  async reject(id: string, reason: string): Promise<SiteLog> {
    const log = await this.findOne(id);
    log.isApproved = false;
    log.approvedBy = null;
    log.approvedAt = null;
    // Add rejection reason to notes
    log.notes = log.notes
      ? `${log.notes}\n\n[REJECTED] ${reason}`
      : `[REJECTED] ${reason}`;
    return this.siteLogRepo.save(log);
  }

  async getProjectSummary(
    projectId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    const qb = this.siteLogRepo
      .createQueryBuilder("s")
      .where("s.projectId = :projectId", { projectId });

    if (startDate) qb.andWhere("s.logDate >= :startDate", { startDate });
    if (endDate) qb.andWhere("s.logDate <= :endDate", { endDate });

    const logs = await qb.getMany();

    return {
      totalDays: logs.length,
      approvedDays: logs.filter((l) => l.isApproved).length,
      totalWorkers: logs.reduce(
        (sum, l) => sum + (l.workersOwn || 0) + (l.workersSubcon || 0),
        0,
      ),
      avgWorkersPerDay: logs.length
        ? logs.reduce(
            (sum, l) => sum + (l.workersOwn || 0) + (l.workersSubcon || 0),
            0,
          ) / logs.length
        : 0,
      totalIssues: logs.reduce((sum, l) => sum + (l.issues?.length || 0), 0),
      unresolvedIssues: logs.reduce(
        (sum, l) => sum + (l.issues?.filter((i) => !i.resolved).length || 0),
        0,
      ),
      safetyIncidents: logs.reduce(
        (sum, l) => sum + (l.safety?.incidents || 0),
        0,
      ),
    };
  }

  async remove(id: string): Promise<void> {
    const log = await this.findOne(id);
    if (log.isApproved) {
      throw new BadRequestException("Cannot delete an approved site log");
    }
    await this.siteLogRepo.remove(log);
  }
}
