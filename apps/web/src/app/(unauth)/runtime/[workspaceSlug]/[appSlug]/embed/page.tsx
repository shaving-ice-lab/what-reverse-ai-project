import { PublicRuntimeView } from "../public-runtime-view";

interface RuntimeEmbedPageProps {
  params: {
    workspaceSlug: string;
    appSlug: string;
  };
}

export default function RuntimeEmbedPage({ params }: RuntimeEmbedPageProps) {
  return (
    <PublicRuntimeView
      workspaceSlug={params.workspaceSlug}
      appSlug={params.appSlug}
      isEmbed
    />
  );
}
