'use client'

/**
 * Conversation Template Select Component
 * Used for selecting a template when creating a conversation
 */

import { useState, useEffect } from 'react'
import { FileText, Search, Loader2, Star, Globe, Lock, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { conversationTemplateApi, type ConversationTemplate } from '@/lib/api'

interface TemplateSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (template: ConversationTemplate) => void
}

export function TemplateSelector({ open, onOpenChange, onSelect }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<ConversationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchTemplates()
    }
  }, [open])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await conversationTemplateApi.list({
        includePublic: true,
        includeSystem: true,
        pageSize: 100,
      })
      setTemplates(response.templates)
    } catch (err) {
      console.error('Failed to fetch templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = async (template: ConversationTemplate) => {
    try {
      // Increase usage count
      const usedTemplate = await conversationTemplateApi.use(template.id)
      onSelect(usedTemplate)
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to use template:', err)
      // Even if tracking fails, still select the template
      onSelect(template)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Select Conversation Template
          </DialogTitle>
          <DialogDescription>
            Use a preset template to quickly start a conversation
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-light" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="pl-9"
          />
        </div>

        {/* Template List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-foreground-light">
              {search ? 'No matching templates' : 'No templates'}
            </div>
          ) : (
            <div className="space-y-2 py-2">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedId(template.id === selectedId ? null : template.id)}
                  onDoubleClick={() => handleSelect(template)}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border transition-colors',
                    selectedId === template.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-surface-200/50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{template.icon || '📝'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">{template.name}</span>
                        {template.isSystem && (
                          <Badge variant="secondary" className="text-xs">
                            <Settings className="w-3 h-3 mr-1" />
                            System
                          </Badge>
                        )}
                        {template.isPublic && !template.isSystem && (
                          <Badge variant="outline" className="text-xs">
                            <Globe className="w-3 h-3 mr-1" />
                            Public
                          </Badge>
                        )}
                        {!template.isPublic && !template.isSystem && (
                          <Badge variant="outline" className="text-xs">
                            <Lock className="w-3 h-3 mr-1" />
                            Private
                          </Badge>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-sm text-foreground-light line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-foreground-light">
                        <span>{template.model}</span>
                        {template.usageCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Used {template.usageCount} times
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer Button */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const template = templates.find((t) => t.id === selectedId)
              if (template) handleSelect(template)
            }}
            disabled={!selectedId}
          >
            Use Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
