/**
 * 插件市场基础
 */

import type { PluginManifest, PluginCategory, PluginPermission } from "./types";

// ===== 市场类型定义 =====

/** 插件市场项 */
export interface MarketplacePlugin {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  publisher: string;
  category: PluginCategory;
  tags: string[];
  icon?: string;
  banner?: string;
  repository?: string;
  homepage?: string;
  license?: string;
  permissions: PluginPermission[];
  rating: number;
  ratingCount: number;
  downloadCount: number;
  verified: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  latestVersion: string;
  versions: PluginVersionInfo[];
}

/** 插件版本信息 */
export interface PluginVersionInfo {
  version: string;
  releaseDate: Date;
  changelog?: string;
  minAppVersion?: string;
  maxAppVersion?: string;
  downloadUrl: string;
  size: number;
  checksum: string;
}

/** 搜索选项 */
export interface SearchOptions {
  query?: string;
  category?: PluginCategory;
  tags?: string[];
  author?: string;
  verified?: boolean;
  featured?: boolean;
  sortBy?: "relevance" | "downloads" | "rating" | "updated" | "name";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

/** 搜索结果 */
export interface SearchResult {
  plugins: MarketplacePlugin[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 市场统计 */
export interface MarketplaceStats {
  totalPlugins: number;
  totalDownloads: number;
  totalAuthors: number;
  categoryCounts: Record<PluginCategory, number>;
  featuredCount: number;
  verifiedCount: number;
}

// ===== 市场客户端 =====

/** 市场客户端配置 */
export interface MarketplaceClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}

/**
 * 插件市场客户端
 */
export class MarketplaceClient {
  private config: MarketplaceClientConfig;

  constructor(config: MarketplaceClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config,
    };
  }

  /**
   * 搜索插件
   */
  async search(options: SearchOptions = {}): Promise<SearchResult> {
    const params = new URLSearchParams();
    
    if (options.query) params.set("q", options.query);
    if (options.category) params.set("category", options.category);
    if (options.tags?.length) params.set("tags", options.tags.join(","));
    if (options.author) params.set("author", options.author);
    if (options.verified !== undefined) params.set("verified", String(options.verified));
    if (options.featured !== undefined) params.set("featured", String(options.featured));
    if (options.sortBy) params.set("sortBy", options.sortBy);
    if (options.sortOrder) params.set("sortOrder", options.sortOrder);
    if (options.page) params.set("page", String(options.page));
    if (options.pageSize) params.set("pageSize", String(options.pageSize));

    const response = await this.request<SearchResult>(`/plugins?${params.toString()}`);
    return response;
  }

  /**
   * 获取插件详情
   */
  async getPlugin(id: string): Promise<MarketplacePlugin | null> {
    try {
      return await this.request<MarketplacePlugin>(`/plugins/${id}`);
    } catch {
      return null;
    }
  }

  /**
   * 获取插件版本列表
   */
  async getVersions(id: string): Promise<PluginVersionInfo[]> {
    return await this.request<PluginVersionInfo[]>(`/plugins/${id}/versions`);
  }

  /**
   * 获取特定版本
   */
  async getVersion(id: string, version: string): Promise<PluginVersionInfo | null> {
    try {
      return await this.request<PluginVersionInfo>(`/plugins/${id}/versions/${version}`);
    } catch {
      return null;
    }
  }

  /**
   * 获取精选插件
   */
  async getFeatured(limit: number = 10): Promise<MarketplacePlugin[]> {
    const result = await this.search({
      featured: true,
      sortBy: "rating",
      sortOrder: "desc",
      pageSize: limit,
    });
    return result.plugins;
  }

  /**
   * 获取热门插件
   */
  async getPopular(limit: number = 10): Promise<MarketplacePlugin[]> {
    const result = await this.search({
      sortBy: "downloads",
      sortOrder: "desc",
      pageSize: limit,
    });
    return result.plugins;
  }

  /**
   * 获取最新插件
   */
  async getLatest(limit: number = 10): Promise<MarketplacePlugin[]> {
    const result = await this.search({
      sortBy: "updated",
      sortOrder: "desc",
      pageSize: limit,
    });
    return result.plugins;
  }

  /**
   * 获取分类插件
   */
  async getByCategory(category: PluginCategory, options: Omit<SearchOptions, "category"> = {}): Promise<SearchResult> {
    return await this.search({ ...options, category });
  }

  /**
   * 获取市场统计
   */
  async getStats(): Promise<MarketplaceStats> {
    return await this.request<MarketplaceStats>("/stats");
  }

  /**
   * 下载插件
   */
  async downloadPlugin(id: string, version?: string): Promise<ArrayBuffer> {
    const versionPath = version ? `/versions/${version}` : "/latest";
    const response = await fetch(
      `${this.config.baseUrl}/plugins/${id}${versionPath}/download`,
      {
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return await response.arrayBuffer();
  }

  /**
   * 提交评分
   */
  async submitRating(id: string, rating: number, review?: string): Promise<void> {
    await this.request(`/plugins/${id}/ratings`, {
      method: "POST",
      body: JSON.stringify({ rating, review }),
    });
  }

  /**
   * 报告问题
   */
  async reportPlugin(id: string, reason: string, details?: string): Promise<void> {
    await this.request(`/plugins/${id}/report`, {
      method: "POST",
      body: JSON.stringify({ reason, details }),
    });
  }

  /**
   * 发送请求
   */
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const headers = this.getHeaders();

    let lastError: Error | null = null;
    const retries = this.config.retries || 3;

    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          ...options,
          headers: { ...headers, ...options.headers },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // 不重试的错误
        if (lastError.name === "AbortError") {
          throw new Error("Request timeout");
        }
        
        // 等待后重试
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }

    throw lastError || new Error("Request failed");
  }

  /**
   * 获取请求头
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }
}

// ===== 发布者 API =====

/** 发布请求 */
export interface PublishRequest {
  manifest: PluginManifest;
  readme?: string;
  changelog?: string;
  packageFile: ArrayBuffer;
}

/** 发布结果 */
export interface PublishResult {
  success: boolean;
  pluginId?: string;
  version?: string;
  error?: string;
  warnings?: string[];
}

/**
 * 插件发布客户端
 */
export class PublisherClient {
  private config: MarketplaceClientConfig;

  constructor(config: MarketplaceClientConfig) {
    this.config = config;
  }

  /**
   * 发布插件
   */
  async publish(request: PublishRequest): Promise<PublishResult> {
    const formData = new FormData();
    formData.append("manifest", JSON.stringify(request.manifest));
    if (request.readme) formData.append("readme", request.readme);
    if (request.changelog) formData.append("changelog", request.changelog);
    formData.append("package", new Blob([request.packageFile]));

    try {
      const response = await fetch(`${this.config.baseUrl}/publish`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || response.statusText,
          warnings: data.warnings,
        };
      }

      return {
        success: true,
        pluginId: data.pluginId,
        version: data.version,
        warnings: data.warnings,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 撤回版本
   */
  async unpublish(pluginId: string, version?: string): Promise<boolean> {
    const path = version
      ? `/plugins/${pluginId}/versions/${version}`
      : `/plugins/${pluginId}`;

    try {
      const response = await fetch(`${this.config.baseUrl}${path}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 更新插件信息
   */
  async updateMetadata(
    pluginId: string,
    metadata: Partial<Pick<MarketplacePlugin, "description" | "tags" | "icon" | "banner" | "homepage">>
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/plugins/${pluginId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(metadata),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 获取发布者的插件列表
   */
  async getMyPlugins(): Promise<MarketplacePlugin[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/publisher/plugins`, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) return [];
      return await response.json();
    } catch {
      return [];
    }
  }

  /**
   * 获取下载统计
   */
  async getDownloadStats(pluginId: string): Promise<Record<string, number>> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/plugins/${pluginId}/stats/downloads`,
        {
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
          },
        }
      );

      if (!response.ok) return {};
      return await response.json();
    } catch {
      return {};
    }
  }
}

// ===== 本地缓存 =====

/** 缓存配置 */
export interface CacheConfig {
  maxAge: number; // 毫秒
  maxSize: number; // 条目数
}

/**
 * 市场数据缓存
 */
export class MarketplaceCache {
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private config: CacheConfig;

  constructor(config: CacheConfig = { maxAge: 5 * 60 * 1000, maxSize: 100 }) {
    this.config = config;
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.config.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * 设置缓存
   */
  set(key: string, data: unknown): void {
    // 清理过期缓存
    if (this.cache.size >= this.config.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.config.maxAge) {
        this.cache.delete(key);
      }
    }

    // 如果仍然超过限制，删除最旧的
    if (this.cache.size >= this.config.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, Math.floor(this.config.maxSize / 2));
      for (const [key] of toDelete) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * 带缓存的市场客户端
 */
export class CachedMarketplaceClient extends MarketplaceClient {
  private cache: MarketplaceCache;

  constructor(config: MarketplaceClientConfig, cacheConfig?: CacheConfig) {
    super(config);
    this.cache = new MarketplaceCache(cacheConfig);
  }

  override async getPlugin(id: string): Promise<MarketplacePlugin | null> {
    const cacheKey = `plugin:${id}`;
    const cached = this.cache.get<MarketplacePlugin>(cacheKey);
    if (cached) return cached;

    const plugin = await super.getPlugin(id);
    if (plugin) {
      this.cache.set(cacheKey, plugin);
    }
    return plugin;
  }

  override async getFeatured(limit: number = 10): Promise<MarketplacePlugin[]> {
    const cacheKey = `featured:${limit}`;
    const cached = this.cache.get<MarketplacePlugin[]>(cacheKey);
    if (cached) return cached;

    const plugins = await super.getFeatured(limit);
    this.cache.set(cacheKey, plugins);
    return plugins;
  }

  override async getPopular(limit: number = 10): Promise<MarketplacePlugin[]> {
    const cacheKey = `popular:${limit}`;
    const cached = this.cache.get<MarketplacePlugin[]>(cacheKey);
    if (cached) return cached;

    const plugins = await super.getPopular(limit);
    this.cache.set(cacheKey, plugins);
    return plugins;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 使特定插件缓存失效
   */
  invalidatePlugin(id: string): void {
    this.cache.delete(`plugin:${id}`);
  }
}
