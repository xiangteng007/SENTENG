import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractsService } from './contracts.service';
import { Contract } from './contract.entity';
import { QuotationsService } from '../quotations/quotations.service';
import { ProjectsService } from '../projects/projects.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('ContractsService', () => {
  let service: ContractsService;
  let repository: jest.Mocked<Repository<Contract>>;
  let quotationsService: jest.Mocked<QuotationsService>;
  let projectsService: jest.Mocked<ProjectsService>;

  const mockContract: Partial<Contract> = {
    id: 'CON-2026-001',
    projectId: 'PRJ-001',
    title: '室內設計合約',
    status: 'CTR_DRAFT',
    originalAmount: 500000,
    currentAmount: 500000,
    signDate: undefined,
    createdBy: 'user-123',
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockQuotationsService = {
    findOne: jest.fn(),
  };

  const mockProjectsService = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    mockQueryBuilder.where.mockReturnThis();
    mockQueryBuilder.orderBy.mockReturnThis();
    mockQueryBuilder.getOne.mockResolvedValue(null);
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        {
          provide: getRepositoryToken(Contract),
          useValue: mockRepository,
        },
        {
          provide: QuotationsService,
          useValue: mockQuotationsService,
        },
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
    repository = module.get(getRepositoryToken(Contract));
    quotationsService = module.get(QuotationsService);
    projectsService = module.get(ProjectsService);

    // Reset mocks
    jest.clearAllMocks();

    // Re-setup createQueryBuilder after clearAllMocks
    mockQueryBuilder.where.mockReturnThis();
    mockQueryBuilder.orderBy.mockReturnThis();
    mockQueryBuilder.getOne.mockResolvedValue(null);
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  describe('findAll', () => {
    it('should return all contracts for admin', async () => {
      mockRepository.find.mockResolvedValue([mockContract]);
      
      const result = await service.findAll({}, 'admin-user', 'admin');
      
      expect(result).toEqual([mockContract]);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('should filter by projectId', async () => {
      mockRepository.find.mockResolvedValue([mockContract]);
      
      await service.findAll({ projectId: 'PRJ-001' }, 'user-123', 'member');
      
      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 'PRJ-001' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a contract by id for owner', async () => {
      mockRepository.findOne.mockResolvedValue(mockContract);
      
      const result = await service.findOne('CON-2026-001', 'user-123', 'member');
      
      expect(result).toEqual(mockContract);
    });

    it('should throw NotFoundException when contract not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      
      await expect(
        service.findOne('nonexistent', 'user-123', 'member'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new contract', async () => {
      const createDto = {
        projectId: 'PRJ-001',
        title: '新合約',
        originalAmount: 300000,
      };
      
      mockRepository.create.mockReturnValue({ ...mockContract, ...createDto });
      mockRepository.save.mockResolvedValue({ ...mockContract, ...createDto });
      
      const result = await service.create(createDto as any, 'user-123');
      
      expect(result.title).toBe('新合約');
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('sign', () => {
    it('should sign a draft contract', async () => {
      const draftContract = { ...mockContract, status: 'CTR_DRAFT' };
      mockRepository.findOne.mockResolvedValue(draftContract);
      mockRepository.save.mockResolvedValue({ ...draftContract, status: 'CTR_ACTIVE' });
      mockProjectsService.update.mockResolvedValue({} as any);
      
      const result = await service.sign('CON-2026-001', '2026-02-01', 'user-123');
      
      expect(result.status).toBe('CTR_ACTIVE');
    });

    it('should throw BadRequestException if contract already signed', async () => {
      const signedContract = { ...mockContract, status: 'CTR_SIGNED' };
      mockRepository.findOne.mockResolvedValue(signedContract);
      
      await expect(
        service.sign('CON-2026-001', '2026-02-01', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('complete', () => {
    it('should complete an active contract', async () => {
      const activeContract = { ...mockContract, status: 'CTR_ACTIVE' };
      mockRepository.findOne.mockResolvedValue(activeContract);
      mockRepository.save.mockResolvedValue({ ...activeContract, status: 'CTR_COMPLETED' });
      
      const result = await service.complete('CON-2026-001', 'user-123');
      
      expect(result.status).toBe('CTR_COMPLETED');
    });
  });

  describe('checkOwnership', () => {
    it('should allow admin access to any contract', () => {
      expect(() => 
        service['checkOwnership'](mockContract as Contract, 'other-user', 'admin')
      ).not.toThrow();
    });

    it('should throw ForbiddenException for non-owner', () => {
      expect(() => 
        service['checkOwnership'](mockContract as Contract, 'other-user', 'member')
      ).toThrow(ForbiddenException);
    });
  });
});
