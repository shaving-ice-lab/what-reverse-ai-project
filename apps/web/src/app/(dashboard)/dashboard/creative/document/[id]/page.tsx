'use client'

/**
 * Document Details Page - Supabase Style
 */

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Copy,
  Download,
  Share2,
  Trash2,
  MoreHorizontal,
  Clock,
  FileText,
  Edit3,
  Check,
  Loader2,
  History,
  Star,
  MessageSquare,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Mock document data
const mockDocuments: Record<
  string,
  {
    id: string
    title: string
    content: string
    type: string
    createdAt: string
    updatedAt: string
    wordCount: number
  }
> = {
  '1': {
    id: '1',
    title: 'Q1 Marketing Plan',
    content: `# Q1 Marketing Plan

## Executive Summary

This quarter's marketing efforts focus on brand upgrades and user growth, leveraging multi-channel integrated marketing strategies to improve user engagement and brand impact.

## Core Targets

1. **User Growth Target**: Add 50,000+ new sign-ups
2. **Brand Exposure Target**: Achieve 10,000,000+ total impressions
3. **Conversion Target**: Improve paid conversion rate by 5%

## Marketing Strategy

### Content Marketing

- Publish 3-5 technology blog posts per week
- Produce 2-3 product tutorial videos
- Release industry white paper research

### Social Media Marketing

- Daily social media operations
- Deep engagement in technology communities
- Twitter/LinkedIn international community outreach

### Event Marketing

- Online events: 2 product livestreams per month
- Offline events: User meetups in major cities
- Industry conferences: Attend 2-3 industry events

## Budget Allocation

| Category | Budget | Percentage |
|------|------|------|
| Content | 50,000 | 25% |
| Advertising | 80,000 | 40% |
| Events & Operations | 50,000 | 25% |
| Other | 20,000 | 10% |

## Timeline

- Month 1: Brand upgrade, new website launch
- Month 2: Marketing campaign execution
- Month 3: New version release event, Q1 summary

## Expected Results

Through this quarter's marketing efforts, we estimate:

- DAU improvement of 30%
- Significant increase in brand search volume
- Industry brand recognition improvement`,
    type: 'text',
    createdAt: '2026-01-15',
    updatedAt: '10 min ago',
    wordCount: 458,
  },
  '2': {
    id: '2',
    title: 'Product launch announcement',
    content: `# AgentFlow 2.3 Now Available

We are excited to announce that AgentFlow 2.3 is now available!

## Key Updates

### Multi-Agent Collaboration

All-new Multi-Agent Collaboration features, supporting multiple AI agents working together to process complex multi-step tasks.

### Performance Improvements

- Execution speed improved by 50%
- Memory usage reduced by 30%

### New Integrations

- Feishu Integration
- Yuque Knowledge Base
- Notion Database

## How to Upgrade

If you are an existing user, the system will automatically upgrade for you.

Thank you for your support!`,
    type: 'text',
    createdAt: '2026-01-20',
    updatedAt: '2 hours ago',
    wordCount: 156,
  },
}

export default function DocumentPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.id as string

  const [document, setDocument] = useState(mockDocuments[documentId])
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    if (document) {
      setEditedContent(document.content)
    }
  }, [document])

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-2">Document does not exist</h2>
          <p className="text-foreground-muted mb-4">This document may have been deleted.</p>
          <Link href="/dashboard/creative">
            <Button className="bg-brand-500 hover:bg-brand-600 text-foreground">
              Back to Creative Assistant
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setDocument((prev) => (prev ? { ...prev, content: editedContent } : prev))
    setIsEditing(false)
    setIsSaving(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(document.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async () => {
    if (confirm('Delete this document? This cannot be undone.')) {
      router.push('/dashboard/creative')
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background-studio/95 backdrop-blur">
        <div className="max-w-5xl mx-auto w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/creative"
              className="p-2 rounded-md hover:bg-surface-75 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground-muted" />
            </Link>
            <div>
              <p className="page-caption">Creative</p>
              <h1 className="text-lg font-semibold text-foreground">{document.title}</h1>
              <div className="flex items-center gap-3 text-xs text-foreground-muted mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Updated at {document.updatedAt}
                </span>
                <span>{document.wordCount} char</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditedContent(document.content)
                    setIsEditing(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-brand-500 hover:bg-brand-600 text-background"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? (
                    <Check className="w-4 h-4 text-brand-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button variant="outline" size="icon">
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>

                <div className="relative">
                  <Button variant="outline" size="icon" onClick={() => setShowMenu(!showMenu)}>
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>

                  {showMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 p-1 rounded-md bg-surface-100 border border-border z-50">
                      <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground hover:bg-surface-75 transition-colors">
                        <Star className="w-4 h-4" />
                        Add to Favorites
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground hover:bg-surface-75 transition-colors">
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground hover:bg-surface-75 transition-colors">
                        <History className="w-4 h-4" />
                        Version History
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground hover:bg-surface-75 transition-colors">
                        <Wand2 className="w-4 h-4" />
                        AI Rewrite
                      </button>
                      <div className="my-1 border-t border-border" />
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className={cn(
                'w-full min-h-[600px] p-6 rounded-md',
                'bg-surface-100 border border-border text-foreground',
                'font-mono text-sm leading-relaxed',
                'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400',
                'resize-none'
              )}
            />
          ) : (
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              {document.content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) {
                  return (
                    <h1 key={i} className="text-2xl font-semibold text-foreground mb-6">
                      {line.replace('# ', '')}
                    </h1>
                  )
                }
                if (line.startsWith('## ')) {
                  return (
                    <h2 key={i} className="text-2xl font-bold text-foreground mt-8 mb-4">
                      {line.replace('## ', '')}
                    </h2>
                  )
                }
                if (line.startsWith('### ')) {
                  return (
                    <h3 key={i} className="text-xl font-semibold text-foreground mt-6 mb-3">
                      {line.replace('### ', '')}
                    </h3>
                  )
                }
                if (line.startsWith('- ')) {
                  return (
                    <li key={i} className="text-foreground-muted ml-4">
                      {line.replace('- ', '')}
                    </li>
                  )
                }
                if (/^\d+\.\s/.test(line)) {
                  return (
                    <li key={i} className="text-foreground-muted ml-4 list-decimal">
                      {line.replace(/^\d+\.\s/, '')}
                    </li>
                  )
                }
                if (line.startsWith('|')) {
                  return (
                    <div key={i} className="overflow-x-auto my-4">
                      <pre className="text-sm text-foreground-muted bg-surface-100 p-2 rounded">
                        {line}
                      </pre>
                    </div>
                  )
                }
                if (line.trim() === '') return <br key={i} />
                return (
                  <p key={i} className="text-foreground-muted my-3 leading-relaxed">
                    {line}
                  </p>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
