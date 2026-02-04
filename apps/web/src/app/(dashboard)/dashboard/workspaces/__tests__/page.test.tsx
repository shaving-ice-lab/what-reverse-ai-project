import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@/test/utils";
import { workspaceListFixture } from "@/test/fixtures/workspace";
import WorkspacesPage from "../page";

const mockList = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: () => ({
    user: {
      id: "user_1",
      email: "test@example.com",
      username: "tester",
      role: "admin",
      emailVerified: true,
      createdAt: "2026-02-01T10:00:00Z",
      updatedAt: "2026-02-02T10:00:00Z",
    },
  }),
}));

vi.mock("@/lib/api/workspace", () => ({
  workspaceApi: {
    list: mockList,
    create: vi.fn(),
  },
}));

describe("WorkspacesPage", () => {
  beforeEach(() => {
    mockList.mockResolvedValue(workspaceListFixture);
  });

  it("renders workspace list and filters by search", async () => {
    render(<WorkspacesPage />);

    expect(await screen.findByText("测试工作空间")).toBeInTheDocument();
    expect(screen.getByText("分析工作空间")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "创建工作空间" })).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText("搜索工作空间...");
    fireEvent.change(searchInput, { target: { value: "analytics" } });

    await waitFor(() => {
      expect(screen.queryByText("测试工作空间")).not.toBeInTheDocument();
    });
    expect(screen.getByText("分析工作空间")).toBeInTheDocument();
  });
});
