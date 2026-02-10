'use client'

/**
 * Edit Agent Page
 * Supabase Style: Minimal, Professional, Form Rich
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  Bot,
  ArrowLeft,
  Save,
  Trash2,
  Upload,
  Code,
  MessageSquare,
  Zap,
  Eye,
  Settings,
  AlertCircle,
  Check,
  X,
  RefreshCw,
  Play,
  Copy,
  Shield,
  Clock,
  History,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Mock Agent Data
const mockAgent = {
  id: '1',
  name: 'Support Assistant',
  description: 'Smart support bot that can handle FAQs and provide 24/7 support',
  model: 'gpt-4',
  capabilities: ['chat', 'analyze'],
  systemPrompt:
    'You are a professional support assistant. Help users resolve issues. Maintain a friendly, professional tone. If an issue cannot be resolved, guide the user to contact human support.',
  welcomeMessage: "Hello! I'm a smart support assistant. How can I help you?",
  temperature: 0.7,
  maxTokens: 2048,
  avatar: null,
  status: 'active',
  createdAt: '2026-01-15',
  updatedAt: '2026-01-28',
}

// AI Model Options
const aiModels = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { id: 'claude-3', name: 'Claude 3', provider: 'Anthropic' },
  { id: 'qwen', name: 'Qwen', provider: 'Alibaba' },
]

// Capability Options
const capabilities = [
  {
    id: 'chat',
    name: 'Conversation',
    icon: MessageSquare,
    description: 'Natural language conversation',
  },
  { id: 'code', name: 'Code', icon: Code, description: 'Code generation and analysis' },
  { id: 'analyze', name: 'Analytics', icon: Zap, description: 'Data analytics' },
  { id: 'search', name: 'Search', icon: Eye, description: 'Web search' },
]

export default function EditAgentPage() {
  const params = useParams()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'model' | 'advanced'>('basic')

  // Form State
  const [formData, setFormData] = useState({
    name: mockAgent.name,
    description: mockAgent.description,
    model: mockAgent.model,
    capabilities: mockAgent.capabilities,
    systemPrompt: mockAgent.systemPrompt,
    welcomeMessage: mockAgent.welcomeMessage,
    temperature: mockAgent.temperature,
    maxTokens: mockAgent.maxTokens,
    avatar: mockAgent.avatar,
  })

  // Update Form
  const updateForm = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  // Toggle Capability
  const toggleCapability = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      capabilities: prev.capabilities.includes(id)
        ? prev.capabilities.filter((c) => c !== id)
        : [...prev.capabilities, id],
    }))
    setHasChanges(true)
  }

  // Save Changes
  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSaving(false)
    setHasChanges(false)
  }

  // Delete Agent
  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      router.push('/dashboard/my-agents')
    }
  }

  return (
    <div className="min-h-full bg-background-studio">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background-studio/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/my-agents/${params.id}`}
              className="flex items-center gap-2 text-[13px] text-foreground-light hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div className="h-5 w-px bg-border-muted" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-brand-200 flex items-center justify-center">
                <Bot className="w-4 h-4 text-brand-500" />
              </div>
              <div>
                <p className="page-caption">Agents</p>
                <h1 className="text-page-title text-foreground">Edit Agent</h1>
                <p className="text-description">Last Updated: {mockAgent.updatedAt}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-xs text-foreground-light flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Unsaved changes
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-foreground-light hover:text-foreground hover:bg-surface-200 border-border"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button
              size="sm"
              className="bg-brand-500 hover:bg-brand-600 text-background"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-surface-75/80">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-6">
            {[
              { id: 'basic' as const, label: 'Basic Info', icon: Bot },
              { id: 'model' as const, label: 'Model Config', icon: Settings },
              { id: 'advanced' as const, label: 'Advanced Settings', icon: Shield },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-1 py-4 border-b-2 text-[13px] font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-brand-400 text-brand-500'
                    : 'border-transparent text-foreground-muted hover:text-foreground'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Basic Info */}
        {activeTab === 'basic' && (
          <div className="space-y-8">
            <div className="p-5 rounded-md bg-surface-100 border border-border">
              <h3 className="text-sm font-medium text-foreground mb-6">Basic Info</h3>

              <div className="space-y-6">
                {/* Avatar */}
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-2">
                    Avatar
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-md bg-surface-200 flex items-center justify-center border-2 border-dashed border-border">
                      {formData.avatar ? (
                        <img
                          src={formData.avatar}
                          alt=""
                          className="w-full h-full rounded-md object-cover"
                        />
                      ) : (
                        <Bot className="w-6 h-6 text-foreground-muted" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border text-foreground-light"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </Button>
                      <p className="text-xs text-foreground-muted">
                        Supports JPG, PNG format. Recommended size: 512x512
                      </p>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-2">
                    Agent Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    placeholder="Your agent's name"
                    className="h-9 bg-surface-200 border-border"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateForm('description', e.target.value)}
                    placeholder="Describe this agent's features and use cases..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-md bg-surface-200 border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none text-[13px]"
                  />
                </div>

                {/* Capabilities */}
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-3">
                    Capabilities
                  </label>
                  <div className="page-grid sm:grid-cols-2">
                    {capabilities.map((cap) => (
                      <button
                        key={cap.id}
                        onClick={() => toggleCapability(cap.id)}
                        className={cn(
                          'p-4 rounded-md text-left transition-all',
                          formData.capabilities.includes(cap.id)
                            ? 'bg-brand-200 border-2 border-brand-400'
                            : 'bg-surface-75 border border-border hover:border-border-strong'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <cap.icon
                            className={cn(
                              'w-4 h-4',
                              formData.capabilities.includes(cap.id)
                                ? 'text-brand-500'
                                : 'text-foreground-muted'
                            )}
                          />
                          <div>
                            <span className="text-[13px] font-medium text-foreground">
                              {cap.name}
                            </span>
                            <p className="text-xs text-foreground-muted">{cap.description}</p>
                          </div>
                          {formData.capabilities.includes(cap.id) && (
                            <Check className="w-4 h-4 text-brand-500 ml-auto" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Prompts */}
            <div className="p-5 rounded-md bg-surface-100 border border-border">
              <h3 className="text-sm font-medium text-foreground mb-6">Prompt Configuration</h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-2">
                    System Prompt
                  </label>
                  <textarea
                    value={formData.systemPrompt}
                    onChange={(e) => updateForm('systemPrompt', e.target.value)}
                    placeholder="Define the agent's role, behavior, and reply style..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-md bg-surface-200 border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none font-mono text-[13px]"
                  />
                  <p className="text-xs text-foreground-muted mt-2">
                    The system prompt will affect the agent's behavior and reply style
                  </p>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-2">
                    Welcome Message
                  </label>
                  <Input
                    value={formData.welcomeMessage}
                    onChange={(e) => updateForm('welcomeMessage', e.target.value)}
                    placeholder="The agent's welcome message when starting a conversation..."
                    className="h-9 bg-surface-200 border-border"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Model Config */}
        {activeTab === 'model' && (
          <div className="space-y-8">
            <div className="p-5 rounded-md bg-surface-100 border border-border">
              <h3 className="text-sm font-medium text-foreground mb-6">AI Model</h3>

              <div className="page-grid sm:grid-cols-2">
                {aiModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => updateForm('model', model.id)}
                    className={cn(
                      'p-4 rounded-md text-left transition-all',
                      formData.model === model.id
                        ? 'bg-brand-200 border-2 border-brand-400'
                        : 'bg-surface-75 border border-border hover:border-border-strong'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[13px] font-medium text-foreground">
                          {model.name}
                        </span>
                        <p className="text-xs text-foreground-muted mt-0.5">{model.provider}</p>
                      </div>
                      {formData.model === model.id && <Check className="w-4 h-4 text-brand-500" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-md bg-surface-100 border border-border">
              <h3 className="text-sm font-medium text-foreground mb-6">Parameter Settings</h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-2">
                    Temperature
                    <span className="ml-2 text-brand-500 font-normal">{formData.temperature}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => updateForm('temperature', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-foreground-muted mt-1">
                    <span>Precise (0)</span>
                    <span>Creative (2)</span>
                  </div>
                  <p className="text-xs text-foreground-muted mt-2">
                    Lower temperature produces more deterministic replies. Higher temperature
                    produces more creative replies.
                  </p>
                </div>

                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-2">
                    Maximum Tokens
                  </label>
                  <Input
                    type="number"
                    value={formData.maxTokens}
                    onChange={(e) => updateForm('maxTokens', parseInt(e.target.value))}
                    min={256}
                    max={8192}
                    className="h-9 bg-surface-200 border-border"
                  />
                  <p className="text-xs text-foreground-muted mt-2">
                    Limit the maximum length of each reply (256 - 8192)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Settings */}
        {activeTab === 'advanced' && (
          <div className="space-y-8">
            <div className="p-5 rounded-md bg-surface-100 border border-border">
              <h3 className="text-sm font-medium text-foreground mb-6">Status Management</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-md bg-surface-75">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        mockAgent.status === 'active' ? 'bg-brand-500' : 'bg-foreground-muted'
                      )}
                    />
                    <div>
                      <div className="text-[13px] font-medium text-foreground">Agent Status</div>
                      <div className="text-xs text-foreground-muted">
                        {mockAgent.status === 'active' ? 'Running' : 'Paused'}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border text-foreground-light"
                  >
                    {mockAgent.status === 'active' ? 'Pause' : 'Launch'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-md bg-surface-75">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-foreground-muted" />
                    <div>
                      <div className="text-[13px] font-medium text-foreground">Created At</div>
                      <div className="text-xs text-foreground-muted">{mockAgent.createdAt}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-md bg-surface-100 border border-border">
              <h3 className="text-sm font-medium text-foreground mb-6">API Access</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-foreground mb-2">
                    Agent ID
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={mockAgent.id}
                      readOnly
                      className="h-9 bg-surface-200 border-border font-mono"
                    />
                    <Button
                      variant="outline"
                      className="shrink-0 border-border text-foreground-light"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-md bg-surface-75">
                  <p className="text-xs text-foreground-muted">
                    Use the Agent ID to call this agent via the API.
                    <Link href="/docs/api" className="text-brand-500 hover:underline ml-1">
                      View API Docs
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-md bg-surface-200 border border-border-strong">
              <h3 className="text-sm font-semibold text-foreground mb-4">Danger Zone</h3>
              <p className="text-xs text-foreground-light mb-4">
                Deleting this agent cannot be undone. All conversation history will also be deleted.
              </p>
              <Button
                variant="outline"
                className="text-foreground-light border-border-strong hover:bg-surface-300"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Agent
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
