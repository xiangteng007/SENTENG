# TypeScript 遷移指南

## 概述
此專案正在從 JavaScript 遷移到 TypeScript。以下是遷移策略和進度追蹤。

## 遷移策略 (漸進式)

### Phase 1: 基礎設置 ✅
- [x] 安裝 TypeScript 依賴
- [x] 建立 tsconfig.json (寬鬆模式)
- [x] 設定路徑別名

### Phase 2: 類型定義 (進行中)
- [ ] 建立 types/ 目錄
- [ ] 定義核心資料模型 (Project, Client, Transaction)
- [ ] 定義 API 回應類型

### Phase 3: 工具函數遷移
- [ ] utils/*.js → utils/*.ts
- [ ] services/*.js → services/*.ts

### Phase 4: 組件遷移
- [ ] components/common/*.jsx → *.tsx
- [ ] pages/*.jsx → *.tsx

### Phase 5: 嚴格模式
- [ ] 啟用 strictNullChecks
- [ ] 啟用 noImplicitAny
- [ ] 啟用 strict

## 命名慣例

```typescript
// 介面以 I 開頭
interface IProject {
  id: string;
  name: string;
  status: ProjectStatus;
}

// 類型以 T 開頭
type TProjectStatus = 'active' | 'completed' | 'cancelled';

// Props 類型
interface IButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}
```

## 常見類型定義

```typescript
// src/types/models.ts

export interface IProject {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled';
  budget: number;
  startDate: string;
  endDate?: string;
  clientId: string;
  managerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IClient {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address?: string;
}

export interface ITransaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  projectId?: string;
  accountId: string;
}

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'owner' | 'user';
  permissions: string[];
}
```

## API 類型範例

```typescript
// src/types/api.ts

export interface IApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface IPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// 用法
const fetchProjects = async (): Promise<IApiResponse<IProject[]>> => {
  const response = await api.get('/projects');
  return response.data;
};
```

## 遷移優先順序

1. **高優先**: stores/, config/, utils/
2. **中優先**: services/, context/
3. **低優先**: components/, pages/

## 注意事項

- 使用 `.tsx` 於包含 JSX 的檔案
- 使用 `.ts` 於純邏輯檔案
- 保留 `.jsx` 直到遷移完成
- 每次遷移後執行 `npm run build` 確認無錯誤
