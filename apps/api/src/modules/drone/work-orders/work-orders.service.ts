import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { WorkOrder } from "./entities";
import { CreateWorkOrderDto, CompleteWorkOrderDto } from "./dto/work-order.dto";

@Injectable()
export class WorkOrdersService {
  private readonly logger = new Logger(WorkOrdersService.name);

  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepo: Repository<WorkOrder>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(filters?: {
    projectId?: string;
    clientId?: string;
    businessUnitId?: string;
    status?: string;
    scheduledDate?: Date;
  }): Promise<WorkOrder[]> {
    const where: any = {};
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.businessUnitId) where.businessUnitId = filters.businessUnitId;
    if (filters?.status) where.status = filters.status;
    if (filters?.scheduledDate) where.scheduledDate = filters.scheduledDate;

    return this.workOrderRepo.find({
      where,
      relations: ["project", "client", "service", "jobSite"],
      order: { scheduledDate: "DESC", createdAt: "DESC" },
    });
  }

  async findById(id: string): Promise<WorkOrder> {
    const wo = await this.workOrderRepo.findOne({
      where: { id },
      relations: ["project", "client", "service", "jobSite", "businessUnit"],
    });
    if (!wo) {
      throw new NotFoundException(`WorkOrder ${id} not found`);
    }
    return wo;
  }

  async create(dto: CreateWorkOrderDto, userId?: string): Promise<WorkOrder> {
    const wo = this.workOrderRepo.create({
      ...dto,
      scheduledDate: dto.scheduledDate
        ? new Date(dto.scheduledDate)
        : undefined,
      status: "WO_DRAFT",
      createdBy: userId,
    });
    return this.workOrderRepo.save(wo);
  }

  async schedule(
    id: string,
    scheduledDate: Date,
    timeStart?: string,
    timeEnd?: string,
  ): Promise<WorkOrder> {
    const wo = await this.findById(id);
    if (!["WO_DRAFT"].includes(wo.status)) {
      throw new BadRequestException(
        `Cannot schedule WorkOrder in status ${wo.status}`,
      );
    }
    wo.scheduledDate = scheduledDate;
    if (timeStart !== undefined) wo.scheduledTimeStart = timeStart;
    if (timeEnd !== undefined) wo.scheduledTimeEnd = timeEnd;
    wo.status = "WO_SCHEDULED";
    return this.workOrderRepo.save(wo);
  }

  async dispatch(id: string): Promise<WorkOrder> {
    const wo = await this.findById(id);
    if (!["WO_SCHEDULED"].includes(wo.status)) {
      throw new BadRequestException(
        `Cannot dispatch WorkOrder in status ${wo.status}`,
      );
    }
    wo.status = "WO_DISPATCHED";
    return this.workOrderRepo.save(wo);
  }

  async startWork(id: string): Promise<WorkOrder> {
    const wo = await this.findById(id);
    if (!["WO_DISPATCHED"].includes(wo.status)) {
      throw new BadRequestException(
        `Cannot start WorkOrder in status ${wo.status}`,
      );
    }
    wo.status = "WO_IN_PROGRESS";
    return this.workOrderRepo.save(wo);
  }

  /**
   * 完工處理
   * 1. 更新狀態為 WO_COMPLETED
   * Note: Event-driven CostEntry/Invoice generation temporarily disabled
   *       to fix Cloud Run deployment. Will re-enable in future iteration.
   */
  async complete(
    id: string,
    dto?: CompleteWorkOrderDto,
    userId?: string,
  ): Promise<WorkOrder> {
    const wo = await this.findById(id);
    if (!["WO_IN_PROGRESS"].includes(wo.status)) {
      throw new BadRequestException(
        `Cannot complete WorkOrder in status ${wo.status}`,
      );
    }

    const completedAt = new Date();

    // Use transaction to ensure data consistency
    const result = await this.dataSource.transaction(async (manager) => {
      wo.status = "WO_COMPLETED";
      wo.completedAt = completedAt;
      if (dto?.notes) {
        wo.notes = wo.notes ? `${wo.notes}\n${dto.notes}` : dto.notes;
      }
      return manager.save(wo);
    });

    this.logger.log(`WorkOrder ${id} completed at ${completedAt}`);
    // @future(EDA-001): Re-enable event-based CostEntry/Invoice generation after EventEmitter fix

    return result;
  }

  async cancel(id: string, reason?: string): Promise<WorkOrder> {
    const wo = await this.findById(id);
    if (wo.status === "WO_COMPLETED") {
      throw new BadRequestException("Cannot cancel completed WorkOrder");
    }
    wo.status = "WO_CANCELLED";
    if (reason) {
      wo.notes = wo.notes
        ? `${wo.notes}\n[CANCELLED] ${reason}`
        : `[CANCELLED] ${reason}`;
    }
    return this.workOrderRepo.save(wo);
  }

  /**
   * 產生下一個工單編號
   * 格式: WO-{YYYYMM}-{序號}
   */
  async generateWoNumber(): Promise<string> {
    const now = new Date();
    const prefix = `WO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

    const lastWo = await this.workOrderRepo
      .createQueryBuilder("wo")
      .where("wo.woNumber LIKE :prefix", { prefix: `${prefix}%` })
      .orderBy("wo.woNumber", "DESC")
      .getOne();

    let nextSeq = 1;
    if (lastWo) {
      const lastSeq = parseInt(lastWo.woNumber.split("-")[2], 10);
      nextSeq = lastSeq + 1;
    }

    return `${prefix}-${String(nextSeq).padStart(4, "0")}`;
  }
}
