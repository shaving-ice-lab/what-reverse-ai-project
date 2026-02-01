//! Ollama 本地模型集成

use reqwest::Client;
use serde::{Deserialize, Serialize};

use crate::error::{AppError, AppResult};
use crate::models::{ChatMessage, ChatOptions, ChatRequest, ChatResponse, OllamaModel};

/// Ollama 客户端
pub struct OllamaClient {
    client: Client,
    base_url: String,
}

impl OllamaClient {
    /// 创建新的 Ollama 客户端
    pub fn new(base_url: &str) -> Self {
        Self {
            client: Client::new(),
            base_url: base_url.to_string(),
        }
    }

    /// 检查 Ollama 服务状态
    pub async fn check_status(&self) -> AppResult<OllamaStatus> {
        let url = format!("{}/api/tags", self.base_url);
        
        match self.client.get(&url).send().await {
            Ok(response) => {
                if response.status().is_success() {
                    let models: ModelsResponse = response.json().await?;
                    Ok(OllamaStatus {
                        running: true,
                        version: None,
                        models_count: models.models.len(),
                    })
                } else {
                    Ok(OllamaStatus {
                        running: false,
                        version: None,
                        models_count: 0,
                    })
                }
            }
            Err(_) => Ok(OllamaStatus {
                running: false,
                version: None,
                models_count: 0,
            }),
        }
    }

    /// 列出可用模型
    pub async fn list_models(&self) -> AppResult<Vec<OllamaModel>> {
        let url = format!("{}/api/tags", self.base_url);
        
        let response = self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| AppError::Ollama(format!("Failed to connect to Ollama: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::Ollama("Failed to list models".to_string()));
        }

        let models: ModelsResponse = response.json().await?;
        Ok(models.models)
    }

    /// 拉取模型
    pub async fn pull_model(&self, model_name: &str) -> AppResult<PullProgress> {
        let url = format!("{}/api/pull", self.base_url);
        
        let response = self.client
            .post(&url)
            .json(&serde_json::json!({
                "name": model_name,
                "stream": false
            }))
            .send()
            .await
            .map_err(|e| AppError::Ollama(format!("Failed to pull model: {}", e)))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AppError::Ollama(format!("Failed to pull model: {}", error_text)));
        }

        let progress: PullProgress = response.json().await?;
        Ok(progress)
    }

    /// 聊天完成
    pub async fn chat(&self, request: ChatRequest) -> AppResult<ChatResponse> {
        let url = format!("{}/api/chat", self.base_url);
        
        let mut body = serde_json::json!({
            "model": request.model,
            "messages": request.messages,
            "stream": false
        });

        if let Some(options) = request.options {
            if let Some(temp) = options.temperature {
                body["options"]["temperature"] = serde_json::json!(temp);
            }
            if let Some(top_p) = options.top_p {
                body["options"]["top_p"] = serde_json::json!(top_p);
            }
            if let Some(top_k) = options.top_k {
                body["options"]["top_k"] = serde_json::json!(top_k);
            }
            if let Some(max_tokens) = options.max_tokens {
                body["options"]["num_predict"] = serde_json::json!(max_tokens);
            }
        }

        let response = self.client
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| AppError::Ollama(format!("Failed to send chat request: {}", e)))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AppError::Ollama(format!("Chat request failed: {}", error_text)));
        }

        let chat_response: ChatResponse = response.json().await?;
        Ok(chat_response)
    }

    /// 生成文本嵌入
    pub async fn embed(&self, model: &str, prompt: &str) -> AppResult<Vec<f64>> {
        let url = format!("{}/api/embeddings", self.base_url);
        
        let response = self.client
            .post(&url)
            .json(&serde_json::json!({
                "model": model,
                "prompt": prompt
            }))
            .send()
            .await
            .map_err(|e| AppError::Ollama(format!("Failed to generate embedding: {}", e)))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AppError::Ollama(format!("Embedding request failed: {}", error_text)));
        }

        let embed_response: EmbedResponse = response.json().await?;
        Ok(embed_response.embedding)
    }

    /// 删除模型
    pub async fn delete_model(&self, model_name: &str) -> AppResult<()> {
        let url = format!("{}/api/delete", self.base_url);
        
        let response = self.client
            .delete(&url)
            .json(&serde_json::json!({
                "name": model_name
            }))
            .send()
            .await
            .map_err(|e| AppError::Ollama(format!("Failed to delete model: {}", e)))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AppError::Ollama(format!("Failed to delete model: {}", error_text)));
        }

        Ok(())
    }

    /// 获取模型详细信息
    pub async fn get_model_info(&self, model_name: &str) -> AppResult<crate::commands::ollama::ModelInfo> {
        let url = format!("{}/api/show", self.base_url);
        
        let response = self.client
            .post(&url)
            .json(&serde_json::json!({
                "name": model_name
            }))
            .send()
            .await
            .map_err(|e| AppError::Ollama(format!("Failed to get model info: {}", e)))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AppError::Ollama(format!("Failed to get model info: {}", error_text)));
        }

        let info: ModelInfoResponse = response.json().await?;
        
        Ok(crate::commands::ollama::ModelInfo {
            name: model_name.to_string(),
            modelfile: info.modelfile,
            parameters: info.parameters,
            template: info.template,
            details: crate::commands::ollama::ModelDetails {
                format: info.details.format,
                family: info.details.family,
                parameter_size: info.details.parameter_size,
                quantization_level: info.details.quantization_level,
            },
        })
    }
}

/// 模型信息响应
#[derive(Debug, Clone, Deserialize)]
struct ModelInfoResponse {
    modelfile: Option<String>,
    parameters: Option<String>,
    template: Option<String>,
    details: ModelDetailsResponse,
}

/// 模型详情响应
#[derive(Debug, Clone, Deserialize)]
struct ModelDetailsResponse {
    format: Option<String>,
    family: Option<String>,
    parameter_size: Option<String>,
    quantization_level: Option<String>,
}

/// Ollama 状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaStatus {
    pub running: bool,
    pub version: Option<String>,
    pub models_count: usize,
}

/// 模型列表响应
#[derive(Debug, Clone, Deserialize)]
struct ModelsResponse {
    models: Vec<OllamaModel>,
}

/// 拉取进度
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PullProgress {
    pub status: String,
    pub digest: Option<String>,
    pub total: Option<i64>,
    pub completed: Option<i64>,
}

/// 嵌入响应
#[derive(Debug, Clone, Deserialize)]
struct EmbedResponse {
    embedding: Vec<f64>,
}
