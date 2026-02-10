'use client'

/**
 * FileUploadComponent
 * Supports drag-and-drop upload, multiple files, preview, and other features
 */

import { useState, useRef, useCallback, ReactNode } from 'react'
import {
  Upload,
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Download,
  Trash2,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Progress } from './progress'

// File type icon mapping
const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return FileImage
  if (type.startsWith('video/')) return FileVideo
  if (type.startsWith('audio/')) return FileAudio
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return FileArchive
  if (
    type.includes('javascript') ||
    type.includes('typescript') ||
    type.includes('json') ||
    type.includes('html') ||
    type.includes('css')
  )
    return FileCode
  if (type.includes('pdf') || type.includes('doc') || type.includes('text')) return FileText
  return File
}

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ============================================
// Upload file type
// ============================================

export interface UploadFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  url?: string
}

// ============================================
// Drag & drop upload region
// ============================================

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxSize?: number
  maxFiles?: number
  disabled?: boolean
  className?: string
  children?: ReactNode
}

export function DropZone({
  onFilesSelected,
  accept,
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 10,
  disabled = false,
  className,
  children,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) setIsDragging(true)
    },
    [disabled]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const droppedFiles = Array.from(e.dataTransfer.files)
      const validFiles = droppedFiles.filter((file) => {
        if (maxSize && file.size > maxSize) return false
        if (accept) {
          const acceptedTypes = accept.split(',').map((t) => t.trim())
          const isAccepted = acceptedTypes.some((type) => {
            if (type.startsWith('.')) {
              return file.name.toLowerCase().endsWith(type.toLowerCase())
            }
            if (type.endsWith('/*')) {
              return file.type.startsWith(type.replace('/*', '/'))
            }
            return file.type === type
          })
          if (!isAccepted) return false
        }
        return true
      })

      const filesToAdd = multiple ? validFiles.slice(0, maxFiles) : validFiles.slice(0, 1)
      if (filesToAdd.length > 0) {
        onFilesSelected(filesToAdd)
      }
    },
    [disabled, maxSize, accept, multiple, maxFiles, onFilesSelected]
  )

  const handleClick = () => {
    if (!disabled) inputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : []
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles)
    }
    e.target.value = ''
  }

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        'relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />

      {children || (
        <>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <p className="text-foreground font-medium mb-1">
            {isDragging ? 'Release to upload' : 'Drag and drop files here, or click to upload'}
          </p>
          <p className="text-sm text-muted-foreground">
            Supports {accept || 'all file types'}. Max file size: {formatFileSize(maxSize)}
          </p>
        </>
      )}
    </div>
  )
}

// ============================================
// FileUploadList
// ============================================

interface FileUploadItemProps {
  file: UploadFile
  onRemove?: () => void
  onPreview?: () => void
  onRetry?: () => void
  showPreview?: boolean
  className?: string
}

export function FileUploadItem({
  file,
  onRemove,
  onPreview,
  onRetry,
  showPreview = true,
  className,
}: FileUploadItemProps) {
  const FileIcon = getFileIcon(file.type)
  const isImage = file.type.startsWith('image/')

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border transition-all',
        file.status === 'error'
          ? 'border-red-500/30 bg-red-500/5'
          : file.status === 'success'
            ? 'border-emerald-500/30 bg-emerald-500/5'
            : 'border-border bg-card',
        className
      )}
    >
      {/* Preview/Icon */}
      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {isImage && showPreview && file.url ? (
          <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
        ) : (
          <FileIcon className="w-6 h-6 text-muted-foreground" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-foreground truncate">{file.name}</p>
          {file.status === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          )}
          {file.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size)}
          {file.error && <span className="text-red-500 ml-2">{file.error}</span>}
        </p>
        {file.status === 'uploading' && <Progress value={file.progress} className="h-1 mt-2" />}
      </div>

      {/* Action */}
      <div className="flex items-center gap-1 shrink-0">
        {file.status === 'uploading' && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
        {file.status === 'error' && onRetry && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRetry}>
            <Loader2 className="w-4 h-4" />
          </Button>
        )}
        {file.status === 'success' && onPreview && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPreview}>
            <Eye className="w-4 h-4" />
          </Button>
        )}
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-red-500"
            onClick={onRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

// ============================================
// Complete file upload component
// ============================================

interface FileUploaderProps {
  value: UploadFile[]
  onChange: (files: UploadFile[]) => void
  onUpload?: (file: File) => Promise<string>
  accept?: string
  multiple?: boolean
  maxSize?: number
  maxFiles?: number
  disabled?: boolean
  className?: string
}

export function FileUploader({
  value = [],
  onChange,
  onUpload,
  accept,
  multiple = true,
  maxSize = 10 * 1024 * 1024,
  maxFiles = 10,
  disabled = false,
  className,
}: FileUploaderProps) {
  const handleFilesSelected = async (selectedFiles: File[]) => {
    const newFiles: UploadFile[] = selectedFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: 'pending' as const,
    }))

    const updatedFiles = [...value, ...newFiles].slice(0, maxFiles)
    onChange(updatedFiles)

    // Simulate upload
    for (const uploadFile of newFiles) {
      if (onUpload) {
        try {
          // Update status to uploading
          onChange(
            updatedFiles.map((f) =>
              f.id === uploadFile.id ? { ...f, status: 'uploading' as const } : f
            )
          )

          // Simulate progress
          for (let progress = 0; progress <= 100; progress += 20) {
            await new Promise((resolve) => setTimeout(resolve, 200))
            onChange((prev) => prev.map((f) => (f.id === uploadFile.id ? { ...f, progress } : f)))
          }

          const url = await onUpload(uploadFile.file)
          onChange((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id ? { ...f, status: 'success' as const, progress: 100, url } : f
            )
          )
        } catch (error) {
          onChange((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? { ...f, status: 'error' as const, error: 'Failed to Upload' }
                : f
            )
          )
        }
      } else {
        // No actual upload handler, mark as success directly
        const url = URL.createObjectURL(uploadFile.file)
        onChange((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: 'success' as const, progress: 100, url } : f
          )
        )
      }
    }
  }

  const handleRemove = (id: string) => {
    onChange(value.filter((f) => f.id !== id))
  }

  const canAddMore = value.length < maxFiles

  return (
    <div className={cn('space-y-4', className)}>
      {canAddMore && (
        <DropZone
          onFilesSelected={handleFilesSelected}
          accept={accept}
          multiple={multiple}
          maxSize={maxSize}
          maxFiles={maxFiles - value.length}
          disabled={disabled}
        />
      )}

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file) => (
            <FileUploadItem key={file.id} file={file} onRemove={() => handleRemove(file.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// Compact file upload button
// ============================================

interface CompactUploaderProps {
  onFileSelected: (file: File) => void
  accept?: string
  disabled?: boolean
  children?: ReactNode
  className?: string
}

export function CompactUploader({
  onFileSelected,
  accept,
  disabled = false,
  children,
  className,
}: CompactUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (!disabled) inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelected(file)
    }
    e.target.value = ''
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={disabled}
        className={className}
      >
        {children || (
          <>
            <Plus className="w-4 h-4 mr-2" />
            Upload File
          </>
        )}
      </Button>
    </>
  )
}
