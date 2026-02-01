/**
 * 自动更新模块
 * 
 * 功能：
 * - 检查更新
 * - 下载更新
 * - 安装更新
 * - 更新状态管理
 */

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Runtime};
use tauri_plugin_updater::{Update, UpdaterExt};
use log::{info, warn, error};

/// 更新信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateInfo {
    /// 当前版本
    pub current_version: String,
    /// 最新版本
    pub latest_version: String,
    /// 发布日期
    pub date: Option<String>,
    /// 更新说明
    pub body: Option<String>,
    /// 是否有可用更新
    pub available: bool,
}

/// 更新进度
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProgress {
    /// 已下载字节数
    pub downloaded: u64,
    /// 总字节数
    pub total: Option<u64>,
    /// 进度百分比 (0-100)
    pub percent: f64,
}

/// 更新状态
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum UpdateStatus {
    Idle,
    Checking,
    Available,
    NotAvailable,
    Downloading,
    Downloaded,
    Installing,
    Error,
}

/// 检查更新
#[tauri::command]
pub async fn check_update<R: Runtime>(app: AppHandle<R>) -> Result<UpdateInfo, String> {
    info!("Checking for updates...");
    
    let current_version = app.package_info().version.to_string();
    
    // 获取更新器
    let updater = match app.updater_builder().build() {
        Ok(u) => u,
        Err(e) => {
            warn!("Failed to build updater: {}", e);
            return Ok(UpdateInfo {
                current_version,
                latest_version: String::new(),
                date: None,
                body: None,
                available: false,
            });
        }
    };
    
    // 检查更新
    match updater.check().await {
        Ok(Some(update)) => {
            info!("Update available: {} -> {}", current_version, update.version);
            Ok(UpdateInfo {
                current_version,
                latest_version: update.version.clone(),
                date: update.date.map(|d| d.to_string()),
                body: update.body.clone(),
                available: true,
            })
        }
        Ok(None) => {
            info!("No update available, current version: {}", current_version);
            Ok(UpdateInfo {
                current_version: current_version.clone(),
                latest_version: current_version,
                date: None,
                body: None,
                available: false,
            })
        }
        Err(e) => {
            error!("Failed to check for updates: {}", e);
            Err(format!("检查更新失败: {}", e))
        }
    }
}

/// 下载并安装更新
#[tauri::command]
pub async fn download_and_install_update<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    info!("Starting update download and install...");
    
    // 获取更新器
    let updater = app.updater_builder()
        .build()
        .map_err(|e| format!("构建更新器失败: {}", e))?;
    
    // 检查更新
    let update = match updater.check().await {
        Ok(Some(update)) => update,
        Ok(None) => return Err("没有可用的更新".to_string()),
        Err(e) => return Err(format!("检查更新失败: {}", e)),
    };
    
    // 发送下载开始事件
    let _ = app.emit("update-status", UpdateStatus::Downloading);
    
    // 下载更新
    let app_clone = app.clone();
    let downloaded = update.download(
        move |chunk_length, content_length| {
            let progress = UpdateProgress {
                downloaded: chunk_length as u64,
                total: content_length.map(|l| l as u64),
                percent: content_length
                    .map(|total| (chunk_length as f64 / total as f64) * 100.0)
                    .unwrap_or(0.0),
            };
            let _ = app_clone.emit("update-progress", progress);
        },
        || {
            info!("Download finished");
        },
    ).await;
    
    match downloaded {
        Ok(bytes) => {
            info!("Downloaded {} bytes, installing...", bytes.len());
            
            // 发送安装中事件
            let _ = app.emit("update-status", UpdateStatus::Installing);
            
            // 安装更新（这会重启应用）
            if let Err(e) = update.install(bytes) {
                error!("Failed to install update: {}", e);
                let _ = app.emit("update-status", UpdateStatus::Error);
                return Err(format!("安装更新失败: {}", e));
            }
            
            Ok(())
        }
        Err(e) => {
            error!("Failed to download update: {}", e);
            let _ = app.emit("update-status", UpdateStatus::Error);
            Err(format!("下载更新失败: {}", e))
        }
    }
}

/// 获取当前应用版本
#[tauri::command]
pub fn get_app_version<R: Runtime>(app: AppHandle<R>) -> String {
    app.package_info().version.to_string()
}

/// 获取应用信息
#[tauri::command]
pub fn get_app_info<R: Runtime>(app: AppHandle<R>) -> AppInfo {
    let pkg = app.package_info();
    AppInfo {
        name: pkg.name.to_string(),
        version: pkg.version.to_string(),
        authors: pkg.authors.to_string(),
        description: pkg.description.to_string(),
    }
}

/// 应用信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppInfo {
    pub name: String,
    pub version: String,
    pub authors: String,
    pub description: String,
}
