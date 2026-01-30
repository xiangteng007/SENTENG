import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from './project.entity';
import { ProjectPhase } from './project-phase.entity';
import { ProjectVendor } from './project-vendor.entity';
import { ProjectTask, TaskStatus } from './project-task.entity';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectQueryDto,
  CreatePhaseDto,
  AddVendorDto,
  CreateTaskDto,
} from './project.dto';
import { isAdminRole } from '../../common/constants/roles';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(ProjectPhase) private phaseRepo: Repository<ProjectPhase>,
    @InjectRepository(ProjectVendor) private pvRepo: Repository<ProjectVendor>,
    @InjectRepository(ProjectTask) private taskRepo: Repository<ProjectTask>
  ) {}

  async findAll(query: ProjectQueryDto, userId?: string, userRole?: string) {
    const { page = 1, limit = 20, status, projectType, customerId, search } = query;
    const qb = this.projectRepo.createQueryBuilder('p').leftJoinAndSelect('p.client', 'client');

    if (status) qb.andWhere('p.status = :status', { status });
    if (projectType) qb.andWhere('p.projectType = :projectType', { projectType });
    if (customerId) qb.andWhere('p.customerId = :customerId', { customerId });
    if (search)
      qb.andWhere('(p.name ILIKE :search OR p.address ILIKE :search)', {
        search: `%${search}%`,
      });

    if (userId && userRole && !isAdminRole(userRole)) {
      qb.andWhere('(p.createdBy = :userId OR p.pmUserId = :userId)', {
        userId,
      });
    }

    const [items, total] = await qb
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items, total };
  }

  async findOne(id: string, userId?: string, userRole?: string) {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['client', 'phases', 'projectVendors', 'projectVendors.vendor', 'tasks'],
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async findVendors(projectId: string) {
    return this.pvRepo.find({ where: { projectId }, relations: ['vendor'] });
  }

  async findPhases(projectId: string) {
    return this.phaseRepo.find({ where: { projectId }, order: { seq: 'ASC' } });
  }

  async findTasks(projectId: string) {
    return this.taskRepo.find({
      where: { projectId },
      order: { dueDate: 'ASC' },
    });
  }

  async getCostSummary(projectId: string) {
    const project = await this.findOne(projectId);
    const phases = await this.findPhases(projectId);
    const vendors = await this.findVendors(projectId);

    return {
      contractAmount: project.contractAmount,
      changeAmount: project.changeAmount,
      currentAmount: Number(project.contractAmount) + Number(project.changeAmount),
      costBudget: project.costBudget,
      costActual: project.costActual,
      phaseBreakdown: phases.map(p => ({
        phase: p.name,
        budget: p.budgetAmount,
        actual: p.actualAmount,
      })),
      vendorBreakdown: vendors.map(v => ({
        vendor: v.vendor?.name,
        amount: v.contractAmount,
        paid: v.paidAmount,
      })),
    };
  }

  async create(dto: CreateProjectDto, userId?: string) {
    const id = await this.generateId();
    const project = this.projectRepo.create({
      ...dto,
      id,
      createdBy: userId,
      currentAmount: dto.contractAmount || 0,
    });
    return this.projectRepo.save(project);
  }

  async update(id: string, dto: UpdateProjectDto, userId?: string) {
    const project = await this.findOne(id);
    Object.assign(project, dto, { updatedBy: userId });
    if (dto.contractAmount !== undefined || dto.changeAmount !== undefined) {
      project.currentAmount = Number(project.contractAmount) + Number(project.changeAmount);
    }
    return this.projectRepo.save(project);
  }

  async remove(id: string) {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    await this.projectRepo.softDelete(id);
  }

  // Phase management
  async addPhase(projectId: string, dto: CreatePhaseDto) {
    await this.findOne(projectId);
    const phase = this.phaseRepo.create({ ...dto, projectId });
    return this.phaseRepo.save(phase);
  }

  async removePhase(phaseId: string) {
    await this.phaseRepo.delete(phaseId);
  }

  // Vendor management
  async addVendor(projectId: string, dto: AddVendorDto) {
    await this.findOne(projectId);
    const pv = this.pvRepo.create({ ...dto, projectId });
    return this.pvRepo.save(pv);
  }

  async removeVendor(pvId: string) {
    await this.pvRepo.delete(pvId);
  }

  // Task management
  async addTask(projectId: string, dto: CreateTaskDto) {
    await this.findOne(projectId);
    const task = this.taskRepo.create({ ...dto, projectId });
    return this.taskRepo.save(task);
  }

  async updateTaskStatus(taskId: string, status: TaskStatus) {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
    task.status = status;
    if (status === TaskStatus.DONE) task.completedAt = new Date();
    return this.taskRepo.save(task);
  }

  async removeTask(taskId: string) {
    await this.taskRepo.delete(taskId);
  }

  private async generateId() {
    const date = new Date();
    const prefix = `PRJ-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-`;
    const last = await this.projectRepo
      .createQueryBuilder('p')
      .where('p.id LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('p.id', 'DESC')
      .getOne();
    let seq = 1;
    if (last) seq = parseInt(last.id.split('-')[2], 10) + 1;
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }
}
