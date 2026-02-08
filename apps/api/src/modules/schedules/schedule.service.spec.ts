import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { ScheduleService } from "./schedule.service";
import {
  ScheduleTask,
  ScheduleDependency,
  ScheduleMilestone,
} from "./schedule-task.entity";

// Helpers
const mockTask = (overrides = {}): Partial<ScheduleTask> => ({
  id: "task-1",
  projectId: "proj-1",
  name: "基礎開挖",
  startDate: new Date("2026-03-01"),
  endDate: new Date("2026-03-15"),
  progress: 0,
  type: "task",
  status: "pending",
  parentId: undefined,
  color: "#3B82F6",
  sortOrder: 0,
  ...overrides,
});

const mockMilestone = (overrides = {}): Partial<ScheduleMilestone> => ({
  id: "ms-1",
  projectId: "proj-1",
  name: "結構完成",
  targetDate: new Date("2026-06-01"),
  status: "pending",
  isContractual: true,
  ...overrides,
});

const mockDependency = (overrides = {}): Partial<ScheduleDependency> => ({
  id: "dep-1",
  taskId: "task-2",
  dependsOnTaskId: "task-1",
  type: "finish_to_start",
  lagDays: 0,
  ...overrides,
});

describe("ScheduleService", () => {
  let service: ScheduleService;
  let taskRepo: Record<string, jest.Mock>;
  let depRepo: Record<string, jest.Mock>;
  let msRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    taskRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: "task-new", ...entity })),
      remove: jest.fn(),
    };
    depRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: "dep-new", ...entity })),
      remove: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }),
    };
    msRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: "ms-new", ...entity })),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        { provide: getRepositoryToken(ScheduleTask), useValue: taskRepo },
        { provide: getRepositoryToken(ScheduleDependency), useValue: depRepo },
        { provide: getRepositoryToken(ScheduleMilestone), useValue: msRepo },
      ],
    }).compile();

    service = module.get(ScheduleService);
  });

  // ============================
  // TASK CRUD
  // ============================

  describe("findTasks", () => {
    it("should query by projectId", async () => {
      taskRepo.find.mockResolvedValue([mockTask()]);
      const result = await service.findTasks({ projectId: "proj-1" });
      expect(result).toHaveLength(1);
      expect(taskRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: "proj-1" }),
        }),
      );
    });

    it("should filter by type and status", async () => {
      taskRepo.find.mockResolvedValue([]);
      await service.findTasks({
        projectId: "proj-1",
        type: "milestone",
        status: "completed",
      });
      expect(taskRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: "milestone",
            status: "completed",
          }),
        }),
      );
    });
  });

  describe("findTaskById", () => {
    it("should return the task if found", async () => {
      const task = mockTask();
      taskRepo.findOne.mockResolvedValue(task);
      const result = await service.findTaskById("task-1");
      expect(result).toEqual(task);
    });

    it("should throw NotFoundException for missing task", async () => {
      taskRepo.findOne.mockResolvedValue(null);
      await expect(service.findTaskById("bad-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("createTask", () => {
    it("should create a task with pending status", async () => {
      const dto = {
        projectId: "proj-1",
        name: "鋼筋綁紮",
        startDate: "2026-03-10",
        endDate: "2026-03-20",
      };
      await service.createTask(dto as any);
      expect(taskRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: "pending" }),
      );
      expect(taskRepo.save).toHaveBeenCalled();
    });
  });

  describe("updateTask", () => {
    it("should update and return the task", async () => {
      const existing = mockTask();
      taskRepo.findOne.mockResolvedValue(existing);
      taskRepo.save.mockResolvedValue({ ...existing, name: "已更新" });

      const result = await service.updateTask("task-1", { name: "已更新" } as any);
      expect(result.name).toBe("已更新");
    });

    it("should parse date strings", async () => {
      taskRepo.findOne.mockResolvedValue(mockTask());
      await service.updateTask("task-1", {
        startDate: "2026-04-01",
        endDate: "2026-04-15",
      } as any);
      const savedEntity = taskRepo.save.mock.calls[0][0];
      expect(savedEntity.startDate).toBeInstanceOf(Date);
      expect(savedEntity.endDate).toBeInstanceOf(Date);
    });
  });

  describe("deleteTask", () => {
    it("should delete task and its dependencies", async () => {
      taskRepo.findOne.mockResolvedValue(mockTask());
      await service.deleteTask("task-1");
      expect(depRepo.delete).toHaveBeenCalledWith({ taskId: "task-1" });
      expect(depRepo.delete).toHaveBeenCalledWith({ dependsOnTaskId: "task-1" });
      expect(taskRepo.remove).toHaveBeenCalled();
    });
  });

  describe("updateTaskProgress", () => {
    it("should clamp progress between 0-100", async () => {
      taskRepo.findOne.mockResolvedValue(mockTask({ progress: 50 }));
      await service.updateTaskProgress("task-1", 150);
      expect(taskRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ progress: 100 }),
      );
    });

    it("should set status to completed when progress is 100", async () => {
      taskRepo.findOne.mockResolvedValue(mockTask());
      await service.updateTaskProgress("task-1", 100);
      expect(taskRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: "completed", progress: 100 }),
      );
    });

    it("should set status to in_progress when progress > 0", async () => {
      taskRepo.findOne.mockResolvedValue(mockTask());
      await service.updateTaskProgress("task-1", 50);
      expect(taskRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: "in_progress", progress: 50 }),
      );
    });
  });

  // ============================
  // DEPENDENCIES
  // ============================

  describe("createDependency", () => {
    it("should create dependency between two tasks", async () => {
      taskRepo.findOne
        .mockResolvedValueOnce(mockTask({ id: "task-1" }))
        .mockResolvedValueOnce(mockTask({ id: "task-2" }));

      await service.createDependency({
        taskId: "task-1",
        dependsOnTaskId: "task-2",
      } as any);
      expect(depRepo.save).toHaveBeenCalled();
    });

    it("should reject self-dependency", async () => {
      taskRepo.findOne.mockResolvedValue(mockTask());
      await expect(
        service.createDependency({
          taskId: "task-1",
          dependsOnTaskId: "task-1",
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("deleteDependency", () => {
    it("should throw NotFoundException for missing dependency", async () => {
      depRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteDependency("bad-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================
  // MILESTONES
  // ============================

  describe("createMilestone", () => {
    it("should create milestone with pending status", async () => {
      const dto = {
        projectId: "proj-1",
        name: "結構完成",
        targetDate: "2026-06-01",
      };
      await service.createMilestone(dto as any);
      expect(msRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: "pending" }),
      );
    });
  });

  describe("completeMilestone", () => {
    it("should set status to completed with actual date", async () => {
      msRepo.findOne.mockResolvedValue(mockMilestone());
      await service.completeMilestone("ms-1");
      expect(msRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "completed",
          actualDate: expect.any(Date),
        }),
      );
    });
  });

  describe("deleteMilestone", () => {
    it("should throw NotFoundException for missing milestone", async () => {
      msRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteMilestone("bad-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================
  // GANTT CHART
  // ============================

  describe("getGanttData", () => {
    it("should return structured gantt data with summary", async () => {
      const tasks = [
        mockTask({ id: "t1", progress: 100, status: "completed" }),
        mockTask({ id: "t2", progress: 50, status: "in_progress", parentId: undefined }),
      ];
      taskRepo.find.mockResolvedValue(tasks);
      msRepo.find.mockResolvedValue([mockMilestone()]);

      const result = await service.getGanttData("proj-1");
      expect(result.tasks).toHaveLength(2);
      expect(result.milestones).toHaveLength(1);
      expect(result.summary.totalTasks).toBe(2);
      expect(result.summary.completedTasks).toBe(1);
      expect(result.summary.overallProgress).toBe(75); // (100+50)/2
    });

    it("should handle empty project", async () => {
      taskRepo.find.mockResolvedValue([]);
      msRepo.find.mockResolvedValue([]);

      const result = await service.getGanttData("empty-proj");
      expect(result.tasks).toHaveLength(0);
      expect(result.summary.overallProgress).toBe(0);
      expect(result.summary.startDate).toBe("");
    });
  });
});
