import { api } from "@/lib/api";
import { requestRaw } from "@/lib/api/client";
import type { ApiResponse } from "@/lib/api/client";
import type {
  AdminCapability,
  AdminUserRole,
  AdminUserStatus,
  App,
  AppAccessPolicy,
  AppDomain,
  AppUsageMetric,
  AppVersion,
  AuditLog,
  ConfigItem,
  Conversation,
  ConversationMessage,
  CreativeTask,
  Earning,
  Execution,
  ExecutionNode,
  ExecutionStatus,
  ExportFormat,
  ExportJob,
  ExportJobStatus,
  Invoice,
  InvoiceStatus,
  ModelUsage,
  Refund,
  RefundStatus,
  Secret,
  SupportAssignmentRule,
  SupportChannel,
  SupportNotificationTemplateConfig,
  SupportQueue,
  SupportQueueMember,
  SupportTicket,
  SupportTicketComment,
  SupportTicketPriority,
  SupportTicketStatus,
  SupportTeam,
  SupportTeamMember,
  Tag,
  Template,
  TemplateStatus,
  Withdrawal,
  WithdrawalStatus,
  Workflow,
  WorkflowStatus,
  WorkflowVersion,
  Workspace,
  WorkspaceAnalytics,
  WorkspaceBehaviorMetric,
  WorkspaceMember,
} from "@/types/admin";
import type { Announcement } from "@/types/announcement";
import type { User } from "@/types/auth";

type ListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};

const normalizeListResponse = <T>(
  payload: ApiResponse<T[] | ListResponse<T>> | ListResponse<T> | T[],
  fallbackPage: number,
  fallbackPageSize: number
): ListResponse<T> => {
  const candidate = payload as Record<string, unknown>;
  if (candidate && typeof candidate.code === "string") {
    const data = candidate.data as T[] | ListResponse<T> | undefined;
    const meta = (candidate.meta as Partial<ListResponse<T>>) || {};
    if (data && typeof data === "object" && Array.isArray((data as ListResponse<T>).items)) {
      const list = data as ListResponse<T>;
      return {
        items: list.items || [],
        total: typeof list.total === "number" ? list.total : meta.total || list.items.length,
        page: typeof list.page === "number" ? list.page : meta.page || fallbackPage,
        page_size:
          typeof list.page_size === "number" ? list.page_size : meta.page_size || fallbackPageSize,
      };
    }
    if (Array.isArray(data)) {
      return {
        items: data,
        total: typeof meta.total === "number" ? meta.total : data.length,
        page: typeof meta.page === "number" ? meta.page : fallbackPage,
        page_size: typeof meta.page_size === "number" ? meta.page_size : fallbackPageSize,
      };
    }
  }

  if (candidate && Array.isArray(candidate.items)) {
    const list = candidate as ListResponse<T>;
    return {
      items: list.items || [],
      total: typeof list.total === "number" ? list.total : list.items.length,
      page: typeof list.page === "number" ? list.page : fallbackPage,
      page_size: typeof list.page_size === "number" ? list.page_size : fallbackPageSize,
    };
  }

  if (Array.isArray(payload)) {
    return {
      items: payload,
      total: payload.length,
      page: fallbackPage,
      page_size: fallbackPageSize,
    };
  }

  return {
    items: [],
    total: 0,
    page: fallbackPage,
    page_size: fallbackPageSize,
  };
};

export const adminApi = {
  capabilities() {
    return api.get<{ capabilities: AdminCapability[] }>("/admin/capabilities");
  },

  users: {
    list(params: {
      search?: string;
      status?: AdminUserStatus | "";
      role?: AdminUserRole | "";
      page?: number;
      page_size?: number;
    }) {
      return api.get<{
        items: User[];
        total: number;
        page: number;
        page_size: number;
      }>("/admin/users", { params });
    },

    get(userId: string) {
      return api.get<{ user: User }>(`/admin/users/${userId}`);
    },

    updateStatus(userId: string, input: { status: AdminUserStatus; reason?: string }) {
      return api.patch<{ user: User }>(`/admin/users/${userId}/status`, {
        status: input.status,
        reason: input.reason || "",
      });
    },

    updateRole(userId: string, input: { role: AdminUserRole }) {
      return api.patch<{ user: User }>(`/admin/users/${userId}/role`, {
        role: input.role,
      });
    },

    updateAdminRole(userId: string, input: { admin_role: string; reason?: string }) {
      return api.patch<{ user: User }>(`/admin/users/${userId}/admin-role`, {
        admin_role: input.admin_role,
        reason: input.reason || "",
      });
    },

    forceLogout(userId: string, input?: { reason?: string }) {
      return api.post<{ success: boolean }>(`/admin/users/${userId}/force-logout`, {
        reason: input?.reason || "",
      });
    },

    resetPassword(userId: string, input?: { notify?: boolean }) {
      return api.post<{ success: boolean; temp_password?: string }>(`/admin/users/${userId}/reset-password`, {
        notify: input?.notify ?? true,
      });
    },

    setRiskFlag(userId: string, input: { flag: "none" | "low" | "medium" | "high"; reason: string }) {
      return api.patch<{ user: User }>(`/admin/users/${userId}/risk-flag`, {
        risk_flag: input.flag,
        reason: input.reason,
      });
    },

    batchUpdateStatus(input: { user_ids: string[]; status: AdminUserStatus; reason: string }) {
      return api.post<{ updated: number; failed: string[] }>("/admin/users/batch/status", {
        user_ids: input.user_ids,
        status: input.status,
        reason: input.reason,
      });
    },

    batchUpdateRole(input: { user_ids: string[]; role: AdminUserRole }) {
      return api.post<{ updated: number; failed: string[] }>("/admin/users/batch/role", {
        user_ids: input.user_ids,
        role: input.role,
      });
    },

    getAssets(userId: string) {
      return api.get<{
        workspaces: { id: string; name: string; role: string; created_at: string }[];
        apps: { id: string; name: string; workspace_name: string; status: string }[];
        usage: {
          total_executions: number;
          total_tokens: number;
          total_storage_mb: number;
          last_30_days_executions: number;
        };
      }>(`/admin/users/${userId}/assets`);
    },

    getSessions(userId: string) {
      return api.get<{
        sessions: {
          id: string;
          device: string;
          ip: string;
          location: string;
          last_active_at: string;
          created_at: string;
        }[];
      }>(`/admin/users/${userId}/sessions`);
    },

    terminateSession(userId: string, sessionId: string) {
      return api.delete<{ success: boolean }>(`/admin/users/${userId}/sessions/${sessionId}`);
    },
  },

  workspaces: {
    list(params: {
      search?: string;
      status?: string;
      owner_id?: string;
      include_deleted?: boolean;
      page?: number;
      page_size?: number;
    }) {
      return api.get<{
        items: Workspace[];
        total: number;
        page: number;
        page_size: number;
      }>("/admin/workspaces", { params });
    },

    get(workspaceId: string, params?: { include_deleted?: boolean }) {
      return api.get<{
        workspace: Workspace;
        members: WorkspaceMember[];
        members_total?: number;
        apps: App[];
        apps_total?: number;
      }>(`/admin/workspaces/${workspaceId}`, {
        params: params || {},
      });
    },

    updateStatus(workspaceId: string, input: { status: string; reason?: string }) {
      return api.patch<{ workspace: Workspace }>(`/admin/workspaces/${workspaceId}/status`, {
        status: input.status,
        reason: input.reason || "",
      });
    },

    // Data export & log archive
    exportData(workspaceId: string, input: { format: "csv" | "json"; include_logs?: boolean }) {
      return api.post<{ job_id: string; status: string }>(`/admin/workspaces/${workspaceId}/export`, input);
    },

    getLogArchives(workspaceId: string, params?: { page?: number; page_size?: number }) {
      return api.get<{
        items: { id: string; name: string; size_bytes: number; created_at: string; download_url: string }[];
        total: number;
      }>(`/admin/workspaces/${workspaceId}/log-archives`, { params: params || {} });
    },

    createLogArchive(workspaceId: string, input: { start_date: string; end_date: string; retention_days?: number }) {
      return api.post<{ archive_id: string; status: string }>(`/admin/workspaces/${workspaceId}/log-archives`, input);
    },

    // DB operations
    getDbInfo(workspaceId: string) {
      return api.get<{
        status: string;
        size_mb: number;
        connection_count: number;
        last_backup_at: string;
        encryption_status: string;
      }>(`/admin/workspaces/${workspaceId}/database`);
    },

    triggerDbMigration(workspaceId: string, input: { target_region?: string; reason: string }) {
      return api.post<{ job_id: string; status: string }>(`/admin/workspaces/${workspaceId}/database/migrate`, input);
    },

    rotateDbKey(workspaceId: string, input: { reason: string }) {
      return api.post<{ success: boolean }>(`/admin/workspaces/${workspaceId}/database/rotate-key`, input);
    },

    // Member management
    getMembers(workspaceId: string, params?: { page?: number; page_size?: number }) {
      return api.get<{
        items: WorkspaceMember[];
        total: number;
      }>(`/admin/workspaces/${workspaceId}/members`, { params: params || {} });
    },

    updateMemberRole(workspaceId: string, userId: string, input: { role_id: string }) {
      return api.patch<{ member: WorkspaceMember }>(`/admin/workspaces/${workspaceId}/members/${userId}/role`, input);
    },

    removeMember(workspaceId: string, userId: string, input: { reason?: string }) {
      return api.delete<{ success: boolean }>(`/admin/workspaces/${workspaceId}/members/${userId}`, {
        body: JSON.stringify({ reason: input.reason || "" }),
      });
    },

    // Quota & usage
    getQuota(workspaceId: string) {
      return api.get<{
        plan: string;
        quotas: {
          members: { used: number; limit: number };
          apps: { used: number; limit: number };
          executions_per_month: { used: number; limit: number };
          storage_gb: { used: number; limit: number };
          api_calls_per_minute: { used: number; limit: number };
        };
        overages: { metric: string; amount: number; cost: number }[];
      }>(`/admin/workspaces/${workspaceId}/quota`);
    },

    updateQuota(workspaceId: string, input: { quota_key: string; new_limit: number; reason: string }) {
      return api.patch<{ success: boolean }>(`/admin/workspaces/${workspaceId}/quota`, input);
    },

    // Plan management
    getPlanHistory(workspaceId: string) {
      return api.get<{
        items: {
          id: string;
          from_plan: string;
          to_plan: string;
          changed_by: string;
          reason: string;
          created_at: string;
        }[];
      }>(`/admin/workspaces/${workspaceId}/plan-history`);
    },

    updatePlan(workspaceId: string, input: { plan: string; reason: string }) {
      return api.patch<{ workspace: Workspace }>(`/admin/workspaces/${workspaceId}/plan`, input);
    },
  },

  apps: {
    list(params: {
      search?: string;
      status?: string;
      workspace_id?: string;
      owner_id?: string;
      page?: number;
      page_size?: number;
    }) {
      return api.get<{
        items: App[];
        total: number;
        page: number;
        page_size: number;
      }>("/admin/apps", { params });
    },

    get(appId: string, params?: { page?: number; page_size?: number }) {
      return api.get<{
        app: App;
        versions: AppVersion[];
        versions_total: number;
        domains: AppDomain[];
        access_policy?: AppAccessPolicy | null;
      }>(`/admin/apps/${appId}`, {
        params: params || {},
      });
    },

    updateStatus(appId: string, input: { status: string; reason?: string }) {
      return api.patch<{ app: App }>(`/admin/apps/${appId}/status`, {
        status: input.status,
        reason: input.reason || "",
      });
    },

    // Version management
    getVersions(appId: string, params?: { page?: number; page_size?: number }) {
      return api.get<{
        items: AppVersion[];
        total: number;
      }>(`/admin/apps/${appId}/versions`, { params: params || {} });
    },

    rollbackVersion(appId: string, versionId: string, input: { reason: string }) {
      return api.post<{ app: App }>(`/admin/apps/${appId}/versions/${versionId}/rollback`, input);
    },

    promoteVersion(appId: string, versionId: string, input: { target_status: string }) {
      return api.post<{ version: AppVersion }>(`/admin/apps/${appId}/versions/${versionId}/promote`, input);
    },

    // Market review
    getReviews(appId: string) {
      return api.get<{
        items: {
          id: string;
          reviewer_id: string;
          reviewer_email: string;
          decision: "approved" | "rejected" | "pending";
          notes: string;
          created_at: string;
        }[];
      }>(`/admin/apps/${appId}/reviews`);
    },

    submitReview(appId: string, input: { decision: "approved" | "rejected"; notes: string }) {
      return api.post<{ success: boolean }>(`/admin/apps/${appId}/reviews`, input);
    },

    getRatings(appId: string) {
      return api.get<{
        average: number;
        total_reviews: number;
        distribution: Record<string, number>;
      }>(`/admin/apps/${appId}/ratings`);
    },

    // Access policy
    updateAccessPolicy(appId: string, input: {
      access_mode?: string;
      rate_limit?: Record<string, number>;
      allowed_origins?: string[];
      require_captcha?: boolean;
    }) {
      return api.patch<{ policy: AppAccessPolicy }>(`/admin/apps/${appId}/access-policy`, input);
    },

    // Domain management
    getDomains(appId: string) {
      return api.get<{ domains: AppDomain[] }>(`/admin/apps/${appId}/domains`);
    },

    addDomain(appId: string, input: { domain: string }) {
      return api.post<{ domain: AppDomain }>(`/admin/apps/${appId}/domains`, input);
    },

    verifyDomain(appId: string, domainId: string) {
      return api.post<{ domain: AppDomain }>(`/admin/apps/${appId}/domains/${domainId}/verify`, {});
    },

    removeDomain(appId: string, domainId: string) {
      return api.delete<{ success: boolean }>(`/admin/apps/${appId}/domains/${domainId}`);
    },

    // Webhook management
    getWebhooks(appId: string) {
      return api.get<{
        webhooks: {
          id: string;
          url: string;
          events: string[];
          status: string;
          secret_prefix: string;
          created_at: string;
        }[];
      }>(`/admin/apps/${appId}/webhooks`);
    },

    getWebhookLogs(appId: string, webhookId: string, params?: { page?: number; page_size?: number }) {
      return api.get<{
        items: {
          id: string;
          event: string;
          status_code: number;
          response_time_ms: number;
          error_message?: string;
          created_at: string;
        }[];
        total: number;
      }>(`/admin/apps/${appId}/webhooks/${webhookId}/logs`, { params: params || {} });
    },

    retryWebhook(appId: string, webhookId: string, logId: string) {
      return api.post<{ success: boolean }>(`/admin/apps/${appId}/webhooks/${webhookId}/logs/${logId}/retry`, {});
    },
  },

  announcements: {
    list(params: {
      type?: string;
      include_inactive?: boolean;
      is_active?: boolean;
      page?: number;
      page_size?: number;
    }) {
      return api.get<{
        items: Announcement[];
        total: number;
        page: number;
        page_size: number;
      }>("/admin/announcements", { params });
    },

    create(input: {
      title: string;
      description: string;
      type: string;
      priority?: number;
      is_active?: boolean;
      starts_at?: string;
      ends_at?: string;
    }) {
      return api.post<{ announcement: Announcement }>(
        "/admin/announcements",
        input
      );
    },

    update(
      announcementId: string,
      input: {
        title?: string;
        description?: string;
        type?: string;
        priority?: number;
        is_active?: boolean;
        starts_at?: string;
        ends_at?: string;
      }
    ) {
      return api.patch<{ announcement: Announcement }>(
        `/admin/announcements/${announcementId}`,
        input
      );
    },
  },

  support: {
    tickets: {
      list(params: {
        status?: SupportTicketStatus | "";
        priority?: SupportTicketPriority | "";
        category?: string;
        search?: string;
        workspace_id?: string;
        app_id?: string;
        page?: number;
        page_size?: number;
      }) {
        return api.get<{
          items: SupportTicket[];
          total: number;
          page: number;
          page_size: number;
        }>("/admin/support/tickets", { params });
      },

      get(ticketId: string) {
        return api.get<{ ticket: SupportTicket }>(`/admin/support/tickets/${ticketId}`);
      },

      updateStatus(ticketId: string, input: { status: SupportTicketStatus; note?: string }) {
        return api.patch<{ ticket: SupportTicket }>(`/admin/support/tickets/${ticketId}/status`, {
          status: input.status,
          note: input.note || "",
        });
      },

      comments: {
        list(ticketId: string) {
          return api.get<{ comments: SupportTicketComment[] }>(
            `/admin/support/tickets/${ticketId}/comments`
          );
        },

        create(
          ticketId: string,
          input: { body: string; is_internal?: boolean; author_name?: string }
        ) {
          return api.post<{ comment: SupportTicketComment }>(
            `/admin/support/tickets/${ticketId}/comments`,
            {
              body: input.body,
              is_internal: input.is_internal ?? true,
              author_name: input.author_name || "Admin",
            }
          );
        },
      },
    },

    channels: {
      list(params?: { include_disabled?: boolean }) {
        return api.get<{ channels: SupportChannel[] }>("/admin/support/channels", {
          params: params || {},
        });
      },

      create(input: {
        key: string;
        name: string;
        description?: string | null;
        contact?: string | null;
        sla_overrides?: Record<string, number>;
        enabled?: boolean;
        sort_order?: number;
      }) {
        return api.post<{ channel: SupportChannel }>("/admin/support/channels", input);
      },

      update(
        channelId: string,
        input: {
          key: string;
          name: string;
          description?: string | null;
          contact?: string | null;
          sla_overrides?: Record<string, number>;
          enabled?: boolean;
          sort_order?: number;
        }
      ) {
        return api.patch<{ channel: SupportChannel }>(`/admin/support/channels/${channelId}`, input);
      },
    },

    routingRules: {
      list(params?: { include_disabled?: boolean }) {
        return api.get<{ rules: SupportAssignmentRule[] }>("/admin/support/routing-rules", {
          params: params || {},
        });
      },

      create(input: {
        name: string;
        priority: string;
        category: string;
        channel: string;
        keyword: string;
        assignee_type: string;
        assignee_value: string;
        enabled?: boolean;
        sort_order?: number;
      }) {
        return api.post<{ rule: SupportAssignmentRule }>("/admin/support/routing-rules", input);
      },

      update(
        ruleId: string,
        input: {
          name: string;
          priority: string;
          category: string;
          channel: string;
          keyword: string;
          assignee_type: string;
          assignee_value: string;
          enabled?: boolean;
          sort_order?: number;
        }
      ) {
        return api.patch<{ rule: SupportAssignmentRule }>(`/admin/support/routing-rules/${ruleId}`, input);
      },
    },

    teams: {
      list(params?: { include_disabled?: boolean }) {
        return api.get<{ teams: SupportTeam[] }>("/admin/support/teams", {
          params: params || {},
        });
      },

      create(input: { name: string; description?: string | null; enabled?: boolean }) {
        return api.post<{ team: SupportTeam }>("/admin/support/teams", input);
      },

      update(teamId: string, input: { name?: string; description?: string | null; enabled?: boolean }) {
        return api.patch<{ team: SupportTeam }>(`/admin/support/teams/${teamId}`, input);
      },

      members: {
        list(teamId: string) {
          return api.get<{ members: SupportTeamMember[] }>(`/admin/support/teams/${teamId}/members`);
        },

        add(
          teamId: string,
          input: { user_id: string; role?: string | null; sort_order?: number }
        ) {
          return api.post<{ member: SupportTeamMember }>(`/admin/support/teams/${teamId}/members`, input);
        },

        remove(teamId: string, userId: string) {
          return api.delete<Record<string, never>>(
            `/admin/support/teams/${teamId}/members/${userId}`
          );
        },
      },
    },

    queues: {
      list(params?: { include_disabled?: boolean }) {
        return api.get<{ queues: SupportQueue[] }>("/admin/support/queues", {
          params: params || {},
        });
      },

      create(input: { name: string; description?: string | null; enabled?: boolean }) {
        return api.post<{ queue: SupportQueue }>("/admin/support/queues", input);
      },

      update(queueId: string, input: { name?: string; description?: string | null; enabled?: boolean }) {
        return api.patch<{ queue: SupportQueue }>(`/admin/support/queues/${queueId}`, input);
      },

      members: {
        list(queueId: string) {
          return api.get<{ members: SupportQueueMember[] }>(`/admin/support/queues/${queueId}/members`);
        },

        add(queueId: string, input: { user_id: string; sort_order?: number }) {
          return api.post<{ member: SupportQueueMember }>(`/admin/support/queues/${queueId}/members`, input);
        },

        remove(queueId: string, userId: string) {
          return api.delete<Record<string, never>>(
            `/admin/support/queues/${queueId}/members/${userId}`
          );
        },
      },
    },

    notificationTemplates: {
      get() {
        return api.get<{ templates: SupportNotificationTemplateConfig }>(
          "/admin/support/notification-templates"
        );
      },

      update(config: SupportNotificationTemplateConfig) {
        return api.put<{ templates: SupportNotificationTemplateConfig }>(
          "/admin/support/notification-templates",
          config
        );
      },
    },
  },

  workflows: {
    list(params: {
      search?: string;
      status?: WorkflowStatus | "";
      workspace_id?: string;
      trigger_type?: string;
      page?: number;
      page_size?: number;
    }) {
      return api.get<{
        items: Workflow[];
        total: number;
        page: number;
        page_size: number;
      }>("/admin/workflows", { params });
    },

    get(workflowId: string) {
      return api.get<{
        workflow: Workflow;
        versions: WorkflowVersion[];
        versions_total: number;
        recent_executions: Execution[];
      }>(`/admin/workflows/${workflowId}`);
    },

    updateStatus(workflowId: string, input: { status: WorkflowStatus; reason?: string }) {
      return api.patch<{ workflow: Workflow }>(`/admin/workflows/${workflowId}/status`, {
        status: input.status,
        reason: input.reason || "",
      });
    },

    // Execution queue & analysis
    getExecutionQueue(params?: { page?: number; page_size?: number; status?: string }) {
      return api.get<{
        items: {
          id: string;
          workflow_id: string;
          workflow_name: string;
          status: string;
          queued_at: string;
          started_at: string | null;
          priority: number;
        }[];
        total: number;
        queue_depth: number;
        avg_wait_time_ms: number;
      }>("/admin/workflows/queue", { params: params || {} });
    },

    getExecutionTimingAnalysis(workflowId: string, params?: { days?: number }) {
      return api.get<{
        workflow_id: string;
        total_executions: number;
        avg_duration_ms: number;
        p50_duration_ms: number;
        p95_duration_ms: number;
        p99_duration_ms: number;
        min_duration_ms: number;
        max_duration_ms: number;
        node_timings: {
          node_id: string;
          node_type: string;
          avg_duration_ms: number;
          execution_count: number;
        }[];
      }>(`/admin/workflows/${workflowId}/timing-analysis`, { params: params || {} });
    },

    // Failure analysis
    getFailureDistribution(workflowId: string, params?: { days?: number }) {
      return api.get<{
        workflow_id: string;
        total_failures: number;
        failure_rate: number;
        distribution: {
          reason: string;
          count: number;
          percentage: number;
          sample_execution_id: string;
        }[];
        recent_failures: {
          id: string;
          error_message: string;
          node_id: string;
          occurred_at: string;
        }[];
      }>(`/admin/workflows/${workflowId}/failure-distribution`, { params: params || {} });
    },
  },

  executions: {
    list(params: {
      search?: string;
      status?: ExecutionStatus | "";
      workflow_id?: string;
      workspace_id?: string;
      trigger_type?: string;
      page?: number;
      page_size?: number;
    }) {
      return api.get<{
        items: Execution[];
        total: number;
        page: number;
        page_size: number;
      }>("/admin/executions", { params });
    },

    get(executionId: string) {
      return api.get<{
        execution: Execution;
        nodes: ExecutionNode[];
      }>(`/admin/executions/${executionId}`);
    },

    cancel(executionId: string, input?: { reason?: string }) {
      return api.post<{ execution: Execution }>(`/admin/executions/${executionId}/cancel`, {
        reason: input?.reason || "",
      });
    },

    retry(executionId: string) {
      return api.post<{ execution: Execution }>(`/admin/executions/${executionId}/retry`, {});
    },

    replay(executionId: string, input?: { from_node_id?: string }) {
      return api.post<{ new_execution_id: string; status: string }>(`/admin/executions/${executionId}/replay`, input || {});
    },

    adjustPriority(executionId: string, input: { priority: number }) {
      return api.patch<{ success: boolean }>(`/admin/executions/${executionId}/priority`, input);
    },
  },

  conversations: {
    list(params: {
      search?: string;
      status?: string;
      workspace_id?: string;
      user_id?: string;
      model?: string;
      page?: number;
      page_size?: number;
    }) {
      return api.get<{
        items: Conversation[];
        total: number;
        page: number;
        page_size: number;
      }>("/admin/conversations", { params });
    },

    get(conversationId: string) {
      return api.get<{
        conversation: Conversation;
        messages: ConversationMessage[];
        messages_total: number;
      }>(`/admin/conversations/${conversationId}`);
    },

    updateStatus(conversationId: string, input: { status: string; reason?: string }) {
      return api.patch<{ conversation: Conversation }>(`/admin/conversations/${conversationId}/status`, {
        status: input.status,
        reason: input.reason || "",
      });
    },

    // Conversation templates
    getTemplates(params?: { page?: number; page_size?: number; search?: string }) {
      return api.get<{
        items: {
          id: string;
          name: string;
          description: string;
          system_prompt: string;
          model: string;
          parameters: Record<string, unknown>;
          is_default: boolean;
          usage_count: number;
          created_at: string;
        }[];
        total: number;
      }>("/admin/conversations/templates", { params: params || {} });
    },

    createTemplate(input: {
      name: string;
      description: string;
      system_prompt: string;
      model: string;
      parameters?: Record<string, unknown>;
    }) {
      return api.post<{ template: { id: string; name: string } }>("/admin/conversations/templates", input);
    },

    updateTemplate(templateId: string, input: {
      name?: string;
      description?: string;
      system_prompt?: string;
      model?: string;
      parameters?: Record<string, unknown>;
    }) {
      return api.patch<{ template: { id: string; name: string } }>(`/admin/conversations/templates/${templateId}`, input);
    },

    deleteTemplate(templateId: string) {
      return api.delete<{ success: boolean }>(`/admin/conversations/templates/${templateId}`);
    },

    setDefaultTemplate(templateId: string) {
      return api.post<{ success: boolean }>(`/admin/conversations/templates/${templateId}/set-default`, {});
    },

    // Content moderation
    getModerationQueue(params?: { page?: number; page_size?: number; status?: string }) {
      return api.get<{
        items: {
          id: string;
          conversation_id: string;
          message_id: string;
          content_preview: string;
          flags: string[];
          severity: string;
          status: string;
          reported_at: string;
        }[];
        total: number;
      }>("/admin/conversations/moderation", { params: params || {} });
    },

    reviewModeration(moderationId: string, input: { decision: "approve" | "reject" | "escalate"; notes: string }) {
      return api.post<{ success: boolean }>(`/admin/conversations/moderation/${moderationId}/review`, input);
    },

    getModerationRules() {
      return api.get<{
        rules: {
          id: string;
          name: string;
          pattern: string;
          action: string;
          severity: string;
          enabled: boolean;
        }[];
      }>("/admin/conversations/moderation/rules");
    },

    updateModerationRule(ruleId: string, input: { enabled?: boolean; action?: string; severity?: string }) {
      return api.patch<{ success: boolean }>(`/admin/conversations/moderation/rules/${ruleId}`, input);
    },

    // Model prompts & strategy
    getModelStrategies() {
      return api.get<{
        strategies: {
          id: string;
          model: string;
          system_prompt: string;
          temperature: number;
          max_tokens: number;
          rate_limit: number;
          cost_limit_per_day: number;
          enabled: boolean;
        }[];
      }>("/admin/conversations/model-strategies");
    },

    updateModelStrategy(strategyId: string, input: {
      system_prompt?: string;
      temperature?: number;
      max_tokens?: number;
      rate_limit?: number;
      cost_limit_per_day?: number;
      enabled?: boolean;
    }) {
      return api.patch<{ success: boolean }>(`/admin/conversations/model-strategies/${strategyId}`, input);
    },
  },

  creativeTasks: {
    list(params: {
      search?: string;
      status?: string;
      workspace_id?: string;
      user_id?: string;
      template_id?: string;
      page?: number;
      page_size?: number;
    }) {
      return api.get<{
        items: CreativeTask[];
        total: number;
        page: number;
        page_size: number;
      }>("/admin/creative/tasks", { params });
    },

    get(taskId: string) {
      return api.get<{ task: CreativeTask }>(`/admin/creative/tasks/${taskId}`);
    },
  },

  templates: {
    list(params: {
      search?: string;
      status?: TemplateStatus | "";
      category?: string;
      is_public?: boolean;
      is_featured?: boolean;
      page?: number;
      page_size?: number;
    }) {
      return api.get<{
        items: Template[];
        total: number;
        page: number;
        page_size: number;
      }>("/admin/templates", { params });
    },

    get(templateId: string) {
      return api.get<{ template: Template }>(`/admin/templates/${templateId}`);
    },

    updateStatus(templateId: string, input: { status: TemplateStatus; reason?: string }) {
      return api.patch<{ template: Template }>(`/admin/templates/${templateId}/status`, {
        status: input.status,
        reason: input.reason || "",
      });
    },

    setFeatured(templateId: string, input: { is_featured: boolean }) {
      return api.patch<{ template: Template }>(`/admin/templates/${templateId}/featured`, {
        is_featured: input.is_featured,
      });
    },

    // Public content review
    getPublicReviewQueue(params?: { page?: number; page_size?: number; status?: string }) {
      return api.get<{
        items: {
          id: string;
          template_id: string;
          template_name: string;
          submitter_id: string;
          submitter_email: string;
          status: string;
          submitted_at: string;
          reviewed_at: string | null;
          reviewer_email: string | null;
        }[];
        total: number;
      }>("/admin/templates/public-review", { params: params || {} });
    },

    submitPublicReview(reviewId: string, input: { decision: "approved" | "rejected"; notes: string }) {
      return api.post<{ success: boolean }>(`/admin/templates/public-review/${reviewId}`, input);
    },

    // Version management
    getVersions(templateId: string) {
      return api.get<{
        versions: {
          id: string;
          version: string;
          changelog: string;
          is_current: boolean;
          created_at: string;
          created_by: string;
        }[];
      }>(`/admin/templates/${templateId}/versions`);
    },

    rollbackVersion(templateId: string, versionId: string, input: { reason: string }) {
      return api.post<{ success: boolean }>(`/admin/templates/${templateId}/versions/${versionId}/rollback`, input);
    },

    publishVersion(templateId: string, versionId: string) {
      return api.post<{ success: boolean }>(`/admin/templates/${templateId}/versions/${versionId}/publish`, {});
    },
  },

  tags: {
    list(params?: { search?: string; category?: string; page?: number; page_size?: number }) {
      return api.get<{
        items: Tag[];
        total: number;
        page: number;
        page_size: number;
      }>("/admin/tags", { params: params || {} });
    },

    create(input: { name: string; slug: string; category?: string; description?: string; color?: string }) {
      return api.post<{ tag: Tag }>("/admin/tags", input);
    },

    update(tagId: string, input: { name?: string; slug?: string; category?: string; description?: string; color?: string }) {
      return api.patch<{ tag: Tag }>(`/admin/tags/${tagId}`, input);
    },

    delete(tagId: string) {
      return api.delete<Record<string, never>>(`/admin/tags/${tagId}`);
    },
  },

  analytics: {
    workspace(workspaceId: string, params?: { period?: string }) {
      return api.get<{ analytics: WorkspaceAnalytics }>(`/admin/workspaces/${workspaceId}/analytics`, {
        params: params || {},
      });
    },

    modelUsage(params?: { workspace_id?: string; period?: string }) {
      return api.get<{ items: ModelUsage[] }>("/admin/analytics/model-usage", {
        params: params || {},
      });
    },

    overview() {
      return api.get<{
        total_users: number;
        total_workspaces: number;
        total_apps: number;
        total_executions: number;
        error_rate: number;
        pending_tickets: number;
      }>("/admin/analytics/overview");
    },
  },

  billing: {
    invoices: {
      list(params: {
        status?: InvoiceStatus | "";
        workspace_id?: string;
        search?: string;
        page?: number;
        page_size?: number;
      }) {
        return api.get<{
          items: Invoice[];
          total: number;
          page: number;
          page_size: number;
        }>("/admin/billing/invoices", { params });
      },

      get(invoiceId: string) {
        return api.get<{ invoice: Invoice }>(`/admin/billing/invoices/${invoiceId}`);
      },
    },

    earnings: {
      list(params: {
        status?: string;
        user_id?: string;
        source?: string;
        page?: number;
        page_size?: number;
      }) {
        return api.get<{
          items: Earning[];
          total: number;
          page: number;
          page_size: number;
        }>("/admin/earnings", { params });
      },

      summary() {
        return api.get<{
          total_pending: number;
          total_available: number;
          total_withdrawn: number;
          currency: string;
        }>("/admin/earnings/summary");
      },
    },

    withdrawals: {
      list(params: {
        status?: WithdrawalStatus | "";
        user_id?: string;
        page?: number;
        page_size?: number;
      }) {
        const fallbackPage = params.page ?? 1;
        const fallbackPageSize = params.page_size ?? 20;
        return requestRaw<ApiResponse<Withdrawal[] | ListResponse<Withdrawal>> | ListResponse<Withdrawal>>(
          "/admin/earnings/withdrawals",
          { params }
        ).then((payload) => normalizeListResponse(payload, fallbackPage, fallbackPageSize));
      },

      get(withdrawalId: string) {
        return api.get<{ withdrawal: Withdrawal }>(`/admin/earnings/withdrawals/${withdrawalId}`);
      },

      process(withdrawalId: string, input: { action: "approve" | "reject"; reason?: string }) {
        return api.post<{ message?: string }>(`/admin/earnings/withdrawals/${withdrawalId}/process`, {
          approved: input.action === "approve",
          reason: input.reason || "",
        });
      },
    },

    refunds: {
      list(params: {
        status?: RefundStatus | "";
        workspace_id?: string;
        page?: number;
        page_size?: number;
      }) {
        return api.get<{
          items: Refund[];
          total: number;
          page: number;
          page_size: number;
        }>("/admin/billing/refunds", { params });
      },

      get(refundId: string) {
        return api.get<{ refund: Refund }>(`/admin/billing/refunds/${refundId}`);
      },

      process(refundId: string, input: { action: "approve" | "reject"; reason?: string }) {
        return api.post<{ refund: Refund }>(`/admin/billing/refunds/${refundId}/process`, {
          action: input.action,
          reason: input.reason || "",
        });
      },
    },

    // Anomaly detection & correction
    anomalies: {
      list(params?: { page?: number; page_size?: number; status?: string; severity?: string }) {
        return api.get<{
          items: {
            id: string;
            type: string;
            workspace_id: string;
            workspace_name: string;
            description: string;
            amount: number;
            expected_amount: number;
            severity: string;
            status: string;
            detected_at: string;
            resolved_at: string | null;
          }[];
          total: number;
        }>("/admin/billing/anomalies", { params: params || {} });
      },

      resolve(anomalyId: string, input: { action: "correct" | "dismiss"; correction_amount?: number; notes: string }) {
        return api.post<{ success: boolean }>(`/admin/billing/anomalies/${anomalyId}/resolve`, input);
      },
    },

    // Rules & audit
    rules: {
      list(params?: { page?: number; page_size?: number }) {
        return api.get<{
          items: {
            id: string;
            name: string;
            type: string;
            config: Record<string, unknown>;
            enabled: boolean;
            created_at: string;
            updated_at: string;
          }[];
          total: number;
        }>("/admin/billing/rules", { params: params || {} });
      },

      update(ruleId: string, input: { config?: Record<string, unknown>; enabled?: boolean }) {
        return api.patch<{ success: boolean }>(`/admin/billing/rules/${ruleId}`, input);
      },

      getChangeHistory(params?: { page?: number; page_size?: number; rule_id?: string }) {
        return api.get<{
          items: {
            id: string;
            rule_id: string;
            rule_name: string;
            change_type: string;
            old_value: Record<string, unknown> | null;
            new_value: Record<string, unknown>;
            changed_by: string;
            reason: string;
            created_at: string;
          }[];
          total: number;
        }>("/admin/billing/rules/history", { params: params || {} });
      },
    },
  },

  security: {
    config: {
      list(params?: { category?: string; include_secrets?: boolean; page?: number; page_size?: number }) {
        return api.get<{
          items: ConfigItem[];
          total: number;
          page: number;
          page_size: number;
        }>("/admin/config/items", { params: params || {} });
      },

      get(configId: string) {
        return api.get<{ config: ConfigItem }>(`/admin/config/items/${configId}`);
      },

      update(configId: string, input: { value: string; reason?: string }) {
        return api.patch<{ config: ConfigItem }>(`/admin/config/items/${configId}`, {
          value: input.value,
          reason: input.reason || "",
        });
      },
    },

    secrets: {
      list(params?: { scope?: string; status?: string; page?: number; page_size?: number }) {
        return api.get<{
          items: Secret[];
          total: number;
          page: number;
          page_size: number;
        }>("/admin/secrets", { params: params || {} });
      },

      rotate(secretId: string, input?: { reason?: string }) {
        return api.post<{ secret: Secret }>(`/admin/secrets/${secretId}/rotate`, {
          reason: input?.reason || "",
        });
      },

      disable(secretId: string, input?: { reason?: string }) {
        return api.post<{ secret: Secret }>(`/admin/secrets/${secretId}/disable`, {
          reason: input?.reason || "",
        });
      },
    },

    auditLogs: {
      list(params: {
        action?: string;
        target_type?: string;
        actor_user_id?: string;
        start_date?: string;
        end_date?: string;
        page?: number;
        page_size?: number;
      }) {
        return api.get<{
          items: AuditLog[];
          total: number;
          page: number;
          page_size: number;
        }>("/admin/audit-logs", { params });
      },

      get(logId: string) {
        return api.get<{ log: AuditLog }>(`/admin/audit-logs/${logId}`);
      },

      export(params: { start_date: string; end_date: string; format: "csv" | "json" }) {
        return api.post<{ job_id: string; status: string }>("/admin/audit-logs/export", params);
      },

      getRetentionPolicy() {
        return api.get<{
          default_retention_days: number;
          sensitive_retention_days: number;
          archive_enabled: boolean;
          archive_destination: string;
        }>("/admin/audit-logs/retention-policy");
      },

      updateRetentionPolicy(input: {
        default_retention_days?: number;
        sensitive_retention_days?: number;
        archive_enabled?: boolean;
      }) {
        return api.patch<{ success: boolean }>("/admin/audit-logs/retention-policy", input);
      },
    },

    // Compliance view
    compliance: {
      getStatus() {
        return api.get<{
          overall_score: number;
          frameworks: {
            id: string;
            name: string;
            status: string;
            score: number;
            last_audit: string;
            controls_passed: number;
            controls_total: number;
          }[];
          recent_findings: {
            id: string;
            severity: string;
            title: string;
            framework: string;
            status: string;
            created_at: string;
          }[];
        }>("/admin/security/compliance");
      },

      getFrameworkDetails(frameworkId: string) {
        return api.get<{
          framework: {
            id: string;
            name: string;
            description: string;
            controls: {
              id: string;
              name: string;
              status: string;
              evidence: string[];
              notes: string;
            }[];
          };
        }>(`/admin/security/compliance/${frameworkId}`);
      },

      updateControlStatus(frameworkId: string, controlId: string, input: { status: string; notes: string }) {
        return api.patch<{ success: boolean }>(`/admin/security/compliance/${frameworkId}/controls/${controlId}`, input);
      },
    },

    // Supply chain scanning
    supplyChain: {
      getScanResults(params?: { severity?: string; page?: number; page_size?: number }) {
        return api.get<{
          summary: {
            total_dependencies: number;
            vulnerable: number;
            outdated: number;
            last_scan: string;
          };
          items: {
            id: string;
            package_name: string;
            current_version: string;
            recommended_version: string;
            severity: string;
            cve_ids: string[];
            description: string;
            fix_available: boolean;
          }[];
          total: number;
        }>("/admin/security/supply-chain", { params: params || {} });
      },

      triggerScan() {
        return api.post<{ job_id: string; status: string }>("/admin/security/supply-chain/scan", {});
      },

      dismissVulnerability(vulnId: string, input: { reason: string; until?: string }) {
        return api.post<{ success: boolean }>(`/admin/security/supply-chain/${vulnId}/dismiss`, input);
      },
    },
  },

  behaviorAnalytics: {
    list(params?: { period?: string; page?: number; page_size?: number }) {
      return api.get<{
        items: WorkspaceBehaviorMetric[];
        total: number;
        page: number;
        page_size: number;
      }>("/admin/analytics/workspace-behavior", { params: params || {} });
    },

    get(workspaceId: string, params?: { period?: string }) {
      return api.get<{ metrics: WorkspaceBehaviorMetric }>(`/admin/workspaces/${workspaceId}/behavior`, {
        params: params || {},
      });
    },
  },

  appUsageAnalytics: {
    list(params?: { workspace_id?: string; period?: string; page?: number; page_size?: number }) {
      return api.get<{
        items: AppUsageMetric[];
        total: number;
        page: number;
        page_size: number;
      }>("/admin/analytics/app-usage", { params: params || {} });
    },

    get(appId: string, params?: { period?: string }) {
      return api.get<{ metrics: AppUsageMetric }>(`/admin/apps/${appId}/usage`, {
        params: params || {},
      });
    },

    summary(params?: { period?: string }) {
      return api.get<{
        total_runs: number;
        total_cost: number;
        total_tokens: number;
        top_apps: { app_id: string; app_name: string; runs: number; cost: number }[];
      }>("/admin/analytics/app-usage/summary", { params: params || {} });
    },
  },

  metricsSubscriptions: {
    list(params?: { page?: number; page_size?: number }) {
      return api.get<{
        items: {
          id: string;
          name: string;
          metric_keys: string[];
          frequency: string;
          delivery_method: string;
          recipients: string[];
          enabled: boolean;
          last_sent_at: string | null;
          created_at: string;
        }[];
        total: number;
      }>("/admin/analytics/subscriptions", { params: params || {} });
    },

    create(input: {
      name: string;
      metric_keys: string[];
      frequency: "daily" | "weekly" | "monthly";
      delivery_method: "email" | "webhook";
      recipients: string[];
    }) {
      return api.post<{ subscription: { id: string; name: string } }>("/admin/analytics/subscriptions", input);
    },

    update(subscriptionId: string, input: {
      name?: string;
      metric_keys?: string[];
      frequency?: string;
      recipients?: string[];
      enabled?: boolean;
    }) {
      return api.patch<{ success: boolean }>(`/admin/analytics/subscriptions/${subscriptionId}`, input);
    },

    delete(subscriptionId: string) {
      return api.delete<{ success: boolean }>(`/admin/analytics/subscriptions/${subscriptionId}`);
    },

    getAvailableMetrics() {
      return api.get<{
        metrics: {
          key: string;
          name: string;
          category: string;
          description: string;
        }[];
      }>("/admin/analytics/available-metrics");
    },

    exportMetrics(input: {
      metric_keys: string[];
      start_date: string;
      end_date: string;
      format: "csv" | "json";
      granularity: "hourly" | "daily" | "weekly";
    }) {
      return api.post<{ job_id: string; status: string }>("/admin/analytics/export", input);
    },
  },

  exports: {
    list(params?: { status?: ExportJobStatus | ""; module?: string; page?: number; page_size?: number }) {
      return api.get<{
        items: ExportJob[];
        total: number;
        page: number;
        page_size: number;
      }>("/admin/exports", { params: params || {} });
    },

    create(input: {
      name: string;
      module: string;
      format: ExportFormat;
      filters?: Record<string, unknown>;
      fields?: string[];
    }) {
      return api.post<{ job: ExportJob }>("/admin/exports", input);
    },

    get(jobId: string) {
      return api.get<{ job: ExportJob }>(`/admin/exports/${jobId}`);
    },

    cancel(jobId: string) {
      return api.post<{ job: ExportJob }>(`/admin/exports/${jobId}/cancel`, {});
    },

    download(jobId: string) {
      return api.get<{ download_url: string }>(`/admin/exports/${jobId}/download`);
    },
  },
};

