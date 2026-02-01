# AgentFlow 文档中心

> **项目名称**: AgentFlow  
> **产品定位**: 本地优先、代码级自定义、社区驱动的 AI Agent 工作流平台  
> **文档更新**: 2026-01-29

---

## 📚 文档目录

### 核心文档

| 文档 | 描述 | 优先阅读 |
|------|------|----------|
| [PRD.md](./PRD.md) | 产品需求文档 - 完整的产品定义 | ⭐⭐⭐ |
| [ROADMAP.md](./ROADMAP.md) | 产品路线图 - 分阶段规划和里程碑 | ⭐⭐⭐ |
| [DEVELOPMENT-TODOLIST.md](./DEVELOPMENT-TODOLIST.md) | **开发任务清单** - 500+任务进度跟踪 | ⭐⭐⭐ |
| [MARKET-ANALYSIS.md](./MARKET-ANALYSIS.md) | 市场分析 - 竞品、痛点、趋势 | ⭐⭐ |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 技术架构 - 系统设计和技术选型 | ⭐⭐⭐ |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | 开发指南 - 环境搭建和开发流程 | ⭐⭐ |

### 需求文档

| 文档 | 描述 | 阶段 |
|------|------|------|
| [Phase 1: MVP](./requirements/PHASE-1-MVP.md) | MVP 闭环 - 执行引擎、工作流存储 | 4-6 周 |
| [Phase 2: 差异化](./requirements/PHASE-2-DIFFERENTIATION.md) | 差异化功能 - 本地模式、Ollama、调试 | 6-8 周 |
| [Phase 3: 社区](./requirements/PHASE-3-COMMUNITY.md) | 社区生态 - Agent 商店、创作者经济 | 8-12 周 |
| [AI 创意助手](./requirements/FEATURE-AI-CREATIVE-ASSISTANT.md) | **核心功能** - 一键生成完整商业方案 | P0 |

### 模板系统

| 文档 | 描述 |
|------|------|
| [模板中心 README](./templates/README.md) | 模板系统说明和自定义指南 |
| [商业计划生成器](./templates/business-plan-generator.json) | 完整商业计划书模板 |
| [自媒体内容策划](./templates/content-strategy-generator.json) | 账号定位、选题库、变现路径 |
| [爆款选题生成器](./templates/viral-topics-generator.json) | 批量生成50+选题创意 |
| [PRD文档生成器](./templates/prd-generator.json) | 完整产品需求文档 |

### API 文档

| 文档 | 描述 |
|------|------|
| [AI创意助手 API](./api/creative-assistant-api.md) | 创意助手完整 API 接口文档 |

### UI/UX 设计系统

| 文档 | 描述 |
|------|------|
| [design-system/MASTER.md](../design-system/agentflow/MASTER.md) | 完整设计规范 (含 Tailwind 速查表) |
| [design-system/pages/auth.md](../design-system/agentflow/pages/auth.md) | 认证页面设计规范 |
| [design-system/pages/dashboard.md](../design-system/agentflow/pages/dashboard.md) | 仪表板设计规范 |
| [design-system/pages/editor.md](../design-system/agentflow/pages/editor.md) | 编辑器设计规范 |
| [design-system/pages/settings.md](../design-system/agentflow/pages/settings.md) | 设置页面设计规范 |

---

## 🎯 快速导航

### 我想了解产品定位
→ 阅读 [PRD.md](./PRD.md) 第 1-3 章

### 我想了解市场机会
→ 阅读 [MARKET-ANALYSIS.md](./MARKET-ANALYSIS.md)

### 我想了解开发计划
→ 阅读 [ROADMAP.md](./ROADMAP.md)

### 我想开始开发 Phase 1
→ 阅读 [Phase 1 需求文档](./requirements/PHASE-1-MVP.md)

### 我想了解技术架构
→ 阅读 [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 📊 项目状态

### 当前进度

| 模块 | 完成度 | 状态 |
|------|--------|------|
| 可视化编辑器 | 90% | ✅ 基本完成 |
| 节点系统 | 70% | ⚠️ 需完善 |
| 执行引擎 | 30% | ⚠️ 待实现 |
| 用户系统 | 50% | ⚠️ 需完善 |
| Agent 商店 | 0% | ❌ 未开始 |
| 本地模式 | 0% | ❌ 未开始 |

### 下一步优先级

1. **P0**: 实现后端执行引擎
2. **P0**: 完成工作流 CRUD API
3. **P0**: LLM/HTTP 节点真实调用
4. **P1**: WebSocket 实时日志
5. **P1**: Tauri 桌面应用框架

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
