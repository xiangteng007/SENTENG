import { WorkOrder } from '../entities';

/**
 * WorkOrder 完工事件
 * 當工單完工時發送，用於觸發成本計算與發票草稿
 */
export class WorkOrderCompletedEvent {
  constructor(
    public readonly workOrderId: string,
    public readonly workOrder: WorkOrder,
    public readonly completedAt: Date,
    public readonly completedBy?: string
  ) {}
}
