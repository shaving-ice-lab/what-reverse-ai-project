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
 "workspace.export",
 "workflow.import",
 "workspace.schema.import",
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

type WorkspaceOption = {
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
 | "workspace_export"
 | "workflow_import"
 | "schema_import"
 | "db_backup"
 | "db_restore"
 | "workspace.export"
 | "workflow.import"
 | "workspace.schema.import"
 | "workspace.db.backup"
 | "workspace.db.restore";
 status: "success" | "failed";
 label: string;
 detail?: string;
 timestamp: string;
};

const extractWorkspaceList = (payload: unknown): WorkspaceOption[] => {
 if (!payload || typeof payload !== "object") return [];
 const data = (payload as { data?: unknown }).data ?? payload;
 if (Array.isArray(data)) return data as WorkspaceOption[];
 if (data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)) {
 return (data as { items: WorkspaceOption[] }).items;
 }
 if (Array.isArray((payload as { items?: unknown }).items)) {
 return (payload as { items: WorkspaceOption[] }).items;
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
 if (!file) return `Please select${label} JSON File`;
 if (!file.name.toLowerCase().endsWith(".json")) return "onlySupport.json File";
 if (file.size === 0) return "FileasEmpty";
 if (file.size > MAX_IMPORT_BYTES) return `FileExceed ${MAX_IMPORT_MB}MB, PleaseSplitafteragainImport`;
 if (file.type && !file.type.toLowerCase().includes("json")) return "FileTypeMustas JSON";
 return null;
};

const readJsonFile = async (file: File) => {
 const text = await file.text();
 const parsed = JSON.parse(text) as unknown;
 if (!isRecord(parsed)) {
 throw new Error("JSON Mustisfor");
 }
 return parsed;
};

const validateWorkflowPayload = (payload: Record<string, unknown>) => {
 const rawWorkflow = isRecord(payload.workflow) ? payload.workflow : payload;
 if (!isRecord(rawWorkflow)) return "WorkflowStructureInvalid";
 if (rawWorkflow.name !== undefined && typeof rawWorkflow.name !== "string") {
 return "workflow.name MustisString";
 }
 if (
 rawWorkflow.description !== undefined &&
 typeof rawWorkflow.description !== "string" &&
 rawWorkflow.description !== null
 ) {
 return "workflow.description MustisStringor null";
 }
 if (rawWorkflow.definition !== undefined && !isRecord(rawWorkflow.definition)) {
 return "workflow.definition Mustisfor";
 }
 if (
 rawWorkflow.variables !== undefined &&
 rawWorkflow.variables !== null &&
 !isRecord(rawWorkflow.variables)
 ) {
 return "workflow.variables Mustisfor";
 }
 if (rawWorkflow.trigger_type !== undefined && typeof rawWorkflow.trigger_type !== "string") {
 return "workflow.trigger_type MustisString";
 }
 if (
 rawWorkflow.trigger_config !== undefined &&
 rawWorkflow.trigger_config !== null &&
 !isRecord(rawWorkflow.trigger_config)
 ) {
 return "workflow.trigger_config Mustisfor";
 }

 const definition = isRecord(rawWorkflow.definition) ? rawWorkflow.definition : rawWorkflow;
 const nodes = (definition as { nodes?: unknown }).nodes ?? (rawWorkflow as { nodes?: unknown }).nodes;
 const edges = (definition as { edges?: unknown }).edges ?? (rawWorkflow as { edges?: unknown }).edges;
 if (nodes !== undefined && !Array.isArray(nodes)) return "nodes Mustiscountgroup";
 if (edges !== undefined && !Array.isArray(edges)) return "edges Mustiscountgroup";
 if (!Array.isArray(nodes) && !Array.isArray(edges)) return "not yetto nodes or edges";

 if (Array.isArray(nodes)) {
 for (const node of nodes) {
 if (!isRecord(node)) return "nodes Mustisfor";
 if (typeof node.id !== "string" || node.id.trim() === "") {
 return "nodes.id MustisEmptyString";
 }
 }
 }
 if (Array.isArray(edges)) {
 for (const edge of edges) {
 if (!isRecord(edge)) return "edges Mustisfor";
 if (typeof edge.source !== "string" || edge.source.trim() === "") {
 return "edges.source MustisEmptyString";
 }
 if (typeof edge.target !== "string" || edge.target.trim() === "") {
 return "edges.target MustisEmptyString";
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
 if (!isRecord(version)) return "Schema StructureInvalid";

 const uiSchema = (version.ui_schema ?? payload.ui_schema) ?? undefined;
 const dbSchema = (version.db_schema ?? payload.db_schema) ?? undefined;
 const configJson = (version.config_json ?? payload.config_json) ?? undefined;
 const workflowId = version.workflow_id ?? payload.workflow_id;

 if (uiSchema === undefined && dbSchema === undefined && configJson === undefined) {
 return "not yetto ui_schema/db_schema/config_json";
 }
 if (uiSchema !== undefined && !isRecord(uiSchema)) return "ui_schema Mustisfor";
 if (dbSchema !== undefined && !isRecord(dbSchema)) return "db_schema Mustisfor";
 if (configJson !== undefined && !isRecord(configJson)) return "config_json Mustisfor";
 if (workflowId !== undefined && workflowId !== null && typeof workflowId !== "string") {
 return "workflow_id MustisString";
 }
 return null;
};

const auditActionLabels: Record<string, string> = {
 "workspace.export": "WorkspaceConfigExport",
 "workflow.import": "WorkflowImport",
 "workspace.schema.import": "Schema Import",
 "workspace.db.backup": "DatabaseBackup",
 "workspace.db.restore": "DatabaseRestore",
};

const readStringValue = (value: unknown) => (typeof value === "string" ? value : "");

const readNumberValue = (value: unknown) => (typeof value === "number" ? value : null);

const buildAuditDetail = (action: string, metadata?: Record<string, unknown>) => {
 if (!metadata) return "";
 const backupId = readStringValue(metadata.backup_id);
 const workflowName = readStringValue(metadata.workflow_name);
 const filename = readStringValue(metadata.filename);
 const appName = readStringValue(metadata.workspace_name) || readStringValue(metadata.app_name);
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
 case "workspace.export":
 if (appName && filename) return `${appName} · ${filename}`;
 if (appName) return appName;
 return filename || "";
 case "workflow.import":
 return workflowName || readStringValue(metadata.workflow_id);
 case "workspace.schema.import":
 if (version) return `Version ${version}`;
 if (versionId) return `Version ${versionId.slice(0, 8)}`;
 return "";
 case "workspace.db.backup":
 if (backupId && typeof tables === "number") return `Backup ${backupId} · ${tables} `;
 return backupId ? `Backup ${backupId}`: "";
 case "workspace.db.restore":
 if (backupId && typeof restoredTables === "number") return `Backup ${backupId} · ${restoredTables} `;
 return backupId ? `Backup ${backupId}`: "";
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
 const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
 const [workspacesLoading, setWorkspacesLoading] = useState(false);

 const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
 const [schemaWorkspaceId, setSchemaWorkspaceId] = useState("");

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

 const loadWorkspaces = async () => {
 try {
 setWorkspacesLoading(true);
 const response = await request<ApiResponse<unknown>>(
 `/workspaces?workspace_id=${activeWorkspaceId}`
 );
 const resolved = extractWorkspaceList(response.data);
 if (isActive) {
 setWorkspaces(resolved);
 if (!selectedWorkspaceId && resolved.length > 0) {
 setSelectedWorkspaceId(resolved[0].id);
 }
 if (!schemaWorkspaceId && resolved.length > 0) {
 setSchemaWorkspaceId(resolved[0].id);
 }
 }
 } catch (error) {
 console.error("Failed to load workspaces:", error);
 if (isActive) setWorkspaces([]);
 } finally {
 if (isActive) setWorkspacesLoading(false);
 }
 };

 loadWorkspaces();
 return () => {
 isActive = false;
 };
 }, [activeWorkspaceId, selectedWorkspaceId, schemaWorkspaceId]);

 const workspaceOptions = useMemo(() => workspaces, [workspaces]);

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
 async (action: "workflow.import" | "workspace.schema.import", metadata: Record<string, unknown>) => {
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

 const handleExportWorkspaceConfig = async () => {
 if (!selectedWorkspaceId) return;
 setExporting(true);
 setExportError(null);
 setExportResult(null);
 try {
 const workspaceName =
 workspaceOptions.find((app) => app.id === selectedWorkspaceId)?.name ??
 `Workspace ${selectedWorkspaceId.slice(0, 8)}`;
 const response = await request<ApiResponse<ExportConfigResponse>>(
 `/workspaces/${selectedWorkspaceId}/export`
 );
 const exportPayload = response.data?.export ?? response.data;
 const filename =
 response.data?.filename || `app-${selectedWorkspaceId.slice(0, 8)}-config.json`;
 downloadJson(exportPayload, filename);
 setExportResult({
 filename,
 exportedAt: response.data?.export?.exported_at,
 });
 addHistoryEntry({
 action: "workspace_export",
 status: "success",
 label: "WorkspaceConfigExport",
 detail: `${workspaceName} · ${filename}`,
 });
 if (activeWorkspaceId) {
 await fetchAuditHistory(activeWorkspaceId);
 }
 } catch (error) {
 const message = error instanceof Error ? error.message: "ExportFailed";
 setExportError(message);
 addHistoryEntry({
 action: "workspace_export",
 status: "failed",
 label: "WorkspaceConfigExport",
 detail: message,
 });
 } finally {
 setExporting(false);
 }
 };

 const handleImportWorkflow = async () => {
 const file = workflowFileRef.current?.files?.[0];
 const fileError = file ? validateJsonFile(file, "Workflow"): "Please selectWorkflow JSON File";
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
 label: "WorkflowImport",
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
 throw new Error("ImportSuccessbutnot yetBackWorkflow ID");
 }
 setWorkflowImportResult({
 id: imported.id,
 name: imported.name || workflow.name,
 });
 addHistoryEntry({
 action: "workflow_import",
 status: "success",
 label: "WorkflowImport",
 detail: `${file.name} · ${imported.name || workflow.name}`,
 });
 if (activeWorkspaceId) {
 await fetchAuditHistory(activeWorkspaceId);
 }
 } catch (error) {
 const message = error instanceof Error ? error.message: "ImportFailed";
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
 label: "WorkflowImport",
 detail: `${file.name} · ${message}`,
 });
 } finally {
 setWorkflowImporting(false);
 if (workflowFileRef.current) workflowFileRef.current.value = "";
 }
 };

 const handleImportSchema = async () => {
 const file = schemaFileRef.current?.files?.[0];
 if (!schemaWorkspaceId) {
 setSchemaImportError("Please selectTargetWorkspace");
 await recordClientAudit("workspace.schema.import", {
 status: "failed",
 error: "not yetSelectTargetWorkspace",
 validation_stage: "context",
 workspace_id: schemaWorkspaceId,
 source: "schema_import",
 });
 return;
 }
 const fileError = file ? validateJsonFile(file, "Schema"): "Please select Schema JSON File";
 if (fileError) {
 setSchemaImportError(fileError);
 await recordClientAudit("workspace.schema.import", {
 status: "failed",
 error: fileError,
 file_name: file?.name,
 validation_stage: "file",
 workspace_id: schemaWorkspaceId,
 source: "schema_import",
 });
 if (file) {
 addHistoryEntry({
 action: "schema_import",
 status: "failed",
 label: "Schema Import",
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
 changelog: `Import Schema · ${new Date().toISOString()}`,
 source: "schema_import",
 };
 if (schema.ui_schema) requestBody.ui_schema = schema.ui_schema;
 if (schema.db_schema) requestBody.db_schema = schema.db_schema;
 if (schema.config_json) requestBody.config_json = schema.config_json;
 if (schema.workflow_id) requestBody.workflow_id = schema.workflow_id;

 const response = await request<ApiResponse<SchemaImportResponse>>(
 `/workspaces/${schemaWorkspaceId}/versions`,
 {
 method: "POST",
 body: JSON.stringify(requestBody),
 }
 );
 setSchemaImportResult({
 versionId: response.data?.version?.id,
 });
 const workspaceName =
 workspaceOptions.find((app) => app.id === schemaWorkspaceId)?.name ??
 `Workspace ${schemaWorkspaceId.slice(0, 8)}`;
 addHistoryEntry({
 action: "schema_import",
 status: "success",
 label: "Schema Import",
 detail: `${workspaceName} · ${file.name}`,
 });
 if (activeWorkspaceId) {
 await fetchAuditHistory(activeWorkspaceId);
 }
 } catch (error) {
 const message = error instanceof Error ? error.message: "ImportFailed";
 await recordClientAudit("workspace.schema.import", {
 status: "failed",
 error: message,
 file_name: file?.name,
 validation_stage: "content",
 workspace_id: schemaWorkspaceId,
 source: "schema_import",
 });
 setSchemaImportError(message);
 addHistoryEntry({
 action: "schema_import",
 status: "failed",
 label: "Schema Import",
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
 throw new Error("BackupCreated successfullybutnot yetBackBackup ID");
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
 label: "DatabaseBackup",
 detail: `Backup ${backup.backup_id} · ${backup.tables} `,
 });
 if (activeWorkspaceId) {
 await fetchAuditHistory(activeWorkspaceId);
 }
 } catch (error) {
 const message = error instanceof Error ? error.message: "BackupFailed";
 setBackupError(message);
 addHistoryEntry({
 action: "db_backup",
 status: "failed",
 label: "DatabaseBackup",
 detail: message,
 });
 } finally {
 setBackupLoading(false);
 }
 };

 const handleRestore = async () => {
 if (!activeWorkspaceId) return;
 if (!restoreBackupId.trim()) {
 setRestoreError("Please enterBackup ID");
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
 throw new Error("RestoreSuccessbutnot yetBackRestoreResult");
 }
 setRestoreResult({
 backupId: restore.backup_id,
 restoredTables: restore.restored_tables,
 });
 addHistoryEntry({
 action: "db_restore",
 status: "success",
 label: "DatabaseRestore",
 detail: `Backup ${restore.backup_id} · ${restore.restored_tables} `,
 });
 if (activeWorkspaceId) {
 await fetchAuditHistory(activeWorkspaceId);
 }
 } catch (error) {
 const message = error instanceof Error ? error.message: "RestoreFailed";
 setRestoreError(message);
 addHistoryEntry({
 action: "db_restore",
 status: "failed",
 label: "DatabaseRestore",
 detail: message,
 });
 } finally {
 setRestoreLoading(false);
 }
 };

 const summaryItems = useMemo(
 () => [
 {
 label: "WorkspaceConfigExport",
 status: exportError ? "Failed": exportResult ? "Completed": "not yetExecute",
 detail: exportResult?.filename,
 },
 {
 label: "WorkflowImport",
 status: workflowImportError ? "Failed": workflowImportResult ? "Completed": "not yetExecute",
 detail: workflowImportResult?.name,
 },
 {
 label: "Schema Import",
 status: schemaImportError ? "Failed" : schemaImportResult ? "Completed" : "Not yet executed",
 detail: schemaImportResult?.versionId ? `Version ${schemaImportResult.versionId.slice(0, 8)}` : undefined,
 },
 {
 label: "Database Backup",
 status: backupError ? "Failed" : backupResult ? "Completed" : "Not yet executed",
 detail: backupResult?.backupId ? `Backup ${backupResult.backupId.slice(0, 8)}` : undefined,
 },
 {
 label: "Database Restore",
 status: restoreError ? "Failed" : restoreResult ? "Completed" : "Not yet executed",
 detail: restoreResult?.backupId ? `Backup ${restoreResult.backupId.slice(0, 8)}` : undefined,
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
 title="DataImport/ExportandBackup"
 description="ExportWorkspaceConfig, ImportWorkflowand Schema, andManageWorkspaceBackup"
 actions={(
 <Badge variant="secondary" className="bg-surface-200 text-foreground-muted">
 {activeWorkspaceId ? "BoundWorkspace": "not yetSelectWorkspace"}
 </Badge>
 )}
 />

 <div className="max-w-6xl mx-auto">
 <div className="page-grid lg:grid-cols-[minmax(0,1fr)_320px]">
 <div className="page-section space-y-6">
 <div className="page-panel">
 <div className="page-panel-header">
 <h2 className="page-panel-title">WorkspaceConfigExport</h2>
 <p className="page-panel-description mt-1">ExportWorkspaceCurrent Version's UI/DB Schema andConfig</p>
 </div>
 <div className="p-6 space-y-4">
 <div className="space-y-2">
 <label className="text-[12px] text-foreground-light">SelectWorkspace</label>
 <Select value={selectedWorkspaceId} onValueChange={setSelectedWorkspaceId}>
 <SelectTrigger className="bg-surface-100 border-border">
 <SelectValue placeholder={workspacesLoading ? "Loading...": "Please selectWorkspace"} />
 </SelectTrigger>
 <SelectContent>
 {workspaceOptions.map((app) => (
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
 onClick={handleExportWorkspaceConfig}
 disabled={!selectedWorkspaceId || exporting}
 className="bg-brand-500 hover:bg-brand-600 text-background"
 >
 {exporting ? (
 <>
 <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
 Export...
 </>
 ) : (
 <>
 <Download className="w-4 h-4 mr-2" />
 DownloadConfig
 </>
 )}
 </Button>
 {exportResult && (
 <Badge variant="secondary" className="bg-brand-200/60 text-brand-500">
 alreadyExport
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
 File: {exportResult.filename}
 {exportResult.exportedAt ? ` · ${exportResult.exportedAt}` : ""}
 </div>
 )}
 </div>
 </div>

 <div className="page-panel">
 <div className="page-panel-header">
 <h2 className="page-panel-title">Workflow / Schema Import</h2>
 <p className="page-panel-description mt-1">SupportImportWorkflow JSON andApp Schema File</p>
 </div>
 <div className="p-6 grid gap-4 lg:grid-cols-2">
 <div className="rounded-md border border-border bg-surface-75 p-4 space-y-3">
 <div className="flex items-center justify-between">
 <h3 className="text-[13px] font-medium text-foreground">WorkflowImport</h3>
 {workflowImportResult && (
 <Badge variant="secondary" className="bg-brand-200/60 text-brand-500">
 Done
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
 Import...
 </>
 ) : (
 <>
 <Upload className="w-4 h-4 mr-2" />
 ImportWorkflow
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
 <span>alreadyImport: {workflowImportResult.name}</span>
 <Button
 size="xs"
 variant="outline"
 onClick={() => router.push(`/editor/${workflowImportResult.id}`)}
 >
 Open
 </Button>
 </div>
 )}
 </div>

 <div className="rounded-md border border-border bg-surface-75 p-4 space-y-3">
 <div className="flex items-center justify-between">
 <h3 className="text-[13px] font-medium text-foreground">Schema Import</h3>
 {schemaImportResult && (
 <Badge variant="secondary" className="bg-brand-200/60 text-brand-500">
 Done
 </Badge>
 )}
 </div>
 <Select value={schemaWorkspaceId} onValueChange={setSchemaWorkspaceId}>
 <SelectTrigger className="bg-surface-100 border-border">
 <SelectValue placeholder={workspacesLoading ? "Loading...": "SelectTargetWorkspace"} />
 </SelectTrigger>
 <SelectContent>
 {workspaceOptions.map((app) => (
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
 disabled={schemaImporting || !schemaWorkspaceId}
 className="w-full"
 >
 {schemaImporting ? (
 <>
 <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
 Import...
 </>
 ) : (
 <>
 <Upload className="w-4 h-4 mr-2" />
 Import Schema
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
 alreadyCreateVersion {schemaImportResult.versionId?.slice(0, 8)}
 </div>
 )}
 </div>
 </div>
 </div>

 <div className="page-panel">
 <div className="page-panel-header">
 <h2 className="page-panel-title">Workspace DataBackupandRestore</h2>
 <p className="page-panel-description mt-1">asWorkspaceDatabaseCreateBackuporExecuteRestore</p>
 </div>
 <div className="p-6 grid gap-4 lg:grid-cols-2">
 <div className="rounded-md border border-border bg-surface-75 p-4 space-y-3">
 <div className="flex items-center justify-between">
 <h3 className="text-[13px] font-medium text-foreground">CreateBackup</h3>
 {backupResult && (
 <Badge variant="secondary" className="bg-brand-200/60 text-brand-500">
 Done
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
 Backup...
 </>
 ) : (
 <>
 <Database className="w-4 h-4 mr-2" />
 CreateDatabaseBackup
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
 Backup {backupResult.backupId} · {backupResult.tables} 
 </div>
 )}
 </div>

 <div className="rounded-md border border-border bg-surface-75 p-4 space-y-3">
 <div className="flex items-center justify-between">
 <h3 className="text-[13px] font-medium text-foreground">fromBackupRestore</h3>
 {restoreResult && (
 <Badge variant="secondary" className="bg-brand-200/60 text-brand-500">
 Done
 </Badge>
 )}
 </div>
 <Input
 value={restoreBackupId}
 onChange={(e) => setRestoreBackupId(e.target.value)}
 placeholder="Backup ID"
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
 Restore...
 </>
 ) : (
 <>
 <Upload className="w-4 h-4 mr-2" />
 ExecuteRestore
 </>
 )}
 </Button>
 <div className="flex items-start gap-2 text-[12px] text-foreground-muted">
 <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
 RestorewillCoverageCurrentDatabaseData, SuggestionfirstExecuteBackup.
 </div>
 {restoreError && (
 <div className="flex items-center gap-2 text-xs text-destructive">
 <AlertCircle className="w-4 h-4" />
 {restoreError}
 </div>
 )}
 {restoreResult && (
 <div className="text-[12px] text-foreground-muted">
 alreadyRestore {restoreResult.restoredTables} 
 </div>
 )}
 </div>
 </div>
 </div>
 </div>

 <div className="page-section space-y-6">
 <div className="page-panel sticky top-6">
 <div className="page-panel-header">
 <h2 className="page-panel-title">ActionSummary</h2>
 <p className="page-panel-description mt-1">Currentwill'sImport/ExportandBackupStatus</p>
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
 item.status === "Completed"
 ? "bg-brand-200/60 text-brand-500"
: item.status === "Failed"
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
 <h2 className="page-panel-title">Export/ImportHistory</h2>
 <p className="page-panel-description mt-1">Recent {MAX_HISTORY_ITEMS} Record</p>
 </div>
 <Badge variant="secondary" className="bg-surface-200 text-foreground-muted">
 {historySource === "backend" ? "Audit Log": "Local"}
 </Badge>
 </div>
 </div>
 <div className="p-5 space-y-3">
 {historyLoading ? (
 <div className="text-[12px] text-foreground-muted">Loading...</div>
 ) : historyEntries.length === 0 ? (
 <div className="text-[12px] text-foreground-muted">NoneRecord</div>
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
 {entry.status === "success" ? "Success": "Failed"}
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
 <h3 className="text-[13px] font-medium text-foreground mb-1">SecurityTip</h3>
 <ul className="text-[12px] text-foreground-light space-y-1">
 <li>• ExportFileasreadcurrent, SuggestionEncryptSave</li>
 <li>• Schema ImportwillCreatenewVersion, PleaseatTestEnvironmentVerify</li>
 <li>• DatabaseRestorewillCoverageExistingData, firstBackup</li>
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

