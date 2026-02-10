'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  Rocket,
  ShieldCheck,
} from 'lucide-react'
import { SiteHeader } from '@/components/layout/site-header'
import { Badge } from '@/components/ui/badge'
import { MarkdownPreview } from '@/components/creative/markdown-preview'
import { Button, ButtonGroup } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TermsPrompt } from '@/components/ui/terms-prompt'
import { cn } from '@/lib/utils'
import {
  runtimeApi,
  type RuntimeEntryData,
  type RuntimeSchemaData,
  type RuntimeExecuteResponse,
  type RuntimeRequestError,
} from '@/lib/api/runtime'

type UISchemaField = {
  id: string
  label: string
  inputKey: string
  type: 'input' | 'select'
  required: boolean
  placeholder: string
  options: string[]
}

type PublicInputExample = {
  id: string
  title: string
  description?: string
  values: Record<string, string>
}

type OutputViewType = 'text' | 'table' | 'markdown'

const extractUISchemaFields = (rawSchema?: Record<string, unknown> | null): UISchemaField[] => {
  if (!rawSchema || typeof rawSchema !== 'object') {
    return []
  }
  const blocks = Array.isArray((rawSchema as { blocks?: unknown }).blocks)
    ? ((rawSchema as { blocks?: unknown }).blocks as any[])
    : []
  return blocks
    .filter((block: any) => block?.type === 'input' || block?.type === 'select')
    .map((block: any, index: number) => {
      const props = block?.props || {}
      const options = Array.isArray(props.options) ? props.options : []
      return {
        id: typeof block?.id === 'string' && block.id.trim() ? block.id : `field_${index + 1}`,
        label: typeof block?.label === 'string' ? block.label : '',
        inputKey: typeof block?.input_key === 'string' ? block.input_key : '',
        type: block?.type === 'select' ? 'select' : 'input',
        required: Boolean(block?.validation?.required),
        placeholder: typeof props.placeholder === 'string' ? props.placeholder : '',
        options,
      }
    })
}

const normalizeExampleValue = (value: unknown) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

const parseTemplateJSON = (template: string) => {
  const trimmed = template.trim()
  if (!trimmed) return null
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed)
    } catch {
      return null
    }
  }
  return null
}

const normalizeExample = (
  raw: Record<string, unknown>,
  index: number,
  fieldKeys: Set<string>
): PublicInputExample | null => {
  const valuesCandidate = raw.values ?? raw.inputs ?? raw.payload ?? raw.data ?? null
  let values: Record<string, unknown> | null = null
  if (valuesCandidate && typeof valuesCandidate === 'object' && !Array.isArray(valuesCandidate)) {
    values = valuesCandidate as Record<string, unknown>
  } else if (!valuesCandidate) {
    const hasFieldKey = Object.keys(raw).some((key) => fieldKeys.has(key))
    if (hasFieldKey) {
      values = raw
    }
  }
  if (!values) return null

  const mapped: Record<string, string> = {}
  Object.entries(values).forEach(([key, value]) => {
    const trimmedKey = key.trim()
    if (!trimmedKey) return
    if (fieldKeys.size > 0 && !fieldKeys.has(trimmedKey)) return
    mapped[trimmedKey] = normalizeExampleValue(value)
  })
  if (Object.keys(mapped).length === 0) return null

  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : `example_${index + 1}`
  const title =
    (typeof raw.title === 'string' && raw.title.trim()) ||
    (typeof raw.label === 'string' && raw.label.trim()) ||
    (typeof raw.name === 'string' && raw.name.trim()) ||
    `Example ${index + 1}`
  const description =
    typeof raw.description === 'string' && raw.description.trim()
      ? raw.description.trim()
      : undefined

  return {
    id,
    title,
    description,
    values: mapped,
  }
}

const extractPublicInputExamples = (template: unknown, fieldKeys: Set<string>) => {
  if (!template) return []
  let candidate: unknown = template
  if (typeof template === 'string') {
    const parsed = parseTemplateJSON(template)
    if (!parsed) return []
    candidate = parsed
  }

  let items: unknown[] = []
  if (Array.isArray(candidate)) {
    items = candidate
  } else if (typeof candidate === 'object' && candidate !== null) {
    const container = candidate as Record<string, unknown>
    const nested = container.examples ?? container.templates ?? container.items ?? null
    if (Array.isArray(nested)) {
      items = nested
    } else {
      items = [candidate]
    }
  }

  const examples: PublicInputExample[] = []
  items.forEach((item, index) => {
    if (!item || typeof item !== 'object') return
    const example = normalizeExample(item as Record<string, unknown>, index, fieldKeys)
    if (example) {
      examples.push(example)
    }
  })
  return examples
}

const extractOutputSchemaFields = (rawSchema?: Record<string, unknown> | null) => {
  if (!rawSchema || typeof rawSchema !== 'object') return []
  const schemaType = rawSchema.type
  if (schemaType === 'array') {
    const items = (rawSchema as { items?: unknown }).items
    if (items && typeof items === 'object' && !Array.isArray(items)) {
      const properties = (items as { properties?: Record<string, unknown> }).properties
      if (properties && typeof properties === 'object') {
        return Object.keys(properties)
      }
    }
  }
  if (schemaType === 'object') {
    const properties = (rawSchema as { properties?: Record<string, unknown> }).properties
    if (properties && typeof properties === 'object') {
      return Object.keys(properties)
    }
  }
  return []
}

const inferOutputView = (rawSchema?: Record<string, unknown> | null): OutputViewType => {
  if (!rawSchema || typeof rawSchema !== 'object') return 'text'
  const hint =
    (typeof rawSchema.format === 'string' && rawSchema.format) ||
    (typeof (rawSchema as { content_type?: string }).content_type === 'string' &&
      (rawSchema as { content_type?: string }).content_type) ||
    (typeof (rawSchema as { output_type?: string }).output_type === 'string' &&
      (rawSchema as { output_type?: string }).output_type) ||
    ''
  const normalized = hint.toLowerCase()
  if (normalized.includes('markdown') || normalized === 'md') return 'markdown'
  if (normalized.includes('table')) return 'table'
  if (rawSchema.type === 'array') return 'table'
  return 'text'
}

const formatExamplePreview = (values: Record<string, string>, labelMap: Record<string, string>) => {
  const entries = Object.entries(values)
  const preview = entries
    .slice(0, 3)
    .map(([key, value]) => `${labelMap[key] || key}: ${value || '—'}`)
    .join(' · ')
  if (entries.length <= 3) return preview
  return `${preview} and ${entries.length - 3} more`
}

const formatOutputText = (value: unknown) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

const formatTableCell = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const formatRateLimit = (limit?: { per_minute?: number; per_hour?: number; per_day?: number }) => {
  if (!limit) return 'No rate limit configured'
  const parts = []
  if (limit.per_minute) parts.push(`${limit.per_minute}/min`)
  if (limit.per_hour) parts.push(`${limit.per_hour}/h`)
  if (limit.per_day) parts.push(`${limit.per_day}/days`)
  return parts.length ? parts.join(' · ') : 'No rate limit configured'
}

interface PublicRuntimeViewProps {
  workspaceSlug: string
  appSlug: string
  isEmbed?: boolean
}

export function PublicRuntimeView({ workspaceSlug, appSlug, isEmbed }: PublicRuntimeViewProps) {
  const router = useRouter()
  const [entry, setEntry] = useState<RuntimeEntryData | null>(null)
  const [schema, setSchema] = useState<RuntimeSchemaData | null>(null)
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [sessionId, setSessionId] = useState<string>('')
  const [error, setError] = useState<RuntimeRequestError | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executeResult, setExecuteResult] = useState<RuntimeExecuteResponse | null>(null)
  const [executeError, setExecuteError] = useState<string | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [origin, setOrigin] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [embedCopied, setEmbedCopied] = useState(false)
  const [activeExampleId, setActiveExampleId] = useState<string | null>(null)
  const [resultView, setResultView] = useState<OutputViewType>('text')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadRuntime = async () => {
      setIsLoading(true)
      setError(null)
      setExecuteResult(null)
      setExecuteError(null)
      setInputs({})
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

  const fields = useMemo(
    () => extractUISchemaFields(schema?.schema?.ui_schema as Record<string, unknown> | null),
    [schema]
  )

  const fieldKeySet = useMemo(() => {
    return new Set(
      fields
        .map((field, index) => (field.inputKey || field.id || `field_${index + 1}`).trim())
        .filter(Boolean)
    )
  }, [fields])

  const fieldLabelMap = useMemo(() => {
    const map: Record<string, string> = {}
    fields.forEach((field, index) => {
      const key = (field.inputKey || field.id || `field_${index + 1}`).trim()
      if (!key) return
      map[key] = field.label || key
    })
    return map
  }, [fields])

  const inputExamples = useMemo(() => {
    const template = schema?.schema?.config_json?.public_input_template
    const defaults = schema?.schema?.config_json?.public_input_defaults
    const examples = extractPublicInputExamples(template, fieldKeySet)

    if (
      examples.length === 0 &&
      defaults &&
      typeof defaults === 'object' &&
      !Array.isArray(defaults)
    ) {
      const values: Record<string, string> = {}
      Object.entries(defaults as Record<string, unknown>).forEach(([key, value]) => {
        const trimmedKey = key.trim()
        if (!trimmedKey) return
        if (fieldKeySet.size > 0 && !fieldKeySet.has(trimmedKey)) return
        values[trimmedKey] = normalizeExampleValue(value)
      })
      if (Object.keys(values).length > 0) {
        examples.push({
          id: 'default_example',
          title: 'Default Example',
          description: 'Use the default public access values for quick fill.',
          values,
        })
      }
    }

    return examples
  }, [schema?.schema?.config_json, fieldKeySet])

  const outputSchema = schema?.schema?.output_schema as Record<string, unknown> | null
  const outputSchemaFields = useMemo(() => extractOutputSchemaFields(outputSchema), [outputSchema])
  const outputSchemaPreview = useMemo(() => {
    if (!outputSchema) return ''
    try {
      return JSON.stringify(outputSchema, null, 2)
    } catch {
      return ''
    }
  }, [outputSchema])
  const preferredOutputView = useMemo(() => inferOutputView(outputSchema), [outputSchema])

  useEffect(() => {
    const defaults =
      (schema?.schema?.config_json?.public_input_defaults as Record<string, unknown>) || {}
    setInputs((prev) => {
      const next: Record<string, string> = { ...prev }
      fields.forEach((field, index) => {
        const key = (field.inputKey || field.id || `field_${index + 1}`).trim()
        if (!key || next[key] !== undefined) return
        const fallback = defaults[key]
        next[key] = fallback === undefined || fallback === null ? '' : String(fallback)
      })
      return next
    })
  }, [fields, schema?.schema?.config_json])

  useEffect(() => {
    setResultView((current) => (current === 'text' ? preferredOutputView : current))
  }, [preferredOutputView])

  const accessMode = entry?.access_policy?.access_mode || 'private'
  const accessModeMap = {
    private: { label: 'Private Access', icon: Lock },
    public_auth: { label: 'Public Access (Sign-in Required)', icon: ShieldCheck },
    public_anonymous: { label: 'Public Access (Anonymous)', icon: Globe },
  } as const
  const accessMeta =
    accessModeMap[accessMode as keyof typeof accessModeMap] || accessModeMap.private

  const resolvedWorkspaceSlug = entry?.workspace?.slug || workspaceSlug
  const runtimePath = `/runtime/${resolvedWorkspaceSlug}`
  const shareLink = origin ? `${origin}${runtimePath}` : ''
  const embedLink = shareLink ? `${shareLink}/embed` : ''
  const embedCode = embedLink
    ? `<iframe src="${embedLink}" width="100%" height="680" frameborder="0" allowfullscreen></iframe>`
    : ''

  const executionOutput = useMemo(() => {
    if (!executeResult) return null
    const payload = executeResult as Record<string, unknown>
    return payload.outputs ?? payload.output ?? payload.result ?? payload.data ?? null
  }, [executeResult])

  const outputText = useMemo(() => formatOutputText(executionOutput), [executionOutput])

  const outputRows = useMemo(() => {
    if (!executionOutput) return []
    if (Array.isArray(executionOutput)) {
      return executionOutput.filter(
        (item) => item && typeof item === 'object' && !Array.isArray(item)
      ) as Record<string, unknown>[]
    }
    if (typeof executionOutput === 'object') {
      return [executionOutput as Record<string, unknown>]
    }
    return []
  }, [executionOutput])

  const outputColumns = useMemo(() => {
    if (outputSchemaFields.length > 0) return outputSchemaFields
    const columns = new Set<string>()
    outputRows.forEach((row) => {
      Object.keys(row).forEach((key) => columns.add(key))
    })
    return Array.from(columns)
  }, [outputSchemaFields, outputRows])

  const policyTips = useMemo(() => {
    const policy = entry?.access_policy
    const accessModeLabel = accessMeta.label
    const rateLimit = formatRateLimit(policy?.rate_limit_json)
    const captchaHint = policy?.require_captcha
      ? 'CAPTCHA verification required'
      : 'CAPTCHA not required'
    const originHint =
      policy?.allowed_origins && policy.allowed_origins.length > 0
        ? `Allowed origins: ${policy.allowed_origins.join(', ')}`
        : 'No origin restrictions configured'
    const privacyHint = policy?.data_classification
      ? `Data classification: ${policy.data_classification}. Please do not submit sensitive information.`
      : 'Please do not submit sensitive information. Input may be used for auditing and risk control.'
    return [
      {
        id: 'terms',
        title: 'Usage',
        description: 'By continuing, you agree to the public access and service policy.',
        icon: ShieldCheck,
      },
      {
        id: 'access',
        title: 'Access Limits',
        description: `${accessModeLabel} · ${rateLimit} · ${captchaHint} · ${originHint}`,
        icon: Globe,
      },
      {
        id: 'privacy',
        title: 'Privacy Notice',
        description: privacyHint,
        icon: Lock,
      },
    ]
  }, [entry?.access_policy, accessMeta.label])

  const copyText = async (value: string, type: 'link' | 'embed') => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      if (type === 'link') {
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
      } else {
        setEmbedCopied(true)
        setTimeout(() => setEmbedCopied(false), 2000)
      }
    } catch {
      // ignore
    }
  }

  const applyExample = (example: PublicInputExample) => {
    setInputs((prev) => ({
      ...prev,
      ...example.values,
    }))
    setActiveExampleId(example.id)
    setExecuteResult(null)
    setExecuteError(null)
  }

  const handleExecute = async () => {
    setExecuteError(null)
    setExecuteResult(null)
    setIsExecuting(true)
    try {
      const result = await runtimeApi.execute(workspaceSlug, inputs, sessionId || undefined)
      setExecuteResult(result)
      if (result.session_id) {
        setSessionId(result.session_id)
      }
    } catch (err) {
      const runtimeError = err as RuntimeRequestError
      setExecuteError(runtimeError.message || 'Failed to execute')
    } finally {
      setIsExecuting(false)
    }
  }

  const disabled = !termsAccepted || isLoading || isExecuting
  const exampleDisabled = isLoading || isExecuting

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

  return (
    <div className={cn('min-h-screen bg-background', isEmbed && 'bg-transparent')}>
      {!isEmbed && <SiteHeader />}

      <TermsPrompt
        storageKey={`public-terms:${resolvedWorkspaceSlug}:${appSlug}`}
        onStatusChange={setTermsAccepted}
      />

      <main
        className={cn(
          'mx-auto w-full max-w-5xl px-6 pb-16 pt-10',
          isEmbed && 'max-w-none px-4 pt-6'
        )}
      >
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-6 shadow-[0_0_35px_rgba(62,207,142,0.14)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          </div>
          <div className="relative flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="gap-2">
                <accessMeta.icon className="h-3.5 w-3.5" />
                {accessMeta.label}
              </Badge>
              {entry?.workspace?.status && (
                <Badge variant="outline" className="uppercase tracking-[0.2em] text-xs">
                  {entry.workspace.status}
                </Badge>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {entry?.workspace?.name || 'Public App'}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {entry?.workspace?.description ||
                  'This app is publicly available. Feel free to try it out.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>Workspace: {entry?.workspace?.name || workspaceSlug}</span>
              <span>Access Policy: {accessMeta.label}</span>
              <span>{formatRateLimit(entry?.access_policy?.rate_limit_json)}</span>
              {entry?.access_policy?.require_captcha && <span>CAPTCHA required</span>}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border/60 bg-card/80 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Terms & Tips</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Please confirm the public access and data usage terms before execution.
              </p>
            </div>
            <Badge variant="secondary">{termsAccepted ? 'Accepted' : 'Not Accepted'}</Badge>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {policyTips.map((tip) => {
              const Icon = tip.icon
              return (
                <div
                  key={tip.id}
                  className="rounded-xl border border-border/60 bg-background/60 p-3"
                >
                  <div className="flex items-center gap-2 text-foreground">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">{tip.title}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{tip.description}</p>
                </div>
              )
            })}
          </div>
          <div className="mt-4">
            <Button variant="ghost" asChild className="gap-2 text-muted-foreground">
              <Link href="/terms">View Terms</Link>
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Input Parameters</h2>
                {!termsAccepted && (
                  <span className="text-xs text-warning">Please accept the terms first</span>
                )}
              </div>
              <div className="mt-5 space-y-4">
                {isLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading public configuration...
                  </div>
                )}
                {!isLoading && fields.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border/80 bg-background/60 p-4 text-sm text-muted-foreground">
                    This app has no public input configuration. You can execute it directly.
                  </div>
                )}
                {!isLoading &&
                  fields.map((field) => {
                    const key = (field.inputKey || field.id).trim()
                    const value = inputs[key] ?? ''
                    if (field.type === 'select' && field.options.length > 0) {
                      return (
                        <div key={field.id} className="space-y-2">
                          <label className="text-sm text-foreground">
                            {field.label || key}
                            {field.required && <span className="text-destructive"> *</span>}
                          </label>
                          <Select
                            value={value}
                            onValueChange={(next) =>
                              setInputs((prev) => ({ ...prev, [key]: next }))
                            }
                            disabled={disabled}
                          >
                            <SelectTrigger className="bg-background/70">
                              <SelectValue placeholder={field.placeholder || 'Please select'} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )
                    }

                    return (
                      <div key={field.id} className="space-y-2">
                        <label className="text-sm text-foreground">
                          {field.label || key}
                          {field.required && <span className="text-destructive"> *</span>}
                        </label>
                        <Input
                          value={value}
                          onChange={(event) =>
                            setInputs((prev) => ({ ...prev, [key]: event.target.value }))
                          }
                          placeholder={field.placeholder || 'Please enter'}
                          disabled={disabled}
                          className="bg-background/70"
                        />
                      </div>
                    )
                  })}
              </div>
              {inputExamples.length > 0 && (
                <div className="mt-6 rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Example Inputs</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Select an example to quickly fill the form, then run.
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Click to Fill
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {inputExamples.map((example) => (
                      <button
                        key={example.id}
                        type="button"
                        onClick={() => applyExample(example)}
                        disabled={exampleDisabled}
                        className={cn(
                          'rounded-xl border border-border/60 bg-card/80 p-3 text-left transition-supabase',
                          'hover:border-border-strong hover:bg-surface-200/80',
                          activeExampleId === example.id && 'border-primary/60 bg-primary/10',
                          exampleDisabled && 'opacity-60'
                        )}
                      >
                        <div className="text-sm font-medium text-foreground">{example.title}</div>
                        {example.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {example.description}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                          {formatExamplePreview(example.values, fieldLabelMap)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-6 flex items-center gap-3">
                <Button onClick={handleExecute} disabled={disabled} className="gap-2">
                  {isExecuting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Rocket className="h-4 w-4" />
                  )}
                  {isExecuting ? 'Executing...' : 'Execute Now'}
                </Button>
                {executeError && <span className="text-sm text-destructive">{executeError}</span>}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Results</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Supports Text, Table, and Markdown views.
                  </p>
                </div>
                <ButtonGroup attached>
                  <Button
                    size="sm"
                    variant={resultView === 'text' ? 'secondary' : 'outline'}
                    onClick={() => setResultView('text')}
                  >
                    Text
                  </Button>
                  <Button
                    size="sm"
                    variant={resultView === 'table' ? 'secondary' : 'outline'}
                    onClick={() => setResultView('table')}
                  >
                    Table
                  </Button>
                  <Button
                    size="sm"
                    variant={resultView === 'markdown' ? 'secondary' : 'outline'}
                    onClick={() => setResultView('markdown')}
                  >
                    Markdown
                  </Button>
                </ButtonGroup>
              </div>

              <div className="mt-4 rounded-xl border border-border/60 bg-background/60 p-4 text-xs text-muted-foreground">
                {executeError ? (
                  <div className="flex items-start gap-2 text-destructive">
                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                    <div>Failed to execute: {executeError}</div>
                  </div>
                ) : executeResult ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-foreground">
                      <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
                      Execution started
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>Execution ID: {executeResult.execution_id}</div>
                      <div>Status: {executeResult.status}</div>
                      {executeResult.started_at && (
                        <div>Start Time: {executeResult.started_at}</div>
                      )}
                      {executeResult.message && <div>{executeResult.message}</div>}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/80 bg-background/60 p-4">
                    Execution status and details will be displayed here after submission.
                  </div>
                )}
              </div>

              <div className="mt-4">
                {resultView === 'text' && (
                  <>
                    {outputText ? (
                      <pre className="max-h-[280px] overflow-auto whitespace-pre-wrap rounded-xl border border-border/60 bg-background/60 p-4 text-xs text-foreground">
                        {outputText}
                      </pre>
                    ) : outputSchemaPreview ? (
                      <div className="rounded-xl border border-dashed border-border/80 bg-background/60 p-4 text-xs text-muted-foreground">
                        <div className="text-foreground">Output Structure Preview</div>
                        <pre className="mt-2 max-h-[240px] overflow-auto whitespace-pre-wrap text-foreground/80">
                          {outputSchemaPreview}
                        </pre>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border/80 bg-background/60 p-4 text-xs text-muted-foreground">
                        Text results will be displayed here after submission.
                      </div>
                    )}
                  </>
                )}

                {resultView === 'table' && (
                  <>
                    {outputColumns.length > 0 ? (
                      <div className="overflow-hidden rounded-xl border border-border/60">
                        <table className="w-full text-xs">
                          <thead className="bg-muted/60 text-muted-foreground">
                            <tr>
                              {outputColumns.map((column) => (
                                <th
                                  key={column}
                                  className="px-3 py-2 text-left font-medium uppercase tracking-[0.08em]"
                                >
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {outputRows.length > 0 ? (
                              outputRows.slice(0, 6).map((row, rowIndex) => (
                                <tr key={`${rowIndex}-row`} className="bg-background/60">
                                  {outputColumns.map((column) => (
                                    <td
                                      key={`${rowIndex}-${column}`}
                                      className="px-3 py-2 text-foreground"
                                    >
                                      {formatTableCell(row[column])}
                                    </td>
                                  ))}
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={outputColumns.length}
                                  className="px-3 py-3 text-center text-muted-foreground"
                                >
                                  No table data. Data will appear after execution completes.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border/80 bg-background/60 p-4 text-xs text-muted-foreground">
                        No table structure. Switch to the Text or Markdown view to see the output.
                      </div>
                    )}
                  </>
                )}

                {resultView === 'markdown' && (
                  <>
                    {outputText ? (
                      <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                        <MarkdownPreview content={outputText} className="prose-sm" />
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border/80 bg-background/60 p-4 text-xs text-muted-foreground">
                        Markdown output will be displayed here.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {!isEmbed && (
            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-lg">
                <h2 className="text-lg font-semibold text-foreground">Share Link</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Share this link with others. Access is controlled by the public access policy.
                </p>
                <div className="mt-4 flex gap-2">
                  <Input value={shareLink} readOnly className="bg-background/70" />
                  <Button
                    variant="outline"
                    onClick={() => copyText(shareLink, 'link')}
                    className="shrink-0 gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    {linkCopied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <div className="mt-3">
                  <Button variant="ghost" asChild className="gap-2 text-muted-foreground">
                    <Link href={shareLink || '#'} target="_blank">
                      <ExternalLink className="h-4 w-4" />
                      Open in New Window
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-lg">
                <h2 className="text-lg font-semibold text-foreground">Embedding</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Embed this public app in an external page.
                </p>
                <div className="mt-4 space-y-3">
                  <Textarea value={embedCode} readOnly className="min-h-[120px] bg-background/70" />
                  <Button
                    variant="outline"
                    onClick={() => copyText(embedCode, 'embed')}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    {embedCopied ? 'Copied' : 'Copy Embed Code'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
