import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { RegulationsController } from "./regulations.controller";
import { RegulationsService } from "./regulations.service";
import { GeminiAiService } from "./gemini-ai.service";
import {
  RegulationSource,
  RegulationArticle,
  MaterialRegulationMapping,
  CnsStandard,
} from "./entities";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      RegulationSource,
      RegulationArticle,
      MaterialRegulationMapping,
      CnsStandard,
    ]),
  ],
  controllers: [RegulationsController],
  providers: [RegulationsService, GeminiAiService],
  exports: [RegulationsService, GeminiAiService],
})
export class RegulationsModule {}
