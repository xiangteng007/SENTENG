# 前端組件測試設定 (TEST-003)

> **版本**: 1.0 | **更新日期**: 2026-02-02

---

## 框架配置

使用 **Vitest** + **React Testing Library** 組合。

### 安裝

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Vitest 配置

```typescript
// apps/web/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
});
```

### Setup 檔

```typescript
// apps/web/tests/setup.ts
import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// 每個測試後清理
afterEach(() => {
  cleanup();
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

---

## 測試目錄結構

```
apps/web/
├── src/
│   └── components/
│       ├── common/
│       │   ├── ErrorBoundary.jsx
│       │   ├── ErrorBoundary.test.jsx  ← 共置
│       │   ├── EmptyState.jsx
│       │   ├── EmptyState.test.jsx
│       │   ├── Skeleton.jsx
│       │   └── Skeleton.test.jsx
│       └── ui/
│           ├── Button.jsx
│           └── Button.test.jsx
└── tests/
    ├── setup.ts
    └── utils/
        └── render.tsx  ← 自訂 render
```

---

## 核心組件測試

### ErrorBoundary 測試

```typescript
// src/components/common/ErrorBoundary.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  // 防止 console.error 輸出
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders fallback UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText('發生錯誤')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重試' })).toBeInTheDocument();
  });

  it('resets error state on retry', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    fireEvent.click(screen.getByRole('button', { name: '重試' }));
    
    // 驗證 state 重置
    rerender(
      <ErrorBoundary>
        <div>Recovered</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });
});
```

### EmptyState 測試

```typescript
// src/components/common/EmptyState.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders default props', () => {
    render(<EmptyState />);
    expect(screen.getByText('沒有資料')).toBeInTheDocument();
    expect(screen.getByText('目前沒有可顯示的內容')).toBeInTheDocument();
  });

  it('renders custom title and description', () => {
    render(
      <EmptyState 
        title="無客戶資料" 
        description="尚未新增任何客戶" 
      />
    );
    expect(screen.getByText('無客戶資料')).toBeInTheDocument();
    expect(screen.getByText('尚未新增任何客戶')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const onAction = vi.fn();
    render(
      <EmptyState 
        actionLabel="新增客戶" 
        onAction={onAction} 
      />
    );
    
    const button = screen.getByRole('button', { name: '新增客戶' });
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders correct icon', () => {
    render(<EmptyState icon="search" />);
    // SVG 圖標應該存在
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});
```

### Skeleton 測試

```typescript
// src/components/common/Skeleton.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton, SkeletonText, SkeletonCard, SkeletonTable } from './Skeleton';

describe('Skeleton Components', () => {
  describe('Skeleton', () => {
    it('renders with animation by default', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toHaveClass('animate-pulse');
    });

    it('can disable animation', () => {
      const { container } = render(<Skeleton animate={false} />);
      expect(container.firstChild).not.toHaveClass('animate-pulse');
    });

    it('applies custom className', () => {
      const { container } = render(<Skeleton className="h-10 w-full" />);
      expect(container.firstChild).toHaveClass('h-10', 'w-full');
    });
  });

  describe('SkeletonText', () => {
    it('renders correct number of lines', () => {
      const { container } = render(<SkeletonText lines={4} />);
      const skeletons = container.querySelectorAll('.bg-gray-200');
      expect(skeletons.length).toBe(4);
    });
  });

  describe('SkeletonCard', () => {
    it('renders card structure', () => {
      render(<SkeletonCard />);
      // Card 應該有標題和內容區塊
      expect(document.querySelectorAll('.bg-gray-200').length).toBeGreaterThan(0);
    });
  });

  describe('SkeletonTable', () => {
    it('renders correct number of rows', () => {
      const { container } = render(<SkeletonTable rows={5} columns={3} />);
      const rows = container.querySelectorAll('tr');
      expect(rows.length).toBe(5);
    });
  });
});
```

---

## 自訂 Render 工具

```typescript
// tests/utils/render.tsx
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';

const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

export const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

---

## 執行命令

```bash
# 執行所有組件測試
npm run test:unit

# Watch 模式
npm run test:unit -- --watch

# 覆蓋率報告
npm run test:unit -- --coverage

# 特定檔案
npm run test:unit -- ErrorBoundary.test.jsx
```

### package.json 腳本

```json
{
  "scripts": {
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:unit:coverage": "vitest run --coverage"
  }
}
```

---

## CI/CD 整合

```yaml
# .github/workflows/test.yml
- name: Run Component Tests
  run: npm run test:unit:coverage
  working-directory: apps/web

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: apps/web/coverage/coverage-final.json
```
