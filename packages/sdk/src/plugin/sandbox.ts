/**
 * 插件沙箱环境
 * 
 * 提供安全的插件执行环境，限制插件对系统资源的访问
 */

import type {
  PluginManifest,
  PluginPermission,
  PluginAPI,
  PluginLogger,
} from "./types";

// ===== 沙箱配置 =====

/** 沙箱配置 */
export interface SandboxConfig {
  /** 允许的权限 */
  permissions: PluginPermission[];
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 内存限制（字节） */
  memoryLimit?: number;
  /** 是否允许网络访问 */
  allowNetwork?: boolean;
  /** 允许访问的 URL 模式 */
  allowedUrls?: string[];
  /** 是否允许文件系统访问 */
  allowFileSystem?: boolean;
  /** 允许访问的路径 */
  allowedPaths?: string[];
}

/** 沙箱上下文 */
export interface SandboxContext {
  /** 插件 ID */
  pluginId: string;
  /** 权限集合 */
  permissions: Set<PluginPermission>;
  /** 日志器 */
  logger: PluginLogger;
  /** 开始时间 */
  startTime: number;
  /** 是否已终止 */
  terminated: boolean;
}

// ===== 权限检查 =====

/**
 * 权限检查器
 */
export class PermissionChecker {
  private permissions: Set<PluginPermission>;

  constructor(permissions: PluginPermission[]) {
    this.permissions = new Set(permissions);
  }

  /**
   * 检查是否有权限
   */
  has(permission: PluginPermission): boolean {
    return this.permissions.has(permission);
  }

  /**
   * 要求权限（没有则抛出错误）
   */
  require(permission: PluginPermission): void {
    if (!this.has(permission)) {
      throw new PermissionDeniedError(permission);
    }
  }

  /**
   * 检查多个权限
   */
  hasAll(...permissions: PluginPermission[]): boolean {
    return permissions.every((p) => this.has(p));
  }

  /**
   * 检查是否有任一权限
   */
  hasAny(...permissions: PluginPermission[]): boolean {
    return permissions.some((p) => this.has(p));
  }

  /**
   * 获取所有权限
   */
  getAll(): PluginPermission[] {
    return Array.from(this.permissions);
  }
}

/**
 * 权限拒绝错误
 */
export class PermissionDeniedError extends Error {
  permission: PluginPermission;

  constructor(permission: PluginPermission) {
    super(`Permission denied: ${permission}`);
    this.name = "PermissionDeniedError";
    this.permission = permission;
  }
}

// ===== 沙箱 API 代理 =====

/**
 * 创建沙箱化的 API
 */
export function createSandboxedAPI(
  api: PluginAPI,
  manifest: PluginManifest,
  logger: PluginLogger
): PluginAPI {
  const permissions = new PermissionChecker(manifest.permissions || []);

  return {
    commands: createSandboxedCommands(api.commands, permissions, logger),
    workflows: createSandboxedWorkflows(api.workflows, permissions, logger),
    storage: createSandboxedStorage(api.storage, permissions, logger),
    ui: createSandboxedUI(api.ui, permissions, logger),
    events: api.events, // 事件 API 通常是只读的
  };
}

/**
 * 沙箱化命令 API
 */
function createSandboxedCommands(
  commands: PluginAPI["commands"],
  permissions: PermissionChecker,
  logger: PluginLogger
): PluginAPI["commands"] {
  return {
    registerCommand: (id, handler) => {
      logger.debug(`Registering command: ${id}`);
      return commands.registerCommand(id, (...args) => {
        logger.debug(`Executing command: ${id}`);
        return handler(...args);
      });
    },
    executeCommand: async (id, ...args) => {
      logger.debug(`Requesting command execution: ${id}`);
      return commands.executeCommand(id, ...args);
    },
    getCommands: () => commands.getCommands(),
  };
}

/**
 * 沙箱化工作流 API
 */
function createSandboxedWorkflows(
  workflows: PluginAPI["workflows"],
  permissions: PermissionChecker,
  logger: PluginLogger
): PluginAPI["workflows"] {
  return {
    getWorkflows: async () => {
      permissions.require("api:workflows");
      return workflows.getWorkflows();
    },
    getWorkflow: async (id) => {
      permissions.require("api:workflows");
      return workflows.getWorkflow(id);
    },
    createWorkflow: async (data) => {
      permissions.require("api:workflows");
      logger.info(`Creating workflow: ${data.name}`);
      return workflows.createWorkflow(data);
    },
    updateWorkflow: async (id, data) => {
      permissions.require("api:workflows");
      logger.info(`Updating workflow: ${id}`);
      return workflows.updateWorkflow(id, data);
    },
    deleteWorkflow: async (id) => {
      permissions.require("api:workflows");
      logger.warn(`Deleting workflow: ${id}`);
      return workflows.deleteWorkflow(id);
    },
    executeWorkflow: async (id, inputs) => {
      permissions.require("api:executions");
      logger.info(`Executing workflow: ${id}`);
      return workflows.executeWorkflow(id, inputs);
    },
  };
}

/**
 * 沙箱化存储 API
 */
function createSandboxedStorage(
  storage: PluginAPI["storage"],
  permissions: PermissionChecker,
  logger: PluginLogger
): PluginAPI["storage"] {
  return {
    get: async (key) => {
      permissions.require("storage");
      return storage.get(key);
    },
    set: async (key, value) => {
      permissions.require("storage");
      logger.debug(`Storage set: ${key}`);
      return storage.set(key, value);
    },
    delete: async (key) => {
      permissions.require("storage");
      logger.debug(`Storage delete: ${key}`);
      return storage.delete(key);
    },
    keys: async () => {
      permissions.require("storage");
      return storage.keys();
    },
  };
}

/**
 * 沙箱化 UI API
 */
function createSandboxedUI(
  ui: PluginAPI["ui"],
  permissions: PermissionChecker,
  logger: PluginLogger
): PluginAPI["ui"] {
  return {
    showMessage: (message, type) => {
      logger.debug(`Showing message: ${message}`);
      ui.showMessage(message, type);
    },
    showNotification: (options) => {
      permissions.require("notifications");
      logger.debug(`Showing notification: ${options.message}`);
      ui.showNotification(options);
    },
    showQuickPick: async (items, options) => {
      return ui.showQuickPick(items, options);
    },
    showInputBox: async (options) => {
      return ui.showInputBox(options);
    },
    createStatusBarItem: (options) => {
      permissions.require("ui:toolbar");
      return ui.createStatusBarItem(options);
    },
  };
}

// ===== 安全的 HTTP 客户端 =====

/** HTTP 请求选项 */
export interface SafeHttpOptions {
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * 创建安全的 HTTP 客户端
 */
export function createSafeHttpClient(
  permissions: PermissionChecker,
  config: { allowedUrls?: string[] } = {}
): {
  get: (url: string, options?: SafeHttpOptions) => Promise<unknown>;
  post: (url: string, data?: unknown, options?: SafeHttpOptions) => Promise<unknown>;
} {
  const checkUrl = (url: string) => {
    permissions.require("network");

    if (config.allowedUrls && config.allowedUrls.length > 0) {
      const isAllowed = config.allowedUrls.some((pattern) => {
        if (pattern === "*") return true;
        if (pattern.includes("*")) {
          const regex = new RegExp(pattern.replace(/\*/g, ".*"));
          return regex.test(url);
        }
        return url.startsWith(pattern);
      });

      if (!isAllowed) {
        throw new Error(`URL not allowed: ${url}`);
      }
    }
  };

  return {
    get: async (url: string, options?: SafeHttpOptions) => {
      checkUrl(url);
      const response = await fetch(url, {
        method: "GET",
        headers: options?.headers,
        signal: options?.timeout
          ? AbortSignal.timeout(options.timeout)
          : undefined,
      });
      return response.json();
    },
    post: async (url: string, data?: unknown, options?: SafeHttpOptions) => {
      checkUrl(url);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: options?.timeout
          ? AbortSignal.timeout(options.timeout)
          : undefined,
      });
      return response.json();
    },
  };
}

// ===== 执行超时 =====

/**
 * 带超时的执行
 */
export async function executeWithTimeout<T>(
  fn: () => Promise<T>,
  timeout: number
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Execution timeout")), timeout)
    ),
  ]);
}

// ===== 资源限制 =====

/**
 * 资源监控器
 */
export class ResourceMonitor {
  private startMemory: number;
  private memoryLimit: number;
  private interval: NodeJS.Timeout | null = null;

  constructor(memoryLimit: number) {
    this.startMemory = this.getCurrentMemory();
    this.memoryLimit = memoryLimit;
  }

  /**
   * 开始监控
   */
  start(onLimitExceeded: () => void): void {
    this.interval = setInterval(() => {
      const currentMemory = this.getCurrentMemory();
      const used = currentMemory - this.startMemory;

      if (used > this.memoryLimit) {
        this.stop();
        onLimitExceeded();
      }
    }, 1000);
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * 获取当前内存使用
   */
  private getCurrentMemory(): number {
    if (typeof process !== "undefined" && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  /**
   * 获取已使用内存
   */
  getUsedMemory(): number {
    return this.getCurrentMemory() - this.startMemory;
  }
}

// ===== 沙箱执行器 =====

/**
 * 沙箱执行器
 */
export class SandboxExecutor {
  private config: SandboxConfig;
  private logger: PluginLogger;

  constructor(config: SandboxConfig, logger: PluginLogger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * 在沙箱中执行函数
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const timeout = this.config.timeout || 30000;
    const memoryLimit = this.config.memoryLimit || 50 * 1024 * 1024; // 50MB

    // 创建资源监控
    const monitor = new ResourceMonitor(memoryLimit);
    let terminated = false;

    const cleanup = () => {
      monitor.stop();
    };

    monitor.start(() => {
      terminated = true;
      this.logger.error("Memory limit exceeded");
    });

    try {
      const result = await executeWithTimeout(async () => {
        if (terminated) {
          throw new Error("Execution terminated due to resource limit");
        }
        return fn();
      }, timeout);

      return result;
    } finally {
      cleanup();
    }
  }
}
