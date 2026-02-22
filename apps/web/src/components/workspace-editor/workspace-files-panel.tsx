'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileJson,
  FileText,
  FileCode2,
  FolderOpen,
  Folder,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { workspaceDatabaseApi, type TableSchema } from '@/lib/api/workspace-database'
import type { AppSchema } from '@/components/app-renderer/types'

// ===== Types =====

interface VirtualFile {
  id: string
  name: string
  path: string
  language: string
  content: string
  icon: React.ElementType
}

interface FolderNode {
  name: string
  path: string
  children: (FolderNode | VirtualFile)[]
}

function isFolder(node: FolderNode | VirtualFile): node is FolderNode {
  return 'children' in node
}

// ===== Helpers =====

function generateReadme(appSchema: AppSchema | null, tableCount: number): string {
  const appName = appSchema?.app_name || 'Untitled App'
  const pageCount = appSchema?.pages?.length || 0
  const nav = appSchema?.navigation?.type || 'sidebar'

  let md = `# ${appName}\n\n`
  md += `> Auto-generated workspace application\n\n`
  md += `## Overview\n\n`
  md += `| Property | Value |\n`
  md += `|----------|-------|\n`
  md += `| Schema Version | ${appSchema?.app_schema_version || '-'} |\n`
  md += `| Navigation | ${nav} |\n`
  md += `| Pages | ${pageCount} |\n`
  md += `| Database Tables | ${tableCount} |\n`
  md += `| Default Page | ${appSchema?.default_page || '-'} |\n\n`

  if (appSchema?.pages && appSchema.pages.length > 0) {
    md += `## Pages\n\n`
    for (const page of appSchema.pages) {
      const blockCount = page.blocks?.length || 0
      md += `- **${page.title}** (\`${page.route}\`) — ${blockCount} block${blockCount !== 1 ? 's' : ''}\n`
    }
    md += '\n'
  }

  md += `## Project Structure\n\n`
  md += `\`\`\`\n`
  md += `├── README.md\n`
  md += `├── app-schema.json        # Full UI schema definition\n`
  md += `├── config.json            # Navigation & theme config\n`
  md += `├── database/\n`
  md += `│   └── schema.sql         # All table DDLs\n`
  md += `└── pages/\n`
  if (appSchema?.pages) {
    appSchema.pages.forEach((page, i) => {
      const prefix = i === appSchema.pages.length - 1 ? '└──' : '├──'
      md += `    ${prefix} ${page.id}.json\n`
    })
  }
  md += `\`\`\`\n`

  return md
}

function generateConfigJson(appSchema: AppSchema | null): string {
  if (!appSchema) return '{}'
  const config: Record<string, unknown> = {
    app_name: appSchema.app_name,
    app_schema_version: appSchema.app_schema_version,
    default_page: appSchema.default_page,
    navigation: appSchema.navigation,
    theme: appSchema.theme ?? null,
  }
  return JSON.stringify(config, null, 2)
}

function generatePageJson(page: AppSchema['pages'][number]): string {
  return JSON.stringify(page, null, 2)
}

// ===== Component =====

interface WorkspaceFilesPanelProps {
  workspaceId: string
  appSchema: AppSchema | null
  className?: string
}

export function WorkspaceFilesPanel({
  workspaceId,
  appSchema,
  className,
}: WorkspaceFilesPanelProps) {
  const [tableSchemas, setTableSchemas] = useState<TableSchema[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState<string>('readme')
  const [copied, setCopied] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['/', '/pages', '/database'])
  )

  // Load table schemas for DDL
  const loadTableSchemas = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    try {
      const tables = await workspaceDatabaseApi.listTables(workspaceId)
      const results = await Promise.allSettled(
        tables.map((t) => workspaceDatabaseApi.getTableSchema(workspaceId, t.name))
      )
      const schemas = results
        .filter(
          (r): r is PromiseFulfilledResult<TableSchema> =>
            r.status === 'fulfilled' && r.value != null
        )
        .map((r) => r.value)
      setTableSchemas(schemas)
    } catch {
      setTableSchemas([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    loadTableSchemas()
  }, [loadTableSchemas])

  // Generate virtual files
  const files = useMemo<VirtualFile[]>(() => {
    const result: VirtualFile[] = []

    // README.md
    result.push({
      id: 'readme',
      name: 'README.md',
      path: '/README.md',
      language: 'markdown',
      content: generateReadme(appSchema, tableSchemas.length),
      icon: FileText,
    })

    // app-schema.json
    result.push({
      id: 'app-schema',
      name: 'app-schema.json',
      path: '/app-schema.json',
      language: 'json',
      content: appSchema ? JSON.stringify(appSchema, null, 2) : '// No UI schema generated yet',
      icon: FileJson,
    })

    // config.json
    result.push({
      id: 'config',
      name: 'config.json',
      path: '/config.json',
      language: 'json',
      content: generateConfigJson(appSchema),
      icon: FileJson,
    })

    // database/schema.sql
    const ddlParts = tableSchemas.map((s) => s.ddl || `-- DDL not available for ${s.name}`)
    result.push({
      id: 'schema-sql',
      name: 'schema.sql',
      path: '/database/schema.sql',
      language: 'sql',
      content:
        ddlParts.length > 0
          ? `-- Database Schema\n-- Generated from workspace: ${workspaceId}\n\n${ddlParts.join(';\n\n')};`
          : '-- No database tables created yet',
      icon: FileCode2,
    })

    // pages/*.json
    if (appSchema?.pages) {
      for (const page of appSchema.pages) {
        result.push({
          id: `page-${page.id}`,
          name: `${page.id}.json`,
          path: `/pages/${page.id}.json`,
          language: 'json',
          content: generatePageJson(page),
          icon: FileJson,
        })
      }
    }

    return result
  }, [appSchema, tableSchemas, workspaceId])

  // Build file tree structure
  const fileTree = useMemo<(FolderNode | VirtualFile)[]>(() => {
    const rootFiles: VirtualFile[] = []
    const folders: Map<string, VirtualFile[]> = new Map()

    for (const file of files) {
      const parts = file.path.split('/')
      if (parts.length <= 2) {
        // Root level file: /README.md -> parts = ['', 'README.md']
        rootFiles.push(file)
      } else {
        // Nested: /pages/dashboard.json -> folder = 'pages'
        const folderName = parts[1]
        if (!folders.has(folderName)) folders.set(folderName, [])
        folders.get(folderName)!.push(file)
      }
    }

    const tree: (FolderNode | VirtualFile)[] = []

    // Add folders first
    for (const [name, children] of folders) {
      tree.push({
        name,
        path: `/${name}`,
        children: children.sort((a, b) => a.name.localeCompare(b.name)),
      })
    }

    // Then root files
    tree.push(
      ...rootFiles.sort((a, b) => {
        // README first
        if (a.name === 'README.md') return -1
        if (b.name === 'README.md') return 1
        return a.name.localeCompare(b.name)
      })
    )

    return tree
  }, [files])

  const selectedFile = files.find((f) => f.id === selectedFileId) || files[0]

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const handleCopy = async () => {
    if (!selectedFile) return
    try {
      await navigator.clipboard.writeText(selectedFile.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API may fail in non-secure contexts
    }
  }

  // ===== Render helpers =====

  const renderTreeNode = (node: FolderNode | VirtualFile, depth: number = 0) => {
    if (isFolder(node)) {
      const isExpanded = expandedFolders.has(node.path)
      return (
        <div key={node.path}>
          <button
            onClick={() => toggleFolder(node.path)}
            className="w-full flex items-center gap-1.5 px-2 py-1 hover:bg-surface-200/50 transition-colors text-left"
            style={{ paddingLeft: `${8 + depth * 12}px` }}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-foreground-muted shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 text-foreground-muted shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            )}
            <span className="text-[12px] text-foreground font-medium truncate">{node.name}</span>
          </button>
          {isExpanded && node.children.map((child) => renderTreeNode(child, depth + 1))}
        </div>
      )
    }

    const file = node
    const isActive = selectedFileId === file.id
    const Icon = file.icon
    return (
      <button
        key={file.id}
        onClick={() => setSelectedFileId(file.id)}
        className={cn(
          'w-full flex items-center gap-1.5 px-2 py-1 transition-colors text-left',
          isActive
            ? 'bg-brand-500/10 text-brand-500'
            : 'hover:bg-surface-200/50 text-foreground-muted hover:text-foreground'
        )}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        <Icon
          className={cn(
            'w-3.5 h-3.5 shrink-0',
            isActive ? 'text-brand-500' : getFileIconColor(file.language)
          )}
        />
        <span className={cn('text-[12px] truncate', isActive && 'font-medium')}>{file.name}</span>
      </button>
    )
  }

  return (
    <div className={cn('flex-1 flex overflow-hidden', className)}>
      {/* File Tree Sidebar */}
      <div className="w-56 shrink-0 border-r border-border flex flex-col bg-surface-50/30">
        <div className="h-9 px-3 flex items-center justify-between border-b border-border shrink-0">
          <span className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">
            Explorer
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0"
            onClick={loadTableSchemas}
            title="Refresh files"
          >
            <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-foreground-muted" />
            </div>
          ) : (
            fileTree.map((node) => renderTreeNode(node))
          )}
        </div>
      </div>

      {/* Code Viewer */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedFile ? (
          <>
            {/* File Header */}
            <div className="h-9 px-3 flex items-center gap-2 border-b border-border shrink-0 bg-surface-50/30">
              <selectedFile.icon
                className={cn('w-3.5 h-3.5', getFileIconColor(selectedFile.language))}
              />
              <span className="text-[12px] font-medium text-foreground truncate">
                {selectedFile.path}
              </span>
              <div className="ml-auto flex items-center gap-1">
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                  {selectedFile.language}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={handleCopy}
                  title="Copy content"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>

            {/* File Content */}
            <div className="flex-1 overflow-auto bg-surface-100/20">
              <pre className="p-4 text-[12px] leading-5 font-mono text-foreground whitespace-pre overflow-x-auto">
                <code>{addLineNumbers(selectedFile.content)}</code>
              </pre>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-foreground-muted">Select a file to view</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ===== Utilities =====

function getFileIconColor(language: string): string {
  switch (language) {
    case 'json':
      return 'text-amber-500'
    case 'sql':
      return 'text-blue-500'
    case 'markdown':
      return 'text-slate-400'
    default:
      return 'text-foreground-muted'
  }
}

function addLineNumbers(content: string): string {
  const lines = content.split('\n')
  const pad = String(lines.length).length
  return lines
    .map((line, i) => {
      const num = String(i + 1).padStart(pad, ' ')
      return `${num}  ${line}`
    })
    .join('\n')
}
