'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { generateSandboxHTML } from './sandbox-template'
import { createHostMessage, parseSandboxMessage } from './sandbox-bridge'
import type { SandboxMessage } from './sandbox-bridge'

interface SandboxHostProps {
  code: string
  data?: Record<string, unknown>
  theme?: 'light' | 'dark'
  minHeight?: number
  maxHeight?: number
  className?: string
  onError?: (message: string) => void
  onAction?: (action: string, payload?: unknown) => void
}

export function SandboxHost({
  code,
  data,
  theme = 'light',
  minHeight = 60,
  maxHeight = 800,
  className,
  onError,
  onAction,
}: SandboxHostProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(minHeight)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const msg = parseSandboxMessage(event)
      if (!msg) return

      switch (msg.type) {
        case 'READY':
          setReady(true)
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              createHostMessage({ type: 'INIT', code, data, theme }),
              '*'
            )
          }
          break
        case 'RENDER_COMPLETE':
          if (msg.height) {
            setHeight(Math.max(minHeight, Math.min(msg.height, maxHeight)))
          }
          break
        case 'RESIZE':
          if ((msg as SandboxMessage & { height?: number }).height) {
            setHeight(
              Math.max(
                minHeight,
                Math.min((msg as SandboxMessage & { height: number }).height, maxHeight)
              )
            )
          }
          break
        case 'ERROR':
          setError((msg as SandboxMessage & { message: string }).message)
          onError?.((msg as SandboxMessage & { message: string }).message)
          break
        case 'ACTION_REQUEST':
          onAction?.(
            (msg as SandboxMessage & { action: string }).action,
            (msg as SandboxMessage & { payload?: unknown }).payload
          )
          break
      }
    },
    [code, data, theme, minHeight, maxHeight, onError, onAction]
  )

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  // Send updated data when data prop changes
  useEffect(() => {
    if (ready && data && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        createHostMessage({ type: 'UPDATE_DATA', data }),
        '*'
      )
    }
  }, [data, ready])

  const srcdoc = generateSandboxHTML(theme)

  return (
    <div className={className}>
      {error && (
        <div className="px-3 py-2 mb-2 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          {error}
        </div>
      )}
      <iframe
        ref={iframeRef}
        srcDoc={srcdoc}
        sandbox="allow-scripts"
        style={{
          width: '100%',
          height: `${height}px`,
          border: 'none',
          borderRadius: '6px',
          overflow: 'hidden',
        }}
        title="Custom Component Sandbox"
      />
    </div>
  )
}
