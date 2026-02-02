# WCAG 2.1 AA 合規指南 (UX-002)

> **版本**: 1.0 | **更新日期**: 2026-02-02

---

## 概述

本文件定義 SENTENG ERP 達成 WCAG 2.1 AA 級合規的實作規範。

---

## 核心原則 (POUR)

### 1. Perceivable (可感知)
- 提供文字替代
- 提供媒體替代
- 內容可調整呈現
- 容易區分前景/背景

### 2. Operable (可操作)
- 鍵盤可存取
- 有足夠時間
- 無閃爍內容
- 可導航

### 3. Understandable (可理解)
- 可讀性
- 可預測性
- 輸入協助

### 4. Robust (穩健)
- 相容性
- 語意正確

---

## 實作檢查清單

### 圖片與媒體

```jsx
// ✅ 正確: 提供有意義的 alt 文字
<img 
  src="/project-photo.jpg" 
  alt="台北信義區辦公室裝修專案完工照片"
/>

// ✅ 裝飾性圖片使用空 alt
<img src="/decorative-line.svg" alt="" role="presentation" />

// ❌ 錯誤: 無 alt 或無意義 alt
<img src="/project.jpg" />
<img src="/project.jpg" alt="圖片" />
```

### 顏色對比

```css
/* ✅ 符合 AA 標準 (對比度 ≥ 4.5:1) */
.text-primary {
  color: #1a1a1a;       /* 深灰文字 */
  background: #ffffff;  /* 白色背景 */
  /* 對比度: 12.63:1 ✓ */
}

/* ✅ 大型文字可使用較低對比 (≥ 3:1) */
.heading-large {
  color: #555555;
  font-size: 24px;
  font-weight: bold;
}

/* ❌ 對比不足 */
.low-contrast {
  color: #999999;
  background: #f5f5f5;
  /* 對比度: 2.5:1 ✗ */
}
```

### 表單標籤

```jsx
// ✅ 關聯 label
<div>
  <label htmlFor="project-name">專案名稱</label>
  <input id="project-name" type="text" aria-describedby="name-hint" />
  <span id="name-hint">請輸入 2-50 字元</span>
</div>

// ✅ 必填欄位明確標示
<label htmlFor="email">
  電子郵件 <span aria-label="必填">*</span>
</label>
<input 
  id="email" 
  type="email" 
  required 
  aria-required="true"
/>

// ❌ 只有 placeholder
<input type="text" placeholder="專案名稱" />
```

### 鍵盤導航

```jsx
// ✅ 可聚焦元素有清晰焦點樣式
const buttonStyles = `
  focus:outline-none 
  focus:ring-2 
  focus:ring-blue-500 
  focus:ring-offset-2
`;

// ✅ 自訂組件支援鍵盤
const Dropdown = () => {
  return (
    <div 
      role="listbox" 
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown') selectNext();
        if (e.key === 'ArrowUp') selectPrev();
        if (e.key === 'Enter') confirmSelection();
        if (e.key === 'Escape') closeDropdown();
      }}
    >
      {/* options */}
    </div>
  );
};

// ✅ Skip links
<a href="#main-content" className="sr-only focus:not-sr-only">
  跳至主要內容
</a>
```

### ARIA 使用

```jsx
// ✅ 動態內容通知
<div aria-live="polite" aria-atomic="true">
  {isLoading && '載入中...'}
  {successMessage}
</div>

// ✅ 展開/收合狀態
<button 
  aria-expanded={isOpen}
  aria-controls="menu-content"
  onClick={toggleMenu}
>
  選單
</button>
<div id="menu-content" hidden={!isOpen}>
  {/* 選單內容 */}
</div>

// ✅ 分頁導航
<nav aria-label="頁面導航">
  <ul>
    <li><a href="/" aria-current="page">首頁</a></li>
    <li><a href="/projects">專案</a></li>
  </ul>
</nav>
```

### 錯誤處理

```jsx
// ✅ 錯誤訊息關聯
<div>
  <label htmlFor="email">電子郵件</label>
  <input 
    id="email" 
    type="email"
    aria-invalid={hasError}
    aria-describedby={hasError ? "email-error" : undefined}
  />
  {hasError && (
    <span id="email-error" role="alert">
      請輸入有效的電子郵件地址
    </span>
  )}
</div>

// ✅ 表單提交錯誤摘要
{errors.length > 0 && (
  <div role="alert" tabIndex={-1} ref={errorSummaryRef}>
    <h2>有 {errors.length} 個錯誤需要修正</h2>
    <ul>
      {errors.map(e => <li key={e.field}>{e.message}</li>)}
    </ul>
  </div>
)}
```

---

## 自動化測試

### axe-core 整合

```typescript
// tests/a11y.test.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('homepage should pass axe audit', async ({ page }) => {
    await page.goto('/');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(results.violations).toEqual([]);
  });

  test('login page accessibility', async ({ page }) => {
    await page.goto('/login');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast']) // 如果有已知例外
      .analyze();
    
    expect(results.violations).toEqual([]);
  });
});
```

### CI 整合

```yaml
# .github/workflows/a11y.yml
- name: Run Accessibility Tests
  run: npx playwright test tests/a11y
  
- name: Upload Results
  uses: actions/upload-artifact@v4
  with:
    name: a11y-report
    path: playwright-report/
```

---

## 螢幕閱讀器工具類

```css
/* Utility: 視覺隱藏但螢幕閱讀器可讀 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 聚焦時顯示 (用於 skip links) */
.sr-only.focus\:not-sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

---

## 驗收標準

| 頁面 | axe 違規數 | 目標 |
|:-----|:----------:|:----:|
| Dashboard | - | 0 |
| Projects | - | 0 |
| Finance | - | 0 |
| Clients | - | 0 |
| Login | - | 0 |
