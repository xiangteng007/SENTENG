import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepo: any;

  const mockUser: Partial<User> = {
    id: 'USR-0001',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    isActive: true,
    authProvider: 'google',
    authUid: 'google-uid-123',
    lastLoginAt: new Date(),
  };

  beforeEach(async () => {
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── findAll ───

  describe('findAll', () => {
    it('should return all active users by default', async () => {
      mockRepo.find.mockResolvedValue([mockUser]);
      const result = await service.findAll();
      expect(result).toEqual([mockUser]);
      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        }),
      );
    });

    it('should filter by role', async () => {
      mockRepo.find.mockResolvedValue([mockUser]);
      await service.findAll({ role: 'admin' });
      expect(mockRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: 'admin' }),
        }),
      );
    });

    it('should filter by search (name Like)', async () => {
      mockRepo.find.mockResolvedValue([]);
      await service.findAll({ search: 'Test' });
      expect(mockRepo.find).toHaveBeenCalled();
    });
  });

  // ─── findOne ───

  describe('findOne', () => {
    it('should return user when found', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      expect(await service.findOne('USR-0001')).toEqual(mockUser);
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findByEmail / findByAuthUid ───

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      expect(await service.findByEmail('test@example.com')).toEqual(mockUser);
    });

    it('should return null when email not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      expect(await service.findByEmail('nope@example.com')).toBeNull();
    });
  });

  describe('findByAuthUid', () => {
    it('should return user by authUid', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      expect(await service.findByAuthUid('google-uid-123')).toEqual(mockUser);
    });
  });

  // ─── create ───

  describe('create', () => {
    it('should create user with generated ID', async () => {
      mockRepo.count.mockResolvedValue(5);
      mockRepo.create.mockReturnValue({ ...mockUser, id: 'USR-0006' });
      mockRepo.save.mockResolvedValue({ ...mockUser, id: 'USR-0006' });

      const result = await service.create({
        email: 'new@example.com',
        name: 'New User',
      });
      expect(result.id).toBe('USR-0006');
      expect(mockRepo.create).toHaveBeenCalled();
    });
  });

  // ─── update ───

  describe('update', () => {
    it('should update user fields', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockUser });
      mockRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      const result = await service.update('USR-0001', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException for missing user', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.update('nope', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  // ─── deactivate ───

  describe('deactivate', () => {
    it('should set isActive to false', async () => {
      mockRepo.findOne.mockResolvedValue({ ...mockUser, isActive: true });
      mockRepo.save.mockImplementation((u: any) => Promise.resolve(u));

      const result = await service.deactivate('USR-0001');
      expect(result.isActive).toBe(false);
    });
  });

  // ─── updateLastLogin ───

  describe('updateLastLogin', () => {
    it('should call update with lastLoginAt', async () => {
      mockRepo.update.mockResolvedValue({ affected: 1 });
      await service.updateLastLogin('USR-0001');
      expect(mockRepo.update).toHaveBeenCalledWith(
        'USR-0001',
        expect.objectContaining({ lastLoginAt: expect.any(Date) }),
      );
    });
  });
});
