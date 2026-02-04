"use client";

/**
 * 审计日志 Hook
 * 提供便捷的操作审计记录能力
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
   * 是否在高风险操作时显示确认
   */
  confirmHighRisk?: boolean;
  /**
   * 自定义确认消息
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
   * 记录单条审计日志
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
        // 失败时添加到待发送队列
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
   * 批量记录审计日志
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
        // 失败时添加到待发送队列
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
   * 执行带审计的操作
   * 自动在操作前后记录审计日志
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
   * 重试发送待处理的审计日志
   */
  const flushPendingLogs = useCallback(async (): Promise<number> => {
    if (pendingLogs.current.length === 0) return 0;

    const logs = [...pendingLogs.current];
    pendingLogs.current = [];

    try {
      await auditApi.logBatch(logs);
      return logs.length;
    } catch {
      // 失败时放回队列
      pendingLogs.current = [...logs, ...pendingLogs.current];
      return 0;
    }
  }, []);

  /**
   * 检查操作是否需要审批
   */
  const checkRequiresApproval = useCallback((action: AuditAction): boolean => {
    return requiresApproval(action);
  }, []);

  /**
   * 检查操作是否为高风险
   */
  const checkIsHighRisk = useCallback((action: AuditAction): boolean => {
    return isHighRiskAction(action);
  }, []);

  /**
   * 获取操作的风险级别
   */
  const getRiskLevel = useCallback((action: AuditAction) => {
    return getActionRiskLevel(action);
  }, []);

  /**
   * 获取操作的中文标签
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
