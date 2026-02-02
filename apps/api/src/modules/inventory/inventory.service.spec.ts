import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryService } from './inventory.service';
import { Inventory, InventoryMovement } from './inventory.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('InventoryService', () => {
  let service: InventoryService;
  let inventoryRepository: jest.Mocked<Repository<Inventory>>;
  let movementRepository: jest.Mocked<Repository<InventoryMovement>>;

  const mockInventory: Partial<Inventory> = {
    id: 'INV-001',
    name: '木地板 (橡木)',
    spec: 'FLOOR-OAK-001',
    mainCategory: '建材',
    category: 'flooring',
    unit: '坪',
    quantity: 100,
    safeStock: 10,
    location: 'A-01',
    status: '充足',
  };

  const mockInventoryRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockMovementRepository = {
    find: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(Inventory),
          useValue: mockInventoryRepository,
        },
        {
          provide: getRepositoryToken(InventoryMovement),
          useValue: mockMovementRepository,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    inventoryRepository = module.get(getRepositoryToken(Inventory));
    movementRepository = module.get(getRepositoryToken(InventoryMovement));

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all inventory items', async () => {
      mockInventoryRepository.find.mockResolvedValue([mockInventory]);
      
      const result = await service.findAll();
      
      expect(result).toEqual([mockInventory]);
      expect(mockInventoryRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an item by id', async () => {
      mockInventoryRepository.findOne.mockResolvedValue(mockInventory);
      
      const result = await service.findOne('INV-001');
      
      expect(result).toEqual(mockInventory);
    });

    it('should throw NotFoundException when item not found', async () => {
      mockInventoryRepository.findOne.mockResolvedValue(null);
      
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new inventory item', async () => {
      const createDto = {
        name: '新品項',
        spec: 'NEW-001',
        mainCategory: '建材',
        category: 'materials',
        unit: '個',
        quantity: 50,
        safeStock: 10,
      };
      
      mockInventoryRepository.save.mockResolvedValue({ ...mockInventory, ...createDto });
      
      const result = await service.create(createDto as any);
      
      expect(result.name).toBe('新品項');
      expect(mockInventoryRepository.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing inventory item', async () => {
      const updateDto = { name: '更新後的品項' };
      mockInventoryRepository.findOne.mockResolvedValue(mockInventory);
      mockInventoryRepository.save.mockResolvedValue({ ...mockInventory, ...updateDto });
      
      const result = await service.update('INV-001', updateDto as any);
      
      expect(result.name).toBe('更新後的品項');
    });

    it('should throw NotFoundException when updating non-existent item', async () => {
      mockInventoryRepository.findOne.mockResolvedValue(null);
      
      await expect(
        service.update('nonexistent', { name: 'test' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('stockMovement', () => {
    it('should increase stock quantity (in)', async () => {
      mockInventoryRepository.findOne.mockResolvedValue({ ...mockInventory, quantity: 100 });
      mockInventoryRepository.save.mockResolvedValue({ ...mockInventory, quantity: 150 });
      
      const result = await service.stockMovement('INV-001', 'in', 50);
      
      expect(result.quantity).toBe(150);
    });

    it('should decrease stock quantity (out)', async () => {
      mockInventoryRepository.findOne.mockResolvedValue({ ...mockInventory, quantity: 100 });
      mockInventoryRepository.save.mockResolvedValue({ ...mockInventory, quantity: 80 });
      
      const result = await service.stockMovement('INV-001', 'out', 20);
      
      expect(result.quantity).toBe(80);
    });
  });

  describe('calculateStatus', () => {
    it('should return 缺貨 when quantity is 0', () => {
      const result = service['calculateStatus'](0, 10);
      expect(result).toBe('缺貨');
    });

    it('should return 庫存偏低 when quantity < safeStock', () => {
      const result = service['calculateStatus'](5, 10);
      expect(result).toBe('庫存偏低');
    });

    it('should return 充足 when quantity >= safeStock', () => {
      const result = service['calculateStatus'](100, 10);
      expect(result).toBe('充足');
    });
  });
});
