# Extension Points 註冊表 (EXT-001)

> **版本**: 1.0 | **更新日期**: 2026-02-02

---

## 概述

Extension Points 是 SENTENG ERP 的可擴充介面，允許在不修改核心程式碼的情況下添加功能。

---

## 已定義擴充點

### 1. CustomFieldsExtension

**用途**: 為實體添加自訂欄位

```typescript
interface CustomFieldsExtension {
  entityType: 'Project' | 'Client' | 'Invoice' | 'Quotation';
  fields: CustomFieldDefinition[];
}

interface CustomFieldDefinition {
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  label: string;
  required: boolean;
  options?: string[];
  validation?: string;  // regex or rule
}
```

**使用範例**:
```typescript
// 為專案添加自訂欄位
registerExtension('CustomFields', {
  entityType: 'Project',
  fields: [
    { name: 'construction_permit_number', type: 'text', label: '建照號碼', required: false },
    { name: 'site_area', type: 'number', label: '基地面積(坪)', required: false },
  ]
});
```

---

### 2. WorkflowHooksExtension

**用途**: 在業務流程關鍵節點插入邏輯

```typescript
interface WorkflowHooksExtension {
  hookPoint: 
    | 'beforeQuotationSend'
    | 'afterQuotationAccepted'
    | 'beforeContractSign'
    | 'afterPaymentReceived'
    | 'beforeInvoiceIssue';
  handler: (context: HookContext) => Promise<void | HookResult>;
  priority: number;  // 執行順序
}

interface HookContext {
  entityId: string;
  entityType: string;
  userId: string;
  previousState?: any;
  newState?: any;
}

interface HookResult {
  abort?: boolean;
  message?: string;
}
```

**使用範例**:
```typescript
// 報價發送前檢查客戶信用
registerExtension('WorkflowHooks', {
  hookPoint: 'beforeQuotationSend',
  priority: 10,
  handler: async (ctx) => {
    const client = await getClient(ctx.clientId);
    if (client.creditStatus === 'blocked') {
      return { abort: true, message: '客戶信用已凍結' };
    }
  }
});
```

---

### 3. ReportGeneratorExtension

**用途**: 添加自訂報表

```typescript
interface ReportGeneratorExtension {
  reportId: string;
  reportName: string;
  category: 'finance' | 'project' | 'client' | 'custom';
  description: string;
  parameters: ReportParameter[];
  generator: (params: any) => Promise<ReportData>;
}

interface ReportParameter {
  name: string;
  type: 'date' | 'dateRange' | 'select' | 'multiselect';
  label: string;
  required: boolean;
  dataSource?: string;  // 下拉選項來源
}
```

**使用範例**:
```typescript
registerExtension('ReportGenerator', {
  reportId: 'vendor-performance',
  reportName: '廠商績效分析',
  category: 'custom',
  parameters: [
    { name: 'dateRange', type: 'dateRange', label: '日期範圍', required: true },
    { name: 'vendors', type: 'multiselect', label: '廠商', dataSource: 'vendors' },
  ],
  generator: async (params) => {
    // 自訂報表邏輯
    return generateVendorReport(params);
  }
});
```

---

## 擴充點註冊機制

### 註冊 API

```typescript
// common/extensions/extension-registry.ts
@Injectable()
export class ExtensionRegistry {
  private extensions: Map<string, Extension[]> = new Map();

  register<T extends Extension>(type: string, extension: T): void {
    const list = this.extensions.get(type) || [];
    list.push(extension);
    list.sort((a, b) => (a.priority || 0) - (b.priority || 0));
    this.extensions.set(type, list);
  }

  getExtensions<T extends Extension>(type: string): T[] {
    return (this.extensions.get(type) || []) as T[];
  }

  async executeHooks(
    hookPoint: string, 
    context: HookContext
  ): Promise<HookResult[]> {
    const hooks = this.getExtensions<WorkflowHooksExtension>('WorkflowHooks')
      .filter(h => h.hookPoint === hookPoint);
    
    const results: HookResult[] = [];
    for (const hook of hooks) {
      const result = await hook.handler(context);
      if (result) results.push(result);
      if (result?.abort) break;  // 短路
    }
    return results;
  }
}
```

### 使用方式

```typescript
// modules/quotations/quotations.service.ts
@Injectable()
export class QuotationsService {
  constructor(private extensions: ExtensionRegistry) {}

  async sendQuotation(id: string, userId: string) {
    const quotation = await this.findOne(id);
    
    // 執行前置 Hook
    const hookResults = await this.extensions.executeHooks(
      'beforeQuotationSend',
      { entityId: id, entityType: 'Quotation', userId }
    );
    
    // 檢查是否中止
    const aborted = hookResults.find(r => r.abort);
    if (aborted) {
      throw new BadRequestException(aborted.message);
    }
    
    // 繼續業務邏輯...
  }
}
```

---

## 未來擴充點規劃

| 擴充點 | 說明 | 優先級 |
|:-------|:-----|:------:|
| NotificationChannelExtension | 自訂通知管道 | P2 |
| IntegrationConnectorExtension | 第三方整合 | P2 |
| AuthProviderExtension | 外部認證 | P1 |
| PermissionEvaluatorExtension | 自訂權限規則 | P2 |
