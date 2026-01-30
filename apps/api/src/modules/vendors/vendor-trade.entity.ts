import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Vendor } from './vendor.entity';

/**
 * Trade/capability codes for vendors
 */
export enum TradeCode {
  WOOD = 'WOOD', // 木作
  ELECTRIC = 'ELECTRIC', // 水電
  PAINT = 'PAINT', // 油漆
  TILE = 'TILE', // 泥作/貼磚
  CABINET = 'CABINET', // 系統櫃
  ALUMINUM = 'ALUMINUM', // 鋁門窗
  IRON = 'IRON', // 鐵工
  GLASS = 'GLASS', // 玻璃
  PLUMBING = 'PLUMBING', // 水管
  AC = 'AC', // 空調
  FLOORING = 'FLOORING', // 地板
  CEILING = 'CEILING', // 天花板
  DEMOLITION = 'DEMOLITION', // 拆除
  CLEANING = 'CLEANING', // 清潔
  LANDSCAPE = 'LANDSCAPE', // 景觀
  CURTAIN = 'CURTAIN', // 窗簾
  LIGHTING = 'LIGHTING', // 燈具
  FURNITURE = 'FURNITURE', // 家具
  APPLIANCE = 'APPLIANCE', // 家電
  OTHER = 'OTHER',
}

export enum CapabilityLevel {
  PRIMARY = 'PRIMARY', // 主要專長
  SECONDARY = 'SECONDARY', // 次要能力
}

@Entity('vendor_trades')
@Index(['vendorId'])
@Index(['tradeCode'])
export class VendorTrade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vendor_id', length: 20 })
  vendorId: string;

  @ManyToOne(() => Vendor, vendor => vendor.trades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ name: 'trade_code', length: 30 })
  tradeCode: TradeCode;

  @Column({ name: 'trade_name', length: 50, nullable: true })
  tradeName: string; // 自訂名稱

  @Column({
    name: 'capability_level',
    length: 20,
    default: CapabilityLevel.PRIMARY,
  })
  capabilityLevel: CapabilityLevel;

  @Column({ type: 'text', nullable: true })
  description: string;
}
