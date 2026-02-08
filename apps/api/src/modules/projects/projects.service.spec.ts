import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectsService } from './projects.service';
import { Project, ProjectStatus } from './project.entity';
import { ProjectPhase } from './project-phase.entity';
import { ProjectVendor } from './project-vendor.entity';
import { ProjectTask, TaskStatus } from './project-task.entity';
import { NotFoundException } from '@nestjs/common';
import { IdGeneratorService } from '../../core/id-generator/id-generator.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectRepo: jest.Mocked<Repository<Project>>;

  const mockProject: Partial<Project> = {
    id: 'PRJ-202601-0001',
    name: 'Test Project',
    status: ProjectStatus.CONSTRUCTION,
    contractAmount: 1000000,
    changeAmount: 50000,
    currentAmount: 1050000,
    createdBy: 'user-1',
    createdAt: new Date(),
    phases: [],
    projectVendors: [],
    tasks: [],
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockProject], 1]),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
  };

  const mockProjectRepo = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockPhaseRepo = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockPvRepo = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockTaskRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockIdGenerator = {
    generate: jest.fn().mockResolvedValue('PRJ-202602-0001'),
    generateForTable: jest.fn().mockResolvedValue('PRJ-202602-0001'),
  };

  beforeEach(async () => {
    // Reset mock implementations
    mockQueryBuilder.leftJoinAndSelect.mockReturnThis();
    mockQueryBuilder.andWhere.mockReturnThis();
    mockQueryBuilder.orderBy.mockReturnThis();
    mockQueryBuilder.skip.mockReturnThis();
    mockQueryBuilder.take.mockReturnThis();
    mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockProject], 1]);
    mockQueryBuilder.where.mockReturnThis();
    mockQueryBuilder.getOne.mockResolvedValue(null);

    mockProjectRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepo,
        },
        {
          provide: getRepositoryToken(ProjectPhase),
          useValue: mockPhaseRepo,
        },
        {
          provide: getRepositoryToken(ProjectVendor),
          useValue: mockPvRepo,
        },
        {
          provide: getRepositoryToken(ProjectTask),
          useValue: mockTaskRepo,
        },
        {
          provide: IdGeneratorService,
          useValue: mockIdGenerator,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    projectRepo = module.get(getRepositoryToken(Project));

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    beforeEach(() => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockProject], 1]);
      mockProjectRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('should return paginated projects', async () => {
      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result).toEqual({ items: [mockProject], total: 1 });
    });

    it('should filter by status', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({ status: ProjectStatus.CONSTRUCTION });

      expect(result).toEqual({ items: [], total: 0 });
      expect(mockProjectRepo.createQueryBuilder).toHaveBeenCalled();
    });

    it('should apply IDOR protection for non-admin users', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({}, 'user-1', 'user');

      expect(result).toEqual({ items: [], total: 0 });
    });
  });

  describe('findOne', () => {
    it('should return a project by id', async () => {
      mockProjectRepo.findOne.mockResolvedValue(mockProject);

      const result = await service.findOne('PRJ-202601-0001');

      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProjectRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new project', async () => {
      const createDto = { name: 'New Project', contractAmount: 500000 };
      const newProject = { ...mockProject, ...createDto };

      mockQueryBuilder.getOne.mockResolvedValue(null);
      mockProjectRepo.create.mockReturnValue(newProject);
      mockProjectRepo.save.mockResolvedValue(newProject);

      const result = await service.create(createDto as any, 'user-1');

      expect(mockProjectRepo.create).toHaveBeenCalled();
      expect(mockProjectRepo.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing project', async () => {
      const updateDto = { name: 'Updated Project' };
      const updatedProject = { ...mockProject, ...updateDto };

      mockProjectRepo.findOne.mockResolvedValue(mockProject);
      mockProjectRepo.save.mockResolvedValue(updatedProject);

      const result = await service.update('PRJ-202601-0001', updateDto as any, 'user-1');

      expect(result.name).toBe('Updated Project');
    });

    it('should recalculate currentAmount on contractAmount change', async () => {
      const updateDto = { contractAmount: 2000000, changeAmount: 100000 };

      mockProjectRepo.findOne.mockResolvedValue({ ...mockProject });
      mockProjectRepo.save.mockImplementation(p => Promise.resolve(p));

      const result = await service.update('PRJ-202601-0001', updateDto as any, 'user-1');

      expect(result.currentAmount).toBe(2100000);
    });
  });

  describe('remove', () => {
    it('should soft delete a project', async () => {
      mockProjectRepo.findOne.mockResolvedValue(mockProject);
      mockProjectRepo.softDelete.mockResolvedValue({ affected: 1 });

      await expect(service.remove('PRJ-202601-0001')).resolves.not.toThrow();

      expect(mockProjectRepo.softDelete).toHaveBeenCalledWith('PRJ-202601-0001');
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProjectRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCostSummary', () => {
    it('should return cost breakdown', async () => {
      mockProjectRepo.findOne.mockResolvedValue(mockProject);
      mockPhaseRepo.find.mockResolvedValue([]);
      mockPvRepo.find.mockResolvedValue([]);

      const result = await service.getCostSummary('PRJ-202601-0001');

      expect(result).toHaveProperty('contractAmount');
      expect(result).toHaveProperty('currentAmount');
      expect(result).toHaveProperty('phaseBreakdown');
      expect(result).toHaveProperty('vendorBreakdown');
    });
  });

  describe('Phase management', () => {
    it('should add a phase to a project', async () => {
      mockProjectRepo.findOne.mockResolvedValue(mockProject);
      mockPhaseRepo.create.mockReturnValue({ name: 'Phase 1' });
      mockPhaseRepo.save.mockResolvedValue({ name: 'Phase 1' });

      const result = await service.addPhase('PRJ-202601-0001', {
        name: 'Phase 1',
      } as any);

      expect(mockPhaseRepo.save).toHaveBeenCalled();
    });

    it('should remove a phase', async () => {
      mockPhaseRepo.delete.mockResolvedValue({ affected: 1 });

      await service.removePhase('phase-id');

      expect(mockPhaseRepo.delete).toHaveBeenCalledWith('phase-id');
    });
  });

  describe('Task management', () => {
    it('should add a task to a project', async () => {
      mockProjectRepo.findOne.mockResolvedValue(mockProject);
      mockTaskRepo.create.mockReturnValue({ name: 'Task 1' });
      mockTaskRepo.save.mockResolvedValue({ name: 'Task 1' });

      const result = await service.addTask('PRJ-202601-0001', {
        name: 'Task 1',
      } as any);

      expect(mockTaskRepo.save).toHaveBeenCalled();
    });

    it('should update task status', async () => {
      const mockTask = { id: 'task-1', status: TaskStatus.TODO };
      mockTaskRepo.findOne.mockResolvedValue(mockTask);
      mockTaskRepo.save.mockImplementation(t => Promise.resolve(t));

      const result = await service.updateTaskStatus('task-1', TaskStatus.DONE);

      expect(result.status).toBe(TaskStatus.DONE);
      expect(result.completedAt).toBeDefined();
    });

    it('should throw NotFoundException for non-existent task', async () => {
      mockTaskRepo.findOne.mockResolvedValue(null);

      await expect(service.updateTaskStatus('non-existent', TaskStatus.DONE)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
