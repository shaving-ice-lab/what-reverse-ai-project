'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Upload,
  Trash2,
  Copy,
  FileIcon,
  Image,
  Film,
  FileText,
  Check,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/hooks/useWorkspace'
import { workspaceStorageApi, type StorageObject } from '@/lib/api/workspace-storage'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image
  if (mimeType.startsWith('video/')) return Film
  if (mimeType.startsWith('text/') || mimeType.includes('pdf') || mimeType.includes('document'))
    return FileText
  return FileIcon
}

export default function StoragePage() {
  const { workspaceId } = useWorkspace()
  const [objects, setObjects] = useState<StorageObject[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadObjects = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    try {
      const result = await workspaceStorageApi.list(workspaceId)
      setObjects(result.items || [])
      setTotal(result.total || 0)
    } catch {
      setObjects([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    loadObjects()
  }, [loadObjects])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !workspaceId) return
    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        await workspaceStorageApi.upload(workspaceId, files[i])
      }
      await loadObjects()
    } catch (err: any) {
      alert(err?.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (obj: StorageObject) => {
    if (!workspaceId) return
    if (!window.confirm(`Delete "${obj.file_name}"?`)) return
    try {
      await workspaceStorageApi.deleteObject(workspaceId, obj.id)
      await loadObjects()
    } catch (err: any) {
      alert(err?.message || 'Delete failed')
    }
  }

  const copyUrl = (obj: StorageObject) => {
    const url = obj.public_url || workspaceStorageApi.getPublicUrl(obj.id)
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(obj.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  if (!workspaceId) {
    return <div className="p-6 text-sm text-foreground-muted">Select a workspace first</div>
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Storage</h1>
          <p className="text-xs text-foreground-muted mt-0.5">
            {total} file{total !== 1 ? 's' : ''} stored
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5"
            onClick={loadObjects}
            disabled={loading}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-border rounded-lg p-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-foreground/10" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-40 bg-foreground/10 rounded" />
                  <div className="h-3 w-24 bg-foreground/10 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : objects.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-12 text-center">
          <FileIcon className="w-8 h-8 text-foreground-muted mx-auto mb-2" />
          <p className="text-sm text-foreground-muted">No files uploaded yet</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 gap-1.5"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload your first file
          </Button>
        </div>
      ) : (
        <div className="border border-border rounded-lg divide-y divide-border">
          {objects.map((obj) => {
            const Icon = getFileIcon(obj.mime_type)
            const isImage = obj.mime_type.startsWith('image/')

            return (
              <div
                key={obj.id}
                className="flex items-center gap-3 p-3 hover:bg-surface-200/20 transition-colors"
              >
                {isImage ? (
                  <div className="w-10 h-10 rounded bg-surface-200/50 overflow-hidden shrink-0">
                    <img
                      src={obj.public_url}
                      alt={obj.file_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded bg-surface-200/50 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-foreground-muted" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {obj.file_name}
                  </div>
                  <div className="text-[11px] text-foreground-muted">
                    {formatFileSize(obj.file_size)} · {obj.mime_type} ·{' '}
                    {new Date(obj.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => copyUrl(obj)}
                    title="Copy URL"
                  >
                    {copiedId === obj.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive"
                    onClick={() => handleDelete(obj)}
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
