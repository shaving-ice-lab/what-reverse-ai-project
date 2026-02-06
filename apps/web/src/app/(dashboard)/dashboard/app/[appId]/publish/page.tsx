"use client";

import { useParams } from "next/navigation";
import { useWorkspaceContext } from "@/components/permissions/workspace-guard";
import { PublishSettingsPageContent } from "./publish-content";

export default function PublishSettingsPage() {
  const params = useParams();
  const appId = Array.isArray(params?.appId) ? params.appId[0] : (params?.appId as string | undefined);
  const { workspaceId } = useWorkspaceContext();

  if (!workspaceId || !appId) {
    return null;
  }

  return <PublishSettingsPageContent workspaceId={workspaceId} appId={appId} />;
}
