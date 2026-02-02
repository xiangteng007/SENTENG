# Storybook 設定與使用指南 (FE-004)

> **版本**: 1.0 | **更新日期**: 2026-02-02

---

## 安裝設定

```bash
# 安裝 Storybook
npx storybook@latest init

# 啟動 Storybook
npm run storybook

# 建置靜態 Storybook
npm run build-storybook
```

---

## 目錄結構

```
apps/web/
├── .storybook/
│   ├── main.ts           # 主配置
│   ├── preview.ts         # 預覽配置
│   └── manager.ts         # 管理界面配置
├── src/
│   └── components/
│       ├── common/
│       │   ├── Button.jsx
│       │   ├── Button.stories.tsx    ← Story 文件
│       │   ├── ErrorBoundary.jsx
│       │   ├── ErrorBoundary.stories.tsx
│       │   └── ...
│       └── ui/
│           ├── Sidebar.jsx
│           └── Sidebar.stories.tsx
└── storybook-static/     # 建置輸出
```

---

## 主配置

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  viteFinal: async (config) => {
    // 自訂 Vite 配置
    return config;
  },
};

export default config;
```

---

## 預覽配置

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/react';
import '../src/index.css';
import '../src/styles/tokens.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
        { name: 'gray', value: '#f5f5f5' },
      ],
    },
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1280px', height: '800px' } },
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'Internationalization locale',
      defaultValue: 'zh-TW',
      toolbar: {
        title: 'Locale',
        items: [
          { value: 'zh-TW', title: '繁體中文' },
          { value: 'en', title: 'English' },
        ],
      },
    },
  },
};

export default preview;
```

---

## Story 範例

### Button Story

```tsx
// src/components/common/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import Button from './Button';

const meta: Meta<typeof Button> = {
  title: 'Common/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基本按鈕
export const Primary: Story = {
  args: {
    children: '主要按鈕',
    variant: 'primary',
  },
};

// 次要按鈕
export const Secondary: Story = {
  args: {
    children: '次要按鈕',
    variant: 'secondary',
  },
};

// 危險按鈕
export const Danger: Story = {
  args: {
    children: '刪除',
    variant: 'danger',
  },
};

// 載入中
export const Loading: Story = {
  args: {
    children: '處理中...',
    loading: true,
  },
};

// 不同尺寸
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
```

### EmptyState Story

```tsx
// src/components/common/EmptyState.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import EmptyState from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'Common/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    title: '沒有專案',
    description: '開始建立您的第一個專案',
    actionLabel: '新增專案',
    onAction: () => alert('新增專案'),
  },
};

export const SearchNoResults: Story = {
  args: {
    icon: 'search',
    title: '找不到結果',
    description: '請嘗試不同的搜尋關鍵字',
  },
};
```

### Skeleton Story

```tsx
// src/components/common/Skeleton.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton, SkeletonText, SkeletonCard, SkeletonTable } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Common/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    className: 'h-4 w-full',
  },
};

export const Text: Story = {
  render: () => <SkeletonText lines={4} />,
};

export const Card: Story = {
  render: () => <SkeletonCard />,
};

export const Table: Story = {
  render: () => <SkeletonTable rows={5} columns={4} />,
};
```

---

## CI/CD 整合

```yaml
# .github/workflows/storybook.yml
name: Storybook

on:
  push:
    branches: [main]
    paths:
      - 'apps/web/src/components/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Storybook
        run: npm run build-storybook
        working-directory: apps/web
      
      - name: Deploy to Chromatic
        uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_TOKEN }}
          storybookBuildDir: apps/web/storybook-static
```

---

## 執行命令

```bash
# 開發模式
npm run storybook

# 建置靜態文件
npm run build-storybook

# 視覺回歸測試 (with Chromatic)
npx chromatic --project-token=<token>
```
