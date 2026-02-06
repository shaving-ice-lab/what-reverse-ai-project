"use client";

import { useParams } from "next/navigation";
import { useWorkspaceContext } from "@/components/permissions/workspace-guard";
import { BuilderPageContent } from "./builder-content";

export default function BuilderPage() {
  const params = useParams();
  const appId = Array.isArray(params?.appId) ? params.appId[0] : (params?.appId as string | undefined);
  const { workspaceId } = useWorkspaceContext();

  if (!workspaceId || !appId) {
    return null;
  }

  return <BuilderPageContent workspaceId={workspaceId} appId={appId} />;
}
