/**
 * API Key Type Definition
 */

// API Key Provider (for endpoint allow list)
export type ApiKeyProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'azure'
  | 'deepseek'
  | 'moonshot'
  | 'zhipu'
  | 'baichuan'
  | 'ollama'

// API Key Status
export type ApiKeyStatus = 'active' | 'expired' | 'revoked'

// API Key Info
export interface ApiKey {
  id: string
  name: string
  provider: ApiKeyProvider
  keyPrefix: string // Display prefix, e.g., sk-xxxx
  keySuffix: string // Display suffix, e.g., xxxx
  status: ApiKeyStatus
  lastUsedAt?: string
  createdAt: string
  updatedAt: string
}

// Create API Key Request
export interface CreateApiKeyRequest {
  name: string
  provider: ApiKeyProvider
  key: string
  scopes?: string[]
}

// Test API Key Result (for endpoint /users/me/api-keys/test & /users/me/api-keys/:id/test)
export interface ApiKeyTestResult {
  valid: boolean
  provider: ApiKeyProvider
  message: string
}

// Provider Config
export interface ProviderConfig {
  id: ApiKeyProvider
  name: string
  description: string
  icon: string
  color: string
  keyPattern?: RegExp
  keyPlaceholder: string
  baseUrl?: string
  models?: string[]
}

// Provider Config List
export const PROVIDER_CONFIGS: Record<ApiKeyProvider, ProviderConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5, DALL-E, Whisper',
    icon: '🤖',
    color: '#10a37f',
    // OpenAI old and new key formats differ, keeping loose validation
    keyPattern: /^(sk-|sk-proj)[a-zA-Z0-9-_]{10,}$/,
    keyPlaceholder: 'sk-... or sk-proj-...',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude 3.5, Claude 3, Claude 2',
    icon: '🧠',
    color: '#d4a373',
    // Only doing format validation, keeping loose
    keyPattern: /^sk-[a-zA-Z0-9-_]{10,}$/,
    keyPlaceholder: 'sk-...',
    models: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  },
  google: {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini Pro, PaLM 2',
    icon: '🔮',
    color: '#4285f4',
    keyPlaceholder: 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    models: ['gemini-pro', 'gemini-pro-vision'],
  },
  azure: {
    id: 'azure',
    name: 'Azure OpenAI',
    description: 'Azure-hosted OpenAI Models',
    icon: '☁️',
    color: '#0078d4',
    keyPlaceholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'https://YOUR_RESOURCE.openai.azure.com',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek Series Models',
    icon: '🧩',
    color: '#4f46e5',
    keyPlaceholder: 'Input DeepSeek API Key',
  },
  moonshot: {
    id: 'moonshot',
    name: 'Moonshot',
    description: 'Kimi / Moonshot Model',
    icon: '🌙',
    color: '#0ea5e9',
    keyPlaceholder: 'Input Moonshot API Key',
  },
  zhipu: {
    id: 'zhipu',
    name: 'Zhipu AI',
    description: 'GLM Series Models',
    icon: '🧠',
    color: '#22c55e',
    keyPlaceholder: 'Input ZhiPu API Key',
  },
  baichuan: {
    id: 'baichuan',
    name: '100Smart',
    description: 'Baichuan Series Models',
    icon: '🌊',
    color: '#f97316',
    keyPlaceholder: 'Input Baichuan API Key',
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama',
    description: 'Locally Run Open Source Models',
    icon: '🦙',
    color: '#000000',
    // Ollama may not need a key, this can also be used as local endpoint / token
    keyPlaceholder: 'http://localhost:11434',
    baseUrl: 'http://localhost:11434',
  },
}
