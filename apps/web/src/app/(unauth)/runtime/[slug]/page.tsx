import { PublicRuntimeView } from '@/components/runtime/public-runtime-view'

interface RuntimePageProps {
  params: Promise<{ slug: string }>
}

export default async function RuntimePage({ params }: RuntimePageProps) {
  const { slug } = await params
  return <PublicRuntimeView workspaceSlug={slug} />
}
