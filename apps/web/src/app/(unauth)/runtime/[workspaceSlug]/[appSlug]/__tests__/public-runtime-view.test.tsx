import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import { PublicRuntimeView } from "../public-runtime-view";

const mockGetEntry = vi.fn();
const mockGetSchema = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/components/layout/site-header", () => ({
  SiteHeader: () => <div data-testid="site-header" />,
}));

vi.mock("@/components/ui/terms-prompt", () => ({
  TermsPrompt: () => <div data-testid="terms-prompt" />,
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
    mockGetEntry.mockResolvedValue({
      workspace: { id: "ws_123", name: "Demo Workspace", slug: "demo" },
      app: { id: "app_123", name: "日报助手", slug: "daily-report" },
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
              label: "提示",
              input_key: "prompt",
              validation: { required: true },
              props: { placeholder: "请输入需求" },
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

    expect(await screen.findByText("日报助手")).toBeInTheDocument();
    expect(screen.getByText("提示")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "立即执行" })).toBeInTheDocument();
  });
});
