import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JobSite } from './entities';
import { SitesService } from './sites.service';
import { SitesController } from './sites.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobSite]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SitesController],
  providers: [SitesService],
  exports: [SitesService, TypeOrmModule],
})
export class SitesModule {}
