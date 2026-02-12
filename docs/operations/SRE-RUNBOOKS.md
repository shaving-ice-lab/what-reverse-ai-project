# SRE 运行手册 (Runbooks)

版本：v1.0
日期：2026-02-03
状态：Active

---

## 1. 运行时故障排查手册

### 1.1 症状

- API 返回 5xx 错误
- 执行超时或卡住
- 结果不正确或为空

### 1.2 排查步骤

```bash
# Step 1: 检查服务健康状态
curl -s https://api.reverseai.ai/health | jq

# Step 2: 查看错误日志
# 在日志系统中过滤
{
  "level": "error",
  "service": "runtime",
  "time": { "$gte": "last 1h" }
}

# Step 3: 检查执行记录
SELECT id, status, error_message, started_at, completed_at
FROM what_reverse_executions
WHERE status IN ('failed', 'running')
  AND started_at > NOW() - INTERVAL 1 HOUR
ORDER BY started_at DESC
LIMIT 20;

# Step 4: 检查节点执行日志
SELECT node_id, node_type, status, error, duration_ms
FROM what_reverse_node_logs
WHERE execution_id = '<execution_id>'
ORDER BY started_at;
```

### 1.3 常见问题

| 问题         | 原因                | 解决方案               |
| ------------ | ------------------- | ---------------------- |
| 执行超时     | 节点执行时间过长    | 增加超时配置或优化节点 |
| LLM 调用失败 | Provider 限流或故障 | 检查配额，切换备用模型 |
| DB 节点失败  | 数据库连接问题      | 检查连接池和数据库状态 |
| 变量解析失败 | 引用不存在的变量    | 检查工作流定义         |

### 1.4 恢复操作

```bash
# 重启卡住的执行
POST /api/v1/admin/executions/<id>/cancel
{
  "reason": "手动取消：执行超时"
}

# 清理僵尸执行
UPDATE what_reverse_executions
SET status = 'failed',
    error_message = '系统超时取消',
    completed_at = NOW()
WHERE status = 'running'
  AND started_at < NOW() - INTERVAL 30 MINUTE;
```

---

## 2. DB Provision 失败排查手册

### 2.1 症状

- 创建 Workspace 数据库失败
- provision 状态一直为 `provisioning`
- 数据库连接失败

### 2.2 排查步骤

```bash
# Step 1: 检查 provision 状态
SELECT workspace_id, db_name, status, created_at, updated_at
FROM what_reverse_workspace_databases
WHERE status != 'ready'
ORDER BY updated_at DESC;

# Step 2: 检查数据库服务器连接
mysql -h <db_host> -u root -p -e "SELECT 1"

# Step 3: 检查数据库是否存在
mysql -h <db_host> -u root -p -e "SHOW DATABASES LIKE 'ws_%'"

# Step 4: 检查用户权限
mysql -h <db_host> -u root -p -e "
SELECT User, Host, authentication_string
FROM mysql.user
WHERE User LIKE 'wsu_%'"

# Step 5: 查看失败事件
SELECT * FROM what_reverse_runtime_events
WHERE event_type = 'db.provision.failed'
ORDER BY created_at DESC
LIMIT 10;
```

### 2.3 常见问题

| 问题           | 原因         | 解决方案           |
| -------------- | ------------ | ------------------ |
| 数据库创建失败 | 权限不足     | 检查 root 权限     |
| 用户创建失败   | 用户名冲突   | 清理重复用户       |
| 连接失败       | 网络问题     | 检查安全组和防火墙 |
| 密钥解密失败   | 密钥配置错误 | 检查加密配置       |

### 2.4 恢复操作

```bash
# 手动创建数据库
mysql -h <db_host> -u root -p << EOF
CREATE DATABASE IF NOT EXISTS ws_<workspace_id>;
CREATE USER IF NOT EXISTS 'wsu_<workspace_id>'@'%' IDENTIFIED BY '<password>';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP
  ON ws_<workspace_id>.* TO 'wsu_<workspace_id>'@'%';
FLUSH PRIVILEGES;
EOF

# 更新状态
UPDATE what_reverse_workspace_databases
SET status = 'ready', updated_at = NOW()
WHERE workspace_id = '<workspace_id>';

# 重新触发 provision
POST /api/v1/workspaces/<id>/database/provision
```

---

## 3. 域名绑定/证书故障排查手册

### 3.1 症状

- 域名验证失败
- 证书签发失败
- HTTPS 访问异常

### 3.2 排查步骤

```bash
# Step 1: 检查域名状态
SELECT domain, status, verification_token, ssl_status,
       verified_at, ssl_issued_at, ssl_expires_at
FROM what_reverse_app_domains
WHERE domain = '<domain>'
ORDER BY created_at DESC;

# Step 2: DNS 验证检查
# TXT 记录
dig TXT _reverseai.<domain>

# CNAME 记录
dig CNAME <domain>

# Step 3: 证书状态检查
openssl s_client -connect <domain>:443 -servername <domain> < /dev/null 2>&1 | \
  openssl x509 -noout -dates

# Step 4: 查看失败事件
SELECT * FROM what_reverse_runtime_events
WHERE event_type IN ('domain.verify.failed', 'cert.issue.failed')
  AND payload_json LIKE '%<domain>%'
ORDER BY created_at DESC;
```

### 3.3 常见问题

| 问题         | 原因        | 解决方案                  |
| ------------ | ----------- | ------------------------- |
| TXT 验证失败 | 记录未生效  | 等待 DNS 传播（最长 48h） |
| CNAME 冲突   | 已有 A 记录 | 删除冲突记录              |
| 证书签发失败 | Rate Limit  | 等待或使用备用域名        |
| 证书过期     | 续期失败    | 手动触发续期              |

### 3.4 恢复操作

```bash
# 手动验证域名
POST /api/v1/workspaces/<workspace_id>/domains/<domain_id>/verify

# 手动签发证书
POST /api/v1/workspaces/<workspace_id>/domains/<domain_id>/cert/issue

# 手动续期证书
POST /api/v1/workspaces/<workspace_id>/domains/<domain_id>/cert/renew

# 强制刷新缓存
POST /api/v1/admin/cache/invalidate
{
  "type": "domain",
  "key": "<domain>"
}
```

---

## 4. 通用排查工具

### 日志查询

```bash
# Grafana Loki 查询
{service="api"} |= "error" | json | level="error"

# CloudWatch 查询
fields @timestamp, @message
| filter @message like /error/
| sort @timestamp desc
| limit 100
```

### 指标查看

```bash
# Prometheus 查询
# 错误率
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# 执行成功率
rate(execution_completed_total[5m]) / rate(execution_started_total[5m])

# P95 延迟
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### 数据库检查

```sql
-- 慢查询
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 20;

-- 连接数
SHOW PROCESSLIST;

-- 表大小
SELECT table_name,
       ROUND(data_length/1024/1024, 2) AS data_mb,
       ROUND(index_length/1024/1024, 2) AS index_mb
FROM information_schema.tables
WHERE table_schema = 'reverseai'
ORDER BY data_length DESC;
```

---

## 5. 升级路径

| 问题级别    | 响应时间 | 升级对象              |
| ----------- | -------- | --------------------- |
| P0 Critical | 15 分钟  | 全体 On-call + 管理层 |
| P1 High     | 30 分钟  | On-call + Tech Lead   |
| P2 Medium   | 2 小时   | On-call               |
| P3 Low      | 24 小时  | 下一个工作日          |

---

## 变更记录

| 日期       | 版本 | 变更内容 | 作者           |
| ---------- | ---- | -------- | -------------- |
| 2026-02-03 | v1.0 | 初始版本 | ReverseAI Team |
