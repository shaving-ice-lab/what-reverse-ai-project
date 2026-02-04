"use client";

import { useParams } from "next/navigation";
import { WorkspaceGuard } from "@/components/permissions/workspace-guard";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const workspaceId = Array.isArray(params?.workspaceId)
    ? params.workspaceId[0]
    : (params?.workspaceId as string | undefined);

  return <WorkspaceGuard workspaceId={workspaceId}>{children}</WorkspaceGuard>;
}
"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { WorkspaceGuard } from "@/components/permissions/workspace-guard";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  return <WorkspaceGuard workspaceId={workspaceId}>{children}</WorkspaceGuard>;
}
