'use client'

/**
 * Conversation Import Dialog Component
 * Supports importing JSON format conversations
 */

import { useState, useCallback } from 'react'
import { Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { conversationApi, type ImportConversationRequest } from '@/lib/api'
import type { ConversationFolder } from '@/types/conversation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ImportDialogProps {
  workspaceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  folders: ConversationFolder[]
  onSuccess?: () => void
}

export function ImportDialog({
  workspaceId,
  open,
  onOpenChange,
  folders,
  onSuccess,
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ImportConversationRequest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    importedCount: number
    totalMessages: number
  } | null>(null)

  // Form State
  const [title, setTitle] = useState('')
  const [folderId, setFolderId] = useState<string>('')

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setError(null)
    setResult(null)

    // Parse File
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const data = JSON.parse(content)

        // Verify data format
        if (!data.title && !data.messages) {
          setError('Invalid conversation file format')
          return
        }

        // Convert to import format
        const importData: ImportConversationRequest = {
          workspaceId,
          title: data.title || selectedFile.name.replace(/\.\w+$/, ''),
          model: data.model,
          systemPrompt: data.system_prompt,
          messages: [],
        }

        if (Array.isArray(data.messages)) {
          importData.messages = data.messages.map((msg: Record<string, unknown>) => ({
            role: (msg.role as string) || 'user',
            content: (msg.content as string) || '',
            model: msg.model as string,
            createdAt: msg.created_at as string,
          }))
        }

        setParsedData(importData)
        setTitle(importData.title)
      } catch {
        setError('Failed to parse file. Please ensure the file is valid JSON.')
      }
    }

    reader.onerror = () => {
      setError('Failed to read file')
    }

    reader.readAsText(selectedFile)
  }, [])

  const handleImport = async () => {
    if (!parsedData) return

    setImporting(true)
    setError(null)

    try {
      const importResult = await conversationApi.importConversation({
        ...parsedData,
        workspaceId,
        title: title || parsedData.title,
        folderId: folderId || undefined,
      })

      setResult({
        success: importResult.success,
        importedCount: importResult.importedCount,
        totalMessages: importResult.totalMessages,
      })

      if (importResult.success) {
        onSuccess?.()
      }
    } catch (err) {
      setError('Failed to import. Please try again.')
      console.error('Import failed:', err)
    } finally {
      setImporting(false)
    }
  }

  const resetState = () => {
    setFile(null)
    setParsedData(null)
    setError(null)
    setResult(null)
    setTitle('')
    setFolderId('')
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      resetState()
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Conversation
          </DialogTitle>
          <DialogDescription>Import conversation records from a JSON file</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>Select file</Label>
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                'hover:border-primary hover:bg-muted/50',
                file && 'border-primary bg-muted/30'
              )}
              onClick={() => document.getElementById('import-file')?.click()}
            >
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileJson className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
              {file ? (
                <div>
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Click or drag and drop a file here
                  </p>
                  <p className="text-xs text-muted-foreground">Supports JSON format</p>
                </div>
              )}
            </div>
          </div>

          {/* Parse Result */}
          {parsedData && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Conversation title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter conversation title"
                />
              </div>

              <div className="space-y-2">
                <Label>Target folder</Label>
                <Select value={folderId} onValueChange={setFolderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select folder (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Directory</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.icon} {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 rounded-lg bg-muted text-sm">
                <p className="text-muted-foreground">
                  Will import{' '}
                  <span className="font-medium text-foreground">{parsedData.messages.length}</span>{' '}
                  messages
                </p>
                {parsedData.model && (
                  <p className="text-muted-foreground">
                    Model: <span className="font-medium text-foreground">{parsedData.model}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {result?.success && (
            <Alert className="border-emerald-500 bg-emerald-500/10">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <AlertDescription className="text-emerald-700 dark:text-emerald-400">
                Import successful! Imported {result.importedCount} / {result.totalMessages} messages
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            {result?.success ? 'Done' : 'Cancel'}
          </Button>
          {!result?.success && (
            <Button onClick={handleImport} disabled={!parsedData || importing}>
              {importing ? 'Import...' : 'Import'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
