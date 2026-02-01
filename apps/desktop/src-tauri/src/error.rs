//! 错误类型定义

use thiserror::Error;

/// 应用错误类型
#[derive(Error, Debug)]
pub enum AppError {
    #[error("数据库错误: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("IO 错误: {0}")]
    Io(#[from] std::io::Error),

    #[error("序列化错误: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Tauri 错误: {0}")]
    Tauri(#[from] tauri::Error),

    #[error("HTTP 请求错误: {0}")]
    Http(#[from] reqwest::Error),

    #[error("Ollama 错误: {0}")]
    Ollama(String),

    #[error("工作流错误: {0}")]
    Workflow(String),

    #[error("执行错误: {0}")]
    Execution(String),

    #[error("配置错误: {0}")]
    Config(String),

    #[error("未找到: {0}")]
    NotFound(String),

    #[error("验证错误: {0}")]
    Validation(String),

    #[error("加密错误: {0}")]
    Crypto(String),

    #[error("压缩错误: {0}")]
    Compression(String),

    #[error("其他错误: {0}")]
    Other(String),
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

/// 结果类型别名
pub type AppResult<T> = Result<T, AppError>;
