import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@/test/utils";
import { workspaceListFixture } from "@/test/fixtures/workspace";
import WorkspacesPage from "../page";

const { mockList } = vi.hoisted(() => ({
  mockList: vi.fn(),
}));

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

    // 等待工作空间数据加载完成（名称出现在侧边栏和/或主内容区）
    const testWsElements = await screen.findAllByText("测试工作空间");
    expect(testWsElements.length).toBeGreaterThan(0);

    // 主内容区中，workspace 名称渲染在 <h3> 标签中
    const testWsCards = testWsElements.filter((el) => el.tagName === "H3");
    expect(testWsCards.length).toBeGreaterThan(0);

    // "创建工作空间" 按钮存在
    const createButtons = screen.getAllByRole("button", { name: "创建工作空间" });
    expect(createButtons.length).toBeGreaterThan(0);

    // 输入搜索词 "analytics" (匹配 slug: "analytics" 的 "分析工作空间")
    const searchInput = screen.getByPlaceholderText("搜索 Workspace");
    fireEvent.change(searchInput, { target: { value: "analytics" } });

    // 搜索后，主内容区不再显示 "测试工作空间" 的卡片（<h3>）
    // 注意：侧边栏 recentWorkspaces 不受搜索过滤影响
    await waitFor(() => {
      const allTestWs = screen.queryAllByText("测试工作空间");
      const cardH3 = allTestWs.find((el) => el.tagName === "H3");
      expect(cardH3).toBeUndefined();
    });

    // "分析工作空间" 仍然可见
    expect(screen.getAllByText("分析工作空间").length).toBeGreaterThan(0);
  });
});
