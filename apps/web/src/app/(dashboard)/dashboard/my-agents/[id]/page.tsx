'use client'

/**
 * Agent Details Page
 *
 * Supabase Style: Minimal, Professional, Data Rich
 */

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  Bot,
  ArrowLeft,
  Settings,
  Play,
  Pause,
  Trash2,
  Copy,
  Check,
  MessageSquare,
  Activity,
  Clock,
  Zap,
  Code,
  BarChart3,
  Calendar,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Edit,
  Share2,
  MoreVertical,
  RefreshCw,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// Mock Agent Data

const mockAgent = {
  id: '1',

  name: 'Support Assistant',

  description: 'Smart support bot that can handle FAQs and provide 24/7 support',

  status: 'active' as const,

  model: 'GPT-4',

  createdAt: '2026-01-15',

  lastActive: '2 min ago',

  avatar: null,

  capabilities: ['Conversation', 'Q&A', 'Knowledge Base'],

  stats: {
    totalConversations: 1234,

    totalMessages: 5678,

    avgResponseTime: '1.2s',

    satisfactionRate: 94.5,

    tokensUsed: 125000,

    activeUsers: 89,
  },

  config: {
    temperature: 0.7,

    maxTokens: 2048,

    systemPrompt: 'You are a professional support assistant. Help users resolve issues...',

    welcomeMessage: "Hello! I'm a smart support assistant. How can I help you?",
  },
}

// Mock Conversation History

const mockConversations = [
  {
    id: 'c1',

    user: 'User A',

    preview: 'How do I change my password?',

    time: '10 min ago',

    messages: 5,

    status: 'completed',
  },

  {
    id: 'c2',

    user: 'User B',

    preview: 'When will the product ship?',

    time: '30 min ago',

    messages: 8,

    status: 'completed',
  },

  {
    id: 'c3',

    user: 'User C',

    preview: "I'd like to request a refund",

    time: '1 hour ago',

    messages: 12,

    status: 'escalated',
  },

  {
    id: 'c4',

    user: 'User D',

    preview: 'What membership benefits are included?',

    time: '2 hours ago',

    messages: 4,

    status: 'completed',
  },
]

// Mock Performance Data

const performanceData = [
  { date: '01-24', conversations: 45, satisfaction: 92 },

  { date: '01-25', conversations: 52, satisfaction: 95 },

  { date: '01-26', conversations: 48, satisfaction: 91 },

  { date: '01-27', conversations: 61, satisfaction: 96 },

  { date: '01-28', conversations: 55, satisfaction: 94 },

  { date: '01-29', conversations: 67, satisfaction: 93 },

  { date: '01-30', conversations: 72, satisfaction: 95 },
]

export default function AgentDetailPage() {
  const params = useParams()

  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'overview' | 'conversations' | 'settings'>('overview')

  const [isRunning, setIsRunning] = useState(true)

  const [copied, setCopied] = useState(false)

  const [testInput, setTestInput] = useState('')

  const [testMessages, setTestMessages] = useState<{ role: string; content: string }[]>([
    { role: 'assistant', content: mockAgent.config.welcomeMessage },
  ])

  const [isTesting, setIsTesting] = useState(false)

  const agent = mockAgent

  // Copy Agent ID

  const copyId = () => {
    navigator.clipboard.writeText(agent.id)

    setCopied(true)

    setTimeout(() => setCopied(false), 2000)
  }

  // Toggle Run Status

  const toggleRunning = () => {
    setIsRunning(!isRunning)
  }

  // Send Test Message

  const sendTestMessage = async () => {
    if (!testInput.trim()) return

    const userMessage = { role: 'user', content: testInput }

    setTestMessages((prev) => [...prev, userMessage])

    setTestInput('')

    setIsTesting(true)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const aiMessage = {
      role: 'assistant',

      content: `Thank you for your question! Regarding "${testInput}", let me help you resolve this... This is a test reply.`,
    }

    setTestMessages((prev) => [...prev, aiMessage])

    setIsTesting(false)
  }

  return (
    <div className="min-h-full bg-background-studio">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background-studio/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/my-agents"
              className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>

            <div className="h-6 w-px bg-border" />

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-brand-200 flex items-center justify-center">
                <Bot className="w-5 h-5 text-brand-500" />
              </div>

              <div>
                <p className="page-caption">Agents</p>
                <h1 className="text-page-title text-foreground">{agent.name}</h1>
                <div className="flex items-center gap-2 text-xs text-foreground-muted">
                  <span>ID: {agent.id}</span>

                  <button onClick={copyId} className="hover:text-foreground">
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleRunning}
              className={cn(
                isRunning ? 'text-brand-500 border-brand-400' : 'text-foreground-muted'
              )}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Launch
                </>
              )}
            </Button>

            <Link href={`/dashboard/my-agents/${agent.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>

            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-foreground-muted hover:text-foreground"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}

      <div className="border-b border-border bg-surface-75">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-6">
            {[
              { id: 'overview' as const, label: 'Overview', icon: BarChart3 },

              { id: 'conversations' as const, label: 'Conversations', icon: MessageSquare },

              { id: 'settings' as const, label: 'Settings', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-1 py-4 border-b-2 text-sm font-medium transition-colors',

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
        {/* Overview Tab */}

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Status Banner */}

            <div
              className={cn(
                'p-4 rounded-md flex items-center justify-between',

                isRunning
                  ? 'bg-brand-200 border border-brand-400'
                  : 'bg-surface-100 border border-border'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-3 h-3 rounded-full',

                    isRunning ? 'bg-brand-500 animate-pulse' : 'bg-foreground-muted'
                  )}
                />

                <span className="font-medium text-foreground">
                  {isRunning ? 'Running' : 'Paused'}
                </span>

                <span className="text-sm text-foreground-muted">
                  Last active: {agent.lastActive}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <span className="text-foreground-muted">
                  Model: <span className="text-foreground">{agent.model}</span>
                </span>

                <span className="text-foreground-muted">
                  Created: <span className="text-foreground">{agent.createdAt}</span>
                </span>
              </div>
            </div>

            {/* Stats Grid */}

            <div className="page-grid sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: 'Total Conversations',

                  value: agent.stats.totalConversations.toLocaleString(),

                  icon: MessageSquare,

                  change: '+12%',
                },

                {
                  label: 'Total Messages',

                  value: agent.stats.totalMessages.toLocaleString(),

                  icon: Activity,

                  change: '+8%',
                },

                {
                  label: 'Avg Response Time',

                  value: agent.stats.avgResponseTime,

                  icon: Clock,

                  change: '-5%',
                },

                {
                  label: 'Satisfaction',

                  value: `${agent.stats.satisfactionRate}%`,

                  icon: TrendingUp,

                  change: '+2%',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-5 rounded-md bg-surface-100 border border-border"
                >
                  <div className="flex items-center justify-between mb-3">
                    <stat.icon className="w-5 h-5 text-brand-500" />

                    <span
                      className={cn(
                        'text-xs font-medium px-1.5 py-0.5 rounded',

                        stat.change.startsWith('+')
                          ? 'bg-brand-200 text-brand-500'
                          : 'bg-brand-200 text-brand-500'
                      )}
                    >
                      {stat.change}
                    </span>
                  </div>

                  <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>

                  <div className="text-sm text-foreground-muted">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Charts & Test */}

            <div className="page-grid lg:grid-cols-2">
              {/* Performance Chart Placeholder */}

              <div className="p-6 rounded-md bg-surface-100 border border-border">
                <h3 className="font-semibold text-foreground mb-4">Performance Trends</h3>

                <div className="space-y-4">
                  {performanceData.map((data) => (
                    <div key={data.date} className="flex items-center gap-4">
                      <span className="text-sm text-foreground-muted w-12">{data.date}</span>

                      <div className="flex-1 h-6 bg-surface-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full"
                          style={{ width: `${(data.conversations / 80) * 100}%` }}
                        />
                      </div>

                      <span className="text-sm text-foreground w-16 text-right">
                        {data.conversations} times
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Test */}

              <div className="flex flex-col rounded-md bg-surface-100 border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-surface-75">
                  <h3 className="font-semibold text-foreground">Quick Test</h3>
                </div>

                <div className="flex-1 p-4 space-y-3 max-h-[300px] overflow-y-auto">
                  {testMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex gap-3',

                        msg.role === 'user' && 'justify-end'
                      )}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-md bg-brand-200 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-brand-500" />
                        </div>
                      )}

                      <div
                        className={cn(
                          'px-3 py-2 rounded-md text-sm max-w-[80%]',

                          msg.role === 'user'
                            ? 'bg-brand-500 text-background'
                            : 'bg-surface-100 text-foreground'
                        )}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {isTesting && (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-md bg-brand-200 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-brand-500" />
                      </div>

                      <div className="px-3 py-2 rounded-md bg-surface-100 text-sm text-foreground-muted">
                        Thinking...
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      placeholder="Enter a test message..."
                      className="h-9"
                      onKeyDown={(e) => e.key === 'Enter' && sendTestMessage()}
                    />

                    <Button
                      size="sm"
                      onClick={sendTestMessage}
                      disabled={!testInput.trim() || isTesting}
                      className="bg-brand-500 hover:bg-brand-600"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Conversations */}

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Recent Conversations</h3>

                <Button variant="ghost" size="sm" onClick={() => setActiveTab('conversations')}>
                  View all
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </div>

              <div className="space-y-3">
                {mockConversations.slice(0, 4).map((conv) => (
                  <div
                    key={conv.id}
                    className="p-4 rounded-md bg-surface-100 border border-border hover:border-brand-400 transition-supabase cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">{conv.user}</span>

                      <span className="text-xs text-foreground-muted">{conv.time}</span>
                    </div>

                    <p className="text-sm text-foreground-muted line-clamp-1 mb-2">
                      {conv.preview}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-foreground-muted">
                      <span>{conv.messages} messages</span>

                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded',

                          conv.status === 'completed'
                            ? 'bg-brand-200 text-brand-500'
                            : 'bg-warning-200 text-warning'
                        )}
                      >
                        {conv.status === 'completed' ? 'Completed' : 'Escalated'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Conversations Tab */}

        {activeTab === 'conversations' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Conversation History</h2>

              <div className="flex items-center gap-2">
                <Input placeholder="Search conversations..." className="w-64 h-9" />

                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {mockConversations.map((conv) => (
                <div
                  key={conv.id}
                  className="p-5 rounded-md bg-surface-100 border border-border hover:border-brand-400 transition-supabase cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-foreground-muted" />
                      </div>

                      <div>
                        <span className="font-medium text-foreground">{conv.user}</span>

                        <p className="text-sm text-foreground-muted">{conv.preview}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-foreground-muted">{conv.time}</span>

                      <div
                        className={cn(
                          'text-xs px-2 py-0.5 rounded mt-1',

                          conv.status === 'completed'
                            ? 'bg-brand-200 text-brand-500'
                            : 'bg-warning-200 text-warning'
                        )}
                      >
                        {conv.status === 'completed' ? 'Completed' : 'Escalated'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-foreground-muted">
                    <span>{conv.messages} messages</span>

                    <Button variant="ghost" size="sm" className="ml-auto">
                      View Details
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}

        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="p-6 rounded-md bg-surface-100 border border-border">
              <h3 className="font-semibold text-foreground mb-4">Basic Info</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Agent Name
                  </label>

                  <Input value={agent.name} className="h-11" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>

                  <textarea
                    value={agent.description}
                    rows={3}
                    className="w-full px-4 py-3 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-md bg-surface-100 border border-border">
              <h3 className="font-semibold text-foreground mb-4">Model Configuration</h3>

              <div className="page-grid sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">AI Model</label>

                  <select className="w-full h-11 px-4 rounded-md bg-background border border-border text-foreground">
                    <option value="gpt-4">GPT-4</option>

                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>

                    <option value="claude-3">Claude 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Temperature ({agent.config.temperature})
                  </label>

                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    defaultValue={agent.config.temperature}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-md bg-surface-100 border border-border">
              <h3 className="font-semibold text-foreground mb-4">System Prompt</h3>

              <textarea
                value={agent.config.systemPrompt}
                rows={6}
                className="w-full px-4 py-3 rounded-md bg-background border border-border text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline">Cancel</Button>

              <Button className="bg-brand-500 hover:bg-brand-600">Save Changes</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
