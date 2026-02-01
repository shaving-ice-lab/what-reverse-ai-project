//! 存储相关命令

use tauri::State;

use crate::error::AppError;
use crate::state::AppState;
use crate::storage::{self, StorageType};

/// 获取存储路径
#[tauri::command]
pub async fn get_storage_path(
    state: State<'_, AppState>,
    storage_type: String,
) -> Result<String, AppError> {
    let st = match storage_type.as_str() {
        "workflows" => StorageType::Workflows,
        "executions" => StorageType::Executions,
        "models" => StorageType::Models,
        "plugins" => StorageType::Plugins,
        "cache" => StorageType::Cache,
        "temp" => StorageType::Temp,
        _ => return Err(AppError::Validation(format!("Invalid storage type: {}", storage_type))),
    };

    let path = storage::get_storage_path(&state.data_dir, st)?;
    Ok(path.to_string_lossy().to_string())
}

/// 获取数据目录
#[tauri::command]
pub async fn get_data_dir(
    state: State<'_, AppState>,
) -> Result<String, AppError> {
    Ok(state.data_dir.to_string_lossy().to_string())
}
