# Admin 运维手册

## 概述

本文档提供 Admin 应用的日常运维指南，包括监控、故障排查、性能优化等内容。

---

## 1. 系统架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   CDN (边缘)    │────▶│  Admin 前端     │────▶│  API Gateway    │
│  CloudFlare     │     │  Next.js SSR    │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                        ┌────────────────────────────────┼────────────────────────────────┐
                        │                                │                                │
                        ▼                                ▼                                ▼
               ┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
               │   Auth Service  │             │  Admin Service  │             │  Core Services  │
               │                 │             │  /api/v1/admin  │             │                 │
               └─────────────────┘             └─────────────────┘             └─────────────────┘
```

### 服务依赖

| 服务 | 端点 | 用途 |
|------|------|------|
| API Gateway | `api.agentflow.ai` | API 路由与认证 |
| Auth Service | `/auth/*` | 管理员认证 |
| Admin Service | `/admin/*` | 管理 API |
| Database | PostgreSQL | 数据存储 |
| Cache | Redis | 会话与缓存 |

---

## 2. 日常运维

### 2.1 健康检查

```bash
# 检查前端健康状态
curl -f https://admin.agentflow.ai/api/health

# 检查 API 健康状态
curl -f https://api.agentflow.ai/health

# 预期响应
{
  "status": "ok",
  "version": "0.1.0",
  "build_id": "20260203120000-abc1234",
  "timestamp": "2026-02-03T12:00:00Z"
}
```

### 2.2 日志查看

#### 应用日志

```bash
# CloudWatch (AWS)
aws logs filter-log-events \
  --log-group-name /agentflow/admin \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s000)

# 或使用 Datadog
# 在 Datadog 控制台搜索: service:admin env:production
```

#### 访问日志

```bash
# 查看最近的访问日志
aws logs filter-log-events \
  --log-group-name /agentflow/admin/access \
  --limit 100
```

### 2.3 性能监控

#### 关键指标

| 指标 | 正常范围 | 告警阈值 |
|------|----------|----------|
| CPU 使用率 | < 60% | > 80% |
| 内存使用率 | < 70% | > 85% |
| 请求延迟 P50 | < 200ms | > 500ms |
| 请求延迟 P95 | < 1s | > 2s |
| 错误率 | < 0.1% | > 1% |

#### 监控命令

```bash
# 查看当前实例状态
aws ecs describe-services \
  --cluster agentflow-prod \
  --services admin

# 查看最近的指标
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=admin \
  --start-time $(date -d '1 hour ago' -Iseconds) \
  --end-time $(date -Iseconds) \
  --period 300 \
  --statistics Average
```

---

## 3. 故障排查

### 3.1 常见问题

#### 问题：页面加载缓慢

**排查步骤：**

1. 检查 CDN 缓存状态
   ```bash
   curl -I https://admin.agentflow.ai | grep -i cache
   ```

2. 检查 API 响应时间
   ```bash
   curl -w "@curl-format.txt" -o /dev/null -s https://api.agentflow.ai/admin/health
   ```

3. 检查数据库连接
   ```bash
   # 查看数据库连接池状态
   curl https://api.agentflow.ai/admin/system/health | jq '.database'
   ```

**解决方案：**
- 刷新 CDN 缓存
- 检查是否有慢查询
- 扩容应用实例

#### 问题：登录失败

**排查步骤：**

1. 检查认证服务状态
   ```bash
   curl https://api.agentflow.ai/auth/health
   ```

2. 检查用户会话
   ```bash
   # 查看 Redis 会话
   redis-cli keys "session:admin:*" | head -10
   ```

3. 查看认证日志
   ```bash
   # 搜索认证错误
   grep "auth error" /var/log/admin/app.log | tail -50
   ```

**解决方案：**
- 清理过期会话
- 重置用户密码
- 检查 2FA 配置

#### 问题：API 返回 500 错误

**排查步骤：**

1. 查看错误日志
   ```bash
   grep "500" /var/log/admin/access.log | tail -20
   ```

2. 检查服务健康
   ```bash
   curl https://api.agentflow.ai/admin/system/health
   ```

3. 检查数据库状态
   ```bash
   psql -h $DB_HOST -U admin -c "SELECT 1"
   ```

**解决方案：**
- 重启服务
- 检查数据库连接
- 回滚最近变更

### 3.2 紧急响应

#### 服务完全不可用

1. **立即行动：**
   - 通知 On-call 团队
   - 检查基础设施状态
   - 准备回滚

2. **排查顺序：**
   ```bash
   # 1. 检查 DNS
   dig admin.agentflow.ai

   # 2. 检查负载均衡器
   aws elbv2 describe-target-health --target-group-arn $TG_ARN

   # 3. 检查容器状态
   aws ecs describe-tasks --cluster agentflow-prod --tasks $(aws ecs list-tasks --cluster agentflow-prod --service-name admin --query 'taskArns[]' --output text)
   ```

3. **回滚步骤：**
   - 在 GitHub Actions 触发回滚
   - 或手动部署上一个稳定版本

---

## 4. 维护操作

### 4.1 定期维护

#### 每日检查

- [ ] 检查错误日志
- [ ] 检查性能指标
- [ ] 检查磁盘空间
- [ ] 检查备份状态

#### 每周维护

- [ ] 清理过期日志
- [ ] 更新依赖（安全补丁）
- [ ] 审计用户权限
- [ ] 检查 SSL 证书有效期

#### 每月维护

- [ ] 安全扫描
- [ ] 性能基线对比
- [ ] 容量规划评估
- [ ] 灾备演练

### 4.2 数据库维护

```bash
# 清理过期审计日志（保留 90 天）
psql -h $DB_HOST -U admin -d agentflow <<EOF
DELETE FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '90 days';
EOF

# 更新统计信息
psql -h $DB_HOST -U admin -d agentflow -c "ANALYZE;"

# 检查表大小
psql -h $DB_HOST -U admin -d agentflow <<EOF
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;
EOF
```

### 4.3 缓存维护

```bash
# 清理指定前缀的缓存
redis-cli keys "admin:cache:*" | xargs redis-cli del

# 查看缓存统计
redis-cli info stats | grep -E "keyspace|hit|miss"
```

---

## 5. 扩容与缩容

### 5.1 自动扩容配置

```yaml
# 扩容策略
ScalingPolicy:
  MinCapacity: 2
  MaxCapacity: 10
  TargetCPUUtilization: 70
  ScaleOutCooldown: 300
  ScaleInCooldown: 600
```

### 5.2 手动扩容

```bash
# 增加实例数
aws ecs update-service \
  --cluster agentflow-prod \
  --service admin \
  --desired-count 5

# 查看扩容状态
aws ecs describe-services \
  --cluster agentflow-prod \
  --services admin \
  --query 'services[0].deployments'
```

---

## 6. 安全运维

### 6.1 访问审计

```bash
# 查看管理员登录记录
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.agentflow.ai/admin/audit-logs?action=admin.login&limit=50"

# 查看敏感操作记录
curl -H "Authorization: Bearer $TOKEN" \
  "https://api.agentflow.ai/admin/audit-logs?action=user.status_change&limit=50"
```

### 6.2 密钥轮换

```bash
# 轮换 API 密钥
aws secretsmanager rotate-secret \
  --secret-id agentflow/admin/api-key

# 轮换数据库密码
aws secretsmanager rotate-secret \
  --secret-id agentflow/admin/db-password
```

### 6.3 安全扫描

```bash
# 运行依赖安全扫描
pnpm audit

# 运行 OWASP 扫描
docker run -v $(pwd):/zap/wrk/:rw \
  owasp/zap2docker-stable zap-baseline.py \
  -t https://admin.agentflow.ai
```

---

## 7. 联系人与升级路径

### 7.1 值班联系人

| 级别 | 联系人 | 联系方式 | 响应时间 |
|------|--------|----------|----------|
| L1 | On-call 工程师 | oncall@agentflow.ai | 15 分钟 |
| L2 | 技术负责人 | tech-lead@agentflow.ai | 30 分钟 |
| L3 | CTO | cto@agentflow.ai | 1 小时 |

### 7.2 升级路径

```
问题发生
    │
    ▼
L1 On-call 工程师
    │ (15分钟内无法解决)
    ▼
L2 技术负责人
    │ (30分钟内无法解决 或 影响范围扩大)
    ▼
L3 CTO
```

### 7.3 通知模板

#### 事件通知

```
【Admin 服务告警】
时间：2026-02-03 12:00:00 UTC
级别：Warning / Critical
描述：[简要描述问题]
影响：[影响范围]
状态：调查中 / 已解决
处理人：[处理人]
```

#### 发布通知

```
【Admin 发布通知】
版本：v0.1.0 -> v0.2.0
时间：2026-02-03 14:00:00 UTC
变更：
- 新增用户批量管理功能
- 修复若干已知问题
风险：低
回滚方案：已准备
```
