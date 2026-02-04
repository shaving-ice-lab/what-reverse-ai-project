# SQL Schema 索引与约束草案

本草案以现有迁移为准，适用于 MySQL。若索引已存在，请跳过对应语句。

## workspaces（what_reverse_workspaces）

```sql
ALTER TABLE what_reverse_workspaces
  ADD UNIQUE KEY uniq_workspaces_slug (slug);

CREATE INDEX idx_workspaces_owner ON what_reverse_workspaces (owner_user_id);
CREATE INDEX idx_workspaces_status ON what_reverse_workspaces (status);
CREATE INDEX idx_workspaces_deleted_at ON what_reverse_workspaces (deleted_at);
```

## apps（what_reverse_apps）

```sql
ALTER TABLE what_reverse_apps
  ADD UNIQUE KEY uniq_apps_workspace_slug (workspace_id, slug);

CREATE INDEX idx_apps_workspace ON what_reverse_apps (workspace_id);
CREATE INDEX idx_apps_owner ON what_reverse_apps (owner_user_id);
CREATE INDEX idx_apps_status ON what_reverse_apps (status);
CREATE INDEX idx_apps_deleted_at ON what_reverse_apps (deleted_at);
```

## app_versions（what_reverse_app_versions）

```sql
ALTER TABLE what_reverse_app_versions
  ADD UNIQUE KEY uniq_app_version (app_id, version);

CREATE INDEX idx_app_versions_app ON what_reverse_app_versions (app_id);
CREATE INDEX idx_app_versions_created ON what_reverse_app_versions (created_at);
```

## app_domains（what_reverse_app_domains）

```sql
ALTER TABLE what_reverse_app_domains
  ADD UNIQUE KEY uniq_app_domain (domain);

CREATE INDEX idx_app_domains_app ON what_reverse_app_domains (app_id);
CREATE INDEX idx_app_domains_status ON what_reverse_app_domains (status);
```

## workspace_databases（what_reverse_workspace_databases）

```sql
ALTER TABLE what_reverse_workspace_databases
  ADD UNIQUE KEY uniq_workspace_database (workspace_id);

CREATE INDEX idx_workspace_databases_status ON what_reverse_workspace_databases (status);
```

## app_sessions（what_reverse_app_sessions）

```sql
CREATE INDEX idx_app_sessions_app ON what_reverse_app_sessions (app_id);
CREATE INDEX idx_app_sessions_workspace ON what_reverse_app_sessions (workspace_id);
CREATE INDEX idx_app_sessions_session_type ON what_reverse_app_sessions (session_type);
CREATE INDEX idx_app_sessions_created ON what_reverse_app_sessions (created_at);
CREATE INDEX idx_app_sessions_user ON what_reverse_app_sessions (user_id);
CREATE INDEX idx_app_sessions_blocked_at ON what_reverse_app_sessions (blocked_at);
CREATE INDEX idx_app_sessions_app_created ON what_reverse_app_sessions (app_id, created_at);
```
