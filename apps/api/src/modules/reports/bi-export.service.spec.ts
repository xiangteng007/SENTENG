import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { BiExportService } from './bi-export.service';

describe('BiExportService', () => {
  let service: BiExportService;
  let dataSource: DataSource;

  const mockDataSource = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BiExportService, { provide: DataSource, useValue: mockDataSource }],
    }).compile();

    service = module.get<BiExportService>(BiExportService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardMetrics', () => {
    it('should return dashboard metrics', async () => {
      mockDataSource.query
        // Revenue query
        .mockResolvedValueOnce([
          {
            total_revenue: '1000000',
            this_month: '150000',
            last_month: '120000',
          },
        ])
        // Project query
        .mockResolvedValueOnce([
          {
            total: '25',
            active: '10',
            completed: '12',
            delayed: '3',
          },
        ])
        // Invoice query
        .mockResolvedValueOnce([
          {
            issued: '15',
            pending: '5',
            overdue: '2',
            total_amount: '800000',
          },
        ])
        // Client query
        .mockResolvedValueOnce([
          {
            total: '50',
            active: '45',
            new_this_month: '3',
          },
        ]);

      const result = await service.getDashboardMetrics();

      expect(result).toHaveProperty('revenue');
      expect(result).toHaveProperty('projects');
      expect(result).toHaveProperty('invoices');
      expect(result).toHaveProperty('clients');

      expect(result.revenue.total).toBe(1000000);
      expect(result.revenue.growthRate).toBeCloseTo(25, 0);
      expect(result.projects.total).toBe(25);
      expect(result.projects.active).toBe(10);
    });

    it('should handle zero last month revenue', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([
          {
            total_revenue: '50000',
            this_month: '50000',
            last_month: '0',
          },
        ])
        .mockResolvedValueOnce([{ total: '5', active: '5', completed: '0', delayed: '0' }])
        .mockResolvedValueOnce([{ issued: '1', pending: '0', overdue: '0', total_amount: '50000' }])
        .mockResolvedValueOnce([{ total: '10', active: '10', new_this_month: '5' }]);

      const result = await service.getDashboardMetrics();

      expect(result.revenue.growthRate).toBe(0);
    });

    it('should handle null values', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([{}]);

      const result = await service.getDashboardMetrics();

      expect(result.revenue.total).toBe(0);
      expect(result.projects.total).toBe(0);
    });
  });

  describe('getRevenueByMonth', () => {
    it('should return monthly revenue data', async () => {
      mockDataSource.query.mockResolvedValue([
        { month: '2026-01', income: '150000', expense: '80000', net: '70000' },
        { month: '2025-12', income: '120000', expense: '60000', net: '60000' },
      ]);

      const result = await service.getRevenueByMonth();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('month');
      expect(result[0]).toHaveProperty('income');
      expect(result[0]).toHaveProperty('expense');
      expect(result[0]).toHaveProperty('net');
    });
  });

  describe('getProjectStatusDistribution', () => {
    it('should return project status distribution', async () => {
      mockDataSource.query.mockResolvedValue([
        { status: 'in_progress', count: '10', total_amount: '5000000' },
        { status: 'completed', count: '15', total_amount: '8000000' },
        { status: 'planning', count: '5', total_amount: '2000000' },
      ]);

      const result = await service.getProjectStatusDistribution();

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('status');
      expect(result[0]).toHaveProperty('count');
      expect(result[0]).toHaveProperty('total_amount');
    });
  });

  describe('getTopClientsByRevenue', () => {
    it('should return top 10 clients', async () => {
      const mockClients = Array.from({ length: 10 }, (_, i) => ({
        id: `client-${i}`,
        name: `Client ${i}`,
        project_count: String(10 - i),
        total_contract_value: String((10 - i) * 100000),
      }));

      mockDataSource.query.mockResolvedValue(mockClients);

      const result = await service.getTopClientsByRevenue();

      expect(result).toHaveLength(10);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('project_count');
      expect(result[0]).toHaveProperty('total_contract_value');
    });
  });

  describe('exportProjectsReport', () => {
    it('should export projects with optional date range', async () => {
      mockDataSource.query.mockResolvedValue([
        {
          id: 'proj-1',
          project_number: 'P-2026-001',
          name: 'Project A',
          status: 'in_progress',
          contract_amount: '1000000',
          client_name: 'Client A',
          total_cost: '500000',
          profit: '500000',
        },
      ]);

      const result = await service.exportProjectsReport();

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('project_number');
      expect(result[0]).toHaveProperty('profit');
    });

    it('should filter by date range when provided', async () => {
      mockDataSource.query.mockResolvedValue([]);

      await service.exportProjectsReport({
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });

      expect(mockDataSource.query).toHaveBeenCalledWith(expect.stringContaining('WHERE'), [
        '2026-01-01',
        '2026-01-31',
      ]);
    });
  });

  describe('exportToCsv', () => {
    it('should handle empty data', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        setHeader: jest.fn(),
      };

      service.exportToCsv([], mockRes as any, 'test.csv');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalledWith('');
    });

    it('should generate CSV with proper headers', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        setHeader: jest.fn(),
      };

      const data = [
        { name: 'Project A', amount: 100000 },
        { name: 'Project B', amount: 200000 },
      ];

      service.exportToCsv(data, mockRes as any, 'test.csv');

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="test.csv"'
      );
    });

    it('should escape special characters in CSV', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        setHeader: jest.fn(),
      };

      const data = [{ name: 'Project "A"', description: 'Contains, comma' }];

      service.exportToCsv(data, mockRes as any, 'test.csv');

      const csvContent = mockRes.send.mock.calls[0][0];
      expect(csvContent).toContain('""');
    });
  });
});
