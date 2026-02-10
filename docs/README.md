# ReverseAI（AgentFlow）文档中心

> **当前方向**：工作流应用平台（Workspace + App + 独立数据库 + 公开访问/域名）  
> **唯一计划入口**：`docs/development/DEV-PLAN-WORKSPACE-APP-PLATFORM.md`  
> **最后整理**：2026-02-05

---

## 快速导航

- **开发总计划（唯一入口）**：[DEV-PLAN-WORKSPACE-APP-PLATFORM.md](./development/DEV-PLAN-WORKSPACE-APP-PLATFORM.md)
- **开发环境与流程**：[DEVELOPMENT.md](./development/DEVELOPMENT.md)
- **配置与环境变量**：[CONFIGURATION.md](./development/CONFIGURATION.md)
- **架构与边界**
  - [PRODUCT-GOALS.md](./architecture/PRODUCT-GOALS.md)
  - [GLOSSARY.md](./architecture/GLOSSARY.md)
  - [SYSTEM-ARCHITECTURE.md](./architecture/SYSTEM-ARCHITECTURE.md)
  - [BACKEND-SERVICE-BOUNDARIES.md](./architecture/BACKEND-SERVICE-BOUNDARIES.md)
- **API（字段与错误码）**
  - [API-FIELDS.md](./api/API-FIELDS.md)
  - [ERROR-CODES.md](./api/ERROR-CODES.md)
- **对外公开文档入口**：[public/README.md](./public/README.md)
- **运维与 SRE**
  - [OPS-SUPPORT-SOPS.md](./operations/OPS-SUPPORT-SOPS.md)
  - [SRE-RUNBOOKS.md](./operations/SRE-RUNBOOKS.md)
  - [SQL-SCHEMA-INDEX-CONSTRAINTS.md](./operations/SQL-SCHEMA-INDEX-CONSTRAINTS.md)
  - [TEST-CASE-TEMPLATES.md](./operations/TEST-CASE-TEMPLATES.md)
- **工程规范与流程**：见 `docs/standards/`
- **SDK/CLI**
  - 规划：[SDK-CLI-PLAN.md](./development/SDK-CLI-PLAN.md)
  - 指南：[SDK-CLI-USER-GUIDE.md](./SDK-CLI-USER-GUIDE.md)

---

## 整理说明（2026-02-05）

- 已移除与「工作流应用平台（Workspace + App）」方向不一致的旧文档（如 `docs/product/`、`docs/requirements/`、`docs/templates/`、创意助手 API、旧 Todo 清单等）。如需回溯请查看 Git 历史。

---

## 目录结构

```text
docs/
├── README.md
├── SDK-CLI-USER-GUIDE.md
├── api/
│   ├── API-FIELDS.md
│   └── ERROR-CODES.md
├── architecture/
│   ├── BACKEND-SERVICE-BOUNDARIES.md
│   ├── DATA-CONSISTENCY.md
│   ├── DEPLOYMENT-MULTI-REGION.md
│   ├── GLOSSARY.md
│   ├── PRODUCT-GOALS.md
│   └── SYSTEM-ARCHITECTURE.md
├── development/
│   ├── DEV-PLAN-WORKSPACE-APP-PLATFORM.md
│   ├── DEVELOPMENT.md
│   ├── CONFIGURATION.md
│   ├── SDK-CLI-PLAN.md
│   └── TESTING-RELEASE-STRATEGY.md
├── operations/
│   ├── OPS-SUPPORT-SOPS.md
│   ├── SQL-SCHEMA-INDEX-CONSTRAINTS.md
│   ├── SRE-RUNBOOKS.md
│   └── TEST-CASE-TEMPLATES.md
├── public/
│   ├── README.md
│   ├── QUICKSTART.md
│   ├── API-REFERENCE.md
│   └── RUNTIME-GUIDE.md
└── standards/
    ├── ADR-TEMPLATE.md
    ├── CHANGELOG-STANDARD.md
    ├── DEVELOPMENT-STANDARDS.md
    ├── MAJOR-CHANGE-APPROVAL.md
    ├── PERMISSION-MODEL.md
    ├── REVIEW-GUIDELINES.md
    ├── SECURITY-BASELINE.md
    └── STYLE-SIDEBAR-MINIMAL.md
```

---

## 文档规范（简版）

- **唯一计划入口**：所有平台落地任务仅在 `development/DEV-PLAN-WORKSPACE-APP-PLATFORM.md` 追加与追踪
- **命名**：优先使用大写 + 连字符（如 `SYSTEM-ARCHITECTURE.md`）
- **结构**：标题与元信息 / 目录（长文档必须） / 正文 / 变更记录

---

## 相关链接

- **设计规范**：`../design-system/agentflow/`
- **SDK 包说明**：`../packages/sdk/README.md`
