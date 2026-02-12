# 运维与客服 SOP

本页为运维与客服流程的执行版文档，SOP 也可通过管理员 API 获取（`GET /api/v1/admin/ops/sops`）。

## 适用范围

- 域名绑定故障处理
- DB 创建失败处理
- 匿名滥用处理
- 用户数据恢复流程

## 使用方式（管理员）

- 列表：`GET /api/v1/admin/ops/sops`
- 详情：`GET /api/v1/admin/ops/sops/{key}`

## SOP 索引

- `domain_binding_failure`：域名绑定故障处理（P1）
- `workspace_db_provision_failed`：DB 创建失败处理（P1）
- `anonymous_abuse`：匿名滥用处理（P1）
- `user_data_recovery`：用户数据恢复流程（P1）

---

## 域名绑定故障处理 SOP

Key：`domain_binding_failure`  
Severity：P1

### 触发条件（domain_binding_failure）

- 域名状态为 `failed` 或 `verification_attempts >= 3`
- API 返回 `DOMAIN_NOT_VERIFIED` / `CERT_ISSUE_FAILED` / `ROUTING_FAILED`
- 用户报告自定义域名无法访问

### 前置条件（domain_binding_failure）

- 已确认 workspace_id 与 domain_id 归属
- 已获取验证 token 或 CNAME 目标

### 步骤（domain_binding_failure）

1. 调用 `GET /api/v1/workspaces/:id/domains`，获取 `status/ssl_status/last_verification_error/next_retry_at`
2. 校验 DNS 记录（TXT `_reverseai.<domain>` 或 CNAME 指向 base host）
3. 触发验证 `POST /api/v1/workspaces/:id/domains/:domainId/verify`
4. 证书签发 `POST /api/v1/workspaces/:id/domains/:domainId/cert/issue`
5. 域名生效 `POST /api/v1/workspaces/:id/domains/:domainId/activate`

### 升级条件（domain_binding_failure）

- `verification_attempts >= 3` 或 `support_url` 已生成

### 回滚方案（domain_binding_failure）

- 执行 `POST /api/v1/workspaces/:id/domains/:domainId/rollback`
- 必要时删除域名 `DELETE /api/v1/workspaces/:id/domains/:domainId`

---

## DB 创建失败处理 SOP

Key：`workspace_db_provision_failed`  
Severity：P1

### 触发条件（workspace_db_provision_failed）

- API 返回 `PROVISION_FAILED` / `QUOTA_EXCEEDED`
- 数据库状态为 `failed` 或 `provisioning` 超时

### 前置条件（workspace_db_provision_failed）

- 已确认 workspace_id 归属
- 配额可用或已获豁免

### 步骤（workspace_db_provision_failed）

1. 调用 `GET /api/v1/workspaces/:id/database` 获取状态与 `db_name`
2. 调用 `GET /api/v1/billing/workspaces/:id/quota` 校验 `db_storage_gb`
3. 重新触发创建 `POST /api/v1/workspaces/:id/database`
4. 轮换密钥 `POST /api/v1/workspaces/:id/database/rotate-secret`
5. 执行迁移 `POST /api/v1/workspaces/:id/database/migrate`

### 升级条件（workspace_db_provision_failed）

- 连续失败或配额异常

### 回滚方案（workspace_db_provision_failed）

- 保留 `failed` 记录，等待基础设施恢复或配额调整后重试

---

## 匿名滥用处理 SOP

Key：`anonymous_abuse`  
Severity：P1

### 触发条件（anonymous_abuse）

- `runtime_rate_limited` / `runtime_risk_detected` 事件激增
- 匿名访问异常增长或用户投诉

### 前置条件（anonymous_abuse）

- 应用访问策略为 `public_anonymous`
- 已收集异常 IP/UA/路径信息

### 步骤（anonymous_abuse）

1. 调用 `GET /api/v1/workspaces/:id/access-policy` 确认策略与 `rate_limit_json`
2. 通过 `PATCH /api/v1/workspaces/:id/access-policy` 设置 `rate_limit_json.blacklist/graylist`
3. 调整 `per_ip / per_session / per_workspace` 的 `max_requests` 与 `window_seconds`
4. 必要时启用 `require_captcha` 或设置 `graylist_policy`

### 补充说明（anonymous_abuse）

- 黑名单支持原始 IP 或 `sha256:` / `hash:` 前缀的 IP 哈希

### 升级条件（anonymous_abuse）

- 持续异常或疑似攻击

### 回滚方案（anonymous_abuse）

- 移除黑名单/灰名单并恢复默认限流配置

---

## 用户数据恢复流程 SOP

Key：`user_data_recovery`  
Severity：P1

### 触发条件（user_data_recovery）

- 用户报告数据丢失或损坏
- 迁移失败或异常清理

### 前置条件（user_data_recovery）

- 数据库状态为 `ready`
- 具备可用 `backup_id`

### 步骤（user_data_recovery）

1. 调用 `GET /api/v1/workspaces/:id/database` 确认状态
2. 如需新备份，执行 `POST /api/v1/workspaces/:id/database/backup`
3. 执行恢复 `POST /api/v1/workspaces/:id/database/restore`
4. 执行迁移 `POST /api/v1/workspaces/:id/database/migrate`
5. 抽样核对关键表与访问路径

### 升级条件（user_data_recovery）

- 恢复失败或数据不可用

### 回滚方案（user_data_recovery）

- 使用上一份备份再次恢复或保留当前数据副本
