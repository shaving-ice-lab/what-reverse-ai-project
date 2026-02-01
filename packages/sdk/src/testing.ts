/**
 * 节点测试框架
 * 
 * 提供测试工具、Mock 对象、断言辅助函数
 */

import type {
  NodeDefinition,
  NodeExecutionContext,
  InputFieldConfig,
  LogFunction,
  HttpClient,
  HttpResponse,
  StorageInterface,
  ValidationResult,
  ContextLLMClient,
  ContextLLMOptions,
  ContextLLMMessage,
  ContextTokenUsage,
  CacheInterface,
  SecretsInterface,
  ProgressInterface,
} from "./types";

// ===== 测试上下文 =====

/** 测试上下文配置 */
export interface TestContextConfig {
  nodeId?: string;
  executionId?: string;
  workflowId?: string;
  env?: Record<string, string>;
  secrets?: Record<string, string>;
  storage?: Record<string, unknown>;
}

/** 日志记录 */
export interface LogEntry {
  level: "debug" | "info" | "warn" | "error";
  message: string;
  data?: unknown;
  timestamp: Date;
}

/** Mock HTTP 请求 */
export interface MockHttpRequest {
  method: string;
  url: string;
  data?: unknown;
  headers?: Record<string, string>;
}

/** Mock HTTP 响应配置 */
export interface MockHttpResponse<T = unknown> {
  data: T;
  status?: number;
  headers?: Record<string, string>;
}

// ===== Mock 日志 =====

/**
 * 创建 Mock 日志函数
 */
export function createMockLogger(): LogFunction & { logs: LogEntry[]; clear: () => void } {
  const logs: LogEntry[] = [];

  const createLogFn = (level: LogEntry["level"]) => (message: string, data?: unknown) => {
    logs.push({ level, message, data, timestamp: new Date() });
  };

  return {
    logs,
    debug: createLogFn("debug"),
    info: createLogFn("info"),
    warn: createLogFn("warn"),
    error: createLogFn("error"),
    clear: () => { logs.length = 0; },
  };
}

// ===== Mock HTTP 客户端 =====

/**
 * 创建 Mock HTTP 客户端
 */
export function createMockHttpClient(): HttpClient & {
  requests: MockHttpRequest[];
  mockResponse: <T>(response: MockHttpResponse<T>) => void;
  mockError: (error: Error) => void;
  clear: () => void;
} {
  const requests: MockHttpRequest[] = [];
  let mockResponseConfig: MockHttpResponse | null = null;
  let mockErrorConfig: Error | null = null;

  const makeRequest = async <T>(
    method: string,
    url: string,
    data?: unknown,
    headers?: Record<string, string>
  ): Promise<HttpResponse<T>> => {
    requests.push({ method, url, data, headers });

    if (mockErrorConfig) {
      throw mockErrorConfig;
    }

    if (mockResponseConfig) {
      return {
        data: mockResponseConfig.data as T,
        status: mockResponseConfig.status ?? 200,
        headers: mockResponseConfig.headers ?? {},
      };
    }

    return {
      data: {} as T,
      status: 200,
      headers: {},
    };
  };

  return {
    requests,
    get: <T>(url: string, options?: { headers?: Record<string, string> }) =>
      makeRequest<T>("GET", url, undefined, options?.headers),
    post: <T>(url: string, data?: unknown, options?: { headers?: Record<string, string> }) =>
      makeRequest<T>("POST", url, data, options?.headers),
    put: <T>(url: string, data?: unknown, options?: { headers?: Record<string, string> }) =>
      makeRequest<T>("PUT", url, data, options?.headers),
    delete: <T>(url: string, options?: { headers?: Record<string, string> }) =>
      makeRequest<T>("DELETE", url, undefined, options?.headers),
    request: <T>(options: { method: string; url: string; data?: unknown; headers?: Record<string, string> }) =>
      makeRequest<T>(options.method, options.url, options.data, options.headers),
    mockResponse: <T>(response: MockHttpResponse<T>) => {
      mockResponseConfig = response as MockHttpResponse;
      mockErrorConfig = null;
    },
    mockError: (error: Error) => {
      mockErrorConfig = error;
      mockResponseConfig = null;
    },
    clear: () => {
      requests.length = 0;
      mockResponseConfig = null;
      mockErrorConfig = null;
    },
  };
}

// ===== Mock 存储 =====

/**
 * 创建 Mock 存储接口
 */
export function createMockStorage(
  initial: Record<string, unknown> = {}
): StorageInterface & { data: Record<string, unknown>; clear: () => void } {
  const data: Record<string, unknown> = { ...initial };

  return {
    data,
    get: async <T>(key: string): Promise<T | null> => {
      return (data[key] as T) ?? null;
    },
    set: async <T>(key: string, value: T): Promise<void> => {
      data[key] = value;
    },
    delete: async (key: string): Promise<void> => {
      delete data[key];
    },
    exists: async (key: string): Promise<boolean> => {
      return key in data;
    },
    clear: () => {
      for (const key of Object.keys(data)) {
        delete data[key];
      }
    },
  };
}

// ===== Mock LLM 客户端 =====

/** Mock LLM 配置 */
export interface MockLLMConfig {
  /** 默认响应内容 */
  defaultResponse?: string;
  /** 响应生成函数 */
  responseGenerator?: (prompt: string, options?: ContextLLMOptions) => string;
  /** 模拟延迟 (毫秒) */
  delay?: number;
  /** 模拟 Token 使用 */
  tokenUsage?: ContextTokenUsage;
  /** 嵌入向量维度 */
  embeddingDimension?: number;
  /** 模拟错误 */
  simulateError?: Error;
}

/** Mock LLM 请求记录 */
export interface MockLLMRequest {
  type: "chat" | "chatWithSystem" | "conversation" | "streamChat" | "embed" | "embedBatch" | "jsonChat";
  prompt?: string;
  systemPrompt?: string;
  messages?: ContextLLMMessage[];
  texts?: string[];
  options?: ContextLLMOptions;
  timestamp: Date;
}

/**
 * 创建 Mock LLM 客户端
 */
export function createMockLLMClient(
  config: MockLLMConfig = {}
): ContextLLMClient & {
  requests: MockLLMRequest[];
  setResponse: (response: string | ((prompt: string) => string)) => void;
  setError: (error: Error | null) => void;
  clear: () => void;
} {
  const {
    defaultResponse = "This is a mock LLM response.",
    responseGenerator,
    delay = 0,
    tokenUsage = { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    embeddingDimension = 1536,
    simulateError,
  } = config;

  const requests: MockLLMRequest[] = [];
  let currentResponse = defaultResponse;
  let currentResponseFn = responseGenerator;
  let currentError: Error | null = simulateError || null;
  let lastUsage: ContextTokenUsage | null = null;

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const getResponse = (prompt: string, options?: ContextLLMOptions): string => {
    if (currentResponseFn) {
      return currentResponseFn(prompt, options);
    }
    return currentResponse;
  };

  return {
    requests,

    async chat(prompt: string, options?: ContextLLMOptions): Promise<string> {
      requests.push({ type: "chat", prompt, options, timestamp: new Date() });
      if (currentError) throw currentError;
      if (delay > 0) await sleep(delay);
      lastUsage = tokenUsage;
      return getResponse(prompt, options);
    },

    async chatWithSystem(
      systemPrompt: string,
      userPrompt: string,
      options?: ContextLLMOptions
    ): Promise<string> {
      requests.push({
        type: "chatWithSystem",
        systemPrompt,
        prompt: userPrompt,
        options,
        timestamp: new Date(),
      });
      if (currentError) throw currentError;
      if (delay > 0) await sleep(delay);
      lastUsage = tokenUsage;
      return getResponse(userPrompt, options);
    },

    async conversation(
      messages: ContextLLMMessage[],
      options?: ContextLLMOptions
    ): Promise<string> {
      requests.push({ type: "conversation", messages, options, timestamp: new Date() });
      if (currentError) throw currentError;
      if (delay > 0) await sleep(delay);
      lastUsage = tokenUsage;
      const lastUserMessage = messages.filter((m) => m.role === "user").pop();
      return getResponse(lastUserMessage?.content || "", options);
    },

    async streamChat(
      prompt: string,
      onChunk: (text: string) => void,
      options?: ContextLLMOptions
    ): Promise<string> {
      requests.push({ type: "streamChat", prompt, options, timestamp: new Date() });
      if (currentError) throw currentError;

      const response = getResponse(prompt, options);
      const words = response.split(" ");

      for (let i = 0; i < words.length; i++) {
        if (delay > 0) await sleep(delay / words.length);
        onChunk(words[i] + (i < words.length - 1 ? " " : ""));
      }

      lastUsage = tokenUsage;
      return response;
    },

    async embed(text: string): Promise<number[]> {
      requests.push({ type: "embed", prompt: text, timestamp: new Date() });
      if (currentError) throw currentError;
      if (delay > 0) await sleep(delay);
      return Array.from({ length: embeddingDimension }, () => Math.random() * 2 - 1);
    },

    async embedBatch(texts: string[]): Promise<number[][]> {
      requests.push({ type: "embedBatch", texts, timestamp: new Date() });
      if (currentError) throw currentError;
      if (delay > 0) await sleep(delay);
      return texts.map(() =>
        Array.from({ length: embeddingDimension }, () => Math.random() * 2 - 1)
      );
    },

    async jsonChat<T = unknown>(prompt: string, options?: ContextLLMOptions): Promise<T> {
      requests.push({ type: "jsonChat", prompt, options, timestamp: new Date() });
      if (currentError) throw currentError;
      if (delay > 0) await sleep(delay);
      lastUsage = tokenUsage;
      const response = getResponse(prompt, options);
      try {
        return JSON.parse(response) as T;
      } catch {
        return { result: response } as T;
      }
    },

    getLastUsage(): ContextTokenUsage | null {
      return lastUsage;
    },

    setResponse(response: string | ((prompt: string) => string)): void {
      if (typeof response === "function") {
        currentResponseFn = response;
      } else {
        currentResponse = response;
        currentResponseFn = undefined;
      }
    },

    setError(error: Error | null): void {
      currentError = error;
    },

    clear(): void {
      requests.length = 0;
      currentResponse = defaultResponse;
      currentResponseFn = responseGenerator;
      currentError = null;
      lastUsage = null;
    },
  };
}

// ===== Mock 缓存 =====

/**
 * 创建 Mock 缓存接口
 */
export function createMockCache(
  initial: Record<string, unknown> = {}
): CacheInterface & {
  data: Record<string, { value: unknown; expiresAt?: number }>;
  clear: () => void;
} {
  const data: Record<string, { value: unknown; expiresAt?: number }> = {};

  // 初始化数据
  for (const [key, value] of Object.entries(initial)) {
    data[key] = { value };
  }

  const isExpired = (key: string): boolean => {
    const item = data[key];
    if (!item || item.expiresAt === undefined) return false;
    return Date.now() > item.expiresAt;
  };

  return {
    data,

    async get<T = unknown>(key: string): Promise<T | null> {
      if (isExpired(key)) {
        delete data[key];
        return null;
      }
      return (data[key]?.value as T) ?? null;
    },

    async set<T = unknown>(key: string, value: T, ttl?: number): Promise<void> {
      data[key] = {
        value,
        expiresAt: ttl ? Date.now() + ttl * 1000 : undefined,
      };
    },

    async delete(key: string): Promise<void> {
      delete data[key];
    },

    async exists(key: string): Promise<boolean> {
      if (isExpired(key)) {
        delete data[key];
        return false;
      }
      return key in data;
    },

    async getOrSet<T = unknown>(
      key: string,
      factory: () => T | Promise<T>,
      ttl?: number
    ): Promise<T> {
      const existing = await this.get<T>(key);
      if (existing !== null) {
        return existing;
      }
      const value = await factory();
      await this.set(key, value, ttl);
      return value;
    },

    clear(): void {
      for (const key of Object.keys(data)) {
        delete data[key];
      }
    },
  };
}

// ===== Mock 密钥管理 =====

/**
 * 创建 Mock 密钥管理接口
 */
export function createMockSecrets(
  initial: Record<string, string> = {}
): SecretsInterface & {
  data: Record<string, string>;
  set: (key: string, value: string) => void;
  clear: () => void;
} {
  const data: Record<string, string> = { ...initial };

  return {
    data,

    async get(key: string): Promise<string | undefined> {
      return data[key];
    },

    async has(key: string): Promise<boolean> {
      return key in data;
    },

    async getMany(keys: string[]): Promise<Record<string, string | undefined>> {
      const result: Record<string, string | undefined> = {};
      for (const key of keys) {
        result[key] = data[key];
      }
      return result;
    },

    async require(key: string): Promise<string> {
      const value = data[key];
      if (value === undefined) {
        throw new Error(`Required secret "${key}" not found`);
      }
      return value;
    },

    set(key: string, value: string): void {
      data[key] = value;
    },

    clear(): void {
      for (const key of Object.keys(data)) {
        delete data[key];
      }
    },
  };
}

// ===== Mock 进度报告 =====

/** 进度记录 */
export interface ProgressRecord {
  type: "report" | "startPhase" | "advance" | "completePhase" | "done";
  progress?: number;
  message?: string;
  phaseName?: string;
  total?: number;
  step?: number;
  timestamp: Date;
}

/**
 * 创建 Mock 进度报告接口
 */
export function createMockProgress(): ProgressInterface & {
  records: ProgressRecord[];
  currentPhase: { name: string; total?: number; current: number } | null;
  currentProgress: number;
  clear: () => void;
} {
  const records: ProgressRecord[] = [];
  let currentPhase: { name: string; total?: number; current: number } | null = null;
  let currentProgress = 0;

  return {
    records,
    get currentPhase() {
      return currentPhase;
    },
    get currentProgress() {
      return currentProgress;
    },

    report(progress: number, message?: string): void {
      currentProgress = Math.min(100, Math.max(0, progress));
      records.push({
        type: "report",
        progress: currentProgress,
        message,
        timestamp: new Date(),
      });
    },

    startPhase(name: string, total?: number): void {
      currentPhase = { name, total, current: 0 };
      records.push({
        type: "startPhase",
        phaseName: name,
        total,
        timestamp: new Date(),
      });
    },

    advance(step: number = 1, message?: string): void {
      if (currentPhase) {
        currentPhase.current += step;
        if (currentPhase.total) {
          currentProgress = Math.min(100, (currentPhase.current / currentPhase.total) * 100);
        }
      }
      records.push({
        type: "advance",
        step,
        message,
        progress: currentProgress,
        timestamp: new Date(),
      });
    },

    completePhase(): void {
      if (currentPhase && currentPhase.total) {
        currentPhase.current = currentPhase.total;
      }
      records.push({
        type: "completePhase",
        phaseName: currentPhase?.name,
        timestamp: new Date(),
      });
      currentPhase = null;
    },

    done(): void {
      currentProgress = 100;
      currentPhase = null;
      records.push({
        type: "done",
        progress: 100,
        timestamp: new Date(),
      });
    },

    clear(): void {
      records.length = 0;
      currentPhase = null;
      currentProgress = 0;
    },
  };
}

// ===== 测试上下文 =====

/** 扩展的测试上下文配置 */
export interface ExtendedTestContextConfig extends TestContextConfig {
  /** LLM Mock 配置 */
  llmConfig?: MockLLMConfig;
  /** 初始缓存数据 */
  cache?: Record<string, unknown>;
}

/**
 * 创建测试执行上下文
 */
export function createTestContext<TInputs extends Record<string, InputFieldConfig>>(
  inputs: Record<string, unknown>,
  config: ExtendedTestContextConfig = {}
): NodeExecutionContext<TInputs> & {
  logger: ReturnType<typeof createMockLogger>;
  httpClient: ReturnType<typeof createMockHttpClient>;
  storageClient: ReturnType<typeof createMockStorage>;
  llmClient: ReturnType<typeof createMockLLMClient>;
  cacheClient: ReturnType<typeof createMockCache>;
  secretsClient: ReturnType<typeof createMockSecrets>;
  progressClient: ReturnType<typeof createMockProgress>;
  progressReports: Array<{ progress: number; message?: string }>;
} {
  const logger = createMockLogger();
  const httpClient = createMockHttpClient();
  const storageClient = createMockStorage(config.storage);
  const llmClient = createMockLLMClient(config.llmConfig);
  const cacheClient = createMockCache(config.cache);
  const secretsClient = createMockSecrets(config.secrets);
  const progressClient = createMockProgress();
  const progressReports: Array<{ progress: number; message?: string }> = [];
  const abortController = new AbortController();

  return {
    nodeId: config.nodeId ?? "test-node",
    executionId: config.executionId ?? "test-execution",
    workflowId: config.workflowId ?? "test-workflow",
    inputs: inputs as any,
    log: logger,
    reportProgress: (progress: number, message?: string) => {
      progressReports.push({ progress, message });
      progressClient.report(progress, message);
    },
    getEnv: (key: string) => config.env?.[key],
    getSecret: async (key: string) => config.secrets?.[key],
    http: httpClient,
    signal: abortController.signal,
    storage: storageClient,

    // 新增 Context API
    llm: llmClient,
    cache: cacheClient,
    secrets: secretsClient,
    progress: progressClient,

    // 测试专用属性
    logger,
    httpClient,
    storageClient,
    llmClient,
    cacheClient,
    secretsClient,
    progressClient,
    progressReports,
  };
}

// ===== 节点测试器 =====

/** 测试结果 */
export interface TestResult<TOutput = unknown> {
  success: boolean;
  output?: TOutput;
  error?: Error;
  duration: number;
  logs: LogEntry[];
  httpRequests: MockHttpRequest[];
  progressReports: Array<{ progress: number; message?: string }>;
  validationResult?: ValidationResult;
}

/**
 * 节点测试器
 */
export class NodeTester<
  TInputs extends Record<string, InputFieldConfig>,
  TOutputs extends Record<string, unknown>
> {
  private node: NodeDefinition<TInputs, any>;
  private contextConfig: TestContextConfig = {};

  constructor(node: NodeDefinition<TInputs, any>) {
    this.node = node;
  }

  /**
   * 设置环境变量
   */
  withEnv(env: Record<string, string>): this {
    this.contextConfig.env = { ...this.contextConfig.env, ...env };
    return this;
  }

  /**
   * 设置密钥
   */
  withSecrets(secrets: Record<string, string>): this {
    this.contextConfig.secrets = { ...this.contextConfig.secrets, ...secrets };
    return this;
  }

  /**
   * 设置存储
   */
  withStorage(storage: Record<string, unknown>): this {
    this.contextConfig.storage = { ...this.contextConfig.storage, ...storage };
    return this;
  }

  /**
   * 执行节点测试
   */
  async execute(inputs: Record<string, unknown>): Promise<TestResult<TOutputs>> {
    const startTime = Date.now();
    const ctx = createTestContext<TInputs>(inputs, this.contextConfig);

    // 验证输入
    const validationResult = this.node.validateInputs(inputs);
    if (!validationResult.valid) {
      return {
        success: false,
        error: new Error(`输入验证失败: ${validationResult.errors.map(e => e.message).join(", ")}`),
        duration: Date.now() - startTime,
        logs: ctx.logger.logs,
        httpRequests: ctx.httpClient.requests,
        progressReports: ctx.progressReports,
        validationResult,
      };
    }

    try {
      const output = await this.node.execute(ctx);
      return {
        success: true,
        output: output as TOutputs,
        duration: Date.now() - startTime,
        logs: ctx.logger.logs,
        httpRequests: ctx.httpClient.requests,
        progressReports: ctx.progressReports,
        validationResult,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - startTime,
        logs: ctx.logger.logs,
        httpRequests: ctx.httpClient.requests,
        progressReports: ctx.progressReports,
        validationResult,
      };
    }
  }

  /**
   * 测试输入验证
   */
  testValidation(inputs: Record<string, unknown>): ValidationResult {
    return this.node.validateInputs(inputs);
  }
}

/**
 * 创建节点测试器
 */
export function createNodeTester<
  TInputs extends Record<string, InputFieldConfig>,
  TOutputs extends Record<string, unknown>
>(node: NodeDefinition<TInputs, any>): NodeTester<TInputs, TOutputs> {
  return new NodeTester(node);
}

// ===== 断言辅助 =====

/**
 * 断言辅助函数集合
 */
export const assert = {
  /**
   * 断言测试成功
   */
  success<T>(result: TestResult<T>): asserts result is TestResult<T> & { success: true; output: T } {
    if (!result.success) {
      throw new Error(`期望执行成功，但失败了: ${result.error?.message}`);
    }
  },

  /**
   * 断言测试失败
   */
  failure(result: TestResult): asserts result is TestResult & { success: false; error: Error } {
    if (result.success) {
      throw new Error("期望执行失败，但成功了");
    }
  },

  /**
   * 断言输出值
   */
  outputEquals<T>(result: TestResult<T>, expected: Partial<T>): void {
    if (!result.success || !result.output) {
      throw new Error("无法断言输出：执行未成功或无输出");
    }
    for (const [key, value] of Object.entries(expected)) {
      const actual = (result.output as Record<string, unknown>)[key];
      if (actual !== value) {
        throw new Error(`输出 "${key}" 不匹配: 期望 ${JSON.stringify(value)}, 实际 ${JSON.stringify(actual)}`);
      }
    }
  },

  /**
   * 断言有日志记录
   */
  hasLog(result: TestResult, level: LogEntry["level"], messagePattern?: string | RegExp): void {
    const matchingLogs = result.logs.filter((log) => {
      if (log.level !== level) return false;
      if (!messagePattern) return true;
      if (typeof messagePattern === "string") {
        return log.message.includes(messagePattern);
      }
      return messagePattern.test(log.message);
    });

    if (matchingLogs.length === 0) {
      throw new Error(`未找到匹配的 ${level} 级别日志`);
    }
  },

  /**
   * 断言有 HTTP 请求
   */
  hasHttpRequest(result: TestResult, method: string, urlPattern?: string | RegExp): void {
    const matchingRequests = result.httpRequests.filter((req) => {
      if (req.method !== method) return false;
      if (!urlPattern) return true;
      if (typeof urlPattern === "string") {
        return req.url.includes(urlPattern);
      }
      return urlPattern.test(req.url);
    });

    if (matchingRequests.length === 0) {
      throw new Error(`未找到匹配的 ${method} 请求`);
    }
  },

  /**
   * 断言验证通过
   */
  validationPasses(result: ValidationResult): void {
    if (!result.valid) {
      throw new Error(`验证失败: ${result.errors.map(e => e.message).join(", ")}`);
    }
  },

  /**
   * 断言验证失败
   */
  validationFails(result: ValidationResult, expectedField?: string): void {
    if (result.valid) {
      throw new Error("期望验证失败，但通过了");
    }
    if (expectedField) {
      const hasFieldError = result.errors.some(e => e.field === expectedField);
      if (!hasFieldError) {
        throw new Error(`期望字段 "${expectedField}" 验证失败`);
      }
    }
  },
};

// ===== 测试套件 =====

/** 测试用例 */
export interface TestCase<TInputs = Record<string, unknown>, TOutputs = Record<string, unknown>> {
  name: string;
  inputs: TInputs;
  expected?: Partial<TOutputs>;
  shouldFail?: boolean;
  errorMessage?: string | RegExp;
}

/**
 * 运行测试套件
 */
export async function runTestSuite<
  TInputs extends Record<string, InputFieldConfig>,
  TOutputs extends Record<string, unknown>
>(
  node: NodeDefinition<TInputs, any>,
  testCases: TestCase<Record<string, unknown>, TOutputs>[]
): Promise<{
  passed: number;
  failed: number;
  results: Array<{ name: string; passed: boolean; error?: string }>;
}> {
  const tester = createNodeTester<TInputs, TOutputs>(node);
  const results: Array<{ name: string; passed: boolean; error?: string }> = [];
  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      const result = await tester.execute(testCase.inputs);

      if (testCase.shouldFail) {
        if (result.success) {
          results.push({ name: testCase.name, passed: false, error: "期望失败但成功了" });
          failed++;
        } else if (testCase.errorMessage) {
          const errorMatches = typeof testCase.errorMessage === "string"
            ? result.error?.message.includes(testCase.errorMessage)
            : testCase.errorMessage.test(result.error?.message || "");
          if (!errorMatches) {
            results.push({
              name: testCase.name,
              passed: false,
              error: `错误消息不匹配: ${result.error?.message}`,
            });
            failed++;
          } else {
            results.push({ name: testCase.name, passed: true });
            passed++;
          }
        } else {
          results.push({ name: testCase.name, passed: true });
          passed++;
        }
      } else {
        if (!result.success) {
          results.push({ name: testCase.name, passed: false, error: result.error?.message });
          failed++;
        } else if (testCase.expected) {
          try {
            assert.outputEquals(result, testCase.expected);
            results.push({ name: testCase.name, passed: true });
            passed++;
          } catch (e) {
            results.push({ name: testCase.name, passed: false, error: (e as Error).message });
            failed++;
          }
        } else {
          results.push({ name: testCase.name, passed: true });
          passed++;
        }
      }
    } catch (error) {
      results.push({
        name: testCase.name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
      failed++;
    }
  }

  return { passed, failed, results };
}
