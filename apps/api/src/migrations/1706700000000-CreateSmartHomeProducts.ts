import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSmartHomeProducts1706700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table already exists to avoid errors
    const tableExists = await queryRunner.hasTable("smart_home_products");
    if (tableExists) {
      console.log(
        "smart_home_products table already exists, skipping creation",
      );
      return;
    }

    await queryRunner.query(`
            CREATE TABLE "smart_home_products" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "productId" character varying NOT NULL,
                "name" character varying NOT NULL,
                "nameEn" character varying,
                "category" character varying NOT NULL,
                "subcategory" character varying,
                "model" character varying,
                "description" text,
                "imageUrl" character varying,
                "detailUrl" character varying,
                "protocols" text,
                "specs" jsonb,
                "priceMin" numeric(10,2),
                "priceMax" numeric(10,2),
                "currency" character varying DEFAULT 'TWD',
                "isActive" boolean DEFAULT true,
                "source" character varying DEFAULT 'aqara',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "lastSyncedAt" TIMESTAMP
            )
        `);

    // Create indexes
    await queryRunner.query(`
            CREATE INDEX "IDX_smart_home_products_category_subcategory" 
            ON "smart_home_products" ("category", "subcategory")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_smart_home_products_productId" 
            ON "smart_home_products" ("productId")
        `);

    await queryRunner.query(`
            CREATE INDEX "IDX_smart_home_products_isActive" 
            ON "smart_home_products" ("isActive")
        `);

    console.log("smart_home_products table created successfully");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "smart_home_products"`);
  }
}
