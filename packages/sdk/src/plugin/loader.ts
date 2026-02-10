/**
 * 插件加载器
 */

import type {
  PluginManifest,
  PluginModule,
  PluginContext,
  PluginAPI,
  InstalledPlugin,
  PluginState,
  Disposable,
  PluginLogger,
} from './types'
import { validateManifest, parseManifest } from './manifest'

// ===== 插件加载器 =====

/** 加载器配置 */
export interface PluginLoaderConfig {
  /** 插件目录 */
  pluginsDir: string
  /** 存储目录 */
  storageDir: string
  /** 日志函数 */
  logger?: PluginLogger
  /** 是否启用沙箱 */
  sandbox?: boolean
}

/** 加载的插件 */
export interface LoadedPlugin {
  manifest: PluginManifest
  module: PluginModule
  context: PluginContext
  state: PluginState
  error?: Error
}

/**
 * 插件加载器
 */
export class PluginLoader {
  private config: PluginLoaderConfig
  private plugins: Map<string, LoadedPlugin> = new Map()
  private api: PluginAPI

  constructor(config: PluginLoaderConfig, api: PluginAPI) {
    this.config = config
    this.api = api
  }

  /**
   * 加载插件
   */
  async loadPlugin(pluginPath: string): Promise<LoadedPlugin> {
    const logger = this.config.logger
    logger?.info(`Loading plugin from: ${pluginPath}`)

    try {
      // 读取 manifest
      const manifest = await this.readManifest(pluginPath)

      // 验证 manifest
      const validation = validateManifest(manifest)
      if (!validation.valid) {
        throw new Error(`Invalid manifest: ${validation.errors.map((e) => e.message).join(', ')}`)
      }

      // 检查是否已加载
      if (this.plugins.has(manifest.id)) {
        throw new Error(`Plugin ${manifest.id} is already loaded`)
      }

      // 创建上下文
      const context = this.createContext(manifest, pluginPath)

      // 加载模块
      const module = await this.loadModule(pluginPath, manifest)

      // 创建加载的插件对象
      const loadedPlugin: LoadedPlugin = {
        manifest,
        module,
        context,
        state: 'installed',
      }

      // 存储插件
      this.plugins.set(manifest.id, loadedPlugin)

      logger?.info(`Plugin ${manifest.id} loaded successfully`)
      return loadedPlugin
    } catch (error) {
      logger?.error(`Failed to load plugin from ${pluginPath}:`, error)
      throw error
    }
  }

  /**
   * 激活插件
   */
  async activatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    if (plugin.state === 'enabled') {
      return // 已激活
    }

    const logger = this.config.logger
    logger?.info(`Activating plugin: ${pluginId}`)

    try {
      // 调用激活函数
      await plugin.module.activate(plugin.context, this.api)
      plugin.state = 'enabled'
      logger?.info(`Plugin ${pluginId} activated successfully`)
    } catch (error) {
      plugin.state = 'error'
      plugin.error = error instanceof Error ? error : new Error(String(error))
      logger?.error(`Failed to activate plugin ${pluginId}:`, error)
      throw error
    }
  }

  /**
   * 停用插件
   */
  async deactivatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`)
    }

    if (plugin.state !== 'enabled') {
      return // 未激活
    }

    const logger = this.config.logger
    logger?.info(`Deactivating plugin: ${pluginId}`)

    try {
      // 调用停用函数
      if (plugin.module.deactivate) {
        await plugin.module.deactivate()
      }

      // 清理订阅
      for (const disposable of plugin.context.subscriptions) {
        try {
          disposable.dispose()
        } catch (e) {
          logger?.warn(`Error disposing subscription:`, e)
        }
      }
      plugin.context.subscriptions.length = 0

      plugin.state = 'disabled'
      logger?.info(`Plugin ${pluginId} deactivated successfully`)
    } catch (error) {
      logger?.error(`Failed to deactivate plugin ${pluginId}:`, error)
      throw error
    }
  }

  /**
   * 卸载插件
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      return
    }

    // 先停用
    if (plugin.state === 'enabled') {
      await this.deactivatePlugin(pluginId)
    }

    // 移除插件
    this.plugins.delete(pluginId)
    this.config.logger?.info(`Plugin ${pluginId} unloaded`)
  }

  /**
   * 获取插件
   */
  getPlugin(pluginId: string): LoadedPlugin | undefined {
    return this.plugins.get(pluginId)
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): LoadedPlugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 获取已启用的插件
   */
  getEnabledPlugins(): LoadedPlugin[] {
    return this.getAllPlugins().filter((p) => p.state === 'enabled')
  }

  /**
   * 读取 manifest
   */
  private async readManifest(pluginPath: string): Promise<PluginManifest> {
    // 在实际实现中，这里会读取文件系统
    // 这里提供一个模拟实现
    const fs = await import('fs').catch(() => null)
    const path = await import('path').catch(() => null)

    if (fs && path) {
      const manifestPath = path.join(pluginPath, 'manifest.json')
      const content = fs.readFileSync(manifestPath, 'utf-8')
      return parseManifest(content)
    }

    throw new Error('File system not available')
  }

  /**
   * 加载模块
   */
  private async loadModule(pluginPath: string, manifest: PluginManifest): Promise<PluginModule> {
    const path = await import('path').catch(() => null)

    if (path) {
      const mainPath = path.join(pluginPath, manifest.main)

      // 动态导入模块
      const module = await import(mainPath)

      // 检查模块是否有 activate 函数
      if (typeof module.activate !== 'function' && typeof module.default?.activate !== 'function') {
        throw new Error('Plugin module must export an activate function')
      }

      return module.default || module
    }

    throw new Error('Path module not available')
  }

  /**
   * 创建插件上下文
   */
  private createContext(manifest: PluginManifest, pluginPath: string): PluginContext {
    const path = require('path')

    return {
      pluginId: manifest.id,
      version: manifest.version,
      extensionPath: pluginPath,
      storagePath: path.join(this.config.storageDir, manifest.id),
      globalStoragePath: path.join(this.config.storageDir, '_global'),
      log: this.createLogger(manifest.id),
      subscriptions: [],
    }
  }

  /**
   * 创建日志器
   */
  private createLogger(pluginId: string): PluginLogger {
    const prefix = `[${pluginId}]`
    const baseLogger = this.config.logger

    return {
      debug: (message: string, ...args: unknown[]) =>
        baseLogger?.debug(`${prefix} ${message}`, ...args) ??
        console.debug(`${prefix} ${message}`, ...args),
      info: (message: string, ...args: unknown[]) =>
        baseLogger?.info(`${prefix} ${message}`, ...args) ??
        console.info(`${prefix} ${message}`, ...args),
      warn: (message: string, ...args: unknown[]) =>
        baseLogger?.warn(`${prefix} ${message}`, ...args) ??
        console.warn(`${prefix} ${message}`, ...args),
      error: (message: string, ...args: unknown[]) =>
        baseLogger?.error(`${prefix} ${message}`, ...args) ??
        console.error(`${prefix} ${message}`, ...args),
    }
  }
}

// ===== 插件注册表 =====

/**
 * 插件注册表
 */
export class PluginRegistry {
  private plugins: Map<string, InstalledPlugin> = new Map()

  /**
   * 注册插件
   */
  register(plugin: InstalledPlugin): void {
    this.plugins.set(plugin.manifest.id, plugin)
  }

  /**
   * 注销插件
   */
  unregister(pluginId: string): void {
    this.plugins.delete(pluginId)
  }

  /**
   * 获取插件
   */
  get(pluginId: string): InstalledPlugin | undefined {
    return this.plugins.get(pluginId)
  }

  /**
   * 获取所有插件
   */
  getAll(): InstalledPlugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 按分类获取
   */
  getByCategory(category: string): InstalledPlugin[] {
    return this.getAll().filter((p) => p.manifest.category === category)
  }

  /**
   * 搜索插件
   */
  search(query: string): InstalledPlugin[] {
    const lowerQuery = query.toLowerCase()
    return this.getAll().filter((p) => {
      const manifest = p.manifest
      return (
        manifest.name.toLowerCase().includes(lowerQuery) ||
        manifest.description.toLowerCase().includes(lowerQuery) ||
        manifest.keywords?.some((k) => k.toLowerCase().includes(lowerQuery))
      )
    })
  }

  /**
   * 检查是否已安装
   */
  isInstalled(pluginId: string): boolean {
    return this.plugins.has(pluginId)
  }

  /**
   * 获取已启用的插件
   */
  getEnabled(): InstalledPlugin[] {
    return this.getAll().filter((p) => p.state === 'enabled')
  }

  /**
   * 获取有错误的插件
   */
  getWithErrors(): InstalledPlugin[] {
    return this.getAll().filter((p) => p.state === 'error')
  }
}

// ===== 工具函数 =====

/**
 * 创建可释放资源
 */
export function createDisposable(dispose: () => void): Disposable {
  return { dispose }
}

/**
 * 组合多个可释放资源
 */
export function combineDisposables(...disposables: Disposable[]): Disposable {
  return {
    dispose: () => {
      for (const d of disposables) {
        try {
          d.dispose()
        } catch (e) {
          console.error('Error disposing:', e)
        }
      }
    },
  }
}
