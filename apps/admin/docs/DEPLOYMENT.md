# Admin 部署指南

## 概述

Admin 应用部署在独立域名 `admin.agentflow.ai`，与主应用 `apps/web` 分离部署。

## 环境配置

### 环境变量

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `NEXT_PUBLIC_API_URL` | 后端 API 地址 | `https://api.agentflow.ai` |
| `NEXT_PUBLIC_ADMIN_URL` | Admin 前端地址 | `https://admin.agentflow.ai` |
| `NEXT_PUBLIC_BUILD_ID` | 构建标识 | `20260203120000-abc1234` |
| `ADMIN_AUTH_SECRET` | 认证密钥 | `(由 CI 注入)` |

### 环境列表

| 环境 | 域名 | 用途 |
|------|------|------|
| Development | `localhost:3002` | 本地开发 |
| Staging | `admin-staging.agentflow.ai` | 测试验收 |
| Production | `admin.agentflow.ai` | 生产环境 |

## 部署流程

### 1. 自动部署（推荐）

通过 GitHub Actions 自动部署：

```bash
# 触发 staging 部署
git push origin main

# 触发 production 部署
# 在 GitHub Actions 页面手动触发，选择 environment: production
```

### 2. 手动部署

```bash
# 1. 安装依赖
pnpm install --frozen-lockfile

# 2. 构建
pnpm --filter @agentflow/admin build

# 3. 启动
pnpm --filter @agentflow/admin start
```

## 发布检查清单

### 发布前检查

- [ ] **代码审查**
  - [ ] PR 已通过代码审查
  - [ ] 无未解决的评论
  - [ ] 变更符合设计规范

- [ ] **测试通过**
  - [ ] 单元测试通过 (`pnpm test`)
  - [ ] E2E 测试通过 (`pnpm test:e2e`)
  - [ ] 安全测试通过 (`pnpm test:security`)
  - [ ] 权限测试通过 (`pnpm test:permission`)

- [ ] **构建验证**
  - [ ] 构建成功无警告
  - [ ] Bundle 大小在阈值内
  - [ ] 无 TypeScript 错误

- [ ] **权限审计**
  - [ ] 新增 API 端点已配置权限
  - [ ] 敏感操作已添加审计日志
  - [ ] 无越权访问风险

- [ ] **配置检查**
  - [ ] 环境变量已配置
  - [ ] Feature Flags 已确认
  - [ ] 数据库迁移已执行（如有）

### 发布时检查

- [ ] **Staging 验证**
  - [ ] Staging 部署成功
  - [ ] 核心功能手动验证通过
  - [ ] 无控制台错误
  - [ ] 性能指标正常

- [ ] **Production 部署**
  - [ ] 已获得发布批准
  - [ ] 低峰期部署
  - [ ] 回滚方案已准备

### 发布后检查

- [ ] **监控验证**
  - [ ] 错误率在阈值内
  - [ ] 响应时间正常
  - [ ] 无告警触发

- [ ] **功能验证**
  - [ ] 登录功能正常
  - [ ] 核心页面可访问
  - [ ] API 响应正常

## 回滚策略

### 自动回滚触发条件

1. 部署后 5 分钟内错误率超过 5%
2. 健康检查连续失败 3 次
3. P95 响应时间超过 3 秒

### 手动回滚步骤

```bash
# 1. 确认需要回滚的版本
git log --oneline -10

# 2. 在 GitHub Actions 触发回滚
# 或手动部署上一个稳定版本

# 3. 验证回滚成功
curl -f https://admin.agentflow.ai/api/health
```

## 监控与告警

### 关键指标

| 指标 | 阈值 | 告警级别 |
|------|------|----------|
| 错误率 | > 1% | Warning |
| 错误率 | > 5% | Critical |
| P95 响应时间 | > 2s | Warning |
| P99 响应时间 | > 5s | Critical |
| 健康检查失败 | 连续 2 次 | Warning |
| 健康检查失败 | 连续 5 次 | Critical |

### 日志位置

- 应用日志：CloudWatch / Datadog
- 访问日志：CDN 日志
- 审计日志：`/admin/audit-logs`

## 故障排查

### 常见问题

#### 1. 构建失败

```bash
# 清理缓存重试
pnpm --filter @agentflow/admin clean
pnpm install
pnpm --filter @agentflow/admin build
```

#### 2. 部署后页面 404

- 检查 CDN 缓存是否已刷新
- 检查路由配置是否正确
- 检查 `next.config.ts` 配置

#### 3. API 请求失败

- 检查 `NEXT_PUBLIC_API_URL` 配置
- 检查 CORS 配置
- 检查认证 Token 是否有效

## 联系人

| 角色 | 联系方式 |
|------|----------|
| DevOps | devops@agentflow.ai |
| On-call | oncall@agentflow.ai |
| 安全团队 | security@agentflow.ai |
