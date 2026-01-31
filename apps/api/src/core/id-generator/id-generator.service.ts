import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * IdGeneratorService - 統一 ID 生成服務
 *
 * 取代各模組重複實作的 generateId() 方法
 * 格式: {PREFIX}-{YYYYMM}-{SEQUENCE}
 * 範例: CLT-202601-0001, PRJ-202602-0015
 */
@Injectable()
export class IdGeneratorService {
  // 快取每個 prefix 的當前序號（避免每次都查資料庫）
  private sequenceCache: Map<string, number> = new Map();

  constructor(private readonly dataSource: DataSource) {}

  /**
   * 生成新的業務 ID
   * @param prefix 業務前綴 (如 CLT, PRJ, VND, CTR)
   * @returns 格式化的 ID
   */
  async generate(prefix: string): Promise<string> {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const fullPrefix = `${prefix}-${dateStr}-`;

    const seq = await this.getNextSequence(fullPrefix);
    return `${fullPrefix}${String(seq).padStart(4, '0')}`;
  }

  /**
   * 取得下一個序號
   * 使用資料庫查詢確保唯一性
   */
  private async getNextSequence(fullPrefix: string): Promise<number> {
    // 查詢資料庫中此前綴的最大 ID
    const result = await this.dataSource.query(
      `SELECT id FROM (
        SELECT id FROM customers WHERE id LIKE $1
        UNION ALL SELECT id FROM clients WHERE id LIKE $1
        UNION ALL SELECT id FROM vendors WHERE id LIKE $1
        UNION ALL SELECT id FROM projects WHERE id LIKE $1
        UNION ALL SELECT id FROM contracts WHERE id LIKE $1
        UNION ALL SELECT id FROM quotations WHERE id LIKE $1
        UNION ALL SELECT id FROM invoices WHERE id LIKE $1
      ) AS all_ids ORDER BY id DESC LIMIT 1`,
      [`${fullPrefix}%`],
    );

    if (result.length === 0) {
      return 1;
    }

    const lastId = result[0].id;
    const lastSeq = parseInt(lastId.split('-')[2], 10);
    return lastSeq + 1;
  }

  /**
   * 取得特定表格的下一個序號
   * @param tableName 表格名稱
   * @param prefix 業務前綴
   */
  async generateForTable(tableName: string, prefix: string): Promise<string> {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const fullPrefix = `${prefix}-${dateStr}-`;

    const result = await this.dataSource.query(
      `SELECT id FROM ${tableName} WHERE id LIKE $1 ORDER BY id DESC LIMIT 1`,
      [`${fullPrefix}%`],
    );

    let seq = 1;
    if (result.length > 0) {
      const lastSeq = parseInt(result[0].id.split('-')[2], 10);
      seq = lastSeq + 1;
    }

    return `${fullPrefix}${String(seq).padStart(4, '0')}`;
  }
}
