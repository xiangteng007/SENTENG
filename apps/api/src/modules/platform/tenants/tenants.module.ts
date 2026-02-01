import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { LegalEntity, BusinessUnit, CostCenter } from "./entities";
import { TenantsService } from "./tenants.service";
import { TenantsController } from "./tenants.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([LegalEntity, BusinessUnit, CostCenter]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService, TypeOrmModule],
})
export class TenantsModule {}
