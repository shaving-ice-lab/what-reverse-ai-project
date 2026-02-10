/**
 * LLM 客户端 API
 *
 * 提供统一的 LLM 调用接口，支持多种模型供应商
 */

// ===== 类型定义 =====

/** LLM 消息角色 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'function' | 'tool'

/** LLM 消息 */
export interface LLMMessage {
  /** 角色 */
  role: MessageRole
  /** 内容 */
  content: string
  /** 函数调用名称 (用于 function 角色) */
  name?: string
  /** 工具调用 ID (用于 tool 角色) */
  tool_call_id?: string
}

/** 函数定义 */
export interface FunctionDefinition {
  /** 函数名称 */
  name: string
  /** 函数描述 */
  description: string
  /** 参数定义 (JSON Schema) */
  parameters: Record<string, unknown>
}

/** 工具定义 */
export interface ToolDefinition {
  /** 工具类型 */
  type: 'function'
  /** 函数定义 */
  function: FunctionDefinition
}

/** 函数调用结果 */
export interface FunctionCall {
  /** 函数名称 */
  name: string
  /** 参数 (JSON 字符串) */
  arguments: string
}

/** 工具调用结果 */
export interface ToolCall {
  /** 调用 ID */
  id: string
  /** 工具类型 */
  type: 'function'
  /** 函数调用 */
  function: FunctionCall
}

/** Chat 请求配置 */
export interface LLMChatOptions {
  /** 模型名称 */
  model?: string
  /** 温度 (0-2) */
  temperature?: number
  /** Top P 采样 */
  top_p?: number
  /** 最大生成 token 数 */
  max_tokens?: number
  /** 停止序列 */
  stop?: string[]
  /** 存在惩罚 (-2.0 到 2.0) */
  presence_penalty?: number
  /** 频率惩罚 (-2.0 到 2.0) */
  frequency_penalty?: number
  /** 函数定义列表 */
  functions?: FunctionDefinition[]
  /** 工具定义列表 */
  tools?: ToolDefinition[]
  /** 强制调用的函数名 */
  function_call?: 'auto' | 'none' | { name: string }
  /** 工具选择 */
  tool_choice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } }
  /** 响应格式 */
  response_format?: { type: 'text' | 'json_object' }
  /** 流式输出 */
  stream?: boolean
  /** 用户标识 */
  user?: string
  /** 超时时间 (毫秒) */
  timeout?: number
}

/** Chat 请求 */
export interface LLMChatRequest extends LLMChatOptions {
  /** 消息列表 */
  messages: LLMMessage[]
}

/** Token 使用统计 */
export interface TokenUsage {
  /** 提示 token 数 */
  prompt_tokens: number
  /** 生成 token 数 */
  completion_tokens: number
  /** 总 token 数 */
  total_tokens: number
}

/** 响应选择 */
export interface LLMChoice {
  /** 选择索引 */
  index: number
  /** 消息 */
  message: LLMMessage & {
    /** 函数调用 (旧版) */
    function_call?: FunctionCall
    /** 工具调用列表 */
    tool_calls?: ToolCall[]
  }
  /** 结束原因 */
  finish_reason: 'stop' | 'length' | 'function_call' | 'tool_calls' | 'content_filter' | null
}

/** Chat 响应 */
export interface LLMChatResponse {
  /** 响应 ID */
  id: string
  /** 对象类型 */
  object: 'chat.completion'
  /** 创建时间 */
  created: number
  /** 模型名称 */
  model: string
  /** 选择列表 */
  choices: LLMChoice[]
  /** Token 使用统计 */
  usage: TokenUsage
}

/** 流式响应块 */
export interface LLMStreamChunk {
  /** 响应 ID */
  id: string
  /** 对象类型 */
  object: 'chat.completion.chunk'
  /** 创建时间 */
  created: number
  /** 模型名称 */
  model: string
  /** 增量选择 */
  choices: Array<{
    index: number
    delta: Partial<LLMMessage> & {
      function_call?: Partial<FunctionCall>
      tool_calls?: Array<{
        index: number
        id?: string
        type?: 'function'
        function?: Partial<FunctionCall>
      }>
    }
    finish_reason: 'stop' | 'length' | 'function_call' | 'tool_calls' | 'content_filter' | null
  }>
}

/** 嵌入向量请求 */
export interface LLMEmbeddingRequest {
  /** 模型名称 */
  model?: string
  /** 输入文本 (单个或多个) */
  input: string | string[]
  /** 用户标识 */
  user?: string
}

/** 嵌入向量响应 */
export interface LLMEmbeddingResponse {
  /** 对象类型 */
  object: 'list'
  /** 模型名称 */
  model: string
  /** 嵌入向量列表 */
  data: Array<{
    object: 'embedding'
    index: number
    embedding: number[]
  }>
  /** Token 使用统计 */
  usage: {
    prompt_tokens: number
    total_tokens: number
  }
}

/** 完成请求 (旧版 API) */
export interface LLMCompletionRequest {
  /** 模型名称 */
  model?: string
  /** 提示文本 */
  prompt: string
  /** 温度 */
  temperature?: number
  /** 最大 token 数 */
  max_tokens?: number
  /** 停止序列 */
  stop?: string[]
  /** 流式输出 */
  stream?: boolean
}

/** 完成响应 */
export interface LLMCompletionResponse {
  /** 响应 ID */
  id: string
  /** 对象类型 */
  object: 'text_completion'
  /** 创建时间 */
  created: number
  /** 模型名称 */
  model: string
  /** 选择列表 */
  choices: Array<{
    index: number
    text: string
    finish_reason: 'stop' | 'length' | null
  }>
  /** Token 使用统计 */
  usage: TokenUsage
}

// ===== LLM 客户端接口 =====

/** 流式回调 */
export type StreamCallback = (chunk: LLMStreamChunk) => void

/** LLM 客户端接口 */
export interface LLMClient {
  /**
   * Chat 对话
   * @param request 请求配置
   * @returns 响应结果
   */
  chat(request: LLMChatRequest): Promise<LLMChatResponse>

  /**
   * Chat 对话 (流式)
   * @param request 请求配置
   * @param onChunk 流式回调
   * @returns 完整响应
   */
  chatStream(request: LLMChatRequest, onChunk: StreamCallback): Promise<LLMChatResponse>

  /**
   * 生成嵌入向量
   * @param request 请求配置
   * @returns 嵌入向量响应
   */
  embedding(request: LLMEmbeddingRequest): Promise<LLMEmbeddingResponse>

  /**
   * 文本完成 (旧版)
   * @param request 请求配置
   * @returns 完成响应
   */
  completion?(request: LLMCompletionRequest): Promise<LLMCompletionResponse>

  /**
   * 列出可用模型
   * @returns 模型列表
   */
  listModels?(): Promise<string[]>
}

// ===== 便捷 API =====

/** 简化的 LLM API 接口 */
export interface SimpleLLMAPI {
  /**
   * 发送聊天消息
   * @param prompt 用户提示
   * @param options 选项
   * @returns 生成的文本
   */
  chat(prompt: string, options?: LLMChatOptions): Promise<string>

  /**
   * 发送带系统提示的聊天消息
   * @param systemPrompt 系统提示
   * @param userPrompt 用户提示
   * @param options 选项
   * @returns 生成的文本
   */
  chatWithSystem(
    systemPrompt: string,
    userPrompt: string,
    options?: LLMChatOptions
  ): Promise<string>

  /**
   * 多轮对话
   * @param messages 消息列表
   * @param options 选项
   * @returns 助手的回复
   */
  conversation(messages: LLMMessage[], options?: LLMChatOptions): Promise<string>

  /**
   * 流式聊天
   * @param prompt 用户提示
   * @param onChunk 接收每个文本块
   * @param options 选项
   * @returns 完整的生成文本
   */
  streamChat(
    prompt: string,
    onChunk: (text: string) => void,
    options?: LLMChatOptions
  ): Promise<string>

  /**
   * 获取文本嵌入向量
   * @param text 输入文本
   * @returns 嵌入向量
   */
  embed(text: string): Promise<number[]>

  /**
   * 批量获取嵌入向量
   * @param texts 输入文本数组
   * @returns 嵌入向量数组
   */
  embedBatch(texts: string[]): Promise<number[][]>

  /**
   * 调用函数 (Function Calling)
   * @param prompt 用户提示
   * @param functions 函数定义列表
   * @param options 选项
   * @returns 函数调用结果或文本
   */
  functionCall(
    prompt: string,
    functions: FunctionDefinition[],
    options?: LLMChatOptions
  ): Promise<FunctionCall | string>

  /**
   * JSON 模式聊天
   * @param prompt 用户提示
   * @param options 选项
   * @returns 解析后的 JSON 对象
   */
  jsonChat<T = unknown>(prompt: string, options?: LLMChatOptions): Promise<T>

  /**
   * 获取最后一次请求的 token 使用统计
   */
  getLastUsage(): TokenUsage | null

  /**
   * 获取底层客户端
   */
  getClient(): LLMClient
}

// ===== 创建简化 API =====

/**
 * 创建简化的 LLM API
 * @param client 底层 LLM 客户端
 * @param defaultOptions 默认选项
 * @returns 简化 API
 */
export function createSimpleLLMAPI(
  client: LLMClient,
  defaultOptions: LLMChatOptions = {}
): SimpleLLMAPI {
  let lastUsage: TokenUsage | null = null

  return {
    async chat(prompt: string, options?: LLMChatOptions): Promise<string> {
      const response = await client.chat({
        messages: [{ role: 'user', content: prompt }],
        ...defaultOptions,
        ...options,
      })
      lastUsage = response.usage
      return response.choices[0]?.message.content || ''
    },

    async chatWithSystem(
      systemPrompt: string,
      userPrompt: string,
      options?: LLMChatOptions
    ): Promise<string> {
      const response = await client.chat({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        ...defaultOptions,
        ...options,
      })
      lastUsage = response.usage
      return response.choices[0]?.message.content || ''
    },

    async conversation(messages: LLMMessage[], options?: LLMChatOptions): Promise<string> {
      const response = await client.chat({
        messages,
        ...defaultOptions,
        ...options,
      })
      lastUsage = response.usage
      return response.choices[0]?.message.content || ''
    },

    async streamChat(
      prompt: string,
      onChunk: (text: string) => void,
      options?: LLMChatOptions
    ): Promise<string> {
      let fullContent = ''
      const response = await client.chatStream(
        {
          messages: [{ role: 'user', content: prompt }],
          ...defaultOptions,
          ...options,
          stream: true,
        },
        (chunk) => {
          const content = chunk.choices[0]?.delta?.content || ''
          if (content) {
            fullContent += content
            onChunk(content)
          }
        }
      )
      lastUsage = response.usage
      return fullContent
    },

    async embed(text: string): Promise<number[]> {
      const response = await client.embedding({
        input: text,
      })
      return response.data[0]?.embedding || []
    },

    async embedBatch(texts: string[]): Promise<number[][]> {
      const response = await client.embedding({
        input: texts,
      })
      return response.data.sort((a, b) => a.index - b.index).map((item) => item.embedding)
    },

    async functionCall(
      prompt: string,
      functions: FunctionDefinition[],
      options?: LLMChatOptions
    ): Promise<FunctionCall | string> {
      const response = await client.chat({
        messages: [{ role: 'user', content: prompt }],
        functions,
        function_call: 'auto',
        ...defaultOptions,
        ...options,
      })
      lastUsage = response.usage

      const choice = response.choices[0]
      if (choice?.message.function_call) {
        return choice.message.function_call
      }
      return choice?.message.content || ''
    },

    async jsonChat<T = unknown>(prompt: string, options?: LLMChatOptions): Promise<T> {
      const response = await client.chat({
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        ...defaultOptions,
        ...options,
      })
      lastUsage = response.usage
      const content = response.choices[0]?.message.content || '{}'
      return JSON.parse(content) as T
    },

    getLastUsage(): TokenUsage | null {
      return lastUsage
    },

    getClient(): LLMClient {
      return client
    },
  }
}

// ===== Mock LLM 客户端 (用于测试) =====

export interface MockLLMConfig {
  /** 固定响应内容 */
  responseContent?: string
  /** 响应生成函数 */
  responseGenerator?: (request: LLMChatRequest) => string
  /** 模拟延迟 (毫秒) */
  delay?: number
  /** 模拟 token 使用 */
  tokenUsage?: Partial<TokenUsage>
  /** 模拟嵌入向量维度 */
  embeddingDimension?: number
  /** 模拟错误 */
  simulateError?: Error
}

/**
 * 创建 Mock LLM 客户端 (用于测试)
 */
export function createMockLLMClient(config: MockLLMConfig = {}): LLMClient {
  const {
    responseContent = 'This is a mock response.',
    responseGenerator,
    delay = 0,
    tokenUsage = {},
    embeddingDimension = 1536,
    simulateError,
  } = config

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  return {
    async chat(request: LLMChatRequest): Promise<LLMChatResponse> {
      if (simulateError) throw simulateError
      if (delay > 0) await sleep(delay)

      const content = responseGenerator ? responseGenerator(request) : responseContent

      return {
        id: `chatcmpl-mock-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: request.model || 'gpt-3.5-turbo',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content,
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: tokenUsage.prompt_tokens || 10,
          completion_tokens: tokenUsage.completion_tokens || 20,
          total_tokens: tokenUsage.total_tokens || 30,
        },
      }
    },

    async chatStream(request: LLMChatRequest, onChunk: StreamCallback): Promise<LLMChatResponse> {
      if (simulateError) throw simulateError

      const content = responseGenerator ? responseGenerator(request) : responseContent

      // 模拟流式输出
      const words = content.split(' ')
      for (let i = 0; i < words.length; i++) {
        if (delay > 0) await sleep(delay / words.length)

        const chunk: LLMStreamChunk = {
          id: `chatcmpl-mock-${Date.now()}`,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: request.model || 'gpt-3.5-turbo',
          choices: [
            {
              index: 0,
              delta: {
                content: words[i] + (i < words.length - 1 ? ' ' : ''),
              },
              finish_reason: i === words.length - 1 ? 'stop' : null,
            },
          ],
        }
        onChunk(chunk)
      }

      return {
        id: `chatcmpl-mock-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: request.model || 'gpt-3.5-turbo',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content,
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: tokenUsage.prompt_tokens || 10,
          completion_tokens: tokenUsage.completion_tokens || 20,
          total_tokens: tokenUsage.total_tokens || 30,
        },
      }
    },

    async embedding(request: LLMEmbeddingRequest): Promise<LLMEmbeddingResponse> {
      if (simulateError) throw simulateError
      if (delay > 0) await sleep(delay)

      const inputs = Array.isArray(request.input) ? request.input : [request.input]

      return {
        object: 'list',
        model: request.model || 'text-embedding-ada-002',
        data: inputs.map((_, index) => ({
          object: 'embedding' as const,
          index,
          embedding: Array.from({ length: embeddingDimension }, () => Math.random() * 2 - 1),
        })),
        usage: {
          prompt_tokens: inputs.reduce((sum, text) => sum + text.length / 4, 0),
          total_tokens: inputs.reduce((sum, text) => sum + text.length / 4, 0),
        },
      }
    },

    async listModels(): Promise<string[]> {
      return ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'text-embedding-ada-002']
    },
  }
}

// ===== 错误类型 =====

/** LLM 错误 */
export class LLMError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'LLMError'
  }
}

/** 速率限制错误 */
export class RateLimitError extends LLMError {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT', 429, { retryAfter })
    this.name = 'RateLimitError'
  }
}

/** 上下文长度超出错误 */
export class ContextLengthError extends LLMError {
  constructor(
    message: string = 'Context length exceeded',
    public maxLength?: number
  ) {
    super(message, 'CONTEXT_LENGTH_EXCEEDED', 400, { maxLength })
    this.name = 'ContextLengthError'
  }
}

/** 认证错误 */
export class AuthenticationError extends LLMError {
  constructor(message: string = 'Invalid API key') {
    super(message, 'AUTHENTICATION_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}
