'use client'

/**
 * Category and Tags Select Component
 *
 * Supports category selection and multi-tag selection
 */

import { useState, useRef, useEffect } from 'react'
import {
  FileText,
  BarChart3,
  MessageSquare,
  Users,
  Code2,
  Globe,
  TrendingUp,
  Sparkles,
  GraduationCap,
  Wallet,
  Check,
  X,
  Plus,
  Tag,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgentCategory } from '@/types/agent'

// Category Config
const categories: Array<{
  id: AgentCategory
  label: string
  description: string
  icon: typeof MessageSquare
}> = [
  {
    id: 'content',
    label: 'Content & creative',
    description: 'Article writing, content generation',
    icon: FileText,
  },
  {
    id: 'data',
    label: 'Data process',
    description: 'Data analytics, conversion, cleaning',
    icon: BarChart3,
  },
  {
    id: 'customer',
    label: 'Customer service',
    description: 'Support, FAQ, ticket processing',
    icon: MessageSquare,
  },
  {
    id: 'productivity',
    label: 'Productivity',
    description: 'Daily tasks, automation',
    icon: Users,
  },
  {
    id: 'developer',
    label: 'Development Tools',
    description: 'Code review, document generation',
    icon: Code2,
  },
  {
    id: 'research',
    label: 'Research & Analytics',
    description: 'Market research, data analytics',
    icon: Globe,
  },
  {
    id: 'education',
    label: 'Education & Learning',
    description: 'Tutoring, courses, quizzes',
    icon: GraduationCap,
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'Financial analytics, report processing',
    icon: Wallet,
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description: 'Marketing copy, social media',
    icon: TrendingUp,
  },
  { id: 'other', label: 'Other', description: 'Other types of agents', icon: Sparkles },
]

// Recommended Tags
const suggestedTags = [
  'Automation',
  'AI',
  'GPT',
  'Writing',
  'Analytics',
  'Productivity',
  'Office',
  'Marketing',
  'Data',
  'Code',
  'Support',
  'Translate',
  'Summary',
  'Generate',
  'Assistant',
]

interface CategoryTagSelectorProps {
  // Current Selection
  selectedCategory: AgentCategory | null
  selectedTags: string[]

  // Callback
  onCategoryChange: (category: AgentCategory) => void
  onTagsChange: (tags: string[]) => void

  // Config
  maxTags?: number

  // style
  className?: string
}

export function CategoryTagSelector({
  selectedCategory,
  selectedTags,
  onCategoryChange,
  onTagsChange,
  maxTags = 5,
  className,
}: CategoryTagSelectorProps) {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)

  // Click outside to close dropdown menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCategoryOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus Tags Input
  useEffect(() => {
    if (showTagInput && tagInputRef.current) {
      tagInputRef.current.focus()
    }
  }, [showTagInput])

  // Add Tag
  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (!trimmedTag) return
    if (selectedTags.includes(trimmedTag)) return
    if (selectedTags.length >= maxTags) return

    onTagsChange([...selectedTags, trimmedTag])
    setNewTag('')
  }

  // Remove Tag
  const handleRemoveTag = (tag: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tag))
  }

  // Process tag input key event
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag(newTag)
    } else if (e.key === 'Escape') {
      setShowTagInput(false)
      setNewTag('')
    }
  }

  const selectedCategoryData = categories.find((c) => c.id === selectedCategory)
  const CategoryIcon = selectedCategoryData?.icon || Sparkles

  return (
    <div className={cn('space-y-6', className)}>
      {/* Category Select */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Category <span className="text-destructive">*</span>
        </label>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className={cn(
              'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-colors text-left',
              selectedCategory
                ? 'border-primary/30 bg-primary/5'
                : 'border-border bg-background hover:border-primary/50'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  selectedCategory ? 'bg-primary/10' : 'bg-muted'
                )}
              >
                <CategoryIcon
                  className={cn(
                    'w-5 h-5',
                    selectedCategory ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
              </div>
              <div>
                <div
                  className={cn(
                    'font-medium',
                    selectedCategory ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {selectedCategoryData?.label || 'Select Category'}
                </div>
                {selectedCategoryData && (
                  <div className="text-sm text-muted-foreground">
                    {selectedCategoryData.description}
                  </div>
                )}
              </div>
            </div>
            <ChevronDown
              className={cn(
                'w-5 h-5 text-muted-foreground transition-transform',
                isCategoryOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown Menu */}
          {isCategoryOpen && (
            <div className="absolute z-10 w-full mt-2 py-2 rounded-xl bg-card border border-border shadow-xl max-h-80 overflow-y-auto">
              {categories.map((category) => {
                const Icon = category.icon
                const isSelected = selectedCategory === category.id

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      onCategoryChange(category.id)
                      setIsCategoryOpen(false)
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 transition-colors',
                      isSelected ? 'bg-primary/10' : 'hover:bg-muted'
                    )}
                  >
                    <div
                      className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center',
                        isSelected ? 'bg-primary/20' : 'bg-muted'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4',
                          isSelected ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <div
                        className={cn(
                          'font-medium',
                          isSelected ? 'text-primary' : 'text-foreground'
                        )}
                      >
                        {category.label}
                      </div>
                      <div className="text-sm text-muted-foreground">{category.description}</div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-primary" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tags Select */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Tags
          <span className="text-muted-foreground font-normal ml-2">
            ({selectedTags.length}/{maxTags})
          </span>
        </label>

        {/* Selected Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm"
            >
              <Tag className="w-3 h-3" />
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Add Tag Button/Input */}
          {selectedTags.length < maxTags &&
            (showTagInput ? (
              <div className="inline-flex items-center gap-1">
                <input
                  ref={tagInputRef}
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => {
                    if (newTag.trim()) {
                      handleAddTag(newTag)
                    }
                    setShowTagInput(false)
                  }}
                  placeholder="Enter tags"
                  className="w-24 px-2 py-1 text-sm rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
                  maxLength={20}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowTagInput(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-border text-muted-foreground text-sm hover:border-primary/50 hover:text-primary transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Tag
              </button>
            ))}
        </div>

        {/* Recommended Tags */}
        <div>
          <div className="text-xs text-muted-foreground mb-2">Recommended Tags</div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedTags
              .filter((tag) => !selectedTags.includes(tag))
              .slice(0, 10)
              .map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  disabled={selectedTags.length >= maxTags}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs transition-colors',
                    selectedTags.length >= maxTags
                      ? 'bg-muted text-muted-foreground/50 cursor-not-allowed'
                      : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  )}
                >
                  {tag}
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
