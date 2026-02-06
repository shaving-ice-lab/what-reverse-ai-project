"use client";

import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { WorkspaceGuard } from "@/components/permissions/workspace-guard";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ workspaceId?: string | string[] }>();
  const raw = params?.workspaceId;
  const workspaceId = Array.isArray(raw) ? raw[0] : raw;
  return <WorkspaceGuard workspaceId={workspaceId}>{children}</WorkspaceGuard>;
}
