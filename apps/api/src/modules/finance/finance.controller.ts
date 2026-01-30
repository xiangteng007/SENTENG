import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import {
  CreateAccountDto,
  UpdateAccountDto,
  CreateTransactionDto,
  UpdateTransactionDto,
  CreateLoanDto,
  UpdateLoanDto,
} from './finance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('finance')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ==================== Account Endpoints ====================
  @Get('accounts')
  @RequirePermissions('finance:read')
  async findAllAccounts() {
    return this.financeService.findAllAccounts();
  }

  @Get('accounts/:id')
  @RequirePermissions('finance:read')
  async findAccountById(@Param('id') id: string) {
    return this.financeService.findAccountById(id);
  }

  @Post('accounts')
  @RequirePermissions('finance:create')
  @HttpCode(HttpStatus.CREATED)
  async createAccount(@Body() dto: CreateAccountDto) {
    return this.financeService.createAccount(dto);
  }

  @Put('accounts/:id')
  @RequirePermissions('finance:update')
  async updateAccount(@Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.financeService.updateAccount(id, dto);
  }

  @Delete('accounts/:id')
  @RequirePermissions('finance:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@Param('id') id: string) {
    await this.financeService.deleteAccount(id);
  }

  // ==================== Transaction Endpoints ====================
  @Get('transactions')
  @RequirePermissions('finance:read')
  async findAllTransactions() {
    return this.financeService.findAllTransactions();
  }

  @Get('transactions/:id')
  @RequirePermissions('finance:read')
  async findTransactionById(@Param('id') id: string) {
    return this.financeService.findTransactionById(id);
  }

  @Post('transactions')
  @RequirePermissions('finance:create')
  @HttpCode(HttpStatus.CREATED)
  async createTransaction(@Body() dto: CreateTransactionDto) {
    return this.financeService.createTransaction(dto);
  }

  @Put('transactions/:id')
  @RequirePermissions('finance:update')
  async updateTransaction(@Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    return this.financeService.updateTransaction(id, dto);
  }

  @Delete('transactions/:id')
  @RequirePermissions('finance:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTransaction(@Param('id') id: string) {
    await this.financeService.deleteTransaction(id);
  }

  // ==================== Loan Endpoints ====================
  @Get('loans')
  @RequirePermissions('finance:read')
  async findAllLoans() {
    return this.financeService.findAllLoans();
  }

  @Get('loans/:id')
  @RequirePermissions('finance:read')
  async findLoanById(@Param('id') id: string) {
    return this.financeService.findLoanById(id);
  }

  @Post('loans')
  @RequirePermissions('finance:create')
  @HttpCode(HttpStatus.CREATED)
  async createLoan(@Body() dto: CreateLoanDto) {
    return this.financeService.createLoan(dto);
  }

  @Put('loans/:id')
  @RequirePermissions('finance:update')
  async updateLoan(@Param('id') id: string, @Body() dto: UpdateLoanDto) {
    return this.financeService.updateLoan(id, dto);
  }

  @Delete('loans/:id')
  @RequirePermissions('finance:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLoan(@Param('id') id: string) {
    await this.financeService.deleteLoan(id);
  }

  @Post('loans/:id/record-payment')
  @RequirePermissions('finance:update')
  async recordLoanPayment(@Param('id') id: string) {
    return this.financeService.recordLoanPayment(id);
  }
}
