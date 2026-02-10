# 安全基线规范

版本：v1.0
日期：2026-02-03
状态：Active

---

## 1. 安全基线概述

本文档定义平台的安全基线要求，包括 SQL 注入防护、防爬虫策略和异常报警机制。

---

## 2. SQL 注入防护

### 防护原则

| 层级       | 防护措施                   |
| ---------- | -------------------------- |
| 参数化查询 | 所有 SQL 使用参数化/预编译 |
| ORM 使用   | 优先使用 ORM，避免原生 SQL |
| 输入校验   | 服务端校验所有输入         |
| 最小权限   | DB 用户最小必要权限        |

### DB 节点防护

```go
// Workspace DB 节点执行器
func (e *DBExecutor) Execute(ctx context.Context, config map[string]interface{}) error {
    // 1. SQL 语句白名单校验
    operation := config["operation"].(string)
    if !isAllowedOperation(operation) {
        return fmt.Errorf("operation not allowed: %s", operation)
    }

    // 2. 参数化查询
    query, args := buildParameterizedQuery(config)

    // 3. 执行前审计
    logDBOperation(ctx, operation, config["table"], args)

    // 4. 使用预编译语句
    stmt, err := db.PrepareContext(ctx, query)
    if err != nil {
        return err
    }
    defer stmt.Close()

    return stmt.ExecContext(ctx, args...)
}
```

### 危险操作限制

| 操作     | 限制                |
| -------- | ------------------- |
| DROP     | 禁止在 Runtime 执行 |
| TRUNCATE | 需显式授权          |
| ALTER    | 仅迁移脚本可用      |
| 多语句   | 禁止                |
| 注释     | 过滤 SQL 注释       |

---

## 3. 防爬虫策略

### 检测机制

| 检测维度 | 规则             |
| -------- | ---------------- |
| 请求频率 | 单 IP 120次/分钟 |
| UA 检测  | 识别已知爬虫 UA  |
| 行为分析 | 异常访问模式     |
| 指纹识别 | 浏览器指纹一致性 |

### 响应策略

| 风险等级 | 响应措施    |
| -------- | ----------- |
| 低风险   | 增加延迟    |
| 中风险   | 触发验证码  |
| 高风险   | 临时封禁 IP |
| 确认滥用 | 永久黑名单  |

### 实现示例

```go
// 反爬虫中间件
func AntiCrawlerMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        clientIP := c.ClientIP()
        ua := c.GetHeader("User-Agent")

        // 1. 检查黑名单
        if isBlacklisted(clientIP) {
            c.AbortWithStatusJSON(403, gin.H{"error": "access denied"})
            return
        }

        // 2. 检查已知爬虫 UA
        if isKnownCrawlerUA(ua) {
            recordSuspiciousActivity(clientIP, "known_crawler_ua")
        }

        // 3. 检查请求频率
        if isRateLimited(clientIP) {
            c.AbortWithStatusJSON(429, gin.H{
                "error": "rate limited",
                "retry_after": 60,
            })
            return
        }

        // 4. 记录请求
        recordRequest(clientIP, c.Request.URL.Path)

        c.Next()
    }
}
```

---

## 4. 异常报警机制

### 报警级别

| 级别        | 触发条件             | 响应时间 |
| ----------- | -------------------- | -------- |
| P0 Critical | 数据泄露、服务不可用 | 15 分钟  |
| P1 High     | 认证绕过、大规模攻击 | 30 分钟  |
| P2 Medium   | 可疑行为、频繁失败   | 2 小时   |
| P3 Low      | 轻微异常、配置问题   | 24 小时  |

### 监控指标

| 指标           | 阈值        | 报警级别 |
| -------------- | ----------- | -------- |
| 登录失败率     | >10%        | P2       |
| API 5xx 错误率 | >1%         | P1       |
| DB 连接失败    | >5次/分钟   | P1       |
| 请求延迟 P99   | >5s         | P2       |
| 认证失败突增   | >300%       | P1       |
| 异常 IP 访问   | >100次/分钟 | P2       |

### 报警渠道

| 级别  | 渠道                       |
| ----- | -------------------------- |
| P0/P1 | 电话 + 短信 + 邮件 + Slack |
| P2    | 短信 + 邮件 + Slack        |
| P3    | 邮件 + Slack               |

### 报警配置示例

```yaml
# alerting-rules.yaml
groups:
  - name: security-alerts
    rules:
      - alert: HighAuthFailureRate
        expr: rate(auth_failures_total[5m]) / rate(auth_attempts_total[5m]) > 0.1
        for: 5m
        labels:
          severity: P2
        annotations:
          summary: 'High authentication failure rate'

      - alert: SuspiciousIPActivity
        expr: rate(requests_total{suspicious="true"}[1m]) > 100
        for: 1m
        labels:
          severity: P2
        annotations:
          summary: 'Suspicious IP activity detected'

      - alert: SQLInjectionAttempt
        expr: increase(sql_injection_attempts_total[5m]) > 0
        for: 0m
        labels:
          severity: P1
        annotations:
          summary: 'SQL injection attempt detected'
```

---

## 5. 安全检查清单

### 部署前检查

- [ ] 所有数据库查询使用参数化
- [ ] 敏感数据已加密存储
- [ ] API 端点有认证和授权
- [ ] 输入校验覆盖所有用户输入
- [ ] 日志不包含敏感信息
- [ ] 错误消息不暴露内部细节

### 定期检查

- [ ] 依赖漏洞扫描（每周）
- [ ] 代码安全审计（每月）
- [ ] 渗透测试（每季度）
- [ ] 密钥轮换（每 90 天）
- [ ] 权限审计（每月）

---

## 变更记录

| 日期       | 版本 | 变更内容 | 作者           |
| ---------- | ---- | -------- | -------------- |
| 2026-02-03 | v1.0 | 初始版本 | AgentFlow Team |
