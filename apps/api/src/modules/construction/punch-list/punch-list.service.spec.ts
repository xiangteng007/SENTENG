import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { PunchListService } from "./punch-list.service";
import { PunchListItem } from "./entities/punch-list-item.entity";

// Helpers
const mockItem = (overrides = {}): Partial<PunchListItem> => ({
  id: "pl-1",
  projectId: "proj-1",
  itemNumber: "PL-PROJ-0001",
  description: "牆面裂縫",
  location: "B1F-A區",
  category: "結構",
  severity: "HIGH",
  status: "OPEN",
  createdBy: "user-1",
  resolutionNotes: "",
  ...overrides,
});

describe("PunchListService", () => {
  let service: PunchListService;
  let repo: Record<string, jest.Mock>;

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: "pl-new", ...entity })),
      remove: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 2 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PunchListService,
        { provide: getRepositoryToken(PunchListItem), useValue: repo },
      ],
    }).compile();

    service = module.get(PunchListService);
  });

  // ============================
  // CREATE
  // ============================

  describe("create", () => {
    it("should create a punch list item with auto-generated number", async () => {
      repo.count.mockResolvedValue(3);
      await service.create(
        { projectId: "proj-1", description: "牆面裂縫" },
        "user-1",
      );
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "OPEN",
          severity: "MEDIUM", // default
          itemNumber: expect.stringMatching(/^PL-PROJ-0004$/),
        }),
      );
    });

    it("should use provided severity", async () => {
      await service.create(
        { projectId: "proj-1", description: "嚴重裂縫", severity: "CRITICAL" },
        "user-1",
      );
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ severity: "CRITICAL" }),
      );
    });
  });

  // ============================
  // FIND
  // ============================

  describe("findOne", () => {
    it("should return item if found", async () => {
      const item = mockItem();
      repo.findOne.mockResolvedValue(item);
      expect(await service.findOne("pl-1")).toEqual(item);
    });

    it("should throw NotFoundException for missing item", async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne("bad-id")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findByProject", () => {
    it("should filter by status and severity", async () => {
      repo.find.mockResolvedValue([]);
      await service.findByProject("proj-1", {
        status: "OPEN",
        severity: "HIGH",
      });
      expect(repo.find).toHaveBeenCalledWith({
        where: { projectId: "proj-1", status: "OPEN", severity: "HIGH" },
        order: { createdAt: "DESC" },
      });
    });
  });

  // ============================
  // STATUS WORKFLOW
  // ============================

  describe("startResolution", () => {
    it("should transition OPEN → IN_PROGRESS", async () => {
      repo.findOne.mockResolvedValue(mockItem({ status: "OPEN" }));
      await service.startResolution("pl-1", "user-1");
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: "IN_PROGRESS" }),
      );
    });

    it("should reject non-OPEN items", async () => {
      repo.findOne.mockResolvedValue(mockItem({ status: "RESOLVED" }));
      await expect(service.startResolution("pl-1", "user-1")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("resolve", () => {
    it("should transition IN_PROGRESS → RESOLVED", async () => {
      repo.findOne.mockResolvedValue(mockItem({ status: "IN_PROGRESS" }));
      await service.resolve(
        "pl-1",
        { resolutionNotes: "已修補" },
        "user-2",
      );
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "RESOLVED",
          resolvedBy: "user-2",
          resolutionNotes: "已修補",
        }),
      );
    });

    it("should also allow OPEN → RESOLVED", async () => {
      repo.findOne.mockResolvedValue(mockItem({ status: "OPEN" }));
      const result = await service.resolve(
        "pl-1",
        { resolutionNotes: "直接修復" },
        "user-1",
      );
      expect(result.status).toBe("RESOLVED");
    });

    it("should reject VERIFIED items", async () => {
      repo.findOne.mockResolvedValue(mockItem({ status: "VERIFIED" }));
      await expect(
        service.resolve("pl-1", { resolutionNotes: "test" }, "user-1"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("verify", () => {
    it("should pass verification: RESOLVED → VERIFIED", async () => {
      repo.findOne.mockResolvedValue(mockItem({ status: "RESOLVED" }));
      await service.verify("pl-1", { passed: true }, "user-3");
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "VERIFIED",
          verifiedBy: "user-3",
        }),
      );
    });

    it("should fail verification: RESOLVED → IN_PROGRESS", async () => {
      repo.findOne.mockResolvedValue(
        mockItem({ status: "RESOLVED", resolutionNotes: "已修補" }),
      );
      await service.verify(
        "pl-1",
        { passed: false, notes: "修補不合格" },
        "user-3",
      );
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: "IN_PROGRESS" }),
      );
    });

    it("should reject non-RESOLVED items", async () => {
      repo.findOne.mockResolvedValue(mockItem({ status: "OPEN" }));
      await expect(
        service.verify("pl-1", { passed: true }, "user-1"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("waive", () => {
    it("should waive an OPEN item", async () => {
      repo.findOne.mockResolvedValue(mockItem({ status: "OPEN" }));
      await service.waive("pl-1", "業主同意免責", "user-owner");
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "WAIVED",
          resolutionNotes: "[免責] 業主同意免責",
        }),
      );
    });

    it("should reject already-closed items", async () => {
      repo.findOne.mockResolvedValue(mockItem({ status: "VERIFIED" }));
      await expect(
        service.waive("pl-1", "reason", "user-1"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================
  // STATS
  // ============================

  describe("getStats", () => {
    it("should calculate statistics correctly", async () => {
      repo.find.mockResolvedValue([
        mockItem({ status: "OPEN", severity: "HIGH" }),
        mockItem({ status: "IN_PROGRESS", severity: "MEDIUM" }),
        mockItem({ status: "RESOLVED", severity: "LOW" }),
        mockItem({ status: "VERIFIED", severity: "CRITICAL" }),
        mockItem({
          status: "OPEN",
          severity: "HIGH",
          dueDate: new Date("2020-01-01"), // overdue
        }),
      ]);

      const stats = await service.getStats("proj-1");
      expect(stats.total).toBe(5);
      expect(stats.open).toBe(2);
      expect(stats.inProgress).toBe(1);
      expect(stats.resolved).toBe(1);
      expect(stats.verified).toBe(1);
      expect(stats.bySeverity.HIGH).toBe(2);
      expect(stats.overdueCount).toBe(1); // only non-closed overdue
    });
  });

  // ============================
  // BATCH
  // ============================

  describe("batchUpdateStatus", () => {
    it("should update multiple items and return count", async () => {
      const result = await service.batchUpdateStatus(
        ["pl-1", "pl-2"],
        "RESOLVED",
        "user-1",
      );
      expect(result.updated).toBe(2);
      expect(repo.update).toHaveBeenCalled();
    });
  });
});
