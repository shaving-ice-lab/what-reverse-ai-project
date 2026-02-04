"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  RefreshCw,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import { request } from "@/lib/api/shared";
import { cn } from "@/lib/utils";

const WORKSPACE_STORAGE_KEY = "last_workspace_id";
const HISTORY_STORAGE_KEY = "data-transfer-history-v1";
const MAX_HISTORY_ITEMS = 20;
const MAX_IMPORT_MB = 5;
const MAX_IMPORT_BYTES = MAX_IMPORT_MB * 1024 * 1024;
const AUDIT_ACTIONS = [
  "app.export",
  "workflow.import",
  "app.schema.import",
  "workspace.db.backup",
  "workspace.db.restore",
];

type ApiResponse<T> = {
  code: string;
  message: string;
  data: T;
};

type ApiListResponse<T> = ApiResponse<T> & {
  meta?: { total?: number; page?: number; page_size?: number };
};

type AppOption = {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
  status?: string;
};

type WorkflowImportResponse = {
  workflow?: { id: string; name?: string };
};

type ExportConfigResponse = {
  export?: { exported_at?: string };
  filename?: string;
};

type SchemaImportResponse = {
  version?: { id?: string; version?: string };
};

type BackupResponse = {
  backup?: { backup_id: string; tables: number; database?: string };
};

type RestoreResponse = {
  restore?: { backup_id: string; restored_tables: number };
};

type AuditLogRecord = {
  id: string;
  workspace_id: string;
  action: string;
  target_type: string;
  target_id?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
};

type HistoryEntry = {
  id: string;
  workspaceId: string;
  action:
    | "app_export"
    | "workflow_import"
    | "schema_import"
    | "db_backup"
    | "db_restore"
    | "app.export"
    | "workflow.import"
    | "app.schema.import"
    | "workspace.db.backup"
    | "workspace.db.restore";
  status: "success" | "failed";
  label: string;
  detail?: string;
  timestamp: string;
};

const extractAppList = (payload: unknown): AppOption[] => {
  if (!payload || typeof payload !== "object") return [];
  const data = (payload as { data?: unknown }).data ?? payload;
  if (Array.isArray(data)) return data as AppOption[];
  if (data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: AppOption[] }).items;
  }
  if (Array.isArray((payload as { items?: unknown }).items)) {
    return (payload as { items: AppOption[] }).items;
  }
  return [];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const createHistoryId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const formatHistoryTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN");
};

const loadHistoryFromStorage = (workspaceId: string): HistoryEntry[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((entry) => entry.workspaceId === workspaceId);
    }
    if (parsed && typeof parsed === "object") {
      const list = (parsed as Record<string, unknown>)[workspaceId];
      return Array.isArray(list) ? (list as HistoryEntry[]) : [];
    }
  } catch {
    // ignore invalid storage
  }
  return [];
};

const saveHistoryToStorage = (workspaceId: string, entries: HistoryEntry[]) => {
  if (typeof window === "undefined") return;
  let store: Record<string, HistoryEntry[]> = {};
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        store = parsed as Record<string, HistoryEntry[]>;
      }
    }
  } catch {
    store = {};
  }
  store[workspaceId] = entries;
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(store));
};

const validateJsonFile = (file: File, label: string) => {
  if (!file) return `请选择${label} JSON 文件`;
  if (!file.name.toLowerCase().endsWith(".json")) return "仅支持 .json 文件";
  if (file.size === 0) return "文件为空";
  if (file.size > MAX_IMPORT_BYTES) return `文件超过 ${MAX_IMPORT_MB}MB，请拆分后再导入`;
  if (file.type && !file.type.toLowerCase().includes("json")) return "文件类型必须为 JSON";
  return null;
};

const readJsonFile = async (file: File) => {
  const text = await file.text();
  const parsed = JSON.parse(text) as unknown;
  if (!isRecord(parsed)) {
    throw new Error("JSON 顶层必须是对象");
  }
  return parsed;
};

const validateWorkflowPayload = (payload: Record<string, unknown>) => {
  const rawWorkflow = isRecord(payload.workflow) ? payload.workflow : payload;
  if (!isRecord(rawWorkflow)) return "工作流结构无效";
  if (rawWorkflow.name !== undefined && typeof rawWorkflow.name !== "string") {
    return "workflow.name 必须是字符串";
  }
  if (
    rawWorkflow.description !== undefined &&
    typeof rawWorkflow.description !== "string" &&
    rawWorkflow.description !== null
  ) {
    return "workflow.description 必须是字符串或 null";
  }
  if (rawWorkflow.definition !== undefined && !isRecord(rawWorkflow.definition)) {
    return "workflow.definition 必须是对象";
  }
  if (
    rawWorkflow.variables !== undefined &&
    rawWorkflow.variables !== null &&
    !isRecord(rawWorkflow.variables)
  ) {
    return "workflow.variables 必须是对象";
  }
  if (rawWorkflow.trigger_type !== undefined && typeof rawWorkflow.trigger_type !== "string") {
    return "workflow.trigger_type 必须是字符串";
  }
  if (
    rawWorkflow.trigger_config !== undefined &&
    rawWorkflow.trigger_config !== null &&
    !isRecord(rawWorkflow.trigger_config)
  ) {
    return "workflow.trigger_config 必须是对象";
  }

  const definition = isRecord(rawWorkflow.definition) ? rawWorkflow.definition : rawWorkflow;
  const nodes = (definition as { nodes?: unknown }).nodes ?? (rawWorkflow as { nodes?: unknown }).nodes;
  const edges = (definition as { edges?: unknown }).edges ?? (rawWorkflow as { edges?: unknown }).edges;
  if (nodes !== undefined && !Array.isArray(nodes)) return "nodes 必须是数组";
  if (edges !== undefined && !Array.isArray(edges)) return "edges 必须是数组";
  if (!Array.isArray(nodes) && !Array.isArray(edges)) return "未找到 nodes 或 edges";

  if (Array.isArray(nodes)) {
    for (const node of nodes) {
      if (!isRecord(node)) return "nodes 项必须是对象";
      if (typeof node.id !== "string" || node.id.trim() === "") {
        return "nodes.id 必须是非空字符串";
      }
    }
  }
  if (Array.isArray(edges)) {
    for (const edge of edges) {
      if (!isRecord(edge)) return "edges 项必须是对象";
      if (typeof edge.source !== "string" || edge.source.trim() === "") {
        return "edges.source 必须是非空字符串";
      }
      if (typeof edge.target !== "string" || edge.target.trim() === "") {
        return "edges.target 必须是非空字符串";
      }
    }
  }
  return null;
};

const validateSchemaPayload = (payload: Record<string, unknown>) => {
  const version = isRecord(payload.current_version)
    ? payload.current_version
    : isRecord(payload.version)
      ? payload.version
      : payload;
  if (!isRecord(version)) return "Schema 结构无效";

  const uiSchema = (version.ui_schema ?? payload.ui_schema) ?? undefined;
  const dbSchema = (version.db_schema ?? payload.db_schema) ?? undefined;
  const configJson = (version.config_json ?? payload.config_json) ?? undefined;
  const workflowId = version.workflow_id ?? payload.workflow_id;

  if (uiSchema === undefined && dbSchema === undefined && configJson === undefined) {
    return "未找到 ui_schema/db_schema/config_json";
  }
  if (uiSchema !== undefined && !isRecord(uiSchema)) return "ui_schema 必须是对象";
  if (dbSchema !== undefined && !isRecord(dbSchema)) return "db_schema 必须是对象";
  if (configJson !== undefined && !isRecord(configJson)) return "config_json 必须是对象";
  if (workflowId !== undefined && workflowId !== null && typeof workflowId !== "string") {
    return "workflow_id 必须是字符串";
  }
  return null;
};

const auditActionLabels: Record<string, string> = {
  "app.export": "App 配置导出",
  "workflow.import": "工作流导入",
  "app.schema.import": "Schema 导入",
  "workspace.db.backup": "数据库备份",
  "workspace.db.restore": "数据库恢复",
};

const readStringValue = (value: unknown) => (typeof value === "string" ? value : "");

const readNumberValue = (value: unknown) => (typeof value === "number" ? value : null);

const buildAuditDetail = (action: string, metadata?: Record<string, unknown>) => {
  if (!metadata) return "";
  const backupId = readStringValue(metadata.backup_id);
  const workflowName = readStringValue(metadata.workflow_name);
  const filename = readStringValue(metadata.filename);
  const appName = readStringValue(metadata.app_name);
  const version = readStringValue(metadata.version);
  const versionId = readStringValue(metadata.version_id);
  const tables = readNumberValue(metadata.tables);
  const restoredTables = readNumberValue(metadata.restored_tables);
  const status = readStringValue(metadata.status);
  const errorMessage = readStringValue(metadata.error);

  if (status === "failed" && errorMessage) {
    return errorMessage;
  }

  switch (action) {
    case "app.export":
      if (appName && filename) return `${appName} · ${filename}`;
      if (appName) return appName;
      return filename || "";
    case "workflow.import":
      return workflowName || readStringValue(metadata.workflow_id);
    case "app.schema.import":
      if (version) return `版本 ${version}`;
      if (versionId) return `版本 ${versionId.slice(0, 8)}`;
      return "";
    case "workspace.db.backup":
      if (backupId && typeof tables === "number") return `备份 ${backupId} · ${tables} 张表`;
      return backupId ? `备份 ${backupId}` : "";
    case "workspace.db.restore":
      if (backupId && typeof restoredTables === "number") return `备份 ${backupId} · ${restoredTables} 张表`;
      return backupId ? `备份 ${backupId}` : "";
    default:
      return "";
  }
};

const mapAuditLogToHistoryEntry = (log: AuditLogRecord): HistoryEntry => {
  const metadata = isRecord(log.metadata) ? (log.metadata as Record<string, unknown>) : undefined;
  const label = auditActionLabels[log.action] || log.action;
  const detail = buildAuditDetail(log.action, metadata);
  const status = readStringValue(metadata?.status) === "failed" ? "failed" : "success";
  return {
    id: log.id,
    workspaceId: log.workspace_id,
    action: log.action as HistoryEntry["action"],
    status,
    label,
    detail: detail || undefined,
    timestamp: log.created_at,
  };
};

const downloadJson = (payload: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const resolveWorkflowImport = (payload: Record<string, unknown>, fallbackName: string) => {
  const rawWorkflow = (payload.workflow as Record<string, unknown> | undefined) ?? payload;
  const definition = (rawWorkflow.definition as Record<string, unknown> | undefined) ?? {};
  const nodes = Array.isArray((definition as { nodes?: unknown }).nodes)
    ? (definition as { nodes: unknown[] }).nodes
    : Array.isArray((rawWorkflow as { nodes?: unknown }).nodes)
      ? (rawWorkflow as { nodes: unknown[] }).nodes
      : [];
  const edges = Array.isArray((definition as { edges?: unknown }).edges)
    ? (definition as { edges: unknown[] }).edges
    : Array.isArray((rawWorkflow as { edges?: unknown }).edges)
      ? (rawWorkflow as { edges: unknown[] }).edges
      : [];

  return {
    name: (rawWorkflow.name as string) || fallbackName,
    description: (rawWorkflow.description as string | null) ?? null,
    icon: (rawWorkflow.icon as string) || "⚡",
    definition: {
      ...definition,
      nodes,
      edges,
    },
    variables: (rawWorkflow.variables as Record<string, unknown>) ?? {},
    trigger_type: (rawWorkflow.trigger_type as string) || "manual",
    trigger_config: (rawWorkflow.trigger_config as Record<string, unknown>) ?? {},
  };
};

const resolveSchemaPayload = (payload: Record<string, unknown>) => {
  const version = (payload.current_version as Record<string, unknown> | undefined)
    ?? (payload.version as Record<string, unknown> | undefined)
    ?? payload;

  return {
    ui_schema: (version.ui_schema ?? payload.ui_schema) as Record<string, unknown> | undefined,
    db_schema: (version.db_schema ?? payload.db_schema) as Record<string, unknown> | undefined,
    config_json: (version.config_json ?? payload.config_json) as Record<string, unknown> | undefined,
    workflow_id: (version.workflow_id ?? payload.workflow_id) as string | undefined,
  };
};

export default function ExportPage() {
  const router = useRouter();
  const workflowFileRef = useRef<HTMLInputElement | null>(null);
  const schemaFileRef = useRef<HTMLInputElement | null>(null);

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [apps, setApps] = useState<AppOption[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  const [selectedAppId, setSelectedAppId] = useState("");
  const [schemaAppId, setSchemaAppId] = useState("");

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<{ filename: string; exportedAt?: string } | null>(null);

  const [workflowImporting, setWorkflowImporting] = useState(false);
  const [workflowImportError, setWorkflowImportError] = useState<string | null>(null);
  const [workflowImportResult, setWorkflowImportResult] = useState<{ id: string; name: string } | null>(null);

  const [schemaImporting, setSchemaImporting] = useState(false);
  const [schemaImportError, setSchemaImportError] = useState<string | null>(null);
  const [schemaImportResult, setSchemaImportResult] = useState<{ versionId?: string } | null>(null);

  const [backupLoading, setBackupLoading] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [backupResult, setBackupResult] = useState<{ backupId: string; tables: number; database?: string } | null>(null);

  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreBackupId, setRestoreBackupId] = useState("");
  const [restoreResult, setRestoreResult] = useState<{ backupId: string; restoredTables: number } | null>(null);

  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historySource, setHistorySource] = useState<"backend" | "local">("local");
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedId = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (storedId) {
      setActiveWorkspaceId(storedId);
    }
  }, []);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    let isActive = true;

    const loadApps = async () => {
      try {
        setAppsLoading(true);
        const response = await request<ApiResponse<unknown>>(
          `/apps?workspace_id=${activeWorkspaceId}`
        );
        const resolved = extractAppList(response.data);
        if (isActive) {
          setApps(resolved);
          if (!selectedAppId && resolved.length > 0) {
            setSelectedAppId(resolved[0].id);
          }
          if (!schemaAppId && resolved.length > 0) {
            setSchemaAppId(resolved[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to load apps:", error);
        if (isActive) setApps([]);
      } finally {
        if (isActive) setAppsLoading(false);
      }
    };

    loadApps();
    return () => {
      isActive = false;
    };
  }, [activeWorkspaceId, selectedAppId, schemaAppId]);

  const appOptions = useMemo(() => apps, [apps]);

  const fetchAuditHistory = useCallback(async (workspaceId: string) => {
    setHistoryLoading(true);
    try {
      const actionsParam = encodeURIComponent(AUDIT_ACTIONS.join(","));
      const response = await request<ApiListResponse<AuditLogRecord[]>>(
        `/workspaces/${workspaceId}/audit-logs?actions=${actionsParam}&page=1&page_size=${MAX_HISTORY_ITEMS}`
      );
      const logs = Array.isArray(response.data) ? response.data : [];
      const mapped = logs.map(mapAuditLogToHistoryEntry);
      setHistoryEntries(mapped);
      setHistorySource("backend");
    } catch (error) {
      setHistoryEntries(loadHistoryFromStorage(workspaceId));
      setHistorySource("local");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const recordClientAudit = useCallback(
    async (action: "workflow.import" | "app.schema.import", metadata: Record<string, unknown>) => {
      if (!activeWorkspaceId) return;
      try {
        await request<ApiResponse<{ recorded: boolean }>>(
          `/workspaces/${activeWorkspaceId}/audit-logs/client`,
          {
            method: "POST",
            body: JSON.stringify({
              action,
              target_type: action === "workflow.import" ? "workflow" : "app_version",
              metadata,
            }),
          }
        );
        await fetchAuditHistory(activeWorkspaceId);
      } catch {
        // ignore audit write failures
      }
    },
    [activeWorkspaceId, fetchAuditHistory]
  );

  useEffect(() => {
    if (!activeWorkspaceId) {
      setHistoryEntries([]);
      setHistorySource("local");
      return;
    }
    fetchAuditHistory(activeWorkspaceId);
  }, [activeWorkspaceId, fetchAuditHistory]);

  const addHistoryEntry = (entry: Omit<HistoryEntry, "id" | "timestamp" | "workspaceId">) => {
    if (!activeWorkspaceId) return;
    setHistoryEntries((prev) => {
      const next: HistoryEntry[] = [
        {
          id: createHistoryId(),
          workspaceId: activeWorkspaceId,
          timestamp: new Date().toISOString(),
          ...entry,
        },
        ...prev,
      ].slice(0, MAX_HISTORY_ITEMS);
      saveHistoryToStorage(activeWorkspaceId, next);
      if (historySource === "local") {
        return next;
      }
      return prev;
    });
  };

  const handleExportAppConfig = async () => {
    if (!selectedAppId) return;
    setExporting(true);
    setExportError(null);
    setExportResult(null);
    try {
      const appName =
        appOptions.find((app) => app.id === selectedAppId)?.name ??
        `App ${selectedAppId.slice(0, 8)}`;
      const response = await request<ApiResponse<ExportConfigResponse>>(
        `/apps/${selectedAppId}/export`
      );
      const exportPayload = response.data?.export ?? response.data;
      const filename =
        response.data?.filename || `app-${selectedAppId.slice(0, 8)}-config.json`;
      downloadJson(exportPayload, filename);
      setExportResult({
        filename,
        exportedAt: response.data?.export?.exported_at,
      });
      addHistoryEntry({
        action: "app_export",
        status: "success",
        label: "App 配置导出",
        detail: `${appName} · ${filename}`,
      });
      if (activeWorkspaceId) {
        await fetchAuditHistory(activeWorkspaceId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "导出失败";
      setExportError(message);
      addHistoryEntry({
        action: "app_export",
        status: "failed",
        label: "App 配置导出",
        detail: message,
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImportWorkflow = async () => {
    const file = workflowFileRef.current?.files?.[0];
    const fileError = file ? validateJsonFile(file, "工作流") : "请选择工作流 JSON 文件";
    if (fileError) {
      setWorkflowImportError(fileError);
      await recordClientAudit("workflow.import", {
        status: "failed",
        error: fileError,
        file_name: file?.name,
        validation_stage: "file",
      });
      if (file) {
        addHistoryEntry({
          action: "workflow_import",
          status: "failed",
          label: "工作流导入",
          detail: `${file.name} · ${fileError}`,
        });
      }
      return;
    }
    setWorkflowImporting(true);
    setWorkflowImportError(null);
    setWorkflowImportResult(null);
    try {
      const payload = await readJsonFile(file);
      const validationError = validateWorkflowPayload(payload);
      if (validationError) {
        throw new Error(validationError);
      }
      const fallbackName = file.name.replace(/\.[^/.]+$/, "");
      const workflow = resolveWorkflowImport(payload, fallbackName);
      const response = await request<ApiResponse<WorkflowImportResponse>>("/workflows/import", {
        method: "POST",
        body: JSON.stringify({ workflow }),
      });
      const imported = response.data?.workflow;
      if (!imported?.id) {
        throw new Error("导入成功但未返回工作流 ID");
      }
      setWorkflowImportResult({
        id: imported.id,
        name: imported.name || workflow.name,
      });
      addHistoryEntry({
        action: "workflow_import",
        status: "success",
        label: "工作流导入",
        detail: `${file.name} · ${imported.name || workflow.name}`,
      });
      if (activeWorkspaceId) {
        await fetchAuditHistory(activeWorkspaceId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "导入失败";
      await recordClientAudit("workflow.import", {
        status: "failed",
        error: message,
        file_name: file?.name,
        validation_stage: "content",
      });
      setWorkflowImportError(message);
      addHistoryEntry({
        action: "workflow_import",
        status: "failed",
        label: "工作流导入",
        detail: `${file.name} · ${message}`,
      });
    } finally {
      setWorkflowImporting(false);
      if (workflowFileRef.current) workflowFileRef.current.value = "";
    }
  };

  const handleImportSchema = async () => {
    const file = schemaFileRef.current?.files?.[0];
    if (!schemaAppId) {
      setSchemaImportError("请选择目标 App");
      await recordClientAudit("app.schema.import", {
        status: "failed",
        error: "未选择目标 App",
        validation_stage: "context",
        app_id: schemaAppId,
        source: "schema_import",
      });
      return;
    }
    const fileError = file ? validateJsonFile(file, "Schema") : "请选择 Schema JSON 文件";
    if (fileError) {
      setSchemaImportError(fileError);
      await recordClientAudit("app.schema.import", {
        status: "failed",
        error: fileError,
        file_name: file?.name,
        validation_stage: "file",
        app_id: schemaAppId,
        source: "schema_import",
      });
      if (file) {
        addHistoryEntry({
          action: "schema_import",
          status: "failed",
          label: "Schema 导入",
          detail: `${file.name} · ${fileError}`,
        });
      }
      return;
    }
    setSchemaImporting(true);
    setSchemaImportError(null);
    setSchemaImportResult(null);
    try {
      const payload = await readJsonFile(file);
      const validationError = validateSchemaPayload(payload);
      if (validationError) {
        throw new Error(validationError);
      }
      const schema = resolveSchemaPayload(payload);
      const requestBody: Record<string, unknown> = {
        changelog: `导入 Schema · ${new Date().toISOString()}`,
        source: "schema_import",
      };
      if (schema.ui_schema) requestBody.ui_schema = schema.ui_schema;
      if (schema.db_schema) requestBody.db_schema = schema.db_schema;
      if (schema.config_json) requestBody.config_json = schema.config_json;
      if (schema.workflow_id) requestBody.workflow_id = schema.workflow_id;

      const response = await request<ApiResponse<SchemaImportResponse>>(
        `/apps/${schemaAppId}/versions`,
        {
          method: "POST",
          body: JSON.stringify(requestBody),
        }
      );
      setSchemaImportResult({
        versionId: response.data?.version?.id,
      });
      const appName =
        appOptions.find((app) => app.id === schemaAppId)?.name ??
        `App ${schemaAppId.slice(0, 8)}`;
      addHistoryEntry({
        action: "schema_import",
        status: "success",
        label: "Schema 导入",
        detail: `${appName} · ${file.name}`,
      });
      if (activeWorkspaceId) {
        await fetchAuditHistory(activeWorkspaceId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "导入失败";
      await recordClientAudit("app.schema.import", {
        status: "failed",
        error: message,
        file_name: file?.name,
        validation_stage: "content",
        app_id: schemaAppId,
        source: "schema_import",
      });
      setSchemaImportError(message);
      addHistoryEntry({
        action: "schema_import",
        status: "failed",
        label: "Schema 导入",
        detail: `${file.name} · ${message}`,
      });
    } finally {
      setSchemaImporting(false);
      if (schemaFileRef.current) schemaFileRef.current.value = "";
    }
  };

  const handleBackup = async () => {
    if (!activeWorkspaceId) return;
    setBackupLoading(true);
    setBackupError(null);
    setBackupResult(null);
    try {
      const response = await request<ApiResponse<BackupResponse>>(
        `/workspaces/${activeWorkspaceId}/database/backup`,
        { method: "POST" }
      );
      const backup = response.data?.backup;
      if (!backup?.backup_id) {
        throw new Error("备份创建成功但未返回备份 ID");
      }
      setBackupResult({
        backupId: backup.backup_id,
        tables: backup.tables,
        database: backup.database,
      });
      setRestoreBackupId(backup.backup_id);
      addHistoryEntry({
        action: "db_backup",
        status: "success",
        label: "数据库备份",
        detail: `备份 ${backup.backup_id} · ${backup.tables} 张表`,
      });
      if (activeWorkspaceId) {
        await fetchAuditHistory(activeWorkspaceId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "备份失败";
      setBackupError(message);
      addHistoryEntry({
        action: "db_backup",
        status: "failed",
        label: "数据库备份",
        detail: message,
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!activeWorkspaceId) return;
    if (!restoreBackupId.trim()) {
      setRestoreError("请输入备份 ID");
      return;
    }
    setRestoreLoading(true);
    setRestoreError(null);
    setRestoreResult(null);
    try {
      const response = await request<ApiResponse<RestoreResponse>>(
        `/workspaces/${activeWorkspaceId}/database/restore`,
        {
          method: "POST",
          body: JSON.stringify({ backup_id: restoreBackupId.trim() }),
        }
      );
      const restore = response.data?.restore;
      if (!restore?.backup_id) {
        throw new Error("恢复成功但未返回恢复结果");
      }
      setRestoreResult({
        backupId: restore.backup_id,
        restoredTables: restore.restored_tables,
      });
      addHistoryEntry({
        action: "db_restore",
        status: "success",
        label: "数据库恢复",
        detail: `备份 ${restore.backup_id} · ${restore.restored_tables} 张表`,
      });
      if (activeWorkspaceId) {
        await fetchAuditHistory(activeWorkspaceId);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "恢复失败";
      setRestoreError(message);
      addHistoryEntry({
        action: "db_restore",
        status: "failed",
        label: "数据库恢复",
        detail: message,
      });
    } finally {
      setRestoreLoading(false);
    }
  };

  const summaryItems = useMemo(
    () => [
      {
        label: "App 配置导出",
        status: exportError ? "失败" : exportResult ? "已完成" : "未执行",
        detail: exportResult?.filename,
      },
      {
        label: "工作流导入",
        status: workflowImportError ? "失败" : workflowImportResult ? "已完成" : "未执行",
        detail: workflowImportResult?.name,
      },
      {
        label: "Schema 导入",
        status: schemaImportError ? "失败" : schemaImportResult ? "已完成" : "未执行",
        detail: schemaImportResult?.versionId ? `版本 ${schemaImportResult.versionId.slice(0, 8)}` : undefined,
      },
      {
        label: "数据库备份",
        status: backupError ? "失败" : backupResult ? "已完成" : "未执行",
        detail: backupResult?.backupId ? `备份 ${backupResult.backupId.slice(0, 8)}` : undefined,
      },
      {
        label: "数据库恢复",
        status: restoreError ? "失败" : restoreResult ? "已完成" : "未执行",
        detail: restoreResult?.backupId ? `备份 ${restoreResult.backupId.slice(0, 8)}` : undefined,
      },
    ],
    [
      exportError,
      exportResult,
      workflowImportError,
      workflowImportResult,
      schemaImportError,
      schemaImportResult,
      backupError,
      backupResult,
      restoreError,
      restoreResult,
    ]
  );

  return (
    <PageContainer>
      <p className="page-caption">Data</p>
      <PageHeader
        title="数据导入/导出与备份"
        description="导出 App 配置、导入工作流与 Schema，并管理工作空间备份"
        actions={(
          <Badge variant="secondary" className="bg-surface-200 text-foreground-muted">
            {activeWorkspaceId ? "已绑定工作空间" : "未选择工作空间"}
          </Badge>
        )}
      />

      <div className="max-w-6xl mx-auto">
        <div className="page-grid lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="page-section space-y-6">
            <div className="page-panel">
              <div className="page-panel-header">
                <h2 className="page-panel-title">App 配置导出</h2>
                <p className="page-panel-description mt-1">导出 App 当前版本的 UI/DB Schema 与配置</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[12px] text-foreground-light">选择 App</label>
                  <Select value={selectedAppId} onValueChange={setSelectedAppId}>
                    <SelectTrigger className="bg-surface-100 border-border">
                      <SelectValue placeholder={appsLoading ? "加载中..." : "请选择 App"} />
                    </SelectTrigger>
                    <SelectContent>
                      {appOptions.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          <span className="flex items-center gap-2">
                            <span>{app.icon || "📦"}</span>
                            <span>{app.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleExportAppConfig}
                    disabled={!selectedAppId || exporting}
                    className="bg-brand-500 hover:bg-brand-600 text-background"
                  >
                    {exporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        导出中...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        下载配置
                      </>
                    )}
                  </Button>
                  {exportResult && (
                    <Badge variant="secondary" className="bg-brand-200/60 text-brand-500">
                      已导出
                    </Badge>
                  )}
                </div>

                {exportError && (
                  <div className="flex items-center gap-2 text-xs text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    {exportError}
                  </div>
                )}
                {exportResult && (
                  <div className="text-[12px] text-foreground-muted">
                    文件：{exportResult.filename}
                    {exportResult.exportedAt ? ` · ${exportResult.exportedAt}` : ""}
                  </div>
                )}
              </div>
            </div>

            <div className="page-panel">
              <div className="page-panel-header">
                <h2 className="page-panel-title">Workflow / Schema 导入</h2>
                <p className="page-panel-description mt-1">支持导入工作流 JSON 与 App Schema 文件</p>
              </div>
              <div className="p-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-md border border-border bg-surface-75 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[13px] font-medium text-foreground">工作流导入</h3>
                    {workflowImportResult && (
                      <Badge variant="secondary" className="bg-brand-200/60 text-brand-500">
                        完成
                      </Badge>
                    )}
                  </div>
                  <Input
                    ref={workflowFileRef}
                    type="file"
                    accept="application/json"
                    className="text-[12px] bg-surface-100"
                  />
                  <Button
                    size="sm"
                    onClick={handleImportWorkflow}
                    disabled={workflowImporting}
                    className="w-full"
                  >
                    {workflowImporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        导入中...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        导入工作流
                      </>
                    )}
                  </Button>
                  {workflowImportError && (
                    <div className="flex items-center gap-2 text-xs text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      {workflowImportError}
                    </div>
                  )}
                  {workflowImportResult && (
                    <div className="flex items-center justify-between text-[12px] text-foreground-muted">
                      <span>已导入：{workflowImportResult.name}</span>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => router.push(`/editor/${workflowImportResult.id}`)}
                      >
                        打开
                      </Button>
                    </div>
                  )}
                </div>

                <div className="rounded-md border border-border bg-surface-75 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[13px] font-medium text-foreground">Schema 导入</h3>
                    {schemaImportResult && (
                      <Badge variant="secondary" className="bg-brand-200/60 text-brand-500">
                        完成
                      </Badge>
                    )}
                  </div>
                  <Select value={schemaAppId} onValueChange={setSchemaAppId}>
                    <SelectTrigger className="bg-surface-100 border-border">
                      <SelectValue placeholder={appsLoading ? "加载中..." : "选择目标 App"} />
                    </SelectTrigger>
                    <SelectContent>
                      {appOptions.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          <span className="flex items-center gap-2">
                            <span>{app.icon || "📦"}</span>
                            <span>{app.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    ref={schemaFileRef}
                    type="file"
                    accept="application/json"
                    className="text-[12px] bg-surface-100"
                  />
                  <Button
                    size="sm"
                    onClick={handleImportSchema}
                    disabled={schemaImporting || !schemaAppId}
                    className="w-full"
                  >
                    {schemaImporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        导入中...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        导入 Schema
                      </>
                    )}
                  </Button>
                  {schemaImportError && (
                    <div className="flex items-center gap-2 text-xs text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      {schemaImportError}
                    </div>
                  )}
                  {schemaImportResult && (
                    <div className="text-[12px] text-foreground-muted">
                      已创建版本 {schemaImportResult.versionId?.slice(0, 8)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="page-panel">
              <div className="page-panel-header">
                <h2 className="page-panel-title">Workspace 数据备份与恢复</h2>
                <p className="page-panel-description mt-1">为工作空间数据库创建备份或执行恢复</p>
              </div>
              <div className="p-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-md border border-border bg-surface-75 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[13px] font-medium text-foreground">创建备份</h3>
                    {backupResult && (
                      <Badge variant="secondary" className="bg-brand-200/60 text-brand-500">
                        完成
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleBackup}
                    disabled={backupLoading || !activeWorkspaceId}
                    className="w-full"
                  >
                    {backupLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        备份中...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4 mr-2" />
                        创建数据库备份
                      </>
                    )}
                  </Button>
                  {backupError && (
                    <div className="flex items-center gap-2 text-xs text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      {backupError}
                    </div>
                  )}
                  {backupResult && (
                    <div className="text-[12px] text-foreground-muted">
                      备份 {backupResult.backupId} · {backupResult.tables} 张表
                    </div>
                  )}
                </div>

                <div className="rounded-md border border-border bg-surface-75 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[13px] font-medium text-foreground">从备份恢复</h3>
                    {restoreResult && (
                      <Badge variant="secondary" className="bg-brand-200/60 text-brand-500">
                        完成
                      </Badge>
                    )}
                  </div>
                  <Input
                    value={restoreBackupId}
                    onChange={(e) => setRestoreBackupId(e.target.value)}
                    placeholder="备份 ID"
                    className="text-[12px] bg-surface-100"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRestore}
                    disabled={restoreLoading || !activeWorkspaceId}
                    className="w-full"
                  >
                    {restoreLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        恢复中...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        执行恢复
                      </>
                    )}
                  </Button>
                  <div className="flex items-start gap-2 text-[12px] text-foreground-muted">
                    <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    恢复会覆盖当前数据库数据，建议先执行备份。
                  </div>
                  {restoreError && (
                    <div className="flex items-center gap-2 text-xs text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      {restoreError}
                    </div>
                  )}
                  {restoreResult && (
                    <div className="text-[12px] text-foreground-muted">
                      已恢复 {restoreResult.restoredTables} 张表
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="page-section space-y-6">
            <div className="page-panel sticky top-6">
              <div className="page-panel-header">
                <h2 className="page-panel-title">操作摘要</h2>
                <p className="page-panel-description mt-1">当前会话中的导入/导出与备份状态</p>
              </div>
              <div className="p-5 space-y-3">
                {summaryItems.map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[12px] text-foreground-light">{item.label}</div>
                      {item.detail && (
                        <div className="text-[11px] text-foreground-muted">{item.detail}</div>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px]",
                        item.status === "已完成"
                          ? "bg-brand-200/60 text-brand-500"
                          : item.status === "失败"
                            ? "bg-destructive-200 text-destructive"
                            : "bg-surface-200 text-foreground-muted"
                      )}
                    >
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="page-panel">
              <div className="page-panel-header">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="page-panel-title">导出/导入历史</h2>
                    <p className="page-panel-description mt-1">最近 {MAX_HISTORY_ITEMS} 条记录</p>
                  </div>
                  <Badge variant="secondary" className="bg-surface-200 text-foreground-muted">
                    {historySource === "backend" ? "审计日志" : "本地"}
                  </Badge>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {historyLoading ? (
                  <div className="text-[12px] text-foreground-muted">加载中...</div>
                ) : historyEntries.length === 0 ? (
                  <div className="text-[12px] text-foreground-muted">暂无记录</div>
                ) : (
                  historyEntries.map((entry) => (
                    <div key={entry.id} className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[12px] text-foreground-light">{entry.label}</div>
                        {entry.detail && (
                          <div className="text-[11px] text-foreground-muted">{entry.detail}</div>
                        )}
                        <div className="text-[10px] text-foreground-muted">
                          {formatHistoryTimestamp(entry.timestamp)}
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px]",
                          entry.status === "success"
                            ? "bg-brand-200/60 text-brand-500"
                            : "bg-destructive-200 text-destructive"
                        )}
                      >
                        {entry.status === "success" ? "成功" : "失败"}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="page-panel">
              <div className="p-4 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-[13px] font-medium text-foreground mb-1">安全提示</h3>
                  <ul className="text-[12px] text-foreground-light space-y-1">
                    <li>• 导出文件为只读副本，建议加密保存</li>
                    <li>• Schema 导入会创建新版本，请在测试环境验证</li>
                    <li>• 数据库恢复会覆盖现有数据，务必先备份</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

