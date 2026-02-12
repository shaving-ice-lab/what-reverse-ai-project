'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, LayoutGrid } from 'lucide-react'
import { SiteHeader } from '@/components/layout/site-header'
import { Button } from '@/components/ui/button'
import { AppRenderer } from '@/components/app-renderer/app-renderer'
import { RuntimeDataProvider } from '@/components/app-renderer/runtime-data-provider'
import { AppAuthProvider, useAppAuth } from '@/components/app-renderer/app-auth-provider'
import type { AppSchema } from '@/components/app-renderer/types'
import { cn } from '@/lib/utils'
import {
  runtimeApi,
  type RuntimeEntryData,
  type RuntimeSchemaData,
  type RuntimeRequestError,
} from '@/lib/api/runtime'

interface PublicRuntimeViewProps {
  workspaceSlug: string
  isEmbed?: boolean
}

export function PublicRuntimeView({ workspaceSlug, isEmbed }: PublicRuntimeViewProps) {
  const router = useRouter()
  const [entry, setEntry] = useState<RuntimeEntryData | null>(null)
  const [schema, setSchema] = useState<RuntimeSchemaData | null>(null)
  const [error, setError] = useState<RuntimeRequestError | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionId, setSessionId] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    const loadRuntime = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const entryData = await runtimeApi.getEntry(workspaceSlug, sessionId || undefined)
        if (cancelled) return
        const resolvedWorkspaceSlug = entryData.workspace?.slug
        if (resolvedWorkspaceSlug && resolvedWorkspaceSlug !== workspaceSlug) {
          const suffix = isEmbed ? '/embed' : ''
          router.replace(`/runtime/${resolvedWorkspaceSlug}${suffix}`)
          return
        }
        setEntry(entryData)
        const nextSession = entryData.session_id || sessionId || ''
        setSessionId(nextSession)
        const schemaData = await runtimeApi.getSchema(workspaceSlug, nextSession || undefined)
        if (cancelled) return
        setSchema(schemaData)
        if (schemaData.session_id && schemaData.session_id !== nextSession) {
          setSessionId(schemaData.session_id)
        }
      } catch (err) {
        if (cancelled) return
        setEntry(null)
        setSchema(null)
        setError(err as RuntimeRequestError)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }
    loadRuntime()
    return () => {
      cancelled = true
    }
  }, [workspaceSlug, isEmbed, router])

  const appSchema = useMemo<AppSchema | null>(() => {
    const rawUiSchema = schema?.schema?.ui_schema as Record<string, unknown> | null
    if (
      rawUiSchema &&
      rawUiSchema.app_schema_version === '2.0.0' &&
      Array.isArray(rawUiSchema.pages) &&
      (rawUiSchema.pages as unknown[]).length > 0
    ) {
      return rawUiSchema as unknown as AppSchema
    }
    return null
  }, [schema?.schema?.ui_schema])

  const resolvedWorkspaceSlug = entry?.workspace?.slug || workspaceSlug
  const runtimePath = `/runtime/${resolvedWorkspaceSlug}`

  // Error state
  if (error) {
    const code = error.code
    return (
      <div className="min-h-screen bg-background">
        {!isEmbed && <SiteHeader />}
        <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
          <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-destructive/10 p-3 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Access Failed</h1>
                <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {code === 'UNAUTHORIZED' && (
                    <Button asChild>
                      <Link href={`/login?redirect=${encodeURIComponent(runtimePath)}`}>
                        Sign in to continue
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" asChild>
                    <Link href="/">Back to Home</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-foreground-muted" />
      </div>
    )
  }

  // AppSchema v2.0: Render full multi-page app with AppRenderer
  if (appSchema) {
    return (
      <div className={cn('h-screen flex flex-col bg-background', isEmbed && 'bg-transparent')}>
        {!isEmbed && <SiteHeader />}
        <div className="flex-1 overflow-hidden">
          <AppAuthProvider workspaceSlug={resolvedWorkspaceSlug}>
            <RuntimeAppWithAuth workspaceSlug={resolvedWorkspaceSlug} appSchema={appSchema} />
          </AppAuthProvider>
        </div>
      </div>
    )
  }

  // No AppSchema v2.0 available — show empty state
  return (
    <div className={cn('min-h-screen bg-background', isEmbed && 'bg-transparent')}>
      {!isEmbed && <SiteHeader />}
      <main className="mx-auto flex max-w-lg flex-col items-center gap-6 px-6 py-24 text-center">
        <div className="rounded-2xl bg-surface-200/30 p-4">
          <LayoutGrid className="h-10 w-10 text-foreground-muted" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">App Not Ready</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This workspace hasn&apos;t been configured with an application yet. Use the AI Agent to
            build and publish your app.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </main>
    </div>
  )
}

function RuntimeAppWithAuth({
  workspaceSlug,
  appSchema,
}: {
  workspaceSlug: string
  appSchema: AppSchema
}) {
  const { token } = useAppAuth()
  return (
    <RuntimeDataProvider workspaceSlug={workspaceSlug} appAuthToken={token}>
      <AppRenderer
        schema={appSchema}
        workspaceId={workspaceSlug}
        className="h-full"
        skipDataProvider
      />
    </RuntimeDataProvider>
  )
}
