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

 // etcpendingWorkspaceDataLoadDone（NameAppearatSidebarand/ormainContent）
 const testWsElements = await screen.findAllByText("TestWorkspace");
 expect(testWsElements.length).toBeGreaterThan(0);

 // mainContent，workspace NameRenderat <h3> Tags
 const testWsCards = testWsElements.filter((el) => el.tagName === "H3");
 expect(testWsCards.length).toBeGreaterThan(0);

 // "CreateWorkspace" Buttonat
 const createButtons = screen.getAllByRole("button", { name: "CreateWorkspace" });
 expect(createButtons.length).toBeGreaterThan(0);

 // InputSearch "analytics" (Match slug: "analytics" 's "AnalyticsWorkspace")
 const searchInput = screen.getByPlaceholderText("Search Workspace");
 fireEvent.change(searchInput, { target: { value: "analytics" } });

 // Searchafter，mainContentnotagainDisplay "TestWorkspace" 'sCard（<h3>）
 // Note：Sidebar recentWorkspaces notSearchFilterImpact
 await waitFor(() => {
 const allTestWs = screen.queryAllByText("TestWorkspace");
 const cardH3 = allTestWs.find((el) => el.tagName === "H3");
 expect(cardH3).toBeUndefined();
 });

 // "AnalyticsWorkspace" can
 expect(screen.getAllByText("AnalyticsWorkspace").length).toBeGreaterThan(0);
 });
});
