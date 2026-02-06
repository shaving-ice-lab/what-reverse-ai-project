/**
 * Workspace = App 测试 fixture
 * 架构合并后 App 即 Workspace，此处保留兼容别名
 */
import { workspaceFixture, workspaceAltFixture } from "./workspace";

// 兼容旧测试 —— appDraftFixture 就是一个 draft 状态的 workspace
export const appDraftFixture = {
  ...workspaceFixture,
  id: "ws_123",
  description: "生成日报",
  app_status: "draft",
  current_version_id: "ver_1",
  pricing_type: "free",
  price: null,
  published_at: null,
} as const;

export const appPublishedFixture = {
  ...appDraftFixture,
  app_status: "published",
  published_at: "2026-02-03T10:00:00Z",
} as const;
