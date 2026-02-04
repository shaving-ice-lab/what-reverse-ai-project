# 配置管理与环境变量规范

本规范用于统一配置来源、覆盖顺序、命名规则与清单维护方式。

## 1. 配置来源与优先级

服务端配置加载顺序（从低到高）：
1. 代码默认值（`apps/server/internal/config/config.go#setDefaults`）。
2. `apps/server/config/config.yaml` 基础配置。
3. `apps/server/config/config.{env}.yaml` 环境覆盖（`env=development|test|production`）。
4. 环境变量覆盖（服务端使用 `AGENTFLOW_` 前缀）。

说明：
- `env` 的来源为 `AGENTFLOW_ENV` 或 `config.yaml` 顶层 `env` 字段。
- 推荐在 CI/CD 或生产环境使用环境变量覆盖敏感字段。

## 2. 服务端配置清单（Server）

- 配置目录：`apps/server/config/`
- 完整字段模板：`apps/server/config/config.example.yaml`
- 环境变量命名规则：
  - 前缀固定：`AGENTFLOW_`
  - 规则：`database.host` → `AGENTFLOW_DATABASE_HOST`
  - 示例：`queue.queues.workflow` → `AGENTFLOW_QUEUE_QUEUES_WORKFLOW`
  - 示例：`retention.cleanup_interval` → `AGENTFLOW_RETENTION_CLEANUP_INTERVAL`

### 2.1 核心字段（按分组）

- `env`
- `server`: `host` / `port` / `mode` / `base_url`
- `deployment`: `region` / `primary_region` / `regions` / `region_base_urls`
- `database`: `host` / `port` / `user` / `password` / `name` / `charset` / `max_open_conns` / `max_idle_conns`
- `redis`: `host` / `port` / `password` / `db`
- `execution`: `max_concurrent` / `max_in_flight` / `timeout`
- `queue`: `worker_concurrency` / `queues.workflow` / `queues.webhook` / `queues.scheduled`
- `jwt`: `secret` / `access_token_expire` / `refresh_token_expire`
- `captcha`: `provider` / `secret` / `verify_url` / `timeout_seconds`
- `ai`: `openai_api_key` / `anthropic_api_key` / `default_model`
- `encryption`: `key`
- `features`: `workspace_enabled` / `app_runtime_enabled` / `domain_enabled`
- `domain_routing`: `provider` / `webhook_url` / `webhook_token` / `timeout_seconds`
- `certificate_issuer`: `provider` / `webhook_url` / `webhook_token` / `timeout_seconds`
- `migration`: `workspace_backfill_enabled` / `workspace_consistency_check`
- `security`: `data_classification_enabled` / `pii_sanitization_enabled` / `audit_logging_enabled` / `audit_log_retention_days` / `compliance_check_enabled` / `key_rotation_warning_days`
- `retention`: `enabled` / `cleanup_interval` / `execution_log_retention_days` / `anonymous_session_retention_days` / `workspace_deletion_grace_days` / `workspace_cold_storage_days`

说明：
- `deployment.regions` 可使用 `AGENTFLOW_DEPLOYMENT_REGIONS`（逗号分隔）覆盖。

> 维护规范：新增配置字段时，必须同步更新 `config.example.yaml` 与本清单。

## 3. 前端环境变量清单（Web）

本地开发使用 `apps/web/.env.local`，模板见 `apps/web/.env.example`。

- `NEXT_PUBLIC_API_URL`: API 基础地址
- `NEXT_PUBLIC_WS_URL`: WebSocket 地址
- `NEXT_PUBLIC_GITHUB_CLIENT_ID`: GitHub OAuth Client ID（可选）
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Google OAuth Client ID（可选）
- `NEXT_PUBLIC_ENABLE_LOCAL_MODE`: 本地模式开关
- `NEXT_PUBLIC_ENABLE_ANALYTICS`: 统计开关
- `NEXT_PUBLIC_OPENAI_API_KEY`: 前端 LLM 调试使用的 API Key（可选）
- `TAURI_ENV_PLATFORM`: Tauri 构建标记（构建期）
- `NODE_ENV`: Next.js 运行模式（框架注入）

## 4. SDK/CLI 环境变量清单

用于 `packages/sdk` CLI 发布命令：
- `AGENTFLOW_MARKETPLACE_URL`: 市场 API 地址
- `AGENTFLOW_PUBLISH_URL`: 发布地址（优先于 marketplace）
- `AGENTFLOW_API_BASE`: API 基础地址（兜底）
- `AGENTFLOW_PUBLISH_TOKEN`: 发布令牌
- `AGENTFLOW_API_TOKEN`: API 访问令牌
- `AGENTFLOW_TOKEN`: 访问令牌（兜底）

## 5. 桌面端（Desktop）签名环境变量

桌面端代码签名使用变量较多，完整清单见：
- `apps/desktop/docs/CODE_SIGNING.md`

