//! AgentFlow Desktop - Tauri 桌面应用库
//!
//! 提供本地优先的 AI Agent 工作流平台桌面体验

pub mod commands;
pub mod crypto;
pub mod database;
pub mod error;
pub mod models;
pub mod ollama;
pub mod state;
pub mod storage;

use tauri::{Manager, AppHandle};
use state::AppState;

/// 应用初始化
pub fn init_app(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // 初始化日志
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();
    log::info!("AgentFlow Desktop starting...");

    // 初始化应用状态（包含执行管理器）
    let app_state = AppState::new(app)?;
    app.manage(app_state);

    // 初始化数据库
    database::init(app)?;

    log::info!("AgentFlow Desktop initialized successfully");
    Ok(())
}

/// 运行 Tauri 应用
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            init_app(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // 工作流命令
            commands::workflow::create_workflow,
            commands::workflow::get_workflow,
            commands::workflow::list_workflows,
            commands::workflow::update_workflow,
            commands::workflow::delete_workflow,
            commands::workflow::duplicate_workflow,
            // 执行命令
            commands::execution::execute_workflow,
            commands::execution::stop_execution,
            commands::execution::get_execution,
            commands::execution::list_executions,
            commands::execution::list_running_executions,
            commands::execution::get_execution_stats,
            // Ollama 命令
            commands::ollama::check_ollama_status,
            commands::ollama::list_ollama_models,
            commands::ollama::pull_ollama_model,
            commands::ollama::delete_ollama_model,
            commands::ollama::get_model_info,
            commands::ollama::chat_completion,
            // 设置命令
            commands::settings::get_settings,
            commands::settings::update_settings,
            // 存储命令
            commands::storage::get_storage_path,
            commands::storage::get_data_dir,
            // API Key 命令
            commands::api_keys::create_api_key,
            commands::api_keys::list_api_keys,
            commands::api_keys::list_api_keys_by_provider,
            commands::api_keys::get_decrypted_api_key,
            commands::api_keys::get_default_api_key_for_provider,
            commands::api_keys::set_default_api_key,
            commands::api_keys::toggle_api_key,
            commands::api_keys::delete_api_key,
            commands::api_keys::validate_api_key,
            // 快照命令
            commands::snapshot::save_snapshot,
            commands::snapshot::get_snapshot,
            commands::snapshot::list_snapshots,
            commands::snapshot::delete_snapshot,
            commands::snapshot::recompress_snapshot,
            commands::snapshot::cleanup_snapshots,
            commands::snapshot::get_snapshot_storage_stats,
            commands::snapshot::get_execution_timeline,
            commands::snapshot::get_node_details,
            // 更新命令
            commands::updater::check_update,
            commands::updater::download_and_install_update,
            commands::updater::get_app_version,
            commands::updater::get_app_info,
            // 系统命令
            commands::system::get_system_info,
            commands::system::get_system_resources,
            commands::system::get_auto_start_status,
            commands::system::set_auto_start,
            commands::system::get_storage_details,
            commands::system::get_log_stats,
            commands::system::clear_logs,
            commands::system::clear_cache,
            commands::system::export_logs,
            commands::system::minimize_to_tray,
            commands::system::restore_from_tray,
            commands::system::check_for_updates,
            commands::system::get_app_version,
            commands::system::quit_app,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
