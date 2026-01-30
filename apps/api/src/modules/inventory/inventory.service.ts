import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory, InventoryMovement } from './inventory.entity';
import { CreateInventoryDto, UpdateInventoryDto, CreateMovementDto } from './inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(InventoryMovement)
    private movementRepository: Repository<InventoryMovement>
  ) {}

  // =============================================
  // Inventory CRUD
  // =============================================

  async findAll(): Promise<Inventory[]> {
    return this.inventoryRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({ where: { id } });
    if (!inventory) {
      throw new NotFoundException(`Inventory item with ID "${id}" not found`);
    }
    return inventory;
  }

  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    const inventory = new Inventory();
    Object.assign(inventory, createInventoryDto);
    inventory.status = this.calculateStatus(inventory.quantity ?? 0, inventory.safeStock ?? 10);
    return this.inventoryRepository.save(inventory);
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto): Promise<Inventory> {
    const inventory = await this.findOne(id);
    Object.assign(inventory, updateInventoryDto);
    inventory.status = this.calculateStatus(inventory.quantity, inventory.safeStock);
    return this.inventoryRepository.save(inventory);
  }

  async remove(id: string): Promise<void> {
    const inventory = await this.findOne(id);
    await this.inventoryRepository.remove(inventory);
  }

  // =============================================
  // Inventory Movements (專案領料追蹤)
  // =============================================

  /**
   * 新增庫存異動記錄
   * @param dto 異動資料
   * @param userId 建立者
   */
  async addMovement(dto: CreateMovementDto, userId?: string): Promise<InventoryMovement> {
    const inventory = await this.findOne(dto.inventoryId);

    // Validate quantity for OUT movements
    if (dto.movementType === 'OUT' && dto.quantity > inventory.quantity) {
      throw new BadRequestException(`庫存不足，目前庫存: ${inventory.quantity}`);
    }

    // Calculate total cost
    const totalCost = dto.unitCost ? dto.quantity * dto.unitCost : null;

    const movement = new InventoryMovement();
    movement.inventoryId = dto.inventoryId;
    if (dto.projectId) movement.projectId = dto.projectId;
    movement.movementType = dto.movementType;
    movement.quantity = dto.quantity;
    if (dto.unitCost) movement.unitCost = dto.unitCost;
    if (totalCost) movement.totalCost = totalCost;
    if (dto.referenceNo) movement.referenceNo = dto.referenceNo;
    if (dto.notes) movement.notes = dto.notes;
    if (userId) movement.createdBy = userId;

    await this.movementRepository.save(movement);

    // Update inventory quantity
    if (dto.movementType === 'IN') {
      inventory.quantity += dto.quantity;
    } else if (dto.movementType === 'OUT') {
      inventory.quantity -= dto.quantity;
    } else if (dto.movementType === 'ADJUST') {
      // ADJUST uses absolute quantity, not delta
      inventory.quantity = dto.quantity;
    }
    // TRANSFER doesn't change this item's quantity (handled separately)

    inventory.status = this.calculateStatus(inventory.quantity, inventory.safeStock);
    await this.inventoryRepository.save(inventory);

    return movement;
  }

  /**
   * 取得庫存品項的異動記錄
   */
  async getMovements(inventoryId: string): Promise<InventoryMovement[]> {
    return this.movementRepository.find({
      where: { inventoryId },
      relations: ['project'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 取得專案的所有領料記錄
   */
  async getMovementsByProject(projectId: string): Promise<InventoryMovement[]> {
    return this.movementRepository.find({
      where: { projectId },
      relations: ['inventory'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 取得專案領料成本彙總
   */
  async getProjectMaterialCost(projectId: string): Promise<{ totalCost: number; count: number }> {
    const result = await this.movementRepository
      .createQueryBuilder('m')
      .select('SUM(m.total_cost)', 'totalCost')
      .addSelect('COUNT(*)', 'count')
      .where('m.project_id = :projectId', { projectId })
      .andWhere('m.movement_type = :type', { type: 'OUT' })
      .getRawOne();

    return {
      totalCost: Number(result?.totalCost || 0),
      count: Number(result?.count || 0),
    };
  }

  // Legacy method for backward compatibility
  async stockMovement(id: string, type: 'in' | 'out', quantity: number): Promise<Inventory> {
    const inventory = await this.findOne(id);
    if (type === 'in') {
      inventory.quantity += quantity;
    } else {
      inventory.quantity = Math.max(0, inventory.quantity - quantity);
    }
    inventory.status = this.calculateStatus(inventory.quantity, inventory.safeStock);
    return this.inventoryRepository.save(inventory);
  }

  private calculateStatus(quantity: number, safeStock: number): string {
    if (quantity <= 0) return '缺貨';
    if (quantity < safeStock) return '庫存偏低';
    return '充足';
  }
}
