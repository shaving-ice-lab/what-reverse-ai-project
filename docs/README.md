# AgentFlow 文档中心

> **项目名称**: AgentFlow  
> **产品定位**: 本地优先、代码级自定义、社区驱动的 AI Agent 工作流平台  
> **文档更新**: 2026-02-03

---

## 📚 文档目录结构

```
docs/
├── README.md                 # 本文件 - 文档导航
├── api/                      # API 相关文档
│   ├── API-FIELDS.md         # API 字段定义（合并版）
│   ├── ERROR-CODES.md        # API 错误码参考
│   └── creative-assistant-api.md  # 创意助手 API
├── architecture/             # 架构设计文档
│   ├── ARCHITECTURE.md       # 系统架构设计
│   ├── BACKEND-SERVICE-BOUNDARIES.md  # 服务边界定义
│   └── DEPLOYMENT-MULTI-REGION.md     # 多区域部署
├── development/              # 开发相关文档
│   ├── DEVELOPMENT.md        # 开发环境搭建指南
│   ├── DEVELOPMENT-TODOLIST.md  # 开发任务清单
│   ├── ADMIN-TODOLIST.md      # Admin 项目任务清单
│   ├── DEV-PLAN-WORKSPACE-APP-PLATFORM.md  # 平台开发计划
│   ├── CONFIGURATION.md      # 配置管理指南
│   └── SDK-CLI-PLAN.md       # SDK/CLI 开发计划
├── product/                  # 产品相关文档
│   ├── PRD.md               # 产品需求文档
│   ├── ROADMAP.md           # 产品路线图
│   └── MARKET-ANALYSIS.md   # 市场分析
├── operations/               # 运维相关文档
│   ├── OPS-SUPPORT-SOPS.md  # 运维 SOP
│   ├── TEST-CASE-TEMPLATES.md  # 测试用例模板
│   └── SQL-SCHEMA-INDEX-CONSTRAINTS.md  # 数据库索引约束
├── standards/                # 标准与规范
│   ├── ADR-TEMPLATE.md      # 架构决策记录模板
│   ├── CHANGELOG-STANDARD.md # 变更日志规范
│   ├── MAJOR-CHANGE-APPROVAL.md  # 重大变更审批流程
│   ├── REVIEW-GUIDELINES.md  # 代码评审指南
│   └── STYLE-SIDEBAR-MINIMAL.md # UI 样式规范
├── public/                   # 对外公开文档
│   ├── README.md            # 公开文档目录
│   ├── QUICKSTART.md        # 快速开始
│   ├── API-REFERENCE.md     # API 参考
│   └── RUNTIME-GUIDE.md     # 运行时指南
├── requirements/             # 需求文档
│   ├── FEATURE-AI-CREATIVE-ASSISTANT.md  # AI 创意助手需求
│   ├── PHASE-1-MVP.md       # Phase 1 MVP 需求
│   ├── PHASE-2-DIFFERENTIATION.md  # Phase 2 差异化需求
│   └── PHASE-3-COMMUNITY.md # Phase 3 社区生态需求
└── templates/                # AI 模板
    ├── README.md            # 模板说明
    └── *.json               # 模板定义文件
```

---

## 🎯 快速导航

### 核心文档

| 文档 | 描述 | 优先阅读 |
|------|------|----------|
| [PRD.md](./product/PRD.md) | 产品需求文档 - 完整的产品定义 | ⭐⭐⭐ |
| [ROADMAP.md](./product/ROADMAP.md) | 产品路线图 - 分阶段规划和里程碑 | ⭐⭐⭐ |
| [ARCHITECTURE.md](./architecture/ARCHITECTURE.md) | 技术架构 - 系统设计和技术选型 | ⭐⭐⭐ |
| [DEVELOPMENT.md](./development/DEVELOPMENT.md) | 开发指南 - 环境搭建和开发流程 | ⭐⭐ |
| [DEVELOPMENT-TODOLIST.md](./development/DEVELOPMENT-TODOLIST.md) | 开发任务清单 - 500+任务进度跟踪 | ⭐⭐⭐ |
| [ADMIN-TODOLIST.md](./development/ADMIN-TODOLIST.md) | Admin 管理台任务清单 - 控制台建设路线 | ⭐⭐ |
| [MARKET-ANALYSIS.md](./product/MARKET-ANALYSIS.md) | 市场分析 - 竞品、痛点、趋势 | ⭐⭐ |

### 需求文档

| 文档 | 描述 | 阶段 |
|------|------|------|
| [Phase 1: MVP](./requirements/PHASE-1-MVP.md) | MVP 闭环 - 执行引擎、工作流存储 | 4-6 周 |
| [Phase 2: 差异化](./requirements/PHASE-2-DIFFERENTIATION.md) | 差异化功能 - 本地模式、Ollama、调试 | 6-8 周 |
| [Phase 3: 社区](./requirements/PHASE-3-COMMUNITY.md) | 社区生态 - Agent 商店、创作者经济 | 8-12 周 |
| [AI 创意助手](./requirements/FEATURE-AI-CREATIVE-ASSISTANT.md) | **核心功能** - 一键生成完整商业方案 | P0 |

### API 文档

| 文档 | 描述 |
|------|------|
| [API-FIELDS.md](./api/API-FIELDS.md) | API 字段定义（Workspace/App/Domain/Runtime） |
| [ERROR-CODES.md](./api/ERROR-CODES.md) | API 错误码参考 |
| [创意助手 API](./api/creative-assistant-api.md) | 创意助手完整 API 接口文档 |

### 架构文档

| 文档 | 描述 |
|------|------|
| [ARCHITECTURE.md](./architecture/ARCHITECTURE.md) | 系统架构设计 |
| [BACKEND-SERVICE-BOUNDARIES.md](./architecture/BACKEND-SERVICE-BOUNDARIES.md) | 后端服务边界定义 |
| [DEPLOYMENT-MULTI-REGION.md](./architecture/DEPLOYMENT-MULTI-REGION.md) | 多区域部署策略 |

### 开发文档

| 文档 | 描述 |
|------|------|
| [DEVELOPMENT.md](./development/DEVELOPMENT.md) | 开发环境搭建指南 |
| [CONFIGURATION.md](./development/CONFIGURATION.md) | 配置管理指南 |
| [SDK-CLI-PLAN.md](./development/SDK-CLI-PLAN.md) | SDK/CLI 开发计划 |
| [DEV-PLAN-WORKSPACE-APP-PLATFORM.md](./development/DEV-PLAN-WORKSPACE-APP-PLATFORM.md) | 平台开发详细计划 |
| [ADMIN-TODOLIST.md](./development/ADMIN-TODOLIST.md) | Admin 管理台开发任务清单 |

### 运维文档

| 文档 | 描述 |
|------|------|
| [OPS-SUPPORT-SOPS.md](./operations/OPS-SUPPORT-SOPS.md) | 运维标准操作流程 |
| [TEST-CASE-TEMPLATES.md](./operations/TEST-CASE-TEMPLATES.md) | 测试用例模板 |
| [SQL-SCHEMA-INDEX-CONSTRAINTS.md](./operations/SQL-SCHEMA-INDEX-CONSTRAINTS.md) | 数据库索引和约束 |

### 标准规范

| 文档 | 描述 |
|------|------|
| [ADR-TEMPLATE.md](./standards/ADR-TEMPLATE.md) | 架构决策记录模板 |
| [CHANGELOG-STANDARD.md](./standards/CHANGELOG-STANDARD.md) | 变更日志规范 |
| [MAJOR-CHANGE-APPROVAL.md](./standards/MAJOR-CHANGE-APPROVAL.md) | 重大变更审批流程 |
| [REVIEW-GUIDELINES.md](./standards/REVIEW-GUIDELINES.md) | 代码评审指南 |
| [STYLE-SIDEBAR-MINIMAL.md](./standards/STYLE-SIDEBAR-MINIMAL.md) | UI 样式规范 |

### 公共文档

| 文档 | 描述 |
|------|------|
| [public/README.md](./public/README.md) | 对外公开文档入口与导航 |
| [QUICKSTART.md](./public/QUICKSTART.md) | 快速开始指南 |
| [API-REFERENCE.md](./public/API-REFERENCE.md) | API 参考文档 |
| [RUNTIME-GUIDE.md](./public/RUNTIME-GUIDE.md) | Runtime 运行时说明 |

### 模板系统

| 文档 | 描述 |
|------|------|
| [模板中心 README](./templates/README.md) | 模板系统说明和自定义指南 |
| [商业计划生成器](./templates/business-plan-generator.json) | 完整商业计划书模板 |
| [自媒体内容策划](./templates/content-strategy-generator.json) | 账号定位、选题库、变现路径 |
| [爆款选题生成器](./templates/viral-topics-generator.json) | 批量生成50+选题创意 |
| [PRD文档生成器](./templates/prd-generator.json) | 完整产品需求文档 |

### UI/UX 设计系统

| 文档 | 描述 |
|------|------|
| [design-system/MASTER.md](../design-system/agentflow/MASTER.md) | 完整设计规范 (含 Tailwind 速查表) |
| [design-system/pages/auth.md](../design-system/agentflow/pages/auth.md) | 认证页面设计规范 |
| [design-system/pages/dashboard.md](../design-system/agentflow/pages/dashboard.md) | 仪表板设计规范 |
| [design-system/pages/editor.md](../design-system/agentflow/pages/editor.md) | 编辑器设计规范 |
| [design-system/pages/settings.md](../design-system/agentflow/pages/settings.md) | 设置页面设计规范 |

---

## 📊 项目状态

### 当前进度

| 阶段 | 完成度 | 状态 |
|------|--------|------|
| Phase 1: MVP | ~91% | ✅ 基本完成 |
| Phase 1.5: 创意助手 | ~96% | ✅ 基本完成 |
| Phase 2: 差异化功能 | ~37% | ⚠️ 进行中 |
| Phase 3: 社区生态 | ~74% | ⚠️ 进行中 |

### 模块状态

| 模块 | 完成度 | 状态 |
|------|--------|------|
| 后端执行引擎 | 90% | ✅ 基本完成 |
| 节点系统 (22+ 类型) | 90% | ✅ 基本完成 |
| 可视化编辑器 | 90% | ✅ 基本完成 |
| AI 创意助手 | 96% | ✅ 基本完成 |
| Agent 商店 | 92% | ✅ 基本完成 |
| Tauri 桌面应用 | 50% | ⚠️ 进行中 |
| 创作者经济 | 60% | ⚠️ 进行中 |

> 详细进度请查看 [DEVELOPMENT-TODOLIST.md](./development/DEVELOPMENT-TODOLIST.md)

---

## 🔗 相关链接

- **设计规范**: [design-system/agentflow/](../design-system/agentflow/) - 完整设计系统
- **SDK 文档**: [packages/sdk/README.md](../packages/sdk/README.md)

---

## 📝 文档规范

### 文档命名
- 核心文档: 大写 + 连字符 (如 `MARKET-ANALYSIS.md`)
- 需求文档: `PHASE-X-NAME.md` 格式
- UI 文档: 数字前缀 (如 `01-global-styles.md`)

### 文档结构
1. 标题和元信息
2. 目录 (长文档必须)
3. 正文内容
4. 附录和变更记录

### 更新规范
- 每次更新需更新文档版本和日期
- 重大变更需记录在变更记录中

---

> **提示**: 文档持续更新中，如有问题或建议请提 Issue。
