import { PublicRuntimeView } from '@/components/runtime/public-runtime-view'

interface EmbedPageProps {
  params: Promise<{ slug: string }>
}

export default async function EmbedRuntimePage({ params }: EmbedPageProps) {
  const { slug } = await params
  return <PublicRuntimeView workspaceSlug={slug} isEmbed />
}
