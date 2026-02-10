'use client'

/**
 * Webhook TriggerNode - Minimalist Style
 */

import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Webhook, Copy, Check, Shield, Globe2 } from 'lucide-react'
import { getApiBaseUrl } from '@/lib/env'
import { cn } from '@/lib/utils'
import type { WorkflowNodeData } from '@/types/workflow'

export interface WebhookNodeProps extends NodeProps {
  data: WorkflowNodeData
  isConnectable?: boolean
}

export const WebhookNode = memo(function WebhookNode({
  id,
  data,
  selected,
  isConnectable = true,
}: WebhookNodeProps) {
  const [copied, setCopied] = useState(false)

  const config = data.config as {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'ANY'
    secret?: string
    requireSignature?: boolean
    ipWhitelist?: string[]
    responseMode?: 'immediate' | 'wait'
    webhookUrl?: string
  }

  const method = config.method || 'POST'
  const requireSignature = config.requireSignature !== false
  const responseMode = config.responseMode || 'immediate'

  const baseUrl = getApiBaseUrl()
  const webhookUrl = config.webhookUrl || `${baseUrl}/webhooks/${id}`

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const methodColors: Record<string, string> = {
    GET: 'bg-brand-200 text-brand-500',
    POST: 'bg-surface-200 text-foreground-light',
    PUT: 'bg-warning-200 text-warning',
    DELETE: 'bg-destructive-200 text-destructive',
    ANY: 'bg-brand-200/60 text-brand-500',
  }

  return (
    <div
      className={cn(
        'min-w-[240px] rounded-lg border bg-surface-100 transition-all',
        selected
          ? 'border-brand-500 shadow-md shadow-brand-500/10'
          : 'border-border hover:border-brand-500/40'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border/70 px-3 py-2.5 bg-brand-200/30">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-500 text-background">
          <Webhook className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{data.label || 'Webhook'}</h3>
          <p className="text-xs text-foreground-muted">Receive External Requests</p>
        </div>
        <span
          className={cn(
            'px-1.5 py-0.5 rounded text-xs font-mono font-medium',
            methodColors[method]
          )}
        >
          {method}
        </span>
      </div>

      {/* Webhook URL */}
      <div className="px-3 py-2.5 space-y-2 text-xs">
        <div className="space-y-1.5">
          <label className="text-foreground-muted flex items-center gap-1">
            <Globe2 className="h-3 w-3" />
            Webhook URL
          </label>
          <div className="flex items-center gap-1.5">
            <code className="flex-1 px-2 py-1.5 rounded-md font-mono truncate bg-surface-200">
              {webhookUrl}
            </code>
            <button
              onClick={handleCopyUrl}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                copied
                  ? 'bg-brand-200 text-brand-500'
                  : 'hover:bg-surface-200 text-foreground-muted'
              )}
              title="Copy URL"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* ConfigInfo */}
        <div className="flex flex-wrap gap-1.5">
          {requireSignature && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-brand-200 text-brand-500">
              <Shield className="h-3 w-3" />
              Signature Verify
            </span>
          )}
          <span
            className={cn(
              'inline-flex px-1.5 py-0.5 rounded',
              responseMode === 'wait'
                ? 'bg-warning-200 text-warning'
                : 'bg-surface-200 text-foreground-muted'
            )}
          >
            {responseMode === 'wait' ? 'Wait for Execution' : 'Immediate Response'}
          </span>
          {config.ipWhitelist && config.ipWhitelist.length > 0 && (
            <span className="inline-flex px-1.5 py-0.5 rounded bg-surface-200 text-foreground-light">
              IP Whitelist ({config.ipWhitelist.length})
            </span>
          )}
        </div>
      </div>

      {/* OutputPortTags */}
      <div className="absolute right-3 top-[40%] text-[10px] text-brand-500">Trigger</div>
      <Handle
        id="output"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{ top: '40%' }}
        className="w-3! h-3! border-2! border-background! rounded-full! -right-1.5! bg-brand-500!"
      />

      <div className="absolute right-3 top-[60%] text-[10px] text-foreground-light">Body</div>
      <Handle
        id="body"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{ top: '60%' }}
        className="w-3! h-3! border-2! border-background! rounded-full! -right-1.5! bg-surface-300!"
      />

      <div className="absolute right-3 top-[80%] text-[10px] text-brand-500">Headers</div>
      <Handle
        id="headers"
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{ top: '80%' }}
        className="w-3! h-3! border-2! border-background! rounded-full! -right-1.5! bg-brand-500!"
      />
    </div>
  )
})
