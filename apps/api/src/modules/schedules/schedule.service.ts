import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, IsNull } from 'typeorm';
import { ScheduleTask, ScheduleDependency, ScheduleMilestone } from './schedule-task.entity';
import {
  CreateScheduleTaskDto,
  UpdateScheduleTaskDto,
  ScheduleTaskQueryDto,
  CreateDependencyDto,
  CreateMilestoneDto,
  UpdateMilestoneDto,
  GanttChartData,
  GanttTask,
} from './schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(ScheduleTask)
    private readonly taskRepository: Repository<ScheduleTask>,
    @InjectRepository(ScheduleDependency)
    private readonly dependencyRepository: Repository<ScheduleDependency>,
    @InjectRepository(ScheduleMilestone)
    private readonly milestoneRepository: Repository<ScheduleMilestone>
  ) {}

  // === Schedule Tasks ===

  async findTasks(query: ScheduleTaskQueryDto): Promise<ScheduleTask[]> {
    const where: FindOptionsWhere<ScheduleTask> = { projectId: query.projectId };
    if (query.type) where.type = query.type as ScheduleTask['type'];
    if (query.status) where.status = query.status as ScheduleTask['status'];
    if (query.parentId) where.parentId = query.parentId;
    if (query.rootOnly) where.parentId = IsNull();

    return this.taskRepository.find({ where, order: { sortOrder: 'ASC', startDate: 'ASC' } });
  }

  async findTaskById(id: string): Promise<ScheduleTask> {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  async createTask(dto: CreateScheduleTaskDto): Promise<ScheduleTask> {
    const task = this.taskRepository.create({
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      status: 'pending',
    });
    return this.taskRepository.save(task);
  }

  async updateTask(id: string, dto: UpdateScheduleTaskDto): Promise<ScheduleTask> {
    const task = await this.findTaskById(id);
    Object.assign(task, dto);
    if (dto.startDate) task.startDate = new Date(dto.startDate);
    if (dto.endDate) task.endDate = new Date(dto.endDate);
    return this.taskRepository.save(task);
  }

  async deleteTask(id: string): Promise<void> {
    const task = await this.findTaskById(id);
    // Remove dependencies first
    await this.dependencyRepository.delete({ taskId: id });
    await this.dependencyRepository.delete({ dependsOnTaskId: id });
    await this.taskRepository.remove(task);
  }

  async updateTaskProgress(id: string, progress: number): Promise<ScheduleTask> {
    const task = await this.findTaskById(id);
    task.progress = Math.min(100, Math.max(0, progress));
    if (task.progress === 100) task.status = 'completed';
    else if (task.progress > 0) task.status = 'in_progress';
    return this.taskRepository.save(task);
  }

  // === Dependencies ===

  async getDependencies(projectId: string): Promise<ScheduleDependency[]> {
    const tasks = await this.taskRepository.find({ where: { projectId }, select: ['id'] });
    const taskIds = tasks.map(t => t.id);
    if (taskIds.length === 0) return [];
    return this.dependencyRepository
      .createQueryBuilder('dep')
      .where('dep.taskId IN (:...taskIds)', { taskIds })
      .getMany();
  }

  async createDependency(dto: CreateDependencyDto): Promise<ScheduleDependency> {
    // Validate both tasks exist
    await this.findTaskById(dto.taskId);
    await this.findTaskById(dto.dependsOnTaskId);

    // Prevent circular dependency
    if (dto.taskId === dto.dependsOnTaskId) {
      throw new BadRequestException('Task cannot depend on itself');
    }

    const dependency = this.dependencyRepository.create(dto);
    return this.dependencyRepository.save(dependency);
  }

  async deleteDependency(id: string): Promise<void> {
    const dep = await this.dependencyRepository.findOne({ where: { id } });
    if (!dep) throw new NotFoundException(`Dependency ${id} not found`);
    await this.dependencyRepository.remove(dep);
  }

  // === Milestones ===

  async getMilestones(projectId: string): Promise<ScheduleMilestone[]> {
    return this.milestoneRepository.find({
      where: { projectId },
      order: { targetDate: 'ASC' },
    });
  }

  async getMilestoneById(id: string): Promise<ScheduleMilestone> {
    const ms = await this.milestoneRepository.findOne({ where: { id } });
    if (!ms) throw new NotFoundException(`Milestone ${id} not found`);
    return ms;
  }

  async createMilestone(dto: CreateMilestoneDto): Promise<ScheduleMilestone> {
    const milestone = this.milestoneRepository.create({
      ...dto,
      targetDate: new Date(dto.targetDate),
      status: 'pending',
    });
    return this.milestoneRepository.save(milestone);
  }

  async updateMilestone(id: string, dto: UpdateMilestoneDto): Promise<ScheduleMilestone> {
    const ms = await this.getMilestoneById(id);
    Object.assign(ms, dto);
    if (dto.targetDate) ms.targetDate = new Date(dto.targetDate);
    if (dto.actualDate) ms.actualDate = new Date(dto.actualDate);
    return this.milestoneRepository.save(ms);
  }

  async deleteMilestone(id: string): Promise<void> {
    const ms = await this.getMilestoneById(id);
    await this.milestoneRepository.remove(ms);
  }

  async completeMilestone(id: string): Promise<ScheduleMilestone> {
    const ms = await this.getMilestoneById(id);
    ms.status = 'completed';
    ms.actualDate = new Date();
    return this.milestoneRepository.save(ms);
  }

  // === Gantt Chart ===

  async getGanttData(projectId: string): Promise<GanttChartData> {
    const [tasks, milestones, dependencies] = await Promise.all([
      this.taskRepository.find({
        where: { projectId },
        order: { sortOrder: 'ASC', startDate: 'ASC' },
      }),
      this.milestoneRepository.find({ where: { projectId }, order: { targetDate: 'ASC' } }),
      this.getDependencies(projectId),
    ]);

    // Build hierarchical task structure
    const taskMap = new Map<string, GanttTask>();
    const rootTasks: GanttTask[] = [];

    tasks.forEach(t => {
      const ganttTask: GanttTask = {
        id: t.id,
        name: t.name,
        start:
          t.startDate instanceof Date
            ? t.startDate.toISOString().split('T')[0]
            : String(t.startDate),
        end: t.endDate instanceof Date ? t.endDate.toISOString().split('T')[0] : String(t.endDate),
        progress: t.progress,
        type: t.type,
        status: t.status,
        parentId: t.parentId,
        color: t.color,
        assignee: t.assignee,
        children: [],
      };
      taskMap.set(t.id, ganttTask);
    });

    // Build parent-child relationships
    taskMap.forEach(task => {
      if (task.parentId && taskMap.has(task.parentId)) {
        taskMap.get(task.parentId)!.children!.push(task);
      } else if (!task.parentId) {
        rootTasks.push(task);
      }
    });

    // Calculate summary
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const overallProgress =
      tasks.length > 0
        ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length)
        : 0;

    const startDates = tasks.map(t => new Date(t.startDate).getTime()).filter(d => !isNaN(d));
    const endDates = tasks.map(t => new Date(t.endDate).getTime()).filter(d => !isNaN(d));

    return {
      tasks: rootTasks,
      milestones: milestones.map(m => ({
        id: m.id,
        name: m.name,
        date:
          m.targetDate instanceof Date
            ? m.targetDate.toISOString().split('T')[0]
            : String(m.targetDate),
        status: m.status,
        isContractual: m.isContractual,
      })),
      dependencies: dependencies.map(d => ({
        from: d.dependsOnTaskId,
        to: d.taskId,
        type: d.type,
        lagDays: d.lagDays,
      })),
      summary: {
        totalTasks: tasks.length,
        completedTasks,
        overallProgress,
        startDate:
          startDates.length > 0
            ? new Date(Math.min(...startDates)).toISOString().split('T')[0]
            : '',
        endDate:
          endDates.length > 0 ? new Date(Math.max(...endDates)).toISOString().split('T')[0] : '',
      },
    };
  }

  // === Critical Path (simplified) ===

  async getCriticalPath(projectId: string): Promise<string[]> {
    const ganttData = await this.getGanttData(projectId);
    // Simplified: return tasks with 0% slack or delayed status
    const criticalTaskIds = ganttData.tasks
      .filter(t => t.status === 'delayed' || t.status === 'in_progress')
      .flatMap(t => [t.id, ...(t.children?.map(c => c.id) || [])]);
    return [...new Set(criticalTaskIds)];
  }
}
