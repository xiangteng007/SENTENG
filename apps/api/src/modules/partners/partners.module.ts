import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Partner } from "./partner.entity";
import { PartnerContact } from "./partner-contact.entity";
import { PartnersService } from "./partners.service";
import { PartnersController } from "./partners.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Partner, PartnerContact])],
  controllers: [PartnersController],
  providers: [PartnersService],
  exports: [PartnersService, TypeOrmModule],
})
export class PartnersModule {}
