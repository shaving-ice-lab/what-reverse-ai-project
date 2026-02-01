//! 执行相关命令
//!
//! 实现工作流执行引擎的 Tauri 命令：
//! - 执行工作流
//! - 执行事件推送
//! - 执行取消
//! - 执行状态查询

use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, State};
use uuid::Uuid;

use crate::database::Database;
use crate::error::AppError;
use crate::models::{Execution, ExecutionStatus, NodeResult, Workflow};
use crate::state::AppState;

// ===== 执行事件类型 =====

/// 执行事件，用于向前端推送执行状态更新
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum ExecutionEvent {
    /// 执行开始
    Started {
        execution_id: String,
        workflow_id: String,
    },
    /// 节点开始执行
    NodeStarted {
        execution_id: String,
        node_id: String,
        node_type: String,
    },
    /// 节点执行完成
    NodeCompleted {
        execution_id: String,
        node_id: String,
        outputs: serde_json::Value,
        duration_ms: i64,
    },
    /// 节点执行失败
    NodeFailed {
        execution_id: String,
        node_id: String,
        error: String,
    },
    /// 执行进度更新
    Progress {
        execution_id: String,
        completed_nodes: usize,
        total_nodes: usize,
        current_node: Option<String>,
    },
    /// 执行完成
    Completed {
        execution_id: String,
        outputs: serde_json::Value,
        duration_ms: i64,
    },
    /// 执行失败
    Failed {
        execution_id: String,
        error: String,
        failed_node: Option<String>,
    },
    /// 执行已取消
    Cancelled {
        execution_id: String,
    },
}

/// 执行事件通道名称
pub const EXECUTION_EVENT_CHANNEL: &str = "execution:event";

/// 发送执行事件到前端
fn emit_execution_event(app: &AppHandle, event: ExecutionEvent) {
    if let Err(e) = app.emit(EXECUTION_EVENT_CHANNEL, &event) {
        log::error!("Failed to emit execution event: {}", e);
    }
}

// ===== Tauri 命令 =====

/// 执行工作流
/// 
/// 启动工作流执行并返回执行 ID，执行过程通过事件推送
#[tauri::command]
pub async fn execute_workflow(
    app: AppHandle,
    db: State<'_, Database>,
    state: State<'_, AppState>,
    workflow_id: String,
    inputs: serde_json::Value,
) -> Result<Execution, AppError> {
    let execution_id = Uuid::new_v4().to_string();
    
    log::info!("Starting execution {} for workflow {}", execution_id, workflow_id);
    
    // 获取工作流
    let workflow = crate::database::get_workflow(&db, &workflow_id)?;
    
    // 注册执行上下文
    let ctx = state.get_execution_manager().register(
        execution_id.clone(),
        workflow_id.clone(),
    );
    
    // 创建执行记录
    let mut execution = Execution {
        id: execution_id.clone(),
        workflow_id: workflow_id.clone(),
        status: ExecutionStatus::Running,
        inputs: inputs.clone(),
        outputs: None,
        error: None,
        started_at: Utc::now(),
        completed_at: None,
        duration_ms: None,
        node_results: vec![],
    };
    
    // 保存初始执行记录
    save_execution(&db, &execution)?;
    
    // 发送执行开始事件
    emit_execution_event(&app, ExecutionEvent::Started {
        execution_id: execution_id.clone(),
        workflow_id: workflow_id.clone(),
    });
    
    // 异步执行工作流
    let app_clone = app.clone();
    let db_clone = db.inner().clone();
    let execution_id_clone = execution_id.clone();
    
    tokio::spawn(async move {
        let result = run_workflow_execution(
            &app_clone,
            &db_clone,
            &workflow,
            &inputs,
            &execution_id_clone,
            ctx.cancellation_token.clone(),
        ).await;
        
        // 更新执行状态
        let mut final_execution = get_execution_from_db(&db_clone, &execution_id_clone)
            .unwrap_or(execution);
        
        let now = Utc::now();
        final_execution.completed_at = Some(now);
        final_execution.duration_ms = Some(
            (now - final_execution.started_at).num_milliseconds()
        );
        
        match result {
            Ok(outputs) => {
                final_execution.status = ExecutionStatus::Completed;
                final_execution.outputs = Some(outputs.clone());
                
                emit_execution_event(&app_clone, ExecutionEvent::Completed {
                    execution_id: execution_id_clone.clone(),
                    outputs,
                    duration_ms: final_execution.duration_ms.unwrap_or(0),
                });
            }
            Err(e) => {
                if ctx.cancellation_token.is_cancelled() {
                    final_execution.status = ExecutionStatus::Cancelled;
                    emit_execution_event(&app_clone, ExecutionEvent::Cancelled {
                        execution_id: execution_id_clone.clone(),
                    });
                } else {
                    final_execution.status = ExecutionStatus::Failed;
                    final_execution.error = Some(e.to_string());
                    emit_execution_event(&app_clone, ExecutionEvent::Failed {
                        execution_id: execution_id_clone.clone(),
                        error: e.to_string(),
                        failed_node: None,
                    });
                }
            }
        }
        
        // 保存最终执行记录
        let _ = save_execution(&db_clone, &final_execution);
        
        // 从执行管理器中移除
        if let Ok(state) = app_clone.try_state::<AppState>() {
            state.get_execution_manager().remove(&execution_id_clone);
        }
    });
    
    Ok(execution)
}

/// 执行工作流的核心逻辑
async fn run_workflow_execution(
    app: &AppHandle,
    db: &Database,
    workflow: &Workflow,
    inputs: &serde_json::Value,
    execution_id: &str,
    cancellation_token: tokio_util::sync::CancellationToken,
) -> Result<serde_json::Value, AppError> {
    let total_nodes = workflow.nodes.len();
    let mut completed_nodes = 0;
    let mut node_outputs: std::collections::HashMap<String, serde_json::Value> = std::collections::HashMap::new();
    
    // 将输入存储为 start 节点的输出
    if let Some(start_node) = workflow.nodes.iter().find(|n| n.r#type == "start") {
        node_outputs.insert(start_node.id.clone(), inputs.clone());
    }
    
    // 按拓扑顺序执行节点
    let execution_order = get_execution_order(workflow);
    
    for node_id in execution_order {
        // 检查是否已取消
        if cancellation_token.is_cancelled() {
            return Err(AppError::Execution("Execution cancelled".to_string()));
        }
        
        let node = workflow.nodes.iter().find(|n| n.id == node_id);
        let node = match node {
            Some(n) => n,
            None => continue,
        };
        
        // 跳过 start 节点
        if node.r#type == "start" {
            completed_nodes += 1;
            continue;
        }
        
        // 发送节点开始事件
        emit_execution_event(app, ExecutionEvent::NodeStarted {
            execution_id: execution_id.to_string(),
            node_id: node_id.clone(),
            node_type: node.r#type.clone(),
        });
        
        let node_start = Utc::now();
        
        // 收集节点输入
        let node_inputs = collect_node_inputs(workflow, &node_id, &node_outputs);
        
        // 执行节点
        let result = execute_node(app, node, &node_inputs, &cancellation_token).await;
        
        let node_end = Utc::now();
        let node_duration = (node_end - node_start).num_milliseconds();
        
        match result {
            Ok(outputs) => {
                node_outputs.insert(node_id.clone(), outputs.clone());
                
                // 发送节点完成事件
                emit_execution_event(app, ExecutionEvent::NodeCompleted {
                    execution_id: execution_id.to_string(),
                    node_id: node_id.clone(),
                    outputs: outputs.clone(),
                    duration_ms: node_duration,
                });
                
                completed_nodes += 1;
                
                // 发送进度更新
                emit_execution_event(app, ExecutionEvent::Progress {
                    execution_id: execution_id.to_string(),
                    completed_nodes,
                    total_nodes,
                    current_node: Some(node_id.clone()),
                });
            }
            Err(e) => {
                // 发送节点失败事件
                emit_execution_event(app, ExecutionEvent::NodeFailed {
                    execution_id: execution_id.to_string(),
                    node_id: node_id.clone(),
                    error: e.to_string(),
                });
                
                return Err(e);
            }
        }
    }
    
    // 获取最终输出（从 end 节点）
    let final_output = workflow.nodes.iter()
        .find(|n| n.r#type == "end")
        .and_then(|n| node_outputs.get(&n.id).cloned())
        .unwrap_or(serde_json::json!({}));
    
    Ok(final_output)
}

/// 获取节点执行顺序（拓扑排序）
fn get_execution_order(workflow: &Workflow) -> Vec<String> {
    use std::collections::{HashMap, HashSet, VecDeque};
    
    let mut in_degree: HashMap<String, usize> = HashMap::new();
    let mut adjacency: HashMap<String, Vec<String>> = HashMap::new();
    
    // 初始化
    for node in &workflow.nodes {
        in_degree.insert(node.id.clone(), 0);
        adjacency.insert(node.id.clone(), vec![]);
    }
    
    // 构建图
    for edge in &workflow.edges {
        if let Some(targets) = adjacency.get_mut(&edge.source) {
            targets.push(edge.target.clone());
        }
        if let Some(degree) = in_degree.get_mut(&edge.target) {
            *degree += 1;
        }
    }
    
    // Kahn's algorithm
    let mut queue: VecDeque<String> = in_degree.iter()
        .filter(|(_, &deg)| deg == 0)
        .map(|(id, _)| id.clone())
        .collect();
    
    let mut result = vec![];
    
    while let Some(node_id) = queue.pop_front() {
        result.push(node_id.clone());
        
        if let Some(targets) = adjacency.get(&node_id) {
            for target in targets {
                if let Some(degree) = in_degree.get_mut(target) {
                    *degree -= 1;
                    if *degree == 0 {
                        queue.push_back(target.clone());
                    }
                }
            }
        }
    }
    
    result
}

/// 收集节点输入
fn collect_node_inputs(
    workflow: &Workflow,
    node_id: &str,
    node_outputs: &std::collections::HashMap<String, serde_json::Value>,
) -> serde_json::Value {
    let mut inputs = serde_json::Map::new();
    
    // 找到所有指向该节点的边
    for edge in &workflow.edges {
        if edge.target == node_id {
            if let Some(output) = node_outputs.get(&edge.source) {
                // 使用 source_handle 作为键，如果没有则使用 source 节点 ID
                let key = edge.source_handle.clone().unwrap_or_else(|| edge.source.clone());
                inputs.insert(key, output.clone());
            }
        }
    }
    
    serde_json::Value::Object(inputs)
}

/// 执行单个节点
async fn execute_node(
    app: &AppHandle,
    node: &crate::models::WorkflowNode,
    inputs: &serde_json::Value,
    cancellation_token: &tokio_util::sync::CancellationToken,
) -> Result<serde_json::Value, AppError> {
    // 检查取消
    if cancellation_token.is_cancelled() {
        return Err(AppError::Execution("Execution cancelled".to_string()));
    }
    
    match node.r#type.as_str() {
        "start" => {
            // Start 节点直接传递输入
            Ok(inputs.clone())
        }
        "end" => {
            // End 节点收集所有输入作为输出
            Ok(inputs.clone())
        }
        "llm" => {
            // LLM 节点
            execute_llm_node(app, node, inputs).await
        }
        "http" => {
            // HTTP 节点
            execute_http_node(node, inputs).await
        }
        "template" => {
            // 模板节点
            execute_template_node(node, inputs)
        }
        "condition" => {
            // 条件节点
            execute_condition_node(node, inputs)
        }
        "variable" => {
            // 变量节点
            execute_variable_node(node, inputs)
        }
        "code" => {
            // 代码节点（简化实现）
            execute_code_node(node, inputs)
        }
        _ => {
            // 未知节点类型，直接传递输入
            log::warn!("Unknown node type: {}", node.r#type);
            Ok(inputs.clone())
        }
    }
}

/// 执行 LLM 节点
async fn execute_llm_node(
    app: &AppHandle,
    node: &crate::models::WorkflowNode,
    inputs: &serde_json::Value,
) -> Result<serde_json::Value, AppError> {
    let config = &node.data;
    
    let model = config.get("model")
        .and_then(|v| v.as_str())
        .unwrap_or("gpt-4o-mini");
    
    let system_prompt = config.get("systemPrompt")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    
    let user_prompt = config.get("userPrompt")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    
    // 替换提示词中的变量
    let processed_prompt = replace_variables(user_prompt, inputs);
    
    // 判断是否使用本地模型（Ollama）
    if model.starts_with("ollama:") || model.contains("llama") || model.contains("mistral") {
        // 使用 Ollama
        let ollama_model = model.trim_start_matches("ollama:");
        
        if let Ok(state) = app.try_state::<AppState>() {
            let ollama_url = state.get_ollama_url();
            let client = crate::ollama::OllamaClient::new(&ollama_url);
            
            let response = client.chat(
                ollama_model,
                &[
                    crate::models::ChatMessage {
                        role: "system".to_string(),
                        content: system_prompt.to_string(),
                    },
                    crate::models::ChatMessage {
                        role: "user".to_string(),
                        content: processed_prompt,
                    },
                ],
                None,
            ).await?;
            
            return Ok(serde_json::json!({
                "text": response.message.content,
                "model": ollama_model,
            }));
        }
    }
    
    // 云端 API（需要 API Key）
    // 这里简化处理，返回模拟结果
    // 实际实现需要调用相应的 API
    Ok(serde_json::json!({
        "text": format!("[LLM Response for: {}]", processed_prompt),
        "model": model,
    }))
}

/// 执行 HTTP 节点
async fn execute_http_node(
    node: &crate::models::WorkflowNode,
    inputs: &serde_json::Value,
) -> Result<serde_json::Value, AppError> {
    let config = &node.data;
    
    let url = config.get("url")
        .and_then(|v| v.as_str())
        .ok_or_else(|| AppError::Execution("HTTP node missing url".to_string()))?;
    
    let method = config.get("method")
        .and_then(|v| v.as_str())
        .unwrap_or("GET");
    
    // 替换 URL 中的变量
    let processed_url = replace_variables(url, inputs);
    
    let client = reqwest::Client::new();
    
    let request = match method.to_uppercase().as_str() {
        "POST" => {
            let body = config.get("body").cloned().unwrap_or(serde_json::json!({}));
            client.post(&processed_url).json(&body)
        }
        "PUT" => {
            let body = config.get("body").cloned().unwrap_or(serde_json::json!({}));
            client.put(&processed_url).json(&body)
        }
        "DELETE" => client.delete(&processed_url),
        _ => client.get(&processed_url),
    };
    
    // 添加 headers
    let mut request = request;
    if let Some(headers) = config.get("headers").and_then(|v| v.as_object()) {
        for (key, value) in headers {
            if let Some(v) = value.as_str() {
                request = request.header(key.as_str(), v);
            }
        }
    }
    
    let response = request.send().await
        .map_err(|e| AppError::Execution(format!("HTTP request failed: {}", e)))?;
    
    let status = response.status().as_u16();
    let body: serde_json::Value = response.json().await
        .unwrap_or(serde_json::json!(null));
    
    Ok(serde_json::json!({
        "status": status,
        "body": body,
    }))
}

/// 执行模板节点
fn execute_template_node(
    node: &crate::models::WorkflowNode,
    inputs: &serde_json::Value,
) -> Result<serde_json::Value, AppError> {
    let config = &node.data;
    
    let template = config.get("template")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    
    let result = replace_variables(template, inputs);
    
    Ok(serde_json::json!({
        "text": result,
    }))
}

/// 执行条件节点
fn execute_condition_node(
    node: &crate::models::WorkflowNode,
    inputs: &serde_json::Value,
) -> Result<serde_json::Value, AppError> {
    let config = &node.data;
    
    let field = config.get("field")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    
    let operator = config.get("operator")
        .and_then(|v| v.as_str())
        .unwrap_or("equals");
    
    let value = config.get("value").cloned().unwrap_or(serde_json::json!(null));
    
    // 获取要比较的值
    let actual_value = get_nested_value(inputs, field);
    
    // 执行比较
    let result = match operator {
        "equals" => actual_value == value,
        "notEquals" => actual_value != value,
        "contains" => {
            actual_value.as_str()
                .map(|s| s.contains(value.as_str().unwrap_or("")))
                .unwrap_or(false)
        }
        "greaterThan" => {
            actual_value.as_f64().unwrap_or(0.0) > value.as_f64().unwrap_or(0.0)
        }
        "lessThan" => {
            actual_value.as_f64().unwrap_or(0.0) < value.as_f64().unwrap_or(0.0)
        }
        "isEmpty" => {
            actual_value.is_null() || actual_value.as_str().map(|s| s.is_empty()).unwrap_or(false)
        }
        "isNotEmpty" => {
            !actual_value.is_null() && !actual_value.as_str().map(|s| s.is_empty()).unwrap_or(true)
        }
        _ => false,
    };
    
    Ok(serde_json::json!({
        "result": result,
        "branch": if result { "true" } else { "false" },
    }))
}

/// 执行变量节点
fn execute_variable_node(
    node: &crate::models::WorkflowNode,
    inputs: &serde_json::Value,
) -> Result<serde_json::Value, AppError> {
    let config = &node.data;
    
    // 获取变量定义
    let variables = config.get("variables")
        .and_then(|v| v.as_object())
        .cloned()
        .unwrap_or_default();
    
    let mut result = serde_json::Map::new();
    
    for (key, value) in variables {
        let processed_value = if let Some(s) = value.as_str() {
            serde_json::Value::String(replace_variables(s, inputs))
        } else {
            value
        };
        result.insert(key, processed_value);
    }
    
    Ok(serde_json::Value::Object(result))
}

/// 执行代码节点（简化实现）
fn execute_code_node(
    node: &crate::models::WorkflowNode,
    inputs: &serde_json::Value,
) -> Result<serde_json::Value, AppError> {
    let config = &node.data;
    
    // 简化实现：代码节点暂时只返回输入
    // 完整实现需要嵌入 JavaScript 运行时
    log::info!("Code node execution (simplified): {:?}", config);
    
    Ok(inputs.clone())
}

/// 替换字符串中的变量
fn replace_variables(template: &str, inputs: &serde_json::Value) -> String {
    let mut result = template.to_string();
    
    // 匹配 {{variable}} 或 {{node.field}} 格式
    let re = regex::Regex::new(r"\{\{([^}]+)\}\}").unwrap();
    
    for cap in re.captures_iter(template) {
        let full_match = &cap[0];
        let var_path = cap[1].trim();
        
        let value = get_nested_value(inputs, var_path);
        let replacement = match value {
            serde_json::Value::String(s) => s,
            serde_json::Value::Null => "".to_string(),
            v => v.to_string(),
        };
        
        result = result.replace(full_match, &replacement);
    }
    
    result
}

/// 获取嵌套 JSON 值
fn get_nested_value(json: &serde_json::Value, path: &str) -> serde_json::Value {
    let parts: Vec<&str> = path.split('.').collect();
    let mut current = json.clone();
    
    for part in parts {
        current = match &current {
            serde_json::Value::Object(map) => {
                map.get(part).cloned().unwrap_or(serde_json::Value::Null)
            }
            serde_json::Value::Array(arr) => {
                if let Ok(index) = part.parse::<usize>() {
                    arr.get(index).cloned().unwrap_or(serde_json::Value::Null)
                } else {
                    serde_json::Value::Null
                }
            }
            _ => serde_json::Value::Null,
        };
    }
    
    current
}

// ===== 数据库操作 =====

/// 保存执行记录
fn save_execution(db: &Database, execution: &Execution) -> Result<(), AppError> {
    let conn = db.get_conn();
    
    conn.execute(
        "INSERT OR REPLACE INTO executions (id, workflow_id, status, inputs, outputs, error, started_at, completed_at, duration_ms, node_results)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        rusqlite::params![
            execution.id,
            execution.workflow_id,
            serde_json::to_string(&execution.status)?,
            serde_json::to_string(&execution.inputs)?,
            execution.outputs.as_ref().map(|v| serde_json::to_string(v).ok()).flatten(),
            execution.error,
            execution.started_at.to_rfc3339(),
            execution.completed_at.map(|dt| dt.to_rfc3339()),
            execution.duration_ms,
            serde_json::to_string(&execution.node_results)?,
        ],
    )?;
    
    Ok(())
}

/// 从数据库获取执行记录
fn get_execution_from_db(db: &Database, id: &str) -> Result<Execution, AppError> {
    let conn = db.get_conn();
    
    let execution = conn.query_row(
        "SELECT id, workflow_id, status, inputs, outputs, error, started_at, completed_at, duration_ms, node_results
         FROM executions WHERE id = ?",
        [id],
        |row| {
            Ok(Execution {
                id: row.get(0)?,
                workflow_id: row.get(1)?,
                status: serde_json::from_str(&row.get::<_, String>(2)?).unwrap_or(ExecutionStatus::Failed),
                inputs: serde_json::from_str(&row.get::<_, String>(3)?).unwrap_or(serde_json::json!({})),
                outputs: row.get::<_, Option<String>>(4)?
                    .and_then(|s| serde_json::from_str(&s).ok()),
                error: row.get(5)?,
                started_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?)
                    .map(|dt| dt.with_timezone(&chrono::Utc))
                    .unwrap_or_else(|_| chrono::Utc::now()),
                completed_at: row.get::<_, Option<String>>(7)?
                    .and_then(|s| chrono::DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&chrono::Utc)),
                duration_ms: row.get(8)?,
                node_results: row.get::<_, Option<String>>(9)?
                    .and_then(|s| serde_json::from_str(&s).ok())
                    .unwrap_or_default(),
            })
        },
    ).map_err(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => AppError::NotFound(format!("Execution not found: {}", id)),
        _ => AppError::Database(e),
    })?;
    
    Ok(execution)
}

// ===== 其他命令 =====

/// 停止执行
#[tauri::command]
pub async fn stop_execution(
    app: AppHandle,
    db: State<'_, Database>,
    state: State<'_, AppState>,
    execution_id: String,
) -> Result<(), AppError> {
    log::info!("Stopping execution: {}", execution_id);
    
    // 尝试取消执行
    let cancelled = state.get_execution_manager().cancel(&execution_id);
    
    if cancelled {
        // 更新数据库状态
        let mut execution = get_execution_from_db(&db, &execution_id)?;
        execution.status = ExecutionStatus::Cancelled;
        execution.completed_at = Some(Utc::now());
        if execution.started_at < chrono::Utc::now() {
            execution.duration_ms = Some((Utc::now() - execution.started_at).num_milliseconds());
        }
        save_execution(&db, &execution)?;
        
        // 发送取消事件
        emit_execution_event(&app, ExecutionEvent::Cancelled {
            execution_id: execution_id.clone(),
        });
        
        Ok(())
    } else {
        Err(AppError::NotFound(format!("Execution not found or already completed: {}", execution_id)))
    }
}

/// 获取执行记录
#[tauri::command]
pub async fn get_execution(
    db: State<'_, Database>,
    state: State<'_, AppState>,
    execution_id: String,
) -> Result<ExecutionInfo, AppError> {
    log::info!("Getting execution: {}", execution_id);
    
    let execution = get_execution_from_db(&db, &execution_id)?;
    
    // 检查是否仍在运行
    let is_running = state.get_execution_manager().get(&execution_id).is_some();
    
    Ok(ExecutionInfo {
        execution,
        is_running,
    })
}

/// 执行信息（包含运行状态）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionInfo {
    pub execution: Execution,
    pub is_running: bool,
}

/// 列出执行记录
#[tauri::command]
pub async fn list_executions(
    db: State<'_, Database>,
    state: State<'_, AppState>,
    workflow_id: Option<String>,
    limit: Option<i32>,
) -> Result<Vec<ExecutionInfo>, AppError> {
    log::info!("Listing executions for workflow: {:?}", workflow_id);
    
    let conn = db.get_conn();
    let limit = limit.unwrap_or(50);
    
    let query = if workflow_id.is_some() {
        "SELECT id, workflow_id, status, inputs, outputs, error, started_at, completed_at, duration_ms, node_results
         FROM executions WHERE workflow_id = ? ORDER BY started_at DESC LIMIT ?"
    } else {
        "SELECT id, workflow_id, status, inputs, outputs, error, started_at, completed_at, duration_ms, node_results
         FROM executions ORDER BY started_at DESC LIMIT ?"
    };
    
    let mut stmt = conn.prepare(query)?;
    
    let rows = if let Some(wf_id) = workflow_id {
        stmt.query_map(rusqlite::params![wf_id, limit], map_execution_row)?
    } else {
        stmt.query_map(rusqlite::params![limit], map_execution_row)?
    };
    
    let running_ids = state.get_execution_manager().list_running();
    
    let executions: Vec<ExecutionInfo> = rows
        .filter_map(|r| r.ok())
        .map(|execution| ExecutionInfo {
            is_running: running_ids.contains(&execution.id),
            execution,
        })
        .collect();
    
    Ok(executions)
}

/// 映射执行记录行
fn map_execution_row(row: &rusqlite::Row) -> rusqlite::Result<Execution> {
    Ok(Execution {
        id: row.get(0)?,
        workflow_id: row.get(1)?,
        status: serde_json::from_str(&row.get::<_, String>(2)?).unwrap_or(ExecutionStatus::Failed),
        inputs: serde_json::from_str(&row.get::<_, String>(3)?).unwrap_or(serde_json::json!({})),
        outputs: row.get::<_, Option<String>>(4)?
            .and_then(|s| serde_json::from_str(&s).ok()),
        error: row.get(5)?,
        started_at: chrono::DateTime::parse_from_rfc3339(&row.get::<_, String>(6)?)
            .map(|dt| dt.with_timezone(&chrono::Utc))
            .unwrap_or_else(|_| chrono::Utc::now()),
        completed_at: row.get::<_, Option<String>>(7)?
            .and_then(|s| chrono::DateTime::parse_from_rfc3339(&s).ok())
            .map(|dt| dt.with_timezone(&chrono::Utc)),
        duration_ms: row.get(8)?,
        node_results: row.get::<_, Option<String>>(9)?
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default(),
    })
}

/// 获取运行中的执行列表
#[tauri::command]
pub async fn list_running_executions(
    state: State<'_, AppState>,
) -> Result<Vec<String>, AppError> {
    Ok(state.get_execution_manager().list_running())
}

/// 获取执行数量统计
#[tauri::command]
pub async fn get_execution_stats(
    db: State<'_, Database>,
    state: State<'_, AppState>,
) -> Result<ExecutionStats, AppError> {
    let conn = db.get_conn();
    
    let total: i64 = conn.query_row(
        "SELECT COUNT(*) FROM executions",
        [],
        |row| row.get(0),
    )?;
    
    let completed: i64 = conn.query_row(
        "SELECT COUNT(*) FROM executions WHERE status = ?",
        [serde_json::to_string(&ExecutionStatus::Completed)?],
        |row| row.get(0),
    )?;
    
    let failed: i64 = conn.query_row(
        "SELECT COUNT(*) FROM executions WHERE status = ?",
        [serde_json::to_string(&ExecutionStatus::Failed)?],
        |row| row.get(0),
    )?;
    
    let running = state.get_execution_manager().count() as i64;
    
    Ok(ExecutionStats {
        total,
        completed,
        failed,
        running,
    })
}

/// 执行统计
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionStats {
    pub total: i64,
    pub completed: i64,
    pub failed: i64,
    pub running: i64,
}
