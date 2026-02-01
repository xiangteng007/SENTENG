import { Module, Global } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Role, Permission, UserRole } from "./entities";
import { RbacService } from "./rbac.service";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission, UserRole])],
  providers: [RbacService],
  exports: [RbacService, TypeOrmModule],
})
export class RbacModule {}
