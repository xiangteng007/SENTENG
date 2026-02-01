import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

// Entities
import { ServiceCatalog } from "./catalog/entities";
import { WorkOrder } from "./work-orders/entities";
import { DispatchAssignment, PreflightChecklist } from "./dispatch/entities";
import { FlightLog, OperationLog } from "./flights/entities";
import { DroneAsset, MaintenanceRecord } from "./assets/entities";
import {
  ChemicalLot,
  MixtureBatch,
  ApplicationRecord,
} from "./chemicals/entities";

// Modules
import { WorkOrdersModule } from "./work-orders/work-orders.module";

/**
 * DroneModule
 *
 * 無人機作業領域模組，包含：
 * - Catalog: 服務目錄 (ServiceCatalog)
 * - WorkOrders: 工單管理 (WorkOrder) - 含完整 CRUD 與工作流
 * - Dispatch: 派工與檢查 (DispatchAssignment, PreflightChecklist)
 * - Flights: 飛行紀錄 (FlightLog, OperationLog)
 * - Assets: 資產管理 (DroneAsset, MaintenanceRecord)
 * - Chemicals: 藥劑追溯 (ChemicalLot, MixtureBatch, ApplicationRecord)
 *
 * Note: Event automation (work-order.completed) is handled separately
 * to avoid circular dependencies with CostEntries/Invoices modules.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Catalog
      ServiceCatalog,
      // Work Orders
      WorkOrder,
      // Dispatch
      DispatchAssignment,
      PreflightChecklist,
      // Flights
      FlightLog,
      OperationLog,
      // Assets
      DroneAsset,
      MaintenanceRecord,
      // Chemicals
      ChemicalLot,
      MixtureBatch,
      ApplicationRecord,
    ]),
    WorkOrdersModule,
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule, WorkOrdersModule],
})
export class DroneModule {}
