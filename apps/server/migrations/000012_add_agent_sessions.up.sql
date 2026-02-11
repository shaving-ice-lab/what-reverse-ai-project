-- Agent Sessions 持久化
-- 版本: 000012
-- 创建时间: 2026-02-11
-- 功能: 存储 Agent 对话会话（消息历史、工具调用记录、待确认操作）

CREATE TABLE IF NOT EXISTS what_reverse_agent_sessions (
    id              CHAR(36)        NOT NULL PRIMARY KEY,
    workspace_id    CHAR(36)        NOT NULL,
    user_id         CHAR(36)        NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'running' COMMENT 'running | paused | completed | failed',
    messages        JSON            NULL COMMENT 'Array of AgentMessageEntry',
    tool_calls      JSON            NULL COMMENT 'Array of AgentToolCallRecord',
    pending_action  JSON            NULL COMMENT 'PendingAction or null',
    created_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    INDEX idx_agent_sessions_workspace (workspace_id),
    INDEX idx_agent_sessions_user (user_id),
    INDEX idx_agent_sessions_status (status),
    INDEX idx_agent_sessions_updated (updated_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
