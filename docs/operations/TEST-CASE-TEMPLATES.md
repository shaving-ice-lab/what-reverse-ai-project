# Workspace/App 平台测试用例模板与安全基准

> 目标：提供可复用的测试用例模板与安全基准，覆盖 Workspace、App 公开访问、DB Provision 与域名绑定场景。  
> 适用：手工验证、回归测试、自动化用例编写。

---

## 通用约定

- `{{server_base_url}}` 默认 `http://localhost:8080`
- `{{api_base_url}}` 默认 `/api/v1`
- `{{runtime_base_url}}` 默认 `/runtime`；域名绑定场景使用根路径 `/`
- 认证头：`Authorization: Bearer {{jwt_token}}`

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `{{server_base_url}}` | 服务基础地址 | `http://localhost:8080` |
| `{{workspace_id}}` | Workspace ID | `b0b1...` |
| `{{workspace_slug}}` | Workspace Slug | `demo-workspace` |
| `{{workspace_id}}` | App ID | `a1a2...` |
| `{{app_slug}}` | App Slug | `demo-app` |
| `{{app_version_id}}` | App Version ID | `v-id...` |
| `{{domain}}` | 绑定域名 | `app.example.com` |
| `{{domain_id}}` | 域名记录 ID | `d0d1...` |
| `{{member_user_id}}` | 成员用户 ID | `u0u1...` |
| `{{jwt_token}}` | 登录 Token | `eyJ...` |
| `{{captcha_token}}` | 验证码 Token | `token...` |
| `{{backup_id}}` | 备份 ID | `bk_...` |

### 自动化测试环境变量

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `TEST_SERVER_BASE_URL` | 服务基础地址 | `http://localhost:8080` |
| `TEST_API_BASE_URL` | API 地址 | `http://localhost:8080/api/v1` |
| `TEST_RUNTIME_BASE_URL` | Runtime 地址 | `http://localhost:8080/runtime` |
| `TEST_JWT_TOKEN` | 登录 Token | 无 |
| `TEST_WORKSPACE_ID` | Workspace ID | 无 |
| `TEST_WORKSPACE_SLUG` | Workspace Slug | 无 |
| `TEST_APP_ID` | App ID | 无 |
| `TEST_APP_SLUG` | App Slug | 无 |
| `TEST_APP_VERSION_ID` | App Version ID | 无 |
| `TEST_APP_DOMAIN` | 绑定域名 | 无 |
| `TEST_APP_DOMAIN_ID` | 域名记录 ID | 无 |
| `TEST_MEMBER_USER_ID` | 成员用户 ID | 无 |
| `TEST_CAPTCHA_TOKEN` | 验证码 Token | 无 |
| `TEST_BACKUP_ID` | 备份 ID | 无 |

---

## 1. Workspace 测试用例模板

### 1.1 目标

验证 Workspace 创建/读取/更新/成员管理与权限控制。

### 1.2 覆盖模块

- `apps/server/internal/api/handler/workspace.go`
- `apps/server/internal/service/workspace_service.go`
- `apps/server/internal/api/server.go`
- `apps/web/src/lib/api/workspace.ts`

### 1.3 关键接口

- `GET /api/v1/workspaces`
- `POST /api/v1/workspaces`
- `GET /api/v1/workspaces/:id`
- `PATCH /api/v1/workspaces/:id`
- `GET /api/v1/workspaces/:id/members`
- `POST /api/v1/workspaces/:id/members`
- `PATCH /api/v1/workspaces/:id/members/:memberId`

### 1.4 前置条件

- `{{jwt_token}}` 已获取
- 工作空间功能已开启（`WORKSPACE_ENABLED`）
- 具备一个非成员账号用于权限测试

### 1.5 测试数据

| 字段 | 示例值 |
| --- | --- |
| `name` | `Workspace QA` |
| `slug` | `workspace-qa` |
| `icon` | `🚀` |
| `user_id` | `{{member_user_id}}` |

### 1.6 测试步骤

| 编号 | 操作 | 请求/路径 | 预期 |
| --- | --- | --- | --- |
| WS-01 | 创建 Workspace | `POST /api/v1/workspaces` | `code=OK`，返回 `workspace.id` |
| WS-02 | 列表查询 | `GET /api/v1/workspaces` | 列表包含新建 workspace |
| WS-03 | 获取详情 | `GET /api/v1/workspaces/{{workspace_id}}` | 返回 workspace 基础信息与权限 |
| WS-04 | 更新信息 | `PATCH /api/v1/workspaces/{{workspace_id}}` | 名称/slug 更新成功 |
| WS-05 | 读取成员列表 | `GET /api/v1/workspaces/{{workspace_id}}/members` | 返回成员列表 |
| WS-06 | 添加成员 | `POST /api/v1/workspaces/{{workspace_id}}/members` | 成员状态正确，角色可变更 |
| WS-07 | 权限校验 | 非成员访问 WS-03 | 返回 `FORBIDDEN` |

### 1.7 curl 请求示例

```bash
curl -X POST "{{api_base_url}}/workspaces" \
  -H "Authorization: Bearer {{jwt_token}}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Workspace QA","slug":"workspace-qa","icon":"rocket"}'

curl "{{api_base_url}}/workspaces" \
  -H "Authorization: Bearer {{jwt_token}}"

curl -X PATCH "{{api_base_url}}/workspaces/{{workspace_id}}" \
  -H "Authorization: Bearer {{jwt_token}}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Workspace QA Updated"}'

curl -X POST "{{api_base_url}}/workspaces/{{workspace_id}}/members" \
  -H "Authorization: Bearer {{jwt_token}}" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"{{member_user_id}}"}'
```

### 1.8 自动化测试用例骨架

- `apps/server/internal/api/workspace_template_test.go`

### 1.9 异常与边界

- 空名称：`NAME_REQUIRED`
- Slug 冲突：`SLUG_EXISTS`
- 非法 ID：`INVALID_ID`

### 1.10 清理/回滚

- 无删除接口时，使用测试专用命名并标记为测试数据

### 1.11 验收标准

- 核心 CRUD 正常
- 权限边界清晰（401/403）
- 成员与角色更新可用

---

## 2. App 公开访问测试用例模板

### 2.1 目标

验证 App 发布与公开访问（Runtime 入口、Schema、执行）。

### 2.2 覆盖模块

- `apps/server/internal/api/handler/app.go`
- `apps/server/internal/api/handler/runtime.go`
- `apps/server/internal/service/app_service.go`
- `apps/server/internal/service/runtime_service.go`
- `apps/server/internal/api/server.go`
- `apps/web/src/lib/api/app.ts`

### 2.3 关键接口

- `POST /api/v1/workspaces`
- `POST /api/v1/workspaces/:id/versions`
- `POST /api/v1/workspaces/:id/publish`
- `GET /api/v1/workspaces/:id/access-policy`
- `PATCH /api/v1/workspaces/:id/access-policy`
- `GET /runtime/:workspaceSlug/:appSlug`
- `GET /runtime/:workspaceSlug/:appSlug/schema`
- `POST /runtime/:workspaceSlug/:appSlug`

### 2.4 前置条件

- 已创建 `{{workspace_id}}`
- 具备 App 发布权限

### 2.5 测试步骤

| 编号 | 操作 | 请求/路径 | 预期 |
| --- | --- | --- | --- |
| AP-01 | 创建 Workspace | `POST /api/v1/workspaces` | 返回 `workspace.id` |
| AP-02 | 创建版本 | `POST /api/v1/workspaces/{{workspace_id}}/versions` | 返回 `version.id` |
| AP-03 | 发布 Workspace | `POST /api/v1/workspaces/{{workspace_id}}/publish` | `status=published` |
| AP-04 | 设置访问策略 | `PATCH /api/v1/workspaces/{{workspace_id}}/access-policy` | `access_mode=public_anonymous` |
| AP-05 | 获取 Runtime 入口 | `GET /runtime/{{workspace_slug}}/{{app_slug}}` | 返回 app/workspace/access_policy |
| AP-06 | 获取 Runtime Schema | `GET /runtime/{{workspace_slug}}/{{app_slug}}/schema` | 返回 UI/DB/Config Schema |
| AP-07 | 执行 Runtime | `POST /runtime/{{workspace_slug}}/{{app_slug}}` | 返回执行结果 |
| AP-08 | 验证验证码 | 开启 `require_captcha` 且未传 token | 返回 `CAPTCHA_REQUIRED` |

### 2.6 curl 请求示例

```bash
curl -X POST "{{api_base_url}}/apps" \
  -H "Authorization: Bearer {{jwt_token}}" \
  -H "Content-Type: application/json" \
  -d '{"workspace_id":"{{workspace_id}}","name":"Demo App","slug":"demo-app","icon":"app"}'

curl -X POST "{{api_base_url}}/apps/{{workspace_id}}/versions" \
  -H "Authorization: Bearer {{jwt_token}}" \
  -H "Content-Type: application/json" \
  -d '{"ui_schema":{},"db_schema":{},"config_json":{}}'

curl -X POST "{{api_base_url}}/apps/{{workspace_id}}/publish" \
  -H "Authorization: Bearer {{jwt_token}}"

curl -X PATCH "{{api_base_url}}/apps/{{workspace_id}}/access-policy" \
  -H "Authorization: Bearer {{jwt_token}}" \
  -H "Content-Type: application/json" \
  -d '{"access_mode":"public_anonymous","require_captcha":false}'

curl "{{runtime_base_url}}/{{workspace_slug}}/{{app_slug}}" \
  -H "Authorization: Bearer {{jwt_token}}"
```

### 2.7 自动化测试用例骨架

- `apps/server/internal/api/app_public_access_template_test.go`

### 2.8 异常与边界

- 未发布访问：`NOT_FOUND` 或 `VERSION_REQUIRED`
- access_mode=public_auth 且未登录：`UNAUTHORIZED`
- access_mode=private 且非 owner：`FORBIDDEN`

### 2.9 清理/回滚

- 将 App 状态置为 `archived` 作为回收处理

### 2.10 验收标准

- 公开访问链路打通（entry/schema/execute）
- 访问策略与验证码逻辑生效

---

## 3. DB Provision 测试用例模板

### 3.1 目标

验证 Workspace 数据库创建、查询与密钥轮换基础流程。

### 3.2 覆盖模块

- `apps/server/internal/api/handler/workspace_database.go`
- `apps/server/internal/service/workspace_database_service.go`
- `apps/server/internal/domain/entity/workspace_database.go`
- `apps/server/internal/api/server.go`

### 3.3 关键接口

- `POST /api/v1/workspaces/:id/database`
- `GET /api/v1/workspaces/:id/database`
- `POST /api/v1/workspaces/:id/database/rotate-secret`
- `POST /api/v1/workspaces/:id/database/backup`
- `POST /api/v1/workspaces/:id/database/restore`

### 3.4 测试步骤

| 编号 | 操作 | 请求/路径 | 预期 |
| --- | --- | --- | --- |
| DB-01 | 创建数据库 | `POST /api/v1/workspaces/{{workspace_id}}/database` | 返回 `database.status` |
| DB-02 | 查询数据库 | `GET /api/v1/workspaces/{{workspace_id}}/database` | 返回数据库信息 |
| DB-03 | 轮换密钥 | `POST /api/v1/workspaces/{{workspace_id}}/database/rotate-secret` | 若就绪返回成功 |
| DB-04 | 备份 | `POST /api/v1/workspaces/{{workspace_id}}/database/backup` | 返回 `backup_id` |
| DB-05 | 恢复 | `POST /api/v1/workspaces/{{workspace_id}}/database/restore` | 恢复成功 |

### 3.5 curl 请求示例

```bash
curl -X POST "{{api_base_url}}/workspaces/{{workspace_id}}/database" \
  -H "Authorization: Bearer {{jwt_token}}"

curl "{{api_base_url}}/workspaces/{{workspace_id}}/database" \
  -H "Authorization: Bearer {{jwt_token}}"

curl -X POST "{{api_base_url}}/workspaces/{{workspace_id}}/database/rotate-secret" \
  -H "Authorization: Bearer {{jwt_token}}"

curl -X POST "{{api_base_url}}/workspaces/{{workspace_id}}/database/backup" \
  -H "Authorization: Bearer {{jwt_token}}"

curl -X POST "{{api_base_url}}/workspaces/{{workspace_id}}/database/restore" \
  -H "Authorization: Bearer {{jwt_token}}" \
  -H "Content-Type: application/json" \
  -d '{"backup_id":"{{backup_id}}"}'
```

### 3.6 自动化测试用例骨架

- `apps/server/internal/api/workspace_database_template_test.go`

### 3.7 异常与边界

- 重复创建：`ALREADY_EXISTS`
- 未就绪轮换/备份：`DB_NOT_READY`
- 无权限访问：`FORBIDDEN`

### 3.8 清理/回滚

- 记录测试备份 ID，恢复后校验数据一致性

### 3.9 验收标准

- 创建、查询、轮换、备份/恢复可执行

---

## 4. 域名绑定测试用例模板

### 4.1 目标

验证 App 域名绑定、验证、证书签发与路由切换。

### 4.2 覆盖模块

- `apps/server/internal/api/handler/app_domain.go`
- `apps/server/internal/service/app_domain_service.go`
- `apps/server/internal/api/server.go`
- `apps/server/internal/api/handler/runtime.go`

### 4.3 关键接口

- `GET /api/v1/workspaces/:id/domains`
- `POST /api/v1/workspaces/:id/domains`
- `POST /api/v1/workspaces/:id/domains/:domainId/verify`
- `POST /api/v1/workspaces/:id/domains/:domainId/cert/issue`
- `POST /api/v1/workspaces/:id/domains/:domainId/activate`
- `POST /api/v1/workspaces/:id/domains/:domainId/rollback`
- `DELETE /api/v1/workspaces/:id/domains/:domainId`
- `GET /`（Host=`{{domain}}`）
- `GET /schema`（Host=`{{domain}}`）

### 4.4 测试步骤

| 编号 | 操作 | 请求/路径 | 预期 |
| --- | --- | --- | --- |
| DM-01 | 创建域名 | `POST /api/v1/workspaces/{{workspace_id}}/domains` | 返回 `domain.id` 与验证信息 |
| DM-02 | 验证域名 | `POST /api/v1/workspaces/{{workspace_id}}/domains/{{domain_id}}/verify` | `verified=true` |
| DM-03 | 签发证书 | `POST /api/v1/workspaces/{{workspace_id}}/domains/{{domain_id}}/cert/issue` | `ssl_status` 更新 |
| DM-04 | 路由生效 | `POST /api/v1/workspaces/{{workspace_id}}/domains/{{domain_id}}/activate` | 状态为 active |
| DM-05 | 域名访问 | `GET /` + Host=`{{domain}}` | 返回 Runtime 入口 |
| DM-06 | 回滚 | `POST /api/v1/workspaces/{{workspace_id}}/domains/{{domain_id}}/rollback` | 状态回退 |

### 4.5 curl 请求示例

```bash
curl -X POST "{{api_base_url}}/apps/{{workspace_id}}/domains" \
  -H "Authorization: Bearer {{jwt_token}}" \
  -H "Content-Type: application/json" \
  -d '{"domain":"{{domain}}"}'

curl -X POST "{{api_base_url}}/apps/{{workspace_id}}/domains/{{domain_id}}/verify" \
  -H "Authorization: Bearer {{jwt_token}}"

curl -X POST "{{api_base_url}}/apps/{{workspace_id}}/domains/{{domain_id}}/cert/issue" \
  -H "Authorization: Bearer {{jwt_token}}"

curl -X POST "{{api_base_url}}/apps/{{workspace_id}}/domains/{{domain_id}}/activate" \
  -H "Authorization: Bearer {{jwt_token}}"

curl "{{server_base_url}}/" \
  -H "Host: {{domain}}"
```

### 4.6 自动化测试用例骨架

- `apps/server/internal/api/app_domain_template_test.go`

### 4.7 异常与边界

- 未验证签发证书：`DOMAIN_NOT_VERIFIED`
- 域名未生效访问：`DOMAIN_NOT_ACTIVE`

### 4.8 清理/回滚

- 删除测试域名：`DELETE /api/v1/workspaces/{{workspace_id}}/domains/{{domain_id}}`

### 4.9 验收标准

- 域名绑定链路完整，入口可访问

---

## 5. 安全测试基准

### 5.1 目标

形成可执行的安全基准清单，覆盖鉴权、权限、数据分级与审计。

### 5.2 覆盖模块

- `apps/server/internal/api/handler/security_compliance.go`
- `apps/server/internal/api/handler/runtime.go`
- `apps/server/internal/api/handler/workspace.go`
- `apps/server/internal/api/handler/app.go`
- `apps/server/internal/api/server.go`

### 5.3 基准清单

| 分类 | 测试点 | 操作/接口 | 期望 |
| --- | --- | --- | --- |
| 认证 | 未登录访问受保护接口 | `GET /api/v1/workspaces` | `UNAUTHORIZED` |
| 授权 | 非成员访问 Workspace | `GET /api/v1/workspaces/{{workspace_id}}` | `FORBIDDEN` |
| 公开访问 | public_auth 未登录 | `GET /runtime/{{workspace_slug}}/{{app_slug}}` | `UNAUTHORIZED` |
| 数据分级 | 获取分级配置 | `GET /api/v1/security/data-classification` | 返回配置 |
| 合规检查 | Workspace 合规 | `GET /api/v1/security/compliance/{{workspace_id}}` | 返回检查项 |
| 审计 | 关键操作记录 | `GET /api/v1/workspaces/{{workspace_id}}/audit-logs` | 行为可追溯 |
| 密钥轮换 | DB 轮换 | `POST /api/v1/workspaces/{{workspace_id}}/database/rotate-secret` | 就绪时成功 |
| 验证码 | public_anonymous + require_captcha | Runtime 入口不带 token | `CAPTCHA_REQUIRED` |

### 5.4 curl 请求示例

```bash
curl "{{api_base_url}}/workspaces"

curl "{{api_base_url}}/security/data-classification"

curl "{{api_base_url}}/security/compliance/{{workspace_id}}" \
  -H "Authorization: Bearer {{jwt_token}}"

curl "{{api_base_url}}/workspaces/{{workspace_id}}/audit-logs" \
  -H "Authorization: Bearer {{jwt_token}}"
```

### 5.5 自动化测试用例骨架

- `apps/server/internal/api/security_benchmark_template_test.go`

### 5.6 验收标准

- 认证/授权错误码稳定（401/403）
- 合规与审计可查询
- 公开访问与验证码逻辑可验证
