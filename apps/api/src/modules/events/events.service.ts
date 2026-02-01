import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, FindOptionsWhere } from "typeorm";
import { Event } from "./event.entity";
import { CreateEventDto, UpdateEventDto, QueryEventsDto } from "./event.dto";

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  /**
   * 取得所有事件 (支援時間範圍篩選)
   */
  async findAll(query: QueryEventsDto): Promise<Event[]> {
    const whereConditions: FindOptionsWhere<Event> = {};

    // 時間範圍篩選
    if (query.startDate && query.endDate) {
      whereConditions.startTime = Between(
        new Date(query.startDate),
        new Date(query.endDate),
      );
    } else if (query.startDate) {
      whereConditions.startTime = MoreThanOrEqual(new Date(query.startDate));
    } else if (query.endDate) {
      whereConditions.startTime = LessThanOrEqual(new Date(query.endDate));
    }

    // 專案篩選
    if (query.projectId) {
      whereConditions.projectId = query.projectId;
    }

    // 類別篩選
    if (query.category) {
      whereConditions.category = query.category;
    }

    // 狀態篩選
    if (query.status) {
      whereConditions.status = query.status;
    }

    return this.eventRepository.find({
      where: whereConditions,
      relations: ["project"],
      order: { startTime: "ASC" },
    });
  }

  /**
   * 取得單一事件
   */
  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ["project"],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  /**
   * 建立事件
   */
  async create(dto: CreateEventDto, userId?: string): Promise<Event> {
    const eventData: Partial<Event> = {
      title: dto.title,
      description: dto.description,
      startTime: new Date(dto.startTime),
      endTime: dto.endTime ? new Date(dto.endTime) : undefined,
      allDay: dto.allDay ?? false,
      category: dto.category ?? "general",
      color: dto.color ?? "#3b82f6",
      location: dto.location,
      projectId: dto.projectId,
      recurrenceRule: dto.recurrenceRule,
      recurrenceEnd: dto.recurrenceEnd
        ? new Date(dto.recurrenceEnd)
        : undefined,
      reminderMinutes: dto.reminderMinutes ?? 30,
      createdBy: userId,
    };

    const event = this.eventRepository.create(eventData);
    return this.eventRepository.save(event);
  }

  /**
   * 更新事件
   */
  async update(
    id: string,
    dto: UpdateEventDto,
    userId?: string,
  ): Promise<Event> {
    const event = await this.findOne(id);

    const updateData: Record<string, unknown> = { ...dto, updatedBy: userId };

    if (dto.startTime) {
      updateData.startTime = new Date(dto.startTime);
    }
    if (dto.endTime) {
      updateData.endTime = new Date(dto.endTime);
    }
    if (dto.recurrenceEnd) {
      updateData.recurrenceEnd = new Date(dto.recurrenceEnd);
    }

    Object.assign(event, updateData);

    return this.eventRepository.save(event);
  }

  /**
   * 刪除事件
   */
  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
    await this.eventRepository.remove(event);
  }

  /**
   * 標記事件為完成
   */
  async complete(id: string, userId?: string): Promise<Event> {
    return this.update(id, { status: "completed" }, userId);
  }

  /**
   * 取消事件
   */
  async cancel(id: string, userId?: string): Promise<Event> {
    return this.update(id, { status: "cancelled" }, userId);
  }

  /**
   * 取得專案相關事件
   */
  async findByProject(projectId: string): Promise<Event[]> {
    return this.eventRepository.find({
      where: { projectId },
      order: { startTime: "ASC" },
    });
  }

  /**
   * 取得今日事件
   */
  async findToday(): Promise<Event[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.eventRepository.find({
      where: {
        startTime: Between(today, tomorrow),
        status: "scheduled",
      },
      relations: ["project"],
      order: { startTime: "ASC" },
    });
  }

  /**
   * 取得即將到來的事件 (未來 7 天)
   */
  async findUpcoming(days: number = 7): Promise<Event[]> {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    return this.eventRepository.find({
      where: {
        startTime: Between(now, future),
        status: "scheduled",
      },
      relations: ["project"],
      order: { startTime: "ASC" },
    });
  }
}
