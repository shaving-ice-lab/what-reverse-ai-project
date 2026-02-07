/**
 * Test utility functions
 * Admin dashboard test helper methods
 */

import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import type { ReactElement, ReactNode } from "react";
import { vi } from "vitest";

// Create test QueryClient
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Wrapper containing all Providers
interface AllProvidersProps {
  children: ReactNode;
}

function AllProviders({ children }: AllProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// Custom render function
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export all testing-library functions
export * from "@testing-library/react";
export { customRender as render };

// ===== Mock factory functions =====

// Create mock user
export function createMockUser(overrides = {}) {
  return {
    id: "user-test-1234",
    email: "admin@agentflow.ai",
    username: "admin",
    display_name: "Admin User",
    avatar: null,
    role: "admin",
    status: "active",
    email_verified: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
    last_login_at: "2026-02-03T08:00:00Z",
    ...overrides,
  };
}

// Create mock workspace
export function createMockWorkspace(overrides = {}) {
  return {
    id: "ws-test-1234",
    name: "Test Workspace",
    slug: "test-workspace",
    icon: "🏢",
    status: "active",
    plan: "pro",
    region: "ap-southeast-1",
    owner_user_id: "user-test-1234",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
    ...overrides,
  };
}

// Create mock app
export function createMockApp(overrides = {}) {
  return {
    id: "app-test-1234",
    workspace_id: "ws-test-1234",
    owner_user_id: "user-test-1234",
    name: "Test App",
    slug: "test-app",
    icon: "📦",
    description: "Test application for testing.",
    status: "published",
    pricing_type: "free",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
    published_at: "2026-01-15T00:00:00Z",
    ...overrides,
  };
}

// Create mock ticket
export function createMockTicket(overrides = {}) {
  return {
    id: "ticket-test-1234",
    reference: "AF-TEST-001",
    requester_email: "user@example.com",
    requester_name: "Test User",
    subject: "Test Support Ticket",
    description: "This is a test support ticket.",
    category: "general",
    priority: "medium",
    status: "open",
    channel: "dashboard",
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
    ...overrides,
  };
}

// Create mock execution
export function createMockExecution(overrides = {}) {
  return {
    id: "exec-test-1234",
    workflow_id: "wf-test-1234",
    workspace_id: "ws-test-1234",
    version: 1,
    status: "success",
    trigger_type: "manual",
    trigger_data: {},
    duration_ms: 1500,
    retries: 0,
    started_at: "2026-02-01T08:00:00Z",
    completed_at: "2026-02-01T08:00:01Z",
    created_at: "2026-02-01T08:00:00Z",
    ...overrides,
  };
}

// Create mock workflow
export function createMockWorkflow(overrides = {}) {
  return {
    id: "wf-test-1234",
    workspace_id: "ws-test-1234",
    name: "Test Workflow",
    slug: "test-workflow",
    description: "Test workflow for testing.",
    status: "active",
    trigger_type: "manual",
    version: 1,
    nodes_count: 3,
    created_by: "user-test-1234",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
    last_run_at: "2026-02-03T08:00:00Z",
    ...overrides,
  };
}

// Create mock announcement
export function createMockAnnouncement(overrides = {}) {
  return {
    id: "ann-test-1234",
    title: "Test Announcement",
    description: "This is a test announcement.",
    type: "notice",
    priority: 2,
    is_active: true,
    read_count: 100,
    total_users: 500,
    starts_at: "2026-02-01T00:00:00Z",
    ends_at: null,
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
    ...overrides,
  };
}

// Create mock admin capabilities
export function createMockCapabilities() {
  return {
    capabilities: [
      "admin.super",
      "users.read",
      "users.manage",
      "workspaces.read",
      "workspaces.manage",
      "apps.read",
      "apps.manage",
      "workflows.read",
      "workflows.manage",
      "executions.read",
      "executions.manage",
      "conversations.read",
      "conversations.manage",
      "support.read",
      "support.manage",
      "billing.read",
      "billing.approve",
      "earnings.read",
      "earnings.approve",
      "system.read",
      "system.write",
      "config.read",
      "config.write",
      "secrets.read",
      "secrets.write",
      "audit.read",
      "audit.export",
      "announcements.read",
      "templates.read",
      "templates.write",
      "templates.approve",
      "sessions.read",
      "sessions.write",
      "analytics.read",
      "analytics.export",
      "approvals.read",
      "approvals.approve",
    ],
  };
}

// Create paginated response
export function createPaginatedResponse<T>(
  items: T[],
  options: { page?: number; page_size?: number; total?: number } = {}
) {
  const { page = 1, page_size = 20, total = items.length } = options;
  return {
    items,
    total,
    page,
    page_size,
  };
}

// ===== Async test utilities =====

// Wait for a period of time
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Wait until condition is true
export async function waitUntil(
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error("Timeout waiting for condition");
    }
    await wait(interval);
  }
}

// ===== Mock API responses =====

export function createApiResponse<T>(data: T) {
  return {
    code: "OK",
    message: "OK",
    data,
  };
}

export function mockApiResponse<T>(data: T, options: { delay?: number } = {}) {
  const { delay = 0 } = options;

  return vi.fn().mockImplementation(() =>
    new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(createApiResponse(data)),
          }),
        delay
      )
    )
  );
}

export function mockApiError(
  error: { code: string; message: string },
  status = 400
) {
  return vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: false,
      status,
      json: () =>
        Promise.resolve({
          code: error.code,
          message: error.message,
          error_code: error.code,
          error_message: error.message,
        }),
    })
  );
}

// Mock successful fetch response
export function mockFetchSuccess<T>(data: T) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(createApiResponse(data)),
  });
}

// Mock failed fetch response
export function mockFetchError(code: string, message: string, status = 400) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () =>
      Promise.resolve({
        code,
        message,
        error_code: code,
        error_message: message,
      }),
  });
}

// ===== Permission test utilities =====

export function createMockAuthState(overrides = {}) {
  return {
    user: createMockUser(),
    tokens: {
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
    },
    isAuthenticated: true,
    isLoading: false,
    ...overrides,
  };
}

// Mock unauthorized state
export function createMockUnauthorizedState() {
  return {
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: false,
  };
}

// ===== Performance test utilities =====

export function measureExecutionTime(fn: () => void | Promise<void>) {
  return async () => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    return end - start;
  };
}

export function generateLargeDataset<T>(
  factory: (index: number) => T,
  count: number
): T[] {
  return Array.from({ length: count }, (_, i) => factory(i));
}

// ===== Security test utilities =====

// XSS test vectors
export const XSS_TEST_VECTORS = [
  '<script>alert("xss")</script>',
  'javascript:alert("xss")',
  '<img src=x onerror=alert("xss")>',
  '"><script>alert("xss")</script>',
  "' onclick='alert(\"xss\")'",
];

// SQL injection test vectors
export const SQL_INJECTION_VECTORS = [
  "'; DROP TABLE users; --",
  "1' OR '1'='1",
  "admin'--",
  "1; DELETE FROM users",
  "' UNION SELECT * FROM users --",
];

// Check if response contains sensitive information
export function checkForSensitiveData(response: unknown): string[] {
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /api_key/i,
    /access_token/i,
    /refresh_token/i,
    /private_key/i,
    /credit_card/i,
    /ssn/i,
  ];

  const issues: string[] = [];
  const responseStr = JSON.stringify(response);

  sensitivePatterns.forEach((pattern) => {
    if (pattern.test(responseStr)) {
      issues.push(`Potential sensitive data leak: ${pattern.source}`);
    }
  });

  return issues;
}
