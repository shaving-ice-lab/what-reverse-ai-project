/**
 * TestToolcount
 */

import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import type { ReactElement, ReactNode } from "react";

// CreateTestuse QueryClient
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

// ContainsAll Provider 'sWrapper
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

// Custom render count
function customRender(
 ui: ReactElement,
 options?: Omit<RenderOptions, "wrapper">
) {
 return render(ui, { wrapper: AllProviders, ...options });
}

// re-newExportAll testing-library count
export * from "@testing-library/react";
export { customRender as render };

// ===== Mock count =====

// Create Mock Node
export function createMockNode(overrides = {}) {
 return {
 id: "node-1",
 type: "start",
 position: { x: 0, y: 0 },
 data: {
 label: "Start",
 config: {},
 },
 ...overrides,
 };
}

// Create Mock Edge
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

// Create Mock Workflow
export function createMockWorkflow(overrides = {}) {
 return {
 id: "workflow-1",
 name: "TestWorkflow",
 description: "thisis1TestWorkflow",
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

// Create Mock User
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

// Create Mock ExecuteRecord
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

// ===== AsyncTestTool =====

// etcpending1Time
export function wait(ms: number): Promise<void> {
 return new Promise((resolve) => setTimeout(resolve, ms));
}

// etcpendingtoConditionas
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

// ===== Mock API Response =====

export function mockApiResponse<T>(data: T, options: { delay?: number } = {}) {
 const { delay = 0 } = options;

 return vi.fn().mockImplementation(() =>
 new Promise((resolve) =>
 setTimeout(
 () =>
 resolve({
 ok: true,
 json: () => Promise.resolve({ code: "OK", message: "OK", data }),
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
 json: () => Promise.resolve({ code: error.code, message: error.message }),
 })
 );
}
