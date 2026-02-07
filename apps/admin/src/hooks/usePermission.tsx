"use client";

/**
 * Permission Check Hook
 * Provides convenient permission verification capabilities
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

  // Infer admin role from user roles or capabilities
  const adminRole = useMemo<AdminRole>(() => {
    // Check for super admin capability
    if (hasCapability("admin.super")) return "super_admin";
    if (hasCapability("admin.ops")) return "ops";
    if (hasCapability("admin.support")) return "support";
    if (hasCapability("admin.finance")) return "finance";
    if (hasCapability("admin.reviewer")) return "reviewer";
    if (hasCapability("admin.viewer")) return "viewer";

    // Default to read-only
    return "viewer";
  }, [hasCapability]);

  /**
   * Check if the user has the specified permission point
   */
  const hasPermission = useCallback(
    (permissionKey: string): boolean => {
      // First check capabilities
      if (hasCapability(permissionKey)) return true;
      // Then check role permissions
      return hasPermissionPoint(adminRole, permissionKey);
    },
    [adminRole, hasCapability]
  );

  /**
   * Check if the user has module permission
   */
  const hasModule = useCallback(
    (module: string, level: PermissionLevel = "read"): boolean => {
      return hasModulePermission(adminRole, module, level);
    },
    [adminRole]
  );

  /**
   * Check if the user can access a page
   */
  const canAccess = useCallback(
    (path: string): boolean => {
      return canAccessPage(adminRole, path);
    },
    [adminRole]
  );

  /**
   * Check if the user has any of the specified permissions
   */
  const hasAnyPermission = useCallback(
    (permissionKeys: string[]): boolean => {
      return permissionKeys.some((key) => hasPermission(key));
    },
    [hasPermission]
  );

  /**
   * Check if the user has all of the specified permissions
   */
  const hasAllPermissions = useCallback(
    (permissionKeys: string[]): boolean => {
      return permissionKeys.every((key) => hasPermission(key));
    },
    [hasPermission]
  );

  /**
   * Get all permission points for the current role
   */
  const rolePermissions = useMemo<PermissionPoint[]>(() => {
    return getRolePermissions(adminRole);
  }, [adminRole]);

  /**
   * Get the role label
   */
  const roleLabel = useMemo<string>(() => {
    return ADMIN_ROLE_LABELS[adminRole];
  }, [adminRole]);

  /**
   * Check if the user is a super admin
   */
  const isSuperAdmin = useMemo<boolean>(() => {
    return adminRole === "super_admin";
  }, [adminRole]);

  /**
   * Check if the user has write permission
   */
  const canWrite = useCallback(
    (module: string): boolean => {
      return hasModule(module, "read_write");
    },
    [hasModule]
  );

  /**
   * Get the list of modules accessible to the user
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
 * Permission Check Component Props
 */
export interface RequirePermissionProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Permission Control Component
 * Renders children based on permission checks
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
