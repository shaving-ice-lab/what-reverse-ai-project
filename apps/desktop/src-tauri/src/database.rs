//! SQLite 数据库管理

use rusqlite::Connection;
use tauri::AppHandle;
use std::sync::Mutex;

use crate::error::{AppError, AppResult};
use crate::state::AppState;

/// 数据库连接管理
pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    /// 创建新的数据库连接
    pub fn new(path: &std::path::Path) -> AppResult<Self> {
        let conn = Connection::open(path)?;
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    /// 获取数据库连接
    pub fn get_conn(&self) -> std::sync::MutexGuard<Connection> {
        self.conn.lock().unwrap()
    }
}

/// 初始化数据库
pub fn init(app: &AppHandle) -> AppResult<()> {
    let state = app.state::<AppState>();
    let db_path = state.get_db_path();

    log::info!("Initializing database at: {:?}", db_path);

    let db = Database::new(db_path)?;
    
    // 运行迁移
    run_migrations(&db)?;

    // 存储数据库实例
    app.manage(db);

    log::info!("Database initialized successfully");
    Ok(())
}

/// 运行数据库迁移
fn run_migrations(db: &Database) -> AppResult<()> {
    let conn = db.get_conn();

    // 创建迁移表
    conn.execute(
        "CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    // 定义迁移
    let migrations = vec![
        ("001_initial", include_str!("../migrations/001_initial.sql")),
        ("002_executions", include_str!("../migrations/002_executions.sql")),
        ("003_settings", include_str!("../migrations/003_settings.sql")),
        ("004_api_keys", include_str!("../migrations/004_api_keys.sql")),
        ("005_snapshots", include_str!("../migrations/005_snapshots.sql")),
    ];

    for (name, sql) in migrations {
        // 检查是否已应用
        let applied: bool = conn.query_row(
            "SELECT EXISTS(SELECT 1 FROM migrations WHERE name = ?)",
            [name],
            |row| row.get(0),
        )?;

        if !applied {
            log::info!("Applying migration: {}", name);
            conn.execute_batch(sql)?;
            conn.execute(
                "INSERT INTO migrations (name) VALUES (?)",
                [name],
            )?;
        }
    }

    Ok(())
}

// ===== 工作流操作 =====

use crate::models::Workflow;

/// 创建工作流
pub fn create_workflow(db: &Database, workflow: &Workflow) -> AppResult<()> {
    let conn = db.get_conn();
    conn.execute(
        "INSERT INTO workflows (id, name, description, nodes, edges, viewport, created_at, updated_at, is_favorite, tags, folder_id)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        rusqlite::params![
            workflow.id,
            workflow.name,
            workflow.description,
            serde_json::to_string(&workflow.nodes)?,
            serde_json::to_string(&workflow.edges)?,
            serde_json::to_string(&workflow.viewport)?,
            workflow.created_at.to_rfc3339(),
            workflow.updated_at.to_rfc3339(),
            workflow.is_favorite,
            serde_json::to_string(&workflow.tags)?,
            workflow.folder_id,
        ],
    )?;
    Ok(())
}

/// 获取工作流
pub fn get_workflow(db: &Database, id: &str) -> AppResult<Workflow> {
    let conn = db.get_conn();
    let workflow = conn.query_row(
        "SELECT id, name, description, nodes, edges, viewport, created_at, updated_at, is_favorite, tags, folder_id
         FROM workflows WHERE id = ?",
        [id],
        |row| {
            Ok(Workflow {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                nodes: serde_json::from_str(&row.get::<_, String>(3)?).unwrap_or_default(),
                edges: serde_json::from_str(&row.get::<_, String>(4)?).unwrap_or_default(),
                viewport: serde_json::from_str(&row.get::<_, String>(5)?).unwrap_or_default(),
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?)
                    .map(|dt| dt.with_timezone(&chrono::Utc))
                    .unwrap_or_else(|_| chrono::Utc::now()),
                updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(7)?)
                    .map(|dt| dt.with_timezone(&chrono::Utc))
                    .unwrap_or_else(|_| chrono::Utc::now()),
                is_favorite: row.get(8)?,
                tags: serde_json::from_str(&row.get::<_, String>(9)?).unwrap_or_default(),
                folder_id: row.get(10)?,
            })
        },
    ).map_err(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => AppError::NotFound(format!("Workflow not found: {}", id)),
        _ => AppError::Database(e),
    })?;
    Ok(workflow)
}

/// 列出工作流
pub fn list_workflows(db: &Database) -> AppResult<Vec<Workflow>> {
    let conn = db.get_conn();
    let mut stmt = conn.prepare(
        "SELECT id, name, description, nodes, edges, viewport, created_at, updated_at, is_favorite, tags, folder_id
         FROM workflows ORDER BY updated_at DESC"
    )?;

    let workflows = stmt.query_map([], |row| {
        Ok(Workflow {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            nodes: serde_json::from_str(&row.get::<_, String>(3)?).unwrap_or_default(),
            edges: serde_json::from_str(&row.get::<_, String>(4)?).unwrap_or_default(),
            viewport: serde_json::from_str(&row.get::<_, String>(5)?).unwrap_or_default(),
            created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?)
                .map(|dt| dt.with_timezone(&chrono::Utc))
                .unwrap_or_else(|_| chrono::Utc::now()),
            updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(7)?)
                .map(|dt| dt.with_timezone(&chrono::Utc))
                .unwrap_or_else(|_| chrono::Utc::now()),
            is_favorite: row.get(8)?,
            tags: serde_json::from_str(&row.get::<_, String>(9)?).unwrap_or_default(),
            folder_id: row.get(10)?,
        })
    })?.collect::<Result<Vec<_>, _>>()?;

    Ok(workflows)
}

/// 更新工作流
pub fn update_workflow(db: &Database, workflow: &Workflow) -> AppResult<()> {
    let conn = db.get_conn();
    let rows = conn.execute(
        "UPDATE workflows SET name = ?2, description = ?3, nodes = ?4, edges = ?5, viewport = ?6,
         updated_at = ?7, is_favorite = ?8, tags = ?9, folder_id = ?10 WHERE id = ?1",
        rusqlite::params![
            workflow.id,
            workflow.name,
            workflow.description,
            serde_json::to_string(&workflow.nodes)?,
            serde_json::to_string(&workflow.edges)?,
            serde_json::to_string(&workflow.viewport)?,
            workflow.updated_at.to_rfc3339(),
            workflow.is_favorite,
            serde_json::to_string(&workflow.tags)?,
            workflow.folder_id,
        ],
    )?;

    if rows == 0 {
        return Err(AppError::NotFound(format!("Workflow not found: {}", workflow.id)));
    }

    Ok(())
}

/// 删除工作流
pub fn delete_workflow(db: &Database, id: &str) -> AppResult<()> {
    let conn = db.get_conn();
    let rows = conn.execute("DELETE FROM workflows WHERE id = ?", [id])?;

    if rows == 0 {
        return Err(AppError::NotFound(format!("Workflow not found: {}", id)));
    }

    Ok(())
}

// ===== API Keys 操作 =====

use crate::models::{ApiKey, ApiKeyInfo};

/// 创建 API Key
pub fn create_api_key(db: &Database, api_key: &ApiKey) -> AppResult<()> {
    let conn = db.get_conn();
    
    // 如果是默认 Key，先取消其他默认
    if api_key.is_default {
        conn.execute(
            "UPDATE api_keys SET is_default = 0 WHERE provider = ?",
            [&api_key.provider],
        )?;
    }
    
    conn.execute(
        "INSERT INTO api_keys (id, name, provider, encrypted_key, nonce, key_hint, base_url, is_default, is_enabled, last_used_at, usage_count, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        rusqlite::params![
            api_key.id,
            api_key.name,
            api_key.provider,
            api_key.encrypted_key,
            api_key.nonce,
            api_key.key_hint,
            api_key.base_url,
            api_key.is_default,
            api_key.is_enabled,
            api_key.last_used_at.map(|dt| dt.to_rfc3339()),
            api_key.usage_count,
            api_key.created_at.to_rfc3339(),
            api_key.updated_at.to_rfc3339(),
        ],
    )?;
    Ok(())
}

/// 获取 API Key（包含加密数据）
pub fn get_api_key(db: &Database, id: &str) -> AppResult<ApiKey> {
    let conn = db.get_conn();
    let api_key = conn.query_row(
        "SELECT id, name, provider, encrypted_key, nonce, key_hint, base_url, is_default, is_enabled, last_used_at, usage_count, created_at, updated_at
         FROM api_keys WHERE id = ?",
        [id],
        |row| {
            Ok(ApiKey {
                id: row.get(0)?,
                name: row.get(1)?,
                provider: row.get(2)?,
                encrypted_key: row.get(3)?,
                nonce: row.get(4)?,
                key_hint: row.get(5)?,
                base_url: row.get(6)?,
                is_default: row.get(7)?,
                is_enabled: row.get(8)?,
                last_used_at: row.get::<_, Option<String>>(9)?
                    .and_then(|s| chrono::DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&chrono::Utc)),
                usage_count: row.get(10)?,
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(11)?)
                    .map(|dt| dt.with_timezone(&chrono::Utc))
                    .unwrap_or_else(|_| chrono::Utc::now()),
                updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(12)?)
                    .map(|dt| dt.with_timezone(&chrono::Utc))
                    .unwrap_or_else(|_| chrono::Utc::now()),
            })
        },
    ).map_err(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => AppError::NotFound(format!("API Key not found: {}", id)),
        _ => AppError::Database(e),
    })?;
    Ok(api_key)
}

/// 获取提供商的默认 API Key
pub fn get_default_api_key(db: &Database, provider: &str) -> AppResult<Option<ApiKey>> {
    let conn = db.get_conn();
    let result = conn.query_row(
        "SELECT id, name, provider, encrypted_key, nonce, key_hint, base_url, is_default, is_enabled, last_used_at, usage_count, created_at, updated_at
         FROM api_keys WHERE provider = ? AND is_default = 1 AND is_enabled = 1",
        [provider],
        |row| {
            Ok(ApiKey {
                id: row.get(0)?,
                name: row.get(1)?,
                provider: row.get(2)?,
                encrypted_key: row.get(3)?,
                nonce: row.get(4)?,
                key_hint: row.get(5)?,
                base_url: row.get(6)?,
                is_default: row.get(7)?,
                is_enabled: row.get(8)?,
                last_used_at: row.get::<_, Option<String>>(9)?
                    .and_then(|s| chrono::DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&chrono::Utc)),
                usage_count: row.get(10)?,
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(11)?)
                    .map(|dt| dt.with_timezone(&chrono::Utc))
                    .unwrap_or_else(|_| chrono::Utc::now()),
                updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(12)?)
                    .map(|dt| dt.with_timezone(&chrono::Utc))
                    .unwrap_or_else(|_| chrono::Utc::now()),
            })
        },
    );
    
    match result {
        Ok(key) => Ok(Some(key)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(AppError::Database(e)),
    }
}

/// 列出所有 API Keys（不含敏感数据）
pub fn list_api_keys(db: &Database) -> AppResult<Vec<ApiKeyInfo>> {
    let conn = db.get_conn();
    let mut stmt = conn.prepare(
        "SELECT id, name, provider, key_hint, base_url, is_default, is_enabled, last_used_at, usage_count, created_at, updated_at
         FROM api_keys ORDER BY provider, name"
    )?;

    let keys = stmt.query_map([], |row| {
        Ok(ApiKeyInfo {
            id: row.get(0)?,
            name: row.get(1)?,
            provider: row.get(2)?,
            key_hint: row.get(3)?,
            base_url: row.get(4)?,
            is_default: row.get(5)?,
            is_enabled: row.get(6)?,
            last_used_at: row.get::<_, Option<String>>(7)?
                .and_then(|s| chrono::DateTime::parse_from_rfc3339(&s).ok())
                .map(|dt| dt.with_timezone(&chrono::Utc)),
            usage_count: row.get(8)?,
            created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(9)?)
                .map(|dt| dt.with_timezone(&chrono::Utc))
                .unwrap_or_else(|_| chrono::Utc::now()),
            updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(10)?)
                .map(|dt| dt.with_timezone(&chrono::Utc))
                .unwrap_or_else(|_| chrono::Utc::now()),
        })
    })?.collect::<Result<Vec<_>, _>>()?;

    Ok(keys)
}

/// 按提供商列出 API Keys
pub fn list_api_keys_by_provider(db: &Database, provider: &str) -> AppResult<Vec<ApiKeyInfo>> {
    let conn = db.get_conn();
    let mut stmt = conn.prepare(
        "SELECT id, name, provider, key_hint, base_url, is_default, is_enabled, last_used_at, usage_count, created_at, updated_at
         FROM api_keys WHERE provider = ? ORDER BY is_default DESC, name"
    )?;

    let keys = stmt.query_map([provider], |row| {
        Ok(ApiKeyInfo {
            id: row.get(0)?,
            name: row.get(1)?,
            provider: row.get(2)?,
            key_hint: row.get(3)?,
            base_url: row.get(4)?,
            is_default: row.get(5)?,
            is_enabled: row.get(6)?,
            last_used_at: row.get::<_, Option<String>>(7)?
                .and_then(|s| chrono::DateTime::parse_from_rfc3339(&s).ok())
                .map(|dt| dt.with_timezone(&chrono::Utc)),
            usage_count: row.get(8)?,
            created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(9)?)
                .map(|dt| dt.with_timezone(&chrono::Utc))
                .unwrap_or_else(|_| chrono::Utc::now()),
            updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(10)?)
                .map(|dt| dt.with_timezone(&chrono::Utc))
                .unwrap_or_else(|_| chrono::Utc::now()),
        })
    })?.collect::<Result<Vec<_>, _>>()?;

    Ok(keys)
}

/// 更新 API Key 使用统计
pub fn update_api_key_usage(db: &Database, id: &str) -> AppResult<()> {
    let conn = db.get_conn();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE api_keys SET usage_count = usage_count + 1, last_used_at = ?, updated_at = ? WHERE id = ?",
        rusqlite::params![now, now, id],
    )?;
    Ok(())
}

/// 设置默认 API Key
pub fn set_default_api_key(db: &Database, id: &str, provider: &str) -> AppResult<()> {
    let conn = db.get_conn();
    let now = chrono::Utc::now().to_rfc3339();
    
    // 取消当前默认
    conn.execute(
        "UPDATE api_keys SET is_default = 0, updated_at = ? WHERE provider = ?",
        rusqlite::params![now, provider],
    )?;
    
    // 设置新默认
    conn.execute(
        "UPDATE api_keys SET is_default = 1, updated_at = ? WHERE id = ?",
        rusqlite::params![now, id],
    )?;
    
    Ok(())
}

/// 启用/禁用 API Key
pub fn toggle_api_key(db: &Database, id: &str, enabled: bool) -> AppResult<()> {
    let conn = db.get_conn();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "UPDATE api_keys SET is_enabled = ?, updated_at = ? WHERE id = ?",
        rusqlite::params![enabled, now, id],
    )?;
    Ok(())
}

/// 删除 API Key
pub fn delete_api_key(db: &Database, id: &str) -> AppResult<()> {
    let conn = db.get_conn();
    let rows = conn.execute("DELETE FROM api_keys WHERE id = ?", [id])?;

    if rows == 0 {
        return Err(AppError::NotFound(format!("API Key not found: {}", id)));
    }

    Ok(())
}

// ===== 执行记录操作 =====

use crate::models::Execution;

/// 创建执行记录
pub fn create_execution(db: &Database, execution: &Execution) -> AppResult<()> {
    let conn = db.get_conn();
    conn.execute(
        "INSERT INTO executions (id, workflow_id, status, inputs, outputs, error, started_at, completed_at, duration_ms, node_results)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        rusqlite::params![
            execution.id,
            execution.workflow_id,
            serde_json::to_string(&execution.status)?,
            serde_json::to_string(&execution.inputs)?,
            execution.outputs.as_ref().map(|o| serde_json::to_string(o).ok()).flatten(),
            execution.error,
            execution.started_at.to_rfc3339(),
            execution.completed_at.map(|dt| dt.to_rfc3339()),
            execution.duration_ms,
            serde_json::to_string(&execution.node_results)?,
        ],
    )?;
    Ok(())
}

/// 更新执行记录
pub fn update_execution(db: &Database, execution: &Execution) -> AppResult<()> {
    let conn = db.get_conn();
    conn.execute(
        "UPDATE executions SET status = ?2, outputs = ?3, error = ?4, completed_at = ?5, duration_ms = ?6, node_results = ?7 WHERE id = ?1",
        rusqlite::params![
            execution.id,
            serde_json::to_string(&execution.status)?,
            execution.outputs.as_ref().map(|o| serde_json::to_string(o).ok()).flatten(),
            execution.error,
            execution.completed_at.map(|dt| dt.to_rfc3339()),
            execution.duration_ms,
            serde_json::to_string(&execution.node_results)?,
        ],
    )?;
    Ok(())
}

// ===== Database 的异步方法 =====

impl Database {
    /// 异步获取工作流
    pub async fn get_workflow(&self, id: &str) -> AppResult<Workflow> {
        let id = id.to_string();
        let conn = self.conn.lock().unwrap();
        get_workflow_internal(&conn, &id)
    }

    /// 异步获取执行记录
    pub async fn get_execution(&self, id: &str) -> AppResult<Execution> {
        let id = id.to_string();
        let conn = self.conn.lock().unwrap();
        get_execution_internal(&conn, &id)
    }

    /// 异步列出执行记录
    pub async fn list_executions(&self, workflow_id: Option<&str>, limit: i32) -> AppResult<Vec<Execution>> {
        let workflow_id = workflow_id.map(|s| s.to_string());
        let conn = self.conn.lock().unwrap();
        list_executions_internal(&conn, workflow_id.as_deref(), limit)
    }
}

/// 内部工作流查询函数
fn get_workflow_internal(conn: &Connection, id: &str) -> AppResult<Workflow> {
    let workflow = conn.query_row(
        "SELECT id, name, description, nodes, edges, viewport, created_at, updated_at, is_favorite, tags, folder_id
         FROM workflows WHERE id = ?",
        [id],
        |row| {
            Ok(Workflow {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                nodes: serde_json::from_str(&row.get::<_, String>(3)?).unwrap_or_default(),
                edges: serde_json::from_str(&row.get::<_, String>(4)?).unwrap_or_default(),
                viewport: serde_json::from_str(&row.get::<_, String>(5)?).unwrap_or_default(),
                created_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?)
                    .map(|dt| dt.with_timezone(&chrono::Utc))
                    .unwrap_or_else(|_| chrono::Utc::now()),
                updated_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(7)?)
                    .map(|dt| dt.with_timezone(&chrono::Utc))
                    .unwrap_or_else(|_| chrono::Utc::now()),
                is_favorite: row.get(8)?,
                tags: serde_json::from_str(&row.get::<_, String>(9)?).unwrap_or_default(),
                folder_id: row.get(10)?,
            })
        },
    ).map_err(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => AppError::NotFound(format!("Workflow not found: {}", id)),
        _ => AppError::Database(e),
    })?;
    Ok(workflow)
}

/// 内部执行记录查询函数
fn get_execution_internal(conn: &Connection, id: &str) -> AppResult<Execution> {
    let execution = conn.query_row(
        "SELECT id, workflow_id, status, inputs, outputs, error, started_at, completed_at, duration_ms, node_results
         FROM executions WHERE id = ?",
        [id],
        |row| {
            Ok(Execution {
                id: row.get(0)?,
                workflow_id: row.get(1)?,
                status: serde_json::from_str(&row.get::<_, String>(2)?).unwrap_or(crate::models::ExecutionStatus::Pending),
                inputs: serde_json::from_str(&row.get::<_, String>(3)?).unwrap_or_default(),
                outputs: row.get::<_, Option<String>>(4)?
                    .and_then(|s| serde_json::from_str(&s).ok()),
                error: row.get(5)?,
                started_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?)
                    .map(|dt| dt.with_timezone(&chrono::Utc))
                    .unwrap_or_else(|_| chrono::Utc::now()),
                completed_at: row.get::<_, Option<String>>(7)?
                    .and_then(|s| chrono::DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&chrono::Utc)),
                duration_ms: row.get(8)?,
                node_results: serde_json::from_str(&row.get::<_, String>(9)?).unwrap_or_default(),
            })
        },
    ).map_err(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => AppError::NotFound(format!("Execution not found: {}", id)),
        _ => AppError::Database(e),
    })?;
    Ok(execution)
}

/// 内部执行记录列表查询函数
fn list_executions_internal(conn: &Connection, workflow_id: Option<&str>, limit: i32) -> AppResult<Vec<Execution>> {
    let sql = match workflow_id {
        Some(_) => "SELECT id, workflow_id, status, inputs, outputs, error, started_at, completed_at, duration_ms, node_results
                   FROM executions WHERE workflow_id = ? ORDER BY started_at DESC LIMIT ?",
        None => "SELECT id, workflow_id, status, inputs, outputs, error, started_at, completed_at, duration_ms, node_results
                FROM executions ORDER BY started_at DESC LIMIT ?",
    };
    
    let mut stmt = conn.prepare(sql)?;
    
    let executions = if let Some(wid) = workflow_id {
        stmt.query_map(rusqlite::params![wid, limit], |row| {
            Ok(Execution {
                id: row.get(0)?,
                workflow_id: row.get(1)?,
                status: serde_json::from_str(&row.get::<_, String>(2)?).unwrap_or(crate::models::ExecutionStatus::Pending),
                inputs: serde_json::from_str(&row.get::<_, String>(3)?).unwrap_or_default(),
                outputs: row.get::<_, Option<String>>(4)?
                    .and_then(|s| serde_json::from_str(&s).ok()),
                error: row.get(5)?,
                started_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?)
                    .map(|dt| dt.with_timezone(&chrono::Utc))
                    .unwrap_or_else(|_| chrono::Utc::now()),
                completed_at: row.get::<_, Option<String>>(7)?
                    .and_then(|s| chrono::DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&chrono::Utc)),
                duration_ms: row.get(8)?,
                node_results: serde_json::from_str(&row.get::<_, String>(9)?).unwrap_or_default(),
            })
        })?.collect::<Result<Vec<_>, _>>()?
    } else {
        stmt.query_map(rusqlite::params![limit], |row| {
            Ok(Execution {
                id: row.get(0)?,
                workflow_id: row.get(1)?,
                status: serde_json::from_str(&row.get::<_, String>(2)?).unwrap_or(crate::models::ExecutionStatus::Pending),
                inputs: serde_json::from_str(&row.get::<_, String>(3)?).unwrap_or_default(),
                outputs: row.get::<_, Option<String>>(4)?
                    .and_then(|s| serde_json::from_str(&s).ok()),
                error: row.get(5)?,
                started_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?)
                    .map(|dt| dt.with_timezone(&chrono::Utc))
                    .unwrap_or_else(|_| chrono::Utc::now()),
                completed_at: row.get::<_, Option<String>>(7)?
                    .and_then(|s| chrono::DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&chrono::Utc)),
                duration_ms: row.get(8)?,
                node_results: serde_json::from_str(&row.get::<_, String>(9)?).unwrap_or_default(),
            })
        })?.collect::<Result<Vec<_>, _>>()?
    };

    Ok(executions)
}
