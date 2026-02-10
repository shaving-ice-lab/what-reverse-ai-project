import { PublicRuntimeView } from './public-runtime-view'

interface RuntimePageProps {
  params: {
    workspaceSlug: string
    appSlug: string
  }
}

export default function RuntimePage({ params }: RuntimePageProps) {
  return <PublicRuntimeView workspaceSlug={params.workspaceSlug} appSlug={params.appSlug} />
}
