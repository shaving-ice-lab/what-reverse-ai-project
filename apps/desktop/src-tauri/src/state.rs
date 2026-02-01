//! 应用状态管理

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::AppHandle;
use tokio::sync::broadcast;
use tokio_util::sync::CancellationToken;

use crate::error::{AppError, AppResult};

/// 执行上下文，用于跟踪和控制单个工作流执行
#[derive(Clone)]
pub struct ExecutionContext {
    /// 执行 ID
    pub id: String,
    /// 工作流 ID
    pub workflow_id: String,
    /// 取消令牌
    pub cancellation_token: CancellationToken,
    /// 开始时间
    pub started_at: chrono::DateTime<chrono::Utc>,
}

/// 执行管理器，管理所有运行中的执行
pub struct ExecutionManager {
    /// 运行中的执行（execution_id -> context）
    running: Mutex<HashMap<String, ExecutionContext>>,
}

impl ExecutionManager {
    pub fn new() -> Self {
        Self {
            running: Mutex::new(HashMap::new()),
        }
    }

    /// 注册一个新的执行
    pub fn register(&self, id: String, workflow_id: String) -> ExecutionContext {
        let ctx = ExecutionContext {
            id: id.clone(),
            workflow_id,
            cancellation_token: CancellationToken::new(),
            started_at: chrono::Utc::now(),
        };
        self.running.lock().unwrap().insert(id, ctx.clone());
        ctx
    }

    /// 取消一个执行
    pub fn cancel(&self, id: &str) -> bool {
        if let Some(ctx) = self.running.lock().unwrap().get(id) {
            ctx.cancellation_token.cancel();
            true
        } else {
            false
        }
    }

    /// 移除一个执行
    pub fn remove(&self, id: &str) -> Option<ExecutionContext> {
        self.running.lock().unwrap().remove(id)
    }

    /// 获取一个执行的上下文
    pub fn get(&self, id: &str) -> Option<ExecutionContext> {
        self.running.lock().unwrap().get(id).cloned()
    }

    /// 获取所有运行中的执行 ID
    pub fn list_running(&self) -> Vec<String> {
        self.running.lock().unwrap().keys().cloned().collect()
    }

    /// 获取运行中执行的数量
    pub fn count(&self) -> usize {
        self.running.lock().unwrap().len()
    }
}

impl Default for ExecutionManager {
    fn default() -> Self {
        Self::new()
    }
}

/// 应用状态
pub struct AppState {
    /// 数据目录
    pub data_dir: PathBuf,
    /// 配置目录
    pub config_dir: PathBuf,
    /// 缓存目录
    pub cache_dir: PathBuf,
    /// 数据库路径
    pub db_path: PathBuf,
    /// Ollama 服务地址
    pub ollama_url: Mutex<String>,
    /// 是否离线模式
    pub offline_mode: Mutex<bool>,
    /// 执行管理器
    pub execution_manager: ExecutionManager,
}

impl AppState {
    /// 创建新的应用状态
    pub fn new(app: &AppHandle) -> AppResult<Self> {
        // 获取应用数据目录
        let data_dir = app
            .path()
            .app_data_dir()
            .map_err(|e| AppError::Config(e.to_string()))?;

        let config_dir = app
            .path()
            .app_config_dir()
            .map_err(|e| AppError::Config(e.to_string()))?;

        let cache_dir = app
            .path()
            .app_cache_dir()
            .map_err(|e| AppError::Config(e.to_string()))?;

        // 确保目录存在
        std::fs::create_dir_all(&data_dir)?;
        std::fs::create_dir_all(&config_dir)?;
        std::fs::create_dir_all(&cache_dir)?;

        // 数据库路径
        let db_path = data_dir.join("agentflow.db");

        Ok(Self {
            data_dir,
            config_dir,
            cache_dir,
            db_path,
            ollama_url: Mutex::new("http://localhost:11434".to_string()),
            offline_mode: Mutex::new(false),
            execution_manager: ExecutionManager::new(),
        })
    }

    /// 获取执行管理器
    pub fn get_execution_manager(&self) -> &ExecutionManager {
        &self.execution_manager
    }

    /// 获取数据目录路径
    pub fn get_data_dir(&self) -> &PathBuf {
        &self.data_dir
    }

    /// 获取数据库路径
    pub fn get_db_path(&self) -> &PathBuf {
        &self.db_path
    }

    /// 获取 Ollama URL
    pub fn get_ollama_url(&self) -> String {
        self.ollama_url.lock().unwrap().clone()
    }

    /// 设置 Ollama URL
    pub fn set_ollama_url(&self, url: String) {
        *self.ollama_url.lock().unwrap() = url;
    }

    /// 获取离线模式状态
    pub fn is_offline(&self) -> bool {
        *self.offline_mode.lock().unwrap()
    }

    /// 设置离线模式
    pub fn set_offline(&self, offline: bool) {
        *self.offline_mode.lock().unwrap() = offline;
    }
}
