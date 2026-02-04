/**
 * Ops / Queue related types for Admin console.
 */

export interface DeadTask {
  id: string;
  queue: string;
  type: string;
  state?: string;
  payload?: string;
  max_retry?: number;
  retried?: number;
  last_err?: string;
  last_failed_at?: string;
  next_process_at?: string;
}

export interface DeadTaskListResponse {
  queue: string;
  page: number;
  page_size: number;
  tasks: DeadTask[];
}

/**
 * Ops SOP types
 */
export interface OpsSopReference {
  label: string;
  target: string;
}

export interface OpsSopStep {
  title: string;
  actions: string[];
  expected?: string;
}

export interface OpsSop {
  key: string;
  title: string;
  summary: string;
  severity: string;
  owners: string[];
  triggers: string[];
  preconditions: string[];
  steps: OpsSopStep[];
  escalation?: string;
  rollbackPlan?: string;
  references?: OpsSopReference[];
}

/**
 * Background job / task monitoring types
 */
export type JobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
export type JobType = "export" | "migration" | "backup" | "cleanup" | "sync" | "report";

export interface BackgroundJob {
  id: string;
  type: JobType;
  name: string;
  description?: string;
  status: JobStatus;
  progress?: number;
  total_items?: number;
  processed_items?: number;
  error_message?: string;
  result_url?: string;
  initiated_by: string;
  initiator_email?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  expires_at?: string;
}

export interface BackgroundJobListResponse {
  jobs: BackgroundJob[];
  page: number;
  page_size: number;
  total: number;
}

/**
 * System log types
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
export type LogSource = "api" | "worker" | "scheduler" | "webhook" | "runtime" | "db";

export interface SystemLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: LogSource;
  service: string;
  message: string;
  trace_id?: string;
  request_id?: string;
  user_id?: string;
  workspace_id?: string;
  metadata?: Record<string, unknown>;
}

export interface SystemLogListResponse {
  logs: SystemLog[];
  page: number;
  page_size: number;
  total: number;
}

export interface LogDownloadRequest {
  id: string;
  name: string;
  status: JobStatus;
  filters: {
    level?: LogLevel[];
    source?: LogSource[];
    start_time?: string;
    end_time?: string;
    search?: string;
  };
  file_url?: string;
  file_size_bytes?: number;
  created_at: string;
  completed_at?: string;
  expires_at?: string;
}

/**
 * Ops change record types
 */
export type ChangeType = "config" | "feature_flag" | "secret" | "deployment" | "scaling" | "maintenance";
export type ChangeStatus = "pending" | "approved" | "rejected" | "applied" | "rolled_back";

export interface OpsChange {
  id: string;
  type: ChangeType;
  title: string;
  description: string;
  status: ChangeStatus;
  risk_level: "low" | "medium" | "high" | "critical";
  requested_by: string;
  requester_email?: string;
  approved_by?: string;
  approver_email?: string;
  applied_by?: string;
  applier_email?: string;
  changes: {
    field: string;
    old_value?: string;
    new_value?: string;
  }[];
  rollback_plan?: string;
  created_at: string;
  approved_at?: string;
  applied_at?: string;
  rolled_back_at?: string;
}

export interface OpsChangeListResponse {
  changes: OpsChange[];
  page: number;
  page_size: number;
  total: number;
}
