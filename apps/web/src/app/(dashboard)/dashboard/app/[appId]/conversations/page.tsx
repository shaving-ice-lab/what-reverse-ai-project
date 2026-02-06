"use client";

import { useParams } from "next/navigation";
import { ConversationsPageContent } from "@/app/(dashboard)/dashboard/conversations/page";

export default function AppConversationsPage() {
  const params = useParams();
  const appId = Array.isArray(params?.appId) ? params.appId[0] : (params?.appId as string | undefined);

  if (!appId) {
    return null;
  }

  return <ConversationsPageContent workspaceId={appId} />;
}
