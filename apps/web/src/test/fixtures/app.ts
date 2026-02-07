/**
 * Workspace = App Test fixture
 * Architectureandafter App now Workspace, thisRetainCompatibleAlias
 */
import { workspaceFixture, workspaceAltFixture } from "./workspace";

// CompatibleoldTest —— appDraftFixture thenis1 draft Status's workspace
export const appDraftFixture = {
 ...workspaceFixture,
 id: "ws_123",
 description: "Generateday",
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
