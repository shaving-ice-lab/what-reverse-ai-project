# 开发规范与代码标准

版本：v1.0
日期：2026-02-03
状态：Active

---

## 1. 后端模块分层规范

### 分层结构

```
apps/server/
├── cmd/                    # 入口
│   ├── server/            # API 服务入口
│   └── worker/            # Worker 入口
├── internal/              # 内部代码
│   ├── api/              # API 层
│   │   ├── handler/      # HTTP 处理器
│   │   ├── middleware/   # 中间件
│   │   └── server.go     # 服务器配置
│   ├── config/           # 配置管理
│   ├── domain/           # 领域模型
│   │   └── entity/       # 实体定义
│   ├── repository/       # 数据访问层
│   ├── service/          # 业务逻辑层
│   └── pkg/              # 内部工具包
│       ├── database/     # 数据库工具
│       ├── executor/     # 执行引擎
│       ├── logger/       # 日志工具
│       └── queue/        # 队列工具
├── config/               # 配置文件
└── migrations/           # 数据库迁移
```

### 层级职责

| 层级       | 职责                                | 依赖关系   |
| ---------- | ----------------------------------- | ---------- |
| Handler    | HTTP 请求处理、参数校验、响应格式化 | Service    |
| Service    | 业务逻辑、事务管理、跨仓库协调      | Repository |
| Repository | 数据访问、SQL 查询、缓存            | Entity     |
| Entity     | 数据结构定义                        | 无         |

### 代码规范

```go
// handler 层示例
func (h *AppHandler) Create(c *gin.Context) {
    var req CreateAppRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, ErrorResponse(err))
        return
    }

    app, err := h.appService.Create(c.Request.Context(), req)
    if err != nil {
        c.JSON(500, ErrorResponse(err))
        return
    }

    c.JSON(201, SuccessResponse(app))
}

// service 层示例
func (s *AppService) Create(ctx context.Context, req CreateAppRequest) (*App, error) {
    // 业务校验
    if err := s.validateCreate(ctx, req); err != nil {
        return nil, err
    }

    // 创建实体
    app := &entity.App{
        WorkspaceID: req.WorkspaceID,
        Name:        req.Name,
        Slug:        req.Slug,
    }

    // 事务处理
    if err := s.repo.Create(ctx, app); err != nil {
        return nil, err
    }

    return app, nil
}
```

---

## 2. 前端组件规范与目录结构

### 目录结构

```
apps/web/src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 认证相关页面
│   ├── (dashboard)/       # 仪表盘页面
│   │   └── workspaces/
│   │       └── [workspaceId]/
│   │           └── apps/
│   │               └── [appId]/
│   └── (unauth)/          # 公开页面
├── components/            # 组件
│   ├── ui/               # 基础 UI 组件
│   ├── editor/           # 编辑器组件
│   ├── workspace/        # 空间相关组件
│   └── app/              # 应用相关组件
├── hooks/                # 自定义 Hooks
├── lib/                  # 工具库
│   ├── api/             # API 客户端
│   ├── utils/           # 工具函数
│   └── constants/       # 常量定义
├── stores/              # 状态管理
└── types/               # TypeScript 类型
```

### 组件规范

```tsx
// 组件文件结构
// components/app/app-card.tsx

import { FC } from 'react'
import { cn } from '@/lib/utils'

// Props 接口
interface AppCardProps {
  app: App
  onEdit?: () => void
  className?: string
}

// 组件实现
export const AppCard: FC<AppCardProps> = ({ app, onEdit, className }) => {
  return (
    <div className={cn('rounded-lg border p-4', className)}>
      <h3 className="font-semibold">{app.name}</h3>
      <p className="text-sm text-muted-foreground">{app.description}</p>
      {onEdit && (
        <Button onClick={onEdit} variant="outline" size="sm">
          编辑
        </Button>
      )}
    </div>
  )
}

// 默认导出
export default AppCard
```

### 命名规范

| 类型      | 规范             | 示例           |
| --------- | ---------------- | -------------- |
| 组件文件  | kebab-case       | `app-card.tsx` |
| 组件名    | PascalCase       | `AppCard`      |
| Hook 文件 | kebab-case       | `use-app.ts`   |
| Hook 名   | camelCase        | `useApp`       |
| 工具函数  | camelCase        | `formatDate`   |
| 常量      | UPPER_SNAKE_CASE | `API_BASE_URL` |

---

## 3. API/DB 变更评审流程

### 变更分类

| 分类     | 说明                     | 评审要求           |
| -------- | ------------------------ | ------------------ |
| 重大变更 | 不兼容改动、数据模型变更 | 架构评审 + 2人审批 |
| 一般变更 | 新增字段、新增接口       | 1人审批            |
| 小型变更 | Bug 修复、文档更新       | 1人审批            |

### 评审流程

```
1. 提交变更
   │ → 创建 PR，填写变更说明
   ▼
2. 自动检查
   │ → lint、test、migration check
   ▼
3. 代码评审
   │ → Code Owner 审批
   ▼
4. 合并
   │ → Squash merge
   ▼
5. 部署
   │ → 灰度发布
```

### API 变更清单

```markdown
## API 变更清单

### 新增/修改接口

- [ ] 接口文档已更新
- [ ] 请求/响应示例已添加
- [ ] 错误码已定义
- [ ] 权限要求已标注
- [ ] 兼容性影响已评估

### 数据库变更

- [ ] 迁移脚本已编写
- [ ] 回滚脚本已准备
- [ ] 索引影响已评估
- [ ] 数据兼容性已测试
- [ ] 执行计划已审核
```

### PR 模板

```markdown
## 变更类型

- [ ] 新功能
- [ ] Bug 修复
- [ ] 重构
- [ ] 文档

## 变更说明

<!-- 简要描述变更内容 -->

## 测试说明

<!-- 如何测试这个变更 -->

## 检查清单

- [ ] 代码符合规范
- [ ] 单元测试通过
- [ ] 文档已更新
- [ ] 无安全风险
```

---

## 4. 代码质量要求

### 代码审查重点

| 维度     | 检查项             |
| -------- | ------------------ |
| 正确性   | 逻辑正确、边界处理 |
| 可读性   | 命名清晰、注释充分 |
| 可维护性 | 模块化、低耦合     |
| 性能     | N+1 查询、内存泄漏 |
| 安全性   | 注入防护、权限检查 |

### 自动化检查

```yaml
# .github/workflows/ci.yml
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Lint
        run: pnpm lint

      - name: Type Check
        run: pnpm typecheck

      - name: Test
        run: pnpm test

      - name: Security Scan
        run: npm audit
```

---

## 变更记录

| 日期       | 版本 | 变更内容 | 作者           |
| ---------- | ---- | -------- | -------------- |
| 2026-02-03 | v1.0 | 初始版本 | AgentFlow Team |
