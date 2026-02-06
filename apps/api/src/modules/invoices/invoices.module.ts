import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Invoice } from "./invoice.entity";
import { InvoicesService } from "./invoices.service";
import { InvoiceExportService } from "./invoice-export.service";
import { EInvoiceService } from "./e-invoice.service";
import { InvoicesController } from "./invoices.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Invoice])],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoiceExportService, EInvoiceService],
  exports: [InvoicesService, InvoiceExportService, EInvoiceService],
})
export class InvoicesModule {}

