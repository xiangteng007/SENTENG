import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProcurementsService } from './procurements.service';
import {
  CreateProcurementDto,
  UpdateProcurementDto,
  SubmitBidDto,
  AwardBidDto,
  EvaluateBidDto,
  ProcurementQueryDto,
} from './procurement.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('procurements')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProcurementsController {
  constructor(private readonly procurementsService: ProcurementsService) {}

  @Get()
  @RequirePermissions('procurements:read')
  findAll(@Query() query: ProcurementQueryDto) {
    return this.procurementsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('procurements:read')
  findOne(@Param('id') id: string) {
    return this.procurementsService.findOne(id);
  }

  @Get(':id/comparison')
  @RequirePermissions('procurements:compare')
  getComparison(@Param('id') id: string) {
    return this.procurementsService.getComparison(id);
  }

  @Post()
  @RequirePermissions('procurements:create')
  create(@Body() dto: CreateProcurementDto, @Request() req: any) {
    return this.procurementsService.create(dto, req.user?.sub || req.user?.id);
  }

  @Patch(':id')
  @RequirePermissions('procurements:update')
  update(@Param('id') id: string, @Body() dto: UpdateProcurementDto) {
    return this.procurementsService.update(id, dto);
  }

  @Post(':id/send-rfq')
  @RequirePermissions('procurements:rfq')
  sendRfq(@Param('id') id: string, @Body('vendorIds') vendorIds: string[]) {
    return this.procurementsService.sendRfq(id, vendorIds);
  }

  @Post(':id/bids')
  @RequirePermissions('procurements:bid')
  submitBid(@Param('id') id: string, @Body() dto: SubmitBidDto) {
    return this.procurementsService.submitBid(id, dto);
  }

  @Patch('bids/:bidId/evaluate')
  @RequirePermissions('procurements:bid')
  evaluateBid(@Param('bidId') bidId: string, @Body() dto: EvaluateBidDto) {
    return this.procurementsService.evaluateBid(bidId, dto);
  }

  @Post(':id/award')
  @RequirePermissions('procurements:award')
  awardBid(@Param('id') id: string, @Body() dto: AwardBidDto) {
    return this.procurementsService.awardBid(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('procurements:delete')
  remove(@Param('id') id: string) {
    return this.procurementsService.remove(id);
  }
}
