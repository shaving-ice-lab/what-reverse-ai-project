/**
 * Ops API client for Admin console.
 */

import { api } from "@/lib/api";
import type {
  DeadTask,
  DeadTaskListResponse,
  BackgroundJob,
  BackgroundJobListResponse,
  JobStatus,
  JobType,
  SystemLog,
  SystemLogListResponse,
  LogLevel,
  LogSource,
  LogDownloadRequest,
  OpsSop,
  OpsChange,
  OpsChangeListResponse,
  ChangeType,
  ChangeStatus,
} from "@/types/ops";

type RawDeadTask = Record<string, unknown>;

const toStringValue = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
};

const toNumberValue = (value: unknown): number | undefined => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

const mapDeadTask = (task: RawDeadTask, fallbackQueue: string): DeadTask => ({
  id: toStringValue(task.ID ?? task.id) || "",
  queue: toStringValue(task.Queue ?? task.queue) || fallbackQueue,
  type: toStringValue(task.Type ?? task.type) || "",
  state: toStringValue(task.State ?? task.state),
  payload: toStringValue(task.Payload ?? task.payload),
  max_retry: toNumberValue(task.MaxRetry ?? task.max_retry),
  retried: toNumberValue(task.Retried ?? task.retried),
  last_err: toStringValue(task.LastErr ?? task.last_err),
  last_failed_at: toStringValue(task.LastFailedAt ?? task.last_failed_at),
  next_process_at: toStringValue(task.NextProcessAt ?? task.next_process_at),
});

type RawOpsSopReference = {
  label?: string;
  target?: string;
  Label?: string;
  Target?: string;
};

type RawOpsSopStep = {
  title?: string;
  actions?: string[];
  expected?: string;
  Title?: string;
  Actions?: string[];
  Expected?: string;
};

type RawOpsSop = {
  key?: string;
  title?: string;
  summary?: string;
  severity?: string;
  owners?: string[];
  triggers?: string[];
  preconditions?: string[];
  steps?: RawOpsSopStep[];
  escalation?: string;
  rollback_plan?: string;
  references?: RawOpsSopReference[];
  Key?: string;
  Title?: string;
  Summary?: string;
  Severity?: string;
  Owners?: string[];
  Triggers?: string[];
  Preconditions?: string[];
  Steps?: RawOpsSopStep[];
  Escalation?: string;
  RollbackPlan?: string;
  References?: RawOpsSopReference[];
};

const mapOpsSopReference = (reference: RawOpsSopReference): { label: string; target: string } => ({
  label: toStringValue(reference.label ?? reference.Label) || "",
  target: toStringValue(reference.target ?? reference.Target) || "",
});

const mapOpsSopStep = (step: RawOpsSopStep): { title: string; actions: string[]; expected?: string } => ({
  title: toStringValue(step.title ?? step.Title) || "",
  actions: (step.actions ?? step.Actions ?? []) as string[],
  expected: toStringValue(step.expected ?? step.Expected),
});

const mapOpsSop = (sop: RawOpsSop): OpsSop => ({
  key: toStringValue(sop.key ?? sop.Key) || "",
  title: toStringValue(sop.title ?? sop.Title) || "",
  summary: toStringValue(sop.summary ?? sop.Summary) || "",
  severity: toStringValue(sop.severity ?? sop.Severity) || "",
  owners: (sop.owners ?? sop.Owners ?? []) as string[],
  triggers: (sop.triggers ?? sop.Triggers ?? []) as string[],
  preconditions: (sop.preconditions ?? sop.Preconditions ?? []) as string[],
  steps: (sop.steps ?? sop.Steps ?? []).map(mapOpsSopStep),
  escalation: toStringValue(sop.escalation ?? sop.Escalation),
  rollbackPlan: toStringValue(sop.rollback_plan ?? sop.RollbackPlan),
  references: (sop.references ?? sop.References ?? []).map(mapOpsSopReference),
});

export const opsApi = {
  // Dead tasks
  async listDeadTasks(params: {
    queue?: string;
    page?: number;
    page_size?: number;
  }): Promise<DeadTaskListResponse> {
    const data = await api.get<{
      queue?: string;
      page?: number;
      page_size?: number;
      tasks?: RawDeadTask[];
    }>("/ops/queues/dead", { params });

    const queue = data.queue || params.queue || "execution";
    const tasks = (data.tasks || []).map((task) => mapDeadTask(task, queue));

    return {
      queue,
      page: data.page || params.page || 1,
      page_size: data.page_size || params.page_size || 20,
      tasks,
    };
  },

  retryDeadTask(queue: string, taskId: string) {
    return api.post<{ queue: string; task_id: string; replayed: boolean }>(
      `/ops/queues/dead/${taskId}/retry`,
      undefined,
      { params: { queue } }
    );
  },

  deleteDeadTask(queue: string, taskId: string) {
    return api.delete<{ queue: string; task_id: string; deleted: boolean }>(
      `/ops/queues/dead/${taskId}`,
      { params: { queue } }
    );
  },

  // Ops SOPs
  async listSops(): Promise<OpsSop[]> {
    const data = await api.get<{ sops?: RawOpsSop[] }>("/admin/ops/sops");
    return (data.sops || []).map(mapOpsSop);
  },

  async getSop(key: string): Promise<OpsSop | null> {
    const data = await api.get<{ sop?: RawOpsSop }>(`/admin/ops/sops/${key}`);
    return data.sop ? mapOpsSop(data.sop) : null;
  },

  // Background jobs
  async listJobs(params: {
    type?: JobType;
    status?: JobStatus;
    page?: number;
    page_size?: number;
  }): Promise<BackgroundJobListResponse> {
    return api.get<BackgroundJobListResponse>("/admin/ops/jobs", { params });
  },

  async getJob(jobId: string): Promise<BackgroundJob> {
    return api.get<BackgroundJob>(`/admin/ops/jobs/${jobId}`);
  },

  async cancelJob(jobId: string): Promise<{ cancelled: boolean }> {
    return api.post<{ cancelled: boolean }>(`/admin/ops/jobs/${jobId}/cancel`);
  },

  async retryJob(jobId: string): Promise<BackgroundJob> {
    return api.post<BackgroundJob>(`/admin/ops/jobs/${jobId}/retry`);
  },

  // System logs
  async listLogs(params: {
    level?: LogLevel[];
    source?: LogSource[];
    search?: string;
    start_time?: string;
    end_time?: string;
    page?: number;
    page_size?: number;
  }): Promise<SystemLogListResponse> {
    const query = {
      ...params,
      level: params.level?.join(","),
      source: params.source?.join(","),
    };
    return api.get<SystemLogListResponse>("/admin/ops/logs", { params: query });
  },

  async createLogDownload(params: {
    name: string;
    level?: LogLevel[];
    source?: LogSource[];
    search?: string;
    start_time?: string;
    end_time?: string;
  }): Promise<LogDownloadRequest> {
    return api.post<LogDownloadRequest>("/admin/ops/logs/download", params);
  },

  async listLogDownloads(): Promise<LogDownloadRequest[]> {
    const data = await api.get<{ downloads: LogDownloadRequest[] }>("/admin/ops/logs/downloads");
    return data.downloads || [];
  },

  // Ops changes
  async listChanges(params: {
    type?: ChangeType;
    status?: ChangeStatus;
    page?: number;
    page_size?: number;
  }): Promise<OpsChangeListResponse> {
    return api.get<OpsChangeListResponse>("/admin/ops/changes", { params });
  },

  async getChange(changeId: string): Promise<OpsChange> {
    return api.get<OpsChange>(`/admin/ops/changes/${changeId}`);
  },

  async approveChange(changeId: string, note?: string): Promise<OpsChange> {
    return api.post<OpsChange>(`/admin/ops/changes/${changeId}/approve`, { note });
  },

  async rejectChange(changeId: string, reason: string): Promise<OpsChange> {
    return api.post<OpsChange>(`/admin/ops/changes/${changeId}/reject`, { reason });
  },

  async applyChange(changeId: string): Promise<OpsChange> {
    return api.post<OpsChange>(`/admin/ops/changes/${changeId}/apply`);
  },

  async rollbackChange(changeId: string, reason: string): Promise<OpsChange> {
    return api.post<OpsChange>(`/admin/ops/changes/${changeId}/rollback`, { reason });
  },
};
