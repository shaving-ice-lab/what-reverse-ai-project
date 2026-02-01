//! 本地存储管理

use std::path::PathBuf;

use crate::error::{AppError, AppResult};

/// 存储路径类型
pub enum StorageType {
    Workflows,
    Executions,
    Models,
    Plugins,
    Cache,
    Temp,
}

impl StorageType {
    /// 获取子目录名称
    pub fn dir_name(&self) -> &str {
        match self {
            Self::Workflows => "workflows",
            Self::Executions => "executions",
            Self::Models => "models",
            Self::Plugins => "plugins",
            Self::Cache => "cache",
            Self::Temp => "temp",
        }
    }
}

/// 获取存储路径
pub fn get_storage_path(data_dir: &PathBuf, storage_type: StorageType) -> AppResult<PathBuf> {
    let path = data_dir.join(storage_type.dir_name());
    std::fs::create_dir_all(&path)?;
    Ok(path)
}

/// 保存文件
pub fn save_file(path: &PathBuf, content: &[u8]) -> AppResult<()> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(path, content)?;
    Ok(())
}

/// 读取文件
pub fn read_file(path: &PathBuf) -> AppResult<Vec<u8>> {
    std::fs::read(path).map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            AppError::NotFound(format!("File not found: {:?}", path))
        } else {
            AppError::Io(e)
        }
    })
}

/// 删除文件
pub fn delete_file(path: &PathBuf) -> AppResult<()> {
    if path.exists() {
        std::fs::remove_file(path)?;
    }
    Ok(())
}

/// 列出目录内容
pub fn list_dir(path: &PathBuf) -> AppResult<Vec<PathBuf>> {
    if !path.exists() {
        return Ok(vec![]);
    }

    let entries = std::fs::read_dir(path)?
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .collect();

    Ok(entries)
}

/// 计算文件大小
pub fn get_file_size(path: &PathBuf) -> AppResult<u64> {
    let metadata = std::fs::metadata(path)?;
    Ok(metadata.len())
}

/// 计算目录大小
pub fn get_dir_size(path: &PathBuf) -> AppResult<u64> {
    let mut size = 0u64;
    
    if path.is_dir() {
        for entry in std::fs::read_dir(path)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_file() {
                size += std::fs::metadata(&path)?.len();
            } else if path.is_dir() {
                size += get_dir_size(&path)?;
            }
        }
    }

    Ok(size)
}

/// 清理缓存
pub fn clear_cache(data_dir: &PathBuf) -> AppResult<()> {
    let cache_dir = get_storage_path(data_dir, StorageType::Cache)?;
    
    if cache_dir.exists() {
        std::fs::remove_dir_all(&cache_dir)?;
        std::fs::create_dir_all(&cache_dir)?;
    }

    Ok(())
}

/// 清理临时文件
pub fn clear_temp(data_dir: &PathBuf) -> AppResult<()> {
    let temp_dir = get_storage_path(data_dir, StorageType::Temp)?;
    
    if temp_dir.exists() {
        std::fs::remove_dir_all(&temp_dir)?;
        std::fs::create_dir_all(&temp_dir)?;
    }

    Ok(())
}
