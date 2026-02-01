/**
 * 插件版本管理
 */

import type { PluginManifest, InstalledPlugin } from "./types";

// ===== 语义化版本 =====

/** 版本号结构 */
export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
}

/**
 * 解析语义化版本
 */
export function parseVersion(version: string): SemanticVersion | null {
  const regex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;
  const match = version.match(regex);

  if (!match) return null;

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
    build: match[5],
  };
}

/**
 * 格式化版本号
 */
export function formatVersion(version: SemanticVersion): string {
  let result = `${version.major}.${version.minor}.${version.patch}`;
  if (version.prerelease) result += `-${version.prerelease}`;
  if (version.build) result += `+${version.build}`;
  return result;
}

/**
 * 比较版本号
 * @returns -1 (a < b), 0 (a = b), 1 (a > b)
 */
export function compareVersions(a: string, b: string): number {
  const versionA = parseVersion(a);
  const versionB = parseVersion(b);

  if (!versionA || !versionB) {
    return a.localeCompare(b);
  }

  // 比较主版本
  if (versionA.major !== versionB.major) {
    return versionA.major > versionB.major ? 1 : -1;
  }

  // 比较次版本
  if (versionA.minor !== versionB.minor) {
    return versionA.minor > versionB.minor ? 1 : -1;
  }

  // 比较修订版本
  if (versionA.patch !== versionB.patch) {
    return versionA.patch > versionB.patch ? 1 : -1;
  }

  // 比较预发布版本
  if (versionA.prerelease && !versionB.prerelease) return -1;
  if (!versionA.prerelease && versionB.prerelease) return 1;
  if (versionA.prerelease && versionB.prerelease) {
    return comparePrerelease(versionA.prerelease, versionB.prerelease);
  }

  return 0;
}

/**
 * 比较预发布版本
 */
function comparePrerelease(a: string, b: string): number {
  const partsA = a.split(".");
  const partsB = b.split(".");

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const partA = partsA[i];
    const partB = partsB[i];

    if (partA === undefined) return -1;
    if (partB === undefined) return 1;

    const numA = parseInt(partA, 10);
    const numB = parseInt(partB, 10);

    if (!isNaN(numA) && !isNaN(numB)) {
      if (numA !== numB) return numA > numB ? 1 : -1;
    } else {
      const cmp = partA.localeCompare(partB);
      if (cmp !== 0) return cmp;
    }
  }

  return 0;
}

/**
 * 检查版本是否满足范围要求
 */
export function satisfiesRange(version: string, range: string): boolean {
  // 处理精确版本
  if (!range.includes(" ") && !range.match(/^[<>=^~]/)) {
    return compareVersions(version, range) === 0;
  }

  // 处理范围运算符
  const constraints = range.split(" ").filter(Boolean);
  
  for (const constraint of constraints) {
    if (!satisfiesConstraint(version, constraint)) {
      return false;
    }
  }

  return true;
}

/**
 * 检查单个约束
 */
function satisfiesConstraint(version: string, constraint: string): boolean {
  const match = constraint.match(/^([<>=^~]*)(.+)$/);
  if (!match) return false;

  const operator = match[1] || "=";
  const target = match[2];
  const cmp = compareVersions(version, target);

  switch (operator) {
    case "=":
    case "==":
      return cmp === 0;
    case ">":
      return cmp > 0;
    case ">=":
      return cmp >= 0;
    case "<":
      return cmp < 0;
    case "<=":
      return cmp <= 0;
    case "^":
      return satisfiesCaret(version, target);
    case "~":
      return satisfiesTilde(version, target);
    default:
      return false;
  }
}

/**
 * 检查 ^ 范围（允许不改变最左非零位的更新）
 */
function satisfiesCaret(version: string, target: string): boolean {
  const v = parseVersion(version);
  const t = parseVersion(target);

  if (!v || !t) return false;

  if (t.major > 0) {
    return v.major === t.major && compareVersions(version, target) >= 0;
  } else if (t.minor > 0) {
    return v.major === 0 && v.minor === t.minor && compareVersions(version, target) >= 0;
  } else {
    return v.major === 0 && v.minor === 0 && v.patch === t.patch;
  }
}

/**
 * 检查 ~ 范围（允许修订版本更新）
 */
function satisfiesTilde(version: string, target: string): boolean {
  const v = parseVersion(version);
  const t = parseVersion(target);

  if (!v || !t) return false;

  return v.major === t.major && 
         v.minor === t.minor && 
         compareVersions(version, target) >= 0;
}

// ===== 版本升级 =====

/** 升级类型 */
export type VersionBump = "major" | "minor" | "patch" | "prerelease";

/**
 * 升级版本号
 */
export function bumpVersion(version: string, bump: VersionBump, prereleaseId?: string): string {
  const v = parseVersion(version);
  if (!v) return version;

  switch (bump) {
    case "major":
      return `${v.major + 1}.0.0`;
    case "minor":
      return `${v.major}.${v.minor + 1}.0`;
    case "patch":
      return `${v.major}.${v.minor}.${v.patch + 1}`;
    case "prerelease":
      if (v.prerelease) {
        const parts = v.prerelease.split(".");
        const lastPart = parts[parts.length - 1];
        const num = parseInt(lastPart, 10);
        if (!isNaN(num)) {
          parts[parts.length - 1] = String(num + 1);
          return `${v.major}.${v.minor}.${v.patch}-${parts.join(".")}`;
        }
      }
      const id = prereleaseId || "alpha";
      return `${v.major}.${v.minor}.${v.patch}-${id}.0`;
    default:
      return version;
  }
}

// ===== 版本管理器 =====

/** 版本历史记录 */
export interface VersionHistory {
  version: string;
  installedAt: Date;
  uninstalledAt?: Date;
  source: "local" | "marketplace" | "url";
  changelog?: string;
}

/** 版本管理器配置 */
export interface VersionManagerConfig {
  maxHistorySize?: number;
  autoBackup?: boolean;
}

/**
 * 插件版本管理器
 */
export class VersionManager {
  private history: Map<string, VersionHistory[]> = new Map();
  private config: VersionManagerConfig;

  constructor(config: VersionManagerConfig = {}) {
    this.config = {
      maxHistorySize: 10,
      autoBackup: true,
      ...config,
    };
  }

  /**
   * 记录版本安装
   */
  recordInstall(
    pluginId: string,
    version: string,
    source: VersionHistory["source"],
    changelog?: string
  ): void {
    let pluginHistory = this.history.get(pluginId);
    if (!pluginHistory) {
      pluginHistory = [];
      this.history.set(pluginId, pluginHistory);
    }

    pluginHistory.push({
      version,
      installedAt: new Date(),
      source,
      changelog,
    });

    // 限制历史记录数量
    if (pluginHistory.length > (this.config.maxHistorySize || 10)) {
      pluginHistory.shift();
    }
  }

  /**
   * 记录版本卸载
   */
  recordUninstall(pluginId: string, version: string): void {
    const pluginHistory = this.history.get(pluginId);
    if (!pluginHistory) return;

    const record = pluginHistory.find((h) => h.version === version && !h.uninstalledAt);
    if (record) {
      record.uninstalledAt = new Date();
    }
  }

  /**
   * 获取版本历史
   */
  getHistory(pluginId: string): VersionHistory[] {
    return this.history.get(pluginId) || [];
  }

  /**
   * 获取当前版本
   */
  getCurrentVersion(pluginId: string): string | null {
    const history = this.history.get(pluginId);
    if (!history || history.length === 0) return null;

    const current = history.find((h) => !h.uninstalledAt);
    return current?.version || null;
  }

  /**
   * 获取上一个版本
   */
  getPreviousVersion(pluginId: string): string | null {
    const history = this.history.get(pluginId);
    if (!history || history.length < 2) return null;

    const uninstalled = history.filter((h) => h.uninstalledAt);
    if (uninstalled.length === 0) return null;

    return uninstalled[uninstalled.length - 1].version;
  }

  /**
   * 检查是否可以回滚
   */
  canRollback(pluginId: string): boolean {
    return this.getPreviousVersion(pluginId) !== null;
  }

  /**
   * 清除历史
   */
  clearHistory(pluginId: string): void {
    this.history.delete(pluginId);
  }

  /**
   * 导出历史
   */
  export(): Record<string, VersionHistory[]> {
    const result: Record<string, VersionHistory[]> = {};
    for (const [pluginId, history] of this.history) {
      result[pluginId] = history;
    }
    return result;
  }

  /**
   * 导入历史
   */
  import(data: Record<string, VersionHistory[]>): void {
    for (const [pluginId, history] of Object.entries(data)) {
      const converted = history.map((h) => ({
        ...h,
        installedAt: new Date(h.installedAt),
        uninstalledAt: h.uninstalledAt ? new Date(h.uninstalledAt) : undefined,
      }));
      this.history.set(pluginId, converted);
    }
  }
}

// ===== 兼容性检查 =====

/** 兼容性检查结果 */
export interface CompatibilityResult {
  compatible: boolean;
  issues: CompatibilityIssue[];
}

export interface CompatibilityIssue {
  type: "app_version" | "dependency" | "permission" | "conflict";
  severity: "error" | "warning";
  message: string;
  details?: string;
}

/**
 * 检查插件兼容性
 */
export function checkCompatibility(
  manifest: PluginManifest,
  context: {
    appVersion: string;
    installedPlugins: InstalledPlugin[];
  }
): CompatibilityResult {
  const issues: CompatibilityIssue[] = [];

  // 检查应用版本
  if (manifest.minAppVersion) {
    if (compareVersions(context.appVersion, manifest.minAppVersion) < 0) {
      issues.push({
        type: "app_version",
        severity: "error",
        message: `需要应用版本 ${manifest.minAppVersion} 或更高`,
        details: `当前版本: ${context.appVersion}`,
      });
    }
  }

  if (manifest.maxAppVersion) {
    if (compareVersions(context.appVersion, manifest.maxAppVersion) > 0) {
      issues.push({
        type: "app_version",
        severity: "warning",
        message: `插件可能不兼容当前应用版本`,
        details: `最高支持: ${manifest.maxAppVersion}, 当前: ${context.appVersion}`,
      });
    }
  }

  // 检查依赖
  if (manifest.dependencies) {
    for (const dep of manifest.dependencies) {
      const installed = context.installedPlugins.find((p) => p.manifest.id === dep.id);
      
      if (!installed) {
        issues.push({
          type: "dependency",
          severity: dep.optional ? "warning" : "error",
          message: `缺少依赖: ${dep.id}`,
          details: `需要版本: ${dep.version}`,
        });
      } else if (!satisfiesRange(installed.manifest.version, dep.version)) {
        issues.push({
          type: "dependency",
          severity: "error",
          message: `依赖版本不兼容: ${dep.id}`,
          details: `需要 ${dep.version}, 已安装 ${installed.manifest.version}`,
        });
      }
    }
  }

  // 检查冲突
  for (const plugin of context.installedPlugins) {
    if (plugin.manifest.id === manifest.id) continue;

    // 检查是否有相同的节点 ID
    if (manifest.nodes && plugin.manifest.nodes) {
      for (const node of manifest.nodes) {
        const conflict = plugin.manifest.nodes.find((n) => n.id === node.id);
        if (conflict) {
          issues.push({
            type: "conflict",
            severity: "error",
            message: `节点 ID 冲突: ${node.id}`,
            details: `与插件 ${plugin.manifest.name} 冲突`,
          });
        }
      }
    }
  }

  return {
    compatible: !issues.some((i) => i.severity === "error"),
    issues,
  };
}

/**
 * 检查升级兼容性
 */
export function checkUpgradeCompatibility(
  currentManifest: PluginManifest,
  newManifest: PluginManifest
): CompatibilityResult {
  const issues: CompatibilityIssue[] = [];

  // 检查版本是否更新
  if (compareVersions(newManifest.version, currentManifest.version) <= 0) {
    issues.push({
      type: "app_version",
      severity: "warning",
      message: "新版本号不大于当前版本",
    });
  }

  // 检查是否有破坏性变更（主版本升级）
  const currentV = parseVersion(currentManifest.version);
  const newV = parseVersion(newManifest.version);

  if (currentV && newV && newV.major > currentV.major) {
    issues.push({
      type: "app_version",
      severity: "warning",
      message: "主版本升级可能包含破坏性变更",
    });
  }

  // 检查权限变更
  const currentPerms = new Set(currentManifest.permissions || []);
  const newPerms = newManifest.permissions || [];

  const addedPerms = newPerms.filter((p) => !currentPerms.has(p));
  if (addedPerms.length > 0) {
    issues.push({
      type: "permission",
      severity: "warning",
      message: `新增权限: ${addedPerms.join(", ")}`,
      details: "需要用户确认",
    });
  }

  return {
    compatible: !issues.some((i) => i.severity === "error"),
    issues,
  };
}
