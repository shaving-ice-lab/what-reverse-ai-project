/**
 * @reverseai/sdk
 *
 * ReverseAI 自定义节点 SDK
 *
 * @example
 * ```typescript
 * import { defineNode, input, output } from '@reverseai/sdk';
 *
 * export default defineNode({
 *   id: 'my-custom-node',
 *   name: '自定义节点',
 *   description: '这是一个自定义节点',
 *   icon: 'puzzle',
 *   category: 'custom',
 *   version: '1.0.0',
 *
 *   inputs: {
 *     text: input.string('输入文本').required().build(),
 *   },
 *
 *   outputs: {
 *     result: output.string('处理结果').build(),
 *   },
 *
 *   async execute(ctx) {
 *     return { result: ctx.inputs.text.toUpperCase() };
 *   },
 * });
 * ```
 */

// 核心函数
export { defineNode } from './defineNode'
export { definePlugin } from './plugin/definePlugin'
export type { PluginDefinition } from './plugin/definePlugin'

// 输入/输出构建器
export { input, output } from './builders'

// LLM 模块
export {
  createSimpleLLMAPI,
  createMockLLMClient,
  LLMError,
  RateLimitError,
  ContextLengthError,
  AuthenticationError,
} from './llm'

export type {
  // LLM 类型
  MessageRole,
  LLMMessage,
  FunctionDefinition,
  ToolDefinition,
  FunctionCall,
  ToolCall,
  LLMChatOptions,
  LLMChatRequest,
  TokenUsage,
  LLMChoice,
  LLMChatResponse,
  LLMStreamChunk,
  LLMEmbeddingRequest,
  LLMEmbeddingResponse,
  LLMCompletionRequest,
  LLMCompletionResponse,
  StreamCallback,
  LLMClient,
  SimpleLLMAPI,
  MockLLMConfig,
} from './llm'

// 验证模块
export {
  validateAllInputs,
  validateAllInputsAsync,
  validateInputField,
  validateNodeDefinition,
  validateDataType,
  validateRule,
  createValidationResult,
  mergeValidationResults,
  createSchemaValidator,
  validators,
} from './validation'

// 测试模块
export {
  createTestContext,
  createMockLogger,
  createMockHttpClient,
  createMockStorage,
  createMockLLMClient as createMockContextLLMClient,
  createMockCache,
  createMockSecrets,
  createMockProgress,
  createNodeTester,
  NodeTester,
  runTestSuite,
  assert,
} from './testing'

export type {
  TestContextConfig,
  ExtendedTestContextConfig,
  LogEntry,
  MockHttpRequest,
  MockHttpResponse,
  MockLLMConfig as TestMockLLMConfig,
  MockLLMRequest,
  ProgressRecord,
  TestResult,
  TestCase,
} from './testing'

// 类型导出
export type {
  // 基础类型
  NodeCategory,
  DataType,
  IconName,
  // 输入定义
  InputFieldConfig,
  ValidationRule,
  ShowIfCondition,
  UIComponentType,
  SelectOption,
  // 输出定义
  OutputFieldConfig,
  // 节点定义
  NodeMetadata,
  NodeDefinitionConfig,
  NodeDefinition,
  // 执行上下文
  NodeExecutionContext,
  LogFunction,
  HttpClient,
  HttpOptions,
  HttpRequestOptions,
  HttpResponse,
  StorageInterface,
  // Context API 类型
  ContextLLMClient,
  ContextLLMMessage,
  ContextLLMOptions,
  ContextLLMChatRequest,
  ContextLLMChatResponse,
  ContextTokenUsage,
  CacheInterface,
  SecretsInterface,
  ProgressInterface,
  // 执行结果
  NodeExecuteFunction,
  ExtractInputTypes,
  ExtractOutputTypes,
  // 验证
  ValidationResult,
  // 序列化
  SerializedNodeDefinition,
  SerializedInputField,
  SerializedOutputField,
} from './types'

// 错误类型
export {
  SDKError,
  ValidationError_ as ValidationError,
  ExecutionError,
  ConfigurationError,
} from './types'

// 版本
export const VERSION = '0.1.0'
