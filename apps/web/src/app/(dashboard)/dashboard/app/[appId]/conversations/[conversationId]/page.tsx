"use client";

import { useParams } from "next/navigation";
import { ChatPageContent } from "@/app/(dashboard)/dashboard/chat/[id]/page";

export default function AppConversationDetailPage() {
  const params = useParams();
  const appId = Array.isArray(params?.appId) ? params.appId[0] : (params?.appId as string | undefined);
  const conversationId = Array.isArray(params?.conversationId)
    ? params.conversationId[0]
    : (params?.conversationId as string | undefined);

  if (!appId || !conversationId) {
    return null;
  }

  return <ChatPageContent workspaceId={appId} conversationId={conversationId} />;
}
