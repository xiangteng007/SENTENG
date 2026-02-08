import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { AgingAnalysisService } from "./aging-analysis.service";
import { Invoice } from "../invoices/invoice.entity";

describe("AgingAnalysisService", () => {
  let service: AgingAnalysisService;
  let mockRepo: Record<string, jest.Mock>;

  // Helper: create a mock invoice N days old
  const makeInvoice = (
    id: string,
    daysAgo: number,
    totalAmount: number,
    paidAmount = 0,
    overrides: Partial<Invoice> = {},
  ): Partial<Invoice> => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return {
      id,
      invoiceNumber: `INV-${id}`,
      sellerName: overrides.sellerName || "客戶A",
      invoiceDate: date,
      totalAmount,
      paidAmount,
      project: { name: "專案A" } as any,
      ...overrides,
    };
  };

  const mockQueryBuilder = (invoices: Partial<Invoice>[]) => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(invoices),
  });

  beforeEach(async () => {
    mockRepo = {
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgingAnalysisService,
        { provide: getRepositoryToken(Invoice), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<AgingAnalysisService>(AgingAnalysisService);
  });

  afterEach(() => jest.clearAllMocks());

  // ──────── generateReport ────────

  describe("generateReport", () => {
    it("should return empty report when no invoices", async () => {
      mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder([]));

      const report = await service.generateReport();

      expect(report.totalOutstanding).toBe(0);
      expect(report.totalOverdue).toBe(0);
      expect(report.overduePercentage).toBe(0);
      expect(report.buckets).toHaveLength(5);
      report.buckets.forEach((b) => {
        expect(b.count).toBe(0);
        expect(b.totalAmount).toBe(0);
      });
    });

    it("should classify invoices into correct aging buckets", async () => {
      const invoices = [
        makeInvoice("1", 10, 10000), // 未到期 (10 days)
        makeInvoice("2", 45, 20000), // 1-30天 (45 days)
        makeInvoice("3", 75, 15000), // 31-60天 (75 days)
        makeInvoice("4", 100, 30000), // 61-90天 (100 days)
        makeInvoice("5", 200, 50000), // 90天以上 (200 days)
      ];
      mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder(invoices));

      const report = await service.generateReport();

      expect(report.buckets[0].count).toBe(1); // 未到期
      expect(report.buckets[0].totalAmount).toBe(10000);
      expect(report.buckets[1].count).toBe(1); // 1-30天
      expect(report.buckets[2].count).toBe(1); // 31-60天
      expect(report.buckets[3].count).toBe(1); // 61-90天
      expect(report.buckets[4].count).toBe(1); // 90天以上
      expect(report.totalOutstanding).toBe(125000);
    });

    it("should exclude fully paid invoices (balanceDue <= 0)", async () => {
      const invoices = [
        makeInvoice("1", 10, 10000, 10000), // fully paid
        makeInvoice("2", 45, 20000, 5000), // partially paid
      ];
      mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder(invoices));

      const report = await service.generateReport();

      // Only the partially paid invoice should appear
      expect(report.totalOutstanding).toBe(15000);
    });

    it("should calculate overdue correctly (>30 days)", async () => {
      const invoices = [
        makeInvoice("1", 10, 10000), // not overdue
        makeInvoice("2", 50, 20000), // overdue
        makeInvoice("3", 100, 30000), // overdue
      ];
      mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder(invoices));

      const report = await service.generateReport();

      expect(report.totalOverdue).toBe(50000);
      expect(report.overduePercentage).toBeCloseTo(
        (50000 / 60000) * 100,
        0,
      );
    });

    it("should compute risk assessment from bucket amounts", async () => {
      const invoices = [
        makeInvoice("1", 10, 10000), // bucket 0 → lowRisk
        makeInvoice("2", 75, 20000), // bucket 2 → mediumRisk
        makeInvoice("3", 200, 50000), // bucket 4 → criticalRisk
      ];
      mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder(invoices));

      const report = await service.generateReport();

      expect(report.riskAssessment.lowRisk).toBe(10000);
      expect(report.riskAssessment.mediumRisk).toBe(20000);
      expect(report.riskAssessment.highRisk).toBe(0);
      expect(report.riskAssessment.criticalRisk).toBe(50000);
    });

    it("should filter by projectId", async () => {
      const qb = mockQueryBuilder([]);
      mockRepo.createQueryBuilder.mockReturnValue(qb);

      await service.generateReport({ projectId: "proj-1" });

      expect(qb.andWhere).toHaveBeenCalledWith(
        "invoice.projectId = :projectId",
        { projectId: "proj-1" },
      );
    });

    it("should filter by partnerId", async () => {
      const qb = mockQueryBuilder([]);
      mockRepo.createQueryBuilder.mockReturnValue(qb);

      await service.generateReport({ partnerId: "partner-1" });

      expect(qb.andWhere).toHaveBeenCalledWith(
        "invoice.partnerId = :partnerId",
        { partnerId: "partner-1" },
      );
    });
  });

  // ──────── getInvoicesByAgingBucket ────────

  describe("getInvoicesByAgingBucket", () => {
    it("should return invoices for a specific bucket", async () => {
      const invoices = [
        makeInvoice("1", 75, 20000), // 31-60天
      ];
      mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder(invoices));

      const result = await service.getInvoicesByAgingBucket("31-60天");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("should return empty array for non-matching bucket", async () => {
      mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder([]));

      const result = await service.getInvoicesByAgingBucket("不存在的區間");

      expect(result).toEqual([]);
    });
  });

  // ──────── getOverdueSummary ────────

  describe("getOverdueSummary", () => {
    it("should return zeros when no overdue invoices", async () => {
      const invoices = [makeInvoice("1", 10, 10000)]; // not overdue
      mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder(invoices));

      const summary = await service.getOverdueSummary();

      expect(summary.totalOverdue).toBe(0);
      expect(summary.overdueCount).toBe(0);
      expect(summary.averageOverdueDays).toBe(0);
      expect(summary.oldestOverdueDays).toBe(0);
      expect(summary.topOverdueCustomers).toEqual([]);
    });

    it("should aggregate overdue invoices by customer", async () => {
      const invoices = [
        makeInvoice("1", 50, 10000, 0, { sellerName: "客戶A" }),
        makeInvoice("2", 80, 20000, 0, { sellerName: "客戶A" }),
        makeInvoice("3", 60, 15000, 0, { sellerName: "客戶B" }),
      ];
      mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder(invoices));

      const summary = await service.getOverdueSummary();

      expect(summary.overdueCount).toBe(3);
      expect(summary.topOverdueCustomers).toHaveLength(2);
      // 客戶A should be first (30000 > 15000)
      expect(summary.topOverdueCustomers[0].name).toBe("客戶A");
      expect(summary.topOverdueCustomers[0].count).toBe(2);
    });

    it("should calculate average and oldest overdue days", async () => {
      const invoices = [
        makeInvoice("1", 50, 10000),
        makeInvoice("2", 100, 20000),
      ];
      mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder(invoices));

      const summary = await service.getOverdueSummary();

      expect(summary.averageOverdueDays).toBeGreaterThan(0);
      expect(summary.oldestOverdueDays).toBeGreaterThanOrEqual(99); // ~100 days
    });
  });
});
