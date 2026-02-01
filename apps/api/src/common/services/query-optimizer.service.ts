import { Injectable, Logger } from "@nestjs/common";
import { DataSource, EntityMetadata, SelectQueryBuilder } from "typeorm";

/**
 * 查詢優化服務
 *
 * 提供 N+1 查詢檢測與優化建議
 */

export interface QueryAnalysis {
  entity: string;
  query: string;
  executionTime: number;
  rowCount: number;
  potentialNPlus1: boolean;
  suggestions: string[];
}

export interface N1Detection {
  pattern: string;
  occurrences: number;
  affectedEntities: string[];
  solution: string;
}

@Injectable()
export class QueryOptimizerService {
  private readonly logger = new Logger(QueryOptimizerService.name);
  private queryLog: Map<string, { count: number; times: number[] }> = new Map();

  constructor(private readonly dataSource: DataSource) {}

  /**
   * 分析實體關聯並建議優化
   */
  analyzeEntityRelations(entityName: string): {
    entity: string;
    relations: { name: string; type: string; eager: boolean }[];
    suggestions: string[];
  } {
    const metadata = this.dataSource.getMetadata(entityName);
    const suggestions: string[] = [];

    const relations = metadata.relations.map((rel) => {
      const isEager = rel.isEager;

      // 建議優化
      if (isEager && rel.relationType === "one-to-many") {
        suggestions.push(
          `考慮將 ${rel.propertyName} 改為 lazy loading 以避免載入大量資料`,
        );
      }

      return {
        name: rel.propertyName,
        type: rel.relationType,
        eager: isEager,
      };
    });

    if (relations.filter((r) => r.eager).length > 3) {
      suggestions.push("Eager relations 過多，建議使用 QueryBuilder 按需載入");
    }

    return { entity: entityName, relations, suggestions };
  }

  /**
   * 取得所有實體的關聯分析
   */
  analyzeAllEntities(): {
    entity: string;
    relations: number;
    eagerRelations: number;
    hasIssues: boolean;
  }[] {
    return this.dataSource.entityMetadatas.map((metadata) => {
      const eagerCount = metadata.relations.filter((r) => r.isEager).length;
      return {
        entity: metadata.name,
        relations: metadata.relations.length,
        eagerRelations: eagerCount,
        hasIssues: eagerCount > 2,
      };
    });
  }

  /**
   * 建議查詢優化
   */

  suggestOptimization(
    qb: SelectQueryBuilder<any>,
    options: {
      includeRelations?: string[];
      pagination?: { page: number; limit: number };
    },
  ): SelectQueryBuilder<any> {
    // 自動加入必要的 relations
    if (options.includeRelations) {
      options.includeRelations.forEach((relation) => {
        qb.leftJoinAndSelect(`${qb.alias}.${relation}`, relation);
      });
    }

    // 自動加入分頁
    if (options.pagination) {
      const { page, limit } = options.pagination;
      qb.skip((page - 1) * limit).take(limit);
    }

    return qb;
  }

  /**
   * 常見 N+1 查詢模式檢測
   */
  detectN1Patterns(): N1Detection[] {
    const patterns: N1Detection[] = [];

    // 1. 巡覽所有 entities
    this.dataSource.entityMetadatas.forEach((metadata) => {
      // 檢查 one-to-many 沒有設 cascade
      const oneToManyWithoutOptimization = metadata.relations.filter(
        (r) => r.relationType === "one-to-many" && !r.isEager,
      );

      if (oneToManyWithoutOptimization.length > 0) {
        patterns.push({
          pattern: "Lazy OneToMany without QueryBuilder",
          occurrences: oneToManyWithoutOptimization.length,
          affectedEntities: oneToManyWithoutOptimization.map(
            (r) => `${metadata.name}.${r.propertyName}`,
          ),
          solution: "使用 QueryBuilder.leftJoinAndSelect() 一次載入關聯資料",
        });
      }
    });

    return patterns;
  }

  /**
   * 取得索引建議
   */
  getIndexSuggestions(): {
    table: string;
    column: string;
    reason: string;
  }[] {
    const suggestions: {
      table: string;
      column: string;
      reason: string;
    }[] = [];

    this.dataSource.entityMetadatas.forEach((metadata) => {
      // 檢查外鍵是否有索引
      metadata.relations.forEach((rel) => {
        if (rel.foreignKeys.length > 0) {
          rel.foreignKeys.forEach((fk) => {
            const hasIndex = metadata.indices.some((idx) =>
              idx.columns.some((col) =>
                fk.columnNames.includes(col.propertyName),
              ),
            );

            if (!hasIndex) {
              suggestions.push({
                table: metadata.tableName,
                column: fk.columnNames.join(", "),
                reason: `外鍵欄位 ${fk.columnNames.join(", ")} 建議建立索引以加速 JOIN`,
              });
            }
          });
        }
      });

      // 檢查常用查詢欄位
      const commonQueryFields = ["status", "createdAt", "type", "category"];
      metadata.columns.forEach((col) => {
        if (commonQueryFields.includes(col.propertyName)) {
          const hasIndex = metadata.indices.some((idx) =>
            idx.columns.some((c) => c.propertyName === col.propertyName),
          );

          if (!hasIndex) {
            suggestions.push({
              table: metadata.tableName,
              column: col.propertyName,
              reason: `常用查詢欄位 ${col.propertyName} 建議建立索引`,
            });
          }
        }
      });
    });

    return suggestions;
  }

  /**
   * 生成優化報告
   */
  generateReport(): {
    summary: { entities: number; relations: number; issues: number };
    n1Patterns: N1Detection[];
    indexSuggestions: { table: string; column: string; reason: string }[];
    entityAnalysis: {
      entity: string;
      relations: number;
      eagerRelations: number;
      hasIssues: boolean;
    }[];
  } {
    const entityAnalysis = this.analyzeAllEntities();
    const n1Patterns = this.detectN1Patterns();
    const indexSuggestions = this.getIndexSuggestions();

    return {
      summary: {
        entities: entityAnalysis.length,
        relations: entityAnalysis.reduce((sum, e) => sum + e.relations, 0),
        issues:
          entityAnalysis.filter((e) => e.hasIssues).length + n1Patterns.length,
      },
      n1Patterns,
      indexSuggestions: indexSuggestions.slice(0, 20), // 限制數量
      entityAnalysis: entityAnalysis.filter((e) => e.hasIssues),
    };
  }
}
