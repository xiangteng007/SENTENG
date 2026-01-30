import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmartHomeProduct } from './entities/smart-home-product.entity';
import { SmartHomeService } from './smart-home.service';
import { SmartHomeController } from './smart-home.controller';
import { AqaraCrawlerService } from './aqara-crawler.service';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [TypeOrmModule.forFeature([SmartHomeProduct]), IntegrationsModule],
  controllers: [SmartHomeController],
  providers: [SmartHomeService, AqaraCrawlerService],
  exports: [SmartHomeService],
})
export class SmartHomeModule {}
