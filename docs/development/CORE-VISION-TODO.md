# ReverseAI 核心愿景需求开发文档

版本：v2.0
日期：2026-02-11
状态：Draft

---

## 产品愿景

用户通过 **Workspace** 使用 **AI Agent**、**Agent Flow** 和 **AI Skills** 来构建完整的 Web 应用（例如：车队管理系统）。应用完整运行在平台上，并配有 **Supabase 风格的 Database 管理界面**。

### 核心链路

```
用户需求（"我要做一个车队管理系统"）
  → AI Agent 理解需求、规划应用架构
  → Agent Flow 自动生成 Workflow + UI + 数据模型
  → AI Skills 提供能力支撑（代码生成、数据建模、API 对接...）
  → Database（Supabase 风格管理）存储业务数据
  → 完整 Web 应用在 Workspace 内运行
```

---

## 现有基础设施盘点（已完成的可直接复用部分）

> 以下内容已在代码中实现，后续开发应直接基于这些模块构建，避免重复造轮子。

### 后端已有服务（`apps/server/internal/service/`）

| 服务                     | 文件                            | 核心能力                                                                                                                         |
| ------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| WorkspaceService         | `workspace_service.go`          | Workspace CRUD、成员管理、角色权限、版本管理、发布/回滚/归档、访问策略、Marketplace                                              |
| WorkspaceDatabaseService | `workspace_database_service.go` | 独立 DB Provision（每 workspace 一库）、密钥轮换、迁移、备份/恢复、Schema 迁移审批流程                                           |
| WorkspaceDBRuntime       | `workspace_db_runtime.go`       | 运行时 DB 连接池（`GetConnection`）、访问权限校验（`EnsureAccess`）                                                              |
| WorkspaceDBRoleService   | `workspace_db_role_service.go`  | DB 角色创建/轮换/撤销                                                                                                            |
| WorkflowService          | `workflow_service.go`           | Workflow CRUD、定义（nodes/edges/settings）、变量、触发器                                                                        |
| AIAssistantService       | `ai_assistant_service.go`       | 意图解析（`ParseIntent`）、Workflow 生成（`GenerateWorkflow`）、对话（`Chat`）、节点建议                                         |
| AIOutputProtocol         | `ai_output_protocol.go`         | AI 输出标准协议（`schema_version` / `workspace_metadata` / `workflow_definition` / `ui_schema` / `db_schema` / `access_policy`） |
| RuntimeService           | `runtime_service.go`            | 公开访问执行、匿名会话、降载                                                                                                     |
| AgentService             | `agent_service.go`              | Agent 发布/Fork/Use/评价                                                                                                         |
| ExecutionService         | `execution_service.go`          | Workflow 执行引擎                                                                                                                |

### 后端已有 API 路由（`apps/server/internal/api/server.go`）

**Workspace Database 已有路由**（挂载在 `/api/v1/workspaces/:id/database/*`）：

- `POST /database` → Provision（支持异步队列）
- `GET /database` → Get 状态
- `POST /database/rotate-secret` → 密钥轮换
- `POST /database/migrate` → 执行迁移
- `GET /database/migrations/plan` → 预览迁移计划
- `POST /database/migrations` → 提交迁移
- `GET /database/migrations/:migrationId` → 查看迁移
- `POST /database/migrations/:migrationId/approve` → 审批迁移
- `POST /database/migrations/:migrationId/reject` → 拒绝迁移
- `POST /database/migrations/:migrationId/execute` → 执行迁移
- `POST /database/backup` → 备份
- `POST /database/restore` → 恢复
- `POST /database/roles` → 创建角色
- `GET /database/roles` → 列出角色
- `POST /database/roles/:roleId/rotate` → 轮换角色密钥
- `POST /database/roles/:roleId/revoke` → 撤销角色

### 前端已有基础设施（`apps/web/src/`）

| 模块                 | 路径                                             | 说明                                                                                                                       |
| -------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Dashboard Layout     | `app/(dashboard)/layout.tsx`                     | Supabase 风格侧边栏 + 顶部导航，Workspace 切换器已实现（`activeWorkspaceId` / `workspaces[]` / `recentWorkspaceIds`）      |
| 页面布局组件         | `components/dashboard/page-layout.tsx`           | `PageContainer` / `PageHeader` / `PageWithSidebar` / `SidebarNavItem` / `SidebarNavGroup` / `EmptyState` / `TabNav`        |
| Supabase UI 组件     | `components/dashboard/supabase-ui.tsx`           | 已封装的 Supabase 风格 UI 基础组件                                                                                         |
| Workspace API Client | `lib/api/workspace.ts`                           | `Workspace` / `WorkspaceVersion`（含 `ui_schema` / `db_schema`）/ `WorkspaceDomain` / `WorkspaceQuota` 类型定义及 API 方法 |
| AI API Client        | `lib/api/ai.ts`                                  | AI 助手前端 API                                                                                                            |
| Workflow API Client  | `lib/api/workflow.ts`                            | Workflow CRUD / 导入导出 / 发布                                                                                            |
| 权限系统             | `lib/permissions.ts`                             | `workspaceRolePermissions` / `hasWorkspacePermission`                                                                      |
| App Builder 页面     | `app/(dashboard)/dashboard/app/[appId]/builder/` | 三栏布局基础框架已存在（`BuilderPageContent`）                                                                             |
| Workflow Editor      | `app/(dashboard)/dashboard/editor/[id]/`         | React Flow 可视化编辑器                                                                                                    |
| Design System        | `.cursor/skills/supabase-style/SKILL.md`         | 完整的 Supabase 风格色彩/组件/布局规范                                                                                     |

### 当前侧边栏导航项（`layout.tsx` L62-74）

```typescript
const mainNavItems = [
  { title: 'Overview', href: '/dashboard', icon: Activity },
  { title: 'Conversation', href: '/dashboard/conversations', icon: MessageSquare },
  { title: 'Workbench', href: '/dashboard/apps', icon: LayoutGrid },
  { title: 'Creative Workshop', href: '/dashboard/creative', icon: Palette },
  { title: 'Workflow (legacy)', href: '/dashboard/workflows', icon: Zap },
  { title: 'Template Gallery', href: '/dashboard/template-gallery', icon: LayoutGrid },
  { title: 'Store', href: '/dashboard/store', icon: Store },
  { title: 'Planning', href: '/dashboard/plans', icon: ListTodo },
  { title: 'Workspace', href: '/dashboard/workspaces', icon: LayoutGrid },
  { title: 'Ticket Management', href: '/dashboard/support-tickets', icon: LifeBuoy },
  { title: 'Support Settings', href: '/dashboard/support-settings', icon: Settings },
]
```

### 当前前端页面目录（35 个子目录）

achievements / activity / admin / analytics / api-keys / app / apps / billing / chat / conversations / creative / creator / data / editor / executions / export / favorites / feedback / files / getting-started / history / integrations / learn / logs / models / my-agents / notifications / plans / profile / quick-actions / referral / review / search / settings / ...

---

## 开发优先级

- **P0 — 核心必做**：没有这些功能产品无法体现核心愿景
- **P1 — 重要**：完善核心体验、提升可用性
- **P2 — 增强**：锦上添花、差异化竞争

---

## 模块一：Supabase 风格 Database 管理界面（P0）

> 后端 `WorkspaceDatabaseService` 和 `WorkspaceDBRuntime` 已完整实现，可直接通过 `WorkspaceDBRuntime.GetConnection()` 获取 Workspace 独立 DB 连接。本模块聚焦于前端 UI 和缺失的表/行级 API。

### 1.1 后端：表和行级 CRUD API

> 在现有 `workspace_database.go` handler 中扩展，路由挂载在 `workspaces.Group("/:id/database")` 下（参考 `server.go` L805-820 的注册模式）。

- [x] 新建 `apps/server/internal/service/workspace_db_query_service.go`：
  - [x] 定义 `WorkspaceDBQueryService` 接口：`ListTables` / `GetTableSchema` / `CreateTable` / `AlterTable` / `DropTable` / `QueryRows` / `InsertRow` / `UpdateRow` / `DeleteRows` / `ExecuteSQL` / `GetDatabaseStats` / `GetSchemaGraph`
  - [x] 实现时通过 `WorkspaceDBRuntime.GetConnection(ctx, workspaceID)` 获取连接，用 `INFORMATION_SCHEMA` 查询表结构
  - [x] SQL 安全沙箱：禁止 `DROP DATABASE` / `DROP SCHEMA` / `GRANT` / `CREATE USER`；查询超时 30s；结果行数上限 1000
- [x] 新建 `apps/server/internal/api/handler/workspace_db_query.go`，注册以下路由：
  - [x] `GET /:id/database/tables` → 返回表列表（表名、行数估算、大小、列数）
  - [x] `GET /:id/database/tables/:table/schema` → 返回列定义、主键、外键、索引、约束、DDL
  - [x] `POST /:id/database/tables` → 创建表（请求体：`name` / `columns[]` / `primary_key` / `indexes[]`）
  - [x] `PATCH /:id/database/tables/:table` → 修改表结构（add_columns / alter_columns / drop_columns / rename）
  - [x] `DELETE /:id/database/tables/:table` → 删除表（需确认参数 `confirm: true`）
  - [x] `GET /:id/database/tables/:table/rows` → 查询行（分页 `page`/`page_size`、排序 `order_by`/`order_dir`、过滤 `filters[]`）
  - [x] `POST /:id/database/tables/:table/rows` → 插入行
  - [x] `PATCH /:id/database/tables/:table/rows` → 更新行（根据主键）
  - [x] `DELETE /:id/database/tables/:table/rows` → 删除行（`ids[]`）
  - [x] `POST /:id/database/query` → 执行 SQL（请求体：`sql` / `params[]`；响应：`columns[]` / `rows[]` / `affected_rows` / `duration_ms`）
  - [x] `GET /:id/database/query/history` → 查询历史（最近 100 条，含 `sql` / `duration_ms` / `status` / `created_at`）
  - [x] `GET /:id/database/stats` → 数据库统计（表数量、总行数、总大小、连接数）
  - [x] `GET /:id/database/schema-graph` → 返回表关系图数据（节点=表，边=外键）
- [x] 在 `server.go` 中注册路由，复用现有 `workspaceDatabaseHandler` 的权限校验模式

### 1.2 前端：API Client 层

> 在现有 `apps/web/src/lib/api/` 目录下新建文件，遵循 `workspace.ts` 的 `request()` 调用模式。

- [x] 新建 `apps/web/src/lib/api/workspace-database.ts`：
  - [x] 类型定义：`DatabaseTable` / `TableColumn` / `TableRow` / `TableIndex` / `ForeignKey` / `QueryResult` / `QueryHistoryItem` / `DatabaseStats` / `SchemaGraphData`
  - [x] API 方法：`listTables(wsId)` / `getTableSchema(wsId, table)` / `createTable(wsId, req)` / `alterTable(wsId, table, req)` / `dropTable(wsId, table)` / `queryRows(wsId, table, params)` / `insertRow(wsId, table, data)` / `updateRow(wsId, table, data)` / `deleteRows(wsId, table, ids)` / `executeSQL(wsId, sql)` / `getQueryHistory(wsId)` / `getStats(wsId)` / `getSchemaGraph(wsId)`
- [x] 在 `apps/web/src/lib/api/index.ts` 中导出

### 1.3 前端：数据库概览页

> 新建页面目录，使用 `PageContainer` / `PageHeader` 布局组件（来自 `components/dashboard/page-layout.tsx`），遵循 Supabase 风格（`.cursor/skills/supabase-style/SKILL.md`）。

- [x] 新建 `apps/web/src/app/(dashboard)/dashboard/database/page.tsx`：
  - [x] 顶部：数据库状态卡片（名称、大小、状态 `ready/provisioning/failed`、创建时间）— 调用现有 `GET /workspaces/:id/database` API
  - [x] 存储用量进度条（已用 / 配额）— 复用 `WorkspaceQuota.storage` 数据
  - [x] 表列表卡片网格（表名 / 行数 / 大小 / 列数 / 最后更新时间）— 调用新 `listTables` API
  - [x] 快捷操作区：「打开 Table Editor」「打开 SQL Editor」「创建新表」「查看 ER 图」
  - [x] 最近 SQL 查询历史（最近 5 条）
- [x] 新建 `apps/web/src/app/(dashboard)/dashboard/database/layout.tsx`：
  - [x] 使用 `PageWithSidebar` 布局，侧边栏包含子导航：Overview / Tables / SQL Editor / Migrations / Roles
  - [x] 侧边栏底部显示数据库连接信息（host / db_name / 状态指示灯）

### 1.4 前端：Table Editor 页面

- [x] 新建 `apps/web/src/app/(dashboard)/dashboard/database/tables/page.tsx`：
  - [x] 左侧侧边栏：表列表（搜索框 + 列表），选中表高亮，底部「+新建表」按钮
  - [x] 右侧主区域：选中表的数据网格
- [x] 新建 `apps/web/src/components/database/table-grid.tsx`（数据网格核心组件）：
  - [x] 使用 TanStack Table（已有 `@tanstack/react-table` 依赖生态可用）构建
  - [x] 列头渲染：字段名 + 类型 Badge + 约束图标（🔑PK / 🔗FK / ❗NOT NULL）
  - [x] 分页控件（page / page_size 选择器 / 总行数显示）
  - [x] 排序切换（点击列头 ASC ↔ DESC ↔ 无）
  - [x] 行选择（checkbox 列 + 全选 / 取消全选）
  - [x] 工具栏：「+ 插入行」「删除选中」「过滤」「列可见性」「刷新」「导出 CSV」
- [x] 新建 `apps/web/src/components/database/table-filter.tsx`：
  - [x] 过滤条件构建器：列名下拉 + 操作符（= / != / > / < / LIKE / IS NULL / IS NOT NULL）+ 值输入
  - [x] 支持多条件组合（AND / OR）
  - [x] 过滤 Badge 展示（已激活的过滤条件显示为可删除 Badge）
- [x] 新建 `apps/web/src/components/database/cell-editor.tsx`：
  - [x] 根据列类型渲染不同编辑器：text input / number input / boolean toggle / date picker / JSON editor（textarea with syntax highlight）/ NULL 标记
  - [x] 编辑后标记为 dirty，批量保存或自动保存
- [x] 新建 `apps/web/src/components/database/row-detail-panel.tsx`：
  - [x] 点击行展开右侧面板，垂直展示所有字段（Label + Editor），适合宽列表
  - [x] 面板底部：保存 / 取消 / 删除本行

### 1.5 前端：表结构管理

- [x] 新建 `apps/web/src/components/database/create-table-dialog.tsx`：
  - [x] 表名输入 + 列定义器（动态添加列：名称 / 类型下拉 / 默认值 / NOT NULL toggle / UNIQUE toggle）
  - [x] 主键选择器（单列或复合主键）
  - [x] 预览生成的 `CREATE TABLE` SQL
  - [x] 提交调用 `createTable` API
- [x] 新建 `apps/web/src/components/database/table-schema-panel.tsx`：
  - [x] Tab 页：Columns / Indexes / Foreign Keys / DDL
  - [x] Columns Tab：列表展示所有列（名称 / 类型 / 默认值 / 约束），支持内联编辑、拖拽排序、添加列、删除列
  - [x] Indexes Tab：索引列表 + 创建索引对话框（索引名 / 列选择 / 类型选择）
  - [x] Foreign Keys Tab：外键列表 + 创建外键对话框（源列 → 目标表.目标列 / ON DELETE / ON UPDATE）
  - [x] DDL Tab：只读显示 `CREATE TABLE` 完整语句（代码高亮）

### 1.6 前端：SQL Editor 页面

- [x] 新建 `apps/web/src/app/(dashboard)/dashboard/database/sql/page.tsx`：
  - [x] 上半区：SQL 编辑器（textarea，可后续升级为 Monaco Editor），支持基础格式化
  - [x] 编辑器工具栏：「▶ Run」（Ctrl+Enter）/ 「Format」/ 「Clear」
  - [x] 下半区：查询结果区域（表格展示 / 错误信息 / 执行统计 `affected_rows` / `duration_ms`）
  - [x] 左侧面板（可折叠）：表列表快速参考 + 查询历史列表
- [x] 新建 `apps/web/src/components/database/sql-result-table.tsx`：
  - [x] 渲染 `QueryResult.columns[]` 和 `QueryResult.rows[]`
  - [x] 支持复制单元格内容
  - [x] 结果导出为 CSV / JSON

### 1.7 前端：数据库关系图（ER Diagram）

- [x] 新建 `apps/web/src/app/(dashboard)/dashboard/database/schema-graph/page.tsx`：
  - [x] 使用 React Flow（项目已有此依赖）渲染 ER 图
  - [x] 节点 = 表（表名 + 列列表），边 = 外键关系
  - [x] 支持拖拽布局、缩放、适应画布
  - [x] 点击表节点跳转到 Table Editor 对应表

### 1.8 前端：迁移管理页面

- [x] 新建 `apps/web/src/app/(dashboard)/dashboard/database/migrations/page.tsx`：
  - [x] 迁移历史列表（调用现有 `GET /database/migrations/:migrationId` 相关 API）
  - [x] 每条迁移显示：版本号、描述、状态（pending/approved/executed/rejected）、提交人、时间
  - [x] 「Preview Migration」按钮 → 调用现有 `GET /database/migrations/plan`，展示即将执行的 SQL
  - [x] 「Submit Migration」按钮 → 调用现有 `POST /database/migrations`
  - [x] 审批/拒绝/执行操作按钮 → 调用现有 approve/reject/execute 路由

---

## 模块二：AI Agent 系统升级（P0）

> 现有 `AIAssistantService`（`ai_assistant_service.go`）提供了基础的意图解析（`ParseIntent`：关键词匹配 6 种意图）、Workflow 生成（`GenerateWorkflow`：返回 `workflow_json` / `ui_schema` / `db_schema`）和对话（`Chat`：返回 `ChatAction[]`）。但当前实现是**单次请求-响应模式**（不支持多步推理），意图解析是**关键词匹配**（非 LLM），生成使用**示例数据**（`buildSampleWorkflowDefinition`）。需要升级为真正的 Agent 架构。

### 2.1 后端：Agent 工具调用框架

> 在 `apps/server/internal/service/` 下新建 Agent 相关文件。

- [x] 新建 `apps/server/internal/service/agent_tool.go`：
  - [x] 定义 `AgentTool` 接口：`Name() string` / `Description() string` / `Parameters() JSONSchema` / `Execute(ctx, params) (result, error)`
  - [x] 定义 `AgentToolRegistry`：`Register(tool)` / `Get(name) AgentTool` / `ListAll() []AgentToolMeta`
- [x] 新建 `apps/server/internal/service/agent_tools/` 目录，实现以下工具（每个工具一个文件）：
  - [x] `create_table.go` — 调用 `WorkspaceDBQueryService.CreateTable`
  - [x] `alter_table.go` — 调用 `WorkspaceDBQueryService.AlterTable`
  - [x] `query_data.go` — 调用 `WorkspaceDBQueryService.ExecuteSQL`
  - [x] `insert_data.go` — 调用 `WorkspaceDBQueryService.InsertRow`（支持批量插入种子数据）
  - [x] `create_workflow.go` — 调用 `WorkflowService.Create`
  - [x] `modify_workflow.go` — 调用 `WorkflowService.Update`
  - [x] `generate_ui_schema.go` — 生成 UI Schema JSON 并写入 `WorkspaceVersion.ui_schema`（调用 `WorkspaceService.UpdateUISchema`）
  - [x] `publish_app.go` — 调用 `WorkspaceService.Publish`（需用户确认）
  - [x] `get_workspace_info.go` — 返回当前 Workspace 的表列表、Workflow 列表、App 状态等上下文

### 2.2 后端：Agent 多步推理引擎

- [x] 新建 `apps/server/internal/service/agent_engine.go`：
  - [x] 定义 `AgentEngine` 接口：`Run(ctx, workspaceID, userID, message, sessionID) <-chan AgentEvent`
  - [x] 实现 ReAct 循环：
    1. 将用户消息 + 工具定义 + 历史上下文发送给 LLM
    2. LLM 返回 `thought` + `action`（工具调用）或 `final_answer`
    3. 如果是 `action`：执行工具 → 将结果作为 `observation` 追加到上下文 → 回到步骤 1
    4. 如果是 `final_answer`：结束循环，返回结果
  - [x] 最大步数限制（配置：`agent.max_steps`，默认 20）
  - [x] 每步超时限制（配置：`agent.step_timeout`，默认 60s）
  - [x] 用户确认机制：`create_table` / `alter_table` 等工具标记为 `requires_confirmation`，执行前暂停等待用户确认
- [x] 新建 `apps/server/internal/service/agent_session.go`：
  - [x] Agent 会话管理：`GetOrCreate` / `Get` / `List` / `Delete`
  - [x] 会话存储：消息历史、工具调用记录、当前状态（running / paused / completed / failed）
  - [x] 存储表：`000012_add_agent_sessions.sql` 迁移 + `entity.AgentSession` + `AgentSessionRepository`（CRUD/ListByWorkspace/ListByUser）
  - [x] 持久化适配器：`agent_session_persister.go`（`AgentSessionPersisterAdapter` 桥接 service 层与 repository 层）
  - [x] 在 `server.go` 中注入 `AgentSessionPersister`，每次状态变更自动调用 `Persist()`
- [x] Agent 引擎在 `server.go` 中初始化并注册工具

### 2.3 后端：Agent 流式输出

- [x] 在 `apps/server/internal/api/handler/` 新建 `agent_chat.go`：
  - [x] `POST /api/v1/workspaces/:id/agent/chat` — SSE 流式响应
    - 事件类型：`thought` / `tool_call` / `tool_result` / `confirmation_required` / `message` / `done` / `error`
  - [x] `POST /api/v1/workspaces/:id/agent/confirm` — 用户确认待确认操作
  - [x] `POST /api/v1/workspaces/:id/agent/cancel` — 取消当前运行
  - [x] `GET /api/v1/workspaces/:id/agent/sessions` — 会话列表
  - [x] `GET /api/v1/workspaces/:id/agent/sessions/:sessionId` — 会话详情
  - [x] `DELETE /api/v1/workspaces/:id/agent/sessions/:sessionId` — 删除会话

### 2.4 前端：Agent 对话面板

> 替换/增强现有 Builder 页面的 Chat 区域（`app/(dashboard)/dashboard/app/[appId]/builder/`）。

- [x] 新建 `apps/web/src/lib/api/agent-chat.ts`（与现有 Agent Store `agent.ts` 区分）：
  - [x] `chatStream(wsId, message, sessionId)` — SSE 流式连接
  - [x] `confirmAction(wsId, sessionId, actionId)` / `cancelSession(wsId, sessionId)` / `listSessions(wsId)` / `getSession(wsId, sessionId)` / `deleteSession(wsId, sessionId)`
- [x] 新建 `apps/web/src/components/agent/agent-chat-panel.tsx`：
  - [x] 消息列表：用户消息（右对齐）/ Agent 消息（左对齐）
  - [x] Agent 思考过程块（可折叠，灰色背景，`Thinking...` 动画）
  - [x] 工具调用块（图标 + 工具名 + 参数摘要 + 执行状态 + 结果摘要，可展开查看完整参数/结果）
  - [x] 确认请求块（高亮卡片：操作描述 + 「Approve」/「Reject」按钮）
  - [x] 底部输入框 + 发送按钮 + 「Stop」按钮（Agent 运行中时显示）
- [x] 新建 `apps/web/src/components/agent/agent-task-progress.tsx`：
  - [x] Agent 正在执行的步骤列表（每步显示：序号 / 描述 / 状态图标）
  - [x] 当前步骤高亮

---

## 模块三：Agent Flow 增强（P1）

> 现有 Workflow 编辑器（`dashboard/editor/[id]/`）和执行引擎已支持 20+ 节点类型。本模块扩展节点类型以支撑完整应用的业务逻辑，并建立 Workflow 与应用页面的绑定关系。

### 3.1 Workflow 节点扩展

> 在后端 `ExecutionService` 的节点执行器中新增节点类型处理，前端在 React Flow 节点注册中新增渲染组件。

- [x] **db_query 节点增强**（已有 DB 节点基础）：
  - [x] 支持可视化 SQL 构建器（columns / conditions / order_by / group_by / having / offset）
  - [x] 支持 INSERT / UPDATE / DELETE 操作模式（已有完整支持）
  - [x] 输出可直接绑定到 UI Schema 的 data_table / chart 组件（通过 page_render 节点）
- [x] **form_submit 节点**：接收 UI Schema 表单提交，校验输入，传递给下游节点（`node_form_submit.go`）
- [x] **page_render 节点**：定义一个页面的渲染逻辑（关联 UI Schema 页面 + 数据源查询）（`node_page_render.go`）
- [x] **condition_branch 节点增强**：已有 condition 节点支持多路分支
- [x] **loop 节点**：已有 loop 节点支持遍历列表数据
- [x] **aggregate 节点**：对 DB 查询结果进行聚合计算（SUM / AVG / COUNT / MIN / MAX / GROUP BY / distinct_count）（`node_aggregate.go`）
- [x] **notification 节点**：发送邮件/站内通知/Webhook 回调（`node_notification.go`）
- [x] **schedule_trigger 节点**：定时触发 Workflow（cron 表达式 + 时区 + payload）（`node_schedule_trigger.go`）

### 3.2 Workflow 与应用页面的绑定

> 扩展 `WorkspaceVersion` 的 `ui_schema` 和 `config_json`（类型定义在 `workspace.ts` L47-58）来描述多页面应用结构。

- [x] 在 `WorkspaceVersion.config_json` 中新增 `pages` 字段（结构已定义）
- [x] 后端：在 `WorkspaceService.CreateVersion` 中校验 `pages[].workflow_id` 存在性，并将 UISchema/DBSchema/ConfigJSON 写入版本
- [x] 前端：新建 `components/builder/page-manager-panel.tsx`（CRUD 页面、选择关联 Workflow、配置路由和图标、导航类型选择）

### 3.3 Workflow 模板系统

- [x] 新建 `workflow_template.go`：`WorkflowTemplateService` 接口（`ListTemplates` / `GetTemplate` / `CreateFromTemplate` / `SaveAsTemplate`）
- [x] 内置 3 个基础模板（代码内置，非 DB 存储）：
  - [x] **CRUD 模板**（`builtin_crud`）：start → db_select → page_render(table) + form_submit → db_insert → end
  - [x] **Dashboard 模板**（`builtin_dashboard`）：start → db_select → aggregate → page_render(stats + chart) → end
  - [x] **审批流模板**（`builtin_approval`）：start → form_submit → condition → notification / db_update → end
- [x] 前端：新建 `components/workflow/workflow-template-picker.tsx`（模板选择卡片，按分类分组）

---

## 模块四：AI Skills 系统（P1）

> AI Skills 是对 Agent 工具能力的高层封装。Skills 将相关工具 + Prompt 模板打包为一个可复用的能力单元。

### 4.1 Skills 框架

- [x] 新建 `apps/server/internal/service/skill.go`：
  - [x] 定义 `Skill` 结构：`ID` / `Name` / `Description` / `Category` / `Tools []AgentTool` / `SystemPromptAddition string` / `ConfigSchema JSON`
  - [x] 定义 `SkillRegistry`：`Register(skill)` / `Get(id)` / `ListAll()` / `ListByCategory(category)` / `ListEnabled()` / `SetEnabled()` / `LoadToolsIntoRegistry()` / `BuildSystemPrompt()`
  - [x] `SkillCategory` 枚举：`data_modeling` / `ui_generation` / `business_logic` / `integration`
- [x] `LoadToolsIntoRegistry` 方法支持将已启用 Skills 的工具加载到 `AgentToolRegistry`

### 4.2 内置 Skills

- [x] **Data Modeling Skill**（`apps/server/internal/service/skills/data_modeling.go`）：
  - [x] 提供工具：`create_table` / `alter_table` / `insert_data` / `query_data`
  - [x] System Prompt Addition：指导 LLM 设计规范化数据模型（3NF、字段类型、约束、索引）
- [x] **UI Generation Skill**（`apps/server/internal/service/skills/ui_generation.go`）：
  - [x] 提供工具：`generate_ui_schema` / `modify_ui_schema`
  - [x] System Prompt Addition：指导 LLM 生成 UI Schema（组件类型、布局、数据绑定）
- [x] **Business Logic Skill**（`apps/server/internal/service/skills/business_logic.go`）：
  - [x] 提供工具：`create_workflow` / `modify_workflow` / `get_workspace_info` / `suggest_workflow`
  - [x] System Prompt Addition：指导 LLM 设计业务流程（节点类型、触发器、分支逻辑）

### 4.3 前端 Skill 管理

- [x] 新建 `apps/web/src/app/(dashboard)/dashboard/skills/page.tsx`：
  - [x] 已启用 Skills 列表卡片（图标 / 名称 / 描述 / 包含的工具数量 / 启用状态 toggle）
  - [x] 点击 Skill 卡片展开配置面板（分类、工具列表、描述）
  - [x] 「Agent Tool Overview」区域：汇总当前 Agent 可调用的所有工具列表（按启用状态动态更新）

---

## 模块五：应用渲染引擎增强（P1）

> 现有 `UISchema` 结构（`DEV-PLAN-WORKSPACE-APP-PLATFORM.md` L994-1020）支持 `form` / `input` / `select` / `markdown` / `table` / `chart` 类型。需要扩展为能渲染完整多页面 Web 应用。

### 5.1 扩展 UI Schema 规范

- [x] 在现有 `ui_schema` 基础上新增 `app_schema_version: "2.0.0"` 标识新版本（`types.ts` 中 `AppSchema.app_schema_version`）
- [x] 新增 `pages[]` 顶层字段（每个 page 包含独立的 `blocks[]` 和 `actions[]`）
- [x] 新增 `navigation` 顶层字段（`type: "sidebar" | "topbar" | "tabs"`，`items[]` 引用 `pages[].id`）
- [x] 新增组件类型：
  - [x] `stats_card` — 统计卡片（数值 + 标签 + 趋势箭头 + 颜色）
  - [x] `data_table` — 绑定 DB 表的数据表格（自动 CRUD），配置：`table_name` / `columns[]` / `actions[]` / `filters_enabled` / `search_enabled` / `pagination`
  - [x] `detail_view` — 单条记录详情展示
  - [x] `form_dialog` — 表单（支持 text/number/email/textarea/select/date/checkbox）
  - [x] `chart` 增强 — 支持 `bar` / `line` / `pie` / `area`（纯 SVG 实现，无外部依赖）

### 5.2 应用渲染器组件

- [x] 新建 `apps/web/src/components/app-renderer/app-renderer.tsx`：
  - [x] 接收 `AppSchema`（`pages[]` + `navigation`）作为 props
  - [x] 渲染侧边栏/顶部栏/Tab 导航 + 当前页面内容
  - [x] 页面切换使用 state 管理
- [x] 新建 `apps/web/src/components/app-renderer/blocks/` 目录：
  - [x] `stats-card-block.tsx` / `data-table-block.tsx` / `form-block.tsx` / `chart-block.tsx` / `detail-view-block.tsx` / `markdown-block.tsx`
  - [x] 每个 block 组件从 props 读取配置，通过 DataProvider 调用 Workspace DB API
- [x] 新建 `apps/web/src/components/app-renderer/data-provider.tsx`：
  - [x] 通过 Context 提供当前 Workspace ID 和 DB API 调用方法（queryRows/insertRow/updateRow/deleteRows）
  - [x] `data_table` block 自动调用 `queryRows` API
  - [x] `form` block 提交时自动调用 `insertRow` API

### 5.3 应用预览

> 集成到现有 Builder 页面的中间面板（`app/[appId]/builder/`）。

- [x] AppRenderer 组件已可用于集成到 Builder Preview Tab
- [x] Builder 中间面板新增「Preview」Tab（已在 7.1 中实现）
- [x] 预览模式切换：Desktop / Tablet / Mobile（已在 7.1 中实现）
- [x] AI Agent 修改 UI Schema 后自动刷新预览（已在 7.2 中实现 affected_resource 机制）

---

## 模块六：Workspace 导航精简 + 体验优化（P0）

> 当前侧边栏有 11 个主导航 + 3 个个人导航 + 35 个页面子目录。需要精简为核心链路。

### 6.1 侧边栏导航重构

- [x] 修改 `apps/web/src/app/(dashboard)/layout.tsx` 中的 `mainNavItems`：6 个核心导航项（Home / AI Agent / My Apps / Database / Agent Flow / Skills）
- [x] 非核心导航项已从侧边栏移除（Conversation / Creative Workshop / Template Gallery / Store / Planning / Ticket / Support Settings）
- [x] `personalNavItems` 保留 Files 和 Analytics，移除 My Agents (Legacy)
- [x] `fullBleedRoutes` 已更新，添加 `/dashboard/agent` 和 `/dashboard/skills`

### 6.2 Workspace 首页重设计

- [x] 重设计 `apps/web/src/app/(dashboard)/dashboard/page.tsx`：
  - [x] 顶部欢迎区域 + 问候语
  - [x] 4 个快捷操作卡片（AI Agent / Database / My Apps / Agent Flow）
  - [x] 最近 Workflows 卡片列表（含状态 Badge）
  - [x] 数据库存储概览（Tables / Size / Quota）
  - [x] 最近 Agent 会话入口卡片

### 6.3 Workspace 切换器优化

> 当前已在 `layout.tsx` L156-251 实现了 Workspace 切换（`activeWorkspaceId` + `workspaces[]` + `recentWorkspaceIds[]` + `localStorage` 持久化）。

- [x] 切换 Workspace 时触发 `workspace-switched` 自定义事件，供 Database 页面监听刷新
- [x] 切换 Workspace 时清除 Agent 会话上下文（`sessionStorage.removeItem('agent_session_id')`）
- [x] Workspace 选择器增加状态指示点（绿点=active / 灰点=未配置）

---

## 模块七：应用构建工作台增强（P1）

> 现有 Builder 页面（`app/[appId]/builder/`）已有三栏布局基础框架。需增强为真正可用的一体化构建体验。

### 7.1 Builder 面板集成

- [x] 修改 `builder-content.tsx`：
  - [x] 左侧面板：AI Chat（已有，保留原有实现）
  - [x] 中间面板 Tabs：「Workflow」/「Preview」/「Database」三个 Tab 切换
  - [x] Preview Tab 支持响应式视口切换（Desktop 100% / Tablet 768px / Mobile 375px）
  - [x] 右侧面板：UI Config / Preview 切换（已有）
- [x] 面板折叠：左右面板可通过按钮折叠（已有实现）
- [x] 面板 Resize：拖拽调整宽度（`react-resizable-panels` v4 — `PanelGroup` / `Panel` / `Separator`）

### 7.2 Agent 与 Builder 的实时协同

- [x] 后端 `AgentEvent` 结构新增 `AffectedResource` 字段（`workflow` / `database` / `ui_schema`）
- [x] `resolveAffectedResource()` 函数根据工具名自动映射影响资源类型
- [x] 前端 `AgentEvent` 类型新增 `affected_resource` 字段
- [x] `tool_result` SSE 事件携带 `affected_resource`，前端可监听并触发对应 Tab 刷新

### 7.3 应用版本管理

> 现有 `WorkspaceService` 已支持 `CreateVersion` / `ListVersions` / `CompareVersions` / `Rollback`。

- [x] Builder 已有版本列表和对比基础功能（`versionList` / `compareFrom` / `compareTo` 状态）
- [x] 自动保存草稿：Builder 编辑每 30s 自动保存（`useEffect` + `setInterval`）
- [x] 版本 JSON diff 视图增强（`VersionDiffViewer` 组件 — 可展开字段级 before/after 对比，支持深层 JSON diff）

---

## 模块八：周边功能处理（P2）

### 8.1 暂时冻结

以下模块保留代码但暂停迭代，从侧边栏导航中移除：

- [x] Creative Workshop（`/dashboard/creative`）— 已从侧边栏移除
- [x] Creator Economy（`/dashboard/creator`）— 已从侧边栏移除
- [x] Achievements（`/dashboard/achievements`）— 已从侧边栏移除
- [x] Learn（`/dashboard/learn`）— 已从侧边栏移除
- [x] Node Market（`components/node-market/`）— 已从侧边栏移除
- [x] Referral（`/dashboard/referral`）— 已从侧边栏移除
- [x] Getting Started（`/dashboard/getting-started`）— 用 Agent 引导替代

### 8.2 可复用到核心链路的模块

- [x] `components/chat/` → 复用消息渲染逻辑（已在 Builder 左侧面板中使用）
- [x] `dashboard/editor/[id]/` → 直接作为 Builder 的 Workflow Tab（`LazyWorkflowEditor`）
- [x] `dashboard/executions/` → App Monitoring 的执行记录
- [x] `lib/api/ai.ts` → Agent API Client 基础（已新建 `agent-chat.ts`）
- [x] `components/workflow/` → 节点组件复用

---

## 技术依赖

### 已有可直接使用

- Next.js + React + TypeScript + Tailwind CSS + shadcn/ui
- React Flow（Workflow 画布 + ER 图）
- Go + Echo v4 + GORM + PostgreSQL + Redis
- Supabase 风格设计系统（`.cursor/skills/supabase-style/`）
- `WorkspaceDBRuntime.GetConnection()` — Workspace 独立 DB 连接
- LLM Provider 三层架构（`agent_engine.go`）：
  - **OpenAI API**：设置 `OPENAI_API_KEY` 环境变量，默认模型 `gpt-4o`
  - **Ollama 本地**：设置 `OLLAMA_HOST`（如 `http://localhost:11434`），默认模型 `llama3.1`
  - **Heuristic Fallback**：无 LLM 配置时，基于关键词意图识别自动执行多步操作（支持车队管理/客户反馈/订单/任务管理等场景）

### 需要新增

- [ ] `@monaco-editor/react` — SQL Editor 增强（可选，当前 Textarea 方案可用）
- [ ] `@tanstack/react-table` — Table Editor 数据网格增强（可选，当前实现可用）
- [x] `react-resizable-panels` — Builder 面板拖拽分割（已安装 v4.6.2，使用 `Group` / `Panel` / `Separator`）

---

## 开发阶段

### Phase 1（4-6 周）— 核心体验闭环

**目标**：用户能在 Workspace 中通过 AI Agent 对话创建一个简单的 CRUD 应用（如车辆管理），数据存储在 Workspace DB 中，并通过 Supabase 风格界面管理数据。

**核心交付**：

- [x] 模块 1.1-1.4（后端表/行 API + 前端 Table Editor + SQL Editor + 概览页）
- [x] 模块 2.1-2.4（Agent 工具框架 + 多步推理引擎 + SSE 输出 + 前端 Agent 面板）
- [x] 模块 6.1（侧边栏导航精简）
- [x] 模块 6.2（Workspace 首页重设计）

### Phase 2（4-6 周）— 完整应用构建

**目标**：用户能构建多页面应用，Agent 具备完整的应用构建能力，可在 Builder 中预览。

**核心交付**：

- [x] 模块 3（Agent Flow 增强：节点扩展 + 页面绑定 + 模板）
- [x] 模块 5（应用渲染引擎：UI Schema 扩展 + AppRenderer + 预览）
- [x] 模块 7（Builder 工作台增强：面板集成 + 实时协同）
- [x] 模块 1.7-1.8（ER 图 + 迁移管理 UI）

### Phase 3（3-4 周）— 发布与运行

**目标**：应用可以公开访问，具备完整的运行时能力。

**核心交付**：

- [x] 模块 4（AI Skills 系统）
- [x] 模块 8（周边功能冻结 + 复用整理）
- [x] 应用发布流程优化（已有 `WorkspaceService.Publish` + `RuntimeService`，Builder 已整合发布 UI + Pre-publish Checklist）
- [x] 应用运行时认证（`AppUser` Entity + `AppUserRepository` + `RuntimeAuthService`（Register/Login/Logout/Block） + `000013_add_app_runtime_auth.sql` 迁移 + Runtime Auth API 路由）

---

## 附录：核心用户故事

### 用户故事 1：车队管理系统

> "我想做一个车队管理系统，需要管理车辆信息、司机信息、行程记录，还需要一个仪表盘展示今日行程统计。"

**Agent 执行流程**（对应模块 2 的 ReAct 循环）：

```
[Thought] 用户需要一个车队管理系统，包含 3 个数据实体和 1 个仪表盘页面。
          我需要：1) 创建数据表  2) 生成 UI  3) 创建 Workflow  4) 插入示例数据

[Action]  create_table({ name: "vehicles", columns: [...] })
[Observation] ✅ Table 'vehicles' created with 6 columns

[Action]  create_table({ name: "drivers", columns: [...] })
[Observation] ✅ Table 'drivers' created with 5 columns

[Action]  create_table({ name: "trips", columns: [..., fk: vehicles.id, fk: drivers.id] })
[Observation] ✅ Table 'trips' created with 8 columns, 2 foreign keys

[Action]  insert_data({ table: "vehicles", rows: [示例数据 x 5] })
[Observation] ✅ Inserted 5 rows into 'vehicles'

[Action]  generate_ui_schema({ pages: [dashboard, vehicles, drivers, trips] })
[Observation] ✅ UI Schema generated with 4 pages

[Action]  create_workflow({ ... CRUD + 聚合查询 ... })
[Observation] ✅ Workflow created

[Final Answer] 车队管理系统已创建完成！包含：
  - 3 张数据表（vehicles / drivers / trips）
  - 4 个页面（仪表盘 / 车辆管理 / 司机管理 / 行程记录）
  你可以在 Preview 中查看效果，或在 Database 中管理数据。
```

### 用户故事 2：客户反馈系统

> "我需要一个客户反馈收集系统，外部用户可以提交反馈，内部团队可以分类处理。"

**Agent 执行流程**：

1. `create_table("feedbacks", [...])` → `create_table("categories", [...])` → `create_table("responses", [...])`
2. `generate_ui_schema`：公开提交表单页 + 内部管理看板页
3. `create_workflow`：表单提交 → 写入 DB → 通知
4. 设置 `access_policy`：公开页 `public_anonymous`，管理页 `public_auth`（调用现有 `WorkspaceService.UpdateAccessPolicy`）

---

_文档结束。后续进展请在对应 TODO 项目标记 `[x]` 完成状态。_
