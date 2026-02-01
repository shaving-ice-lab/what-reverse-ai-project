//! 执行快照命令
//!
//! 实现时间旅行调试的快照功能：
//! - 快照存储与检索
//! - 快照压缩
//! - 快照清理策略
//! - 时间线视图数据

use chrono::{DateTime, Duration, Utc};
use flate2::read::GzDecoder;
use flate2::write::GzEncoder;
use flate2::Compression;
use serde::{Deserialize, Serialize};
use std::io::{Read, Write};
use tauri::State;

use crate::database::Database;
use crate::error::AppError;
use crate::models::{
    ExecutionSnapshot, ExecutionStatus, ExecutionSummary, NodeSnapshot, NodeStatus,
    SnapshotListItem, SnapshotMetadata, SnapshotStorageOptions, TimelineStep, TimelineView,
};

// ===== 快照存储 =====

/// 保存执行快照
#[tauri::command]
pub async fn save_snapshot(
    db: State<'_, Database>,
    snapshot: ExecutionSnapshot,
    options: Option<SnapshotStorageOptions>,
) -> Result<String, AppError> {
    log::info!("Saving snapshot for execution: {}", snapshot.execution_id);

    let opts = options.unwrap_or_default();
    let should_compress = opts.compress.unwrap_or(true);
    let compression_level = opts.compression_level.unwrap_or(6);

    // 序列化快照
    let json_data = serde_json::to_string(&snapshot)
        .map_err(|e| AppError::Serialization(e.to_string()))?;

    let original_size = json_data.len() as i64;

    // 压缩数据
    let (data_to_store, compressed, compressed_size) = if should_compress {
        let compressed_data = compress_data(&json_data, compression_level)?;
        let size = compressed_data.len() as i64;
        (compressed_data, true, Some(size))
    } else {
        (json_data.into_bytes(), false, None)
    };

    // 存储到数据库
    let conn = db.get_conn();

    conn.execute(
        "INSERT OR REPLACE INTO execution_snapshots 
         (execution_id, workflow_id, workflow_name, status, started_at, completed_at, duration_ms,
          data, compressed, original_size, compressed_size, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
        rusqlite::params![
            snapshot.execution_id,
            snapshot.workflow_id,
            snapshot.workflow_name,
            serde_json::to_string(&snapshot.status)?,
            snapshot.started_at.to_rfc3339(),
            snapshot.completed_at.map(|dt| dt.to_rfc3339()),
            snapshot.duration_ms,
            data_to_store,
            compressed,
            original_size,
            compressed_size,
            Utc::now().to_rfc3339(),
        ],
    )?;

    log::info!(
        "Snapshot saved: {} (original: {} bytes, compressed: {:?} bytes)",
        snapshot.execution_id,
        original_size,
        compressed_size
    );

    Ok(snapshot.execution_id)
}

/// 获取执行快照
#[tauri::command]
pub async fn get_snapshot(
    db: State<'_, Database>,
    execution_id: String,
) -> Result<ExecutionSnapshot, AppError> {
    log::info!("Getting snapshot for execution: {}", execution_id);

    let conn = db.get_conn();

    let (data, compressed): (Vec<u8>, bool) = conn
        .query_row(
            "SELECT data, compressed FROM execution_snapshots WHERE execution_id = ?",
            [&execution_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => {
                AppError::NotFound(format!("Snapshot not found: {}", execution_id))
            }
            _ => AppError::Database(e),
        })?;

    // 解压缩数据
    let json_data = if compressed {
        decompress_data(&data)?
    } else {
        String::from_utf8(data).map_err(|e| AppError::Serialization(e.to_string()))?
    };

    // 反序列化
    let snapshot: ExecutionSnapshot =
        serde_json::from_str(&json_data).map_err(|e| AppError::Serialization(e.to_string()))?;

    Ok(snapshot)
}

/// 获取快照列表
#[tauri::command]
pub async fn list_snapshots(
    db: State<'_, Database>,
    workflow_id: Option<String>,
    limit: Option<i32>,
    offset: Option<i32>,
) -> Result<Vec<SnapshotListItem>, AppError> {
    log::info!("Listing snapshots for workflow: {:?}", workflow_id);

    let conn = db.get_conn();
    let limit = limit.unwrap_or(50);
    let offset = offset.unwrap_or(0);

    let query = if workflow_id.is_some() {
        "SELECT execution_id, workflow_id, workflow_name, status, started_at, completed_at, duration_ms
         FROM execution_snapshots WHERE workflow_id = ?1
         ORDER BY started_at DESC LIMIT ?2 OFFSET ?3"
    } else {
        "SELECT execution_id, workflow_id, workflow_name, status, started_at, completed_at, duration_ms
         FROM execution_snapshots
         ORDER BY started_at DESC LIMIT ?1 OFFSET ?2"
    };

    let mut stmt = conn.prepare(query)?;

    let rows = if let Some(wf_id) = workflow_id {
        stmt.query_map(rusqlite::params![wf_id, limit, offset], map_snapshot_list_row)?
    } else {
        stmt.query_map(rusqlite::params![limit, offset], map_snapshot_list_row)?
    };

    let snapshots: Vec<SnapshotListItem> = rows.filter_map(|r| r.ok()).collect();

    Ok(snapshots)
}

/// 映射快照列表行
fn map_snapshot_list_row(row: &rusqlite::Row) -> rusqlite::Result<SnapshotListItem> {
    Ok(SnapshotListItem {
        execution_id: row.get(0)?,
        workflow_id: row.get(1)?,
        workflow_name: row.get(2)?,
        status: serde_json::from_str(&row.get::<_, String>(3)?).unwrap_or(ExecutionStatus::Failed),
        started_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(4)?)
            .map(|dt| dt.with_timezone(&chrono::Utc))
            .unwrap_or_else(|_| chrono::Utc::now()),
        completed_at: row
            .get::<_, Option<String>>(5)?
            .and_then(|s| chrono::DateTime::parse_from_rfc3339(&s).ok())
            .map(|dt| dt.with_timezone(&chrono::Utc)),
        duration_ms: row.get(6)?,
        summary: ExecutionSummary {
            total_nodes: 0,
            completed_nodes: 0,
            failed_nodes: 0,
            skipped_nodes: 0,
            total_tokens_used: None,
            estimated_cost: None,
        },
    })
}

/// 删除快照
#[tauri::command]
pub async fn delete_snapshot(
    db: State<'_, Database>,
    execution_id: String,
) -> Result<(), AppError> {
    log::info!("Deleting snapshot: {}", execution_id);

    let conn = db.get_conn();

    conn.execute(
        "DELETE FROM execution_snapshots WHERE execution_id = ?",
        [&execution_id],
    )?;

    Ok(())
}

// ===== 快照压缩 =====

/// 压缩数据
fn compress_data(data: &str, level: i32) -> Result<Vec<u8>, AppError> {
    let compression = match level {
        1..=3 => Compression::fast(),
        4..=6 => Compression::default(),
        7..=9 => Compression::best(),
        _ => Compression::default(),
    };

    let mut encoder = GzEncoder::new(Vec::new(), compression);
    encoder
        .write_all(data.as_bytes())
        .map_err(|e| AppError::Compression(e.to_string()))?;
    encoder
        .finish()
        .map_err(|e| AppError::Compression(e.to_string()))
}

/// 解压缩数据
fn decompress_data(data: &[u8]) -> Result<String, AppError> {
    let mut decoder = GzDecoder::new(data);
    let mut decompressed = String::new();
    decoder
        .read_to_string(&mut decompressed)
        .map_err(|e| AppError::Compression(e.to_string()))?;
    Ok(decompressed)
}

/// 重新压缩快照（优化存储）
#[tauri::command]
pub async fn recompress_snapshot(
    db: State<'_, Database>,
    execution_id: String,
    compression_level: Option<i32>,
) -> Result<CompressionResult, AppError> {
    log::info!("Recompressing snapshot: {}", execution_id);

    // 获取原始快照
    let snapshot = get_snapshot(db.clone(), execution_id.clone()).await?;

    // 重新保存（会自动压缩）
    let options = SnapshotStorageOptions {
        compress: Some(true),
        compression_level: compression_level.or(Some(9)), // 使用最高压缩
        ..Default::default()
    };

    save_snapshot(db.clone(), snapshot, Some(options)).await?;

    // 获取新的大小信息
    let conn = db.get_conn();
    let (original_size, compressed_size): (i64, Option<i64>) = conn.query_row(
        "SELECT original_size, compressed_size FROM execution_snapshots WHERE execution_id = ?",
        [&execution_id],
        |row| Ok((row.get(0)?, row.get(1)?)),
    )?;

    Ok(CompressionResult {
        execution_id,
        original_size,
        compressed_size: compressed_size.unwrap_or(original_size),
        compression_ratio: compressed_size
            .map(|cs| (1.0 - cs as f64 / original_size as f64) * 100.0)
            .unwrap_or(0.0),
    })
}

/// 压缩结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompressionResult {
    pub execution_id: String,
    pub original_size: i64,
    pub compressed_size: i64,
    pub compression_ratio: f64,
}

// ===== 快照清理策略 =====

/// 清理选项
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CleanupOptions {
    /// 最大保留数量
    pub max_count: Option<i32>,
    /// 最大保留天数
    pub max_age_days: Option<i32>,
    /// 最大总大小 (MB)
    pub max_total_size_mb: Option<i64>,
    /// 只清理失败的执行
    pub failed_only: Option<bool>,
    /// 排除收藏的工作流
    pub exclude_favorites: Option<bool>,
    /// 空运行（不实际删除）
    pub dry_run: Option<bool>,
}

/// 清理结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanupResult {
    pub deleted_count: i32,
    pub freed_bytes: i64,
    pub deleted_ids: Vec<String>,
}

/// 执行快照清理
#[tauri::command]
pub async fn cleanup_snapshots(
    db: State<'_, Database>,
    options: CleanupOptions,
) -> Result<CleanupResult, AppError> {
    log::info!("Cleaning up snapshots with options: {:?}", options);

    let conn = db.get_conn();
    let mut deleted_ids = Vec::new();
    let mut freed_bytes: i64 = 0;
    let dry_run = options.dry_run.unwrap_or(false);

    // 1. 按年龄清理
    if let Some(max_days) = options.max_age_days {
        let cutoff = Utc::now() - Duration::days(max_days as i64);
        let cutoff_str = cutoff.to_rfc3339();

        let ids_to_delete: Vec<(String, i64)> = {
            let mut stmt = conn.prepare(
                "SELECT execution_id, COALESCE(compressed_size, original_size) as size
                 FROM execution_snapshots WHERE started_at < ?",
            )?;
            stmt.query_map([&cutoff_str], |row| Ok((row.get(0)?, row.get(1)?)))?
                .filter_map(|r| r.ok())
                .collect()
        };

        for (id, size) in ids_to_delete {
            deleted_ids.push(id.clone());
            freed_bytes += size;
            if !dry_run {
                conn.execute(
                    "DELETE FROM execution_snapshots WHERE execution_id = ?",
                    [&id],
                )?;
            }
        }
    }

    // 2. 按数量清理（保留最新的 N 个）
    if let Some(max_count) = options.max_count {
        let ids_to_delete: Vec<(String, i64)> = {
            let mut stmt = conn.prepare(
                "SELECT execution_id, COALESCE(compressed_size, original_size) as size
                 FROM execution_snapshots 
                 ORDER BY started_at DESC
                 LIMIT -1 OFFSET ?",
            )?;
            stmt.query_map([max_count], |row| Ok((row.get(0)?, row.get(1)?)))?
                .filter_map(|r| r.ok())
                .collect()
        };

        for (id, size) in ids_to_delete {
            if !deleted_ids.contains(&id) {
                deleted_ids.push(id.clone());
                freed_bytes += size;
                if !dry_run {
                    conn.execute(
                        "DELETE FROM execution_snapshots WHERE execution_id = ?",
                        [&id],
                    )?;
                }
            }
        }
    }

    // 3. 按总大小清理
    if let Some(max_mb) = options.max_total_size_mb {
        let max_bytes = max_mb * 1024 * 1024;

        // 获取当前总大小
        let total_size: i64 = conn.query_row(
            "SELECT COALESCE(SUM(COALESCE(compressed_size, original_size)), 0) FROM execution_snapshots",
            [],
            |row| row.get(0),
        )?;

        if total_size > max_bytes {
            let to_free = total_size - max_bytes;
            let mut freed: i64 = 0;

            // 按时间顺序删除最旧的
            let ids_to_delete: Vec<(String, i64)> = {
                let mut stmt = conn.prepare(
                    "SELECT execution_id, COALESCE(compressed_size, original_size) as size
                     FROM execution_snapshots 
                     ORDER BY started_at ASC",
                )?;
                stmt.query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?
                    .filter_map(|r| r.ok())
                    .collect()
            };

            for (id, size) in ids_to_delete {
                if freed >= to_free {
                    break;
                }
                if !deleted_ids.contains(&id) {
                    deleted_ids.push(id.clone());
                    freed_bytes += size;
                    freed += size;
                    if !dry_run {
                        conn.execute(
                            "DELETE FROM execution_snapshots WHERE execution_id = ?",
                            [&id],
                        )?;
                    }
                }
            }
        }
    }

    // 4. 只清理失败的执行
    if options.failed_only.unwrap_or(false) {
        let failed_status = serde_json::to_string(&ExecutionStatus::Failed)?;
        let ids_to_delete: Vec<(String, i64)> = {
            let mut stmt = conn.prepare(
                "SELECT execution_id, COALESCE(compressed_size, original_size) as size
                 FROM execution_snapshots WHERE status = ?",
            )?;
            stmt.query_map([&failed_status], |row| Ok((row.get(0)?, row.get(1)?)))?
                .filter_map(|r| r.ok())
                .collect()
        };

        for (id, size) in ids_to_delete {
            if !deleted_ids.contains(&id) {
                deleted_ids.push(id.clone());
                freed_bytes += size;
                if !dry_run {
                    conn.execute(
                        "DELETE FROM execution_snapshots WHERE execution_id = ?",
                        [&id],
                    )?;
                }
            }
        }
    }

    log::info!(
        "Cleanup complete: {} snapshots deleted, {} bytes freed (dry_run: {})",
        deleted_ids.len(),
        freed_bytes,
        dry_run
    );

    Ok(CleanupResult {
        deleted_count: deleted_ids.len() as i32,
        freed_bytes,
        deleted_ids,
    })
}

/// 获取存储统计
#[tauri::command]
pub async fn get_snapshot_storage_stats(db: State<'_, Database>) -> Result<StorageStats, AppError> {
    let conn = db.get_conn();

    let total_count: i64 =
        conn.query_row("SELECT COUNT(*) FROM execution_snapshots", [], |row| {
            row.get(0)
        })?;

    let total_original_size: i64 = conn.query_row(
        "SELECT COALESCE(SUM(original_size), 0) FROM execution_snapshots",
        [],
        |row| row.get(0),
    )?;

    let total_compressed_size: i64 = conn.query_row(
        "SELECT COALESCE(SUM(COALESCE(compressed_size, original_size)), 0) FROM execution_snapshots",
        [],
        |row| row.get(0),
    )?;

    let oldest_snapshot: Option<String> = conn
        .query_row(
            "SELECT started_at FROM execution_snapshots ORDER BY started_at ASC LIMIT 1",
            [],
            |row| row.get(0),
        )
        .ok();

    let newest_snapshot: Option<String> = conn
        .query_row(
            "SELECT started_at FROM execution_snapshots ORDER BY started_at DESC LIMIT 1",
            [],
            |row| row.get(0),
        )
        .ok();

    Ok(StorageStats {
        total_count: total_count as i32,
        total_original_size,
        total_compressed_size,
        compression_ratio: if total_original_size > 0 {
            (1.0 - total_compressed_size as f64 / total_original_size as f64) * 100.0
        } else {
            0.0
        },
        oldest_snapshot,
        newest_snapshot,
    })
}

/// 存储统计
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageStats {
    pub total_count: i32,
    pub total_original_size: i64,
    pub total_compressed_size: i64,
    pub compression_ratio: f64,
    pub oldest_snapshot: Option<String>,
    pub newest_snapshot: Option<String>,
}

// ===== 时间线视图 =====

/// 获取执行时间线
#[tauri::command]
pub async fn get_execution_timeline(
    db: State<'_, Database>,
    execution_id: String,
) -> Result<TimelineView, AppError> {
    log::info!("Getting timeline for execution: {}", execution_id);

    let snapshot = get_snapshot(db, execution_id.clone()).await?;

    // 构建时间线步骤
    let mut steps: Vec<TimelineStep> = Vec::new();

    for (index, node_id) in snapshot.execution_order.iter().enumerate() {
        if let Some(node_snapshot) = snapshot.node_snapshots.get(node_id) {
            steps.push(TimelineStep {
                index: index as i32,
                node_id: node_snapshot.node_id.clone(),
                node_name: node_snapshot.node_name.clone(),
                node_type: node_snapshot.node_type.clone(),
                node_icon: get_node_icon(&node_snapshot.node_type),
                status: node_snapshot.status.clone(),
                started_at: node_snapshot.started_at,
                completed_at: node_snapshot.completed_at,
                duration_ms: node_snapshot.duration_ms,
                description: get_step_description(node_snapshot),
                is_selected: None,
                has_error: Some(node_snapshot.error.is_some()),
            });
        }
    }

    Ok(TimelineView {
        execution_id: snapshot.execution_id,
        status: snapshot.status,
        started_at: snapshot.started_at,
        completed_at: snapshot.completed_at,
        duration_ms: snapshot.duration_ms,
        steps,
        selected_step_index: None,
    })
}

/// 获取节点图标
fn get_node_icon(node_type: &str) -> Option<String> {
    let icon = match node_type {
        "start" => "play",
        "end" => "flag",
        "llm" => "brain",
        "http" => "globe",
        "template" => "file-text",
        "condition" => "git-branch",
        "variable" => "variable",
        "code" => "code",
        "loop" => "repeat",
        "delay" => "clock",
        _ => "box",
    };
    Some(icon.to_string())
}

/// 获取步骤描述
fn get_step_description(snapshot: &NodeSnapshot) -> Option<String> {
    match snapshot.node_type.as_str() {
        "llm" => snapshot
            .metadata
            .as_ref()
            .and_then(|m| m.model.clone())
            .map(|m| format!("使用模型: {}", m)),
        "http" => snapshot
            .metadata
            .as_ref()
            .and_then(|m| m.http_url.clone())
            .map(|u| format!("请求: {}", u)),
        "condition" => snapshot
            .metadata
            .as_ref()
            .and_then(|m| m.condition_branch.clone())
            .map(|b| format!("分支: {}", b)),
        _ => None,
    }
}

/// 获取节点详情
#[tauri::command]
pub async fn get_node_details(
    db: State<'_, Database>,
    execution_id: String,
    node_id: String,
) -> Result<NodeSnapshot, AppError> {
    log::info!(
        "Getting node details for execution: {}, node: {}",
        execution_id,
        node_id
    );

    let snapshot = get_snapshot(db, execution_id).await?;

    snapshot
        .node_snapshots
        .get(&node_id)
        .cloned()
        .ok_or_else(|| AppError::NotFound(format!("Node not found: {}", node_id)))
}

// ===== 数据库初始化 =====

/// 初始化快照表
pub fn init_snapshot_tables(conn: &rusqlite::Connection) -> Result<(), rusqlite::Error> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS execution_snapshots (
            execution_id TEXT PRIMARY KEY,
            workflow_id TEXT NOT NULL,
            workflow_name TEXT,
            status TEXT NOT NULL,
            started_at TEXT NOT NULL,
            completed_at TEXT,
            duration_ms INTEGER,
            data BLOB NOT NULL,
            compressed INTEGER NOT NULL DEFAULT 1,
            original_size INTEGER NOT NULL,
            compressed_size INTEGER,
            created_at TEXT NOT NULL,
            FOREIGN KEY (workflow_id) REFERENCES workflows(id)
        )",
        [],
    )?;

    // 创建索引
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_snapshots_workflow_id ON execution_snapshots(workflow_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_snapshots_started_at ON execution_snapshots(started_at)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_snapshots_status ON execution_snapshots(status)",
        [],
    )?;

    Ok(())
}

impl Default for SnapshotStorageOptions {
    fn default() -> Self {
        Self {
            compress: Some(true),
            compression_level: Some(6),
            max_snapshots: None,
            max_age_days: None,
            exclude_sensitive_data: Some(false),
            sensitive_fields: None,
        }
    }
}
