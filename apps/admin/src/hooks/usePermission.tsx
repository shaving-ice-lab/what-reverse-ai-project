"use client";

/**
 * 权限检查 Hook
 * 提供便捷的权限验证能力
 */

import { useCallback, useMemo } from "react";
import { useAdminCapabilities } from "@/contexts/admin-capabilities";
import {
  type AdminRole,
  type PermissionPoint,
  hasPermissionPoint,
  hasModulePermission,
  canAccessPage,
  getRolePermissions,
  ADMIN_ROLE_LABELS,
  PERMISSION_POINTS,
  type PermissionLevel,
} from "@/lib/permissions";

export function usePermission() {
  const { capabilities, hasCapability } = useAdminCapabilities();

  // 从用户角色或能力点推断管理员角色
  const adminRole = useMemo<AdminRole>(() => {
    // 检查是否有超级管理员能力
    if (hasCapability("admin.super")) return "super_admin";
    if (hasCapability("admin.ops")) return "ops";
    if (hasCapability("admin.support")) return "support";
    if (hasCapability("admin.finance")) return "finance";
    if (hasCapability("admin.reviewer")) return "reviewer";
    if (hasCapability("admin.viewer")) return "viewer";

    // 默认为只读
    return "viewer";
  }, [hasCapability]);

  /**
   * 检查是否有指定权限点
   */
  const hasPermission = useCallback(
    (permissionKey: string): boolean => {
      // 首先检查能力点
      if (hasCapability(permissionKey)) return true;
      // 然后检查角色权限
      return hasPermissionPoint(adminRole, permissionKey);
    },
    [adminRole, hasCapability]
  );

  /**
   * 检查是否有模块权限
   */
  const hasModule = useCallback(
    (module: string, level: PermissionLevel = "read"): boolean => {
      return hasModulePermission(adminRole, module, level);
    },
    [adminRole]
  );

  /**
   * 检查是否可以访问页面
   */
  const canAccess = useCallback(
    (path: string): boolean => {
      return canAccessPage(adminRole, path);
    },
    [adminRole]
  );

  /**
   * 检查是否有多个权限中的任一个
   */
  const hasAnyPermission = useCallback(
    (permissionKeys: string[]): boolean => {
      return permissionKeys.some((key) => hasPermission(key));
    },
    [hasPermission]
  );

  /**
   * 检查是否有所有指定权限
   */
  const hasAllPermissions = useCallback(
    (permissionKeys: string[]): boolean => {
      return permissionKeys.every((key) => hasPermission(key));
    },
    [hasPermission]
  );

  /**
   * 获取当前角色的所有权限点
   */
  const rolePermissions = useMemo<PermissionPoint[]>(() => {
    return getRolePermissions(adminRole);
  }, [adminRole]);

  /**
   * 获取角色的中文名称
   */
  const roleLabel = useMemo<string>(() => {
    return ADMIN_ROLE_LABELS[adminRole];
  }, [adminRole]);

  /**
   * 检查是否为超级管理员
   */
  const isSuperAdmin = useMemo<boolean>(() => {
    return adminRole === "super_admin";
  }, [adminRole]);

  /**
   * 检查是否有写权限
   */
  const canWrite = useCallback(
    (module: string): boolean => {
      return hasModule(module, "read_write");
    },
    [hasModule]
  );

  /**
   * 获取用户可访问的模块列表
   */
  const accessibleModules = useMemo<string[]>(() => {
    const modules = new Set<string>();
    for (const point of PERMISSION_POINTS) {
      if (hasModule(point.module, "read")) {
        modules.add(point.module);
      }
    }
    return Array.from(modules);
  }, [hasModule]);

  return {
    adminRole,
    roleLabel,
    isSuperAdmin,
    hasPermission,
    hasModule,
    canAccess,
    hasAnyPermission,
    hasAllPermissions,
    canWrite,
    rolePermissions,
    accessibleModules,
    capabilities,
  };
}

/**
 * 权限检查组件 Props
 */
export interface RequirePermissionProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * 权限控制组件
 * 根据权限决定是否渲染子组件
 */
export function RequirePermission({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: RequirePermissionProps) {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermission();

  const hasRequired = useMemo(() => {
    if (permission) {
      return hasPermission(permission);
    }
    if (permissions && permissions.length > 0) {
      return requireAll
        ? hasAllPermissions(permissions)
        : hasAnyPermission(permissions);
    }
    return true;
  }, [permission, permissions, requireAll, hasPermission, hasAllPermissions, hasAnyPermission]);

  if (!hasRequired) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
