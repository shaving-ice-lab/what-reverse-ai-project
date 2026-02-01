//! Ollama 相关命令
//!
//! 提供 Ollama 本地 LLM 管理功能：
//! - 状态检查
//! - 模型列表
//! - 模型拉取/删除
//! - 模型信息获取
//! - 聊天完成

use serde::{Deserialize, Serialize};
use tauri::State;

use crate::error::AppError;
use crate::models::{ChatMessage, ChatOptions, ChatRequest, ChatResponse, OllamaModel};
use crate::ollama::{OllamaClient, OllamaStatus, PullProgress};
use crate::state::AppState;

/// 检查 Ollama 状态
#[tauri::command]
pub async fn check_ollama_status(
    state: State<'_, AppState>,
) -> Result<OllamaStatus, AppError> {
    let client = OllamaClient::new(&state.get_ollama_url());
    client.check_status().await
}

/// 列出 Ollama 模型
#[tauri::command]
pub async fn list_ollama_models(
    state: State<'_, AppState>,
) -> Result<Vec<OllamaModel>, AppError> {
    let client = OllamaClient::new(&state.get_ollama_url());
    client.list_models().await
}

/// 拉取 Ollama 模型
#[tauri::command]
pub async fn pull_ollama_model(
    state: State<'_, AppState>,
    model_name: String,
) -> Result<PullProgress, AppError> {
    log::info!("Pulling Ollama model: {}", model_name);
    let client = OllamaClient::new(&state.get_ollama_url());
    client.pull_model(&model_name).await
}

/// 删除 Ollama 模型
#[tauri::command]
pub async fn delete_ollama_model(
    state: State<'_, AppState>,
    model_name: String,
) -> Result<(), AppError> {
    log::info!("Deleting Ollama model: {}", model_name);
    let client = OllamaClient::new(&state.get_ollama_url());
    client.delete_model(&model_name).await
}

/// 获取模型详细信息
#[tauri::command]
pub async fn get_model_info(
    state: State<'_, AppState>,
    model_name: String,
) -> Result<ModelInfo, AppError> {
    log::info!("Getting info for model: {}", model_name);
    let client = OllamaClient::new(&state.get_ollama_url());
    client.get_model_info(&model_name).await
}

/// 聊天完成
#[tauri::command]
pub async fn chat_completion(
    state: State<'_, AppState>,
    model: String,
    messages: Vec<ChatMessage>,
    options: Option<ChatOptions>,
) -> Result<ChatResponse, AppError> {
    let client = OllamaClient::new(&state.get_ollama_url());
    
    let request = ChatRequest {
        model,
        messages,
        stream: Some(false),
        options,
    };

    client.chat(request).await
}

/// 模型详细信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    /// 模型名称
    pub name: String,
    /// 模型文件信息
    pub modelfile: Option<String>,
    /// 模型参数
    pub parameters: Option<String>,
    /// 模型模板
    pub template: Option<String>,
    /// 模型详情
    pub details: ModelDetails,
}

/// 模型详情
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelDetails {
    /// 模型格式
    pub format: Option<String>,
    /// 模型家族
    pub family: Option<String>,
    /// 参数大小
    pub parameter_size: Option<String>,
    /// 量化级别
    pub quantization_level: Option<String>,
}
