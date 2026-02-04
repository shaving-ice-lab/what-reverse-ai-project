export const appDraftFixture = {
  id: "app_123",
  workspace_id: "ws_123",
  owner_user_id: "user_1",
  name: "日报助手",
  slug: "daily-report",
  icon: "📄",
  description: "生成日报",
  status: "draft",
  current_version_id: "ver_1",
  pricing_type: "free",
  price: null,
  created_at: "2026-02-01T10:00:00Z",
  updated_at: "2026-02-02T10:00:00Z",
  published_at: null,
  deleted_at: null,
} as const;

export const appPublishedFixture = {
  ...appDraftFixture,
  status: "published",
  published_at: "2026-02-03T10:00:00Z",
} as const;
