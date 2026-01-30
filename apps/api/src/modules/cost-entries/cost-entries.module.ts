import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CostEntry } from './cost-entry.entity';
import { CostEntriesService } from './cost-entries.service';
import { CostEntriesController } from './cost-entries.controller';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [TypeOrmModule.forFeature([CostEntry]), FinanceModule],
  controllers: [CostEntriesController],
  providers: [CostEntriesService],
  exports: [CostEntriesService],
})
export class CostEntriesModule {}
