import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * M1: CMM Domain Tables
 * - cmm_material_masters: 物料主檔
 * - cmm_building_profiles: 建築參數
 * - cmm_unit_conversions: 單位換算
 */
export class CreateCmmDomain1737849600000 implements MigrationInterface {
  name = "CreateCmmDomain1737849600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create enum types
    await queryRunner.query(`
            CREATE TYPE "material_category_enum" AS ENUM (
                'REBAR', 'CONCRETE', 'FORMWORK', 'MORTAR', 
                'STEEL', 'CEMENT', 'SAND', 'GRAVEL', 'OTHER'
            )
        `);

    await queryRunner.query(`
            CREATE TYPE "material_status_enum" AS ENUM (
                'ACTIVE', 'INACTIVE', 'DEPRECATED'
            )
        `);

    await queryRunner.query(`
            CREATE TYPE "structure_type_enum" AS ENUM (
                'RC', 'SRC', 'SC', 'RB', 'W'
            )
        `);

    await queryRunner.query(`
            CREATE TYPE "building_usage_enum" AS ENUM (
                'RESIDENTIAL', 'OFFICE', 'COMMERCIAL', 
                'INDUSTRIAL', 'PUBLIC', 'MIXED'
            )
        `);

    // 2. Create cmm_material_masters table
    await queryRunner.query(`
            CREATE TABLE "cmm_material_masters" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "code" varchar(50) NOT NULL,
                "name" varchar(100) NOT NULL,
                "english_name" varchar(100),
                "category" "material_category_enum" NOT NULL DEFAULT 'OTHER',
                "sub_category" varchar(50),
                "base_unit" varchar(20) NOT NULL,
                "specification" text,
                "density" decimal(15,6),
                "unit_weight" decimal(15,6),
                "standard_length" decimal(10,2),
                "standard_weight_per_length" decimal(10,4),
                "usage_factor_rc" decimal(10,4),
                "usage_factor_src" decimal(10,4),
                "usage_factor_sc" decimal(10,4),
                "reference_price" decimal(15,2),
                "price_unit" varchar(20),
                "price_updated_at" timestamp,
                "tags" text[],
                "status" "material_status_enum" NOT NULL DEFAULT 'ACTIVE',
                "notes" text,
                "created_at" timestamp NOT NULL DEFAULT now(),
                "created_by" varchar(50),
                "updated_at" timestamp NOT NULL DEFAULT now(),
                "updated_by" varchar(50),
                "deleted_at" timestamp,
                CONSTRAINT "PK_cmm_material_masters" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_cmm_material_masters_code" UNIQUE ("code")
            )
        `);

    // Create indexes for cmm_material_masters
    await queryRunner.query(`
            CREATE INDEX "IDX_cmm_material_masters_category" ON "cmm_material_masters" ("category")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_cmm_material_masters_status" ON "cmm_material_masters" ("status")
        `);

    // 3. Create cmm_building_profiles table
    await queryRunner.query(`
            CREATE TABLE "cmm_building_profiles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "code" varchar(50) NOT NULL,
                "name" varchar(100) NOT NULL,
                "structure_type" "structure_type_enum" NOT NULL DEFAULT 'RC',
                "building_usage" "building_usage_enum" NOT NULL DEFAULT 'OFFICE',
                "min_floors" int NOT NULL DEFAULT 1,
                "max_floors" int,
                "rebar_factor" decimal(10,4) NOT NULL,
                "rebar_unit" varchar(20) NOT NULL DEFAULT 'kg/m²',
                "concrete_factor" decimal(10,4) NOT NULL,
                "concrete_unit" varchar(20) NOT NULL DEFAULT 'm³/m²',
                "formwork_factor" decimal(10,4) NOT NULL,
                "formwork_unit" varchar(20) NOT NULL DEFAULT 'm²/m²',
                "steel_factor" decimal(10,4),
                "steel_unit" varchar(20),
                "mortar_factor" decimal(10,4),
                "mortar_unit" varchar(20),
                "other_factors" jsonb,
                "description" text,
                "is_system_default" boolean NOT NULL DEFAULT false,
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_cmm_building_profiles" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_cmm_building_profiles_code" UNIQUE ("code")
            )
        `);

    // Create indexes for cmm_building_profiles
    await queryRunner.query(`
            CREATE INDEX "IDX_cmm_building_profiles_structure_usage" 
            ON "cmm_building_profiles" ("structure_type", "building_usage")
        `);

    // 4. Create cmm_unit_conversions table
    await queryRunner.query(`
            CREATE TABLE "cmm_unit_conversions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "material_id" uuid NOT NULL,
                "from_unit" varchar(20) NOT NULL,
                "to_unit" varchar(20) NOT NULL,
                "conversion_factor" decimal(15,6) NOT NULL,
                "formula" varchar(200),
                "is_bidirectional" boolean NOT NULL DEFAULT true,
                "notes" text,
                "created_at" timestamp NOT NULL DEFAULT now(),
                "updated_at" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_cmm_unit_conversions" PRIMARY KEY ("id"),
                CONSTRAINT "FK_cmm_unit_conversions_material" 
                    FOREIGN KEY ("material_id") REFERENCES "cmm_material_masters"("id") ON DELETE CASCADE
            )
        `);

    // Create indexes for cmm_unit_conversions
    await queryRunner.query(`
            CREATE INDEX "IDX_cmm_unit_conversions_material" ON "cmm_unit_conversions" ("material_id")
        `);
    await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_cmm_unit_conversions_unique" 
            ON "cmm_unit_conversions" ("material_id", "from_unit", "to_unit")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "cmm_unit_conversions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cmm_building_profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cmm_material_masters"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "building_usage_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "structure_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "material_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "material_category_enum"`);
  }
}
