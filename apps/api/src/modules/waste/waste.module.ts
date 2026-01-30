import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WasteRecord, WasteMonthlyReport } from './waste.entity';
import { WasteService } from './waste.service';
import { WasteController } from './waste.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WasteRecord, WasteMonthlyReport])],
  controllers: [WasteController],
  providers: [WasteService],
  exports: [WasteService],
})
export class WasteModule {}
