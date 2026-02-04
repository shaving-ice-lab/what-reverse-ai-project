/**
 * Admin 日志与追踪工具
 * 提供 trace_id/request_id 透传支持
 */

// ===== Types =====

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  traceId?: string;
  requestId?: string;
  userId?: string;
  module?: string;
  action?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// ===== Trace Context =====

let globalTraceId: string | null = null;
let globalRequestId: string | null = null;

const generateUuid = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
};

/**
 * 生成新的 trace_id
 */
export function generateTraceId(): string {
  return `trace-${generateUuid()}`;
}

/**
 * 生成新的 request_id
 */
export function generateRequestId(): string {
  return `req-${generateUuid()}`;
}

/**
 * 设置全局 trace_id
 */
export function setTraceId(traceId: string): void {
  globalTraceId = traceId;
}

/**
 * 获取当前 trace_id
 */
export function getTraceId(): string {
  if (!globalTraceId) {
    globalTraceId = generateTraceId();
  }
  return globalTraceId;
}

/**
 * 设置全局 request_id
 */
export function setRequestId(requestId: string): void {
  globalRequestId = requestId;
}

/**
 * 获取当前 request_id
 */
export function getRequestId(): string {
  if (!globalRequestId) {
    globalRequestId = generateRequestId();
  }
  return globalRequestId;
}

/**
 * 清除追踪上下文
 */
export function clearTraceContext(): void {
  globalTraceId = null;
  globalRequestId = null;
}

/**
 * 创建新的请求上下文
 */
export function createRequestContext(): { traceId: string; requestId: string } {
  const traceId = getTraceId();
  const requestId = generateRequestId();
  setRequestId(requestId);
  return { traceId, requestId };
}

// ===== Logger Configuration =====

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  sampleRate: number; // 0-1, 用于采样
  maxBufferSize: number;
}

const defaultConfig: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  enableConsole: true,
  enableRemote: process.env.NODE_ENV === 'production',
  remoteEndpoint: process.env.NEXT_PUBLIC_LOG_ENDPOINT,
  sampleRate: 1,
  maxBufferSize: 100,
};

let config = { ...defaultConfig };

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ===== Log Buffer for Remote =====

const logBuffer: LogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[config.level];
}

function shouldSample(): boolean {
  return Math.random() < config.sampleRate;
}

function formatLogEntry(
  level: LogLevel,
  message: string,
  context: LogContext = {},
  error?: Error
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context: {
      traceId: context.traceId || getTraceId(),
      requestId: context.requestId || globalRequestId || undefined,
      ...context,
    },
    ...(error && {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    }),
  };
}

function consoleLog(entry: LogEntry): void {
  if (!config.enableConsole) return;

  const { level, message, context, error } = entry;
  const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
  const traceInfo = context.traceId ? ` [${context.traceId}]` : '';
  const requestInfo = context.requestId ? ` [${context.requestId}]` : '';

  const fullPrefix = `${prefix}${traceInfo}${requestInfo}`;

  switch (level) {
    case 'debug':
      console.debug(fullPrefix, message, context);
      break;
    case 'info':
      console.info(fullPrefix, message, context);
      break;
    case 'warn':
      console.warn(fullPrefix, message, context);
      break;
    case 'error':
      console.error(fullPrefix, message, context, error);
      break;
  }
}

async function flushLogs(): Promise<void> {
  if (!config.enableRemote || !config.remoteEndpoint || logBuffer.length === 0) {
    return;
  }

  const logsToSend = [...logBuffer];
  logBuffer.length = 0;

  try {
    await fetch(config.remoteEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Trace-ID': getTraceId(),
      },
      body: JSON.stringify({ logs: logsToSend }),
    });
  } catch (err) {
    // 发送失败时，将日志放回缓冲区（如果空间足够）
    if (logBuffer.length + logsToSend.length <= config.maxBufferSize) {
      logBuffer.unshift(...logsToSend);
    }
    console.error('Failed to flush logs:', err);
  }
}

function bufferLog(entry: LogEntry): void {
  if (!config.enableRemote) return;

  logBuffer.push(entry);

  if (logBuffer.length >= config.maxBufferSize) {
    flushLogs();
  } else if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flushLogs();
    }, 5000);
  }
}

// ===== Logger Functions =====

function log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
  if (!shouldLog(level)) return;
  if (!shouldSample() && level !== 'error') return;

  const entry = formatLogEntry(level, message, context, error);
  consoleLog(entry);
  bufferLog(entry);
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    log('debug', message, context);
  },

  info(message: string, context?: LogContext): void {
    log('info', message, context);
  },

  warn(message: string, context?: LogContext): void {
    log('warn', message, context);
  },

  error(message: string, error?: Error, context?: LogContext): void {
    log('error', message, context, error);
  },

  /**
   * 带计时的日志方法
   */
  time<T>(
    label: string,
    fn: () => T | Promise<T>,
    context?: LogContext
  ): T | Promise<T> {
    const startTime = performance.now();
    const result = fn();

    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = Math.round(performance.now() - startTime);
        log('info', `${label} completed`, { ...context, duration });
      });
    }

    const duration = Math.round(performance.now() - startTime);
    log('info', `${label} completed`, { ...context, duration });
    return result;
  },

  /**
   * 配置日志器
   */
  configure(newConfig: Partial<LoggerConfig>): void {
    config = { ...config, ...newConfig };
  },

  /**
   * 立即刷新日志缓冲区
   */
  flush(): Promise<void> {
    return flushLogs();
  },

  /**
   * 创建带模块名称的子日志器
   */
  child(module: string): ModuleLogger {
    return new ModuleLogger(module);
  },
};

// ===== Module Logger =====

class ModuleLogger {
  constructor(private module: string) {}

  debug(message: string, context?: Omit<LogContext, 'module'>): void {
    logger.debug(message, { ...context, module: this.module });
  }

  info(message: string, context?: Omit<LogContext, 'module'>): void {
    logger.info(message, { ...context, module: this.module });
  }

  warn(message: string, context?: Omit<LogContext, 'module'>): void {
    logger.warn(message, { ...context, module: this.module });
  }

  error(message: string, error?: Error, context?: Omit<LogContext, 'module'>): void {
    logger.error(message, error, { ...context, module: this.module });
  }

  time<T>(label: string, fn: () => T | Promise<T>, context?: Omit<LogContext, 'module'>): T | Promise<T> {
    return logger.time(label, fn, { ...context, module: this.module });
  }
}

// ===== Performance Monitoring =====

export interface PerformanceMark {
  name: string;
  startTime: number;
  context?: LogContext;
}

const performanceMarks = new Map<string, PerformanceMark>();

export function startMark(name: string, context?: LogContext): void {
  performanceMarks.set(name, {
    name,
    startTime: performance.now(),
    context,
  });
}

export function endMark(name: string, additionalContext?: LogContext): number | null {
  const mark = performanceMarks.get(name);
  if (!mark) {
    logger.warn(`Performance mark '${name}' not found`);
    return null;
  }

  const duration = Math.round(performance.now() - mark.startTime);
  performanceMarks.delete(name);

  logger.info(`Performance: ${name}`, {
    ...mark.context,
    ...additionalContext,
    duration,
    action: 'performance_mark',
  });

  return duration;
}

// ===== Request Tracing Headers =====

export function getTraceHeaders(): Record<string, string> {
  return {
    'X-Trace-ID': getTraceId(),
    'X-Request-ID': getRequestId(),
  };
}

// ===== Audit Logging =====

export interface AuditLogEntry {
  action: string;
  targetType: string;
  targetId: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export function logAudit(entry: AuditLogEntry): void {
  logger.info(`Audit: ${entry.action}`, {
    ...entry,
    traceId: getTraceId(),
    requestId: getRequestId(),
  });
}

// ===== Browser Lifecycle =====

if (typeof window !== 'undefined') {
  // 页面卸载前刷新日志
  window.addEventListener('beforeunload', () => {
    flushLogs();
  });

  // 页面可见性变化时刷新日志
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushLogs();
    }
  });

  // 每次导航时创建新的 trace_id
  if ('navigation' in performance) {
    const navEntry = performance.getEntriesByType('navigation')[0];
    if (navEntry) {
      clearTraceContext();
    }
  }
}

export default logger;
