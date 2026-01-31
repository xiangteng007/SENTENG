import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { WorkOrdersService } from "./work-orders.service";
import { WorkOrder } from "./entities";
import { NotFoundException, BadRequestException } from "@nestjs/common";

describe("WorkOrdersService", () => {
  let service: WorkOrdersService;
  let workOrderRepo: jest.Mocked<Repository<WorkOrder>>;
  let dataSource: jest.Mocked<DataSource>;

  const mockWorkOrder: Partial<WorkOrder> = {
    id: "WO-202602-0001",
    woNumber: "WO-202602-0001",
    projectId: "PRJ-001",
    clientId: "CLT-001",
    status: "WO_DRAFT",
    createdAt: new Date(),
  };

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkOrdersService,
        {
          provide: getRepositoryToken(WorkOrder),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn((cb) =>
              cb({
                save: jest.fn().mockImplementation((entity) => entity),
              })
            ),
          },
        },
      ],
    }).compile();

    service = module.get<WorkOrdersService>(WorkOrdersService);
    workOrderRepo = module.get(getRepositoryToken(WorkOrder));
    dataSource = module.get(DataSource);
  });

  describe("findAll", () => {
    it("should return all work orders", async () => {
      workOrderRepo.find.mockResolvedValue([mockWorkOrder as WorkOrder]);
      const result = await service.findAll();
      expect(result).toEqual([mockWorkOrder]);
    });

    it("should filter by projectId", async () => {
      workOrderRepo.find.mockResolvedValue([]);
      await service.findAll({ projectId: "PRJ-001" });
      expect(workOrderRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: "PRJ-001" }),
        })
      );
    });
  });

  describe("findById", () => {
    it("should return work order by id", async () => {
      workOrderRepo.findOne.mockResolvedValue(mockWorkOrder as WorkOrder);
      const result = await service.findById("WO-202602-0001");
      expect(result).toEqual(mockWorkOrder);
    });

    it("should throw NotFoundException if not found", async () => {
      workOrderRepo.findOne.mockResolvedValue(null);
      await expect(service.findById("INVALID")).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should create new work order with DRAFT status", async () => {
      const dto = { projectId: "PRJ-001", clientId: "CLT-001" };
      workOrderRepo.create.mockReturnValue({ ...dto, status: "WO_DRAFT" } as WorkOrder);
      workOrderRepo.save.mockResolvedValue({ ...dto, status: "WO_DRAFT" } as WorkOrder);

      const result = await service.create(dto as any, "USR-001");
      expect(result.status).toBe("WO_DRAFT");
    });
  });

  describe("schedule", () => {
    it("should schedule a draft work order", async () => {
      const draftWo = { ...mockWorkOrder, status: "WO_DRAFT" };
      workOrderRepo.findOne.mockResolvedValue(draftWo as WorkOrder);
      workOrderRepo.save.mockResolvedValue({
        ...draftWo,
        status: "WO_SCHEDULED",
        scheduledDate: new Date("2026-03-01"),
      } as WorkOrder);

      const result = await service.schedule("WO-001", new Date("2026-03-01"));
      expect(result.status).toBe("WO_SCHEDULED");
    });

    it("should throw if work order is not in DRAFT status", async () => {
      workOrderRepo.findOne.mockResolvedValue({
        ...mockWorkOrder,
        status: "WO_COMPLETED",
      } as WorkOrder);
      await expect(service.schedule("WO-001", new Date())).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("dispatch", () => {
    it("should dispatch a scheduled work order", async () => {
      const scheduledWo = { ...mockWorkOrder, status: "WO_SCHEDULED" };
      workOrderRepo.findOne.mockResolvedValue(scheduledWo as WorkOrder);
      workOrderRepo.save.mockResolvedValue({
        ...scheduledWo,
        status: "WO_DISPATCHED",
      } as WorkOrder);

      const result = await service.dispatch("WO-001");
      expect(result.status).toBe("WO_DISPATCHED");
    });
  });

  describe("startWork", () => {
    it("should start work on a dispatched order", async () => {
      const dispatchedWo = { ...mockWorkOrder, status: "WO_DISPATCHED" };
      workOrderRepo.findOne.mockResolvedValue(dispatchedWo as WorkOrder);
      workOrderRepo.save.mockResolvedValue({
        ...dispatchedWo,
        status: "WO_IN_PROGRESS",
      } as WorkOrder);

      const result = await service.startWork("WO-001");
      expect(result.status).toBe("WO_IN_PROGRESS");
    });
  });

  describe("complete", () => {
    it("should complete an in-progress work order", async () => {
      const inProgressWo = { ...mockWorkOrder, status: "WO_IN_PROGRESS" };
      workOrderRepo.findOne.mockResolvedValue(inProgressWo as WorkOrder);

      const result = await service.complete("WO-001");
      expect(result.status).toBe("WO_COMPLETED");
      expect(result.completedAt).toBeDefined();
    });

    it("should throw if work order is not in progress", async () => {
      workOrderRepo.findOne.mockResolvedValue({
        ...mockWorkOrder,
        status: "WO_DRAFT",
      } as WorkOrder);
      await expect(service.complete("WO-001")).rejects.toThrow(BadRequestException);
    });
  });

  describe("cancel", () => {
    it("should cancel a non-completed work order", async () => {
      const draftWo = { ...mockWorkOrder, status: "WO_DRAFT" };
      workOrderRepo.findOne.mockResolvedValue(draftWo as WorkOrder);
      workOrderRepo.save.mockResolvedValue({
        ...draftWo,
        status: "WO_CANCELLED",
      } as WorkOrder);

      const result = await service.cancel("WO-001", "Customer request");
      expect(result.status).toBe("WO_CANCELLED");
    });

    it("should throw if work order is already completed", async () => {
      workOrderRepo.findOne.mockResolvedValue({
        ...mockWorkOrder,
        status: "WO_COMPLETED",
      } as WorkOrder);
      await expect(service.cancel("WO-001")).rejects.toThrow(BadRequestException);
    });
  });

  describe("generateWoNumber", () => {
    it("should generate sequential work order number", async () => {
      mockQueryBuilder.getOne.mockResolvedValue({
        woNumber: "WO-202602-0005",
      });
      const result = await service.generateWoNumber();
      expect(result).toMatch(/^WO-\d{6}-0006$/);
    });

    it("should start from 0001 if no existing orders", async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);
      const result = await service.generateWoNumber();
      expect(result).toMatch(/^WO-\d{6}-0001$/);
    });
  });
});
