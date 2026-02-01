-- API Keys 表
-- 用于安全存储各种 LLM 提供商的 API 密钥

-- API Keys 表
CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY NOT NULL,
    -- 显示名称，如 "我的 OpenAI Key"
    name TEXT NOT NULL,
    -- 提供商: openai, anthropic, google, azure, ollama, custom
    provider TEXT NOT NULL,
    -- 加密后的 API Key
    encrypted_key TEXT NOT NULL,
    -- 加密使用的 nonce (用于 AES-GCM)
    nonce TEXT NOT NULL,
    -- API Key 的提示（后4位），用于显示
    key_hint TEXT,
    -- API 基础 URL (可选，用于自定义端点)
    base_url TEXT,
    -- 是否为该提供商的默认 Key
    is_default INTEGER NOT NULL DEFAULT 0,
    -- 是否启用
    is_enabled INTEGER NOT NULL DEFAULT 1,
    -- 最后使用时间
    last_used_at TEXT,
    -- 使用次数
    usage_count INTEGER NOT NULL DEFAULT 0,
    -- 创建时间
    created_at TEXT NOT NULL,
    -- 更新时间
    updated_at TEXT NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_default ON api_keys(is_default);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_enabled ON api_keys(is_enabled);

-- 确保每个提供商只有一个默认 Key
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_provider_default 
ON api_keys(provider) WHERE is_default = 1;
