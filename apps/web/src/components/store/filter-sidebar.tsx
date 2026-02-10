'use client'

/**
 * Filter Sidebar Component
 *
 * Provides Category, Price, Rating, and other filter features
 */

import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Star,
  X,
  SlidersHorizontal,
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AgentCategory, PricingType } from '@/types/agent'

// Category Config
const categoryOptions: Array<{
  id: AgentCategory
  label: string
  icon: typeof MessageSquare
}> = [
  { id: 'content', label: 'Content & creative', icon: FileText },
  { id: 'data', label: 'Data process', icon: BarChart3 },
  { id: 'customer', label: 'Customer service', icon: MessageSquare },
  { id: 'productivity', label: 'Office & Productivity', icon: Users },
  { id: 'developer', label: 'Development tools', icon: Code2 },
  { id: 'research', label: 'Research & analytics', icon: Globe },
  { id: 'education', label: 'Education & Learning', icon: GraduationCap },
  { id: 'finance', label: 'Finance', icon: Wallet },
  { id: 'marketing', label: 'Marketplace & marketing', icon: TrendingUp },
  { id: 'other', label: 'Other', icon: Sparkles },
]

// Price Options
const pricingOptions: Array<{
  id: PricingType | 'all'
  label: string
}> = [
  { id: 'all', label: 'All' },
  { id: 'free', label: 'Free' },
  { id: 'paid', label: 'Paid' },
  { id: 'subscription', label: 'Subscription' },
]

// Rating Options
const ratingOptions = [
  { id: 4.5, label: '4.5 and above' },
  { id: 4.0, label: '4.0 and above' },
  { id: 3.5, label: '3.5 and above' },
  { id: 3.0, label: '3.0 and above' },
]

interface FilterSidebarProps {
  // Current Filter Values
  selectedCategories?: AgentCategory[]
  selectedPricing?: PricingType | 'all'
  selectedMinRating?: number

  // Callbacks
  onCategoryChange?: (categories: AgentCategory[]) => void
  onPricingChange?: (pricing: PricingType | 'all') => void
  onMinRatingChange?: (rating: number | undefined) => void
  onClearAll?: () => void

  // Display Statistics
  categoryCounts?: Record<AgentCategory, number>

  // style
  className?: string
  collapsible?: boolean
}

export function FilterSidebar({
  selectedCategories = [],
  selectedPricing = 'all',
  selectedMinRating,
  onCategoryChange,
  onPricingChange,
  onMinRatingChange,
  onClearAll,
  categoryCounts = {} as Record<AgentCategory, number>,
  className,
  collapsible = true,
}: FilterSidebarProps) {
  // Collapse Status
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    category: true,
    pricing: true,
    rating: true,
  })

  const toggleSection = (section: string) => {
    if (!collapsible) return
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Toggle Category Selection
  const toggleCategory = (categoryId: AgentCategory) => {
    if (!onCategoryChange) return

    const isSelected = selectedCategories.includes(categoryId)
    if (isSelected) {
      onCategoryChange(selectedCategories.filter((c) => c !== categoryId))
    } else {
      onCategoryChange([...selectedCategories, categoryId])
    }
  }

  // Calculate Active Filter Count
  const activeFilterCount =
    selectedCategories.length + (selectedPricing !== 'all' ? 1 : 0) + (selectedMinRating ? 1 : 0)

  const hasActiveFilters = activeFilterCount > 0

  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold text-foreground">Filter</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {activeFilterCount}
            </span>
          )}
        </div>
        {hasActiveFilters && onClearAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Category Filter */}
        <div className="border-b border-border pb-6">
          <button
            onClick={() => toggleSection('category')}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <span className="text-sm font-medium text-foreground">Category</span>
            {collapsible &&
              (expandedSections.category ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ))}
          </button>

          {expandedSections.category && (
            <div className="space-y-1">
              {categoryOptions.map((category) => {
                const isSelected = selectedCategories.includes(category.id)
                const count = categoryCounts[category.id] || 0
                const IconComponent = category.icon

                return (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={cn(
                      'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors',
                      isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="flex-1 text-left">{category.label}</span>
                    {count > 0 && (
                      <span
                        className={cn(
                          'text-xs',
                          isSelected ? 'text-primary' : 'text-muted-foreground/60'
                        )}
                      >
                        {count}
                      </span>
                    )}
                    {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Price Filter */}
        <div className="border-b border-border pb-6">
          <button
            onClick={() => toggleSection('pricing')}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <span className="text-sm font-medium text-foreground">Price</span>
            {collapsible &&
              (expandedSections.pricing ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ))}
          </button>

          {expandedSections.pricing && (
            <div className="space-y-1">
              {pricingOptions.map((option) => {
                const isSelected = selectedPricing === option.id

                return (
                  <button
                    key={option.id}
                    onClick={() => onPricingChange?.(option.id)}
                    className={cn(
                      'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors',
                      isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                        isSelected ? 'border-primary' : 'border-muted-foreground/30'
                      )}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span className="flex-1 text-left">{option.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Rating Filter */}
        <div>
          <button
            onClick={() => toggleSection('rating')}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <span className="text-sm font-medium text-foreground">Highest Rated</span>
            {collapsible &&
              (expandedSections.rating ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ))}
          </button>

          {expandedSections.rating && (
            <div className="space-y-1">
              <button
                onClick={() => onMinRatingChange?.(undefined)}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors',
                  !selectedMinRating
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                    !selectedMinRating ? 'border-primary' : 'border-muted-foreground/30'
                  )}
                >
                  {!selectedMinRating && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className="flex-1 text-left">No limit</span>
              </button>

              {ratingOptions.map((option) => {
                const isSelected = selectedMinRating === option.id

                return (
                  <button
                    key={option.id}
                    onClick={() => onMinRatingChange?.(option.id)}
                    className={cn(
                      'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors',
                      isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                        isSelected ? 'border-primary' : 'border-muted-foreground/30'
                      )}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <div className="flex items-center gap-1 flex-1">
                      <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                      <span>{option.label}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
