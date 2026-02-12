'use client'

import React, { useRef, useState } from 'react'
import { Upload, X, Check, FileIcon, Image, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDataProvider } from '../data-provider'
import type { FileUploadConfig } from '../types'

interface FileUploadBlockProps {
  config: FileUploadConfig
}

export function FileUploadBlock({ config }: FileUploadBlockProps) {
  const { uploadFile } = useDataProvider()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([])
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const maxSizeMB = config.max_size_mb || 10

  const handleFiles = async (files: FileList | File[]) => {
    setError('')
    const fileArray = Array.from(files)

    for (const file of fileArray) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`"${file.name}" exceeds ${maxSizeMB}MB limit`)
        return
      }
    }

    setUploading(true)
    try {
      for (const file of fileArray) {
        if (uploadFile) {
          const url = await uploadFile(file, config.prefix)
          setUploadedFiles((prev) => [...prev, { name: file.name, url }])
        } else {
          setError('File upload not available in this context')
          break
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const removeFile = (idx: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      {config.label && <h3 className="text-sm font-semibold text-foreground">{config.label}</h3>}
      {config.description && <p className="text-xs text-foreground-muted">{config.description}</p>}

      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
          dragOver
            ? 'border-brand-500 bg-brand-500/5'
            : 'border-border hover:border-foreground-muted'
        )}
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
            <span className="text-xs text-foreground-muted">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-6 h-6 text-foreground-muted" />
            <span className="text-xs text-foreground-muted">
              Click or drag files here to upload
            </span>
            <span className="text-[10px] text-foreground-muted">
              Max {maxSizeMB}MB{config.accept ? ` · ${config.accept}` : ''}
            </span>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={config.accept}
          multiple={config.multiple !== false}
          onChange={handleInputChange}
        />
      </div>

      {error && <div className="text-xs text-destructive">{error}</div>}

      {uploadedFiles.length > 0 && (
        <div className="space-y-1.5">
          {uploadedFiles.map((file, i) => {
            const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name)
            return (
              <div
                key={i}
                className="flex items-center gap-2 px-2 py-1.5 rounded bg-surface-200/30 border border-border/50"
              >
                {isImage ? (
                  <Image className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                ) : (
                  <FileIcon className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                )}
                <span className="text-xs text-foreground flex-1 truncate">{file.name}</span>
                <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                <button
                  onClick={() => removeFile(i)}
                  className="text-foreground-muted hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
