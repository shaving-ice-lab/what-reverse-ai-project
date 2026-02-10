'use client'

/**
 * Publish Agent Dialog Component
 *
 * Allows users to publish a workflow to the Agent Store
 */

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Bot,
  Upload,
  X,
  DollarSign,
  Tag,
  Image,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { agentApi } from '@/lib/api'
import type { AgentCategory, PricingType, PublishAgentRequest } from '@/types/agent'
import { cn } from '@/lib/utils'

// Category config
const CATEGORIES: { id: AgentCategory; label: string; icon: string }[] = [
  { id: 'content', label: 'Content Creation', icon: '📝' },
  { id: 'data', label: 'Data Processing', icon: '📊' },
  { id: 'customer', label: 'Customer Service', icon: '💬' },
  { id: 'productivity', label: 'Productivity', icon: '⚡' },
  { id: 'developer', label: 'Developer Tools', icon: '🛠️' },
  { id: 'research', label: 'Research & Analytics', icon: '🔍' },
  { id: 'education', label: 'Education & Learning', icon: '📚' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'marketing', label: 'Marketing', icon: '📈' },
  { id: 'other', label: 'Other', icon: '🎯' },
]

// Pricing type config
const PRICING_TYPES: { id: PricingType; label: string; description: string }[] = [
  { id: 'free', label: 'Free', description: 'Anyone can use it for free' },
  { id: 'paid', label: 'One-Time Purchase', description: 'Users pay once for permanent access' },
  { id: 'subscription', label: 'Subscription', description: 'Users pay a monthly fee for access' },
]

// Popular tags
const POPULAR_TAGS = [
  'AI',
  'Automation',
  'Productivity',
  'Data Analytics',
  'Text Processing',
  'Image Processing',
  'Support',
  'Content Generation',
  'Translation',
  'Code',
]

interface PublishAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflowId: string
  workflowName: string
  workflowDescription?: string
  onSuccess?: (agentId: string) => void
}

export function PublishAgentDialog({
  open,
  onOpenChange,
  workflowId,
  workflowName,
  workflowDescription,
  onSuccess,
}: PublishAgentDialogProps) {
  // Form state
  const [name, setName] = useState(workflowName)
  const [description, setDescription] = useState(workflowDescription || '')
  const [longDescription, setLongDescription] = useState('')
  const [category, setCategory] = useState<AgentCategory>('other')
  const [pricingType, setPricingType] = useState<PricingType>('free')
  const [price, setPrice] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [icon, setIcon] = useState('🤖')

  // UI state
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Reset form
  useEffect(() => {
    if (open) {
      setName(workflowName)
      setDescription(workflowDescription || '')
      setLongDescription('')
      setCategory('other')
      setPricingType('free')
      setPrice('')
      setTags([])
      setTagInput('')
      setIcon('🤖')
      setStep(1)
      setError(null)
      setSuccess(false)
    }
  }, [open, workflowName, workflowDescription])

  // Add tag
  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }

  // Remove tag
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  // Add popular tag
  const handleAddPopularTag = (tag: string) => {
    if (!tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag])
    }
  }

  // Validate step 1
  const validateStep1 = () => {
    if (!name.trim()) {
      setError('Please enter an agent name')
      return false
    }
    if (!description.trim()) {
      setError('Please enter a brief description')
      return false
    }
    setError(null)
    return true
  }

  // Validate step 2
  const validateStep2 = () => {
    if (pricingType !== 'free' && (!price || parseFloat(price) <= 0)) {
      setError('Please enter a valid price')
      return false
    }
    setError(null)
    return true
  }

  // Next
  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  // Previous
  const handleBack = () => {
    setError(null)
    setStep(step - 1)
  }

  // Submit for publishing
  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const request: PublishAgentRequest = {
        workflowId,
        name: name.trim(),
        description: description.trim(),
        longDescription: longDescription.trim() || undefined,
        icon,
        category,
        tags,
        pricingType,
        price: pricingType !== 'free' ? parseFloat(price) : undefined,
      }

      const response = await agentApi.publish(request)

      setSuccess(true)

      // Delay close and callback
      setTimeout(() => {
        onOpenChange(false)
        onSuccess?.(response.data.id)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish. Please try again later.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            Publish to Agent Store
          </DialogTitle>
          <DialogDescription>Publish your workflow as an agent for others to use</DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  step >= s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-200 text-foreground-light'
                )}
              >
                {success && s === 3 ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    'w-12 h-1 rounded-full transition-colors',
                    step > s ? 'bg-primary' : 'bg-surface-200'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="py-4 min-h-[300px]">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="grid grid-cols-[80px,1fr] gap-4 items-start">
                {/* Icon Select */}
                <div>
                  <Label className="text-xs text-foreground-light mb-2 block">Icon</Label>
                  <button
                    onClick={() => {
                      // Simple emoji selector
                      const emojis = ['🤖', '⚡', '🎯', '🔮', '💡', '🚀', '✨', '🔧']
                      const currentIndex = emojis.indexOf(icon)
                      setIcon(emojis[(currentIndex + 1) % emojis.length])
                    }}
                    className="w-16 h-16 rounded-xl bg-surface-200 border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center text-3xl transition-colors"
                  >
                    {icon}
                  </button>
                </div>

                {/* Name and Category */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Agent Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Name your agent"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>Category *</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as AgentCategory)}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <span className="flex items-center gap-2">
                              <span>{cat.icon}</span>
                              <span>{cat.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Brief Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this agent can do in one sentence"
                  className="mt-1.5 resize-none"
                  rows={2}
                />
                <p className="text-xs text-foreground-light mt-1">
                  {description.length}/200 characters
                </p>
              </div>

              <div>
                <Label htmlFor="longDescription">Detailed Description</Label>
                <Textarea
                  id="longDescription"
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                  placeholder="Describe your agent's features, use cases, and capabilities in detail"
                  className="mt-1.5 resize-none"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 2: Pricing and Tags */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
              <div>
                <Label className="mb-3 block">Pricing Model</Label>
                <div className="grid gap-3">
                  {PRICING_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setPricingType(type.id)}
                      className={cn(
                        'flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left',
                        pricingType === type.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      )}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
                          pricingType === type.id
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground'
                        )}
                      >
                        {pricingType === type.id && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{type.label}</p>
                        <p className="text-sm text-foreground-light">{type.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {pricingType !== 'free' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label htmlFor="price">Price (USD) *</Label>
                  <div className="relative mt-1.5">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-light" />
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="pl-9"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label className="mb-3 block">Tags (up to 10)</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="px-3 py-1 flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Enter a tag"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button variant="outline" onClick={handleAddTag} disabled={tags.length >= 10}>
                    Add
                  </Button>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-foreground-light mb-2">Popular tags: </p>
                  <div className="flex flex-wrap gap-1">
                    {POPULAR_TAGS.filter((t) => !tags.includes(t))
                      .slice(0, 6)
                      .map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleAddPopularTag(tag)}
                          className="px-2 py-1 text-xs rounded-md bg-surface-200 text-foreground-light hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirm and Publish */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Published successfully!
                  </h3>
                  <p className="text-sm text-foreground-light">
                    Your agent has been submitted for review. Once approved, it will be available in
                    the store.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-muted/50 rounded-xl p-6">
                    <h4 className="text-sm font-medium text-foreground-light mb-4">
                      Confirm Publish Details
                    </h4>

                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-card border border-border flex items-center justify-center text-3xl">
                        {icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{name}</h3>
                        <p className="text-sm text-foreground-light mt-1">{description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-foreground-light">Category</p>
                        <p className="font-medium text-foreground">
                          {CATEGORIES.find((c) => c.id === category)?.label}
                        </p>
                      </div>
                      <div>
                        <p className="text-foreground-light">Pricing</p>
                        <p className="font-medium text-foreground">
                          {pricingType === 'free'
                            ? 'Free'
                            : `$${parseFloat(price || '0').toFixed(2)}`}
                        </p>
                      </div>
                    </div>

                    {tags.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-foreground-light mb-2">Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        What happens after submission?
                      </p>
                      <p className="text-xs text-foreground-light mt-1">
                        Your agent will enter the review queue. We will complete the review within
                        1-3 business days. Once approved, your agent will automatically appear in
                        the store.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Footer Buttons */}
        {!success && (
          <DialogFooter className="gap-2 sm:gap-0">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                Previous
              </Button>
            )}
            {step < 3 ? (
              <Button
                onClick={handleNext}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Confirm Publish
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
