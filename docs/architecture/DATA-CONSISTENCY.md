# 数据一致性与幂等性规范

版本：v1.0
日期：2026-02-03
状态：Active

---

## 1. 关键写操作幂等策略

### 1.1 幂等性要求

| 操作         | 幂等性要求 | 实现方式        |
| ------------ | ---------- | --------------- |
| 创建 App     | 必须       | Idempotency-Key |
| 发布 App     | 必须       | 状态检查 + 锁   |
| DB Provision | 必须       | 状态机          |
| 执行触发     | 可选       | Request-ID      |
| 支付         | 必须       | 交易 ID         |

### 1.2 Idempotency-Key 实现

```go
// 中间件实现
func IdempotencyMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        key := c.GetHeader("Idempotency-Key")
        if key == "" {
            key = c.GetHeader("X-Request-Id")
        }

        if key != "" {
            // 检查是否已处理
            result, exists := cache.Get("idem:" + key)
            if exists {
                // 返回缓存的响应
                c.JSON(result.StatusCode, result.Body)
                c.Abort()
                return
            }
        }

        c.Set("idempotency_key", key)
        c.Next()

        // 缓存响应（仅成功请求）
        if key != "" && c.Writer.Status() < 400 {
            cache.Set("idem:"+key, &IdempotencyResult{
                StatusCode: c.Writer.Status(),
                Body:       c.Get("response_body"),
            }, 24*time.Hour)
        }
    }
}
```

### 1.3 状态机保护

```go
// App 发布状态机
type AppStatus string
const (
    AppStatusDraft      AppStatus = "draft"
    AppStatusPublishing AppStatus = "publishing"  // 中间状态
    AppStatusPublished  AppStatus = "published"
)

func (s *AppService) Publish(ctx context.Context, appID string) error {
    // 乐观锁 + 状态检查
    result := s.db.Exec(`
        UPDATE what_reverse_apps
        SET status = ?, updated_at = NOW()
        WHERE id = ? AND status = ?
    `, AppStatusPublishing, appID, AppStatusDraft)

    if result.RowsAffected == 0 {
        return ErrInvalidStateTransition
    }

    // 执行发布逻辑
    if err := s.doPublish(ctx, appID); err != nil {
        // 回滚状态
        s.db.Exec(`UPDATE what_reverse_apps SET status = ? WHERE id = ?`,
            AppStatusDraft, appID)
        return err
    }

    // 完成发布
    s.db.Exec(`UPDATE what_reverse_apps SET status = ? WHERE id = ?`,
        AppStatusPublished, appID)
    return nil
}
```

---

## 2. 事务边界与一致性层级

### 2.1 事务边界

| 操作       | 事务范围         | 隔离级别       |
| ---------- | ---------------- | -------------- |
| 创建 App   | App + Version    | READ COMMITTED |
| 发布 App   | App + Policy     | SERIALIZABLE   |
| 执行工作流 | Execution + Logs | READ COMMITTED |
| 计费扣减   | Quota + Event    | SERIALIZABLE   |

### 2.2 跨服务一致性

```
服务间通信模式
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  App 服务   │ ──► │  Runtime    │ ──► │  Execution  │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      ▼                   ▼                   ▼
  同步调用            异步消息            最终一致

一致性保证：
- App 创建：强一致（单库事务）
- 执行触发：最终一致（消息队列）
- 计费扣减：强一致（分布式锁）
```

### 2.3 一致性层级定义

| 层级     | 说明           | 适用场景     |
| -------- | -------------- | ------------ |
| 强一致   | 写入后立即可读 | 核心业务数据 |
| 会话一致 | 同一会话内一致 | 用户操作反馈 |
| 最终一致 | 延迟后一致     | 统计、日志   |

---

## 3. 异步更新的最终一致性说明

### 3.1 异步场景

| 场景     | 异步方式 | 一致性保证     |
| -------- | -------- | -------------- |
| 执行日志 | 批量写入 | 1s 内最终一致  |
| 用量统计 | 定时聚合 | 1m 内最终一致  |
| 缓存刷新 | 事件驱动 | 30s 内最终一致 |
| 搜索索引 | 异步同步 | 5s 内最终一致  |

### 3.2 最终一致性处理

```go
// 事件驱动的缓存刷新
type CacheInvalidator struct {
    redis *redis.Client
}

func (c *CacheInvalidator) OnAppUpdated(ctx context.Context, appID string) {
    // 发布失效事件
    c.redis.Publish(ctx, "cache:invalidate", map[string]string{
        "type": "app",
        "id":   appID,
    })
}

// 订阅者
func (c *CacheInvalidator) Subscribe(ctx context.Context) {
    pubsub := c.redis.Subscribe(ctx, "cache:invalidate")
    for msg := range pubsub.Channel() {
        var event map[string]string
        json.Unmarshal([]byte(msg.Payload), &event)

        // 删除缓存
        c.redis.Del(ctx, fmt.Sprintf("%s:%s", event["type"], event["id"]))
    }
}
```

---

## 4. 数据校验与修复任务

### 4.1 校验任务清单

| 任务         | 频率   | 检查内容           |
| ------------ | ------ | ------------------ |
| 孤儿数据检查 | 每日   | App 没有 Workspace |
| 状态一致性   | 每小时 | Execution 状态异常 |
| 配额校验     | 每日   | 用量与记录一致     |
| 关系完整性   | 每周   | 外键关系完整       |

### 4.2 检查脚本

```sql
-- 孤儿 App 检查
SELECT a.id, a.name
FROM what_reverse_apps a
LEFT JOIN what_reverse_workspaces w ON a.workspace_id = w.id
WHERE w.id IS NULL;

-- 执行状态异常检查
SELECT id, status, started_at
FROM what_reverse_executions
WHERE status = 'running'
  AND started_at < NOW() - INTERVAL 1 HOUR;

-- 配额校验
SELECT w.id,
       w.quota_used_requests,
       COUNT(*) as actual_requests
FROM what_reverse_workspaces w
JOIN what_reverse_executions e ON e.workspace_id = w.id
WHERE e.created_at >= DATE_TRUNC('month', NOW())
GROUP BY w.id
HAVING w.quota_used_requests != COUNT(*);
```

### 4.3 修复脚本

```sql
-- 修复孤儿 App（软删除）
UPDATE what_reverse_apps a
SET deleted_at = NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM what_reverse_workspaces w
    WHERE w.id = a.workspace_id
);

-- 修复僵尸执行
UPDATE what_reverse_executions
SET status = 'failed',
    error_message = 'System timeout',
    completed_at = NOW()
WHERE status = 'running'
  AND started_at < NOW() - INTERVAL 1 HOUR;
```

---

## 5. 双写期间一致性检测

### 5.1 双写策略

```
双写期间数据流
┌─────────────┐     ┌─────────────┐
│   旧路径    │     │   新路径    │
│ (user_id)  │     │(workspace_id)│
└─────────────┘     └─────────────┘
       │                   │
       ▼                   ▼
   ┌───────────────────────────┐
   │        比对服务           │
   │   检测数据一致性          │
   └───────────────────────────┘
```

### 5.2 一致性检测

```go
// 双写一致性检测
func (s *ConsistencyChecker) Check(ctx context.Context) error {
    // 读取新旧路径数据
    oldData, _ := s.oldRepo.List(ctx)
    newData, _ := s.newRepo.List(ctx)

    // 建立索引
    oldMap := make(map[string]*Data)
    for _, d := range oldData {
        oldMap[d.ID] = d
    }

    // 比对
    var inconsistencies []Inconsistency
    for _, d := range newData {
        old, exists := oldMap[d.ID]
        if !exists {
            inconsistencies = append(inconsistencies, Inconsistency{
                ID:   d.ID,
                Type: "missing_in_old",
            })
            continue
        }

        if !reflect.DeepEqual(old, d) {
            inconsistencies = append(inconsistencies, Inconsistency{
                ID:   d.ID,
                Type: "data_mismatch",
                Old:  old,
                New:  d,
            })
        }
    }

    // 记录不一致
    if len(inconsistencies) > 0 {
        s.reportInconsistencies(inconsistencies)
    }

    return nil
}
```

### 5.3 修复流程

1. **检测**：定时任务扫描不一致数据
2. **报告**：生成不一致报告
3. **分析**：确定以哪边为准
4. **修复**：同步数据
5. **验证**：再次检测确认

---

## 变更记录

| 日期       | 版本 | 变更内容 | 作者           |
| ---------- | ---- | -------- | -------------- |
| 2026-02-03 | v1.0 | 初始版本 | AgentFlow Team |
