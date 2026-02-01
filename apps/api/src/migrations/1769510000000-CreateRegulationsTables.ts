import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from "typeorm";

export class CreateRegulationsTables1769510000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. regulation_sources 法規來源表
    await queryRunner.createTable(
      new Table({
        name: "regulation_sources",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "gen_random_uuid()",
          },
          {
            name: "pcode",
            type: "varchar",
            length: "20",
            isUnique: true,
          },
          {
            name: "name",
            type: "varchar",
            length: "255",
          },
          {
            name: "category",
            type: "varchar",
            length: "50",
          },
          {
            name: "last_updated",
            type: "date",
            isNullable: true,
          },
          {
            name: "last_synced_at",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "article_count",
            type: "integer",
            default: 0,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true,
    );

    // 2. regulation_articles 法規條文表
    await queryRunner.createTable(
      new Table({
        name: "regulation_articles",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "gen_random_uuid()",
          },
          {
            name: "source_id",
            type: "uuid",
          },
          {
            name: "article_no",
            type: "varchar",
            length: "20",
          },
          {
            name: "chapter",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "title",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "content",
            type: "text",
          },
          {
            name: "keywords",
            type: "text[]",
            isNullable: true,
          },
          {
            name: "source_url",
            type: "varchar",
            length: "500",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true,
    );

    // 外鍵: source_id -> regulation_sources
    await queryRunner.createForeignKey(
      "regulation_articles",
      new TableForeignKey({
        columnNames: ["source_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "regulation_sources",
        onDelete: "CASCADE",
      }),
    );

    // 唯一索引: source_id + article_no
    await queryRunner.createIndex(
      "regulation_articles",
      new TableIndex({
        name: "IDX_regulation_articles_source_article",
        columnNames: ["source_id", "article_no"],
        isUnique: true,
      }),
    );

    // 3. material_regulation_mappings 材料-法規對應表
    await queryRunner.createTable(
      new Table({
        name: "material_regulation_mappings",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
            generationStrategy: "uuid",
            default: "gen_random_uuid()",
          },
          {
            name: "material_category",
            type: "varchar",
            length: "50",
          },
          {
            name: "material_keyword",
            type: "varchar",
            length: "100",
          },
          {
            name: "article_id",
            type: "uuid",
            isNullable: true,
          },
          {
            name: "relevance_score",
            type: "decimal",
            precision: 3,
            scale: 2,
            default: 1.0,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
          },
        ],
      }),
      true,
    );

    // 外鍵: article_id -> regulation_articles
    await queryRunner.createForeignKey(
      "material_regulation_mappings",
      new TableForeignKey({
        columnNames: ["article_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "regulation_articles",
        onDelete: "SET NULL",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("material_regulation_mappings", true);
    await queryRunner.dropTable("regulation_articles", true);
    await queryRunner.dropTable("regulation_sources", true);
  }
}
