import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VendorsService } from './vendors.service';
import { Vendor, VendorStatus } from './vendor.entity';
import { VendorContact } from './vendor-contact.entity';
import { VendorTrade } from './vendor-trade.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('VendorsService', () => {
  let service: VendorsService;
  let vendorRepo: jest.Mocked<Repository<Vendor>>;

  const mockVendor: Partial<Vendor> = {
    id: 'VND-202601-0001',
    name: 'Test Vendor',
    status: VendorStatus.ACTIVE,
    createdBy: 'user-1',
    createdAt: new Date(),
    contacts: [],
    trades: [],
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockVendor], 1]),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
  };

  const mockVendorRepo = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockContactRepo = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTradeRepo = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorsService,
        {
          provide: getRepositoryToken(Vendor),
          useValue: mockVendorRepo,
        },
        {
          provide: getRepositoryToken(VendorContact),
          useValue: mockContactRepo,
        },
        {
          provide: getRepositoryToken(VendorTrade),
          useValue: mockTradeRepo,
        },
      ],
    }).compile();

    service = module.get<VendorsService>(VendorsService);
    vendorRepo = module.get(getRepositoryToken(Vendor));

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated vendors', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockVendor], 1]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result).toEqual({ items: [mockVendor], total: 1 });
    });

    it('should filter by status', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ status: VendorStatus.ACTIVE });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('v.status = :status', {
        status: VendorStatus.ACTIVE,
      });
    });

    it('should apply IDOR protection for non-admin users', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({}, 'user-1', 'user');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('v.createdBy = :userId', {
        userId: 'user-1',
      });
    });
  });

  describe('findOne', () => {
    it('should return a vendor by id', async () => {
      mockVendorRepo.findOne.mockResolvedValue(mockVendor);

      const result = await service.findOne('VND-202601-0001');

      expect(result).toEqual(mockVendor);
    });

    it('should throw NotFoundException if vendor not found', async () => {
      mockVendorRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized access', async () => {
      mockVendorRepo.findOne.mockResolvedValue({
        ...mockVendor,
        createdBy: 'other-user',
      });

      await expect(service.findOne('VND-202601-0001', 'user-1', 'user')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('create', () => {
    it('should create a new vendor', async () => {
      const createDto = { name: 'New Vendor' };
      const newVendor = { ...mockVendor, ...createDto };

      mockQueryBuilder.getOne.mockResolvedValue(null);
      mockVendorRepo.create.mockReturnValue(newVendor);
      mockVendorRepo.save.mockResolvedValue(newVendor);
      mockVendorRepo.findOne.mockResolvedValue(newVendor);

      const result = await service.create(createDto as any, 'user-1');

      expect(mockVendorRepo.create).toHaveBeenCalled();
      expect(mockVendorRepo.save).toHaveBeenCalled();
    });
  });

  describe('blacklist', () => {
    it('should blacklist a vendor', async () => {
      mockVendorRepo.findOne.mockResolvedValue({ ...mockVendor });
      mockVendorRepo.save.mockImplementation(v =>
        Promise.resolve({ ...v, status: VendorStatus.BLACKLISTED })
      );

      const result = await service.blacklist('VND-202601-0001', 'Test reason', 'admin-1');

      expect(result.status).toBe(VendorStatus.BLACKLISTED);
    });
  });

  describe('activate', () => {
    it('should activate a vendor', async () => {
      const blacklistedVendor = {
        ...mockVendor,
        status: VendorStatus.BLACKLISTED,
      };
      mockVendorRepo.findOne.mockResolvedValue(blacklistedVendor);
      mockVendorRepo.save.mockImplementation(v =>
        Promise.resolve({ ...v, status: VendorStatus.ACTIVE })
      );

      const result = await service.activate('VND-202601-0001', 'admin-1');

      expect(result.status).toBe(VendorStatus.ACTIVE);
    });
  });

  describe('remove', () => {
    it('should soft delete a vendor', async () => {
      mockVendorRepo.findOne.mockResolvedValue(mockVendor);
      mockVendorRepo.softRemove.mockResolvedValue(mockVendor);

      await expect(service.remove('VND-202601-0001', 'user-1', 'admin')).resolves.not.toThrow();

      expect(mockVendorRepo.softRemove).toHaveBeenCalled();
    });
  });

  describe('addTrade', () => {
    it('should add a trade to a vendor', async () => {
      mockVendorRepo.findOne.mockResolvedValue(mockVendor);
      mockTradeRepo.create.mockReturnValue({ tradeCode: 'ELEC' });
      mockTradeRepo.save.mockResolvedValue({ tradeCode: 'ELEC' });

      const result = await service.addTrade('VND-202601-0001', {
        tradeCode: 'ELEC',
      } as any);

      expect(mockTradeRepo.save).toHaveBeenCalled();
    });
  });

  describe('updateRating', () => {
    it('should update vendor rating', async () => {
      mockVendorRepo.findOne.mockResolvedValue({ ...mockVendor, rating: 3 });
      mockVendorRepo.save.mockImplementation(v => Promise.resolve({ ...v, rating: 5 }));

      const result = await service.updateRating('VND-202601-0001', 5, 'user-1');

      expect(result.rating).toBe(5);
    });
  });
});
