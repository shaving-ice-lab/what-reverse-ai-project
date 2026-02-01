/**
 * 测试工具函数
 */

import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import type { ReactElement, ReactNode } from "react";

// 创建测试用 QueryClient
function createTestQueryClient() {
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
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
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

// 创建 Mock 节点
export function createMockNode(overrides = {}) {
  return {
    id: "node-1",
    type: "start",
    position: { x: 0, y: 0 },
    data: {
      label: "开始",
      config: {},
    },
    ...overrides,
  };
}

// 创建 Mock 边
export function createMockEdge(overrides = {}) {
  return {
    id: "edge-1",
    source: "node-1",
    target: "node-2",
    sourceHandle: "output",
    targetHandle: "input",
    ...overrides,
  };
}

// 创建 Mock 工作流
export function createMockWorkflow(overrides = {}) {
  return {
    id: "workflow-1",
    name: "测试工作流",
    description: "这是一个测试工作流",
    nodes: [
      createMockNode({ id: "node-1", type: "start" }),
      createMockNode({ id: "node-2", type: "end" }),
    ],
    edges: [
      createMockEdge({ id: "edge-1", source: "node-1", target: "node-2" }),
    ],
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// 创建 Mock 用户
export function createMockUser(overrides = {}) {
  return {
    id: "user-1",
    email: "test@example.com",
    username: "testuser",
    avatar: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// 创建 Mock 执行记录
export function createMockExecution(overrides = {}) {
  return {
    id: "exec-1",
    workflowId: "workflow-1",
    status: "completed",
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: 1000,
    inputs: {},
    outputs: {},
    ...overrides,
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

export function mockApiResponse<T>(data: T, options: { delay?: number } = {}) {
  const { delay = 0 } = options;

  return vi.fn().mockImplementation(() =>
    new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data }),
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
      json: () => Promise.resolve({ success: false, error }),
    })
  );
}
