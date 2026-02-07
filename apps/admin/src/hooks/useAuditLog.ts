"use client";

/**
 * Audit Log Hook
 * Provides convenient audit logging capabilities
 */

import { useCallback, useRef } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  auditApi,
  type AuditAction,
  type AuditLogEntry,
  type AuditTargetType,
  getActionRiskLevel,
  isHighRiskAction,
  requiresApproval,
  AUDIT_ACTION_LABELS,
} from "@/lib/audit";

interface UseAuditLogOptions {
  /**
   * Whether to show confirmation for high-risk operations
   */
  confirmHighRisk?: boolean;
  /**
   * Custom confirmation message
   */
  confirmMessage?: string;
}

interface AuditLogParams {
  action: AuditAction;
  target_type: AuditTargetType;
  target_id: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  previous_value?: unknown;
  new_value?: unknown;
}

export function useAuditLog(options: UseAuditLogOptions = {}) {
  const { user } = useAuthStore();
  const pendingLogs = useRef<AuditLogEntry[]>([]);

  /**
   * Record a single audit log entry
   */
  const log = useCallback(
    async (params: AuditLogParams): Promise<string | null> => {
      try {
        const result = await auditApi.log({
          action: params.action,
          target_type: params.target_type,
          target_id: params.target_id,
          reason: params.reason,
          metadata: {
            ...params.metadata,
            actor_user_id: user?.id,
            actor_email: user?.email,
          },
          previous_value: params.previous_value,
          new_value: params.new_value,
        });
        return result.id;
      } catch (error) {
        console.error("[AuditLog] Failed to log:", error);
        // Add to pending queue on failure
        pendingLogs.current.push({
          action: params.action,
          target_type: params.target_type,
          target_id: params.target_id,
          reason: params.reason,
          metadata: params.metadata,
        });
        return null;
      }
    },
    [user]
  );

  /**
   * Batch record audit log entries
   */
  const logBatch = useCallback(
    async (entries: AuditLogParams[]): Promise<string[]> => {
      try {
        const result = await auditApi.logBatch(
          entries.map((e) => ({
            action: e.action,
            target_type: e.target_type,
            target_id: e.target_id,
            reason: e.reason,
            metadata: {
              ...e.metadata,
              actor_user_id: user?.id,
              actor_email: user?.email,
            },
          }))
        );
        return result.ids;
      } catch (error) {
        console.error("[AuditLog] Failed to log batch:", error);
        // Add to pending queue on failure
        pendingLogs.current.push(
          ...entries.map((e) => ({
            action: e.action,
            target_type: e.target_type,
            target_id: e.target_id,
            reason: e.reason,
            metadata: e.metadata,
          }))
        );
        return [];
      }
    },
    [user]
  );

  /**
   * Execute an operation with audit logging
   * Automatically records audit logs before and after the operation
   */
  const withAudit = useCallback(
    async <T>(
      params: AuditLogParams,
      operation: () => Promise<T>
    ): Promise<T> => {
      const startTime = Date.now();
      let result: T;
      let error: Error | null = null;

      try {
        result = await operation();
      } catch (e) {
        error = e instanceof Error ? e : new Error(String(e));
        throw error;
      } finally {
        const duration = Date.now() - startTime;
        await log({
          ...params,
          metadata: {
            ...params.metadata,
            duration_ms: duration,
            success: !error,
            error_message: error?.message,
          },
        });
      }

      return result!;
    },
    [log]
  );

  /**
   * Retry sending pending audit logs
   */
  const flushPendingLogs = useCallback(async (): Promise<number> => {
    if (pendingLogs.current.length === 0) return 0;

    const logs = [...pendingLogs.current];
    pendingLogs.current = [];

    try {
      await auditApi.logBatch(logs);
      return logs.length;
    } catch {
      // Put back into queue on failure
      pendingLogs.current = [...logs, ...pendingLogs.current];
      return 0;
    }
  }, []);

  /**
   * Check if an action requires approval
   */
  const checkRequiresApproval = useCallback((action: AuditAction): boolean => {
    return requiresApproval(action);
  }, []);

  /**
   * Check if an action is high risk
   */
  const checkIsHighRisk = useCallback((action: AuditAction): boolean => {
    return isHighRiskAction(action);
  }, []);

  /**
   * Get the risk level of an action
   */
  const getRiskLevel = useCallback((action: AuditAction) => {
    return getActionRiskLevel(action);
  }, []);

  /**
   * Get the label for an action
   */
  const getActionLabel = useCallback((action: AuditAction): string => {
    return AUDIT_ACTION_LABELS[action] || action;
  }, []);

  return {
    log,
    logBatch,
    withAudit,
    flushPendingLogs,
    checkRequiresApproval,
    checkIsHighRisk,
    getRiskLevel,
    getActionLabel,
    pendingCount: pendingLogs.current.length,
  };
}

export type { AuditLogParams };
