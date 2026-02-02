/**
 * business-exceptions.ts | 業務層自訂例外
 *
 * 用途：提供語義化的業務例外，統一錯誤代碼
 * 規格：與 api-error.dto.ts 錯誤代碼一致
 *
 * 更新日期：2026-02-02
 */

import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";

// ============== 專案相關 ==============

export class ProjectNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: "PROJECT_NOT_FOUND",
      message: `專案 ${id} 不存在`,
    });
  }
}

export class ProjectAccessDeniedException extends ForbiddenException {
  constructor(projectId: string) {
    super({
      error: "PROJECT_ACCESS_DENIED",
      message: `您沒有權限存取專案 ${projectId}`,
    });
  }
}

// ============== 合約相關 ==============

export class ContractNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: "CONTRACT_NOT_FOUND",
      message: `合約 ${id} 不存在`,
    });
  }
}

export class ContractAlreadySignedException extends BadRequestException {
  constructor(id: string) {
    super({
      error: "CONTRACT_ALREADY_SIGNED",
      message: `合約 ${id} 已簽署，無法修改`,
    });
  }
}

export class ContractStatusInvalidException extends BadRequestException {
  constructor(id: string, currentStatus: string, expectedStatus: string) {
    super({
      error: "CONTRACT_STATUS_INVALID",
      message: `合約 ${id} 狀態為 ${currentStatus}，預期為 ${expectedStatus}`,
    });
  }
}

// ============== 報價單相關 ==============

export class QuotationNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: "QUOTATION_NOT_FOUND",
      message: `報價單 ${id} 不存在`,
    });
  }
}

export class QuotationLockedException extends BadRequestException {
  constructor(id: string) {
    super({
      error: "QUOTATION_LOCKED",
      message: `報價單 ${id} 已鎖定，無法修改`,
    });
  }
}

// ============== 客戶相關 ==============

export class ClientNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: "CLIENT_NOT_FOUND",
      message: `客戶 ${id} 不存在`,
    });
  }
}

export class CustomerNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: "CUSTOMER_NOT_FOUND",
      message: `顧客 ${id} 不存在`,
    });
  }
}

// ============== 供應商相關 ==============

export class VendorNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: "VENDOR_NOT_FOUND",
      message: `供應商 ${id} 不存在`,
    });
  }
}

// ============== 庫存相關 ==============

export class InventoryItemNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: "INVENTORY_ITEM_NOT_FOUND",
      message: `庫存品項 ${id} 不存在`,
    });
  }
}

export class InsufficientStockException extends BadRequestException {
  constructor(itemId: string, requested: number, available: number) {
    super({
      error: "INSUFFICIENT_STOCK",
      message: `品項 ${itemId} 庫存不足：需求 ${requested}，現有 ${available}`,
    });
  }
}

// ============== 財務相關 ==============

export class TransactionNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: "TRANSACTION_NOT_FOUND",
      message: `交易 ${id} 不存在`,
    });
  }
}

export class PaymentNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: "PAYMENT_NOT_FOUND",
      message: `請款單 ${id} 不存在`,
    });
  }
}

export class InvoiceNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: "INVOICE_NOT_FOUND",
      message: `發票 ${id} 不存在`,
    });
  }
}

// ============== 使用者相關 ==============

export class UserNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      error: "USER_NOT_FOUND",
      message: `使用者 ${id} 不存在`,
    });
  }
}

export class UserEmailExistsException extends ConflictException {
  constructor(email: string) {
    super({
      error: "USER_EMAIL_EXISTS",
      message: `電子郵件 ${email} 已被使用`,
    });
  }
}

// ============== 通用例外 ==============

export class ResourceNotFoundException extends NotFoundException {
  constructor(resourceType: string, id: string) {
    super({
      error: "RESOURCE_NOT_FOUND",
      message: `${resourceType} ${id} 不存在`,
    });
  }
}

export class ResourceAccessDeniedException extends ForbiddenException {
  constructor(resourceType: string, id: string) {
    super({
      error: "RESOURCE_ACCESS_DENIED",
      message: `您沒有權限存取 ${resourceType} ${id}`,
    });
  }
}

export class DuplicateResourceException extends ConflictException {
  constructor(resourceType: string, identifier: string) {
    super({
      error: "DUPLICATE_RESOURCE",
      message: `${resourceType} ${identifier} 已存在`,
    });
  }
}
