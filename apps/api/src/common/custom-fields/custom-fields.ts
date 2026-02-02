/**
 * 自訂欄位框架
 * EXT-003: Custom Fields Framework
 */

// ============================================
// Types
// ============================================

export type CustomFieldType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'datetime'
  | 'select' 
  | 'multiselect'
  | 'checkbox'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'url';

export type EntityType = 
  | 'project' 
  | 'client' 
  | 'quotation' 
  | 'invoice' 
  | 'contract'
  | 'vendor';

export interface CustomFieldDefinition {
  id: string;
  entityType: EntityType;
  name: string;           // 欄位 key
  label: string;          // 顯示名稱
  type: CustomFieldType;
  required: boolean;
  defaultValue?: any;
  placeholder?: string;
  helpText?: string;
  
  // 選擇類型專用
  options?: SelectOption[];
  
  // 數字類型專用
  min?: number;
  max?: number;
  step?: number;
  
  // 文字類型專用
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  
  // 排序和分組
  sortOrder: number;
  group?: string;
  
  // 權限
  visibleRoles?: string[];
  editableRoles?: string[];
  
  // 元資料
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

export interface CustomFieldValue {
  fieldId: string;
  entityId: string;
  entityType: EntityType;
  value: any;
  updatedAt: Date;
  updatedBy: string;
}

// ============================================
// Custom Field Service
// ============================================

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CustomFieldService {
  constructor(
    @InjectRepository('CustomFieldDefinition')
    private definitionRepo: Repository<CustomFieldDefinition>,
    @InjectRepository('CustomFieldValue')
    private valueRepo: Repository<CustomFieldValue>,
  ) {}

  // 取得實體的所有自訂欄位定義
  async getDefinitions(entityType: EntityType): Promise<CustomFieldDefinition[]> {
    return this.definitionRepo.find({
      where: { entityType, isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  // 建立自訂欄位定義
  async createDefinition(
    dto: Omit<CustomFieldDefinition, 'id' | 'createdAt' | 'sortOrder'>,
    userId: string,
  ): Promise<CustomFieldDefinition> {
    // 取得最大 sortOrder
    const maxSort = await this.definitionRepo
      .createQueryBuilder('d')
      .select('MAX(d.sortOrder)', 'max')
      .where('d.entityType = :entityType', { entityType: dto.entityType })
      .getRawOne();

    const definition = this.definitionRepo.create({
      ...dto,
      sortOrder: (maxSort?.max || 0) + 1,
      createdBy: userId,
      createdAt: new Date(),
      isActive: true,
    });

    return this.definitionRepo.save(definition);
  }

  // 更新欄位定義
  async updateDefinition(
    id: string,
    dto: Partial<CustomFieldDefinition>,
  ): Promise<CustomFieldDefinition> {
    await this.definitionRepo.update(id, dto);
    return this.definitionRepo.findOneOrFail({ where: { id } });
  }

  // 取得實體的所有自訂欄位值
  async getValues(
    entityType: EntityType,
    entityId: string,
  ): Promise<Record<string, any>> {
    const values = await this.valueRepo.find({
      where: { entityType, entityId },
    });

    return values.reduce((acc, v) => {
      acc[v.fieldId] = v.value;
      return acc;
    }, {} as Record<string, any>);
  }

  // 儲存自訂欄位值
  async setValues(
    entityType: EntityType,
    entityId: string,
    values: Record<string, any>,
    userId: string,
  ): Promise<void> {
    const definitions = await this.getDefinitions(entityType);
    const validFieldIds = new Set(definitions.map(d => d.id));

    for (const [fieldId, value] of Object.entries(values)) {
      if (!validFieldIds.has(fieldId)) continue;

      // 驗證必填
      const definition = definitions.find(d => d.id === fieldId);
      if (definition?.required && (value === null || value === undefined || value === '')) {
        throw new Error(`欄位 ${definition.label} 為必填`);
      }

      // 更新或建立
      const existing = await this.valueRepo.findOne({
        where: { fieldId, entityId, entityType },
      });

      if (existing) {
        existing.value = value;
        existing.updatedAt = new Date();
        existing.updatedBy = userId;
        await this.valueRepo.save(existing);
      } else {
        await this.valueRepo.save({
          fieldId,
          entityId,
          entityType,
          value,
          updatedAt: new Date(),
          updatedBy: userId,
        });
      }
    }
  }

  // 驗證欄位值
  validateValue(definition: CustomFieldDefinition, value: any): string | null {
    if (definition.required && (value === null || value === undefined || value === '')) {
      return `${definition.label} 為必填`;
    }

    switch (definition.type) {
      case 'number':
        if (definition.min !== undefined && value < definition.min) {
          return `${definition.label} 最小值為 ${definition.min}`;
        }
        if (definition.max !== undefined && value > definition.max) {
          return `${definition.label} 最大值為 ${definition.max}`;
        }
        break;

      case 'text':
      case 'textarea':
        if (definition.minLength && value?.length < definition.minLength) {
          return `${definition.label} 至少需要 ${definition.minLength} 個字元`;
        }
        if (definition.maxLength && value?.length > definition.maxLength) {
          return `${definition.label} 最多 ${definition.maxLength} 個字元`;
        }
        if (definition.pattern && !new RegExp(definition.pattern).test(value)) {
          return `${definition.label} 格式不正確`;
        }
        break;

      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return `${definition.label} 必須是有效的電子郵件`;
        }
        break;

      case 'select':
        if (definition.options && !definition.options.some(o => o.value === value)) {
          return `${definition.label} 選項無效`;
        }
        break;
    }

    return null;
  }
}

// ============================================
// Entity Definition (TypeORM)
// ============================================

import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('custom_field_definitions')
export class CustomFieldDefinitionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  entityType: string;

  @Column()
  name: string;

  @Column()
  label: string;

  @Column()
  type: string;

  @Column({ default: false })
  required: boolean;

  @Column('jsonb', { nullable: true })
  options: any;

  @Column('jsonb', { nullable: true })
  config: any;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ nullable: true })
  group: string;

  @Column('simple-array', { nullable: true })
  visibleRoles: string[];

  @Column('simple-array', { nullable: true })
  editableRoles: string[];

  @Column()
  createdBy: string;

  @Column()
  createdAt: Date;

  @Column({ default: true })
  isActive: boolean;
}

@Entity('custom_field_values')
@Index(['entityType', 'entityId'])
export class CustomFieldValueEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fieldId: string;

  @Column()
  @Index()
  entityType: string;

  @Column()
  @Index()
  entityId: string;

  @Column('jsonb')
  value: any;

  @Column()
  updatedAt: Date;

  @Column()
  updatedBy: string;
}
