/**
 * Cache Policy Configuration
 * 
 * Cache policies used with TanStack Query
 */

// ===== Cache Time Constants (ms) =====
export const CACHE_TIMES = {
 // Real-time data (no cache)
 INSTANT: 0,
 // Short cache (1 min) - Frequently changing data
 SHORT: 1 * 60 * 1000,
 // Medium cache (5 min) - Default
 MEDIUM: 5 * 60 * 1000,
 // Long cache (30 min) - Infrequently changing data
 LONG: 30 * 60 * 1000,
 // Persistent cache (1 h) - Rarely changing data
 PERSISTENT: 60 * 60 * 1000,
 // Permanent cache - Static data
 FOREVER: Infinity,
};

// ===== API Cache Policies =====
export const API_CACHE_CONFIG = {
 // User related
 user: {
 profile: { staleTime: CACHE_TIMES.MEDIUM, gcTime: CACHE_TIMES.LONG },
 settings: { staleTime: CACHE_TIMES.LONG, gcTime: CACHE_TIMES.PERSISTENT },
 },
 
 // Workflow related
 workflow: {
 list: { staleTime: CACHE_TIMES.SHORT, gcTime: CACHE_TIMES.MEDIUM },
 detail: { staleTime: CACHE_TIMES.MEDIUM, gcTime: CACHE_TIMES.LONG },
 executions: { staleTime: CACHE_TIMES.SHORT, gcTime: CACHE_TIMES.MEDIUM },
 },
 
 // API Key
 apiKeys: {
 list: { staleTime: CACHE_TIMES.LONG, gcTime: CACHE_TIMES.PERSISTENT },
 providers: { staleTime: CACHE_TIMES.PERSISTENT, gcTime: CACHE_TIMES.FOREVER },
 },
 
 // Execution related
 execution: {
 status: { staleTime: CACHE_TIMES.INSTANT, gcTime: CACHE_TIMES.SHORT }, // Real-time data
 logs: { staleTime: CACHE_TIMES.SHORT, gcTime: CACHE_TIMES.MEDIUM },
 },
 
 // Agent Store
 store: {
 list: { staleTime: CACHE_TIMES.MEDIUM, gcTime: CACHE_TIMES.LONG },
 detail: { staleTime: CACHE_TIMES.MEDIUM, gcTime: CACHE_TIMES.LONG },
 categories: { staleTime: CACHE_TIMES.PERSISTENT, gcTime: CACHE_TIMES.FOREVER },
 },
};

// ===== Query Keys =====
export const queryKeys = {
 // User
 user: {
 all: ["user"] as const,
 profile: () => [...queryKeys.user.all, "profile"] as const,
 settings: () => [...queryKeys.user.all, "settings"] as const,
 },
 
 // Workflow
 workflows: {
 all: ["workflows"] as const,
 lists: () => [...queryKeys.workflows.all, "list"] as const,
 list: (filters: Record<string, unknown>) => [...queryKeys.workflows.lists(), filters] as const,
 details: () => [...queryKeys.workflows.all, "detail"] as const,
 detail: (id: string) => [...queryKeys.workflows.details(), id] as const,
 executions: (workflowId: string) => [...queryKeys.workflows.all, "executions", workflowId] as const,
 },
 
 // API Key
 apiKeys: {
 all: ["apiKeys"] as const,
 list: () => [...queryKeys.apiKeys.all, "list"] as const,
 providers: () => [...queryKeys.apiKeys.all, "providers"] as const,
 },
 
 // Executions
 executions: {
 all: ["executions"] as const,
 lists: () => [...queryKeys.executions.all, "list"] as const,
 list: (params: Record<string, unknown>) => [...queryKeys.executions.lists(), params] as const,
 details: () => [...queryKeys.executions.all, "detail"] as const,
 detail: (id: string) => [...queryKeys.executions.details(), id] as const,
 logs: (id: string) => [...queryKeys.executions.all, "logs", id] as const,
 },
 
 // Store
 store: {
 all: ["store"] as const,
 agents: (filters?: Record<string, unknown>) => [...queryKeys.store.all, "agents", filters] as const,
 agent: (id: string) => [...queryKeys.store.all, "agent", id] as const,
 categories: () => [...queryKeys.store.all, "categories"] as const,
 },
};

// ===== Cache Invalidation Utility =====
export function invalidateKeys(queryClient: unknown, keys: readonly string[][]) {
 const client = queryClient as {
 invalidateQueries: (options: { queryKey: readonly string[] }) => void;
 };
 keys.forEach((key) => {
 client.invalidateQueries({ queryKey: key });
 });
}

// ===== Optimistic Update Utility =====
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

 // Save previous data
 const previousData = client.getQueryData(queryKey);

 // Apply optimistic update
 const newData = updater(previousData);
 client.setQueryData(queryKey, newData);

 // Return rollback function
 return {
 previousData,
 rollback: () => {
 if (previousData !== undefined) {
 client.setQueryData(queryKey, previousData);
 }
 },
 onError: (error: Error) => {
 // Rollback on error
 if (previousData !== undefined) {
 client.setQueryData(queryKey, previousData);
 }
 onError?.(error, { previousData });
 },
 };
}

// ===== Local Storage Cache =====
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
 // Ignore storage errors
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

// ===== Request Deduplication =====
const pendingRequests = new Map<string, Promise<unknown>>();

export async function dedupeRequest<T>(
 key: string,
 request: () => Promise<T>
): Promise<T> {
 // Check if there's an identical request currently in progress
 const pending = pendingRequests.get(key);
 if (pending) {
 return pending as Promise<T>;
 }

 // Create new request
 const promise = request()
 .finally(() => {
 pendingRequests.delete(key);
 });

 pendingRequests.set(key, promise);
 return promise;
}
