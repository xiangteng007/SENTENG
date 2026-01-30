import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientsService } from './clients.service';
import { Client } from './client.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ClientsService', () => {
  let service: ClientsService;
  let repository: jest.Mocked<Repository<Client>>;

  const mockClient: Partial<Client> = {
    id: 'CLT-202601-0001',
    name: 'Test Client',
    status: 'ACTIVE',
    createdBy: 'user-1',
    createdAt: new Date(),
  };

  const mockRepository = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        {
          provide: getRepositoryToken(Client),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    repository = module.get(getRepositoryToken(Client));

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated clients', async () => {
      const clients = [mockClient];
      mockRepository.findAndCount.mockResolvedValue([clients, 1]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result).toEqual({ items: clients, total: 1 });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        order: { createdAt: 'DESC' },
      });
    });

    it('should filter by status', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ status: 'ACTIVE' });

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'ACTIVE' },
        })
      );
    });

    it('should apply IDOR protection for non-admin users', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({}, 'user-1', 'user');

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { createdBy: 'user-1' },
        })
      );
    });

    it('should not apply IDOR for admin users', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({}, 'admin-1', 'admin');

      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a client by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockClient);

      const result = await service.findOne('CLT-202601-0001');

      expect(result).toEqual(mockClient);
    });

    it('should throw NotFoundException if client not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized access', async () => {
      mockRepository.findOne.mockResolvedValue({
        ...mockClient,
        createdBy: 'other-user',
      });

      await expect(service.findOne('CLT-202601-0001', 'user-1', 'user')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('create', () => {
    it('should create a new client', async () => {
      const createDto = { name: 'New Client' };
      const newClient = { ...mockClient, ...createDto };

      mockRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });
      mockRepository.create.mockReturnValue(newClient);
      mockRepository.save.mockResolvedValue(newClient);

      const result = await service.create(createDto as any, 'user-1');

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(newClient);
    });
  });

  describe('update', () => {
    it('should update an existing client', async () => {
      const updateDto = { name: 'Updated Client' };
      const updatedClient = { ...mockClient, ...updateDto };

      mockRepository.findOne.mockResolvedValue(mockClient);
      mockRepository.save.mockResolvedValue(updatedClient);

      const result = await service.update('CLT-202601-0001', updateDto as any, 'user-1', 'admin');

      expect(result.name).toBe('Updated Client');
    });
  });

  describe('remove', () => {
    it('should remove a client', async () => {
      mockRepository.findOne.mockResolvedValue(mockClient);
      mockRepository.remove.mockResolvedValue(mockClient);

      await expect(service.remove('CLT-202601-0001', 'user-1', 'admin')).resolves.not.toThrow();

      expect(mockRepository.remove).toHaveBeenCalledWith(mockClient);
    });
  });
});
