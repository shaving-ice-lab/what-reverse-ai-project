/**
 * 缓存策略配置
 * 
 * 与 TanStack Query 配合使用的缓存策略
 */

// ===== 缓存时间常量 (毫秒) =====
export const CACHE_TIMES = {
  // 即时数据（不缓存）
  INSTANT: 0,
  // 短期缓存（1分钟）- 频繁变化的数据
  SHORT: 1 * 60 * 1000,
  // 中期缓存（5分钟）- 默认
  MEDIUM: 5 * 60 * 1000,
  // 长期缓存（30分钟）- 较少变化的数据
  LONG: 30 * 60 * 1000,
  // 持久缓存（1小时）- 几乎不变的数据
  PERSISTENT: 60 * 60 * 1000,
  // 永久缓存 - 静态数据
  FOREVER: Infinity,
};

// ===== 不同 API 的缓存策略 =====
export const API_CACHE_CONFIG = {
  // 用户相关
  user: {
    profile: { staleTime: CACHE_TIMES.MEDIUM, gcTime: CACHE_TIMES.LONG },
    settings: { staleTime: CACHE_TIMES.LONG, gcTime: CACHE_TIMES.PERSISTENT },
  },
  
  // 工作流相关
  workflow: {
    list: { staleTime: CACHE_TIMES.SHORT, gcTime: CACHE_TIMES.MEDIUM },
    detail: { staleTime: CACHE_TIMES.MEDIUM, gcTime: CACHE_TIMES.LONG },
    executions: { staleTime: CACHE_TIMES.SHORT, gcTime: CACHE_TIMES.MEDIUM },
  },
  
  // API 密钥
  apiKeys: {
    list: { staleTime: CACHE_TIMES.LONG, gcTime: CACHE_TIMES.PERSISTENT },
    providers: { staleTime: CACHE_TIMES.PERSISTENT, gcTime: CACHE_TIMES.FOREVER },
  },
  
  // 执行相关
  execution: {
    status: { staleTime: CACHE_TIMES.INSTANT, gcTime: CACHE_TIMES.SHORT }, // 实时数据
    logs: { staleTime: CACHE_TIMES.SHORT, gcTime: CACHE_TIMES.MEDIUM },
  },
  
  // Agent 商店
  store: {
    list: { staleTime: CACHE_TIMES.MEDIUM, gcTime: CACHE_TIMES.LONG },
    detail: { staleTime: CACHE_TIMES.MEDIUM, gcTime: CACHE_TIMES.LONG },
    categories: { staleTime: CACHE_TIMES.PERSISTENT, gcTime: CACHE_TIMES.FOREVER },
  },
};

// ===== Query Keys 工厂 =====
export const queryKeys = {
  // 用户
  user: {
    all: ["user"] as const,
    profile: () => [...queryKeys.user.all, "profile"] as const,
    settings: () => [...queryKeys.user.all, "settings"] as const,
  },
  
  // 工作流
  workflows: {
    all: ["workflows"] as const,
    lists: () => [...queryKeys.workflows.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.workflows.lists(), filters] as const,
    details: () => [...queryKeys.workflows.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.workflows.details(), id] as const,
    executions: (workflowId: string) => [...queryKeys.workflows.all, "executions", workflowId] as const,
  },
  
  // API 密钥
  apiKeys: {
    all: ["apiKeys"] as const,
    list: () => [...queryKeys.apiKeys.all, "list"] as const,
    providers: () => [...queryKeys.apiKeys.all, "providers"] as const,
  },
  
  // 执行
  executions: {
    all: ["executions"] as const,
    lists: () => [...queryKeys.executions.all, "list"] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.executions.lists(), params] as const,
    details: () => [...queryKeys.executions.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.executions.details(), id] as const,
    logs: (id: string) => [...queryKeys.executions.all, "logs", id] as const,
  },
  
  // 商店
  store: {
    all: ["store"] as const,
    agents: (filters?: Record<string, unknown>) => [...queryKeys.store.all, "agents", filters] as const,
    agent: (id: string) => [...queryKeys.store.all, "agent", id] as const,
    categories: () => [...queryKeys.store.all, "categories"] as const,
  },
};

// ===== 缓存失效工具 =====
export function invalidateKeys(queryClient: unknown, keys: readonly string[][]) {
  const client = queryClient as {
    invalidateQueries: (options: { queryKey: readonly string[] }) => void;
  };
  keys.forEach((key) => {
    client.invalidateQueries({ queryKey: key });
  });
}

// ===== 乐观更新工具 =====
interface OptimisticUpdateOptions<T> {
  queryClient: unknown;
  queryKey: readonly string[];
  updater: (old: T | undefined) => T;
  onError?: (error: Error, context: { previousData: T | undefined }) => void;
}

export function createOptimisticUpdate<T>({
  queryClient,
  queryKey,
  updater,
  onError,
}: OptimisticUpdateOptions<T>) {
  const client = queryClient as {
    getQueryData: (key: readonly string[]) => T | undefined;
    setQueryData: (key: readonly string[], data: T) => void;
  };

  // 保存之前的数据
  const previousData = client.getQueryData(queryKey);

  // 乐观更新
  const newData = updater(previousData);
  client.setQueryData(queryKey, newData);

  // 返回回滚函数
  return {
    previousData,
    rollback: () => {
      if (previousData !== undefined) {
        client.setQueryData(queryKey, previousData);
      }
    },
    onError: (error: Error) => {
      // 回滚
      if (previousData !== undefined) {
        client.setQueryData(queryKey, previousData);
      }
      onError?.(error, { previousData });
    },
  };
}

// ===== 本地存储缓存 =====
const STORAGE_PREFIX = "agentflow_cache_";

export const localCache = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      if (!item) return null;
      
      const { data, expiry } = JSON.parse(item);
      if (expiry && Date.now() > expiry) {
        localStorage.removeItem(STORAGE_PREFIX + key);
        return null;
      }
      return data as T;
    } catch {
      return null;
    }
  },

  set<T>(key: string, data: T, ttl?: number): void {
    try {
      const item = {
        data,
        expiry: ttl ? Date.now() + ttl : null,
      };
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(item));
    } catch {
      // 忽略存储错误
    }
  },

  remove(key: string): void {
    localStorage.removeItem(STORAGE_PREFIX + key);
  },

  clear(): void {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(STORAGE_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  },
};

// ===== 请求去重 =====
const pendingRequests = new Map<string, Promise<unknown>>();

export async function dedupeRequest<T>(
  key: string,
  request: () => Promise<T>
): Promise<T> {
  // 检查是否有相同请求正在进行
  const pending = pendingRequests.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  // 创建新请求
  const promise = request()
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, promise);
  return promise;
}
