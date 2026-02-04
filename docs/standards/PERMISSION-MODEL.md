# Workspace 级权限模型

版本：v1.0
日期：2026-02-03
状态：Active

---

## 1. 权限模型概述

### 设计原则

- **Workspace 隔离**：权限以 Workspace 为边界，跨 Workspace 不可访问
- **角色分层**：Owner > Admin > Member，权限递减
- **最小权限**：默认最小权限，按需授予
- **可审计**：所有权限变更记录审计日志

### 权限层次结构

```
Platform Level (系统级)
└── Workspace Level (空间级)
    └── Resource Level (资源级)
        ├── App
        ├── Workflow
        ├── API Key
        └── Database
```

---

## 2. 角色定义

### 系统角色

| 角色 | 权限范围 | 说明 |
|-----|---------|------|
| Owner | 完全控制 | Workspace 创建者，唯一拥有者 |
| Admin | 管理权限 | 可管理成员和资源 |
| Member | 编辑权限 | 可创建和编辑资源 |
| Viewer | 只读权限 | 仅可查看资源（预留） |

### 权限矩阵

| 权限点 | Owner | Admin | Member | Viewer |
|-------|-------|-------|--------|--------|
| workspace_admin | ✓ | - | - | - |
| members_manage | ✓ | ✓ | - | - |
| billing_manage | ✓ | ✓ | - | - |
| apps_create | ✓ | ✓ | ✓ | - |
| app_edit | ✓ | ✓ | ✓ | - |
| app_publish | ✓ | ✓ | - | - |
| app_view_metrics | ✓ | ✓ | ✓ | ✓ |
| logs_view | ✓ | ✓ | ✓ | ✓ |
| plan_view | ✓ | ✓ | ✓ | ✓ |
| plan_manage | ✓ | ✓ | - | - |

---

## 3. 权限检查点

### API 端点权限

| 端点 | 所需权限 |
|-----|---------|
| `GET /workspaces` | 成员可见 |
| `GET /workspaces/:id` | 成员可见 |
| `PATCH /workspaces/:id` | workspace_admin |
| `GET /workspaces/:id/members` | members_manage |
| `POST /workspaces/:id/members` | members_manage |
| `PATCH /workspaces/:id/members/:mid` | members_manage |
| `GET /apps` | app_view_metrics |
| `POST /apps` | apps_create |
| `GET /apps/:id` | app_view_metrics |
| `PATCH /apps/:id` | app_edit |
| `POST /apps/:id/publish` | app_publish |
| `POST /apps/:id/rollback` | app_publish |
| `GET /apps/:id/access-policy` | app_edit |
| `PATCH /apps/:id/access-policy` | app_publish |

### 前端权限控制

```typescript
// PermissionGate 组件示例
<PermissionGate permission="app_publish">
  <PublishButton />
</PermissionGate>

// usePermission hook
const { can, cannot } = usePermission();
if (can('members_manage')) {
  // 显示成员管理入口
}
```

---

## 4. 协作场景

### 团队协作

| 场景 | 所需角色 |
|-----|---------|
| 创建新应用 | Member+ |
| 编辑工作流 | Member+ |
| 发布应用 | Admin+ |
| 邀请成员 | Admin+ |
| 变更套餐 | Admin+ |
| 删除 Workspace | Owner |

### 权限转移

| 场景 | 操作 | 限制 |
|-----|------|-----|
| Owner 转让 | Owner → 指定成员 | 需 Admin+ |
| 角色提升 | Admin 提升 Member | 仅 Owner |
| 角色降级 | Owner 降级 Admin | 仅 Owner |

---

## 5. 实现规范

### 后端中间件

```go
// 权限检查中间件
func RequirePermission(perms ...string) gin.HandlerFunc {
    return func(c *gin.Context) {
        workspaceID := c.Param("workspaceId")
        userID := c.GetString("user_id")
        
        member, err := repo.GetWorkspaceMember(workspaceID, userID)
        if err != nil {
            c.AbortWithStatusJSON(403, gin.H{"error": "access denied"})
            return
        }
        
        if !member.HasAnyPermission(perms) {
            c.AbortWithStatusJSON(403, gin.H{"error": "insufficient permissions"})
            return
        }
        
        c.Next()
    }
}
```

### 审计要求

- 所有权限变更记录 audit_log
- 包含 actor_user_id、action、target_type、target_id
- 保留至少 90 天

---

## 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2026-02-03 | v1.0 | 初始版本 | AgentFlow Team |
