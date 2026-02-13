# VM Runtime 开发文档

版本：v1.4
日期：2026-02-13（v1.0）→ 2026-02-13（v1.1 review 更新）→ 2026-02-13（v1.2 代码对齐修正）→ 2026-02-13（v1.3 全面 review 修正）→ 2026-02-13（v1.4 二次全面 review）
状态：Completed

---

## 目录

1. [项目概述](#1-项目概述)
2. [架构设计](#2-架构设计)
3. [技术选型](#3-技术选型)
4. [数据模型](#4-数据模型)
5. [模块详细设计](#5-模块详细设计)
6. [Agent 工具设计](#6-agent-工具设计)
7. [前端适配](#7-前端适配)
8. [安全设计](#8-安全设计)
9. [开发任务清单](#9-开发任务清单)
10. [测试计划](#10-测试计划)
11. [后续演进](#11-后续演进)
12. [现有 Workspace 数据迁移方案](#12-现有-workspace-数据迁移方案)

---

## 1. 项目概述

### 1.1 背景

当前系统采用 **Schema-Driven**（声明式）架构：LLM 生成 JSON Schema → 前端 `AppRenderer` 解析渲染。这种模式有以下限制：

- UI 能力受限于内置 block 类型（`stats_card`, `data_table`, `chart` 等）
- 无法运行自定义业务逻辑（如下单时自动扣库存、自定义校验规则）
- 工作空间数据存储在 MySQL `ws_xxx` 数据库中，与主系统耦合较深
- LLM 只能修改 JSON 结构，无法生成和运行真正的代码

### 1.2 目标

将工作空间应用迁移到 **VM-Based**（命令式）架构：

- 每个 workspace 的应用运行在 **嵌入式 JS VM** 中，独立于主系统
- LLM 可以生成和修改 **完整的 JavaScript 业务逻辑代码**
- 数据存储使用 **SQLite**（每个 workspace 一个 `.db` 文件），与主系统 MySQL 完全隔离
- 数据结构（表、列、索引）全部由 LLM 动态生成
- 现有 `/dashboard/database` 管理界面继续可用，用于查看和管理 workspace 数据

### 1.3 设计原则

| 原则 | 说明 |
|------|------|
| **数据隔离** | workspace 数据使用独立 SQLite 文件，不共享主系统 MySQL |
| **代码沙箱** | JS 代码在 goja VM 中执行，禁用危险 API，超时保护 |
| **LLM 优先** | 数据结构和业务逻辑都由 LLM 生成，用户通过自然语言驱动 |
| **渐进迁移** | 新架构与现有 schema 渲染并存，不破坏已有功能 |
| **管理可见** | 所有数据可通过 `/dashboard/database` 查看和编辑 |

---

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│  主系统 (不变)                                                    │
│  MySQL: what_reverse_users, what_reverse_workspaces, ...         │
│  用途: 用户认证、workspace 元数据、版本管理、Agent 会话             │
└──────────────────────────────┬──────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│ /dashboard/     │  │ Agent Chat      │  │ /runtime/:slug/*    │
│ database/*      │  │ (LLM 工具调用)  │  │ (公开访问)          │
│ (管理界面)      │  │                 │  │                     │
└────────┬────────┘  └────────┬────────┘  └────────┬────────────┘
         │                    │                     │
         ▼                    ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VMStore (新增)                               │
│  管理 SQLite 连接、表 CRUD、行查询                                 │
│  接口: GetDB / ListTables / QueryRows / ExecuteSQL               │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VMPool + goja VM (新增)                        │
│  每个 workspace 一个 JS VM 实例                                   │
│  LLM 生成的 JS 代码在此执行                                       │
│  通过注入的 db API 读写 SQLite                                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
                    data/vm/{workspaceID}.db
                    (SQLite, 每个 workspace 独立文件)
```

### 2.2 请求流程

#### 管理界面流程（/dashboard/database）

```
用户操作 Table Editor / SQL Editor
  → 前端 workspaceDatabaseApi.xxx(workspaceId, ...)
  → GET/POST /workspaces/:id/database/...
  → VMDatabaseHandler (新增, 替代 MySQL 版本)
  → VMStore.ListTables / QueryRows / ExecuteSQL
  → SQLite data/vm/{workspaceID}.db
```

#### Agent 工具流程（LLM 建表 + 写代码）

```
用户对 Agent 说 "帮我做一个任务管理应用"
  → AgentEngine.Run()
  → LLM 调用 deploy_logic 工具
    → 保存 JS 代码到 WorkspaceVersion.LogicCode
    → JS 代码中包含 db.execute("CREATE TABLE ...") 建表逻辑
    → VM 加载代码时自动执行建表
  → LLM 调用 generate_ui_schema 工具 (现有)
  → LLM 调用 publish_app 工具 (现有)
```

#### 运行时访问流程（/runtime/:slug/api/*）

```
终端用户请求 GET /runtime/my-app/api/tasks
  → RuntimeVMHandler.HandleAPI
  → runtimeService.GetEntry(slug) → 获取 workspaceID
  → vmPool.GetOrCreate(workspaceID) → 获取或创建 VM 实例
    → 从 WorkspaceVersion.LogicCode 加载 JS 代码
    → 创建 goja.Runtime, 注入 db/console API
    → 执行 JS 代码, 提取 exports.routes
  → vm.Handle(VMRequest{Method: "GET", Path: "/tasks", ...})
    → 匹配路由 → 执行 JS handler
    → handler 内部调用 db.query("SELECT * FROM tasks ...")
    → 返回 JSON 结果
```

### 2.3 与现有架构的关系

| 组件 | Schema-Driven 模式 | VM-Based 模式 | 当前状态 |
|------|---------------------|-----------------|---------|
| 数据存储 | ~~MySQL `ws_xxx` 数据库~~（已移除） | SQLite `data/vm/{id}.db` 文件 | **SQLite-only** |
| 数据管理 | `/dashboard/database` UI | 同一 UI，后端统一为 `VMDatabaseHandler` | 前端不变 |
| 业务逻辑 | 无（纯 CRUD Data API） | goja JS VM 执行 LLM 生成的代码 | VM 路由 `/api/*` |
| UI 渲染 | `AppRenderer` + JSON Schema | 可通过 `api_source` 调用 VM API | 并存 |
| 公开数据 | `/runtime/:slug/data/:table` | `/runtime/:slug/api/*` | 并存 |
| Agent 工具 | `create_table`, `generate_ui_schema` | `deploy_logic`, `get_logic` | 全部可用 |

---

## 3. 技术选型

### 3.1 JS 引擎: goja

| 选项 | 说明 | 选择理由 |
|------|------|---------|
| **[goja](https://github.com/dop251/goja)** | 纯 Go 实现的 ECMAScript 5.1+ 引擎 | **选用** — 纯 Go、零 CGO、启动 <1ms、内存 ~2-5MB/实例 |
| [v8go](https://github.com/nicholasgasior/v8go) | V8 引擎 Go 绑定 | 需要 CGO + V8 二进制，编译复杂 |
| [goja_nodejs](https://github.com/nicholasgasior/goja_nodejs) | goja + Node.js API | 可选扩展，提供 `require()`, `console`, `setTimeout` |

**Go 依赖**:
```
go get github.com/dop251/goja
```

### 3.2 SQLite 驱动

| 选项 | 说明 | 选择理由 |
|------|------|---------|
| **[modernc.org/sqlite](https://pkg.go.dev/modernc.org/sqlite)** | 纯 Go 实现的 SQLite | **选用** — 纯 Go、零 CGO、跨平台编译无障碍 |
| [github.com/mattn/go-sqlite3](https://github.com/mattn/go-sqlite3) | CGO 绑定原生 SQLite | 性能更好但需要 CGO 工具链 |

**Go 依赖**:
```
go get modernc.org/sqlite
```

**注册驱动**:
```go
import _ "modernc.org/sqlite"
// 驱动名: "sqlite"
// DSN: "file:data/vm/{id}.db?_journal_mode=WAL&_busy_timeout=5000&_foreign_keys=on"
```

### 3.3 SQLite 配置

每个 workspace 的 SQLite 连接使用以下 PRAGMA 配置：

```sql
PRAGMA journal_mode = WAL;       -- Write-Ahead Logging, 提高并发读性能
PRAGMA busy_timeout = 5000;      -- 写锁等待 5 秒
PRAGMA foreign_keys = ON;        -- 启用外键约束
PRAGMA synchronous = NORMAL;     -- 平衡性能和安全
PRAGMA cache_size = -2000;       -- 2MB 缓存
```

---

## 4. 数据模型

### 4.1 主系统 MySQL 变更

#### `WorkspaceVersion` 表新增字段

在 `what_reverse_workspace_versions` 表中新增 `logic_code` 列：

```sql
ALTER TABLE what_reverse_workspace_versions
ADD COLUMN logic_code LONGTEXT DEFAULT NULL
COMMENT 'LLM 生成的 JavaScript 业务逻辑代码，在 goja VM 中执行';
```

对应 Go entity 变更：

```go
// internal/domain/entity/workspace.go
type WorkspaceVersion struct {
    // ... 现有字段不变 ...
    UISchema    JSON       `gorm:"column:ui_schema;type:json" json:"ui_schema"`
    DBSchema    JSON       `gorm:"column:db_schema;type:json" json:"db_schema"`
    ConfigJSON  JSON       `gorm:"column:config_json;type:json" json:"config_json"`

    // 新增 (Phase 1)
    LogicCode     *string `gorm:"column:logic_code;type:longtext" json:"logic_code"`
    // 新增 (Phase 3)
    ComponentCode *string `gorm:"column:component_code;type:longtext" json:"component_code"`
}
```

版本管理保持不变 — `LogicCode` 随 `WorkspaceVersion` 一起版本化，支持回滚。Phase 3 新增的 `ComponentCode *string` 字段同样随版本管理。

### 4.2 SQLite 数据（workspace 隔离层）

SQLite 文件中的表结构 **完全由 LLM 动态生成**，没有预定义 schema。

LLM 生成的 JS 代码中通过 `db.execute()` 创建表，例如：

```javascript
db.execute(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo' CHECK(status IN ('todo','in_progress','done')),
    priority INTEGER DEFAULT 0,
    assignee TEXT,
    due_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);
```

### 4.3 文件存储结构

```
data/
  vm/
    {workspaceID-1}.db        ← workspace 1 的 SQLite 数据库
    {workspaceID-1}.db-wal    ← WAL 日志（SQLite 自动管理）
    {workspaceID-1}.db-shm    ← 共享内存（SQLite 自动管理）
    {workspaceID-2}.db        ← workspace 2 的 SQLite 数据库
    ...
```

---

## 5. 模块详细设计

### 5.1 VMStore — SQLite 连接管理

**文件**: `internal/vmruntime/store.go`

**职责**:
- 管理每个 workspace 的 SQLite 连接（懒加载、单例缓存）
- 提供文件级操作（创建、删除、备份、检测存在）
- 配置 PRAGMA 参数

**结构体定义**:

```go
// VMStore 是一个 concrete struct（非 interface），管理 per-workspace SQLite 连接
type VMStore struct {
    mu      sync.RWMutex
    baseDir string
    dbs     map[string]*sql.DB
}

func NewVMStore(baseDir string) *VMStore
```

**主要方法**:

```go
// 连接管理
func (s *VMStore) GetDB(workspaceID string) (*sql.DB, error)
func (s *VMStore) Close()
func (s *VMStore) CloseDB(workspaceID string) error

// 文件操作
func (s *VMStore) Exists(workspaceID string) bool
func (s *VMStore) Delete(workspaceID string) error
func (s *VMStore) DBPath(workspaceID string) string
func (s *VMStore) BackupTo(workspaceID, destPath string) error

// 表操作 (给 /dashboard/database 用)
func (s *VMStore) ListTables(ctx context.Context, workspaceID string) ([]VMTableInfo, error)
func (s *VMStore) GetTableSchema(ctx context.Context, workspaceID, tableName string) (*VMTableSchema, error)
func (s *VMStore) GetSchemaGraph(ctx context.Context, workspaceID string) (*VMSchemaGraph, error)
func (s *VMStore) GetStats(ctx context.Context, workspaceID string) (*VMDatabaseStats, error)

// 行操作 (给 /dashboard/database 和 /runtime/api 用)
func (s *VMStore) QueryRows(ctx context.Context, workspaceID, tableName string, params VMQueryParams) (*VMQueryResult, error)
func (s *VMStore) InsertRow(ctx context.Context, workspaceID, tableName string, data map[string]interface{}) (*VMExecResult, error)
func (s *VMStore) UpdateRow(ctx context.Context, workspaceID, tableName string, data map[string]interface{}, where map[string]interface{}) (*VMExecResult, error)
func (s *VMStore) DeleteRows(ctx context.Context, workspaceID, tableName string, ids []interface{}) (*VMExecResult, error)

// SQL 执行 (给 SQL Editor 和 LLM 用)
func (s *VMStore) ExecuteSQL(ctx context.Context, workspaceID, sql string, params ...interface{}) (*VMQueryResult, error)

// 表结构管理 (给 /dashboard/database 和 Agent 工具用)
func (s *VMStore) CreateTable(ctx context.Context, workspaceID string, req VMCreateTableRequest) error
func (s *VMStore) AlterTable(ctx context.Context, workspaceID, tableName string, req VMAlterTableRequest) error
func (s *VMStore) DropTable(ctx context.Context, workspaceID, tableName string) error

// 查询历史 (SQLite 无内建查询日志，返回空列表)
func (s *VMStore) GetQueryHistory(ctx context.Context, workspaceID string) []VMQueryHistoryItem
```

**类型定义文件**: `internal/vmruntime/types.go`

所有 VMStore 相关的类型定义集中在独立的 `types.go` 文件中：

```go
type VMTableInfo struct {
    Name        string `json:"name"`
    RowCount    int64  `json:"row_count_est"`
    ColumnCount int    `json:"column_count"`
}

type VMColumnInfo struct {
    Name         string  `json:"name"`
    Type         string  `json:"type"`
    Nullable     bool    `json:"nullable"`
    DefaultValue *string `json:"default_value"`
    IsPrimaryKey bool    `json:"is_primary_key"`
}

type VMTableSchema struct {
    Name        string         `json:"name"`
    Columns     []VMColumnInfo `json:"columns"`
    PrimaryKey  []string       `json:"primary_key"`
    ForeignKeys []VMForeignKey `json:"foreign_keys"`
    Indexes     []VMIndex      `json:"indexes"`
    DDL         string         `json:"ddl"`
}

type VMForeignKey struct {
    From            string `json:"column"`
    ReferencedTable string `json:"referenced_table"`
    ReferencedCol   string `json:"referenced_column"`
    OnUpdate        string `json:"on_update"`
    OnDelete        string `json:"on_delete"`
}

type VMQueryParams struct {
    Page             int             `json:"page"`
    PageSize         int             `json:"page_size"`
    OrderBy          string          `json:"order_by"`
    OrderDir         string          `json:"order_dir"`
    Filters          []VMQueryFilter `json:"filters,omitempty"`
    FilterCombinator string          `json:"filter_combinator,omitempty"` // "AND" (默认) 或 "OR"
}

type VMQueryFilter struct {
    Column   string `json:"column"`
    Operator string `json:"operator"` // =, !=, >, <, >=, <=, LIKE, IS NULL, IS NOT NULL
    Value    string `json:"value"`
}

type VMQueryResult struct {
    Columns      []string                 `json:"columns"`
    Rows         []map[string]interface{} `json:"rows"`
    TotalCount   int64                    `json:"total_count"`
    AffectedRows int64                    `json:"affected_rows"`
    DurationMs   int64                    `json:"duration_ms"`
}

type VMExecResult struct {
    LastInsertID int64 `json:"last_insert_id,omitempty"`
    AffectedRows int64 `json:"affected_rows"`
}

type VMIndex struct {
    Name    string   `json:"name"`
    Unique  bool     `json:"unique"`
    Columns []string `json:"columns"`
}

type VMSchemaGraph struct {
    Tables    []VMTableSchema `json:"tables"`
    Relations []VMRelation    `json:"relations"`
}

type VMRelation struct {
    FromTable  string `json:"from_table"`
    FromColumn string `json:"from_column"`
    ToTable    string `json:"to_table"`
    ToColumn   string `json:"to_column"`
}

type VMDatabaseStats struct {
    TableCount  int    `json:"table_count"`
    TotalRows   int64  `json:"total_rows"`
    FileSizeKB  int64  `json:"file_size_kb"`
    IndexCount  int    `json:"index_count"`
    JournalMode string `json:"journal_mode"`
}

type VMCreateTableRequest struct {
    Name       string              `json:"name"`
    Columns    []VMCreateColumnDef `json:"columns"`
    PrimaryKey []string            `json:"primary_key"`
    Indexes    []VMCreateIndexDef  `json:"indexes"`
}

type VMCreateColumnDef struct {
    Name         string  `json:"name"`
    Type         string  `json:"type"`
    Nullable     bool    `json:"nullable"`
    DefaultValue *string `json:"default_value"`
    Unique       bool    `json:"unique"`
}

type VMCreateIndexDef struct {
    Name    string   `json:"name"`
    Columns []string `json:"columns"`
    Unique  bool     `json:"unique"`
}

type VMAlterTableRequest struct {
    AddColumns   []VMCreateColumnDef `json:"add_columns,omitempty"`
    AlterColumns []VMAlterColumnDef  `json:"alter_columns,omitempty"`
    DropColumns  []string            `json:"drop_columns,omitempty"`
    Rename       string              `json:"rename,omitempty"`
}

type VMAlterColumnDef struct {
    Name         string  `json:"name"`
    NewName      string  `json:"new_name,omitempty"`
    Type         string  `json:"type,omitempty"`
    Nullable     *bool   `json:"nullable,omitempty"`
    DefaultValue *string `json:"default_value,omitempty"`
}

type VMQueryHistoryItem struct {
    SQL        string `json:"sql"`
    DurationMs int64  `json:"duration_ms"`
    Status     string `json:"status"`
    CreatedAt  string `json:"created_at"`
    Error      string `json:"error,omitempty"`
}
```

**SQLite 查询适配**:

| MySQL 原有查询 | SQLite 替代 |
|---------------|-------------|
| `INFORMATION_SCHEMA.TABLES` | `SELECT name FROM sqlite_master WHERE type='table'` |
| `INFORMATION_SCHEMA.COLUMNS` | `PRAGMA table_info({table})` |
| `INFORMATION_SCHEMA.STATISTICS` | `PRAGMA index_list({table})` + `PRAGMA index_info({index})` |
| `INFORMATION_SCHEMA.KEY_COLUMN_USAGE` | `PRAGMA foreign_key_list({table})` |
| `SHOW CREATE TABLE` | `SELECT sql FROM sqlite_master WHERE name=?` |

### 5.2 WorkspaceVM — JS VM 实例

**文件**: `internal/vmruntime/vm.go`

**职责**:
- 加载并执行 LLM 生成的 JS 代码
- 提取 `exports.routes` 中定义的路由处理器
- 处理 HTTP 请求 → 匹配路由 → 执行 JS handler → 返回结果
- 超时控制和错误恢复

**核心结构**:

```go
type WorkspaceVM struct {
    workspaceID string
    runtime     *goja.Runtime
    routes      map[string]goja.Callable  // "GET /tasks" → JS function
    codeHash    string                     // 代码哈希，用于检测更新
    loadedAt    time.Time
}
```

**请求上下文对象** (注入 JS `ctx` 参数):

```go
type VMRequest struct {
    Method  string                 `json:"method"`   // GET, POST, PATCH, DELETE
    Path    string                 `json:"path"`     // /tasks, /tasks/1
    Params  map[string]string      `json:"params"`   // URL 路径参数 {:id → "1"}
    Query   map[string]string      `json:"query"`    // 查询参数 ?status=done
    Body    map[string]interface{} `json:"body"`     // POST/PATCH body
    Headers map[string]string      `json:"headers"`  // 请求头
    User    *VMUser                `json:"user"`     // 应用用户 (来自 X-App-Token)
}

type VMUser struct {
    ID    string `json:"id"`
    Email string `json:"email"`
    Name  string `json:"name"`
}

// VMResponse 是 JS handler 的返回结果
type VMResponse struct {
    Status int         `json:"status"`
    Body   interface{} `json:"body"`
}
```

**核心方法**:

```go
func NewWorkspaceVM(workspaceID string, code string, db *sql.DB) (*WorkspaceVM, error)
func (w *WorkspaceVM) Handle(req VMRequest) (*VMResponse, error)
```

**路由匹配规则**:

JS 代码中 `exports.routes` 的 key 格式为 `"METHOD /path"` 或 `"METHOD /path/:param"`：

```javascript
exports.routes = {
  'GET /tasks':        (ctx) => { ... },  // 精确匹配
  'GET /tasks/:id':    (ctx) => { ... },  // 路径参数
  'POST /tasks':       (ctx) => { ... },
  'PATCH /tasks/:id':  (ctx) => { ... },
  'DELETE /tasks/:id': (ctx) => { ... },
};
```

路由匹配优先级：精确匹配 > 参数匹配。路径参数通过 `ctx.params.id` 访问。

### 5.3 VMPool — VM 实例池

**文件**: `internal/vmruntime/vm_pool.go`

**职责**:
- 管理每个 workspace 的 VM 实例（懒加载 + 缓存）
- 检测代码更新（比较 hash），自动重新加载
- LRU 淘汰策略（限制最大 VM 数量）
- 提供 `Invalidate(workspaceID)` 接口供 deploy_logic 调用

**核心结构**:

```go
type VMPool struct {
    mu         sync.RWMutex
    vms        map[string]*WorkspaceVM
    vmStore    *VMStore              // 注意: 指针类型，非 interface
    codeLoader VMCodeLoader
    maxVMs     int                   // 最大缓存 VM 数，默认 100
    accessLog  map[string]time.Time  // LRU 用
}

func NewVMPool(vmStore *VMStore, codeLoader VMCodeLoader, maxVMs int) *VMPool

type VMCodeLoader interface {
    // 从 WorkspaceVersion.LogicCode 加载代码
    GetLogicCode(ctx context.Context, workspaceID string) (code string, hash string, err error)
}
```

**VMCodeLoader 实现**: `internal/vmruntime/code_loader.go`

```go
// GORMCodeLoader 通过 GORM 从 what_reverse_workspace_versions 表读取 LogicCode
type GORMCodeLoader struct {
    db *gorm.DB
}

func NewGORMCodeLoader(db *gorm.DB) *GORMCodeLoader
func (l *GORMCodeLoader) GetLogicCode(ctx context.Context, workspaceID string) (string, string, error)
// 返回: (code, sha256_hash, error)
// 查询逻辑: workspace.current_version_id → workspace_versions.logic_code
```

**生命周期**:

```
GetOrCreate(workspaceID)
  ├── 缓存命中 + 代码未更新 → 返回缓存 VM
  ├── 缓存命中 + 代码已更新 → 重建 VM, 替换缓存
  └── 缓存未命中 → 新建 VM, 加入缓存
       └── 缓存已满 → LRU 淘汰最久未访问的 VM

Invalidate(workspaceID)
  → 从缓存中移除, 下次请求时重建
```

### 5.4 vm_db_api — 注入 JS 的数据库 API

**文件**: `internal/vmruntime/vm_db_api.go`

**职责**:
- 向 goja JS VM 注入 `db` 全局对象
- 提供安全的数据库操作方法
- 所有方法使用参数化查询防止 SQL 注入

**API 清单**:

| JS API | 说明 | 示例 |
|--------|------|------|
| `db.query(sql, params?)` | SELECT 查询，返回行数组 | `db.query("SELECT * FROM tasks WHERE status = ?", ["done"])` |
| `db.queryOne(sql, params?)` | 单行查询，返回对象或 `null` | `db.queryOne("SELECT COUNT(*) as cnt FROM tasks")` |
| `db.insert(table, data)` | 插入行 | `db.insert("tasks", { title: "Buy milk", status: "todo" })` |
| `db.update(table, data, where)` | 更新行 | `db.update("tasks", { status: "done" }, { id: 1 })` |
| `db.delete(table, where)` | 删除行 | `db.delete("tasks", { id: 1 })` |
| `db.execute(sql, params?)` | 执行任意 SQL（含 DDL） | `db.execute("CREATE TABLE IF NOT EXISTS ...")` |

**返回值格式**:

```javascript
// db.query 返回
[
  { id: 1, title: "Buy milk", status: "todo" },
  { id: 2, title: "Write code", status: "done" }
]

// db.queryOne 返回
{ id: 1, title: "Buy milk", status: "todo" }
// 或
null

// db.insert 返回
{ lastInsertId: 3, affectedRows: 1 }

// db.update / db.delete 返回
{ affectedRows: 2 }

// db.execute 返回
{ affectedRows: 0 }
```

### 5.5 vm_sandbox — 安全沙箱

**文件**: `internal/vmruntime/vm_sandbox.go`

**职责**:
- 禁用危险全局对象
- 执行超时保护
- 内存限制（通过 goja interrupt 机制）

**禁用的全局对象**:

```go
vm.Set("require", goja.Undefined())
vm.Set("process", goja.Undefined())
vm.Set("eval", goja.Undefined())
vm.Set("Function", goja.Undefined())
vm.Set("globalThis", goja.Undefined())
vm.Set("Proxy", goja.Undefined())
vm.Set("Reflect", goja.Undefined())
```

**注入的安全 API**:

```go
vm.Set("console", consoleObj)      // console.log/warn/error/info → Go log 输出
vm.Set("db", dbObj)                // 数据库 API (见 5.4)
// JSON, Date, Math 等标准内置对象由 goja 自动提供
```

**超时控制**:

```go
const (
    VMExecTimeout    = 10 * time.Second  // 单次请求最大执行时间
    VMLoadTimeout    = 5 * time.Second   // 代码加载最大时间
    VMMaxCodeSize    = 1 << 20            // 代码最大 1MB
)
```

---

## 6. Agent 工具设计

### 6.1 新增工具列表

| 工具名 | 用途 | 需要确认 | 所在 Skill |
|--------|------|---------|-----------|
| `deploy_logic` | 部署 JS 业务逻辑代码到 workspace | 否 | VMRuntime |
| `get_logic` | 获取当前已部署的 JS 代码 | 否 | VMRuntime |
| `query_vm_data` | 查询 workspace SQLite 数据（LLM 了解数据状况） | 否 | VMRuntime |

### 6.2 deploy_logic

**文件**: `internal/service/agent_tools/deploy_logic.go`

**功能**: LLM 生成 JS 代码 → 保存到 `WorkspaceVersion.LogicCode` → 使 VM 缓存失效

**参数 Schema**:

```json
{
  "type": "object",
  "properties": {
    "workspace_id": { "type": "string" },
    "user_id": { "type": "string" },
    "code": {
      "type": "string",
      "description": "JavaScript code to deploy. Must export routes via exports.routes = { 'METHOD /path': handler }. Available APIs: db.query(), db.queryOne(), db.insert(), db.update(), db.delete(), db.execute(), console.log(). Handler receives ctx with: ctx.params, ctx.query, ctx.body, ctx.headers, ctx.user."
    }
  },
  "required": ["workspace_id", "user_id", "code"]
}
```

**执行流程**:

```
1. 校验 workspace_id, user_id
2. 校验代码非空
3. 调用 workspaceService.UpdateLogicCode() 保存 code 到 WorkspaceVersion.LogicCode
4. vmPool.Invalidate(workspaceID) — 使缓存失效
5. 返回成功，包含 version_id 和 version 号
```

> 注意：当前实现不做预加载语法检查（代码大小校验在 VM 加载时由 `validateCodeSize` 执行）。语法错误会在首次 VM 加载时报 503。

### 6.3 get_logic

**文件**: `internal/service/agent_tools/get_logic.go`

**功能**: 获取当前 workspace 已部署的 JS 代码，供 LLM 在修改前了解现状

**参数 Schema**:

```json
{
  "type": "object",
  "properties": {
    "workspace_id": { "type": "string" },
    "user_id": { "type": "string" }
  },
  "required": ["workspace_id", "user_id"]
}
```

### 6.4 query_vm_data

**文件**: `internal/service/agent_tools/query_vm_data.go`

**功能**: 在 workspace 的 SQLite 中执行 SQL 语句（SELECT/DDL/DML），帮助 LLM 了解数据状况或直接操作数据

**参数 Schema**:

```json
{
  "type": "object",
  "properties": {
    "workspace_id": { "type": "string", "description": "Workspace ID" },
    "sql": { "type": "string", "description": "SQL statement to execute" },
    "params": { "type": "array", "items": {}, "description": "Optional query parameters for parameterized queries" }
  },
  "required": ["workspace_id", "sql"]
}
```

**安全说明**: 允许所有 SQL 语句（SELECT/DDL/DML），因为每个 workspace 的 SQLite 文件是物理隔离的，不会影响其他 workspace 或主系统。

### 6.5 Agent System Prompt 变更

在 `agent_engine.go` 的 system prompt 中新增 VM 相关指导：

```
When building workspace applications, you have two modes:

1. **Schema Mode** (existing): Generate UI Schema JSON for standard layouts
   - Use generate_ui_schema / modify_ui_schema tools
   - Data accessed via built-in Data API

2. **VM Mode** (new): Write JavaScript business logic code
   - Use deploy_logic to write server-side JS code
   - Code runs in a sandboxed JS VM with access to a SQLite database
   - Available DB APIs: db.query(), db.queryOne(), db.insert(), db.update(), db.delete(), db.execute()
   - Define routes via: exports.routes = { 'GET /path': (ctx) => { ... } }
   - Use db.execute("CREATE TABLE IF NOT EXISTS ...") to create tables
   - Tables are managed in SQLite, completely isolated from the main system
   - The user can view and manage data via /dashboard/database

Prefer VM Mode for applications that need:
- Custom business logic (validation, computed fields, state machines)
- Multi-table transactions
- Aggregated API responses (combining data from multiple tables)
```

### 6.6 新增 Skill: VMRuntime

**文件**: `internal/service/skills/vm_runtime.go`

```go
func NewVMRuntimeSkill(
    workspaceService service.WorkspaceService,
    vmPool *vmruntime.VMPool,
    vmStore *vmruntime.VMStore,
) *service.Skill {
    return &service.Skill{
        ID:          "builtin_vm_runtime",
        Name:        "VM Runtime",
        Description: "Deploy and manage JavaScript business logic in the workspace VM runtime. Query the workspace's SQLite database directly.",
        Category:    service.SkillCategoryBusinessLogic,
        Icon:        "Terminal",
        Builtin:     true,
        Enabled:     true,
        Tools: []service.AgentTool{
            agent_tools.NewDeployLogicTool(workspaceService, vmPool),
            agent_tools.NewGetLogicTool(workspaceService),
            agent_tools.NewQueryVMDataTool(vmStore),
        },
        SystemPromptAddition: `You can deploy JavaScript business logic to workspace VM runtimes. The JS code runs in a sandboxed goja VM with access to a 'db' object for SQLite operations. Routes are defined via exports.routes. After deploying, the API is available at /runtime/{slug}/api/{path}. Always create database tables (via query_vm_data with CREATE TABLE) before deploying logic that references them.`,
    }
}
```

---

## 7. 前端适配

### 7.1 /dashboard/database — 前端无需改动

现有前端页面和 API 调用完全不变。后端已统一为 `VMDatabaseHandler`（SQLite-only），MySQL workspace 数据库已完全移除。

**后端 handler** (`workspace_db_query.go`):

```go
// VMDatabaseHandler 工作空间数据库处理器（SQLite via VMStore）
type VMDatabaseHandler struct {
    vmStore         *vmruntime.VMStore
    auditLogService service.AuditLogService
}

func (h *VMDatabaseHandler) ListTables(c echo.Context) error {
    workspaceID := c.Param("id")
    tables, err := h.vmStore.ListTables(ctx, workspaceID)
    // ...
}
```

**已移除的子页面**（MySQL 迁移完成后不再需要）:

| 子页面 | 状态 |
|--------|------|
| Functions | 已删除（SQLite 不支持存储过程） |
| Roles | 已删除（SQLite 无用户角色系统） |
| Migrations | 已删除（LLM 通过代码管理 schema） |

**保留的子页面**: Overview, Tables, SQL Editor, Schema Graph, Storage

### 7.2 Runtime 前端 — api_source 支持 (Phase 2)

在 `AppBlock` 配置中新增 `api_source` 字段，允许 schema block 从 VM API 获取数据而非直接查表：

```json
{
  "type": "stats_card",
  "label": "任务统计",
  "config": {
    "api_source": "/api/stats",
    "value_key": "total"
  }
}
```

需要修改 `runtime-data-provider.tsx`，当 block 配置中存在 `api_source` 时，调用 `/runtime/:slug/api/...` 而非 `/runtime/:slug/data/:table`。

---

## 8. 安全设计

### 8.1 威胁模型

| 威胁 | 风险 | 缓解措施 |
|------|------|---------|
| JS 代码死循环 | VM 挂起，影响其他请求 | 10s 执行超时 + `runtime.Interrupt()` |
| 内存耗尽 | Go 进程 OOM | goja 无内建内存限制，通过代码大小限制 (1MB) + 定期回收间接控制 |
| SQL 注入 | 数据泄露/破坏 | `db.query`/`db.insert`/`db.update`/`db.delete` 全部使用参数化查询 |
| 跨 workspace 访问 | 数据隔离破坏 | 每个 VM 只注入自己 workspace 的 `*sql.DB`，物理文件隔离 |
| 访问文件系统 | 服务器被攻破 | 禁用 `require`, `process`, `eval`, `Function` |
| 访问网络 | 内网探测/SSRF | 不注入 `fetch`/`http` API（Phase 1 不提供外部 HTTP 调用） |
| 恶意 DDL | 破坏数据 | SQLite 文件隔离 + 备份支持；`db.execute` 仅影响当前 workspace |

### 8.2 资源限制

**硬编码常量** (`vm_sandbox.go`):

```go
const (
    VMMaxCodeSize   = 1 << 20          // 1MB 代码大小限制
    VMExecTimeout   = 10 * time.Second // 单次请求最大执行时间
    VMLoadTimeout   = 5 * time.Second  // 代码加载最大时间
)
```

**可配置参数** (`VMRuntimeConfig` in `config.go`，通过 `config.yaml` 设置):

```go
type VMRuntimeConfig struct {
    Enabled       bool          `mapstructure:"enabled"`
    BaseDir       string        `mapstructure:"base_dir"`        // 默认 "data/vm"
    MaxVMs        int           `mapstructure:"max_vms"`         // 默认 100
    ExecTimeout   time.Duration `mapstructure:"exec_timeout"`    // 默认 10s
    LoadTimeout   time.Duration `mapstructure:"load_timeout"`    // 默认 5s
    MaxCodeSize   int64         `mapstructure:"max_code_size"`   // 默认 1MB
    MaxDBSize     int64         `mapstructure:"max_db_size"`     // 默认 100MB
    EvictInterval time.Duration `mapstructure:"evict_interval"` // 默认 30m
}
```

**硬编码配置** (`store.go`):
- SQLite `MaxOpenConns(1)` — 单写连接
- SQLite `busy_timeout = 5000` ms
- SQLite `journal_mode = WAL`

### 8.3 审计日志

通过 `VMDatabaseHandler` (`workspace_db_query.go`) 的 `recordAudit` 方法记录到现有审计日志系统：

| 事件 | 记录内容 |
|------|--------|
| `workspace.db.table.create` | workspace_id, user_id, table_name |
| `workspace.db.table.alter` | workspace_id, user_id, table_name |
| `workspace.db.table.drop` | workspace_id, user_id, table_name |
| `workspace.db.query.execute` | workspace_id, user_id, sql, affected_rows, duration_ms |

> 注意: `RuntimeVMHandler`（VM API handler）目前未记录审计日志。如需跟踪 VM API 请求，可在后续版本中添加。

---

## 9. 开发任务清单

### Phase 1: 核心 VM 引擎 + SQLite 存储

#### P1.1 基础设施

- [x] **P1.1.1** `go.mod` 引入 `github.com/dop251/goja` 依赖
- [x] **P1.1.2** `go.mod` 引入 `modernc.org/sqlite` 依赖
- [x] **P1.1.3** `WorkspaceVersion` entity 新增 `LogicCode *string` 字段
- [x] **P1.1.4** `database.go` AutoMigrate 确保新字段生效
- [x] **P1.1.5** 创建 `data/vm/` 目录结构 + `.gitkeep`
- [x] **P1.1.6** `config.go` 新增 `VMRuntime` 配置段（BaseDir, MaxVMs, ExecTimeout 等）

#### P1.2 VMStore — SQLite 连接管理

- [x] **P1.2.1** `internal/vmruntime/store.go` — VMStore 结构体 + GetDB/Close/Exists/Delete
- [x] **P1.2.2** `internal/vmruntime/store.go` — SQLite PRAGMA 配置（WAL, busy_timeout, foreign_keys）
- [x] **P1.2.3** `internal/vmruntime/store_query.go` — ListTables（使用 `sqlite_master`）
- [x] **P1.2.4** `internal/vmruntime/store_query.go` — GetTableSchema（使用 `PRAGMA table_info`）
- [x] **P1.2.5** `internal/vmruntime/store_query.go` — GetSchemaGraph（使用 `PRAGMA foreign_key_list`）
- [x] **P1.2.6** `internal/vmruntime/store_query.go` — GetStats（表数、行数、文件大小）
- [x] **P1.2.7** `internal/vmruntime/store_query.go` — QueryRows（分页、排序、过滤）
- [x] **P1.2.8** `internal/vmruntime/store_query.go` — InsertRow / UpdateRow / DeleteRows
- [x] **P1.2.9** `internal/vmruntime/store_query.go` — ExecuteSQL（任意 SQL 执行）
- [x] **P1.2.10** `internal/vmruntime/store.go` — BackupTo（文件复制备份）

#### P1.3 WorkspaceVM — JS VM 实例

- [x] **P1.3.1** `internal/vmruntime/vm.go` — WorkspaceVM 结构体定义
- [x] **P1.3.2** `internal/vmruntime/vm.go` — NewWorkspaceVM：创建 goja.Runtime + 注入 API + 执行代码
- [x] **P1.3.3** `internal/vmruntime/vm.go` — extractRoutes：从 `exports.routes` 提取路由映射
- [x] **P1.3.4** `internal/vmruntime/vm.go` — Handle：请求处理（路由匹配 + 执行 + 超时控制）
- [x] **P1.3.5** `internal/vmruntime/vm.go` — 路径参数匹配逻辑（`/tasks/:id` → `ctx.params.id`）

#### P1.4 vm_db_api — JS 数据库 API

- [x] **P1.4.1** `internal/vmruntime/vm_db_api.go` — injectDBAPI 函数
- [x] **P1.4.2** `internal/vmruntime/vm_db_api.go` — db.query 实现（参数化 SELECT）
- [x] **P1.4.3** `internal/vmruntime/vm_db_api.go` — db.queryOne 实现
- [x] **P1.4.4** `internal/vmruntime/vm_db_api.go` — db.insert 实现（安全构建 INSERT）
- [x] **P1.4.5** `internal/vmruntime/vm_db_api.go` — db.update 实现（安全构建 UPDATE + WHERE）
- [x] **P1.4.6** `internal/vmruntime/vm_db_api.go` — db.delete 实现（安全构建 DELETE + WHERE）
- [x] **P1.4.7** `internal/vmruntime/vm_db_api.go` — db.execute 实现（任意 SQL，含 DDL）
- [x] **P1.4.8** `internal/vmruntime/vm_db_api.go` — scanRows 辅助函数（通用行扫描）
- [x] **P1.4.9** `internal/vmruntime/vm_db_api.go` — buildInsert/buildSetClause/buildWhereClause 辅助函数

#### P1.5 vm_sandbox — 安全沙箱

- [x] **P1.5.1** `internal/vmruntime/vm_sandbox.go` — setupSandbox：禁用危险全局对象
- [x] **P1.5.2** `internal/vmruntime/vm_sandbox.go` — injectConsoleAPI：console.log → Go log
- [x] **P1.5.3** `internal/vmruntime/vm_sandbox.go` — 超时控制逻辑（goroutine + Interrupt）
- [x] **P1.5.4** `internal/vmruntime/vm_sandbox.go` — 代码大小校验（≤ 1MB）

#### P1.6 VMPool — VM 实例池

- [x] **P1.6.1** `internal/vmruntime/vm_pool.go` — VMPool 结构体 + NewVMPool
- [x] **P1.6.2** `internal/vmruntime/vm_pool.go` — GetOrCreate（懒加载 + 代码更新检测）
- [x] **P1.6.3** `internal/vmruntime/vm_pool.go` — Invalidate（代码部署后清除缓存）
- [x] **P1.6.4** `internal/vmruntime/vm_pool.go` — LRU 淘汰逻辑
- [x] **P1.6.5** `internal/vmruntime/vm_pool.go` — VMCodeLoader 接口 + WorkspaceService 适配器

#### P1.7 HTTP Handler — 路由注册

- [x] **P1.7.1** `internal/api/handler/runtime_vm.go` — RuntimeVMHandler 结构体
- [x] **P1.7.2** `internal/api/handler/runtime_vm.go` — HandleAPI 方法（slug 解析 → VM 获取 → 执行）
- [x] **P1.7.3** `internal/api/handler/runtime_vm.go` — 请求参数提取（query, body, headers, path params）
- [x] **P1.7.4** `internal/api/handler/runtime_vm.go` — X-App-Token 用户解析
- [x] **P1.7.5** `server.go` — 注册 `runtime.Any("/:workspaceSlug/api/*", runtimeVMHandler.HandleAPI)`
- [x] **P1.7.6** `server.go` — 初始化 VMStore, VMPool, RuntimeVMHandler

#### P1.8 Agent 工具

- [x] **P1.8.1** `internal/service/agent_tools/deploy_logic.go` — DeployLogicTool 完整实现
- [x] **P1.8.2** `internal/service/agent_tools/get_logic.go` — GetLogicTool 完整实现
- [x] **P1.8.3** `internal/service/agent_tools/query_vm_data.go` — QueryVMDataTool 完整实现
- [x] **P1.8.4** `server.go` — 注册三个新 Agent 工具到 agentToolRegistry
- [x] **P1.8.5** `workspace_service.go` — 新增 UpdateLogicCode / GetLogicCode 方法
- [x] **P1.8.6** `internal/service/skills/vm_runtime.go` — NewVMRuntimeSkill + 注册

#### P1.9 /dashboard/database 适配

- [x] **P1.9.1** `VMDatabaseHandler` — ListTables 实现（重写为 SQLite-only，调用 VMStore）
- [x] **P1.9.2** `VMDatabaseHandler` — GetTableSchema 实现
- [x] **P1.9.3** `VMDatabaseHandler` — QueryRows 实现
- [x] **P1.9.4** `VMDatabaseHandler` — InsertRow / UpdateRow / DeleteRows 实现
- [x] **P1.9.5** `VMDatabaseHandler` — ExecuteSQL 实现
- [x] **P1.9.6** `VMDatabaseHandler` — GetStats 实现
- [x] **P1.9.7** `VMDatabaseHandler` — GetSchemaGraph 实现
- [x] **P1.9.8** `server.go` — 创建 VMDatabaseHandler 并注册路由

### Phase 2: 前端 API Source + Agent System Prompt

#### P2.1 前端 api_source 支持

- [x] **P2.1.1** `types.ts` — AppBlock config 新增 `api_source?: ApiSource` 字段
- [x] **P2.1.2** `runtime-data-provider.tsx` — 支持 `api_source` 数据获取（调用 `/runtime/:slug/api/...`）
- [x] **P2.1.3** `app-renderer.tsx` — block 渲染支持 api_source 数据源

#### P2.2 Agent 增强

- [x] **P2.2.1** `agent_engine.go` — system prompt 新增 VM Mode 使用指导（via VMRuntimeSkill.SystemPromptAddition）
- [x] **P2.2.2** `skills/vm_runtime.go` — system prompt 附加内容（JS API 文档、最佳实践）

#### P2.3 database 页面优化

- [x] **P2.3.1** 前端 database/layout.tsx — VM 模式下隐藏 Functions 和 Roles 导航项
- [x] **P2.3.2** 前端 database/page.tsx — VM 模式下显示 "SQLite (VM)" 标识

### Phase 3: iframe 前端沙箱 (可选)

#### P3.1 前端自定义组件

- [x] **P3.1.1** `WorkspaceVersion` entity 新增 `ComponentCode *string` 字段
- [x] **P3.1.2** `components/app-renderer/blocks/custom-code-block.tsx` — iframe 渲染器
- [x] **P3.1.3** `components/app-renderer/sandbox/sandbox-host.tsx` — iframe 管理器
- [x] **P3.1.4** `components/app-renderer/sandbox/sandbox-bridge.ts` — postMessage 通信协议
- [x] **P3.1.5** `components/app-renderer/sandbox/sandbox-template.ts` — iframe HTML 模板
- [x] **P3.1.6** `types.ts` — AppBlockType 新增 `custom_code` 类型
- [x] **P3.1.7** `agent_tools/deploy_component.go` — 部署前端组件代码

---

## 10. 测试计划

### 10.1 单元测试

- [x] `vmruntime/store_test.go` — SQLite 连接管理、CRUD 操作（18 tests）
- [x] `vmruntime/vm_test.go` — JS 代码加载、路由提取、请求处理（15 tests）
- [x] `vmruntime/vm_db_api_test.go` — db.query/insert/update/delete 正确性（10 tests）
- [x] `vmruntime/vm_sandbox_test.go` — 危险 API 禁用、超时中断、DB API 存在性检查（9 tests）
- [x] `vmruntime/vm_pool_test.go` — 缓存命中、代码更新重建、LRU 淘汰（7 tests）
- [x] `agent_tools/deploy_logic_test.go` — 部署 + VM 缓存失效（8 tests）

### 10.2 集成测试

- [x] 完整流程: Agent deploy_logic → 建表 → 写路由 → /runtime/:slug/api/* 访问（9 tests in runtime_vm_integration_test.go）
- [x] 完整流程: Agent deploy_logic → /dashboard/database 查看表和数据
- [x] 代码更新: 部署新代码 → 旧 VM 失效 → 新代码生效
- [x] 错误恢复: JS 代码语法错误 → 返回友好错误信息（503）
- [x] 超时保护: JS 代码死循环 → 10s 后自动中断（500）

### 10.3 性能基准 (`vmruntime/benchmark_test.go`)

- [x] VM 创建速度: 目标 < 50ms → **实测 0.048ms**（47.6µs/op, 55KB alloc）
- [x] 请求处理延迟: 目标 < 10ms → **实测 0.002ms**（简单返回 2µs, DB查询 8.5µs）
- [x] SQLite 查询延迟: 目标 < 5ms → **实测 0.039ms**（1000行 SELECT 38.5µs, 带过滤排序 291µs）
- [x] 内存占用: 目标 < 10MB/VM → **实测 0.06MB/VM**（10个VM共0.55MB）

> **测试统计**: vmruntime 单元测试共 59 个（18+15+10+9+7）+ deploy_logic 单元测试 8 个 = **67 个单元测试**，9 个集成测试，11 个性能基准/测试（10 Benchmark + 1 TestVMMemoryUsage）。

---

## 11. 后续演进

### 11.1 已完成 (Phase 2-3)

- ✅ **api_source**: schema block 可调用 VM API 获取数据（P2.1.1-P2.1.3）
- ✅ **iframe sandbox**: 前端自定义组件，LLM 生成代码在 iframe 中运行（P3.1.1-P3.1.7）
- ✅ **文件上传**: workspace storage 文件上传/下载/删除（StorageObject + WorkspaceStorageService）
- ✅ **应用认证**: 运行时用户注册/登录（AppAuthProvider + RuntimeAuthHandler）
- ✅ **行级安全 (RLS)**: 基于用户的行级数据隔离（RLSPolicy + getRLSFilters）
- ✅ **页面参数传递**: 页面间导航 + hash-based 参数（PageParamsContext + row_click_action）

### 11.2 短期

- **定时任务**: 支持 `exports.cron` 定义定时执行的逻辑
- **WebSocket**: 支持 `exports.ws` 定义 WebSocket handler
- **外部 HTTP**: 受控的 `http.fetch()` API，允许调用外部 API
- **环境变量**: `exports.env` 定义密钥等配置，通过 `ctx.env.API_KEY` 访问

### 11.3 长期

- **多语言 VM**: 支持 Python/Lua 等其他脚本语言
- **热重载**: 代码更新后 0-downtime 切换
- **分布式**: VM 实例调度到多节点运行
- **Marketplace**: 用户可发布和共享 VM 应用模板

---

## 附录

### A. LLM 生成代码完整示例

以下是 LLM 为"任务管理应用"生成的完整 JS 代码：

```javascript
// ============================================================
// 任务管理应用 — LLM 生成的业务逻辑代码
// 运行环境: goja JS VM + SQLite
// ============================================================

// === 数据库初始化 ===
db.execute(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo' CHECK(status IN ('todo','in_progress','done','cancelled')),
    priority INTEGER DEFAULT 0 CHECK(priority BETWEEN 0 AND 3),
    assignee TEXT,
    due_date TEXT,
    tags TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )
`);

db.execute(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author TEXT DEFAULT 'Anonymous',
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

db.execute(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`);
db.execute(`CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee)`);
db.execute(`CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id)`);

// === API 路由 ===
exports.routes = {

  // --- 仪表盘统计 ---
  'GET /stats': (ctx) => {
    const total = db.queryOne('SELECT COUNT(*) as count FROM tasks');
    const byStatus = db.query(
      'SELECT status, COUNT(*) as count FROM tasks GROUP BY status'
    );
    const overdue = db.queryOne(
      "SELECT COUNT(*) as count FROM tasks WHERE due_date < date('now') AND status NOT IN ('done','cancelled')"
    );
    const recentDone = db.query(
      "SELECT * FROM tasks WHERE status = 'done' ORDER BY updated_at DESC LIMIT 5"
    );
    return {
      total: total.count,
      by_status: byStatus,
      overdue: overdue.count,
      recent_done: recentDone
    };
  },

  // --- 任务列表 ---
  'GET /tasks': (ctx) => {
    var sql = 'SELECT * FROM tasks';
    var conditions = [];
    var params = [];

    if (ctx.query.status) {
      conditions.push('status = ?');
      params.push(ctx.query.status);
    }
    if (ctx.query.assignee) {
      conditions.push('assignee = ?');
      params.push(ctx.query.assignee);
    }
    if (ctx.query.search) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      params.push('%' + ctx.query.search + '%');
      params.push('%' + ctx.query.search + '%');
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY priority DESC, created_at DESC';

    return db.query(sql, params);
  },

  // --- 获取单个任务 ---
  'GET /tasks/:id': (ctx) => {
    var task = db.queryOne('SELECT * FROM tasks WHERE id = ?', [ctx.params.id]);
    if (!task) throw new Error('Task not found');
    var comments = db.query(
      'SELECT * FROM comments WHERE task_id = ? ORDER BY created_at DESC',
      [ctx.params.id]
    );
    task.comments = comments;
    return task;
  },

  // --- 创建任务 ---
  'POST /tasks': (ctx) => {
    var data = ctx.body;
    if (!data.title) throw new Error('Title is required');
    return db.insert('tasks', {
      title: data.title,
      description: data.description || '',
      status: data.status || 'todo',
      priority: data.priority || 0,
      assignee: data.assignee || null,
      due_date: data.due_date || null,
      tags: JSON.stringify(data.tags || [])
    });
  },

  // --- 更新任务 ---
  'PATCH /tasks/:id': (ctx) => {
    var existing = db.queryOne('SELECT id FROM tasks WHERE id = ?', [ctx.params.id]);
    if (!existing) throw new Error('Task not found');

    var updates = {};
    var allowed = ['title', 'description', 'status', 'priority', 'assignee', 'due_date'];
    for (var i = 0; i < allowed.length; i++) {
      if (ctx.body[allowed[i]] !== undefined) {
        updates[allowed[i]] = ctx.body[allowed[i]];
      }
    }
    if (ctx.body.tags) {
      updates.tags = JSON.stringify(ctx.body.tags);
    }
    updates.updated_at = new Date().toISOString();

    return db.update('tasks', updates, { id: parseInt(ctx.params.id) });
  },

  // --- 删除任务 ---
  'DELETE /tasks/:id': (ctx) => {
    return db.delete('tasks', { id: parseInt(ctx.params.id) });
  },

  // --- 添加评论 ---
  'POST /tasks/:id/comments': (ctx) => {
    var task = db.queryOne('SELECT id FROM tasks WHERE id = ?', [ctx.params.id]);
    if (!task) throw new Error('Task not found');

    var author = ctx.user ? ctx.user.name : 'Anonymous';
    return db.insert('comments', {
      task_id: parseInt(ctx.params.id),
      content: ctx.body.content,
      author: author
    });
  }
};
```

### B. Go 依赖清单

```
github.com/dop251/goja           # JS VM 引擎 (纯 Go, 零 CGO)
modernc.org/sqlite                # SQLite 驱动 (纯 Go, 零 CGO)
```

### C. 配置示例

```yaml
# config.yaml 新增段
vm_runtime:
  enabled: true
  base_dir: "data/vm"            # SQLite 文件存储目录
  max_vms: 100                   # 最大缓存 VM 实例数
  exec_timeout: 10s              # 单次请求执行超时
  load_timeout: 5s               # 代码加载超时
  max_code_size: 1048576          # 代码最大 1MB
  max_db_size: 104857600          # SQLite 文件最大 100MB
  evict_interval: 30m             # LRU 淘汰检查间隔
```

---

## 12. 现有 Workspace 数据迁移方案

> ⚠️ **本章描述的 MySQL→SQLite 迁移已全部完成。** 下文中提到的"需要删除/替换"的文件均已在迁移过程中处理完毕。本章保留作为历史设计文档和迁移决策记录。

### 12.1 迁移概述

当前系统中，每个 workspace 的应用数据存储在独立的 MySQL 数据库（`ws_xxx`）中，通过 `WorkspaceDatabaseService` 管理数据库生命周期（创建用户、授权、加密密码、连接池）。

迁移目标：**将所有现有 workspace 的 MySQL 数据完整迁移到 SQLite 文件，并移除旧的 MySQL workspace 数据库基础设施。**

```
迁移前:                              迁移后:
                                    
主系统 MySQL                         主系统 MySQL
├── what_reverse_users               ├── what_reverse_users
├── what_reverse_workspaces          ├── what_reverse_workspaces
├── what_reverse_workspace_databases ├── what_reverse_workspace_databases (标记 migrated)
├── what_reverse_workspace_db_roles  │
├── what_reverse_workspace_versions  ├── what_reverse_workspace_versions (+LogicCode)
│                                    │
工作空间 MySQL 数据库                 工作空间 SQLite 文件
├── ws_xxxxxxxx (database 1)    →→→  ├── data/vm/{wsID-1}.db
│   ├── vehicles                     │   ├── vehicles (table)
│   ├── drivers                      │   ├── drivers (table)
│   └── alerts                       │   └── alerts (table)
├── ws_yyyyyyyy (database 2)    →→→  ├── data/vm/{wsID-2}.db
│   ├── products                     │   ├── products (table)
│   └── orders                       │   └── orders (table)
└── ...                              └── ...
```

### 12.2 迁移范围

#### 12.2.1 需要迁移的数据

| 数据类型 | 来源 | 目标 | 说明 |
|----------|------|------|------|
| **workspace 表结构** | MySQL `ws_xxx` 各表 DDL | SQLite `{wsID}.db` 中的表 | MySQL → SQLite 语法转换 |
| **workspace 表数据** | MySQL `ws_xxx` 各表行数据 | SQLite `{wsID}.db` 对应表中 | 逐表导出导入 |
| **workspace 索引** | MySQL 索引定义 | SQLite 索引 | 自动转换 |
| **workspace 外键** | MySQL FK 约束 | SQLite FK 约束 | 需要启用 `PRAGMA foreign_keys=ON` |

#### 12.2.2 需要删除/替换的后端代码

| 文件路径 | 类型 | 迁移动作 |
|----------|------|---------|
| `entity/workspace_database.go` | Entity | **已删除** — 迁移完成后不再需要，已从 AutoMigrate 移除 |
| `entity/workspace_db_role.go` | Entity | **删除** — SQLite 无用户角色概念 |
| `entity/workspace_db_schema_migration.go` | Entity | **删除** — LLM 通过代码管理 schema |
| `repository/workspace_database_repo.go` | Repository | **已删除** — 迁移完成后不再需要 |
| `repository/workspace_db_role_repo.go` | Repository | **删除** |
| `repository/workspace_db_schema_migration_repo.go` | Repository | **删除** |
| `service/workspace_database_service.go` | Service | **删除** — Provision/Migrate/Backup 等 MySQL 操作全部移除 |
| `service/workspace_db_runtime.go` | Service | **替换** — 用 VMStore 替代 |
| `service/workspace_db_query_service.go` | Service | **替换** — 用 VMStore 方法替代 |
| `service/workspace_db_role_service.go` | Service | **删除** — SQLite 无角色 |
| `service/workspace_db_schema_migration_service.go` | Service | **删除** — LLM 管理 schema |
| `handler/workspace_database.go` | Handler | **大幅简化** — 移除 Provision/Migrate/Backup/Roles 等端点 |
| `handler/workspace_db_query.go` | Handler | **替换** — 改为调用 VMStore |
| `handler/runtime_data.go` | Handler | **替换** — 改为调用 VMStore |
| `pkg/workspace_db/migrations.go` | Package | **删除** — MySQL 迁移脚本不再需要 |
| `pkg/crypto/encryptor.go` | Package | **保留** — API key 加密仍在用，但不再用于 workspace DB 密码 |

#### 12.2.3 需要修改的后端代码

| 文件路径 | 修改内容 |
|----------|---------|
| `server.go` | 移除 MySQL workspace DB 初始化，替换为 VMStore 初始化 |
| `server.go` | 移除 `WorkspaceDatabaseService`, `WorkspaceDBRoleService`, `WorkspaceDBRuntime` 创建 |
| `server.go` | `WorkspaceDBQueryHandler` 改为注入 VMStore |
| `server.go` | `RuntimeDataHandler` 改为注入 VMStore |
| `server.go` | 移除 `/database/roles`, `/database/migrate`, `/database/backup` 等路由 |
| `server.go` | Agent 工具 `create_table` 改为使用 VMStore |
| `skills/data_modeling.go` | 依赖 `WorkspaceDBQueryService` → 改为 VMStore |
| `skills/business_logic.go` | 依赖 `WorkspaceDBQueryService` → 改为 VMStore |
| `agent_tools/create_table.go` | 从 MySQL 建表改为 SQLite 建表 |
| `database.go` | AutoMigrate 移除 `WorkspaceDBRole`, `WorkspaceDBSchemaMigration` |

#### 12.2.4 需要修改的前端代码

| 文件路径 | 修改内容 |
|----------|---------|
| `lib/api/workspace-database.ts` | 移除 Roles 相关 API 方法（`listRoles`, `createRole`, `rotateRole`, `revokeRole`） |
| `database/layout.tsx` | 隐藏 Functions、Roles 导航项 |
| `database/roles/page.tsx` | **删除** 或替换为提示页面 |
| `database/functions/page.tsx` | **删除** 或替换为提示页面 |
| `database/migrations/page.tsx` | 简化为版本记录展示（LLM 管理 schema） |

#### 12.2.5 需要迁移的 seed 数据

现有 `cmd/seed/main.go` 中的 workspace 数据需要改为直接写入 SQLite：

| seed 内容 | 现有方式 | 迁移后 |
|-----------|---------|--------|
| vehicles 表 + 20 条数据 | `INSERT INTO ws_xxx.vehicles` (MySQL) | `INSERT INTO vehicles` (SQLite `{wsID}.db`) |
| drivers 表 + 18 条数据 | MySQL | SQLite |
| trips 表 + 数据 | MySQL | SQLite |
| fuel_records 表 + 数据 | MySQL | SQLite |
| maintenance_records 表 + 数据 | MySQL | SQLite |
| alerts 表 + 数据 | MySQL | SQLite |
| ev_charging 表 + 数据 | MySQL | SQLite |
| geofences 表 + 数据 | MySQL | SQLite |
| app_users 表 | MySQL | 保留在主系统 MySQL（认证数据） |

### 12.3 MySQL → SQLite 数据类型映射

| MySQL 类型 | SQLite 类型 | 说明 |
|-----------|-------------|------|
| `INT` / `BIGINT` | `INTEGER` | SQLite 统一整数类型 |
| `VARCHAR(n)` | `TEXT` | SQLite 无长度限制 |
| `TEXT` / `LONGTEXT` | `TEXT` | 直接映射 |
| `FLOAT` / `DOUBLE` / `DECIMAL(m,n)` | `REAL` | SQLite 统一浮点类型 |
| `DATETIME` / `TIMESTAMP` | `TEXT` | 存为 ISO 8601 字符串 |
| `DATE` | `TEXT` | 存为 `YYYY-MM-DD` |
| `BOOLEAN` / `TINYINT(1)` | `INTEGER` | 0/1 |
| `ENUM(...)` | `TEXT CHECK(col IN (...))` | 用 CHECK 约束替代 |
| `JSON` | `TEXT` | 存为 JSON 字符串，可用 SQLite JSON 函数查询 |
| `BLOB` | `BLOB` | 直接映射 |
| `AUTO_INCREMENT` | `AUTOINCREMENT` | 仅 `INTEGER PRIMARY KEY AUTOINCREMENT` |

### 12.4 DDL 转换规则

#### MySQL → SQLite CREATE TABLE 转换示例

**MySQL 原始 DDL:**
```sql
CREATE TABLE vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plate_number VARCHAR(20) NOT NULL,
  brand VARCHAR(50) NOT NULL,
  model VARCHAR(50),
  vehicle_type ENUM('轿车','货车','客车','新能源') NOT NULL,
  status ENUM('在线','离线','维修中','已报废','停运') DEFAULT '离线',
  mileage DECIMAL(10,1) DEFAULT 0,
  purchase_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_plate (plate_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**转换后 SQLite DDL:**
```sql
CREATE TABLE vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plate_number TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT,
  vehicle_type TEXT NOT NULL CHECK(vehicle_type IN ('轿车','货车','客车','新能源')),
  status TEXT DEFAULT '离线' CHECK(status IN ('在线','离线','维修中','已报废','停运')),
  mileage REAL DEFAULT 0,
  purchase_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(plate_number)
);
```

**关键转换规则:**
1. `AUTO_INCREMENT` → `AUTOINCREMENT`（仅 `INTEGER PRIMARY KEY` 上有效）
2. `ENUM(...)` → `TEXT CHECK(col IN (...))`
3. `VARCHAR(n)` → `TEXT`
4. `DECIMAL(m,n)` → `REAL`
5. `DATETIME DEFAULT CURRENT_TIMESTAMP` → `TEXT DEFAULT (datetime('now'))`
6. `ON UPDATE CURRENT_TIMESTAMP` → 移除（SQLite 不支持，需在应用层处理）
7. `ENGINE=InnoDB ...` → 移除（SQLite 无存储引擎概念）
8. `UNIQUE KEY name (col)` → `UNIQUE(col)` 或 `CREATE UNIQUE INDEX`

### 12.5 迁移工具设计

#### 12.5.1 迁移命令

新增一个独立的迁移命令 `cmd/migrate-to-sqlite/main.go`：

```
go run ./cmd/migrate-to-sqlite \
  --config config.yaml \
  --dry-run           # 可选: 仅预览，不实际执行
  --workspace <id>    # 可选: 仅迁移指定 workspace
```

#### 12.5.2 迁移流程

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: 扫描所有 workspace_databases 记录 (status=ready) │
│   SELECT * FROM what_reverse_workspace_databases         │
│   WHERE status = 'ready'                                │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼ (for each workspace)
┌─────────────────────────────────────────────────────────┐
│ Step 2: 连接源 MySQL 数据库 (ws_xxx)                      │
│   解密 SecretRef → 构建 DSN → 连接                       │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ Step 3: 获取所有表的 DDL 和数据                            │
│   SHOW TABLES → SHOW CREATE TABLE → SELECT * FROM ...   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ Step 4: 转换 DDL (MySQL → SQLite 语法)                   │
│   - AUTO_INCREMENT → AUTOINCREMENT                      │
│   - ENUM → CHECK                                        │
│   - VARCHAR → TEXT                                      │
│   - DECIMAL → REAL                                      │
│   - 移除 ENGINE/CHARSET                                 │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ Step 5: 创建 SQLite 文件 + 建表                           │
│   data/vm/{workspaceID}.db                              │
│   执行转换后的 CREATE TABLE 语句                          │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ Step 6: 导入数据                                         │
│   批量 INSERT (每 500 行一批, 使用事务)                    │
│   处理类型转换 (DATETIME → TEXT, ENUM → TEXT 等)          │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ Step 7: 验证数据完整性                                    │
│   对比源表和目标表的行数                                   │
│   对比关键字段的 checksum                                 │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ Step 8: 更新 workspace_databases 记录                     │
│   UPDATE what_reverse_workspace_databases                │
│   SET status = 'migrated' WHERE id = ...                │
└─────────────────────────────────────────────────────────┘
```

#### 12.5.3 迁移工具伪代码

```go
func migrateWorkspace(wsDB *entity.WorkspaceDatabase, cfg config.Config) error {
    // 1. 连接源 MySQL
    password := decrypt(wsDB.SecretRef, cfg.Encryption.Key)
    mysqlDSN := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s", wsDB.DBUser, password, host, port, wsDB.DBName)
    srcDB, _ := sql.Open("mysql", mysqlDSN)
    defer srcDB.Close()

    // 2. 创建目标 SQLite
    sqlitePath := filepath.Join(cfg.VMRuntime.BaseDir, wsDB.WorkspaceID.String()+".db")
    dstDB, _ := sql.Open("sqlite", sqlitePath+"?_journal_mode=WAL&_foreign_keys=on")
    defer dstDB.Close()

    // 3. 获取所有表
    tables := listMySQLTables(srcDB)

    for _, table := range tables {
        // 4. 获取 MySQL DDL 并转换
        mysqlDDL := getMySQLCreateTable(srcDB, table)
        sqliteDDL := convertDDL(mysqlDDL)

        // 5. 在 SQLite 中建表
        dstDB.Exec(sqliteDDL)

        // 6. 导入数据
        rows := queryAllRows(srcDB, table)
        insertBatch(dstDB, table, rows, 500)

        // 7. 验证
        srcCount := countRows(srcDB, table)
        dstCount := countRows(dstDB, table)
        if srcCount != dstCount {
            return fmt.Errorf("row count mismatch for %s: %d vs %d", table, srcCount, dstCount)
        }
    }

    return nil
}
```

#### 12.5.4 DDL 转换器

```go
// convertDDL 将 MySQL CREATE TABLE 语句转换为 SQLite 兼容格式
func convertDDL(mysqlDDL string) string {
    result := mysqlDDL

    // 1. 移除 ENGINE/CHARSET/COLLATE 子句
    result = regexp.MustCompile(`\)\s*ENGINE=.*$`).ReplaceAllString(result, ")")

    // 2. AUTO_INCREMENT → AUTOINCREMENT
    // 注意: SQLite 中 AUTOINCREMENT 仅用于 INTEGER PRIMARY KEY
    result = strings.ReplaceAll(result, "AUTO_INCREMENT", "AUTOINCREMENT")

    // 3. INT 类型统一
    result = regexp.MustCompile(`\bBIGINT\b`).ReplaceAllString(result, "INTEGER")
    result = regexp.MustCompile(`\bINT\b`).ReplaceAllString(result, "INTEGER")
    result = regexp.MustCompile(`\bTINYINT\(\d+\)\b`).ReplaceAllString(result, "INTEGER")

    // 4. VARCHAR(n) → TEXT
    result = regexp.MustCompile(`VARCHAR\(\d+\)`).ReplaceAllString(result, "TEXT")

    // 5. DECIMAL(m,n) / FLOAT / DOUBLE → REAL
    result = regexp.MustCompile(`DECIMAL\(\d+,\d+\)`).ReplaceAllString(result, "REAL")
    result = regexp.MustCompile(`\bFLOAT\b`).ReplaceAllString(result, "REAL")
    result = regexp.MustCompile(`\bDOUBLE\b`).ReplaceAllString(result, "REAL")

    // 6. DATETIME / TIMESTAMP → TEXT
    result = regexp.MustCompile(`\bDATETIME\b`).ReplaceAllString(result, "TEXT")
    result = regexp.MustCompile(`\bTIMESTAMP\b`).ReplaceAllString(result, "TEXT")
    result = regexp.MustCompile(`\bDATE\b`).ReplaceAllString(result, "TEXT")

    // 7. CURRENT_TIMESTAMP → datetime('now')
    result = strings.ReplaceAll(result, "DEFAULT CURRENT_TIMESTAMP", "DEFAULT (datetime('now'))")

    // 8. ON UPDATE CURRENT_TIMESTAMP → 移除
    result = regexp.MustCompile(`ON UPDATE CURRENT_TIMESTAMP`).ReplaceAllString(result, "")

    // 9. ENUM('a','b','c') → TEXT CHECK(col IN ('a','b','c'))
    // 这需要更复杂的解析，提取列名和 ENUM 值
    result = convertEnumToCheck(result)

    // 10. 移除 MySQL 特有的 KEY/INDEX 语法 (单独创建 INDEX)
    result = removeMySQLKeyDefinitions(result)

    // 11. UNIQUE KEY name (col) → UNIQUE(col)
    result = convertUniqueKeys(result)

    return result
}
```

### 12.6 Runtime Data Handler 迁移

现有 `runtime_data.go` 中的 `RuntimeDataHandler` 通过 `WorkspaceDBQueryService` 访问 MySQL 数据，需要改为通过 `VMStore` 访问 SQLite。

#### 12.6.1 现有调用链

```
/runtime/:slug/data/:table
  → RuntimeDataHandler.QueryRows
    → resolveWorkspaceID(slug)        // RuntimeService 不变
    → queryService.QueryRows(wsID, table, params)  // MySQL
      → dbRuntime.GetConnection(wsID)  // MySQL 连接池
      → 执行 SQL 查询
```

#### 12.6.2 迁移后调用链

```
/runtime/:slug/data/:table
  → RuntimeDataHandler.QueryRows
    → resolveWorkspaceID(slug)        // RuntimeService 不变
    → vmStore.QueryRows(wsID, table, params)  // SQLite
      → vmStore.GetDB(wsID)            // SQLite 文件
      → 执行 SQL 查询
```

#### 12.6.3 RuntimeDataHandler 修改

```go
// 修改前
type RuntimeDataHandler struct {
    runtimeService     service.RuntimeService
    queryService       service.WorkspaceDBQueryService  // MySQL
    rlsService         service.WorkspaceRLSService
    runtimeAuthService service.RuntimeAuthService
}

// 修改后
type RuntimeDataHandler struct {
    runtimeService     service.RuntimeService
    vmStore            *vmruntime.VMStore                // SQLite
    rlsService         service.WorkspaceRLSService
    runtimeAuthService service.RuntimeAuthService
}
```

所有 `h.queryService.QueryRows/InsertRow/UpdateRow/DeleteRows` 调用改为 `h.vmStore.QueryRows/InsertRow/UpdateRow/DeleteRows`。

### 12.7 server.go 迁移

#### 12.7.1 移除的初始化代码

```go
// ===== 以下全部移除 =====
workspaceDatabaseRepo := repository.NewWorkspaceDatabaseRepository(s.db)
workspaceDBSchemaMigrationRepo := repository.NewWorkspaceDBSchemaMigrationRepository(s.db)
workspaceDBRoleRepo := repository.NewWorkspaceDBRoleRepository(s.db)

workspaceDatabaseService, err := service.NewWorkspaceDatabaseService(...)
workspaceDBRoleService, err := service.NewWorkspaceDBRoleService(...)
workspaceDBRuntime, err := service.NewWorkspaceDBRuntime(...)
workspaceDBQueryService := service.NewWorkspaceDBQueryService(workspaceDBRuntime)

workspaceDatabaseHandler := handler.NewWorkspaceDatabaseHandler(...)
workspaceDBQueryHandler := handler.NewWorkspaceDBQueryHandler(...)
```

#### 12.7.2 替换为 VMStore 初始化

```go
// ===== 新增（在 server.go 早期初始化）=====
vmStore := vmruntime.NewVMStore(s.config.VMRuntime.BaseDir)
vmCodeLoader := vmruntime.NewGORMCodeLoader(s.db)
vmPool := vmruntime.NewVMPool(vmStore, vmCodeLoader, s.config.VMRuntime.MaxVMs)

// 替换 handler 创建
vmDatabaseHandler := handler.NewVMDatabaseHandler(vmStore, auditLogService)
runtimeVMHandler := handler.NewRuntimeVMHandler(runtimeService, vmPool, runtimeAuthService)

// RuntimeDataHandler 改为注入 VMStore (rlsService 为 variadic 参数)
runtimeDataHandler := handler.NewRuntimeDataHandler(runtimeService, vmStore, workspaceRLSService)
runtimeDataHandler.SetRuntimeAuthService(runtimeAuthService)

// VMRuntimeSkill 注册到 skillRegistry（通过 LoadToolsIntoRegistry 自动加载 3 个 VM 工具）
_ = skillRegistry.Register(skills.NewVMRuntimeSkill(workspaceService, vmPool, vmStore))
```

#### 12.7.3 路由变更

```go
// ===== 移除的路由 =====
workspaces.POST("/:id/database", ...)                           // Provision
workspaces.GET("/:id/database", ...)                            // Get DB info
workspaces.POST("/:id/database/rotate-secret", ...)             // Rotate secret
workspaces.POST("/:id/database/migrate", ...)                   // MySQL migration
workspaces.GET("/:id/database/migrations/plan", ...)            // Migration plan
workspaces.POST("/:id/database/migrations", ...)                // Submit migration
workspaces.GET("/:id/database/migrations/:migrationId", ...)    // Get migration
workspaces.POST("/:id/database/migrations/:migrationId/approve", ...)
workspaces.POST("/:id/database/migrations/:migrationId/reject", ...)
workspaces.POST("/:id/database/migrations/:migrationId/execute", ...)
workspaces.POST("/:id/database/backup", ...)                    // Backup
workspaces.POST("/:id/database/restore", ...)                   // Restore
workspaces.POST("/:id/database/roles", ...)                     // Create role
workspaces.GET("/:id/database/roles", ...)                      // List roles
workspaces.POST("/:id/database/roles/:roleId/rotate", ...)      // Rotate role
workspaces.POST("/:id/database/roles/:roleId/revoke", ...)      // Revoke role

// ===== 保留但改为 VMStore 实现的路由 =====
workspaces.GET("/:id/database/tables", vmDatabaseHandler.ListTables)
workspaces.GET("/:id/database/tables/:table/schema", vmDatabaseHandler.GetTableSchema)
workspaces.POST("/:id/database/tables", vmDatabaseHandler.CreateTable)
workspaces.PATCH("/:id/database/tables/:table", vmDatabaseHandler.AlterTable)
workspaces.DELETE("/:id/database/tables/:table", vmDatabaseHandler.DropTable)
workspaces.GET("/:id/database/tables/:table/rows", vmDatabaseHandler.QueryRows)
workspaces.POST("/:id/database/tables/:table/rows", vmDatabaseHandler.InsertRow)
workspaces.PATCH("/:id/database/tables/:table/rows", vmDatabaseHandler.UpdateRow)
workspaces.DELETE("/:id/database/tables/:table/rows", vmDatabaseHandler.DeleteRows)
workspaces.POST("/:id/database/query", vmDatabaseHandler.ExecuteSQL)
workspaces.GET("/:id/database/query/history", vmDatabaseHandler.GetQueryHistory)
workspaces.GET("/:id/database/stats", vmDatabaseHandler.GetStats)
workspaces.GET("/:id/database/schema-graph", vmDatabaseHandler.GetSchemaGraph)

// ===== 新增 VM API 路由 =====
runtime.Any("/:workspaceSlug/api/*", runtimeVMHandler.HandleAPI)
```

### 12.8 Seed 数据迁移

现有 `cmd/seed/main.go` 中 `ensureWorkspaceDatabase` 函数创建 MySQL 数据库并插入种子数据。需要改为创建 SQLite 文件。

#### 12.8.1 现有 seed 流程

```go
func ensureWorkspaceDatabase(db *gorm.DB, ws *entity.Workspace, cfg *config.Config) {
    // 1. 创建 MySQL 数据库 ws_xxx
    // 2. 创建 MySQL 用户 wsu_xxx
    // 3. GRANT 权限
    // 4. 加密密码存入 what_reverse_workspace_databases
    // 5. 连接 ws_xxx
    // 6. CREATE TABLE vehicles/drivers/trips/... (MySQL 语法)
    // 7. INSERT INTO ... VALUES ... (批量插入种子数据)
}
```

#### 12.8.2 迁移后 seed 流程

```go
func ensureWorkspaceDatabase(db *gorm.DB, ws *entity.Workspace, cfg *config.Config) {
    // 1. 创建 SQLite 文件 data/vm/{workspaceID}.db
    sqlitePath := filepath.Join(cfg.VMRuntime.BaseDir, ws.ID.String()+".db")
    sqliteDB, _ := sql.Open("sqlite", sqlitePath+"?_journal_mode=WAL&_foreign_keys=on")
    defer sqliteDB.Close()

    // 2. CREATE TABLE (SQLite 语法)
    sqliteDB.Exec(`CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plate_number TEXT NOT NULL UNIQUE,
        brand TEXT NOT NULL,
        ...
    )`)

    // 3. INSERT INTO (语法基本兼容)
    sqliteDB.Exec(`INSERT INTO vehicles (...) VALUES (...)`)

    // 4. 不需要: 创建 MySQL 用户、授权、加密密码
    // 5. 可选: 在 what_reverse_workspace_databases 中记录 status='sqlite'
}
```

#### 12.8.3 SQL 语法差异（seed 数据）

| MySQL 语法 | SQLite 语法 | seed 中出现位置 |
|-----------|-------------|----------------|
| `NOW()` | `datetime('now')` | created_at/updated_at 默认值 |
| `DATE_SUB(NOW(), INTERVAL n HOUR)` | `datetime('now', '-n hours')` | ts() 时间辅助函数 |
| `ENUM(...)` | `TEXT CHECK(...)` | vehicles.status, vehicle_type 等 |
| `DECIMAL(10,1)` | `REAL` | mileage, fuel_consumed 等 |
| `TINYINT(1)` | `INTEGER` | boolean 字段 |
| `ON UPDATE CURRENT_TIMESTAMP` | _(移除)_ | updated_at |
| `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci` | _(移除)_ | 所有 CREATE TABLE |

### 12.9 前端 workspace-database API 迁移

#### 12.9.1 移除的 API 方法

```typescript
// lib/api/workspace-database.ts 中移除:
workspaceDatabaseApi.listRoles(workspaceId)
workspaceDatabaseApi.createRole(workspaceId, roleType, expiresAt)
workspaceDatabaseApi.rotateRole(workspaceId, roleId)
workspaceDatabaseApi.revokeRole(workspaceId, roleId, reason)
```

#### 12.9.2 移除的 TypeScript 类型

```typescript
// 移除:
export interface DatabaseRole { ... }
```

#### 12.9.3 保留的 API 方法（无需改动）

以下方法的前端调用代码完全不变，因为后端 API 路径和响应格式保持一致：

```typescript
workspaceDatabaseApi.listTables(workspaceId)           // ✅ 保留
workspaceDatabaseApi.getTableSchema(workspaceId, name)  // ✅ 保留
workspaceDatabaseApi.createTable(workspaceId, req)      // ✅ 保留
workspaceDatabaseApi.alterTable(workspaceId, name, req) // ✅ 保留
workspaceDatabaseApi.dropTable(workspaceId, name)       // ✅ 保留
workspaceDatabaseApi.queryRows(workspaceId, name, p)    // ✅ 保留
workspaceDatabaseApi.insertRow(workspaceId, name, data) // ✅ 保留
workspaceDatabaseApi.updateRow(workspaceId, name, data) // ✅ 保留
workspaceDatabaseApi.deleteRows(workspaceId, name, ids) // ✅ 保留
workspaceDatabaseApi.executeSQL(workspaceId, sql)       // ✅ 保留
workspaceDatabaseApi.getQueryHistory(workspaceId)       // ✅ 保留
workspaceDatabaseApi.getStats(workspaceId)              // ✅ 保留
workspaceDatabaseApi.getSchemaGraph(workspaceId)        // ✅ 保留
```

#### 12.9.4 database 页面导航修改

```typescript
// database/layout.tsx — 移除 Functions、Roles、Migrations、RLS Policies
const navItems = [
  { href: '/dashboard/database', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/database/tables', label: 'Tables', icon: Table2 },
  { href: '/dashboard/database/sql', label: 'SQL Editor', icon: Terminal },
  { href: '/dashboard/database/schema-graph', label: 'Schema Graph', icon: Network },
  { href: '/dashboard/database/storage', label: 'Storage', icon: HardDrive },
]
```

### 12.10 迁移任务清单

#### M1. 迁移工具

- [x] **M1.1** `cmd/migrate-to-sqlite/main.go` — 迁移命令入口（参数解析、config 加载）
- [x] **M1.2** `cmd/migrate-to-sqlite/scanner.go` — 扫描所有 `status=ready` 的 workspace_databases 记录
- [x] **M1.3** `cmd/migrate-to-sqlite/converter.go` — MySQL DDL → SQLite DDL 转换器
- [x] **M1.4** `cmd/migrate-to-sqlite/exporter.go` — 从 MySQL 导出表结构和数据
- [x] **M1.5** `cmd/migrate-to-sqlite/importer.go` — 导入数据到 SQLite（批量 INSERT + 事务）
- [x] **M1.6** `cmd/migrate-to-sqlite/validator.go` — 验证迁移数据完整性（行数对比）
- [x] **M1.7** `cmd/migrate-to-sqlite/main.go` — `--dry-run` 模式支持
- [x] **M1.8** `cmd/migrate-to-sqlite/main.go` — `--workspace <id>` 单 workspace 迁移支持

#### M2. 后端代码移除

- [x] **M2.1** 删除 `entity/workspace_db_role.go`
- [x] **M2.2** 删除 `entity/workspace_db_schema_migration.go`
- [x] **M2.3** 删除 `repository/workspace_db_role_repo.go`
- [x] **M2.4** 删除 `repository/workspace_db_schema_migration_repo.go`
- [x] **M2.5** 删除 `service/workspace_database_service.go`（~1060 行）
- [x] **M2.6** 删除 `service/workspace_db_role_service.go`
- [x] **M2.7** 删除 `service/workspace_db_schema_migration_service.go`
- [x] **M2.8** 删除 `service/workspace_db_runtime.go`（被 VMStore 替代）
- [x] **M2.9** 删除 `service/workspace_db_query_service.go`（被 VMStore 替代）
- [x] **M2.10** 删除 `handler/workspace_database.go`（Provision/Migrate/Backup/Roles handler）
- [x] **M2.11** 删除 `pkg/workspace_db/migrations.go`
- [x] **M2.12** `database.go` — AutoMigrate 移除 `WorkspaceDBRole`, `WorkspaceDBSchemaMigration`

#### M3. 后端代码替换

- [x] **M3.1** `handler/workspace_db_query.go` — 内部 struct 重写为 `VMDatabaseHandler`（调用 VMStore，文件名未变）
- [x] **M3.2** `handler/runtime_data.go` — 从 `WorkspaceDBQueryService` 切换到 `VMStore`
- [x] **M3.3** `server.go` — 移除 MySQL workspace DB 初始化，替换为 VMStore
- [x] **M3.4** `server.go` — 移除 16 条 `/database/` 旧路由（Provision/Migrate/Backup/Roles）
- [x] **M3.5** `server.go` — 更新保留的 13 条 `/database/` 路由指向 vmDatabaseHandler
- [x] **M3.6** `server.go` — RuntimeDataHandler 注入改为 VMStore
- [x] **M3.7** `agent_tools/create_table.go` — 从 MySQL 建表改为 SQLite 建表（使用 VMStore）
- [x] **M3.8** `skills/data_modeling.go` — 依赖从 `WorkspaceDBQueryService` 改为 VMStore
- [x] **M3.9** `skills/business_logic.go` — 依赖从 `WorkspaceDBQueryService` 改为 VMStore
- [x] **M3.10** `service/permissions.go` — 移除 `PermissionWorkspaceDBAccess` 中的 MySQL 特定逻辑

#### M4. Seed 数据迁移

- [x] **M4.1** `cmd/seed/main.go` — `ensureWorkspaceDatabase` 改为创建 SQLite 文件
- [x] **M4.2** `cmd/seed/main.go` — 所有 `CREATE TABLE` 语句从 MySQL 语法转为 SQLite 语法
- [x] **M4.3** `cmd/seed/main.go` — `ts()` 时间函数改为 SQLite 的 `datetime('now', ...)` 格式
- [x] **M4.4** `cmd/seed/main.go` — 移除 MySQL 用户创建 / GRANT / 加密密码逻辑
- [x] **M4.5** `cmd/seed/main.go` — `INSERT` 语句中的 `NOW()` 改为 `datetime('now')`
- [x] **M4.6** `cmd/seed/main.go` — ENUM 值验证改为 CHECK 约束验证

#### M5. 前端迁移

- [x] **M5.1** `lib/api/workspace-database.ts` — 移除 `DatabaseRole` 类型和 4 个 Roles API 方法
- [x] **M5.2** `database/layout.tsx` — 移除 Functions 和 Roles 导航项
- [x] **M5.3** `database/roles/page.tsx` — 删除或替换为 "不可用" 提示
- [x] **M5.4** `database/functions/page.tsx` — 删除或替换为 "不可用" 提示
- [x] **M5.5** `database/migrations/page.tsx` — 简化为版本记录展示
- [x] **M5.6** `database/page.tsx` — Overview 页显示 "SQLite" 标识

#### M6. 验证与清理

- [x] **M6.1** `go build ./...` — 确保编译通过
- [x] **M6.2** `npx tsc --noEmit` — 确保前端类型检查通过
- [x] **M6.3** 运行 seed 脚本验证 SQLite 数据正确创建
- [x] **M6.4** 验证 `/dashboard/database` 页面正常显示 SQLite 表和数据
- [x] **M6.5** 验证 `/runtime/:slug/data/:table` 从 SQLite 正常读取数据
- [x] **M6.6** 验证 Agent `create_table` 工具在 SQLite 中正常建表
- [x] **M6.7** 可选: 删除已迁移的 MySQL `ws_xxx` 数据库（当前无 ws_xxx 数据库，跳过）
- [x] **M6.8** 可选: 清理 `what_reverse_workspace_databases` 中的旧记录（已从 AutoMigrate 移除，表不存在则跳过）

### 12.11 迁移执行顺序

```
阶段 1: 准备（不影响线上）
  M1.1-M1.8  实现迁移工具
  M4.1-M4.6  修改 seed 脚本

阶段 2: 新建 VMStore（并行开发）
  P1.1-P1.9  实现 VM 引擎和 VMStore (参见第 9 章任务清单)

阶段 3: 执行迁移
  运行 migrate-to-sqlite 工具，将所有现有 workspace 数据导入 SQLite

阶段 4: 切换代码（一次性切换）
  M2.1-M2.12  删除旧 MySQL workspace DB 代码
  M3.1-M3.10  替换为 VMStore 实现
  M5.1-M5.6   前端适配

阶段 5: 验证
  M6.1-M6.8  编译、测试、验证

阶段 6: 清理（确认无问题后）
  M6.7-M6.8  删除旧 MySQL workspace 数据库和记录
```

### 12.12 回滚方案

如果迁移后发现问题，可以回滚：

1. **代码回滚**: Git revert 到迁移前的 commit
2. **数据回滚**: MySQL `ws_xxx` 数据库未被删除（阶段 6 才删除），直接恢复代码即可使用
3. **SQLite 文件**: 删除 `data/vm/*.db` 即可清理

**关键**: 阶段 6（删除 MySQL 数据库）之前，整个迁移都是可回滚的。
