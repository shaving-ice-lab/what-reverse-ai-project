"use client";

import { useParams } from "next/navigation";
import { useWorkspaceContext } from "@/components/permissions/workspace-guard";
import { DomainsPageContent } from "./domains-content";

export default function DomainsPage() {
  const params = useParams();
  const appId = Array.isArray(params?.appId) ? params.appId[0] : (params?.appId as string | undefined);
  const { workspaceId } = useWorkspaceContext();

  if (!workspaceId || !appId) {
    return null;
  }

  return <DomainsPageContent workspaceId={workspaceId} appId={appId} />;
}
