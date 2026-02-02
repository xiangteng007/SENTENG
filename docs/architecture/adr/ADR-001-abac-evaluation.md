# ADR-001: ABAC 資源級權限評估 (SEC-006)

> **狀態**: Proposed | **日期**: 2026-02-02

---

## 背景

目前系統使用 6 層級 RBAC (Guest → Owner)，但缺乏資源級別的細粒度存取控制。例如：
- 用戶 A 可以編輯用戶 B 的專案
- 沒有「只能看自己客戶」的限制
- 缺少基於專案成員的權限判斷

---

## 決策

採用 **RBAC + ABAC 混合模式**，其中：
- RBAC 控制功能層級權限 (能否進入某模組)
- ABAC 控制資源層級權限 (能否存取特定資料)

---

## 方案比較

| 方案 | 複雜度 | 效能影響 | 彈性 | 推薦 |
|:-----|:------:|:--------:|:----:|:----:|
| 純 RBAC | 低 | 無 | 低 | ❌ |
| RBAC + 資料過濾 | 中 | 中 | 中 | ✅ |
| 完整 ABAC (Policy Engine) | 高 | 高 | 高 | ❌ |
| Row-Level Security | 中 | 低 | 中 | ⚠️ 備選 |

---

## 建議實作: RBAC + 資料過濾

### 1. 資源擁有權模型

```typescript
// common/decorators/resource-owner.decorator.ts
export interface ResourceOwnership {
  // 資源擁有者 (創建者)
  ownerId: string;
  // 組織/公司 (多租戶)
  organizationId?: string;
  // 專案成員 (協作權限)
  memberIds?: string[];
  // 可見性層級
  visibility: 'private' | 'team' | 'organization' | 'public';
}
```

### 2. 存取規則定義

```typescript
// common/guards/resource-access.guard.ts
export function canAccess(
  user: AuthUser,
  resource: ResourceOwnership,
  action: 'read' | 'write' | 'delete'
): boolean {
  // Super Admin 可存取所有
  if (user.role === 'super_admin') return true;
  
  // 擁有者完全控制
  if (resource.ownerId === user.id) return true;
  
  // 成員可讀寫
  if (resource.memberIds?.includes(user.id)) {
    return action !== 'delete';
  }
  
  // 組織權限
  if (resource.organizationId === user.organizationId) {
    switch (resource.visibility) {
      case 'organization': return action === 'read';
      case 'team': return false;
      case 'private': return false;
      case 'public': return action === 'read';
    }
  }
  
  return resource.visibility === 'public' && action === 'read';
}
```

### 3. Repository 層過濾

```typescript
// modules/projects/projects.repository.ts
async findAllForUser(userId: string, userRole: string): Promise<Project[]> {
  const qb = this.createQueryBuilder('project');
  
  // 非 admin 添加過濾
  if (!['admin', 'super_admin'].includes(userRole)) {
    qb.where('project.ownerId = :userId', { userId })
      .orWhere(':userId = ANY(project.memberIds)', { userId })
      .orWhere("project.visibility = 'public'");
  }
  
  return qb.getMany();
}
```

---

## 遷移計畫

### Phase 1: 資料結構 (Week 1-2)
- [ ] 新增 `ownerId` 欄位到所有核心實體
- [ ] 新增 `memberIds` 陣列欄位
- [ ] 新增 `visibility` 列舉欄位
- [ ] Migration 腳本設定預設值

### Phase 2: Guard 實作 (Week 3-4)
- [ ] 實作 `ResourceAccessGuard`
- [ ] 更新所有 Controller 使用新 Guard
- [ ] 撰寫單元測試

### Phase 3: 前端適配 (Week 5-6)
- [ ] 更新 API 呼叫傳遞使用者 context
- [ ] 實作 UI 權限遮罩
- [ ] 處理 403 錯誤顯示

---

## 效能考量

1. **快取策略**: 使用 Redis 快取用戶權限
2. **批次驗證**: 列表頁使用批次權限檢查
3. **索引優化**: 確保 `ownerId`, `memberIds` 有索引

---

## 安全檢查清單

- [ ] 所有 UPDATE/DELETE 端點有 OwnershipGuard
- [ ] 列表 API 自動過濾非授權資源
- [ ] 審計日誌記錄權限拒絕事件
- [ ] 單元測試覆蓋權限邊界案例

---

## 結論

採用 RBAC + 資料過濾混合模式，在不大幅改動架構的前提下實現資源級權限控制。此方案平衡了開發成本和功能需求，並保留未來升級到完整 ABAC 的彈性。
