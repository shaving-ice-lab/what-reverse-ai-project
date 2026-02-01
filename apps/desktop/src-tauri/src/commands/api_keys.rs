//! API Key 管理命令

use tauri::State;
use chrono::Utc;

use crate::crypto::{CryptoManager, generate_key_hint, generate_id};
use crate::database::{self, Database};
use crate::error::{AppError, AppResult};
use crate::models::{ApiKey, ApiKeyInfo, CreateApiKeyRequest};

/// 创建 API Key
#[tauri::command]
pub async fn create_api_key(
    db: State<'_, Database>,
    request: CreateApiKeyRequest,
) -> Result<ApiKeyInfo, String> {
    create_api_key_internal(&db, request)
        .map_err(|e| e.to_string())
}

fn create_api_key_internal(db: &Database, request: CreateApiKeyRequest) -> AppResult<ApiKeyInfo> {
    // 验证输入
    if request.name.trim().is_empty() {
        return Err(AppError::Validation("名称不能为空".to_string()));
    }
    if request.api_key.trim().is_empty() {
        return Err(AppError::Validation("API Key 不能为空".to_string()));
    }
    if request.provider.trim().is_empty() {
        return Err(AppError::Validation("提供商不能为空".to_string()));
    }

    // 初始化加密管理器
    let crypto = CryptoManager::new_with_device_id()?;
    
    // 加密 API Key
    let (encrypted_key, nonce) = crypto.encrypt(&request.api_key)?;
    
    // 生成 Key 提示
    let key_hint = generate_key_hint(&request.api_key);
    
    let now = Utc::now();
    let id = generate_id();
    
    let api_key = ApiKey {
        id: id.clone(),
        name: request.name.trim().to_string(),
        provider: request.provider.trim().to_lowercase(),
        encrypted_key,
        nonce,
        key_hint: Some(key_hint.clone()),
        base_url: request.base_url,
        is_default: request.is_default.unwrap_or(false),
        is_enabled: true,
        last_used_at: None,
        usage_count: 0,
        created_at: now,
        updated_at: now,
    };
    
    database::create_api_key(db, &api_key)?;
    
    Ok(ApiKeyInfo {
        id,
        name: api_key.name,
        provider: api_key.provider,
        key_hint: Some(key_hint),
        base_url: api_key.base_url,
        is_default: api_key.is_default,
        is_enabled: api_key.is_enabled,
        last_used_at: api_key.last_used_at,
        usage_count: api_key.usage_count,
        created_at: api_key.created_at,
        updated_at: api_key.updated_at,
    })
}

/// 获取 API Key 列表
#[tauri::command]
pub async fn list_api_keys(
    db: State<'_, Database>,
) -> Result<Vec<ApiKeyInfo>, String> {
    database::list_api_keys(&db)
        .map_err(|e| e.to_string())
}

/// 获取指定提供商的 API Keys
#[tauri::command]
pub async fn list_api_keys_by_provider(
    db: State<'_, Database>,
    provider: String,
) -> Result<Vec<ApiKeyInfo>, String> {
    database::list_api_keys_by_provider(&db, &provider)
        .map_err(|e| e.to_string())
}

/// 获取解密后的 API Key（用于实际调用 API）
#[tauri::command]
pub async fn get_decrypted_api_key(
    db: State<'_, Database>,
    id: String,
) -> Result<String, String> {
    get_decrypted_api_key_internal(&db, &id)
        .map_err(|e| e.to_string())
}

fn get_decrypted_api_key_internal(db: &Database, id: &str) -> AppResult<String> {
    let api_key = database::get_api_key(db, id)?;
    
    if !api_key.is_enabled {
        return Err(AppError::Validation("此 API Key 已禁用".to_string()));
    }
    
    // 解密
    let crypto = CryptoManager::new_with_device_id()?;
    let decrypted = crypto.decrypt(&api_key.encrypted_key, &api_key.nonce)?;
    
    // 更新使用统计
    let _ = database::update_api_key_usage(db, id);
    
    Ok(decrypted)
}

/// 获取提供商的默认 API Key（解密后）
#[tauri::command]
pub async fn get_default_api_key_for_provider(
    db: State<'_, Database>,
    provider: String,
) -> Result<Option<String>, String> {
    get_default_api_key_internal(&db, &provider)
        .map_err(|e| e.to_string())
}

fn get_default_api_key_internal(db: &Database, provider: &str) -> AppResult<Option<String>> {
    let api_key = database::get_default_api_key(db, provider)?;
    
    match api_key {
        Some(key) => {
            if !key.is_enabled {
                return Ok(None);
            }
            
            let crypto = CryptoManager::new_with_device_id()?;
            let decrypted = crypto.decrypt(&key.encrypted_key, &key.nonce)?;
            
            // 更新使用统计
            let _ = database::update_api_key_usage(db, &key.id);
            
            Ok(Some(decrypted))
        }
        None => Ok(None),
    }
}

/// 设置默认 API Key
#[tauri::command]
pub async fn set_default_api_key(
    db: State<'_, Database>,
    id: String,
    provider: String,
) -> Result<(), String> {
    database::set_default_api_key(&db, &id, &provider)
        .map_err(|e| e.to_string())
}

/// 启用/禁用 API Key
#[tauri::command]
pub async fn toggle_api_key(
    db: State<'_, Database>,
    id: String,
    enabled: bool,
) -> Result<(), String> {
    database::toggle_api_key(&db, &id, enabled)
        .map_err(|e| e.to_string())
}

/// 删除 API Key
#[tauri::command]
pub async fn delete_api_key(
    db: State<'_, Database>,
    id: String,
) -> Result<(), String> {
    database::delete_api_key(&db, &id)
        .map_err(|e| e.to_string())
}

/// 验证 API Key（测试连接）
#[tauri::command]
pub async fn validate_api_key(
    db: State<'_, Database>,
    id: String,
) -> Result<bool, String> {
    validate_api_key_internal(&db, &id).await
        .map_err(|e| e.to_string())
}

async fn validate_api_key_internal(db: &Database, id: &str) -> AppResult<bool> {
    let api_key = database::get_api_key(db, id)?;
    
    // 解密
    let crypto = CryptoManager::new_with_device_id()?;
    let decrypted = crypto.decrypt(&api_key.encrypted_key, &api_key.nonce)?;
    
    // 根据提供商验证
    match api_key.provider.as_str() {
        "openai" => validate_openai_key(&decrypted, api_key.base_url.as_deref()).await,
        "anthropic" => validate_anthropic_key(&decrypted, api_key.base_url.as_deref()).await,
        "ollama" => validate_ollama_connection(api_key.base_url.as_deref()).await,
        _ => {
            // 对于其他提供商，只检查 key 格式
            Ok(!decrypted.is_empty())
        }
    }
}

/// 验证 OpenAI API Key
async fn validate_openai_key(api_key: &str, base_url: Option<&str>) -> AppResult<bool> {
    let url = base_url.unwrap_or("https://api.openai.com/v1");
    let client = reqwest::Client::new();
    
    let response = client
        .get(format!("{}/models", url))
        .header("Authorization", format!("Bearer {}", api_key))
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await;
    
    match response {
        Ok(resp) => Ok(resp.status().is_success()),
        Err(_) => Ok(false),
    }
}

/// 验证 Anthropic API Key
async fn validate_anthropic_key(api_key: &str, base_url: Option<&str>) -> AppResult<bool> {
    let url = base_url.unwrap_or("https://api.anthropic.com");
    let client = reqwest::Client::new();
    
    // Anthropic 需要发送一个简单请求来验证
    let response = client
        .post(format!("{}/v1/messages", url))
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .body(r#"{"model":"claude-3-haiku-20240307","max_tokens":1,"messages":[{"role":"user","content":"hi"}]}"#)
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await;
    
    match response {
        Ok(resp) => {
            // 401 表示 key 无效，其他错误可能是配额等问题
            Ok(resp.status() != reqwest::StatusCode::UNAUTHORIZED)
        }
        Err(_) => Ok(false),
    }
}

/// 验证 Ollama 连接
async fn validate_ollama_connection(base_url: Option<&str>) -> AppResult<bool> {
    let url = base_url.unwrap_or("http://localhost:11434");
    let client = reqwest::Client::new();
    
    let response = client
        .get(format!("{}/api/tags", url))
        .timeout(std::time::Duration::from_secs(5))
        .send()
        .await;
    
    match response {
        Ok(resp) => Ok(resp.status().is_success()),
        Err(_) => Ok(false),
    }
}
