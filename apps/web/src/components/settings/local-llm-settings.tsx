/**
 * Local LLM Settings Component - Enhanced
 */

'use client'

import { useState } from 'react'
import {
  RefreshCw,
  Download,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  AlertCircle,
  HardDrive,
  Cpu,
  Server,
  Sparkles,
  Zap,
  ShieldCheck,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useConfirmDialog } from '@/components/ui/confirm-dialog'
import { useLocalLLM } from '@/hooks/useLocalLLM'
import {
  RECOMMENDED_MODELS,
  formatBytes,
  type LocalModelInfo,
  type LLMProviderType,
} from '@/lib/llm'
import { cn } from '@/lib/utils'

const PROVIDER_NAMES: Record<LLMProviderType, string> = {
  ollama: 'Ollama',
  'lm-studio': 'LM Studio',
  'llama-cpp': 'llama.cpp',
}

const PROVIDER_LINKS: Record<LLMProviderType, string> = {
  ollama: 'https://ollama.ai',
  'lm-studio': 'https://lmstudio.ai',
  'llama-cpp': 'https://github.com/ggerganov/llama.cpp',
}

/**
 * StatusIndicator - Enhanced
 */
function StatusIndicator({
  status,
  provider = 'ollama',
}: {
  status: 'checking' | 'available' | 'unavailable'
  provider?: LLMProviderType
}) {
  const providerName = PROVIDER_NAMES[provider]

  switch (status) {
    case 'checking':
      return (
        <div
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl',
            'bg-muted/30 border border-border/50'
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Checking connection...</p>
            <p className="text-xs text-muted-foreground">Connecting {providerName}</p>
          </div>
        </div>
      )
    case 'available':
      return (
        <div
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl',
            'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent',
            'border border-emerald-500/20'
          )}
        >
          <div className="relative w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-card animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              {providerName} Running
            </p>
            <p className="text-xs text-muted-foreground">
              Connected successfully. You can use local models.
            </p>
          </div>
        </div>
      )
    case 'unavailable':
      return (
        <div
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl',
            'bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent',
            'border border-destructive/20'
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center">
            <XCircle className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-medium text-destructive">{providerName} Not Running</p>
            <p className="text-xs text-muted-foreground">Please start the {providerName} service</p>
          </div>
        </div>
      )
  }
}

/**
 * Provider Select - Enhanced
 */
function ProviderSelector({
  provider,
  name,
  isActive,
  isAvailable,
  modelsCount,
  onClick,
}: {
  provider: LLMProviderType
  name: string
  isActive: boolean
  isAvailable: boolean
  modelsCount: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative w-full flex items-center justify-between p-5 rounded-xl text-left',
        'transition-all duration-300 cursor-pointer',
        'border overflow-hidden',
        isActive
          ? [
              'border-primary/50 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent',
              'shadow-lg shadow-primary/10',
            ]
          : 'border-border/50 bg-muted/20 hover:border-primary/30 hover:bg-muted/30'
      )}
    >
      {/* Active Indicator Line */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all duration-300',
          isActive
            ? 'bg-gradient-to-b from-primary to-primary/70 opacity-100'
            : 'bg-muted opacity-0 group-hover:opacity-50'
        )}
      />

      <div className="flex items-center gap-4 pl-2">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            'transition-all duration-300 group-hover:scale-105',
            isActive
              ? 'bg-primary/20 text-primary shadow-sm'
              : 'bg-muted text-muted-foreground group-hover:text-foreground'
          )}
        >
          <Server className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{name}</span>
            {isActive && (
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-primary/20 text-primary rounded-full border border-primary/30">
                Current
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Run locally to protect data privacy
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isAvailable ? (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {modelsCount} Models
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
            Offline
          </span>
        )}
      </div>
    </button>
  )
}

/**
 * ModelList - Enhanced
 */
function ModelItem({
  model,
  onTest,
  onDelete,
  isDeleting,
}: {
  model: LocalModelInfo
  onTest: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  return (
    <div
      className={cn(
        'group flex items-center justify-between p-4 -mx-2 rounded-xl',
        'border-b border-border/30 last:border-0',
        'hover:bg-muted/30 transition-all duration-200'
      )}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
            'bg-gradient-to-br from-primary/10 to-violet-500/10',
            'border border-primary/10',
            'group-hover:scale-105 transition-transform duration-200'
          )}
        >
          <HardDrive className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">{model.name}</span>
            {model.details?.parameterSize && (
              <span className="px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full">
                {model.details.parameterSize}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              {formatBytes(model.size)}
            </span>
            {model.details?.family && (
              <span className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
                {model.details.family}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 px-3 text-xs',
            'text-muted-foreground hover:text-primary hover:bg-primary/10'
          )}
          onClick={onTest}
        >
          <Play className="h-3.5 w-3.5 mr-1.5" />
          Test
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={onDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

/**
 * RecommendedModelList - Enhanced
 */
function RecommendedModelItem({
  model,
  isInstalled,
  isDownloading,
  onDownload,
}: {
  model: (typeof RECOMMENDED_MODELS)[0]
  isInstalled: boolean
  isDownloading: boolean
  onDownload: () => void
}) {
  return (
    <div
      className={cn(
        'group relative flex items-center justify-between p-4 -mx-2 rounded-xl',
        'border-b border-border/30 last:border-0',
        'hover:bg-muted/20 transition-all duration-200'
      )}
    >
      {/* Status Indicator Line */}
      {isInstalled && (
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-emerald-400 to-emerald-500" />
      )}

      <div className="flex items-center gap-4 flex-1 min-w-0 pl-2">
        {/* Model Icon */}
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
            'transition-all duration-300',
            isInstalled
              ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20'
              : 'bg-gradient-to-br from-primary/10 to-violet-500/5 border border-primary/10 group-hover:scale-105'
          )}
        >
          <Sparkles className={cn('w-5 h-5', isInstalled ? 'text-emerald-500' : 'text-primary')} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-foreground">{model.name}</span>
            {isInstalled && (
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                Installed
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{model.description}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="px-2 py-0.5 text-[10px] font-medium bg-muted/50 rounded text-muted-foreground">
              {model.size}
            </span>
          </div>
        </div>
      </div>

      <Button
        variant={isInstalled ? 'ghost' : 'outline'}
        size="sm"
        disabled={isInstalled || isDownloading}
        onClick={onDownload}
        className={cn(
          'h-10 px-4 rounded-xl transition-all duration-200',
          !isInstalled &&
            !isDownloading && [
              'border-primary/30 hover:border-primary',
              'hover:bg-primary/5 hover:text-primary',
              'hover:shadow-md hover:shadow-primary/10',
            ]
        )}
      >
        {isInstalled ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : isDownloading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Download...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Download
          </>
        )}
      </Button>
    </div>
  )
}

/**
 * DownloadProgress - Enhanced
 */
function DownloadProgress({
  modelName,
  progress,
  onCancel,
}: {
  modelName: string
  progress: { status: string; completed?: number; total?: number }
  onCancel: () => void
}) {
  const percentage =
    progress.total && progress.completed
      ? Math.round((progress.completed / progress.total) * 100)
      : 0

  return (
    <div
      className={cn(
        'relative p-5 rounded-2xl overflow-hidden',
        'bg-gradient-to-br from-card via-card to-primary/5',
        'border border-primary/20',
        'shadow-lg shadow-primary/10',
        'animate-in slide-in-from-top-2 duration-300'
      )}
    >
      {/* Background Decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                'bg-primary/10 border border-primary/20'
              )}
            >
              <Download className="h-5 w-5 text-primary animate-bounce" />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">Downloading {modelName}</span>
              <p className="text-xs text-muted-foreground">
                Please ensure your network connection is stable
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className={cn(
              'h-8 px-3 text-xs',
              'text-muted-foreground hover:text-destructive',
              'hover:bg-destructive/10'
            )}
          >
            <XCircle className="h-3.5 w-3.5 mr-1.5" />
            Cancel
          </Button>
        </div>

        {/* Progress Info */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-2xl font-bold',
                  'bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent'
                )}
              >
                {percentage}%
              </span>
              {percentage > 0 && percentage < 100 && (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              )}
            </div>
            {progress.total && progress.completed && (
              <span className="text-xs text-muted-foreground">
                {formatBytes(progress.completed)} / {formatBytes(progress.total)}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500 ease-out',
                'bg-gradient-to-r from-primary via-violet-500 to-indigo-500'
              )}
              style={{
                width: `${percentage}%`,
                boxShadow: '0 0 20px rgba(var(--primary), 0.5)',
              }}
            />
          </div>

          {/* Status */}
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            {progress.status || 'Preparing...'}
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Local LLM Settings Main Component
 */
export function LocalLLMSettings() {
  const {
    activeProvider,
    status,
    models,
    downloadProgress,
    downloadingModel,
    error,
    isLoading,
    providerStatuses,
    checkStatus,
    refreshModels,
    pullModel,
    deleteModel,
    testModel,
    cancelDownload,
    switchProvider,
  } = useLocalLLM()

  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434')
  const [testResult, setTestResult] = useState<{
    modelName: string
    result: string
    error?: string
  } | null>(null)
  const [testingModel, setTestingModel] = useState<string | null>(null)
  const [deletingModel, setDeletingModel] = useState<string | null>(null)
  const { confirm, ConfirmDialog } = useConfirmDialog()

  const handleTestModel = async (modelName: string) => {
    setTestingModel(modelName)
    setTestResult(null)
    try {
      const result = await testModel(modelName)
      setTestResult({ modelName, result })
    } catch (err) {
      setTestResult({
        modelName,
        result: '',
        error: err instanceof Error ? err.message : 'Failed to test',
      })
    } finally {
      setTestingModel(null)
    }
  }

  const handleDeleteModel = async (modelName: string) => {
    const confirmed = await confirm({
      title: 'Delete Model',
      description: `Are you sure you want to delete ${modelName}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    })

    if (confirmed) {
      setDeletingModel(modelName)
      try {
        await deleteModel(modelName)
      } finally {
        setDeletingModel(null)
      }
    }
  }

  const handlePullModel = async (modelName: string) => {
    try {
      await pullModel(modelName)
    } catch {
      // Error is already handled in the hook
    }
  }

  return (
    <div className="space-y-8">
      <ConfirmDialog />

      {/* Provider Select - Enhanced */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">LLM Engine</h2>
        </div>
        <div className="space-y-3">
          <ProviderSelector
            provider="ollama"
            name="Ollama"
            isActive={activeProvider === 'ollama'}
            isAvailable={providerStatuses['ollama']?.available || false}
            modelsCount={providerStatuses['ollama']?.modelsCount || 0}
            onClick={() => switchProvider('ollama')}
          />
          <ProviderSelector
            provider="lm-studio"
            name="LM Studio"
            isActive={activeProvider === 'lm-studio'}
            isAvailable={providerStatuses['lm-studio']?.available || false}
            modelsCount={providerStatuses['lm-studio']?.modelsCount || 0}
            onClick={() => switchProvider('lm-studio')}
          />
        </div>
      </section>

      {/* Status - Enhanced */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Connection Status</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkStatus}
            disabled={status === 'checking'}
            className={cn(
              'h-8 px-3',
              'border-primary/30 hover:border-primary hover:bg-primary/5',
              'transition-all duration-200'
            )}
          >
            <RefreshCw className={cn('h-4 w-4 mr-1.5', status === 'checking' && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        <StatusIndicator status={status} provider={activeProvider} />

        {status === 'unavailable' && (
          <div
            className={cn(
              'flex items-start gap-4 p-4 rounded-xl',
              'bg-amber-500/10 border border-amber-500/20'
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                {PROVIDER_NAMES[activeProvider]} Not Running
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Please ensure the service is installed and currently running
              </p>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 mt-2 text-xs text-primary hover:text-primary/80"
                asChild
              >
                <a href={PROVIDER_LINKS[activeProvider]} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Install {PROVIDER_NAMES[activeProvider]}
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* URL Config - Enhanced */}
        {activeProvider === 'ollama' && status === 'available' && (
          <div className="space-y-3">
            <Label htmlFor="ollama-url" className="text-sm font-medium flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" />
              Service Address
            </Label>
            <div className="flex gap-2">
              <Input
                id="ollama-url"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className={cn(
                  'h-11 rounded-xl',
                  'border-border/50 focus:border-primary/50',
                  'transition-all duration-200'
                )}
              />
              <Button
                variant="outline"
                onClick={checkStatus}
                className={cn(
                  'h-11 px-5 rounded-xl',
                  'border-primary/30 hover:border-primary hover:bg-primary/5'
                )}
              >
                <Zap className="w-4 h-4 mr-2" />
                Test
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Error Message - Enhanced */}
      {error && (
        <div
          className={cn(
            'flex items-center gap-3 p-4 rounded-xl',
            'bg-destructive/10 border border-destructive/20',
            'animate-in slide-in-from-top-2 duration-300'
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* DownloadProgress */}
      {downloadingModel && downloadProgress && (
        <DownloadProgress
          modelName={downloadingModel}
          progress={downloadProgress}
          onCancel={cancelDownload}
        />
      )}

      {/* Installed Models - Enhanced */}
      {status === 'available' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Installed Models</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full">
                {models.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshModels}
              disabled={isLoading}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', isLoading && 'animate-spin')} />
              Refresh
            </Button>
          </div>

          {models.length > 0 ? (
            <div className="space-y-1">
              {models.map((model, index) => (
                <div
                  key={model.name}
                  className="animate-in fade-in slide-in-from-left-2"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ModelItem
                    model={model}
                    onTest={() => handleTestModel(model.name)}
                    onDelete={() => handleDeleteModel(model.name)}
                    isDeleting={deletingModel === model.name}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div
                className={cn(
                  'w-16 h-16 mx-auto mb-4 rounded-2xl',
                  'bg-muted/50 border border-border/50',
                  'flex items-center justify-center'
                )}
              >
                <HardDrive className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">No installed models</p>
              <p className="text-xs text-muted-foreground">
                Select and install from the recommended models below
              </p>
            </div>
          )}
        </section>
      )}

      {/* Recommended Models - Enhanced */}
      {status === 'available' && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Recommended Models</h2>
          </div>
          <div className="space-y-1">
            {RECOMMENDED_MODELS.map((model, index) => {
              const isInstalled = models.some((m) => m.name === model.name)
              const isDownloading = downloadingModel === model.name

              return (
                <div
                  key={model.name}
                  className="animate-in fade-in slide-in-from-left-2"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <RecommendedModelItem
                    model={model}
                    isInstalled={isInstalled}
                    isDownloading={isDownloading}
                    onDownload={() => handlePullModel(model.name)}
                  />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* TestResultDialog - Enhanced */}
      <Dialog open={!!testResult} onOpenChange={() => setTestResult(null)}>
        <DialogContent className={cn('sm:max-w-[500px]', 'border-border/50', 'shadow-2xl')}>
          {/* Top Decoration */}
          <div
            className={cn(
              'absolute top-0 left-0 right-0 h-1 rounded-t-lg',
              testResult?.error
                ? 'bg-gradient-to-r from-destructive via-red-500 to-orange-500'
                : 'bg-gradient-to-r from-emerald-500 via-primary to-teal-500'
            )}
          />

          <DialogHeader className="pt-2">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  testResult?.error
                    ? 'bg-gradient-to-br from-destructive/20 to-destructive/5 border border-destructive/20'
                    : 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20'
                )}
              >
                {testResult?.error ? (
                  <XCircle className="w-6 h-6 text-destructive" />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                )}
              </div>
              <div>
                <DialogTitle
                  className={cn(
                    'text-lg',
                    testResult?.error
                      ? 'text-destructive'
                      : 'text-emerald-600 dark:text-emerald-400'
                  )}
                >
                  {testResult?.error ? 'Failed to Test' : 'Test Successful'}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-1.5 mt-0.5">
                  <Cpu className="w-3 h-3" />
                  Model: {testResult?.modelName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4">
            {testResult?.error ? (
              <div
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl',
                  'bg-destructive/10 border border-destructive/20'
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                <p className="text-sm text-destructive">{testResult.error}</p>
              </div>
            ) : (
              <div className={cn('p-4 rounded-xl', 'bg-muted/30 border border-border/50')}>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {testResult?.result}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => setTestResult(null)}
              className={cn(
                'h-10 px-6 rounded-xl',
                testResult?.error
                  ? 'bg-muted hover:bg-muted/80 text-foreground'
                  : 'bg-gradient-to-r from-emerald-500 to-primary text-white hover:from-emerald-400 hover:to-[primary/90] shadow-lg shadow-emerald-500/20'
              )}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Testing Dialog - Enhanced */}
      <Dialog open={!!testingModel} onOpenChange={() => {}}>
        <DialogContent className={cn('sm:max-w-[400px]', 'border-border/50', 'shadow-2xl')}>
          {/* Top Decoration */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-violet-500 to-indigo-500 rounded-t-lg" />

          <DialogHeader className="pt-2">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  'bg-gradient-to-br from-primary/20 to-violet-500/10',
                  'border border-primary/20'
                )}
              >
                <Cpu className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">Testing</DialogTitle>
                <DialogDescription className="mt-0.5">
                  Communicating with the model...
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-10">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div className="absolute -inset-4 border-2 border-primary/20 rounded-3xl animate-ping opacity-30" />
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Testing <span className="font-semibold text-foreground">{testingModel}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Please wait...</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default LocalLLMSettings
