//! 设置相关命令

use tauri::State;
use std::path::PathBuf;

use crate::error::AppError;
use crate::models::Settings;
use crate::state::AppState;
use crate::storage;

const SETTINGS_FILE: &str = "settings.json";

/// 获取设置
#[tauri::command]
pub async fn get_settings(
    state: State<'_, AppState>,
) -> Result<Settings, AppError> {
    let settings_path = state.config_dir.join(SETTINGS_FILE);
    
    if settings_path.exists() {
        let content = storage::read_file(&settings_path)?;
        let settings: Settings = serde_json::from_slice(&content)?;
        Ok(settings)
    } else {
        Ok(Settings::default())
    }
}

/// 更新设置
#[tauri::command]
pub async fn update_settings(
    state: State<'_, AppState>,
    settings: Settings,
) -> Result<Settings, AppError> {
    let settings_path = state.config_dir.join(SETTINGS_FILE);
    
    // 更新应用状态
    state.set_ollama_url(settings.ollama_url.clone());
    state.set_offline(settings.offline_mode);
    
    // 保存到文件
    let content = serde_json::to_vec_pretty(&settings)?;
    storage::save_file(&settings_path, &content)?;
    
    log::info!("Settings updated");
    Ok(settings)
}
