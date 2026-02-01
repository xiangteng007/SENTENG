import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { Customer, PipelineStage } from './customer.entity';
import { CustomerContact } from './customer-contact.entity';
import { IdGeneratorService } from '../../core';

// Mock core modules to avoid ConfigService dependency
jest.mock('../../core', () => ({
  IdGeneratorService: jest.fn().mockImplementation(() => ({
    generateForTable: jest.fn().mockResolvedValue('CLT-002'),
  })),
  checkResourceOwnership: jest.fn((entity, userId, userRole, _name) => {
    if (userRole !== 'admin' && entity.createdBy !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }),
}));

describe('CustomersService', () => {
  let service: CustomersService;

  const mockCustomer = {
    id: 'CLT-001',
    name: 'Test Customer',
    phone: '0912345678',
    email: 'test@example.com',
    status: 'active',
    pipelineStage: 'LEAD',
    tags: ['vip'],
    createdBy: 'user-123',
    contacts: [],
  };

  const mockContact = {
    id: 'contact-1',
    customerId: 'CLT-001',
    name: 'John Doe',
    phone: '0987654321',
    email: 'john@example.com',
  };

  // Mock QueryBuilder
  const mockQueryBuilder = {
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockCustomer], 1]),
  };

  const mockCustomerRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
    create: jest.fn().mockImplementation(dto => ({ ...dto })),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockContactRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    create: jest.fn().mockImplementation(dto => ({ ...dto })),
  };

  const mockIdGenerator = {
    generateForTable: jest.fn().mockResolvedValue('CLT-002'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: getRepositoryToken(Customer), useValue: mockCustomerRepo },
        { provide: getRepositoryToken(CustomerContact), useValue: mockContactRepo },
        { provide: IdGeneratorService, useValue: mockIdGenerator },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      const result = await service.findAll({ page: 1, limit: 20 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by ownership for non-admin users', async () => {
      await service.findAll({ page: 1 }, 'user-123', 'user');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'c.createdBy = :userId',
        { userId: 'user-123' }
      );
    });

    it('should not filter by ownership for admin', async () => {
      mockQueryBuilder.andWhere.mockClear();
      await service.findAll({ page: 1 }, 'admin-id', 'admin');
      // Should not have ownership filter
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'c.createdBy = :userId',
        expect.anything()
      );
    });

    it('should apply search filter', async () => {
      await service.findAll({ search: 'test' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(c.name ILIKE :search OR c.phone ILIKE :search OR c.email ILIKE :search)',
        { search: '%test%' }
      );
    });
  });

  describe('findOne', () => {
    it('should return customer by id', async () => {
      mockCustomerRepo.findOne.mockResolvedValue(mockCustomer);
      // Pass owner user to satisfy ownership check
      const result = await service.findOne('CLT-001', 'user-123', 'user');
      expect(result.id).toBe('CLT-001');
    });

    it('should throw NotFoundException for missing customer', async () => {
      mockCustomerRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('not-exist')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for non-owner access', async () => {
      mockCustomerRepo.findOne.mockResolvedValue(mockCustomer);
      await expect(
        service.findOne('CLT-001', 'other-user', 'user')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('should create customer with generated ID', async () => {
      mockCustomerRepo.save.mockImplementation(c => Promise.resolve(c));
      
      const dto = { name: 'New Customer', phone: '0911111111' };
      const result = await service.create(dto as any, 'user-123');
      
      expect(mockIdGenerator.generateForTable).toHaveBeenCalledWith('customers', 'CLT');
      expect(result.id).toBe('CLT-002');
      expect(result.createdBy).toBe('user-123');
    });
  });

  describe('update', () => {
    it('should update customer', async () => {
      mockCustomerRepo.findOne.mockResolvedValue({ ...mockCustomer });
      mockCustomerRepo.save.mockImplementation(c => Promise.resolve(c));
      
      const result = await service.update('CLT-001', { name: 'Updated' } as any, 'user-123', 'admin');
      expect(result.name).toBe('Updated');
      expect(result.updatedBy).toBe('user-123');
    });
  });

  describe('updatePipelineStage', () => {
    it('should update pipeline stage', async () => {
      mockCustomerRepo.findOne.mockResolvedValue({ ...mockCustomer });
      mockCustomerRepo.save.mockImplementation(c => Promise.resolve(c));
      
      const result = await service.updatePipelineStage(
        'CLT-001', 
        'QUALIFIED' as PipelineStage, 
        'user-123', 
        'admin'
      );
      expect(result.pipelineStage).toBe('QUALIFIED');
    });
  });

  describe('remove', () => {
    it('should soft remove customer', async () => {
      mockCustomerRepo.findOne.mockResolvedValue(mockCustomer);
      mockCustomerRepo.softRemove.mockResolvedValue(mockCustomer);
      
      await service.remove('CLT-001', 'user-123', 'admin');
      expect(mockCustomerRepo.softRemove).toHaveBeenCalledWith(mockCustomer);
    });
  });

  describe('addContact', () => {
    it('should add contact to customer', async () => {
      mockCustomerRepo.findOne.mockResolvedValue(mockCustomer);
      mockContactRepo.save.mockImplementation(c => Promise.resolve(c));
      
      const dto = { name: 'Jane', phone: '0922222222' };
      const result = await service.addContact('CLT-001', dto as any, 'user-123', 'admin');
      
      expect(result.customerId).toBe('CLT-001');
      expect(result.name).toBe('Jane');
    });
  });

  describe('removeContact', () => {
    it('should delete contact', async () => {
      mockContactRepo.delete.mockResolvedValue({ affected: 1 });
      
      await service.removeContact('contact-1');
      expect(mockContactRepo.delete).toHaveBeenCalledWith('contact-1');
    });
  });
});
