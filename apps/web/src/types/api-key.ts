/**
 * API 密钥类型定义
 */

// API 密钥提供商
export type ApiKeyProvider = 
  | "openai"
  | "anthropic"
  | "google"
  | "azure"
  | "cohere"
  | "huggingface"
  | "ollama"
  | "custom";

// API 密钥状态
export type ApiKeyStatus = "active" | "expired" | "revoked";

// API 密钥信息
export interface ApiKey {
  id: string;
  name: string;
  provider: ApiKeyProvider;
  keyPrefix: string; // 显示前几位，如 sk-xxxx
  keySuffix: string; // 显示后几位，如 xxxx
  status: ApiKeyStatus;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // 使用统计
  usageCount?: number;
  totalTokens?: number;
  totalCost?: number;
}

// 创建 API 密钥请求
export interface CreateApiKeyRequest {
  name: string;
  provider: ApiKeyProvider;
  key: string;
  expiresAt?: string;
}

// 创建 API 密钥响应
export interface CreateApiKeyResponse {
  success: boolean;
  apiKey: ApiKey;
}

// API 密钥列表响应
export interface ListApiKeysResponse {
  success: boolean;
  data: ApiKey[];
}

// 更新 API 密钥请求
export interface UpdateApiKeyRequest {
  name?: string;
  status?: ApiKeyStatus;
}

// 测试 API 密钥响应
export interface TestApiKeyResponse {
  success: boolean;
  valid: boolean;
  message?: string;
  balance?: number;
  models?: string[];
}

// 提供商配置
export interface ProviderConfig {
  id: ApiKeyProvider;
  name: string;
  description: string;
  icon: string;
  color: string;
  keyPattern?: RegExp;
  keyPlaceholder: string;
  baseUrl?: string;
  models?: string[];
}

// 提供商配置列表
export const PROVIDER_CONFIGS: Record<ApiKeyProvider, ProviderConfig> = {
  openai: {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4, GPT-3.5, DALL-E, Whisper",
    icon: "🤖",
    color: "#10a37f",
    keyPattern: /^sk-[a-zA-Z0-9]{48}$/,
    keyPlaceholder: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    models: ["gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude 3.5, Claude 3, Claude 2",
    icon: "🧠",
    color: "#d4a373",
    keyPattern: /^sk-ant-[a-zA-Z0-9-]+$/,
    keyPlaceholder: "sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    models: ["claude-3-5-sonnet", "claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
  },
  google: {
    id: "google",
    name: "Google AI",
    description: "Gemini Pro, PaLM 2",
    icon: "🔮",
    color: "#4285f4",
    keyPlaceholder: "AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    models: ["gemini-pro", "gemini-pro-vision"],
  },
  azure: {
    id: "azure",
    name: "Azure OpenAI",
    description: "Azure 托管的 OpenAI 模型",
    icon: "☁️",
    color: "#0078d4",
    keyPlaceholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    baseUrl: "https://YOUR_RESOURCE.openai.azure.com",
  },
  cohere: {
    id: "cohere",
    name: "Cohere",
    description: "Command, Embed, Rerank",
    icon: "🌐",
    color: "#39594d",
    keyPlaceholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    models: ["command", "command-light", "command-nightly"],
  },
  huggingface: {
    id: "huggingface",
    name: "Hugging Face",
    description: "开源模型推理 API",
    icon: "🤗",
    color: "#ff9d00",
    keyPattern: /^hf_[a-zA-Z0-9]+$/,
    keyPlaceholder: "hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  },
  ollama: {
    id: "ollama",
    name: "Ollama",
    description: "本地运行的开源模型",
    icon: "🦙",
    color: "#000000",
    keyPlaceholder: "无需密钥（本地部署）",
    baseUrl: "http://localhost:11434",
  },
  custom: {
    id: "custom",
    name: "自定义",
    description: "自定义 API 端点",
    icon: "⚙️",
    color: "#6b7280",
    keyPlaceholder: "输入 API 密钥",
  },
};
