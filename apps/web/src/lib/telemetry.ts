import { isFeatureEnabled } from "@/lib/feature-flags";

type TelemetryType = "error" | "web-vital";

interface TelemetryEvent {
  type: TelemetryType;
  payload: Record<string, unknown>;
  at: string;
  route: string;
  userAgent?: string;
}

interface ErrorContext {
  source?: string;
  componentStack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
}

interface WebVitalMetric {
  name: string;
  value: number;
  id?: string;
  delta?: number;
  rating?: string;
}

const TELEMETRY_ENDPOINT = "/api/telemetry";
const MAX_MESSAGE_LENGTH = 1000;
const MAX_STACK_LENGTH = 2000;
const DEDUPE_TTL_MS = 10000;

const dedupeCache = new Map<string, number>();

const truncate = (value: string | undefined, maxLength: number) => {
  if (!value) return undefined;
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
};

const getRoute = () => {
  if (typeof window === "undefined") return "";
  return window.location.pathname;
};

const getUserAgent = () => {
  if (typeof navigator === "undefined") return undefined;
  return navigator.userAgent;
};

const shouldSend = (key: string) => {
  const now = Date.now();
  const lastSent = dedupeCache.get(key);
  if (lastSent && now - lastSent < DEDUPE_TTL_MS) return false;
  dedupeCache.set(key, now);
  return true;
};

const sendTelemetry = (event: TelemetryEvent) => {
  if (typeof window === "undefined") return;
  if (!isFeatureEnabled("analytics")) return;

  const payload = JSON.stringify(event);
  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    const ok = navigator.sendBeacon(
      TELEMETRY_ENDPOINT,
      new Blob([payload], { type: "application/json" })
    );
    if (ok) return;
  }

  fetch(TELEMETRY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
};

export const reportError = (error: unknown, context: ErrorContext = {}) => {
  if (typeof window === "undefined") return;
  if (!isFeatureEnabled("analytics")) return;

  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";
  const stack = error instanceof Error ? error.stack : undefined;

  const key = `${context.source ?? "error"}:${message}:${stack ?? ""}`;
  if (!shouldSend(key)) return;

  sendTelemetry({
    type: "error",
    at: new Date().toISOString(),
    route: getRoute(),
    userAgent: getUserAgent(),
    payload: {
      message: truncate(String(message), MAX_MESSAGE_LENGTH),
      stack: truncate(stack, MAX_STACK_LENGTH),
      source: context.source,
      componentStack: truncate(context.componentStack, MAX_STACK_LENGTH),
      filename: context.filename,
      lineno: context.lineno,
      colno: context.colno,
    },
  });
};

const WEB_VITAL_NAMES = new Set(["LCP", "CLS", "TTI"]);

export const reportWebVital = (metric: WebVitalMetric) => {
  if (typeof window === "undefined") return;
  if (!WEB_VITAL_NAMES.has(metric.name)) return;

  const key = `web-vital:${metric.name}:${metric.id ?? ""}`;
  if (!shouldSend(key)) return;

  sendTelemetry({
    type: "web-vital",
    at: new Date().toISOString(),
    route: getRoute(),
    userAgent: getUserAgent(),
    payload: {
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      rating: metric.rating,
      id: metric.id,
    },
  });
};

export const reportTTI = (value: number) => {
  reportWebVital({
    name: "TTI",
    value,
    id: `tti-${Date.now()}`,
  });
};
