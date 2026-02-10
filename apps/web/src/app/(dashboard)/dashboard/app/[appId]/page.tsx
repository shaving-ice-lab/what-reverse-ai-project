'use client'

import { useParams } from 'next/navigation'
import { useWorkspaceContext } from '@/components/permissions/workspace-guard'
import { AppOverviewPageContent } from './overview-content'

export default function AppOverviewPage() {
  const params = useParams()
  const appId = Array.isArray(params?.appId)
    ? params.appId[0]
    : (params?.appId as string | undefined)
  const { workspaceId } = useWorkspaceContext()

  if (!workspaceId || !appId) {
    return null
  }

  return <AppOverviewPageContent workspaceId={workspaceId} appId={appId} />
}
