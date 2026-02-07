import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import { PublicRuntimeView } from "../public-runtime-view";

const { mockGetEntry, mockGetSchema, mockRouter } = vi.hoisted(() => ({
 mockGetEntry: vi.fn(),
 mockGetSchema: vi.fn(),
 mockRouter: { replace: vi.fn() },
}));

vi.mock("next/navigation", () => ({
 useRouter: () => mockRouter,
}));

vi.mock("@/components/layout/site-header", () => ({
 SiteHeader: () => <div data-testid="site-header" />,
}));

vi.mock("@/components/ui/terms-prompt", () => ({
 TermsPrompt: () => <div data-testid="terms-prompt" />,
}));

vi.mock("@/components/creative/markdown-preview", () => ({
 MarkdownPreview: ({ content }: { content: string }) => <div data-testid="markdown-preview">{content}</div>,
}));

vi.mock("@/lib/api/runtime", () => ({
 runtimeApi: {
 getEntry: mockGetEntry,
 getSchema: mockGetSchema,
 execute: vi.fn(),
 },
}));

describe("PublicRuntimeView", () => {
 beforeEach(() => {
 vi.clearAllMocks();

 mockGetEntry.mockResolvedValue({
 workspace: { id: "ws_123", name: "dayAssistant", slug: "demo" },
 access_policy: { access_mode: "public_anonymous" },
 session_id: "sess_1",
 });

 mockGetSchema.mockResolvedValue({
 schema: {
 ui_schema: {
 blocks: [
 {
 id: "prompt",
 type: "input",
 label: "Tip",
 input_key: "prompt",
 validation: { required: true },
 props: { placeholder: "Please enterRequirements" },
 },
 ],
 },
 config_json: {
 public_input_defaults: { prompt: "" },
 },
 },
 });
 });

 it("renders runtime input form and execute action", async () => {
 render(<PublicRuntimeView workspaceSlug="demo" appSlug="daily-report" />);

 expect(await screen.findByText("dayAssistant")).toBeInTheDocument();
 expect(screen.getByText("Tip")).toBeInTheDocument();
 expect(screen.getByRole("button", { name: "NowExecute" })).toBeInTheDocument();
 });
});
