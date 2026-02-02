# SLO/SLI 定義 (OPS-001)

> **版本**: 1.0 | **更新日期**: 2026-02-02

---

## 服務層級指標 (SLI)

### 可用性 SLI
```
Availability = (成功請求數 / 總請求數) × 100%
```
- **排除**: 健康檢查 `/health`, `/health/db`
- **成功定義**: HTTP 2xx, 3xx (非 4xx/5xx)

### 延遲 SLI
```
Latency p95 = 95th percentile response time
Latency p99 = 99th percentile response time
```
- **測量點**: 從 Cloud Run 收到請求到回應

### 錯誤率 SLI
```
Error Rate = (5xx 錯誤數 / 總請求數) × 100%
```

---

## 服務層級目標 (SLO)

| 指標 | 目標 | 測量週期 | 告警閾值 |
|:-----|:-----|:---------|:---------|
| **可用性** | 99.9% | 滾動 30 天 | < 99.5% |
| **延遲 p95** | < 500ms | 滾動 7 天 | > 800ms |
| **延遲 p99** | < 1000ms | 滾動 7 天 | > 1500ms |
| **錯誤率** | < 0.1% | 滾動 24 小時 | > 0.5% |

---

## 錯誤預算

### 月度錯誤預算
| SLO | 目標 | 允許停機時間 (30天) |
|:----|:-----|:--------------------|
| 99.9% | 可用性 | 43.2 分鐘 |
| 99.5% | 可用性 | 3.6 小時 |
| 99.0% | 可用性 | 7.2 小時 |

### 錯誤預算政策
1. 預算 > 50%: 正常開發迭代
2. 預算 20-50%: 增加穩定性工作比例
3. 預算 < 20%: 暫停新功能，專注可靠性
4. 預算耗盡: 全員投入穩定性

---

## Cloud Monitoring 配置

### 告警策略
```yaml
# 可用性告警
alertPolicy:
  displayName: "API Availability Alert"
  conditions:
    - displayName: "High Error Rate"
      conditionThreshold:
        filter: 'resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_count"'
        aggregations:
          - alignmentPeriod: 300s
            perSeriesAligner: ALIGN_RATE
        comparison: COMPARISON_GT
        thresholdValue: 0.005  # 0.5%
  notificationChannels:
    - projects/senteng-erp-pro/notificationChannels/slack-ops
```

### 儀表板 Widget
1. **Request Rate** - 請求/秒
2. **Error Rate %** - 錯誤百分比
3. **Latency Heatmap** - 延遲分布
4. **Active Instances** - 容器實例數
5. **Memory/CPU Usage** - 資源使用

---

## 監控端點

| 端點 | 用途 | 檢查頻率 |
|:-----|:-----|:---------|
| `/health` | 基本存活 | 10s |
| `/health/db` | 資料庫連線 | 30s |
| `/api/v1/auth/permissions` | 認證服務 | 60s |

---

## 升級流程

| SLI 狀態 | 動作 |
|:---------|:-----|
| p95 > 500ms 持續 5 分鐘 | Slack 通知 |
| 可用性 < 99.5% 持續 10 分鐘 | PagerDuty On-call |
| 可用性 < 99.0% | Incident Commander 介入 |
