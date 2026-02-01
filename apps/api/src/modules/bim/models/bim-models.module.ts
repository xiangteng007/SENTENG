import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BimModel, BimModelVersion, BimElement, BimQuantity } from "./entities";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BimModel,
      BimModelVersion,
      BimElement,
      BimQuantity,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class BimModelsModule {}
