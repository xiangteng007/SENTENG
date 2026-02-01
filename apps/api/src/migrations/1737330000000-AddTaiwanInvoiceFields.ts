import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
  TableForeignKey,
} from "typeorm";

export class AddTaiwanInvoiceFields1737330000000 implements MigrationInterface {
  name = "AddTaiwanInvoiceFields1737330000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if invoices table exists
    const hasTable = await queryRunner.hasTable("invoices");
    if (!hasTable) {
      console.log("invoices table does not exist, skipping migration");
      return;
    }

    // Add new columns for Taiwan invoice management
    const columnsToAdd = [
      // Document type & source
      {
        name: "doc_type",
        type: "varchar",
        length: "30",
        default: "'INVOICE_B2B'",
        isNullable: true,
      },
      {
        name: "source_type",
        type: "varchar",
        length: "30",
        default: "'MANUAL'",
        isNullable: true,
      },

      // Taiwan invoice specific
      { name: "invoice_track", type: "varchar", length: "2", isNullable: true },
      {
        name: "invoice_number",
        type: "varchar",
        length: "8",
        isNullable: true,
      },
      {
        name: "invoice_period",
        type: "varchar",
        length: "5",
        isNullable: true,
      },
      { name: "random_code", type: "varchar", length: "4", isNullable: true },

      // Seller/Buyer info
      { name: "seller_tax_id", type: "varchar", length: "8", isNullable: true },
      { name: "seller_name", type: "varchar", length: "100", isNullable: true },
      { name: "buyer_tax_id", type: "varchar", length: "8", isNullable: true },

      // Amount fields
      {
        name: "currency",
        type: "varchar",
        length: "3",
        default: "'TWD'",
        isNullable: true,
      },
      {
        name: "fx_rate",
        type: "decimal",
        precision: 10,
        scale: 4,
        default: 1,
        isNullable: true,
      },
      {
        name: "amount_net",
        type: "decimal",
        precision: 15,
        scale: 2,
        default: 0,
        isNullable: true,
      },
      {
        name: "amount_tax",
        type: "decimal",
        precision: 15,
        scale: 2,
        default: 0,
        isNullable: true,
      },
      {
        name: "amount_gross",
        type: "decimal",
        precision: 15,
        scale: 2,
        default: 0,
        isNullable: true,
      },
      {
        name: "vat_rate",
        type: "decimal",
        precision: 5,
        scale: 4,
        default: 0.05,
        isNullable: true,
      },

      // VAT deduction
      {
        name: "vat_deductible_status",
        type: "varchar",
        length: "20",
        default: "'UNKNOWN'",
        isNullable: true,
      },
      {
        name: "vat_claim_period",
        type: "varchar",
        length: "7",
        isNullable: true,
      },
      {
        name: "vat_claim_batch_id",
        type: "varchar",
        length: "36",
        isNullable: true,
      },

      // Retainage
      {
        name: "retainage_rate",
        type: "decimal",
        precision: 5,
        scale: 4,
        default: 0,
        isNullable: true,
      },
      {
        name: "retainage_amount",
        type: "decimal",
        precision: 15,
        scale: 2,
        default: 0,
        isNullable: true,
      },
      {
        name: "retainage_status",
        type: "varchar",
        length: "20",
        default: "'NONE'",
        isNullable: true,
      },

      // State machine
      {
        name: "current_state",
        type: "varchar",
        length: "30",
        default: "'DRAFT'",
        isNullable: true,
      },
      {
        name: "approval_status",
        type: "varchar",
        length: "20",
        default: "'DRAFT'",
        isNullable: true,
      },
      {
        name: "payment_status",
        type: "varchar",
        length: "20",
        default: "'UNPAID'",
        isNullable: true,
      },

      // AI recognition
      {
        name: "ai_confidence",
        type: "decimal",
        precision: 3,
        scale: 2,
        isNullable: true,
      },
      {
        name: "ai_needs_review",
        type: "boolean",
        default: false,
        isNullable: true,
      },
      { name: "ai_extracted_data", type: "jsonb", isNullable: true },

      // Vendor relation
      { name: "vendor_id", type: "varchar", length: "36", isNullable: true },

      // Cost allocation
      {
        name: "cost_category",
        type: "varchar",
        length: "30",
        isNullable: true,
      },
      { name: "cost_code_id", type: "varchar", length: "36", isNullable: true },

      // Other
      { name: "description", type: "text", isNullable: true },
      { name: "tags", type: "text", isArray: true, isNullable: true },

      // Attachments
      {
        name: "primary_file_id",
        type: "varchar",
        length: "36",
        isNullable: true,
      },
      { name: "thumbnail_url", type: "text", isNullable: true },

      // Soft delete
      { name: "deleted_at", type: "timestamp", isNullable: true },
    ];

    for (const col of columnsToAdd) {
      const hasColumn = await queryRunner.hasColumn("invoices", col.name);
      if (!hasColumn) {
        await queryRunner.addColumn("invoices", new TableColumn(col as any));
        console.log(`Added column: ${col.name}`);
      }
    }

    // Add indexes
    const indexes = [
      { name: "IDX_invoices_doc_type", columnNames: ["doc_type"] },
      { name: "IDX_invoices_current_state", columnNames: ["current_state"] },
      {
        name: "IDX_invoices_vat_deductible_status",
        columnNames: ["vat_deductible_status"],
      },
      { name: "IDX_invoices_payment_status", columnNames: ["payment_status"] },
      { name: "IDX_invoices_invoice_period", columnNames: ["invoice_period"] },
      { name: "IDX_invoices_seller_tax_id", columnNames: ["seller_tax_id"] },
      { name: "IDX_invoices_vendor_id", columnNames: ["vendor_id"] },
    ];

    for (const idx of indexes) {
      try {
        await queryRunner.createIndex("invoices", new TableIndex(idx));
        console.log(`Created index: ${idx.name}`);
      } catch (e) {
        console.log(`Index ${idx.name} may already exist, skipping`);
      }
    }

    // Add foreign key to vendors
    try {
      await queryRunner.createForeignKey(
        "invoices",
        new TableForeignKey({
          columnNames: ["vendor_id"],
          referencedColumnNames: ["id"],
          referencedTableName: "vendors",
          onDelete: "SET NULL",
        }),
      );
      console.log("Created foreign key for vendor_id");
    } catch (e) {
      console.log("Foreign key for vendor_id may already exist, skipping");
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable("invoices");
    if (!hasTable) return;

    // Drop foreign key
    const table = await queryRunner.getTable("invoices");
    const vendorFk = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf("vendor_id") !== -1,
    );
    if (vendorFk) {
      await queryRunner.dropForeignKey("invoices", vendorFk);
    }

    // Drop indexes
    const indexNames = [
      "IDX_invoices_doc_type",
      "IDX_invoices_current_state",
      "IDX_invoices_vat_deductible_status",
      "IDX_invoices_payment_status",
      "IDX_invoices_invoice_period",
      "IDX_invoices_seller_tax_id",
      "IDX_invoices_vendor_id",
    ];
    for (const name of indexNames) {
      try {
        await queryRunner.dropIndex("invoices", name);
      } catch (e) {
        console.log(`Index ${name} may not exist, skipping`);
      }
    }

    // Drop columns (in reverse order)
    const columnsToDrop = [
      "deleted_at",
      "thumbnail_url",
      "primary_file_id",
      "tags",
      "description",
      "cost_code_id",
      "cost_category",
      "vendor_id",
      "ai_extracted_data",
      "ai_needs_review",
      "ai_confidence",
      "payment_status",
      "approval_status",
      "current_state",
      "retainage_status",
      "retainage_amount",
      "retainage_rate",
      "vat_claim_batch_id",
      "vat_claim_period",
      "vat_deductible_status",
      "vat_rate",
      "amount_gross",
      "amount_tax",
      "amount_net",
      "fx_rate",
      "currency",
      "buyer_tax_id",
      "seller_name",
      "seller_tax_id",
      "random_code",
      "invoice_period",
      "invoice_number",
      "invoice_track",
      "source_type",
      "doc_type",
    ];

    for (const colName of columnsToDrop) {
      const hasColumn = await queryRunner.hasColumn("invoices", colName);
      if (hasColumn) {
        await queryRunner.dropColumn("invoices", colName);
      }
    }
  }
}
