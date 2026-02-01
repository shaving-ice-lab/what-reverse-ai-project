/**
 * 插件权限控制系统
 */

import type { PluginPermission, PluginManifest, PluginLogger } from "./types";

// ===== 权限定义 =====

/** 权限元数据 */
export interface PermissionMeta {
  id: PluginPermission;
  name: string;
  description: string;
  level: "safe" | "sensitive" | "dangerous";
  category: "network" | "storage" | "system" | "api" | "ui";
  requiresApproval: boolean;
}

/** 所有权限的元数据 */
export const PERMISSION_METADATA: Record<PluginPermission, PermissionMeta> = {
  network: {
    id: "network",
    name: "网络访问",
    description: "允许插件发送 HTTP 请求",
    level: "sensitive",
    category: "network",
    requiresApproval: true,
  },
  storage: {
    id: "storage",
    name: "存储访问",
    description: "允许插件读写本地存储",
    level: "safe",
    category: "storage",
    requiresApproval: false,
  },
  clipboard: {
    id: "clipboard",
    name: "剪贴板",
    description: "允许插件读写剪贴板",
    level: "sensitive",
    category: "system",
    requiresApproval: true,
  },
  notifications: {
    id: "notifications",
    name: "通知",
    description: "允许插件发送系统通知",
    level: "safe",
    category: "ui",
    requiresApproval: false,
  },
  env: {
    id: "env",
    name: "环境变量",
    description: "允许插件读取环境变量",
    level: "sensitive",
    category: "system",
    requiresApproval: true,
  },
  secrets: {
    id: "secrets",
    name: "密钥访问",
    description: "允许插件访问存储的密钥",
    level: "dangerous",
    category: "system",
    requiresApproval: true,
  },
  filesystem: {
    id: "filesystem",
    name: "文件系统",
    description: "允许插件访问受限的文件系统路径",
    level: "dangerous",
    category: "storage",
    requiresApproval: true,
  },
  shell: {
    id: "shell",
    name: "Shell 命令",
    description: "允许插件执行系统命令（极其危险）",
    level: "dangerous",
    category: "system",
    requiresApproval: true,
  },
  "api:workflows": {
    id: "api:workflows",
    name: "工作流 API",
    description: "允许插件操作工作流",
    level: "sensitive",
    category: "api",
    requiresApproval: true,
  },
  "api:executions": {
    id: "api:executions",
    name: "执行 API",
    description: "允许插件执行工作流",
    level: "sensitive",
    category: "api",
    requiresApproval: true,
  },
  "api:users": {
    id: "api:users",
    name: "用户 API",
    description: "允许插件访问用户信息",
    level: "sensitive",
    category: "api",
    requiresApproval: true,
  },
  "ui:sidebar": {
    id: "ui:sidebar",
    name: "侧边栏 UI",
    description: "允许插件在侧边栏添加视图",
    level: "safe",
    category: "ui",
    requiresApproval: false,
  },
  "ui:toolbar": {
    id: "ui:toolbar",
    name: "工具栏 UI",
    description: "允许插件在工具栏添加按钮",
    level: "safe",
    category: "ui",
    requiresApproval: false,
  },
  "ui:panel": {
    id: "ui:panel",
    name: "面板 UI",
    description: "允许插件创建面板",
    level: "safe",
    category: "ui",
    requiresApproval: false,
  },
  "ui:modal": {
    id: "ui:modal",
    name: "模态框 UI",
    description: "允许插件显示模态对话框",
    level: "safe",
    category: "ui",
    requiresApproval: false,
  },
};

// ===== 权限请求 =====

/** 权限请求 */
export interface PermissionRequest {
  pluginId: string;
  pluginName: string;
  permissions: PluginPermission[];
  timestamp: Date;
}

/** 权限授权结果 */
export interface PermissionGrant {
  pluginId: string;
  permission: PluginPermission;
  granted: boolean;
  grantedAt?: Date;
  expiresAt?: Date;
  grantedBy?: string;
}

// ===== 权限管理器 =====

/**
 * 权限管理器
 */
export class PermissionManager {
  private grants: Map<string, Map<PluginPermission, PermissionGrant>> = new Map();
  private logger?: PluginLogger;

  constructor(logger?: PluginLogger) {
    this.logger = logger;
  }

  /**
   * 检查插件是否有权限
   */
  hasPermission(pluginId: string, permission: PluginPermission): boolean {
    const pluginGrants = this.grants.get(pluginId);
    if (!pluginGrants) return false;

    const grant = pluginGrants.get(permission);
    if (!grant) return false;

    // 检查是否过期
    if (grant.expiresAt && grant.expiresAt < new Date()) {
      this.revokePermission(pluginId, permission);
      return false;
    }

    return grant.granted;
  }

  /**
   * 检查多个权限
   */
  hasAllPermissions(pluginId: string, permissions: PluginPermission[]): boolean {
    return permissions.every((p) => this.hasPermission(pluginId, p));
  }

  /**
   * 检查是否有任一权限
   */
  hasAnyPermission(pluginId: string, permissions: PluginPermission[]): boolean {
    return permissions.some((p) => this.hasPermission(pluginId, p));
  }

  /**
   * 授予权限
   */
  grantPermission(
    pluginId: string,
    permission: PluginPermission,
    options: { expiresIn?: number; grantedBy?: string } = {}
  ): void {
    let pluginGrants = this.grants.get(pluginId);
    if (!pluginGrants) {
      pluginGrants = new Map();
      this.grants.set(pluginId, pluginGrants);
    }

    const grant: PermissionGrant = {
      pluginId,
      permission,
      granted: true,
      grantedAt: new Date(),
      grantedBy: options.grantedBy,
    };

    if (options.expiresIn) {
      grant.expiresAt = new Date(Date.now() + options.expiresIn);
    }

    pluginGrants.set(permission, grant);
    this.logger?.info(`Permission granted: ${permission} to ${pluginId}`);
  }

  /**
   * 授予多个权限
   */
  grantPermissions(
    pluginId: string,
    permissions: PluginPermission[],
    options: { expiresIn?: number; grantedBy?: string } = {}
  ): void {
    for (const permission of permissions) {
      this.grantPermission(pluginId, permission, options);
    }
  }

  /**
   * 撤销权限
   */
  revokePermission(pluginId: string, permission: PluginPermission): void {
    const pluginGrants = this.grants.get(pluginId);
    if (pluginGrants) {
      pluginGrants.delete(permission);
      this.logger?.info(`Permission revoked: ${permission} from ${pluginId}`);
    }
  }

  /**
   * 撤销所有权限
   */
  revokeAllPermissions(pluginId: string): void {
    this.grants.delete(pluginId);
    this.logger?.info(`All permissions revoked for ${pluginId}`);
  }

  /**
   * 获取插件的所有权限
   */
  getPluginPermissions(pluginId: string): PermissionGrant[] {
    const pluginGrants = this.grants.get(pluginId);
    if (!pluginGrants) return [];
    return Array.from(pluginGrants.values());
  }

  /**
   * 获取需要审批的权限
   */
  getPermissionsRequiringApproval(manifest: PluginManifest): PluginPermission[] {
    const permissions = manifest.permissions || [];
    return permissions.filter((p) => {
      const meta = PERMISSION_METADATA[p];
      return meta?.requiresApproval ?? true;
    });
  }

  /**
   * 获取危险权限
   */
  getDangerousPermissions(manifest: PluginManifest): PluginPermission[] {
    const permissions = manifest.permissions || [];
    return permissions.filter((p) => {
      const meta = PERMISSION_METADATA[p];
      return meta?.level === "dangerous";
    });
  }

  /**
   * 自动授予安全权限
   */
  autoGrantSafePermissions(pluginId: string, manifest: PluginManifest): void {
    const permissions = manifest.permissions || [];
    const safePermissions = permissions.filter((p) => {
      const meta = PERMISSION_METADATA[p];
      return meta?.level === "safe" && !meta?.requiresApproval;
    });

    this.grantPermissions(pluginId, safePermissions, { grantedBy: "auto" });
  }

  /**
   * 导出权限数据
   */
  export(): Record<string, PermissionGrant[]> {
    const result: Record<string, PermissionGrant[]> = {};
    for (const [pluginId, grants] of this.grants) {
      result[pluginId] = Array.from(grants.values());
    }
    return result;
  }

  /**
   * 导入权限数据
   */
  import(data: Record<string, PermissionGrant[]>): void {
    this.grants.clear();
    for (const [pluginId, grants] of Object.entries(data)) {
      const pluginGrants = new Map<PluginPermission, PermissionGrant>();
      for (const grant of grants) {
        // 转换日期字符串
        if (grant.grantedAt && typeof grant.grantedAt === "string") {
          grant.grantedAt = new Date(grant.grantedAt);
        }
        if (grant.expiresAt && typeof grant.expiresAt === "string") {
          grant.expiresAt = new Date(grant.expiresAt);
        }
        pluginGrants.set(grant.permission, grant);
      }
      this.grants.set(pluginId, pluginGrants);
    }
  }
}

// ===== 权限策略 =====

/** 权限策略 */
export interface PermissionPolicy {
  /** 允许的权限 */
  allowedPermissions: PluginPermission[];
  /** 禁止的权限 */
  deniedPermissions: PluginPermission[];
  /** 是否需要用户确认 */
  requireUserConfirmation: boolean;
  /** 权限有效期（毫秒） */
  permissionTTL?: number;
}

/** 默认权限策略 */
export const DEFAULT_POLICY: PermissionPolicy = {
  allowedPermissions: [
    "storage",
    "notifications",
    "ui:sidebar",
    "ui:toolbar",
    "ui:panel",
    "ui:modal",
  ],
  deniedPermissions: ["shell"],
  requireUserConfirmation: true,
};

/**
 * 权限策略检查器
 */
export class PolicyChecker {
  private policy: PermissionPolicy;

  constructor(policy: PermissionPolicy = DEFAULT_POLICY) {
    this.policy = policy;
  }

  /**
   * 检查权限是否被策略允许
   */
  isAllowed(permission: PluginPermission): boolean {
    if (this.policy.deniedPermissions.includes(permission)) {
      return false;
    }
    return true;
  }

  /**
   * 检查权限是否自动授予
   */
  isAutoGranted(permission: PluginPermission): boolean {
    return this.policy.allowedPermissions.includes(permission);
  }

  /**
   * 检查是否需要用户确认
   */
  requiresConfirmation(permission: PluginPermission): boolean {
    if (this.isAutoGranted(permission)) {
      return false;
    }
    return this.policy.requireUserConfirmation;
  }

  /**
   * 评估 Manifest 的权限请求
   */
  evaluateManifest(manifest: PluginManifest): {
    autoGranted: PluginPermission[];
    requiresApproval: PluginPermission[];
    denied: PluginPermission[];
  } {
    const permissions = manifest.permissions || [];
    
    const autoGranted: PluginPermission[] = [];
    const requiresApproval: PluginPermission[] = [];
    const denied: PluginPermission[] = [];

    for (const permission of permissions) {
      if (this.policy.deniedPermissions.includes(permission)) {
        denied.push(permission);
      } else if (this.isAutoGranted(permission)) {
        autoGranted.push(permission);
      } else {
        requiresApproval.push(permission);
      }
    }

    return { autoGranted, requiresApproval, denied };
  }
}

// ===== 权限审计 =====

/** 权限审计日志条目 */
export interface PermissionAuditEntry {
  timestamp: Date;
  pluginId: string;
  action: "grant" | "revoke" | "check" | "denied";
  permission: PluginPermission;
  success: boolean;
  actor?: string;
  reason?: string;
}

/**
 * 权限审计器
 */
export class PermissionAuditor {
  private logs: PermissionAuditEntry[] = [];
  private maxLogs: number;

  constructor(maxLogs: number = 1000) {
    this.maxLogs = maxLogs;
  }

  /**
   * 记录日志
   */
  log(entry: Omit<PermissionAuditEntry, "timestamp">): void {
    this.logs.push({
      ...entry,
      timestamp: new Date(),
    });

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * 获取插件的审计日志
   */
  getPluginLogs(pluginId: string): PermissionAuditEntry[] {
    return this.logs.filter((log) => log.pluginId === pluginId);
  }

  /**
   * 获取权限的审计日志
   */
  getPermissionLogs(permission: PluginPermission): PermissionAuditEntry[] {
    return this.logs.filter((log) => log.permission === permission);
  }

  /**
   * 获取所有日志
   */
  getAllLogs(): PermissionAuditEntry[] {
    return [...this.logs];
  }

  /**
   * 清除日志
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * 导出日志
   */
  export(): PermissionAuditEntry[] {
    return [...this.logs];
  }
}
