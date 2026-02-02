import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryService } from './inventory.service';
import { InventoryItem } from './inventory-item.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('InventoryService', () => {
  let service: InventoryService;
  let repository: jest.Mocked<Repository<InventoryItem>>;

  const mockItem: Partial<InventoryItem> = {
    id: 'INV-001',
    name: '木地板 (橡木)',
    sku: 'FLOOR-OAK-001',
    category: 'flooring',
    unit: '坪',
    quantity: 100,
    unitPrice: 3500,
    minStock: 10,
    createdBy: 'user-123',
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(InventoryItem),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    repository = module.get(getRepositoryToken(InventoryItem));

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all inventory items', async () => {
      mockRepository.find.mockResolvedValue([mockItem]);
      
      const result = await service.findAll({});
      
      expect(result).toEqual([mockItem]);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('should filter by category', async () => {
      mockRepository.find.mockResolvedValue([mockItem]);
      
      await service.findAll({ category: 'flooring' });
      
      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'flooring' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an item by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockItem);
      
      const result = await service.findOne('INV-001');
      
      expect(result).toEqual(mockItem);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new inventory item', async () => {
      const createDto = {
        name: '新品項',
        sku: 'NEW-001',
        category: 'materials',
        unit: '個',
        quantity: 50,
        unitPrice: 100,
      };
      
      mockRepository.create.mockReturnValue({ ...mockItem, ...createDto });
      mockRepository.save.mockResolvedValue({ ...mockItem, ...createDto });
      
      const result = await service.create(createDto as any, 'user-123');
      
      expect(result.name).toBe('新品項');
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('updateStock', () => {
    it('should increase stock quantity', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockItem, quantity: 100 });
      mockRepository.save.mockResolvedValue({ ...mockItem, quantity: 150 });
      
      const result = await service.updateStock('INV-001', 50, 'add');
      
      expect(result.quantity).toBe(150);
    });

    it('should decrease stock quantity', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockItem, quantity: 100 });
      mockRepository.save.mockResolvedValue({ ...mockItem, quantity: 80 });
      
      const result = await service.updateStock('INV-001', 20, 'subtract');
      
      expect(result.quantity).toBe(80);
    });

    it('should throw BadRequestException for insufficient stock', async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockItem, quantity: 10 });
      
      await expect(
        service.updateStock('INV-001', 50, 'subtract'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getLowStockItems', () => {
    it('should return items below minimum stock', async () => {
      const lowStockItem = { ...mockItem, quantity: 5, minStock: 10 };
      mockRepository.find.mockResolvedValue([lowStockItem]);
      
      const result = await service.getLowStockItems();
      
      expect(result).toEqual([lowStockItem]);
    });
  });
});
