//! 数据模型定义

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// 工作流
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workflow {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub nodes: Vec<WorkflowNode>,
    pub edges: Vec<WorkflowEdge>,
    pub viewport: Viewport,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub is_favorite: bool,
    pub tags: Vec<String>,
    pub folder_id: Option<String>,
}

/// 工作流节点
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowNode {
    pub id: String,
    pub r#type: String,
    pub position: Position,
    pub data: serde_json::Value,
}

/// 节点位置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: f64,
    pub y: f64,
}

/// 工作流边
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowEdge {
    pub id: String,
    pub source: String,
    pub target: String,
    pub source_handle: Option<String>,
    pub target_handle: Option<String>,
}

/// 视口
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Viewport {
    pub x: f64,
    pub y: f64,
    pub zoom: f64,
}

impl Default for Viewport {
    fn default() -> Self {
        Self {
            x: 0.0,
            y: 0.0,
            zoom: 1.0,
        }
    }
}

/// 执行记录
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Execution {
    pub id: String,
    pub workflow_id: String,
    pub status: ExecutionStatus,
    pub inputs: serde_json::Value,
    pub outputs: Option<serde_json::Value>,
    pub error: Option<String>,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub duration_ms: Option<i64>,
    pub node_results: Vec<NodeResult>,
}

/// 执行状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ExecutionStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
}

/// 节点执行结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeResult {
    pub node_id: String,
    pub status: ExecutionStatus,
    pub inputs: serde_json::Value,
    pub outputs: Option<serde_json::Value>,
    pub error: Option<String>,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    pub duration_ms: Option<i64>,
}

/// 执行事件类型
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ExecutionEvent {
    /// 执行开始
    ExecutionStarted {
        execution_id: String,
        workflow_id: String,
        started_at: DateTime<Utc>,
    },
    /// 执行完成
    ExecutionCompleted {
        execution_id: String,
        workflow_id: String,
        outputs: serde_json::Value,
        duration_ms: i64,
        completed_at: DateTime<Utc>,
    },
    /// 执行失败
    ExecutionFailed {
        execution_id: String,
        workflow_id: String,
        error: String,
        failed_node_id: Option<String>,
        completed_at: DateTime<Utc>,
    },
    /// 执行取消
    ExecutionCancelled {
        execution_id: String,
        workflow_id: String,
        cancelled_at: DateTime<Utc>,
    },
    /// 节点开始
    NodeStarted {
        execution_id: String,
        node_id: String,
        node_type: String,
        started_at: DateTime<Utc>,
    },
    /// 节点完成
    NodeCompleted {
        execution_id: String,
        node_id: String,
        node_type: String,
        outputs: serde_json::Value,
        duration_ms: i64,
        completed_at: DateTime<Utc>,
    },
    /// 节点失败
    NodeFailed {
        execution_id: String,
        node_id: String,
        node_type: String,
        error: String,
        completed_at: DateTime<Utc>,
    },
    /// 执行进度
    ExecutionProgress {
        execution_id: String,
        completed_nodes: i32,
        total_nodes: i32,
        progress: f32,
    },
    /// 执行日志
    ExecutionLog {
        execution_id: String,
        node_id: Option<String>,
        level: String,
        message: String,
        timestamp: DateTime<Utc>,
    },
}

/// 执行状态查询结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionState {
    pub execution_id: String,
    pub workflow_id: String,
    pub status: ExecutionStatus,
    pub progress: f32,
    pub completed_nodes: i32,
    pub total_nodes: i32,
    pub current_node_id: Option<String>,
    pub started_at: DateTime<Utc>,
    pub elapsed_ms: i64,
}

/// 应用设置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub theme: String,
    pub language: String,
    pub ollama_url: String,
    pub auto_save: bool,
    pub auto_save_interval: i32,
    pub offline_mode: bool,
    pub default_model: Option<String>,
    pub api_keys: serde_json::Value,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            theme: "system".to_string(),
            language: "zh-CN".to_string(),
            ollama_url: "http://localhost:11434".to_string(),
            auto_save: true,
            auto_save_interval: 30,
            offline_mode: false,
            default_model: None,
            api_keys: serde_json::json!({}),
        }
    }
}

/// Ollama 模型信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaModel {
    pub name: String,
    pub model: String,
    pub size: i64,
    pub digest: String,
    pub modified_at: String,
}

/// Ollama 聊天请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatRequest {
    pub model: String,
    pub messages: Vec<ChatMessage>,
    pub stream: Option<bool>,
    pub options: Option<ChatOptions>,
}

/// 聊天消息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

/// 聊天选项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatOptions {
    pub temperature: Option<f64>,
    pub top_p: Option<f64>,
    pub top_k: Option<i32>,
    pub max_tokens: Option<i32>,
}

/// Ollama 聊天响应
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatResponse {
    pub model: String,
    pub message: ChatMessage,
    pub done: bool,
    pub total_duration: Option<i64>,
    pub eval_count: Option<i32>,
}

/// API Key 提供商
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ApiKeyProvider {
    OpenAI,
    Anthropic,
    Google,
    Azure,
    Ollama,
    Custom,
}

impl std::fmt::Display for ApiKeyProvider {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ApiKeyProvider::OpenAI => write!(f, "openai"),
            ApiKeyProvider::Anthropic => write!(f, "anthropic"),
            ApiKeyProvider::Google => write!(f, "google"),
            ApiKeyProvider::Azure => write!(f, "azure"),
            ApiKeyProvider::Ollama => write!(f, "ollama"),
            ApiKeyProvider::Custom => write!(f, "custom"),
        }
    }
}

/// API Key
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiKey {
    pub id: String,
    pub name: String,
    pub provider: String,
    /// 加密后的 API Key（不在前端显示）
    #[serde(skip_serializing)]
    pub encrypted_key: String,
    /// 加密 nonce
    #[serde(skip_serializing)]
    pub nonce: String,
    /// Key 提示（后4位）
    pub key_hint: Option<String>,
    /// 自定义 API 基础 URL
    pub base_url: Option<String>,
    /// 是否为默认 Key
    pub is_default: bool,
    /// 是否启用
    pub is_enabled: bool,
    /// 最后使用时间
    pub last_used_at: Option<DateTime<Utc>>,
    /// 使用次数
    pub usage_count: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// 创建 API Key 请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateApiKeyRequest {
    pub name: String,
    pub provider: String,
    /// 明文 API Key（传输后立即加密）
    pub api_key: String,
    pub base_url: Option<String>,
    pub is_default: Option<bool>,
}

/// API Key 列表项（不含敏感数据）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiKeyInfo {
    pub id: String,
    pub name: String,
    pub provider: String,
    pub key_hint: Option<String>,
    pub base_url: Option<String>,
    pub is_default: bool,
    pub is_enabled: bool,
    pub last_used_at: Option<DateTime<Utc>>,
    pub usage_count: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ===== 时间旅行调试 - 类型定义 =====

/// 节点执行状态
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum NodeStatus {
    /// 等待执行
    Pending,
    /// 执行中
    Running,
    /// 执行完成
    Completed,
    /// 执行失败
    Failed,
    /// 已跳过
    Skipped,
    /// 已暂停
    Paused,
}

/// 节点错误信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeError {
    /// 错误码
    pub code: Option<String>,
    /// 错误消息
    pub message: String,
    /// 错误堆栈
    pub stack: Option<String>,
    /// 额外详情
    pub details: Option<serde_json::Value>,
}

/// 节点日志条目
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeLogEntry {
    /// 日志级别
    pub level: String,
    /// 日志消息
    pub message: String,
    /// 时间戳
    pub timestamp: DateTime<Utc>,
    /// 附加数据
    pub data: Option<serde_json::Value>,
}

/// 节点元数据
/// 记录节点执行的额外信息，如 LLM 调用的 token 使用量等
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct NodeMetadata {
    /// LLM 节点: Token 使用量
    pub tokens_used: Option<i64>,
    /// LLM 节点: 使用的模型
    pub model: Option<String>,
    /// LLM 节点: 提示 Token
    pub prompt_tokens: Option<i64>,
    /// LLM 节点: 完成 Token
    pub completion_tokens: Option<i64>,
    /// HTTP 节点: 响应状态码
    pub http_status_code: Option<i32>,
    /// HTTP 节点: 请求 URL
    pub http_url: Option<String>,
    /// HTTP 节点: 请求方法
    pub http_method: Option<String>,
    /// 条件节点: 选择的分支
    pub condition_branch: Option<String>,
    /// 循环节点: 迭代次数
    pub loop_iterations: Option<i32>,
    /// 循环节点: 当前迭代索引
    pub current_iteration: Option<i32>,
    /// 重试次数
    pub retry_count: Option<i32>,
}

/// 节点快照
/// 
/// 记录单个节点在执行过程中某一时刻的完整状态快照，
/// 用于时间旅行调试功能的回溯和重放。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeSnapshot {
    /// 节点 ID
    pub node_id: String,
    /// 节点名称（显示名称）
    pub node_name: String,
    /// 节点类型 (如 "llm", "http", "condition" 等)
    pub node_type: String,
    /// 节点执行状态
    pub status: NodeStatus,
    
    // ===== 时间信息 =====
    
    /// 开始执行时间
    pub started_at: DateTime<Utc>,
    /// 完成时间
    pub completed_at: Option<DateTime<Utc>>,
    /// 执行耗时 (毫秒)
    pub duration_ms: i64,
    
    // ===== 数据快照 =====
    
    /// 节点输入数据
    pub inputs: serde_json::Value,
    /// 节点输出数据
    pub outputs: serde_json::Value,
    /// 解析后的配置（变量替换后）
    pub resolved_config: Option<serde_json::Value>,
    
    // ===== 错误信息 =====
    
    /// 错误信息（如果执行失败）
    pub error: Option<NodeError>,
    
    // ===== 元数据 =====
    
    /// 执行元数据
    pub metadata: Option<NodeMetadata>,
    
    // ===== 调试信息 =====
    
    /// 日志记录
    pub logs: Option<Vec<NodeLogEntry>>,
    /// 是否是断点
    pub is_breakpoint: Option<bool>,
}

/// 快照元数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SnapshotMetadata {
    /// 快照创建时间
    pub created_at: DateTime<Utc>,
    /// 快照版本
    pub version: String,
    /// 是否压缩存储
    pub compressed: Option<bool>,
    /// 压缩前大小 (bytes)
    pub original_size: Option<i64>,
    /// 压缩后大小 (bytes)
    pub compressed_size: Option<i64>,
    /// 快照来源 (web | desktop)
    pub source: String,
}

/// 执行摘要信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionSummary {
    /// 总节点数
    pub total_nodes: i32,
    /// 已完成节点数
    pub completed_nodes: i32,
    /// 失败节点数
    pub failed_nodes: i32,
    /// 跳过节点数
    pub skipped_nodes: i32,
    /// 总 Token 使用量
    pub total_tokens_used: Option<i64>,
    /// 预估成本 (美元)
    pub estimated_cost: Option<f64>,
}

/// 执行快照
/// 
/// 捕获整个工作流执行的完整状态快照，包含所有节点的执行详情，
/// 用于时间旅行调试功能的回溯和重放。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionSnapshot {
    /// 执行 ID
    pub execution_id: String,
    /// 工作流 ID
    pub workflow_id: String,
    /// 工作流名称
    pub workflow_name: Option<String>,
    /// 工作流版本
    pub workflow_version: Option<i32>,
    /// 执行状态
    pub status: ExecutionStatus,
    
    // ===== 时间信息 =====
    
    /// 开始时间
    pub started_at: DateTime<Utc>,
    /// 完成时间
    pub completed_at: Option<DateTime<Utc>>,
    /// 总执行耗时 (毫秒)
    pub duration_ms: Option<i64>,
    
    // ===== 节点快照 =====
    
    /// 所有节点的快照，按节点 ID 索引
    pub node_snapshots: std::collections::HashMap<String, NodeSnapshot>,
    /// 节点执行顺序
    pub execution_order: Vec<String>,
    /// 当前执行到的节点 ID
    pub current_node_id: Option<String>,
    
    // ===== 全局变量 =====
    
    /// 执行输入
    pub inputs: serde_json::Value,
    /// 执行输出
    pub outputs: serde_json::Value,
    /// 全局变量
    pub variables: serde_json::Value,
    
    // ===== 错误信息 =====
    
    /// 执行错误（如果失败）
    pub error: Option<SnapshotError>,
    
    // ===== 摘要和元数据 =====
    
    /// 执行摘要
    pub summary: ExecutionSummary,
    /// 快照元数据
    pub metadata: SnapshotMetadata,
}

/// 快照错误信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SnapshotError {
    /// 错误码
    pub code: Option<String>,
    /// 错误消息
    pub message: String,
    /// 失败的节点 ID
    pub node_id: Option<String>,
    /// 错误堆栈
    pub stack: Option<String>,
}

// ===== 时间线相关类型 =====

/// 时间线步骤
/// 用于在时间线 UI 中显示执行步骤
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineStep {
    /// 步骤索引
    pub index: i32,
    /// 节点 ID
    pub node_id: String,
    /// 节点名称
    pub node_name: String,
    /// 节点类型
    pub node_type: String,
    /// 节点图标
    pub node_icon: Option<String>,
    /// 步骤状态
    pub status: NodeStatus,
    /// 开始时间
    pub started_at: DateTime<Utc>,
    /// 完成时间
    pub completed_at: Option<DateTime<Utc>>,
    /// 耗时 (毫秒)
    pub duration_ms: i64,
    /// 简要描述
    pub description: Option<String>,
    /// 是否是当前选中步骤
    pub is_selected: Option<bool>,
    /// 是否有错误
    pub has_error: Option<bool>,
}

/// 时间线视图数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineView {
    /// 执行 ID
    pub execution_id: String,
    /// 执行状态
    pub status: ExecutionStatus,
    /// 开始时间
    pub started_at: DateTime<Utc>,
    /// 完成时间
    pub completed_at: Option<DateTime<Utc>>,
    /// 总耗时
    pub duration_ms: Option<i64>,
    /// 时间线步骤列表
    pub steps: Vec<TimelineStep>,
    /// 当前选中的步骤索引
    pub selected_step_index: Option<i32>,
}

// ===== 调试操作相关类型 =====

/// 重跑节点请求
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RerunNodeRequest {
    /// 执行 ID
    pub execution_id: String,
    /// 要重跑的节点 ID
    pub node_id: String,
    /// 新的输入（可选，不提供则使用原输入）
    pub new_inputs: Option<serde_json::Value>,
    /// 是否继续执行后续节点
    pub continue_execution: Option<bool>,
}

/// 重跑节点结果
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RerunNodeResult {
    /// 新的执行 ID
    pub new_execution_id: String,
    /// 节点快照
    pub node_snapshot: NodeSnapshot,
    /// 是否成功
    pub success: bool,
    /// 错误消息
    pub error: Option<String>,
}

/// 断点信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Breakpoint {
    /// 断点 ID
    pub id: String,
    /// 节点 ID
    pub node_id: String,
    /// 是否启用
    pub enabled: bool,
    /// 条件表达式（可选）
    pub condition: Option<String>,
    /// 创建时间
    pub created_at: DateTime<Utc>,
}

/// 调试会话状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DebugSession {
    /// 会话 ID
    pub session_id: String,
    /// 关联的执行 ID
    pub execution_id: String,
    /// 是否暂停
    pub is_paused: bool,
    /// 暂停在的节点 ID
    pub paused_at_node_id: Option<String>,
    /// 断点列表
    pub breakpoints: Vec<Breakpoint>,
    /// 会话开始时间
    pub started_at: DateTime<Utc>,
}

// ===== 快照存储相关类型 =====

/// 快照存储选项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SnapshotStorageOptions {
    /// 是否压缩
    pub compress: Option<bool>,
    /// 压缩级别 (1-9)
    pub compression_level: Option<i32>,
    /// 最大保留数量
    pub max_snapshots: Option<i32>,
    /// 最大保留天数
    pub max_age_days: Option<i32>,
    /// 排除敏感数据
    pub exclude_sensitive_data: Option<bool>,
    /// 敏感字段列表
    pub sensitive_fields: Option<Vec<String>>,
}

/// 快照列表项（不含完整节点数据）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SnapshotListItem {
    /// 执行 ID
    pub execution_id: String,
    /// 工作流 ID
    pub workflow_id: String,
    /// 工作流名称
    pub workflow_name: Option<String>,
    /// 执行状态
    pub status: ExecutionStatus,
    /// 开始时间
    pub started_at: DateTime<Utc>,
    /// 完成时间
    pub completed_at: Option<DateTime<Utc>>,
    /// 耗时
    pub duration_ms: Option<i64>,
    /// 摘要
    pub summary: ExecutionSummary,
}
