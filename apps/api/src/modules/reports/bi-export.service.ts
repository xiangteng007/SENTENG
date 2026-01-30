/**
 * BI Export Service (商業智慧報表匯出服務)
 *
 * 提供資料匯出功能，支援 Looker Studio 和 Power BI 整合
 * 輸出 JSON/CSV 格式供 BI 工具消費
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Response } from 'express';

export interface DateRangeDto {
  startDate: string;
  endDate: string;
}

export interface DashboardMetrics {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growthRate: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    delayed: number;
  };
  invoices: {
    issued: number;
    pending: number;
    overdue: number;
    totalAmount: number;
  };
  clients: {
    total: number;
    active: number;
    newThisMonth: number;
  };
}

@Injectable()
export class BiExportService {
  private readonly logger = new Logger(BiExportService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * 取得 Dashboard 總覽指標
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Revenue metrics
    const [revenueData] = await this.dataSource.query(
      `
      SELECT
        COALESCE(SUM(amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN transaction_date >= $1 THEN amount ELSE 0 END), 0) as this_month,
        COALESCE(SUM(CASE WHEN transaction_date >= $2 AND transaction_date <= $3 THEN amount ELSE 0 END), 0) as last_month
      FROM transactions
      WHERE transaction_type = 'INCOME'
    `,
      [thisMonthStart, lastMonthStart, lastMonthEnd]
    );

    // Project metrics
    const [projectData] = await this.dataSource.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status IN ('進行中', 'active', 'in_progress') THEN 1 END) as active,
        COUNT(CASE WHEN status IN ('已完成', 'completed') THEN 1 END) as completed,
        COUNT(CASE WHEN status IN ('延遲', 'delayed') THEN 1 END) as delayed
      FROM projects
    `);

    // Invoice metrics
    const [invoiceData] = await this.dataSource.query(`
      SELECT
        COUNT(CASE WHEN status = 'ISSUED' THEN 1 END) as issued,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'OVERDUE' OR (status != 'PAID' AND due_date < NOW()) THEN 1 END) as overdue,
        COALESCE(SUM(total_amount), 0) as total_amount
      FROM invoices
    `);

    // Client metrics
    const [clientData] = await this.dataSource.query(
      `
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active,
        COUNT(CASE WHEN created_at >= $1 THEN 1 END) as new_this_month
      FROM clients
    `,
      [thisMonthStart]
    );

    const thisMonthRevenue = parseFloat(revenueData?.this_month || 0);
    const lastMonthRevenue = parseFloat(revenueData?.last_month || 0);
    const growthRate =
      lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    return {
      revenue: {
        total: parseFloat(revenueData?.total_revenue || 0),
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        growthRate: Math.round(growthRate * 10) / 10,
      },
      projects: {
        total: parseInt(projectData?.total || 0),
        active: parseInt(projectData?.active || 0),
        completed: parseInt(projectData?.completed || 0),
        delayed: parseInt(projectData?.delayed || 0),
      },
      invoices: {
        issued: parseInt(invoiceData?.issued || 0),
        pending: parseInt(invoiceData?.pending || 0),
        overdue: parseInt(invoiceData?.overdue || 0),
        totalAmount: parseFloat(invoiceData?.total_amount || 0),
      },
      clients: {
        total: parseInt(clientData?.total || 0),
        active: parseInt(clientData?.active || 0),
        newThisMonth: parseInt(clientData?.new_this_month || 0),
      },
    };
  }

  /**
   * 匯出專案報表
   */
  async exportProjectsReport(dateRange?: DateRangeDto): Promise<any[]> {
    let query = `
      SELECT
        p.id,
        p.project_number,
        p.name,
        p.status,
        p.contract_amount,
        p.start_date,
        p.end_date,
        c.name as client_name,
        COALESCE(SUM(ce.amount), 0) as total_cost,
        p.contract_amount - COALESCE(SUM(ce.amount), 0) as profit
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN cost_entries ce ON ce.project_id = p.id
    `;

    const params: any[] = [];
    if (dateRange) {
      query += ` WHERE p.created_at BETWEEN $1 AND $2`;
      params.push(dateRange.startDate, dateRange.endDate);
    }

    query += `
      GROUP BY p.id, c.name
      ORDER BY p.created_at DESC
    `;

    return this.dataSource.query(query, params);
  }

  /**
   * 匯出財務報表
   */
  async exportFinanceReport(dateRange: DateRangeDto): Promise<any[]> {
    return this.dataSource.query(
      `
      SELECT
        t.id,
        t.transaction_date,
        t.transaction_type,
        t.amount,
        t.description,
        a.name as account_name,
        p.name as project_name
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.transaction_date BETWEEN $1 AND $2
      ORDER BY t.transaction_date DESC
    `,
      [dateRange.startDate, dateRange.endDate]
    );
  }

  /**
   * 月度營收趨勢 (過去12個月)
   */
  async getRevenueByMonth(): Promise<any[]> {
    return this.dataSource.query(`
      SELECT
        TO_CHAR(transaction_date, 'YYYY-MM') as month,
        SUM(CASE WHEN transaction_type = 'INCOME' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END) as expense,
        SUM(CASE WHEN transaction_type = 'INCOME' THEN amount ELSE -amount END) as net
      FROM transactions
      WHERE transaction_date >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(transaction_date, 'YYYY-MM')
      ORDER BY month DESC
    `);
  }

  /**
   * 專案狀態分布
   */
  async getProjectStatusDistribution(): Promise<any[]> {
    return this.dataSource.query(`
      SELECT
        status,
        COUNT(*) as count,
        COALESCE(SUM(contract_amount), 0) as total_amount
      FROM projects
      GROUP BY status
      ORDER BY count DESC
    `);
  }

  /**
   * 客戶營收排名 (Top 10)
   */
  async getTopClientsByRevenue(): Promise<any[]> {
    return this.dataSource.query(`
      SELECT
        c.id,
        c.name,
        COUNT(DISTINCT p.id) as project_count,
        COALESCE(SUM(p.contract_amount), 0) as total_contract_value
      FROM clients c
      LEFT JOIN projects p ON p.client_id = c.id
      GROUP BY c.id, c.name
      ORDER BY total_contract_value DESC
      LIMIT 10
    `);
  }

  /**
   * 匯出為 CSV 格式
   */
  exportToCsv(data: any[], res: Response, filename: string): void {
    if (!data || data.length === 0) {
      res.status(200).send('');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers
          .map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            // Escape quotes and wrap in quotes if contains comma
            if (
              stringValue.includes(',') ||
              stringValue.includes('"') ||
              stringValue.includes('\n')
            ) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(',')
      ),
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\ufeff' + csvRows.join('\n')); // BOM for Excel UTF-8 support
  }
}
