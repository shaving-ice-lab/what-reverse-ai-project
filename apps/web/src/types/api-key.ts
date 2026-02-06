/**
 * API 密钥类型定义
 */

// API 密钥提供商（对齐后端允许列表）
export type ApiKeyProvider =
  | "openai"
  | "anthropic"
  | "google"
  | "azure"
  | "deepseek"
  | "moonshot"
  | "zhipu"
  | "baichuan"
  | "ollama";

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
  scopes?: string[];
}

// 测试 API 密钥结果（对齐后端 /users/me/api-keys/test & /users/me/api-keys/:id/test）
export interface ApiKeyTestResult {
  valid: boolean;
  provider: ApiKeyProvider;
  message: string;
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
    // OpenAI 新旧 key 前缀差异较大，这里保持更宽松校验
    keyPattern: /^(sk-|sk-proj)[a-zA-Z0-9-_]{10,}$/,
    keyPlaceholder: "sk-... 或 sk-proj-...",
    models: ["gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude 3.5, Claude 3, Claude 2",
    icon: "🧠",
    color: "#d4a373",
    // 后端目前仅做格式粗校验，这里也保持宽松
    keyPattern: /^sk-[a-zA-Z0-9-_]{10,}$/,
    keyPlaceholder: "sk-...",
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
  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    description: "DeepSeek 系列模型",
    icon: "🧩",
    color: "#4f46e5",
    keyPlaceholder: "输入 DeepSeek API Key",
  },
  moonshot: {
    id: "moonshot",
    name: "Moonshot",
    description: "Kimi / Moonshot 模型",
    icon: "🌙",
    color: "#0ea5e9",
    keyPlaceholder: "输入 Moonshot API Key",
  },
  zhipu: {
    id: "zhipu",
    name: "智谱 AI",
    description: "GLM 系列模型",
    icon: "🧠",
    color: "#22c55e",
    keyPlaceholder: "输入 ZhiPu API Key",
  },
  baichuan: {
    id: "baichuan",
    name: "百川智能",
    description: "Baichuan 系列模型",
    icon: "🌊",
    color: "#f97316",
    keyPlaceholder: "输入 Baichuan API Key",
  },
  ollama: {
    id: "ollama",
    name: "Ollama",
    description: "本地运行的开源模型",
    icon: "🦙",
    color: "#000000",
    // 后端目前仍要求非空 key，这里将其作为本地 endpoint / token 的载体
    keyPlaceholder: "http://localhost:11434",
    baseUrl: "http://localhost:11434",
  },
};
