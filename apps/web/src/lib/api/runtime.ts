import { getRuntimeBaseUrl } from "@/lib/env";
import { getStoredTokens } from "./shared";

export type RuntimeRequestError = Error & {
 code?: string;
 status?: number;
 details?: unknown;
};

export interface RuntimeWorkspace {
 id?: string;
 name?: string;
 slug?: string;
 icon?: string | null;
 description?: string | null;
 status?: string;
}

export interface RuntimeAccessPolicy {
 access_mode?: "private" | "public_auth" | "public_anonymous" | string;
 data_classification?: string;
 rate_limit_json?: {
 per_minute?: number;
 per_hour?: number;
 per_day?: number;
 };
 allowed_origins?: string[];
 require_captcha?: boolean;
}

export interface RuntimeEntryData {
 workspace?: RuntimeWorkspace | null;
 access_policy?: RuntimeAccessPolicy | null;
 session_id?: string;
}

/** @deprecated Workspace atthenis App, Usage RuntimeWorkspace */
export type RuntimeApp = RuntimeWorkspace;

export interface RuntimeSchemaPayload {
 ui_schema?: Record<string, unknown> | null;
 db_schema?: Record<string, unknown> | null;
 config_json?: Record<string, unknown> | null;
 output_schema?: Record<string, unknown> | null;
 input_mapping?: Record<string, unknown> | null;
 version?: string;
 workflow_id?: string | null;
 version_id?: string;
 created_at?: string;
 changelog?: string | null;
}

export interface RuntimeSchemaData extends RuntimeEntryData {
 schema?: RuntimeSchemaPayload | null;
}

export interface RuntimeExecuteResponse {
 execution_id: string;
 status: string;
 workflow_id?: string | null;
 started_at?: string;
 session_id?: string;
 message?: string;
}

const buildRuntimeUrl = (path: string) => {
 const base = getRuntimeBaseUrl().replace(/\/$/, "");
 const normalized = path.startsWith("/") ? path : `/${path}`;
 if (base) return `${base}${normalized}`;
 if (typeof window !== "undefined") {
 return `${window.location.origin}${normalized}`;
 }
 return normalized;
};

async function runtimeRequest<T>(
 path: string,
 options: RequestInit = {},
 sessionId?: string
): Promise<T> {
 const url = buildRuntimeUrl(path);
 const headers: Record<string, string> = {
 "Content-Type": "application/json",
 ...(options.headers as Record<string, string>),
 };

 const tokens = getStoredTokens();
 if (tokens?.accessToken) {
 headers["Authorization"] = `Bearer ${tokens.accessToken}`;
 }
 if (sessionId) {
 headers["X-App-Session-Id"] = sessionId;
 }

 const response = await fetch(url, {
 ...options,
 headers,
 });

 const payload = await response.json().catch(() => ({} as any));
 const code = (payload as { code?: string })?.code;
 const message =
 (payload as { message?: string })?.message ||
 (payload as { error?: { message?: string } })?.error?.message ||
 "RequestFailed";

 if (!response.ok || (typeof code === "string" && code !== "OK")) {
 const error = new Error(message) as RuntimeRequestError;
 error.code = code;
 error.status = response.status;
 error.details = (payload as { details?: unknown })?.details;
 throw error;
 }

 return (payload as { data?: T })?.data as T;
}

export const runtimeApi = {
 getEntry(workspaceSlug: string, sessionId?: string) {
 return runtimeRequest<RuntimeEntryData>(
 `/runtime/${encodeURIComponent(workspaceSlug)}`,
 { method: "GET" },
 sessionId
 );
 },
 getSchema(workspaceSlug: string, sessionId?: string) {
 return runtimeRequest<RuntimeSchemaData>(
 `/runtime/${encodeURIComponent(workspaceSlug)}/schema`,
 { method: "GET" },
 sessionId
 );
 },
 execute(
 workspaceSlug: string,
 inputs: Record<string, string>,
 sessionId?: string
 ) {
 return runtimeRequest<RuntimeExecuteResponse>(
 `/runtime/${encodeURIComponent(workspaceSlug)}`,
 {
 method: "POST",
 body: JSON.stringify({
 inputs,
 trigger_type: "public_runtime",
 }),
 },
 sessionId
 );
 },
};
