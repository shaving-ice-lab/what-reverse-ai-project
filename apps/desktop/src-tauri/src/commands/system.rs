//! 系统集成命令
//!
//! 实现桌面系统集成功能：
//! - 自动更新检测和安装
//! - 系统托盘
//! - 开机自启动
//! - 资源监控

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use sysinfo::{System, CpuRefreshKind, RefreshKind, MemoryRefreshKind, Disks};
use tauri::{AppHandle, Manager, State};

use crate::error::AppError;
use crate::state::AppState;

// ===== 更新相关 =====

/// 更新信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInfo {
    /// 当前版本
    pub current_version: String,
    /// 最新版本
    pub latest_version: String,
    /// 是否有更新
    pub has_update: bool,
    /// 更新说明
    pub release_notes: Option<String>,
    /// 发布日期
    pub published_at: Option<String>,
    /// 下载 URL
    pub download_url: Option<String>,
    /// 文件大小 (bytes)
    pub file_size: Option<i64>,
    /// 是否强制更新
    pub mandatory: bool,
}

/// 检查更新
#[tauri::command]
pub async fn check_for_updates(app: AppHandle) -> Result<UpdateInfo, AppError> {
    log::info!("Checking for updates...");

    // 获取当前版本
    let current_version = app
        .package_info()
        .version
        .to_string();

    // 使用 Tauri updater 插件检查更新
    // 注意：实际的更新检查由 tauri-plugin-updater 处理
    // 这里返回基本信息，实际更新逻辑在前端调用 updater API

    Ok(UpdateInfo {
        current_version: current_version.clone(),
        latest_version: current_version, // 实际由 updater 插件获取
        has_update: false,
        release_notes: None,
        published_at: None,
        download_url: None,
        file_size: None,
        mandatory: false,
    })
}

/// 获取当前版本
#[tauri::command]
pub async fn get_app_version(app: AppHandle) -> Result<String, AppError> {
    Ok(app.package_info().version.to_string())
}

// ===== 系统托盘相关 =====

/// 托盘状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrayStatus {
    /// 是否在托盘
    pub is_in_tray: bool,
    /// 是否显示通知
    pub show_notifications: bool,
}

/// 最小化到托盘
#[tauri::command]
pub async fn minimize_to_tray(app: AppHandle) -> Result<(), AppError> {
    log::info!("Minimizing to tray");

    // 隐藏主窗口
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| AppError::Other(e.to_string()))?;
    }

    Ok(())
}

/// 从托盘恢复
#[tauri::command]
pub async fn restore_from_tray(app: AppHandle) -> Result<(), AppError> {
    log::info!("Restoring from tray");

    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| AppError::Other(e.to_string()))?;
        window
            .set_focus()
            .map_err(|e| AppError::Other(e.to_string()))?;
    }

    Ok(())
}

// ===== 开机自启动相关 =====

/// 自启动状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoStartStatus {
    /// 是否启用
    pub enabled: bool,
    /// 是否支持
    pub supported: bool,
}

/// 获取自启动状态
#[tauri::command]
pub async fn get_auto_start_status() -> Result<AutoStartStatus, AppError> {
    // 检查平台支持
    let supported = cfg!(target_os = "windows") || cfg!(target_os = "macos") || cfg!(target_os = "linux");

    // 检查是否已启用（平台相关实现）
    let enabled = check_auto_start_enabled();

    Ok(AutoStartStatus { enabled, supported })
}

/// 设置自启动
#[tauri::command]
pub async fn set_auto_start(app: AppHandle, enabled: bool) -> Result<(), AppError> {
    log::info!("Setting auto start: {}", enabled);

    #[cfg(target_os = "windows")]
    {
        set_auto_start_windows(&app, enabled)?;
    }

    #[cfg(target_os = "macos")]
    {
        set_auto_start_macos(&app, enabled)?;
    }

    #[cfg(target_os = "linux")]
    {
        set_auto_start_linux(&app, enabled)?;
    }

    Ok(())
}

/// 检查自启动是否启用
fn check_auto_start_enabled() -> bool {
    #[cfg(target_os = "windows")]
    {
        // 检查注册表
        false // 简化实现
    }

    #[cfg(target_os = "macos")]
    {
        // 检查 LaunchAgents
        false // 简化实现
    }

    #[cfg(target_os = "linux")]
    {
        // 检查 autostart 目录
        if let Some(config_dir) = dirs::config_dir() {
            let autostart_file = config_dir.join("autostart/agentflow.desktop");
            return autostart_file.exists();
        }
        false
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    false
}

#[cfg(target_os = "windows")]
fn set_auto_start_windows(app: &AppHandle, enabled: bool) -> Result<(), AppError> {
    use std::process::Command;

    let exe_path = std::env::current_exe()
        .map_err(|e| AppError::Other(e.to_string()))?;

    if enabled {
        // 添加到注册表
        Command::new("reg")
            .args([
                "add",
                r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
                "/v",
                "AgentFlow",
                "/t",
                "REG_SZ",
                "/d",
                &exe_path.to_string_lossy(),
                "/f",
            ])
            .output()
            .map_err(|e| AppError::Other(e.to_string()))?;
    } else {
        // 从注册表删除
        Command::new("reg")
            .args([
                "delete",
                r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
                "/v",
                "AgentFlow",
                "/f",
            ])
            .output()
            .ok(); // 忽略错误（可能不存在）
    }

    Ok(())
}

#[cfg(target_os = "macos")]
fn set_auto_start_macos(app: &AppHandle, enabled: bool) -> Result<(), AppError> {
    // macOS 使用 Login Items API
    // 简化实现，实际需要使用 Service Management framework
    log::warn!("macOS auto-start not fully implemented");
    Ok(())
}

#[cfg(target_os = "linux")]
fn set_auto_start_linux(app: &AppHandle, enabled: bool) -> Result<(), AppError> {
    let config_dir = dirs::config_dir()
        .ok_or_else(|| AppError::Other("Cannot find config directory".to_string()))?;

    let autostart_dir = config_dir.join("autostart");
    let desktop_file = autostart_dir.join("agentflow.desktop");

    if enabled {
        // 创建 autostart 目录
        std::fs::create_dir_all(&autostart_dir)?;

        // 获取可执行文件路径
        let exe_path = std::env::current_exe()
            .map_err(|e| AppError::Other(e.to_string()))?;

        // 创建 .desktop 文件
        let desktop_content = format!(
            r#"[Desktop Entry]
Type=Application
Name=AgentFlow
Exec={}
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
"#,
            exe_path.to_string_lossy()
        );

        std::fs::write(&desktop_file, desktop_content)?;
    } else {
        // 删除 .desktop 文件
        if desktop_file.exists() {
            std::fs::remove_file(&desktop_file)?;
        }
    }

    Ok(())
}

// ===== 资源监控相关 =====

/// 系统资源信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemResources {
    /// CPU 使用率 (0-100)
    pub cpu_usage: f64,
    /// 内存使用量 (bytes)
    pub memory_used: i64,
    /// 总内存 (bytes)
    pub memory_total: i64,
    /// 内存使用率 (0-100)
    pub memory_usage: f64,
    /// 存储使用量 (bytes)
    pub storage_used: i64,
    /// 存储总量 (bytes)
    pub storage_total: i64,
    /// 存储使用率 (0-100)
    pub storage_usage: f64,
    /// 应用数据目录大小 (bytes)
    pub app_data_size: i64,
    /// 采集时间
    pub timestamp: DateTime<Utc>,
}

/// 获取系统资源
#[tauri::command]
pub async fn get_system_resources(state: State<'_, AppState>) -> Result<SystemResources, AppError> {
    log::debug!("Getting system resources");

    // 获取 CPU 使用率（简化实现）
    let cpu_usage = get_cpu_usage();

    // 获取内存信息
    let (memory_used, memory_total) = get_memory_info();
    let memory_usage = if memory_total > 0 {
        (memory_used as f64 / memory_total as f64) * 100.0
    } else {
        0.0
    };

    // 获取存储信息
    let data_dir = state.get_data_dir();
    let (storage_used, storage_total) = get_storage_info(data_dir);
    let storage_usage = if storage_total > 0 {
        (storage_used as f64 / storage_total as f64) * 100.0
    } else {
        0.0
    };

    // 获取应用数据目录大小
    let app_data_size = get_directory_size(data_dir);

    Ok(SystemResources {
        cpu_usage,
        memory_used,
        memory_total,
        memory_usage,
        storage_used,
        storage_total,
        storage_usage,
        app_data_size,
        timestamp: Utc::now(),
    })
}

/// 获取 CPU 使用率
fn get_cpu_usage() -> f64 {
    let mut sys = System::new_with_specifics(
        RefreshKind::new().with_cpu(CpuRefreshKind::new().with_cpu_usage())
    );
    
    // 需要刷新两次才能获取准确的 CPU 使用率
    std::thread::sleep(std::time::Duration::from_millis(200));
    sys.refresh_cpu_usage();
    
    // 计算所有 CPU 核心的平均使用率
    let cpus = sys.cpus();
    if cpus.is_empty() {
        return 0.0;
    }
    
    let total_usage: f32 = cpus.iter().map(|cpu| cpu.cpu_usage()).sum();
    (total_usage / cpus.len() as f32) as f64
}

/// 获取内存信息
fn get_memory_info() -> (i64, i64) {
    let mut sys = System::new_with_specifics(
        RefreshKind::new().with_memory(MemoryRefreshKind::everything())
    );
    sys.refresh_memory();
    
    let used = sys.used_memory() as i64;
    let total = sys.total_memory() as i64;
    
    (used, total)
}

/// 获取存储信息
fn get_storage_info(path: &PathBuf) -> (i64, i64) {
    let disks = Disks::new_with_refreshed_list();
    
    // 找到包含指定路径的磁盘
    for disk in disks.iter() {
        let mount_point = disk.mount_point();
        if path.starts_with(mount_point) {
            let total = disk.total_space() as i64;
            let available = disk.available_space() as i64;
            let used = total - available;
            return (used, total);
        }
    }
    
    // 如果没找到，返回第一个磁盘的信息
    if let Some(disk) = disks.iter().next() {
        let total = disk.total_space() as i64;
        let available = disk.available_space() as i64;
        let used = total - available;
        return (used, total);
    }
    
    (0, 0)
}

/// 获取目录大小
fn get_directory_size(path: &PathBuf) -> i64 {
    let mut size: i64 = 0;

    if let Ok(entries) = std::fs::read_dir(path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Ok(metadata) = path.metadata() {
                    size += metadata.len() as i64;
                }
            } else if path.is_dir() {
                size += get_directory_size(&path);
            }
        }
    }

    size
}

// ===== 日志管理相关 =====

/// 日志文件信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogFileInfo {
    /// 文件名
    pub name: String,
    /// 文件路径
    pub path: String,
    /// 文件大小 (bytes)
    pub size: i64,
    /// 创建时间
    pub created_at: Option<String>,
    /// 修改时间
    pub modified_at: Option<String>,
}

/// 日志统计
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogStats {
    /// 日志文件列表
    pub files: Vec<LogFileInfo>,
    /// 总大小 (bytes)
    pub total_size: i64,
    /// 文件数量
    pub file_count: i32,
}

/// 获取日志统计
#[tauri::command]
pub async fn get_log_stats(state: State<'_, AppState>) -> Result<LogStats, AppError> {
    log::info!("Getting log stats");

    let log_dir = state.get_data_dir().join("logs");
    let mut files = Vec::new();
    let mut total_size: i64 = 0;

    if log_dir.exists() {
        if let Ok(entries) = std::fs::read_dir(&log_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() && path.extension().map(|e| e == "log").unwrap_or(false) {
                    if let Ok(metadata) = path.metadata() {
                        let size = metadata.len() as i64;
                        total_size += size;

                        files.push(LogFileInfo {
                            name: path.file_name()
                                .map(|n| n.to_string_lossy().to_string())
                                .unwrap_or_default(),
                            path: path.to_string_lossy().to_string(),
                            size,
                            created_at: metadata.created().ok()
                                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                                .map(|d| chrono::DateTime::from_timestamp(d.as_secs() as i64, 0)
                                    .map(|dt| dt.to_rfc3339()))
                                .flatten(),
                            modified_at: metadata.modified().ok()
                                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                                .map(|d| chrono::DateTime::from_timestamp(d.as_secs() as i64, 0)
                                    .map(|dt| dt.to_rfc3339()))
                                .flatten(),
                        });
                    }
                }
            }
        }
    }

    // 按修改时间排序（最新在前）
    files.sort_by(|a, b| b.modified_at.cmp(&a.modified_at));

    Ok(LogStats {
        file_count: files.len() as i32,
        files,
        total_size,
    })
}

/// 清理日志
#[tauri::command]
pub async fn clear_logs(
    state: State<'_, AppState>,
    keep_days: Option<i32>,
) -> Result<i32, AppError> {
    log::info!("Clearing logs, keep_days: {:?}", keep_days);

    let log_dir = state.get_data_dir().join("logs");
    let mut deleted_count = 0;

    if !log_dir.exists() {
        return Ok(0);
    }

    let keep_duration = keep_days
        .map(|d| chrono::Duration::days(d as i64))
        .unwrap_or(chrono::Duration::days(7));

    let cutoff_time = Utc::now() - keep_duration;

    if let Ok(entries) = std::fs::read_dir(&log_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() && path.extension().map(|e| e == "log").unwrap_or(false) {
                if let Ok(metadata) = path.metadata() {
                    if let Ok(modified) = metadata.modified() {
                        if let Ok(duration) = modified.duration_since(std::time::UNIX_EPOCH) {
                            let modified_time = chrono::DateTime::from_timestamp(
                                duration.as_secs() as i64,
                                0,
                            );

                            if let Some(mt) = modified_time {
                                if mt < cutoff_time {
                                    if std::fs::remove_file(&path).is_ok() {
                                        deleted_count += 1;
                                        log::info!("Deleted log file: {:?}", path);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(deleted_count)
}

/// 导出日志
#[tauri::command]
pub async fn export_logs(
    state: State<'_, AppState>,
    output_path: String,
) -> Result<String, AppError> {
    log::info!("Exporting logs to: {}", output_path);

    let log_dir = state.get_data_dir().join("logs");
    let output = PathBuf::from(&output_path);

    // 创建 ZIP 文件
    let file = std::fs::File::create(&output)?;
    let mut zip = zip::ZipWriter::new(file);

    let options = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    if log_dir.exists() {
        if let Ok(entries) = std::fs::read_dir(&log_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() {
                    if let Some(name) = path.file_name() {
                        let name_str = name.to_string_lossy();
                        if let Ok(content) = std::fs::read(&path) {
                            zip.start_file(name_str.to_string(), options)
                                .map_err(|e| AppError::Other(e.to_string()))?;
                            std::io::Write::write_all(&mut zip, &content)?;
                        }
                    }
                }
            }
        }
    }

    zip.finish().map_err(|e| AppError::Other(e.to_string()))?;

    Ok(output_path)
}

// ===== 存储空间管理 =====

/// 存储空间详情
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageDetails {
    /// 工作流数据大小
    pub workflows_size: i64,
    /// 执行记录大小
    pub executions_size: i64,
    /// 快照数据大小
    pub snapshots_size: i64,
    /// 缓存大小
    pub cache_size: i64,
    /// 日志大小
    pub logs_size: i64,
    /// 其他数据大小
    pub other_size: i64,
    /// 总大小
    pub total_size: i64,
}

/// 获取存储详情
#[tauri::command]
pub async fn get_storage_details(state: State<'_, AppState>) -> Result<StorageDetails, AppError> {
    log::info!("Getting storage details");

    let data_dir = state.get_data_dir();
    let cache_dir = &state.cache_dir;

    // 计算各类数据大小
    let db_path = state.get_db_path();
    let db_size = std::fs::metadata(&db_path)
        .map(|m| m.len() as i64)
        .unwrap_or(0);

    let logs_size = get_directory_size(&data_dir.join("logs"));
    let cache_size = get_directory_size(cache_dir);

    // 简化实现：数据库大小作为总数据大小
    // 实际需要按表统计
    let workflows_size = db_size / 3;
    let executions_size = db_size / 3;
    let snapshots_size = db_size / 3;

    let total_size = db_size + logs_size + cache_size;
    let other_size = total_size - workflows_size - executions_size - snapshots_size - cache_size - logs_size;

    Ok(StorageDetails {
        workflows_size,
        executions_size,
        snapshots_size,
        cache_size,
        logs_size,
        other_size: other_size.max(0),
        total_size,
    })
}

/// 清理缓存
#[tauri::command]
pub async fn clear_cache(state: State<'_, AppState>) -> Result<i64, AppError> {
    log::info!("Clearing cache");

    let cache_dir = &state.cache_dir;
    let size_before = get_directory_size(cache_dir);

    if cache_dir.exists() {
        // 删除缓存目录内容
        if let Ok(entries) = std::fs::read_dir(cache_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    std::fs::remove_dir_all(&path).ok();
                } else {
                    std::fs::remove_file(&path).ok();
                }
            }
        }
    }

    Ok(size_before)
}

// ===== lib.rs 需要的兼容函数 =====

/// 系统信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os: String,
    pub arch: String,
    pub hostname: String,
    pub cpu_count: usize,
    pub memory_total: i64,
}

/// 获取系统信息
#[tauri::command]
pub async fn get_system_info() -> Result<SystemInfo, AppError> {
    let mut sys = System::new_with_specifics(
        RefreshKind::new().with_memory(MemoryRefreshKind::everything())
    );
    sys.refresh_memory();
    
    Ok(SystemInfo {
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        hostname: System::host_name().unwrap_or_else(|| "unknown".to_string()),
        cpu_count: sys.cpus().len().max(1),
        memory_total: sys.total_memory() as i64,
    })
}

/// 获取自启动状态（兼容函数）
#[tauri::command]
pub async fn get_auto_launch_status() -> Result<AutoStartStatus, AppError> {
    get_auto_start_status().await
}

/// 设置自启动（兼容函数）
#[tauri::command]
pub async fn set_auto_launch(app: AppHandle, enabled: bool) -> Result<(), AppError> {
    set_auto_start(app, enabled).await
}

/// 获取存储信息（兼容函数）
#[tauri::command]
pub async fn get_storage_info(state: State<'_, AppState>) -> Result<StorageDetails, AppError> {
    get_storage_details(state).await
}

/// 清理日志（兼容函数）
#[tauri::command]
pub async fn cleanup_logs(
    state: State<'_, AppState>,
    keep_days: Option<i32>,
) -> Result<i32, AppError> {
    clear_logs(state, keep_days).await
}

/// 清理缓存（兼容函数）
#[tauri::command]
pub async fn cleanup_cache(state: State<'_, AppState>) -> Result<i64, AppError> {
    clear_cache(state).await
}

/// 显示主窗口
#[tauri::command]
pub async fn show_main_window(app: AppHandle) -> Result<(), AppError> {
    restore_from_tray(app).await
}

/// 隐藏主窗口
#[tauri::command]
pub async fn hide_main_window(app: AppHandle) -> Result<(), AppError> {
    minimize_to_tray(app).await
}

/// 退出应用
#[tauri::command]
pub async fn quit_app(app: AppHandle) -> Result<(), AppError> {
    log::info!("Quitting application");
    app.exit(0);
    Ok(())
}
