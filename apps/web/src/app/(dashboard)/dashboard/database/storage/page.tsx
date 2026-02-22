'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  Search,
  HardDrive,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn, formatBytes } from '@/lib/utils'
import { useWorkspace } from '@/hooks/useWorkspace'
import { workspaceStorageApi, type StorageObject } from '@/lib/api/workspace-storage'
import { useConfirmDialog } from '@/components/ui/confirm-dialog'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [dragging, setDragging] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const { confirm: confirmDelete, Dialog: DeleteStorageDialog } = useConfirmDialog()

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

  const totalSize = useMemo(() => objects.reduce((sum, o) => sum + o.file_size, 0), [objects])

  const filteredObjects = useMemo(() => {
    if (!searchQuery.trim()) return objects
    const q = searchQuery.toLowerCase()
    return objects.filter(
      (o) => o.file_name.toLowerCase().includes(q) || o.mime_type.toLowerCase().includes(q)
    )
  }, [objects, searchQuery])

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!workspaceId || files.length === 0) return
      setUploading(true)
      try {
        for (let i = 0; i < files.length; i++) {
          await workspaceStorageApi.upload(workspaceId, files[i] as File)
        }
        await loadObjects()
      } catch (err: any) {
        setErrorMsg(err?.message || 'Upload failed')
      } finally {
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    },
    [workspaceId, loadObjects]
  )

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(e.target.files)
  }

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    if (e.dataTransfer.files?.length) {
      uploadFiles(e.dataTransfer.files)
    }
  }

  const handleDelete = async (obj: StorageObject) => {
    if (!workspaceId) return
    const confirmed = await confirmDelete({
      title: 'Delete File',
      description: `Delete "${obj.file_name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    })
    if (!confirmed) return
    try {
      await workspaceStorageApi.deleteObject(workspaceId, obj.id)
      await loadObjects()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Delete failed')
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
    return (
      <div className="flex items-center justify-center h-64 text-[13px] text-foreground-lighter">
        Select a workspace first
      </div>
    )
  }

  return (
    <div
      ref={dropZoneRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn('h-full flex flex-col', dragging && 'ring-2 ring-inset ring-brand-500/40')}
    >
      {/* Toolbar */}
      <div className="h-10 shrink-0 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-3 text-[11px] text-foreground-lighter">
          <span className="flex items-center gap-1">
            <HardDrive className="w-3 h-3" />
            {total} file{total !== 1 ? 's' : ''}
          </span>
          {totalSize > 0 && <span>{formatBytes(totalSize)}</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-lighter" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 w-[160px] pl-7 text-[11px] bg-surface-100 border-border"
            />
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={loadObjects}
            disabled={loading}
            className="h-7 w-7 p-0"
            title="Refresh"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </Button>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-7 text-[11px] gap-1"
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
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

      {/* Error banner */}
      {errorMsg && (
        <div className="mx-4 mt-2 px-3 py-2 text-[12px] text-destructive bg-destructive/10 border border-destructive/20 rounded flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="ml-2 text-destructive/60 hover:text-destructive"
          >
            ✕
          </button>
        </div>
      )}

      {/* Drag overlay */}
      {dragging && (
        <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-brand-500">
            <Upload className="w-8 h-8" />
            <span className="text-[13px] font-medium">Drop files to upload</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-foreground-lighter" />
          </div>
        ) : filteredObjects.length === 0 && objects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-lg bg-surface-200 flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-foreground-lighter" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-medium text-foreground">No files yet</p>
              <p className="text-[11px] text-foreground-lighter mt-0.5">
                Upload files or drag and drop them here.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="h-7 text-[11px] gap-1"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload files
            </Button>
          </div>
        ) : filteredObjects.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-[11px] text-foreground-lighter">
            No files matching "{searchQuery}"
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 z-5">
              <tr className="border-b border-border bg-surface-75">
                <th className="text-left px-4 py-2 text-[10px] font-medium text-foreground-lighter uppercase tracking-wider w-10" />
                <th className="text-left px-4 py-2 text-[10px] font-medium text-foreground-lighter uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-4 py-2 text-[10px] font-medium text-foreground-lighter uppercase tracking-wider w-24">
                  Size
                </th>
                <th className="text-left px-4 py-2 text-[10px] font-medium text-foreground-lighter uppercase tracking-wider w-32">
                  Type
                </th>
                <th className="text-left px-4 py-2 text-[10px] font-medium text-foreground-lighter uppercase tracking-wider w-28">
                  Date
                </th>
                <th className="text-right px-4 py-2 w-24" />
              </tr>
            </thead>
            <tbody>
              {filteredObjects.map((obj) => {
                const Icon = getFileIcon(obj.mime_type)
                const isImage = obj.mime_type.startsWith('image/')
                return (
                  <tr
                    key={obj.id}
                    className="border-b border-border/50 hover:bg-surface-75 transition-colors group"
                  >
                    <td className="px-4 py-2">
                      {isImage ? (
                        <div className="w-8 h-8 rounded bg-surface-200/50 overflow-hidden">
                          <img
                            src={obj.public_url}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded bg-surface-200/50 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-foreground-lighter" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className="text-[12px] font-medium text-foreground truncate block max-w-[300px]">
                        {obj.file_name}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-[11px] text-foreground-lighter tabular-nums">
                      {formatBytes(obj.file_size)}
                    </td>
                    <td className="px-4 py-2 text-[11px] text-foreground-lighter font-mono truncate">
                      {obj.mime_type}
                    </td>
                    <td className="px-4 py-2 text-[11px] text-foreground-lighter tabular-nums">
                      {new Date(obj.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {obj.public_url && (
                          <a
                            href={obj.public_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-surface-200 transition-colors"
                            title="Open"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-foreground-lighter" />
                          </a>
                        )}
                        <button
                          onClick={() => copyUrl(obj)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-surface-200 transition-colors"
                          title="Copy URL"
                        >
                          {copiedId === obj.id ? (
                            <Check className="w-3.5 h-3.5 text-brand-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-foreground-lighter" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(obj)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-destructive/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      <DeleteStorageDialog />
    </div>
  )
}
