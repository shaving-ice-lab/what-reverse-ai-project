/**
 * 测试工具函数
 * Admin 管理台测试辅助方法
 */

import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import type { ReactElement, ReactNode } from "react";
import { vi } from "vitest";

// 创建测试用 QueryClient
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

// 包含所有 Provider 的包装器
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

// 自定义 render 函数
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// 重新导出所有 testing-library 函数
export * from "@testing-library/react";
export { customRender as render };

// ===== Mock 工厂函数 =====

// 创建 Mock 用户
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

// 创建 Mock Workspace
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

// 创建 Mock App
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

// 创建 Mock 工单
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

// 创建 Mock 执行记录
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

// 创建 Mock 工作流
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

// 创建 Mock 公告
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

// 创建 Mock Admin 能力点
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

// 创建分页响应
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

// ===== 异步测试工具 =====

// 等待一段时间
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 等待直到条件为真
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

// ===== Mock API 响应 =====

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

// Mock 成功的 fetch 响应
export function mockFetchSuccess<T>(data: T) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(createApiResponse(data)),
  });
}

// Mock 失败的 fetch 响应
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

// ===== 权限测试工具 =====

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

// 模拟无权限状态
export function createMockUnauthorizedState() {
  return {
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: false,
  };
}

// ===== 性能测试工具 =====

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

// ===== 安全测试工具 =====

// XSS 测试向量
export const XSS_TEST_VECTORS = [
  '<script>alert("xss")</script>',
  'javascript:alert("xss")',
  '<img src=x onerror=alert("xss")>',
  '"><script>alert("xss")</script>',
  "' onclick='alert(\"xss\")'",
];

// SQL 注入测试向量
export const SQL_INJECTION_VECTORS = [
  "'; DROP TABLE users; --",
  "1' OR '1'='1",
  "admin'--",
  "1; DELETE FROM users",
  "' UNION SELECT * FROM users --",
];

// 检查响应是否包含敏感信息
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
