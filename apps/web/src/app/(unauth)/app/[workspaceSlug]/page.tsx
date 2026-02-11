'use client'

import { useEffect, useState } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AppRenderer } from '@/components/app-renderer/app-renderer'
import { RuntimeDataProvider } from '@/components/app-renderer/runtime-data-provider'
import { runtimeApi, type RuntimeSchemaData, type RuntimeRequestError } from '@/lib/api/runtime'
import type { AppSchema } from '@/components/app-renderer/types'

interface AppPageProps {
  params: {
    workspaceSlug: string
  }
}

function isAppSchemaV2(schema: unknown): schema is AppSchema {
  if (!schema || typeof schema !== 'object') return false
  const s = schema as Record<string, unknown>
  return Array.isArray(s.pages) && s.pages.length > 0
}

export default function AppPage({ params }: AppPageProps) {
  const { workspaceSlug } = params
  const [schema, setSchema] = useState<RuntimeSchemaData | null>(null)
  const [error, setError] = useState<RuntimeRequestError | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const schemaData = await runtimeApi.getSchema(workspaceSlug)
        if (!cancelled) setSchema(schemaData)
      } catch (err) {
        if (!cancelled) setError(err as RuntimeRequestError)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [workspaceSlug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading application...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md mx-auto text-center space-y-4 px-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Unable to load application</h1>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <div className="flex justify-center gap-3">
            {error.code === 'UNAUTHORIZED' && (
              <Button asChild>
                <Link href={`/login?redirect=${encodeURIComponent(`/app/${workspaceSlug}`)}`}>
                  Sign in
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const uiSchema = schema?.schema?.ui_schema as Record<string, unknown> | null

  if (!uiSchema || !isAppSchemaV2(uiSchema)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md mx-auto text-center space-y-4 px-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">No application UI configured</h1>
          <p className="text-sm text-muted-foreground">
            This workspace does not have a published application UI. The owner needs to build and publish it first.
          </p>
          <Button variant="outline" asChild>
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <RuntimeDataProvider workspaceSlug={workspaceSlug}>
        <AppRenderer
          schema={uiSchema}
          workspaceId={workspaceSlug}
          className="h-full"
          skipDataProvider
        />
      </RuntimeDataProvider>
    </div>
  )
}
