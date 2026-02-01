/**
 * 插件安装/卸载管理
 */

import type {
  PluginManifest,
  InstalledPlugin,
  PluginState,
  PluginLogger,
} from "./types";
import { validateManifest, parseManifest } from "./manifest";
import { PermissionManager } from "./permissions";

// ===== 安装配置 =====

/** 安装配置 */
export interface InstallConfig {
  /** 插件目录 */
  pluginsDir: string;
  /** 临时目录 */
  tempDir: string;
  /** 日志器 */
  logger?: PluginLogger;
  /** 权限管理器 */
  permissionManager?: PermissionManager;
}

/** 安装源 */
export interface InstallSource {
  type: "local" | "url" | "npm" | "registry";
  path: string;
}

/** 安装选项 */
export interface InstallOptions {
  /** 强制安装（忽略版本检查） */
  force?: boolean;
  /** 跳过权限审批 */
  skipPermissionApproval?: boolean;
  /** 安装后启用 */
  enableAfterInstall?: boolean;
}

/** 安装结果 */
export interface InstallResult {
  success: boolean;
  plugin?: InstalledPlugin;
  error?: string;
  warnings?: string[];
}

/** 卸载结果 */
export interface UninstallResult {
  success: boolean;
  error?: string;
}

// ===== 插件安装器 =====

/**
 * 插件安装器
 */
export class PluginInstaller {
  private config: InstallConfig;
  private installedPlugins: Map<string, InstalledPlugin> = new Map();

  constructor(config: InstallConfig) {
    this.config = config;
  }

  /**
   * 从本地路径安装
   */
  async installFromLocal(localPath: string, options: InstallOptions = {}): Promise<InstallResult> {
    const logger = this.config.logger;
    logger?.info(`Installing plugin from local path: ${localPath}`);

    try {
      // 读取 manifest
      const manifest = await this.readManifestFromPath(localPath);

      // 验证 manifest
      const validation = validateManifest(manifest);
      if (!validation.valid) {
        return {
          success: false,
          error: `Invalid manifest: ${validation.errors.map((e) => e.message).join(", ")}`,
          warnings: validation.warnings.map((w) => w.message),
        };
      }

      // 检查是否已安装
      const existingPlugin = this.installedPlugins.get(manifest.id);
      if (existingPlugin && !options.force) {
        return {
          success: false,
          error: `Plugin ${manifest.id} is already installed`,
        };
      }

      // 复制到插件目录
      const installPath = await this.copyToPluginsDir(localPath, manifest.id);

      // 创建安装记录
      const installedPlugin: InstalledPlugin = {
        manifest,
        state: options.enableAfterInstall ? "enabled" : "installed",
        installPath,
        installedAt: new Date(),
      };

      // 处理权限
      if (!options.skipPermissionApproval && this.config.permissionManager) {
        this.config.permissionManager.autoGrantSafePermissions(manifest.id, manifest);
      }

      // 保存安装记录
      this.installedPlugins.set(manifest.id, installedPlugin);

      logger?.info(`Plugin ${manifest.id} installed successfully`);

      return {
        success: true,
        plugin: installedPlugin,
        warnings: validation.warnings.map((w) => w.message),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger?.error(`Failed to install plugin: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 从 URL 安装
   */
  async installFromUrl(url: string, options: InstallOptions = {}): Promise<InstallResult> {
    const logger = this.config.logger;
    logger?.info(`Installing plugin from URL: ${url}`);

    try {
      // 下载到临时目录
      const tempPath = await this.downloadToTemp(url);

      // 解压（如果是压缩包）
      const extractedPath = await this.extractIfNeeded(tempPath);

      // 使用本地安装
      return await this.installFromLocal(extractedPath, options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger?.error(`Failed to install from URL: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 卸载插件
   */
  async uninstall(pluginId: string): Promise<UninstallResult> {
    const logger = this.config.logger;
    logger?.info(`Uninstalling plugin: ${pluginId}`);

    const plugin = this.installedPlugins.get(pluginId);
    if (!plugin) {
      return {
        success: false,
        error: `Plugin ${pluginId} is not installed`,
      };
    }

    try {
      // 撤销所有权限
      if (this.config.permissionManager) {
        this.config.permissionManager.revokeAllPermissions(pluginId);
      }

      // 删除插件目录
      await this.removePluginDir(plugin.installPath);

      // 移除安装记录
      this.installedPlugins.delete(pluginId);

      logger?.info(`Plugin ${pluginId} uninstalled successfully`);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger?.error(`Failed to uninstall plugin: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 启用插件
   */
  enable(pluginId: string): boolean {
    const plugin = this.installedPlugins.get(pluginId);
    if (!plugin) return false;

    plugin.state = "enabled";
    this.config.logger?.info(`Plugin ${pluginId} enabled`);
    return true;
  }

  /**
   * 禁用插件
   */
  disable(pluginId: string): boolean {
    const plugin = this.installedPlugins.get(pluginId);
    if (!plugin) return false;

    plugin.state = "disabled";
    this.config.logger?.info(`Plugin ${pluginId} disabled`);
    return true;
  }

  /**
   * 获取已安装的插件
   */
  getInstalled(pluginId: string): InstalledPlugin | undefined {
    return this.installedPlugins.get(pluginId);
  }

  /**
   * 获取所有已安装的插件
   */
  getAllInstalled(): InstalledPlugin[] {
    return Array.from(this.installedPlugins.values());
  }

  /**
   * 获取已启用的插件
   */
  getEnabled(): InstalledPlugin[] {
    return this.getAllInstalled().filter((p) => p.state === "enabled");
  }

  /**
   * 检查是否已安装
   */
  isInstalled(pluginId: string): boolean {
    return this.installedPlugins.has(pluginId);
  }

  /**
   * 更新插件状态
   */
  updateState(pluginId: string, state: PluginState, error?: string): void {
    const plugin = this.installedPlugins.get(pluginId);
    if (plugin) {
      plugin.state = state;
      plugin.error = error;
      plugin.updatedAt = new Date();
    }
  }

  /**
   * 读取 manifest
   */
  private async readManifestFromPath(pluginPath: string): Promise<PluginManifest> {
    const fs = await import("fs").catch(() => null);
    const path = await import("path").catch(() => null);

    if (fs && path) {
      const manifestPath = path.join(pluginPath, "manifest.json");
      const content = fs.readFileSync(manifestPath, "utf-8");
      return parseManifest(content);
    }

    throw new Error("File system not available");
  }

  /**
   * 复制到插件目录
   */
  private async copyToPluginsDir(sourcePath: string, pluginId: string): Promise<string> {
    const fs = await import("fs").catch(() => null);
    const path = await import("path").catch(() => null);

    if (fs && path) {
      const targetPath = path.join(this.config.pluginsDir, pluginId);

      // 如果目标目录存在，先删除
      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true });
      }

      // 复制目录
      this.copyDirSync(fs, sourcePath, targetPath);

      return targetPath;
    }

    throw new Error("File system not available");
  }

  /**
   * 同步复制目录
   */
  private copyDirSync(fs: any, src: string, dest: string): void {
    const path = require("path");

    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        this.copyDirSync(fs, srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * 下载到临时目录
   */
  private async downloadToTemp(url: string): Promise<string> {
    const fs = await import("fs").catch(() => null);
    const path = await import("path").catch(() => null);

    if (fs && path) {
      const fileName = url.split("/").pop() || "plugin.zip";
      const tempPath = path.join(this.config.tempDir, fileName);

      // 使用 fetch 下载
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      fs.writeFileSync(tempPath, Buffer.from(buffer));

      return tempPath;
    }

    throw new Error("File system not available");
  }

  /**
   * 解压（如果需要）
   */
  private async extractIfNeeded(filePath: string): Promise<string> {
    // 检查是否是压缩包
    if (filePath.endsWith(".zip") || filePath.endsWith(".tar.gz")) {
      // 这里应该使用解压库，简化处理
      throw new Error("Archive extraction not implemented");
    }

    // 如果是目录，直接返回
    return filePath;
  }

  /**
   * 删除插件目录
   */
  private async removePluginDir(pluginPath: string): Promise<void> {
    const fs = await import("fs").catch(() => null);

    if (fs && fs.existsSync(pluginPath)) {
      fs.rmSync(pluginPath, { recursive: true });
    }
  }

  /**
   * 导出安装数据
   */
  export(): InstalledPlugin[] {
    return this.getAllInstalled();
  }

  /**
   * 导入安装数据
   */
  import(plugins: InstalledPlugin[]): void {
    for (const plugin of plugins) {
      // 转换日期
      if (typeof plugin.installedAt === "string") {
        plugin.installedAt = new Date(plugin.installedAt);
      }
      if (plugin.updatedAt && typeof plugin.updatedAt === "string") {
        plugin.updatedAt = new Date(plugin.updatedAt);
      }
      this.installedPlugins.set(plugin.manifest.id, plugin);
    }
  }
}

// ===== 插件更新检查 =====

/** 更新信息 */
export interface UpdateInfo {
  pluginId: string;
  currentVersion: string;
  latestVersion: string;
  releaseNotes?: string;
  downloadUrl?: string;
}

/**
 * 检查插件更新
 */
export async function checkForUpdates(
  installedPlugins: InstalledPlugin[],
  registryUrl: string
): Promise<UpdateInfo[]> {
  const updates: UpdateInfo[] = [];

  for (const plugin of installedPlugins) {
    try {
      const response = await fetch(`${registryUrl}/plugins/${plugin.manifest.id}/latest`);
      if (response.ok) {
        const latestInfo = await response.json();
        if (compareVersions(latestInfo.version, plugin.manifest.version) > 0) {
          updates.push({
            pluginId: plugin.manifest.id,
            currentVersion: plugin.manifest.version,
            latestVersion: latestInfo.version,
            releaseNotes: latestInfo.releaseNotes,
            downloadUrl: latestInfo.downloadUrl,
          });
        }
      }
    } catch {
      // 忽略单个插件的检查错误
    }
  }

  return updates;
}

/**
 * 版本比较
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split(".").map(Number);
  const partsB = b.split(".").map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }

  return 0;
}
