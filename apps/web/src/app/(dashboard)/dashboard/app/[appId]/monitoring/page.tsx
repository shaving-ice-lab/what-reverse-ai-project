'use client'

import { useParams } from 'next/navigation'
import { useWorkspaceContext } from '@/components/permissions/workspace-guard'
import { MonitoringPageContent } from './monitoring-content'

export default function MonitoringPage() {
  const params = useParams()
  const appId = Array.isArray(params?.appId)
    ? params.appId[0]
    : (params?.appId as string | undefined)
  const { workspaceId } = useWorkspaceContext()

  if (!workspaceId || !appId) {
    return null
  }

  return <MonitoringPageContent workspaceId={workspaceId} appId={appId} />
}
