//! 工作流相关命令

use tauri::State;
use chrono::Utc;
use uuid::Uuid;

use crate::database::{self, Database};
use crate::error::AppError;
use crate::models::{Viewport, Workflow};

/// 创建工作流
#[tauri::command]
pub async fn create_workflow(
    db: State<'_, Database>,
    name: String,
    description: Option<String>,
) -> Result<Workflow, AppError> {
    let workflow = Workflow {
        id: Uuid::new_v4().to_string(),
        name,
        description,
        nodes: vec![],
        edges: vec![],
        viewport: Viewport::default(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        is_favorite: false,
        tags: vec![],
        folder_id: None,
    };

    database::create_workflow(&db, &workflow)?;
    log::info!("Created workflow: {}", workflow.id);

    Ok(workflow)
}

/// 获取工作流
#[tauri::command]
pub async fn get_workflow(
    db: State<'_, Database>,
    id: String,
) -> Result<Workflow, AppError> {
    database::get_workflow(&db, &id)
}

/// 列出工作流
#[tauri::command]
pub async fn list_workflows(
    db: State<'_, Database>,
) -> Result<Vec<Workflow>, AppError> {
    database::list_workflows(&db)
}

/// 更新工作流
#[tauri::command]
pub async fn update_workflow(
    db: State<'_, Database>,
    workflow: Workflow,
) -> Result<Workflow, AppError> {
    let mut updated = workflow;
    updated.updated_at = Utc::now();
    
    database::update_workflow(&db, &updated)?;
    log::info!("Updated workflow: {}", updated.id);

    Ok(updated)
}

/// 删除工作流
#[tauri::command]
pub async fn delete_workflow(
    db: State<'_, Database>,
    id: String,
) -> Result<(), AppError> {
    database::delete_workflow(&db, &id)?;
    log::info!("Deleted workflow: {}", id);
    Ok(())
}

/// 复制工作流
#[tauri::command]
pub async fn duplicate_workflow(
    db: State<'_, Database>,
    id: String,
) -> Result<Workflow, AppError> {
    let original = database::get_workflow(&db, &id)?;
    
    let duplicate = Workflow {
        id: Uuid::new_v4().to_string(),
        name: format!("{} (Copy)", original.name),
        description: original.description,
        nodes: original.nodes,
        edges: original.edges,
        viewport: original.viewport,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        is_favorite: false,
        tags: original.tags,
        folder_id: original.folder_id,
    };

    database::create_workflow(&db, &duplicate)?;
    log::info!("Duplicated workflow {} to {}", id, duplicate.id);

    Ok(duplicate)
}
