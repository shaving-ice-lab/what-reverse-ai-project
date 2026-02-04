/**
 * AgentFlow SDK 核心类型定义
 */

// ===== 基础类型 =====

/** 节点类别 */
export type NodeCategory =
  | "trigger"    // 触发器节点
  | "action"     // 动作节点
  | "logic"      // 逻辑节点
  | "data"       // 数据处理节点
  | "ai"         // AI 节点
  | "integration"// 集成节点
  | "custom";    // 自定义节点

/** 输入/输出数据类型 */
export type DataType =
  | "string"
  | "number"
  | "boolean"
  | "object"
  | "array"
  | "any"
  | "file"
  | "image"
  | "json";

/** 节点图标名称 */
export type IconName =
  | "puzzle"
  | "code"
  | "database"
  | "cloud"
  | "message"
  | "bot"
  | "workflow"
  | "settings"
  | "file"
  | "image"
  | "link"
  | "globe"
  | "mail"
  | "clock"
  | "filter"
  | "transform"
  | "merge"
  | "split"
  | string;

// ===== 输入定义 =====

/** 输入字段基础配置 */
export interface InputFieldConfig<
  TValue = unknown,
  TType extends DataType = DataType
> {
  /** 字段类型 */
  type: TType;
  /** 显示名称 */
  label: string;
  /** 描述信息 */
  description?: string;
  /** 默认值 */
  defaultValue?: TValue;
  /** 是否必填 */
  required?: boolean;
  /** 占位符文本 */
  placeholder?: string;
  /** 验证规则 */
  validation?: ValidationRule[];
  /** 条件显示 */
  showIf?: ShowIfCondition;
  /** UI 组件类型 */
  ui?: UIComponentType;
  /** 选择项 (用于 select/multiselect) */
  options?: SelectOption[];
  /** UI 额外配置 */
  uiOptions?: Record<string, unknown>;
}

/** 验证规则 */
export interface ValidationRule {
  type: "min" | "max" | "minLength" | "maxLength" | "pattern" | "custom";
  value?: number | string | RegExp;
  message: string;
  validator?: (value: unknown) => boolean | Promise<boolean>;
}

/** 条件显示 */
export interface ShowIfCondition {
  field: string;
  operator: "equals" | "notEquals" | "contains" | "exists";
  value?: unknown;
}

/** UI 组件类型 */
export type UIComponentType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "multiselect"
  | "checkbox"
  | "switch"
  | "slider"
  | "color"
  | "date"
  | "datetime"
  | "file"
  | "code"
  | "json"
  | "expression"
  | "variable"
  | "custom";

/** 选项定义 (用于 select) */
export interface SelectOption<T extends string | number = string | number> {
  label: string;
  value: T;
  description?: string;
  disabled?: boolean;
}

// ===== 输出定义 =====

/** 输出字段配置 */
export interface OutputFieldConfig<TType extends DataType = DataType> {
  /** 字段类型 */
  type: TType;
  /** 显示名称 */
  label: string;
  /** 描述信息 */
  description?: string;
  /** 是否可选输出 */
  optional?: boolean;
}

// ===== 节点定义 =====

/** 节点元数据 */
export interface NodeMetadata {
  /** 唯一标识符 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 描述信息 */
  description: string;
  /** 节点类别 */
  category: NodeCategory;
  /** 图标名称 */
  icon: IconName;
  /** 版本号 */
  version: string;
  /** 作者 */
  author?: string;
  /** 标签 */
  tags?: string[];
  /** 是否已弃用 */
  deprecated?: boolean;
  /** 弃用说明 */
  deprecationMessage?: string;
}

/** 节点定义配置 */
export interface NodeDefinitionConfig<
  TInputs extends Record<string, InputFieldConfig> = Record<string, InputFieldConfig>,
  TOutputs extends Record<string, OutputFieldConfig> = Record<string, OutputFieldConfig>
> extends NodeMetadata {
  /** 输入定义 */
  inputs: TInputs;
  /** 输出定义 */
  outputs: TOutputs;
  /** 执行函数 */
  execute: NodeExecuteFunction<TInputs, TOutputs>;
  /** 初始化函数 */
  onInit?: () => void | Promise<void>;
  /** 销毁函数 */
  onDestroy?: () => void | Promise<void>;
  /** 配置变更回调 */
  onConfigChange?: (newConfig: Record<string, unknown>) => void;
}

// ===== 执行上下文 =====

/** LLM 客户端简化接口 (完整定义在 llm.ts) */
export interface ContextLLMClient {
  /**
   * 发送聊天消息
   * @param prompt 用户提示
   * @param options 选项
   * @returns 生成的文本
   */
  chat(prompt: string, options?: ContextLLMOptions): Promise<string>;
  /**
   * 发送聊天消息（完整配置）
   * @param request 请求配置
   */
  chat(request: ContextLLMChatRequest): Promise<ContextLLMChatResponse>;

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
    options?: ContextLLMOptions
  ): Promise<string>;

  /**
   * 多轮对话
   * @param messages 消息列表
   * @param options 选项
   * @returns 助手的回复
   */
  conversation(messages: ContextLLMMessage[], options?: ContextLLMOptions): Promise<string>;

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
    options?: ContextLLMOptions
  ): Promise<string>;

  /**
   * 获取文本嵌入向量
   * @param text 输入文本
   * @returns 嵌入向量
   */
  embed(text: string): Promise<number[]>;

  /**
   * 批量获取嵌入向量
   * @param texts 输入文本数组
   * @returns 嵌入向量数组
   */
  embedBatch(texts: string[]): Promise<number[][]>;

  /**
   * JSON 模式聊天
   * @param prompt 用户提示
   * @param options 选项
   * @returns 解析后的 JSON 对象
   */
  jsonChat<T = unknown>(prompt: string, options?: ContextLLMOptions): Promise<T>;

  /**
   * 获取最后一次请求的 token 使用统计
   */
  getLastUsage(): ContextTokenUsage | null;
}

/** LLM 消息 */
export interface ContextLLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** LLM 选项 */
export interface ContextLLMOptions {
  /** 模型名称 */
  model?: string;
  /** 温度 (0-2) */
  temperature?: number;
  /** Top P 采样 */
  topP?: number;
  /** 最大生成 token 数 */
  max_tokens?: number;
  /** 最大生成 token 数（驼峰别名） */
  maxTokens?: number;
  /** 停止序列 */
  stop?: string[];
  /** 超时时间 (毫秒) */
  timeout?: number;
}

/** LLM Chat 请求 */
export interface ContextLLMChatRequest {
  /** 模型名称 */
  model?: string;
  /** 消息列表 */
  messages: ContextLLMMessage[];
  /** 温度 (0-2) */
  temperature?: number;
  /** Top P 采样 */
  topP?: number;
  /** 最大生成 token 数 */
  maxTokens?: number;
  /** 停止序列 */
  stop?: string[];
  /** 流式输出 */
  stream?: boolean;
  /** 流式回调 */
  onStream?: (chunk: string) => void;
  /** 超时时间 (毫秒) */
  timeout?: number;
}

/** LLM Chat 响应 */
export interface ContextLLMChatResponse {
  content: string;
  model?: string;
  usage?: ContextTokenUsage;
  finishReason?: string;
}

/** Token 使用统计 */
export interface ContextTokenUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

/** 缓存接口 */
export interface CacheInterface {
  /**
   * 获取缓存值
   * @param key 缓存键
   * @returns 缓存值或 null
   */
  get<T = unknown>(key: string): Promise<T | null>;

  /**
   * 设置缓存值
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间 (秒)
   */
  set<T = unknown>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * 删除缓存
   * @param key 缓存键
   */
  delete(key: string): Promise<void>;

  /**
   * 检查缓存是否存在
   * @param key 缓存键
   */
  exists(key: string): Promise<boolean>;

  /**
   * 获取或设置缓存
   * @param key 缓存键
   * @param factory 值生成函数
   * @param ttl 过期时间 (秒)
   */
  getOrSet<T = unknown>(
    key: string,
    factory: () => T | Promise<T>,
    ttl?: number
  ): Promise<T>;
}

/** 密钥管理接口 */
export interface SecretsInterface {
  /**
   * 获取密钥
   * @param key 密钥名称
   * @returns 密钥值
   */
  get(key: string): Promise<string | undefined>;

  /**
   * 检查密钥是否存在
   * @param key 密钥名称
   */
  has(key: string): Promise<boolean>;

  /**
   * 获取多个密钥
   * @param keys 密钥名称列表
   * @returns 密钥值映射
   */
  getMany(keys: string[]): Promise<Record<string, string | undefined>>;

  /**
   * 获取必需的密钥 (不存在时抛出错误)
   * @param key 密钥名称
   * @returns 密钥值
   */
  require(key: string): Promise<string>;
}

/** 进度报告接口 */
export interface ProgressInterface {
  /**
   * 报告进度
   * @param progress 进度值 (0-100)
   * @param message 可选消息
   */
  report(progress: number, message?: string): void;

  /**
   * 开始一个新阶段
   * @param name 阶段名称
   * @param total 总步骤数
   */
  startPhase(name: string, total?: number): void;

  /**
   * 推进当前阶段
   * @param step 步骤数 (默认 1)
   * @param message 可选消息
   */
  advance(step?: number, message?: string): void;

  /**
   * 完成当前阶段
   */
  completePhase(): void;

  /**
   * 标记为完成
   */
  done(): void;
}

/** 节点执行上下文 */
export interface NodeExecutionContext<
  TInputs extends Record<string, InputFieldConfig> = Record<string, InputFieldConfig>
> {
  /** 节点 ID */
  nodeId: string;
  /** 执行 ID */
  executionId: string;
  /** 工作流 ID */
  workflowId: string;
  /** 输入值 */
  inputs: ExtractInputTypes<TInputs>;
  /** 日志函数 */
  log: LogFunction;
  /** 进度报告 (简化版) */
  reportProgress: (progress: number, message?: string) => void;
  /** 流式输出 */
  streamOutput: (field: string, chunk: unknown) => void;
  /** 获取环境变量 */
  getEnv: (key: string) => string | undefined;
  /** 获取密钥 (简化版) */
  getSecret: (key: string) => Promise<string | undefined>;
  /** HTTP 客户端 */
  http: HttpClient;
  /** 取消信号 */
  signal: AbortSignal;
  /** 存储接口 */
  storage: StorageInterface;

  // ===== 新增 Context API =====

  /** LLM 客户端 */
  llm: ContextLLMClient;

  /** 缓存接口 */
  cache: CacheInterface;

  /** 密钥管理接口 */
  secrets: SecretsInterface;

  /** 进度报告接口 */
  progress: ProgressInterface;
}

/** 日志函数 */
export interface LogFunction {
  debug: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
}

/** HTTP 客户端 */
export interface HttpClient {
  get: <T = unknown>(url: string, options?: HttpOptions) => Promise<HttpResponse<T>>;
  post: <T = unknown>(url: string, data?: unknown, options?: HttpOptions) => Promise<HttpResponse<T>>;
  put: <T = unknown>(url: string, data?: unknown, options?: HttpOptions) => Promise<HttpResponse<T>>;
  delete: <T = unknown>(url: string, options?: HttpOptions) => Promise<HttpResponse<T>>;
  request: <T = unknown>(options: HttpRequestOptions) => Promise<HttpResponse<T>>;
}

export interface HttpOptions {
  headers?: Record<string, string>;
  timeout?: number;
  params?: Record<string, string>;
}

export interface HttpRequestOptions extends HttpOptions {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  body?: unknown;
  data?: unknown;
}

export interface HttpResponse<T = unknown> {
  data: T;
  body?: T;
  status: number;
  headers: Record<string, string>;
}

/** 存储接口 */
export interface StorageInterface {
  get: <T = unknown>(key: string) => Promise<T | null>;
  set: <T = unknown>(key: string, value: T, ttl?: number) => Promise<void>;
  delete: (key: string) => Promise<void>;
  exists: (key: string) => Promise<boolean>;
}

// ===== 执行结果 =====

/** 节点执行函数 */
export type NodeExecuteFunction<
  TInputs extends Record<string, InputFieldConfig>,
  TOutputs extends Record<string, OutputFieldConfig>
> = (
  ctx: NodeExecutionContext<TInputs>
) => Promise<ExtractOutputTypes<TOutputs>> | ExtractOutputTypes<TOutputs>;

/** 从输入配置提取值类型 */
export type ExtractInputTypes<T extends Record<string, InputFieldConfig>> = {
  [K in keyof T]: T[K] extends InputFieldConfig<infer TValue, any>
    ? TValue
    : ExtractDataTypeValue<T[K]["type"]>;
};

/** 从输出配置提取值类型 */
export type ExtractOutputTypes<T extends Record<string, OutputFieldConfig>> = {
  [K in keyof T]: ExtractDataTypeValue<T[K]["type"]>;
};

/** 数据类型到 TypeScript 类型映射 */
export type ExtractDataTypeValue<T extends DataType> = 
  T extends "string" ? string :
  T extends "number" ? number :
  T extends "boolean" ? boolean :
  T extends "object" ? Record<string, unknown> :
  T extends "array" ? unknown[] :
  T extends "file" ? File | Blob :
  T extends "image" ? File | Blob | string :
  T extends "json" ? unknown :
  unknown;

// ===== 节点实例 =====

/** 节点定义实例 */
export interface NodeDefinition<
  TInputs extends Record<string, InputFieldConfig> = Record<string, InputFieldConfig>,
  TOutputs extends Record<string, OutputFieldConfig> = Record<string, OutputFieldConfig>
> extends NodeDefinitionConfig<TInputs, TOutputs> {
  /** 验证输入 */
  validateInputs: (inputs: unknown) => ValidationResult;
  /** 获取默认配置 */
  getDefaultConfig: () => Record<string, unknown>;
  /** 序列化节点定义 */
  serialize: () => SerializedNodeDefinition;
}

/** 验证结果 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/** 验证错误 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/** 序列化的节点定义 */
export interface SerializedNodeDefinition {
  id: string;
  name: string;
  description: string;
  category: NodeCategory;
  icon: IconName;
  version: string;
  inputs: Record<string, SerializedInputField>;
  outputs: Record<string, SerializedOutputField>;
}

export interface SerializedInputField {
  type: DataType;
  label: string;
  description?: string;
  required?: boolean;
  defaultValue?: unknown;
}

export interface SerializedOutputField {
  type: DataType;
  label: string;
  description?: string;
  optional?: boolean;
}

// ===== 错误类型 =====

/** SDK 错误基类 */
export class SDKError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "SDKError";
  }
}

/** 验证错误 */
export class ValidationError_ extends SDKError {
  constructor(message: string, public errors: ValidationError[]) {
    super("VALIDATION_ERROR", message, { errors });
    this.name = "ValidationError";
  }
}

/** 执行错误 */
export class ExecutionError extends SDKError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("EXECUTION_ERROR", message, details);
    this.name = "ExecutionError";
  }
}

/** 配置错误 */
export class ConfigurationError extends SDKError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("CONFIGURATION_ERROR", message, details);
    this.name = "ConfigurationError";
  }
}
