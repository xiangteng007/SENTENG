# TypeScript 遷移計畫 (FE-001)

> **版本**: 1.0 | **更新日期**: 2026-02-02
> **目標**: 6 個月內達成 50% TSX 覆蓋率

---

## 遷移策略

採用 **漸進式遷移** (Incremental Migration)：
1. 新檔案強制使用 TypeScript
2. 高頻修改檔案優先遷移
3. 共用組件/工具優先

---

## 環境設定

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Allow JS */
    "allowJs": true,
    "checkJs": false,

    /* Paths */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"],
      "@pages/*": ["src/pages/*"],
      "@types/*": ["src/types/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### ESLint 配置

```javascript
// .eslintrc.cjs
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-refresh'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'react-refresh/only-export-components': 'warn',
  },
  overrides: [
    {
      files: ['*.js', '*.jsx'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
```

---

## 類型定義

### 核心實體類型

```typescript
// src/types/entities.ts

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export type UserRole = 'guest' | 'viewer' | 'editor' | 'manager' | 'admin' | 'owner';

export interface Project {
  id: string;
  name: string;
  clientId: string;
  client?: Client;
  status: ProjectStatus;
  budget?: number;
  startDate?: Date;
  endDate?: Date;
  ownerId: string;
  memberIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectStatus = 
  | 'planning' 
  | 'approved' 
  | 'in_progress' 
  | 'on_hold' 
  | 'completed' 
  | 'closed' 
  | 'cancelled';

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  type: '收入' | '支出';
  amount: number;
  category: string;
  date: Date;
  description?: string;
  projectId?: string;
  accountId?: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  clientId: string;
  status: QuotationStatus;
  items: QuotationItem[];
  totalAmount: number;
  validUntil?: Date;
  createdAt: Date;
}

export type QuotationStatus = 
  | 'draft' 
  | 'sent' 
  | 'viewed' 
  | 'accepted' 
  | 'rejected' 
  | 'expired' 
  | 'converted';

export interface QuotationItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  amount: number;
  dueDate: Date;
  paidAmount: number;
  createdAt: Date;
}

export type InvoiceStatus = 
  | 'draft' 
  | 'issued' 
  | 'sent' 
  | 'partial_paid' 
  | 'paid' 
  | 'overdue' 
  | 'void' 
  | 'credited';
```

### API 回應類型

```typescript
// src/types/api.ts

export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}
```

### Props 類型

```typescript
// src/types/props.ts

import { ReactNode } from 'react';

export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  width?: string;
}
```

---

## 遷移優先順序

### Phase 1: 共用模組 (Week 1-4)

```
src/
├── types/              ✅ 建立類型定義
│   ├── entities.ts
│   ├── api.ts
│   └── props.ts
├── utils/              ⏳ 遷移工具函數
│   ├── formatters.ts
│   ├── validators.ts
│   └── helpers.ts
├── hooks/              ⏳ 遷移自訂 Hooks
│   ├── useAuth.ts
│   ├── useApiData.ts
│   └── useLocalStorage.ts
└── context/            ⏳ 遷移 Context
    └── AuthContext.tsx
```

### Phase 2: 共用組件 (Week 5-12)

```
src/components/
├── common/             ⏳ 遷移共用組件
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   ├── Table.tsx
│   ├── ErrorBoundary.tsx
│   ├── EmptyState.tsx
│   └── Skeleton.tsx
└── ui/
    ├── Sidebar.tsx
    └── Header.tsx
```

### Phase 3: 頁面 (Week 13-24)

```
src/pages/              ⏳ 遷移頁面
├── Dashboard.tsx
├── Projects.tsx
├── Finance.tsx
├── Clients.tsx
└── ...
```

---

## 遷移腳本

```bash
#!/bin/bash
# scripts/migrate-to-ts.sh

# 重命名 .jsx 為 .tsx
rename_file() {
  local file=$1
  local newfile="${file%.jsx}.tsx"
  mv "$file" "$newfile"
  echo "Renamed: $file -> $newfile"
}

# 檢查類型錯誤
check_types() {
  npx tsc --noEmit
}

# 執行
echo "Starting TypeScript migration..."
check_types
```

---

## 追蹤指標

```bash
# 計算 TSX 覆蓋率
tsx_count=$(find src -name "*.tsx" | wc -l)
jsx_count=$(find src -name "*.jsx" | wc -l)
total=$((tsx_count + jsx_count))
percentage=$((tsx_count * 100 / total))
echo "TSX Coverage: $percentage% ($tsx_count / $total)"
```

### 目標里程碑

| 階段 | 日期 | 目標覆蓋率 |
|:-----|:-----|:----------:|
| Phase 1 | Week 4 | 15% |
| Phase 2 | Week 12 | 35% |
| Phase 3 | Week 24 | 50% |
| Phase 4 | Week 36 | 75% |
| 完成 | Week 48 | 100% |
