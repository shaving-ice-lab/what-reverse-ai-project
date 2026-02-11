/**
 * Mock Data File
 * Used for development, testing, and demos
 */

// ============================================
// Workflow Template Data
// ============================================

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: number
  nodeCount: number
  useCount: number
  tags: string[]
  featured: boolean
  official: boolean
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'wt-1',
    name: 'Automated Email Categorization',
    description:
      'Automatically categorize incoming emails and execute different processing flows based on their type',
    icon: '📧',
    category: 'productivity',
    difficulty: 'beginner',
    estimatedTime: 5,
    nodeCount: 4,
    useCount: 15234,
    tags: ['Email', 'Automation', 'Category'],
    featured: true,
    official: true,
  },
  {
    id: 'wt-2',
    name: 'Social Media Content Publisher',
    description:
      'Schedule and publish content to multiple social media platforms with multi-format support',
    icon: '📱',
    category: 'marketing',
    difficulty: 'intermediate',
    estimatedTime: 10,
    nodeCount: 6,
    useCount: 12456,
    tags: ['Social Media', 'Marketing', 'Auto Publish'],
    featured: true,
    official: true,
  },
  {
    id: 'wt-3',
    name: 'Customer Feedback Sentiment Analysis',
    description:
      'Use AI to analyze customer feedback sentiment and automatically categorize issues',
    icon: '🎯',
    category: 'customer',
    difficulty: 'intermediate',
    estimatedTime: 8,
    nodeCount: 5,
    useCount: 8934,
    tags: ['Customer Service', 'AI', 'Sentiment Analysis'],
    featured: true,
    official: false,
  },
  {
    id: 'wt-4',
    name: 'GitHub Issue Auto-Processor',
    description: 'Automatically label, assign, and reply to GitHub issues',
    icon: '🐙',
    category: 'developer',
    difficulty: 'advanced',
    estimatedTime: 15,
    nodeCount: 8,
    useCount: 7654,
    tags: ['GitHub', 'Development', 'Automation'],
    featured: false,
    official: true,
  },
  {
    id: 'wt-5',
    name: 'Sales Data Report Generator',
    description:
      'Automatically aggregate daily sales data, generate visual reports, and send them via email',
    icon: '📊',
    category: 'data',
    difficulty: 'intermediate',
    estimatedTime: 12,
    nodeCount: 7,
    useCount: 6543,
    tags: ['Data Analytics', 'Report', 'Automation'],
    featured: true,
    official: true,
  },
  {
    id: 'wt-6',
    name: 'New User Welcome Flow',
    description: 'Automatically send welcome emails and onboarding content after new user sign-up',
    icon: '👋',
    category: 'marketing',
    difficulty: 'beginner',
    estimatedTime: 5,
    nodeCount: 3,
    useCount: 5432,
    tags: ['User Guide', 'Email', 'Automation'],
    featured: false,
    official: true,
  },
  {
    id: 'wt-7',
    name: 'Competitor Price Monitor',
    description: 'Periodically monitor competitor prices and automatically alert on price changes',
    icon: '💰',
    category: 'research',
    difficulty: 'advanced',
    estimatedTime: 20,
    nodeCount: 9,
    useCount: 4321,
    tags: ['Competitor Analysis', 'Monitor', 'Alert'],
    featured: false,
    official: false,
  },
  {
    id: 'wt-8',
    name: 'AI Content Review',
    description: 'Use AI to review user-generated content and filter out violations',
    icon: '🛡️',
    category: 'content',
    difficulty: 'intermediate',
    estimatedTime: 10,
    nodeCount: 5,
    useCount: 3987,
    tags: ['Content Review', 'AI', 'Security'],
    featured: true,
    official: true,
  },
]

// ============================================
// Agent Store Data
// ============================================

export interface StoreAgent {
  id: string
  name: string
  description: string
  icon: string
  category: string
  author: {
    name: string
    avatar: string
    verified: boolean
  }
  rating: number
  reviews: number
  downloads: number
  price: number | 'free'
  tags: string[]
  featured: boolean
  capabilities: string[]
  models: string[]
  version: string
  updatedAt: string
}

export const storeAgents: StoreAgent[] = [
  {
    id: 'agent-1',
    name: 'Smart Writing Assistant Pro',
    description:
      'Smart writing assistant powered by the latest AI models. Supports multiple writing styles and can generate articles, copy, reports, and more',
    icon: '✍️',
    category: 'writing',
    author: { name: 'AI Creative Workshop', avatar: '', verified: true },
    rating: 4.9,
    reviews: 2456,
    downloads: 45678,
    price: 'free',
    tags: ['Writing', 'AI', 'Copy', 'Creative'],
    featured: true,
    capabilities: ['Writing', 'Multi-language Support', 'Style Customization', 'SEO Optimization'],
    models: ['GPT-4', 'Claude 3'],
    version: '2.1.0',
    updatedAt: '2026-01-28',
  },
  {
    id: 'agent-2',
    name: 'Data Analytics Suite',
    description:
      'Comprehensive data analytics solution supporting data cleaning, analysis, visualization, and report generation',
    icon: '📊',
    category: 'analytics',
    author: { name: 'DataLab', avatar: '', verified: true },
    rating: 4.8,
    reviews: 1892,
    downloads: 32456,
    price: 29,
    tags: ['Data Analytics', 'Visualization', 'Report', 'BI'],
    featured: true,
    capabilities: ['Data Cleaning', 'Statistical Analysis', 'Chart Generation', 'Trend Prediction'],
    models: ['GPT-4'],
    version: '1.8.5',
    updatedAt: '2026-01-25',
  },
  {
    id: 'agent-3',
    name: 'Code Review Expert',
    description:
      'Automatically review code, detect potential issues, and provide optimization suggestions and best practices',
    icon: '🔍',
    category: 'development',
    author: { name: 'DevTools Pro', avatar: '', verified: true },
    rating: 4.7,
    reviews: 1234,
    downloads: 28765,
    price: 49,
    tags: ['Code Review', 'Best Practices', 'Security', 'Optimization'],
    featured: false,
    capabilities: ['Static Analysis', 'Security Scanning', 'Issue Detection', 'Code Standards'],
    models: ['GPT-4', 'Claude 3'],
    version: '3.0.2',
    updatedAt: '2026-01-20',
  },
  {
    id: 'agent-4',
    name: 'Smart Support Bot',
    description:
      '24/7 smart customer support with multi-turn conversations, intent recognition, and knowledge base Q&A',
    icon: '🤖',
    category: 'customer-service',
    author: { name: 'Service AI', avatar: '', verified: false },
    rating: 4.6,
    reviews: 987,
    downloads: 19876,
    price: 'free',
    tags: ['Support', 'Conversation', 'FAQ', 'Support'],
    featured: true,
    capabilities: [
      'Multi-turn Conversation',
      'Intent Recognition',
      'Sentiment Analysis',
      'Knowledge Base',
    ],
    models: ['GPT-3.5', 'GPT-4'],
    version: '2.5.1',
    updatedAt: '2026-01-22',
  },
  {
    id: 'agent-5',
    name: 'Marketing Copy Generator',
    description:
      'Quickly generate high-conversion marketing copy with multi-platform adaptation and A/B testing support',
    icon: '📢',
    category: 'marketing',
    author: { name: 'Growth Hack', avatar: '', verified: true },
    rating: 4.8,
    reviews: 876,
    downloads: 15432,
    price: 19,
    tags: ['Marketing', 'Copywriting', 'Conversion', 'Advertising'],
    featured: false,
    capabilities: [
      'Multi-platform Adaptation',
      'A/B Testing',
      'Optimization',
      'Audience Analytics',
    ],
    models: ['GPT-4'],
    version: '1.5.0',
    updatedAt: '2026-01-18',
  },
  {
    id: 'agent-6',
    name: 'Translation & Localization Assistant',
    description:
      'Professional translation tool supporting 100+ languages while preserving style and tone',
    icon: '🌍',
    category: 'translation',
    author: { name: 'Lang Bridge', avatar: '', verified: true },
    rating: 4.9,
    reviews: 2134,
    downloads: 38765,
    price: 'free',
    tags: ['Translation', 'Multi-language', 'Localization', 'Internationalization'],
    featured: true,
    capabilities: [
      '100+ Languages',
      'Terminology Management',
      'Style Preservation',
      'Batch Translation',
    ],
    models: ['GPT-4', 'Claude 3'],
    version: '4.2.0',
    updatedAt: '2026-01-30',
  },
]

// ============================================
// Conversation History Data
// ============================================

export interface ConversationItem {
  id: string
  title: string
  preview: string
  model: string
  createdAt: string
  updatedAt: string
  messageCount: number
  starred: boolean
  pinned: boolean
  folder: string | null
  tags: string[]
}

export const conversationHistory: ConversationItem[] = [
  {
    id: 'conv-1',
    title: 'Create Automated Email Workflow',
    preview:
      'Let me help you design this email automation workflow. First, we need to define the trigger conditions...',
    model: 'GPT-4',
    createdAt: '2026-01-31T10:30:00Z',
    updatedAt: 'Just now',
    messageCount: 24,
    starred: true,
    pinned: true,
    folder: 'Workflow Design',
    tags: ['Automation', 'Email'],
  },
  {
    id: 'conv-2',
    title: 'Analyze Sales Data and Generate Report',
    preview:
      "Based on the data you provided, I've completed the analysis. Here are the key findings: 1) Sales have grown...",
    model: 'GPT-4',
    createdAt: '2026-01-30T15:20:00Z',
    updatedAt: '2h ago',
    messageCount: 18,
    starred: true,
    pinned: false,
    folder: 'Data Analytics',
    tags: ['Data', 'Report'],
  },
  {
    id: 'conv-3',
    title: 'Optimize React Component Performance',
    preview:
      'Let me analyze the potential issues with this component. The main findings and optimization suggestions are...',
    model: 'Claude 3',
    createdAt: '2026-01-30T09:15:00Z',
    updatedAt: '5h ago',
    messageCount: 32,
    starred: false,
    pinned: false,
    folder: 'Code Development',
    tags: ['React', 'Optimization'],
  },
  {
    id: 'conv-4',
    title: 'Write Product Launch Announcement',
    preview:
      "Here is the product launch announcement draft I've written for you, highlighting key features and user value...",
    model: 'GPT-4',
    createdAt: '2026-01-29T14:00:00Z',
    updatedAt: 'Yesterday',
    messageCount: 12,
    starred: false,
    pinned: false,
    folder: 'Content Creative',
    tags: ['Marketing', 'Copy'],
  },
  {
    id: 'conv-5',
    title: 'Design Database Architecture',
    preview:
      'Based on your requirements, I suggest using the following database architecture design. Key considerations include scalability and query performance...',
    model: 'GPT-4',
    createdAt: '2026-01-28T11:30:00Z',
    updatedAt: '2 days ago',
    messageCount: 28,
    starred: false,
    pinned: false,
    folder: 'Technology Design',
    tags: ['Database', 'Architecture'],
  },
]

// ============================================
// User Activity Data
// ============================================

export interface ActivityItem {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  timeAgo: string
  status: 'success' | 'error' | 'warning' | 'pending'
  metadata?: Record<string, string | number>
}

export const recentActivities: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'workflow_executed',
    title: 'Executed Workflow: Customer Feedback Auto-Processor',
    description: 'Workflow executed successfully, processed 15 feedback items',
    timestamp: '2026-01-31T10:30:00Z',
    timeAgo: '5 min ago',
    status: 'success',
    metadata: { duration: '12s', records: 15 },
  },
  {
    id: 'act-2',
    type: 'conversation_started',
    title: 'Started New Conversation',
    description: 'Started a new conversation using the GPT-4 model',
    timestamp: '2026-01-31T10:15:00Z',
    timeAgo: '20 min ago',
    status: 'success',
    metadata: { model: 'GPT-4', messages: 8 },
  },
  {
    id: 'act-3',
    type: 'workflow_created',
    title: 'Create Workflow: Email Auto-Categorization',
    description: 'Created a new automation workflow',
    timestamp: '2026-01-31T09:45:00Z',
    timeAgo: '50 min ago',
    status: 'success',
    metadata: { nodes: 6, triggers: 1 },
  },
  {
    id: 'act-4',
    type: 'workflow_executed',
    title: 'Executed Workflow: Data Sync',
    description: 'Workflow execution failed: API connection timeout',
    timestamp: '2026-01-31T09:30:00Z',
    timeAgo: '1h ago',
    status: 'error',
    metadata: { error: 'Connection timeout' },
  },
  {
    id: 'act-5',
    type: 'agent_created',
    title: 'Create Agent: Writing Assistant',
    description: 'Created a new AI agent',
    timestamp: '2026-01-31T09:00:00Z',
    timeAgo: '1.5h ago',
    status: 'success',
    metadata: { model: 'GPT-4', capabilities: 3 },
  },
]

// ============================================
// Statistics Data
// ============================================

export interface DashboardStats {
  totalConversations: number
  totalWorkflows: number
  totalAgents: number
  totalFiles: number
  apiCalls: number
  tokensUsed: number
  activeWorkflows: number
  successRate: number
}

export const dashboardStats: DashboardStats = {
  totalConversations: 156,
  totalWorkflows: 24,
  totalAgents: 8,
  totalFiles: 45,
  apiCalls: 156800,
  tokensUsed: 2800000,
  activeWorkflows: 12,
  successRate: 98.5,
}

// ============================================
// Quick Actions Data
// ============================================

export interface QuickAction {
  id: string
  title: string
  description: string
  icon: string
  href: string
  shortcut?: string
  category: string
}

export const quickActions: QuickAction[] = [
  {
    id: 'qa-1',
    title: 'Talk to Agent',
    description: 'Start an AI agent conversation',
    icon: 'MessageSquare',
    href: '/dashboard/agent',
    shortcut: '⌘ N',
    category: 'Create',
  },
  {
    id: 'qa-2',
    title: 'Create Workflow',
    description: 'Create an automation workflow',
    icon: 'Zap',
    href: '/dashboard/workflows/new',
    shortcut: '⌘ W',
    category: 'Create',
  },
  {
    id: 'qa-3',
    title: 'New App',
    description: 'Create a new workspace app',
    icon: 'LayoutGrid',
    href: '/dashboard/apps',
    category: 'Create',
  },
  {
    id: 'qa-4',
    title: 'Upload File',
    description: 'Upload files to the knowledge base',
    icon: 'Upload',
    href: '/dashboard/files',
    category: 'Manage',
  },
  {
    id: 'qa-5',
    title: 'Template Gallery',
    description: 'Browse workflow templates',
    icon: 'LayoutGrid',
    href: '/dashboard/workflows',
    category: 'Browse',
  },
  {
    id: 'qa-6',
    title: 'Settings',
    description: 'Manage account settings',
    icon: 'Settings',
    href: '/dashboard/settings',
    shortcut: '⌘ ,',
    category: 'Settings',
  },
]

// ============================================
// Help/FAQ Data
// ============================================

export interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  helpful: number
}

export const faqItems: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How do I create my first workflow?',
    answer:
      "You can create a workflow with these steps: 1) Go to the Workflows page, 2) Click the Create Workflow button, 3) Drag and drop nodes to build the flow in the editor, 4) Configure each node's parameters, 5) Save and test the workflow.",
    category: 'Getting Started',
    helpful: 234,
  },
  {
    id: 'faq-2',
    question: 'What is the difference between an Agent and a Workflow?',
    answer:
      'An Agent is a smart AI assistant that can understand natural language and make decisions to execute tasks. A Workflow is a defined automation flow that executes in fixed steps. Agents are more flexible, while Workflows are more predictable.',
    category: 'Features',
    helpful: 189,
  },
  {
    id: 'faq-3',
    question: 'How do I configure an API key?',
    answer:
      'Go to Settings → API Keys page, click Add Key, select the service provider (e.g., OpenAI, Claude), enter your API key, and save to start using it.',
    category: 'Config',
    helpful: 156,
  },
  {
    id: 'faq-4',
    question: 'What are the file upload limits?',
    answer:
      'Free users can upload files up to 10MB with 1GB total storage. Pro users can upload files up to 50MB with 10GB total storage. Supported formats include PDF, Word, Excel, images, code files, and more.',
    category: 'Limits & Quotas',
    helpful: 145,
  },
  {
    id: 'faq-5',
    question: 'How do I add files to a knowledge base?',
    answer:
      'Select a file in the Files section, click Add to Knowledge Base, select the target knowledge base or create a new one. The system will automatically parse the document and create vector indexes.',
    category: 'Features',
    helpful: 132,
  },
]

// ============================================
// AI Regression Tests
// ============================================

export type RegressionCaseStatus = 'pass' | 'fail' | 'needs_review' | 'flaky'

export interface RegressionTestCase {
  id: string
  title: string
  prompt: string
  expected: string
  rubric: string
  tags: string[]
  status: RegressionCaseStatus
  lastRunAt: string
  owner: string
  score: number
}

export const regressionTestCases: RegressionTestCase[] = [
  {
    id: 'rt-1',
    title: 'Support Ticket Summary',
    prompt: 'Please summarize the ticket content into 3 key points and assign a priority.',
    expected: 'Contains issue description, impact scope, and resolution suggestions.',
    rubric: 'Key point coverage ≥ 90%, no sensitive information in output.',
    tags: ['Summary', 'Support', 'Structure'],
    status: 'pass',
    lastRunAt: '2026-02-01T09:12:00Z',
    owner: 'Team',
    score: 94,
  },
  {
    id: 'rt-2',
    title: 'Marketing Copy A/B',
    prompt: 'Generate an email subject line for enterprise procurement outreach.',
    expected: 'Professional tone, contains value proposition, easy to read.',
    rubric: 'Readability ≥ 90, keywords ≥ 2.',
    tags: ['Marketing', 'Copy', 'Title'],
    status: 'needs_review',
    lastRunAt: '2026-02-01T08:40:00Z',
    owner: 'Growth Team',
    score: 86,
  },
  {
    id: 'rt-3',
    title: 'Financial Data Interpretation',
    prompt:
      'Explain the comparative growth reasons from the table, providing at least 2 verifiable facts.',
    expected: 'Uses table data, avoids unsupported claims.',
    rubric: 'Factual accuracy ≥ 88%, references table fields.',
    tags: ['Data', 'Analytics', 'Fact1'],
    status: 'fail',
    lastRunAt: '2026-01-31T16:05:00Z',
    owner: 'Analytics Team',
    score: 72,
  },
  {
    id: 'rt-4',
    title: 'Compliance Risk Alert',
    prompt: 'Identify compliance risks in the conversation and suggest alternatives.',
    expected: 'Output risk assessment and alternatives.',
    rubric: 'Risk identification coverage ≥ 95%, alternatives must not violate policies.',
    tags: ['Compliance', 'Security', 'Risk Control'],
    status: 'pass',
    lastRunAt: '2026-01-31T14:22:00Z',
    owner: 'Security Team',
    score: 97,
  },
  {
    id: 'rt-5',
    title: 'Multi-language Translation Consistency',
    prompt:
      'Translate the product feature descriptions to Japanese while maintaining terminology consistency.',
    expected: 'Key terms are consistent, tone is natural.',
    rubric: 'Terminology consistency ≥ 92%, style consistency score met.',
    tags: ['Translate', 'Local', 'Term'],
    status: 'flaky',
    lastRunAt: '2026-01-31T12:18:00Z',
    owner: 'International Team',
    score: 88,
  },
  {
    id: 'rt-6',
    title: 'Knowledge Base Q&A',
    prompt: 'Answer pricing questions based on the knowledge base and cite source paragraphs.',
    expected: 'Answers are concise, with citations and factual consistency.',
    rubric: 'Citation accuracy ≥ 95%, conciseness ≥ 85%.',
    tags: ['Knowledge Base', 'use', 'Q&A'],
    status: 'pass',
    lastRunAt: '2026-01-31T10:02:00Z',
    owner: 'Content Team',
    score: 92,
  },
]

// ============================================
// Review Sampling Policy
// ============================================

export type ReviewSamplingPriority = 'high' | 'medium' | 'low'
export type ReviewSamplingStatus = 'active' | 'paused'

export interface ReviewSamplingRule {
  id: string
  scenario: string
  trigger: string
  sampleRate: number
  priority: ReviewSamplingPriority
  status: ReviewSamplingStatus
  slaHours: number
  reviewers: string[]
  notes?: string
}

export interface ReviewSamplingCoverage {
  id: string
  label: string
  rate: number
  goal: string
}

export interface ReviewSamplingStrategy {
  baseRate: number
  dailyMin: number
  dailyMax: number
  escalationThreshold: number
  confidenceGate: number
  lastUpdated: string
  owner: string
  reviewers: string[]
  triggers: Array<{ id: string; label: string; description: string }>
  coverage: ReviewSamplingCoverage[]
  rules: ReviewSamplingRule[]
  checklist: Array<{ id: string; label: string; required: boolean }>
}

export const reviewSamplingStrategy: ReviewSamplingStrategy = {
  baseRate: 0.08,
  dailyMin: 40,
  dailyMax: 260,
  escalationThreshold: 0.85,
  confidenceGate: 0.9,
  lastUpdated: '2026-02-01T11:20:00Z',
  owner: 'AI Owner',
  reviewers: ['QA Team', 'Domain Expert', 'Compliance Reviewer'],
  triggers: [
    {
      id: 't-1',
      label: 'Low Confidence Output',
      description: 'Model confidence < 0.90 automatically triggers review',
    },
    {
      id: 't-2',
      label: 'High-Impact Scenario',
      description:
        'Finance, legal, healthcare, and other high-risk domains require mandatory review',
    },
    {
      id: 't-3',
      label: 'New Model Version',
      description: 'Increased review sampling for 7 days after new model deployment',
    },
    {
      id: 't-4',
      label: 'User-Triggered Review',
      description: '3 consecutive negative feedback events triggers review',
    },
  ],
  coverage: [
    { id: 'c-1', label: 'Knowledge Base Q&A', rate: 0.12, goal: 'Citation accuracy ≥ 95%' },
    { id: 'c-2', label: 'Marketing Copy', rate: 0.1, goal: 'Readability ≥ 90' },
    { id: 'c-3', label: 'Data Analytics', rate: 0.15, goal: 'Factual accuracy ≥ 88%' },
    { id: 'c-4', label: 'Support Summary', rate: 0.08, goal: 'Structural completeness ≥ 90%' },
  ],
  rules: [
    {
      id: 'r-1',
      scenario: 'High-Risk Content',
      trigger: 'Sensitive industry / compliance keywords',
      sampleRate: 0.35,
      priority: 'high',
      status: 'active',
      slaHours: 12,
      reviewers: ['Compliance Reviewer', 'QA Team'],
      notes: 'Mandatory review',
    },
    {
      id: 'r-2',
      scenario: 'New Model Canary',
      trigger: 'Model version < 7 days old',
      sampleRate: 0.2,
      priority: 'high',
      status: 'active',
      slaHours: 24,
      reviewers: ['QA Team'],
    },
    {
      id: 'r-3',
      scenario: 'Low Confidence Output',
      trigger: 'Confidence < 0.90',
      sampleRate: 0.18,
      priority: 'medium',
      status: 'active',
      slaHours: 24,
      reviewers: ['QA Team'],
    },
    {
      id: 'r-4',
      scenario: 'High-Cost Request',
      trigger: 'Per-request cost > ¥2.0',
      sampleRate: 0.12,
      priority: 'medium',
      status: 'active',
      slaHours: 36,
      reviewers: ['Cost Optimization Team'],
    },
    {
      id: 'r-5',
      scenario: 'Scenario Regression',
      trigger: 'Fewer than 20 calls in 7 days',
      sampleRate: 0.08,
      priority: 'low',
      status: 'paused',
      slaHours: 48,
      reviewers: ['QA Team'],
      notes: 'Will resume after current review cycle ends',
    },
  ],
  checklist: [
    { id: 'q-1', label: 'Does the output follow the scenario requirements?', required: true },
    { id: 'q-2', label: 'Are facts and references accurate?', required: true },
    { id: 'q-3', label: 'Does it contain sensitive or violating content?', required: true },
    { id: 'q-4', label: 'Is the format and language clear?', required: false },
    { id: 'q-5', label: 'Are the suggestions actionable?', required: false },
  ],
}

// ============================================
// Example App Catalog
// ============================================

export type SampleAppComplexity = 'beginner' | 'intermediate' | 'advanced'

export interface SampleApp {
  id: string
  name: string
  description: string
  icon: string
  category: string
  scenario: string
  complexity: SampleAppComplexity
  tags: string[]
  updatedAt: string
  href: string
}

export const sampleApps: SampleApp[] = [
  {
    id: 'sa-1',
    name: 'Smart Support Connector',
    description:
      'Process multi-channel inquiries, automatically identify intent and generate structured replies.',
    icon: '🎧',
    category: 'Customer Service',
    scenario: 'Consulting · Multi-turn Conversation',
    complexity: 'beginner',
    tags: ['Intent Recognition', 'FAQ', 'Multi-turn Conversation'],
    updatedAt: '2026-01-30T09:30:00Z',
    href: '/dashboard/workflows',
  },
  {
    id: 'sa-2',
    name: 'Sales Quote Assistant',
    description:
      'Automatically generate quotes and delivery plans based on requirements, with multi-version comparison support.',
    icon: '💼',
    category: 'Sales Operations',
    scenario: 'Pre-sales Support · Quote Generation',
    complexity: 'intermediate',
    tags: ['Quote', 'Plan Generation', 'Comparison'],
    updatedAt: '2026-01-28T14:10:00Z',
    href: '/dashboard/workflows',
  },
  {
    id: 'sa-3',
    name: 'Market Intelligence Workshop',
    description:
      'Aggregate trend data and insights to generate one-click market intelligence reports.',
    icon: '📰',
    category: 'Market Research',
    scenario: 'Trend Tracking · Report Generation',
    complexity: 'intermediate',
    tags: ['Trends', 'Insights', 'Visualization'],
    updatedAt: '2026-01-27T16:45:00Z',
    href: '/dashboard/workflows',
  },
  {
    id: 'sa-4',
    name: 'Compliance Checker',
    description:
      'Identify risks in documents and provide editing suggestions with a review summary.',
    icon: '🧾',
    category: 'Compliance',
    scenario: 'Risk Identification · Compliance Review',
    complexity: 'advanced',
    tags: ['Compliance', 'Risk', 'Review'],
    updatedAt: '2026-01-26T11:20:00Z',
    href: '/dashboard/workflows',
  },
  {
    id: 'sa-5',
    name: 'Knowledge Base Q&A',
    description:
      'Provide cited answers based on enterprise knowledge base with multi-source aggregation.',
    icon: '📚',
    category: 'Operations',
    scenario: 'Q&A · Citation Validation',
    complexity: 'beginner',
    tags: ['Knowledge Base', 'Citations', 'Search Enhanced'],
    updatedAt: '2026-01-25T10:00:00Z',
    href: '/dashboard/workflows',
  },
  {
    id: 'sa-6',
    name: 'Daily Operations Report Generator',
    description:
      'Automatically pull business metrics and generate ready-to-send daily operations report templates.',
    icon: '📈',
    category: 'Operations Analytics',
    scenario: 'Daily Report · Business Metrics',
    complexity: 'beginner',
    tags: ['Daily Report', 'Metrics', 'Automation'],
    updatedAt: '2026-01-24T08:25:00Z',
    href: '/dashboard/workflows',
  },
]

// ============================================
// Demo Data and Scaffolds
// ============================================

export type DemoDataFormat = 'csv' | 'json' | 'parquet'

export interface DemoDataPack {
  id: string
  name: string
  description: string
  format: DemoDataFormat
  records: number
  fields: number
  size: string
  tags: string[]
  updatedAt: string
}

export const demoDataPacks: DemoDataPack[] = [
  {
    id: 'dd-1',
    name: 'Support Ticket Dataset',
    description:
      'Multi-channel support conversations and ticket tags, suitable for demoing intent recognition and auto-summarization.',
    format: 'json',
    records: 4200,
    fields: 18,
    size: '12.4MB',
    tags: ['Support', 'Intent Recognition', 'Summary'],
    updatedAt: '2026-02-01T08:30:00Z',
  },
  {
    id: 'dd-2',
    name: 'Marketing Outreach Dataset',
    description:
      'Contains channel, user behavior, and campaign results data for demo attribution analytics.',
    format: 'csv',
    records: 12800,
    fields: 22,
    size: '18.1MB',
    tags: ['Marketing', 'Campaigns', 'Attribution'],
    updatedAt: '2026-01-30T15:45:00Z',
  },
  {
    id: 'dd-3',
    name: 'Knowledge Base Q&A Pairs',
    description:
      'Enterprise knowledge base fragments and Q&A pairs for demoing cited answers and search.',
    format: 'parquet',
    records: 7600,
    fields: 12,
    size: '9.7MB',
    tags: ['Knowledge Base', 'Citations', 'Search'],
    updatedAt: '2026-01-29T11:05:00Z',
  },
]

export interface DemoScaffoldTemplate {
  id: string
  name: string
  description: string
  language: string
  entry: string
  code: string
  tags: string[]
  updatedAt: string
}

export const demoScaffoldTemplates: DemoScaffoldTemplate[] = [
  {
    id: 'ds-1',
    name: 'Support Workflow',
    description:
      'Auto-generate summaries, risk assessments, and follow-up suggestions from support tickets.',
    language: 'json',
    entry: 'workflow.customer-qa.json',
    code: `{
 "name": "Support Workflow",
 "nodes": [
 {
 "type": "input",
 "id": "ticket",
 "config": { "schema": "support_ticket" }
 },
 {
 "type": "llm",
 "id": "summary",
 "config": { "model": "gpt-4", "prompt": "Generate 3 key points and risk tips" }
 },
 {
 "type": "rule",
 "id": "risk_gate",
 "config": { "threshold": 0.85 }
 },
 {
 "type": "output",
 "id": "qa_report",
 "config": { "format": "markdown" }
 }
 ]
}`,
    tags: ['Support', 'Summary', 'Risk'],
    updatedAt: '2026-02-01T09:40:00Z',
  },
  {
    id: 'ds-2',
    name: 'Market Report Generator',
    description:
      'Auto-generate trend insights and actionable suggestions from marketing outreach data.',
    language: 'json',
    entry: 'workflow.market-brief.json',
    code: `{
 "name": "Market Report Generator",
 "nodes": [
 { "type": "dataset", "id": "campaigns", "config": { "source": "marketing_pack" } },
 { "type": "transform", "id": "metrics", "config": { "operation": "aggregate" } },
 { "type": "llm", "id": "insights", "config": { "model": "gpt-4", "prompt": "Generate top 5 insights" } },
 { "type": "output", "id": "brief", "config": { "format": "slide" } }
 ]
}`,
    tags: ['Marketing', 'Insights', 'Report'],
    updatedAt: '2026-01-31T16:10:00Z',
  },
  {
    id: 'ds-3',
    name: 'Knowledge Base Q&A Scaffold',
    description: 'Citation search and retrieval scaffold, suitable for demoing accurate Q&A.',
    language: 'json',
    entry: 'workflow.kb-qa.json',
    code: `{
 "name": "Knowledge Base Q&A Scaffold",
 "nodes": [
 { "type": "retrieval", "id": "kb", "config": { "top_k": 5 } },
 { "type": "llm", "id": "answer", "config": { "model": "claude-3", "prompt": "Answer using source citations" } },
 { "type": "rule", "id": "confidence", "config": { "min": 0.9 } },
 { "type": "output", "id": "final", "config": { "format": "json" } }
 ]
}`,
    tags: ['Knowledge Base', 'Citations', 'Retrieval'],
    updatedAt: '2026-01-30T10:25:00Z',
  },
]

// ============================================
// Demo Flow Script
// ============================================

export interface DemoFlowLink {
  label: string
  href: string
}

export interface DemoFlowStep {
  id: string
  title: string
  duration: string
  owner: string
  goal: string
  actions: string[]
  deliverable: string
  links: DemoFlowLink[]
}

export interface DemoFlowScript {
  title: string
  description: string
  totalDuration: string
  audience: string[]
  notes: string[]
  steps: DemoFlowStep[]
}

export const demoFlowScript: DemoFlowScript = {
  title: 'Standard Demo Flow (30 min)',
  description: 'Product demo presentation for business and technical audiences, ready to use.',
  totalDuration: '30 min',
  audience: ['Business Owner', 'Technology Owner', 'Operations Team'],
  notes: ['Confirm demo data is loaded before starting', 'Review metrics and iteration paths'],
  steps: [
    {
      id: 'step-1',
      title: 'Scenario and Target Confirmation',
      duration: '3 min',
      owner: 'Product Consultant',
      goal: 'Clarify demo scenario and evaluation targets',
      actions: ['Select example app', 'Confirm business case', 'Define acceptance metrics'],
      deliverable: 'Scenario confirmation checklist',
      links: [{ label: 'Example App', href: '/dashboard/apps' }],
    },
    {
      id: 'step-2',
      title: 'Load Data and Scaffold',
      duration: '5 min',
      owner: 'Solutions Architect',
      goal: 'Quickly build a runnable demo flow',
      actions: ['Select dataset', 'Load scaffold template', 'Verify node configuration'],
      deliverable: 'A ready-to-run demo workflow',
      links: [
        { label: 'Demo Kit', href: '/dashboard/apps' },
        { label: 'Template Gallery', href: '/dashboard/workflows' },
      ],
    },
    {
      id: 'step-3',
      title: 'Run and Showcase Results',
      duration: '7 min',
      owner: 'Solutions Architect',
      goal: 'Showcase end-to-end output results',
      actions: ['Trigger execution', 'Showcase output results', 'Describe business value'],
      deliverable: 'Demo result samples',
      links: [{ label: 'Run Monitor', href: '/dashboard/app/demo/monitoring' }],
    },
    {
      id: 'step-4',
      title: 'Quality Assurance and Regression',
      duration: '6 min',
      owner: 'QA Owner',
      goal: 'Describe capabilities and review mechanisms',
      actions: [
        'Showcase regression test cases',
        'Explain style policies',
        'Describe risk controls',
      ],
      deliverable: 'Quality assurance overview',
      links: [{ label: 'Monitor', href: '/dashboard/app/demo/monitoring' }],
    },
    {
      id: 'step-5',
      title: 'Cost and Iteration Path',
      duration: '5 min',
      owner: 'Product Consultant',
      goal: 'Clarify delivery path and cost estimates',
      actions: ['Present cost structure', 'Describe release cadence', 'Confirm next steps'],
      deliverable: 'Demo follow-up plan',
      links: [{ label: 'Usage Analytics', href: '/dashboard/analytics' }],
    },
    {
      id: 'step-6',
      title: 'Q&A and Wrap-up',
      duration: '4 min',
      owner: 'All',
      goal: 'Collect feedback and confirm next steps',
      actions: ['Answer questions', 'Record requirements', 'Confirm owners'],
      deliverable: 'Action items list',
      links: [{ label: 'Feedback Center', href: '/dashboard/feedback' }],
    },
  ],
}

// ============================================
// Release Cadence and Windows
// ============================================

export type ReleaseWindowType = 'feature' | 'maintenance' | 'hotfix'
export type ReleaseWindowStatus = 'open' | 'restricted'

export interface ReleaseWindow {
  id: string
  label: string
  type: ReleaseWindowType
  cadence: string
  timeRange: string
  scope: string
  gate: string
  owner: string
  status: ReleaseWindowStatus
}

export interface ReleaseFreezeWindow {
  id: string
  label: string
  rule: string
  notes: string
}

export interface ReleaseChannel {
  id: string
  label: string
  rollout: number
  duration: string
  guardrail: string
}

export interface ReleaseCadencePlan {
  title: string
  timezone: string
  owner: string
  description: string
  regularWindows: ReleaseWindow[]
  freezeWindows: ReleaseFreezeWindow[]
  channels: ReleaseChannel[]
  hotfixPolicy: {
    window: string
    approval: string
    rollback: string
    comms: string
  }
  checklist: string[]
}

export const releaseCadencePlan: ReleaseCadencePlan = {
  title: 'Release Cadence and Windows',
  timezone: 'Asia/Shanghai (UTC+8)',
  owner: 'Release Manager',
  description: 'Maintain a stable release cadence. Ensure rollback capability and traceability.',
  regularWindows: [
    {
      id: 'rw-1',
      label: 'Standard Release',
      type: 'feature',
      cadence: 'Tuesday / Thursday weekly',
      timeRange: '10:00 - 12:00',
      scope: 'Web / API / Runtime',
      gate: 'Regression tests passed + Monitoring OK',
      owner: 'Platform Team',
      status: 'open',
    },
    {
      id: 'rw-2',
      label: 'Canary Release',
      type: 'feature',
      cadence: 'Wednesday weekly',
      timeRange: '14:00 - 16:00',
      scope: 'New feature canary',
      gate: 'Canary metrics meet targets',
      owner: 'Product Owner',
      status: 'open',
    },
    {
      id: 'rw-3',
      label: 'Maintenance Window',
      type: 'maintenance',
      cadence: 'Daily',
      timeRange: '22:00 - 23:00',
      scope: 'DB / Infra / Task',
      gate: 'Non-breaking / rollback capable',
      owner: 'SRE',
      status: 'restricted',
    },
  ],
  freezeWindows: [
    {
      id: 'fw-1',
      label: 'End-of-Month Freeze',
      rule: 'Last 2 business days of each month',
      notes: 'Only P0/P1 fixes allowed',
    },
    {
      id: 'fw-2',
      label: 'Major Event Freeze',
      rule: '24 hours before major events',
      notes: 'Close standard release',
    },
  ],
  channels: [
    {
      id: 'rc-1',
      label: 'Canary 5%',
      rollout: 5,
      duration: '2 h',
      guardrail: 'Error rate < 0.5%',
    },
    {
      id: 'rc-2',
      label: 'Beta 20%',
      rollout: 20,
      duration: '6 h',
      guardrail: 'P95 < 2s',
    },
    {
      id: 'rc-3',
      label: 'Stable 100%',
      rollout: 100,
      duration: '24 h',
      guardrail: 'All alert thresholds passed',
    },
  ],
  hotfixPolicy: {
    window: 'Anytime (requires approval)',
    approval: 'Tech Lead + Security Review',
    rollback: 'Can rollback within 15 min',
    comms: 'Notify stakeholders within 2 hours',
  },
  checklist: [
    'Version number updated and changelog recorded',
    'All regression tests passed',
    'Monitoring and alert thresholds confirmed',
    'Healthy for 30 min after release',
  ],
}

// ============================================
// Release Notes Template
// ============================================

export interface ReleaseNoteSection {
  title: string
  items: string[]
}

export interface ReleaseNoteTemplate {
  version: string
  date: string
  title: string
  summary: string
  highlights: string[]
  sections: ReleaseNoteSection[]
  impact: {
    downtime: string
    affected: string
    migration: string
  }
  rollback: string
  links: Array<{ label: string; href: string }>
  acknowledgements: string[]
}

export const releaseNoteTemplate: ReleaseNoteTemplate = {
  version: 'v3.27.0',
  date: '2026-02-02',
  title: 'Release and Management Enhancements',
  summary:
    'Added regression panel, release cadence and demo scaffolds to improve demo and testing capabilities.',
  highlights: [
    'Added regression test and review policy panel',
    'Release cadence and window policy visualization',
    'Provided demo data and scaffold templates',
  ],
  sections: [
    {
      title: 'Added',
      items: [
        'Workbench now includes Demo Kit and demo flow scripts',
        'Evaluation page now supports regression test cases and review policies',
        'Plugin manifest SemVer validation',
      ],
    },
    {
      title: 'Improved',
      items: [
        'Version numbering standardized to SemVer with release version support',
        'Demo data structure optimized with multi-format support',
      ],
    },
    {
      title: 'Fix',
      items: ['Fix missing link issue in demo flow'],
    },
  ],
  impact: {
    downtime: 'None planned',
    affected: 'Web Console / Plugin Validation',
    migration: 'No migration required',
  },
  rollback:
    'If a P1 alert occurs within 30 minutes after release, roll back to the previous stable version.',
  links: [
    { label: 'Release Notes', href: '/whats-new' },
    { label: 'Status Page', href: '/status' },
    { label: 'Feedback Center', href: '/dashboard/feedback' },
  ],
  acknowledgements: ['Platform Team', 'QA Team', 'SRE'],
}

// ============================================
// Container Image Standards
// ============================================

export interface ContainerImageSpec {
  id: string
  service: string
  repository: string
  runtime: string
  tagPolicy: string
  rollback: string
  healthCheck: string
}

export interface ContainerizationSpec {
  registry: string
  tagFormat: string
  latestTag: string
  retention: string
  rollbackPolicy: string
  scanPolicy: string
  signingPolicy: string
  lastUpdated: string
  buildPipeline: string[]
  images: ContainerImageSpec[]
}

export const containerizationSpec: ContainerizationSpec = {
  registry: 'registry.agentflow.ai',
  tagFormat: 'agentflow/{service}:v{semver}-{shortSha}',
  latestTag: 'agentflow/{service}:stable',
  retention: 'Retain last 10 tags (stable versions retain last 3)',
  rollbackPolicy: 'Can rollback to previous stable version within 30 min',
  scanPolicy: 'Run vulnerability scan before image push',
  signingPolicy: 'Production images must be signed and include SBOM',
  lastUpdated: '2026-02-02T10:20:00Z',
  buildPipeline: [
    'Multi-stage build (build/runtime separation)',
    'Use buildx with layer caching',
    'Generate SBOM and sign image',
    'Push to registry and sync tags',
  ],
  images: [
    {
      id: 'img-web',
      service: 'web',
      repository: 'agentflow/web',
      runtime: 'node18-alpine',
      tagPolicy: 'v{semver}-{shortSha}',
      rollback: 'Retain last 3 stable tags',
      healthCheck: '/healthz',
    },
    {
      id: 'img-api',
      service: 'api',
      repository: 'agentflow/api',
      runtime: 'go1.22-alpine',
      tagPolicy: 'v{semver}-{shortSha}',
      rollback: 'Retain last 5 tags',
      healthCheck: '/healthz',
    },
    {
      id: 'img-runtime',
      service: 'runtime',
      repository: 'agentflow/runtime',
      runtime: 'go1.22-alpine',
      tagPolicy: 'v{semver}-{shortSha}',
      rollback: 'Retain last 5 tags',
      healthCheck: '/healthz',
    },
    {
      id: 'img-db',
      service: 'db-provisioner',
      repository: 'agentflow/db-provisioner',
      runtime: 'go1.22-alpine',
      tagPolicy: 'v{semver}-{shortSha}',
      rollback: 'Retain last 3 stable tags',
      healthCheck: '/healthz',
    },
    {
      id: 'img-domain',
      service: 'domain-service',
      repository: 'agentflow/domain-service',
      runtime: 'go1.22-alpine',
      tagPolicy: 'v{semver}-{shortSha}',
      rollback: 'Retain last 3 stable tags',
      healthCheck: '/healthz',
    },
  ],
}

// ============================================
// Environment Isolation and Naming Standards
// ============================================

export interface EnvironmentScope {
  id: string
  label: string
  env: 'dev' | 'staging' | 'prod'
  purpose: string
  access: string
  namespace: string
  domainPattern: string
  dataRetention: string
  configPrefix: string
  secretPrefix: string
}

export interface EnvironmentNamingRule {
  id: string
  resource: string
  pattern: string
  example: string
  notes: string
}

export interface EnvironmentNamingSpec {
  title: string
  description: string
  lastUpdated: string
  namingPattern: string
  environments: EnvironmentScope[]
  resourceRules: EnvironmentNamingRule[]
  guardrails: string[]
}

export const environmentNamingSpec: EnvironmentNamingSpec = {
  title: 'Environment Isolation and Naming Standards',
  description: 'Naming conventions and isolation boundaries for dev / staging / prod environments.',
  lastUpdated: '2026-02-02T11:40:00Z',
  namingPattern: 'af-{workspace}-{env}-{service}',
  environments: [
    {
      id: 'env-dev',
      label: 'Development',
      env: 'dev',
      purpose: 'Feature development and integration testing',
      access: 'Internal',
      namespace: 'af-{workspace}-dev',
      domainPattern: '{app}.dev.agentflow.ai',
      dataRetention: '7 days',
      configPrefix: 'DEV_',
      secretPrefix: 'AF_DEV_{SERVICE}_',
    },
    {
      id: 'env-staging',
      label: 'Staging',
      env: 'staging',
      purpose: 'Canary verification and acceptance',
      access: 'Internal + QA',
      namespace: 'af-{workspace}-stg',
      domainPattern: '{app}.staging.agentflow.ai',
      dataRetention: '14 days',
      configPrefix: 'STG_',
      secretPrefix: 'AF_STG_{SERVICE}_',
    },
    {
      id: 'env-prod',
      label: 'Production',
      env: 'prod',
      purpose: 'Live production service',
      access: 'Strict',
      namespace: 'af-{workspace}-prod',
      domainPattern: '{app}.agentflow.ai',
      dataRetention: '30 days',
      configPrefix: 'PROD_',
      secretPrefix: 'AF_PROD_{SERVICE}_',
    },
  ],
  resourceRules: [
    {
      id: 'rule-db',
      resource: 'Database',
      pattern: 'af_{env}_{app}',
      example: 'af_prod_checkout',
      notes: 'Environments must not share instances',
    },
    {
      id: 'rule-bucket',
      resource: 'Object Storage',
      pattern: 'af-{env}-{workspace}-{bucket}',
      example: 'af-prod-acme-assets',
      notes: 'Buckets must have versioning enabled',
    },
    {
      id: 'rule-secret',
      resource: 'Secret',
      pattern: 'AF_{ENV}_{SERVICE}_{KEY}',
      example: 'AF_PROD_API_OPENAI',
      notes: 'Keys must be independently rotated per environment',
    },
  ],
  guardrails: [
    'Environments must not share databases or keys',
    'Staging and prod must have independent monitoring and alerts',
    'All environments must enable audit logging',
  ],
}

// ============================================
// Deployment Pipeline and Canary Policy
// ============================================

export interface DeploymentPipelineStage {
  id: string
  name: string
  owner: string
  duration: string
  gates: string[]
  outputs: string[]
}

export interface CanaryTrafficStep {
  id: string
  label: string
  traffic: number
  duration: string
  successCriteria: string
  rollback: string
}

export interface CanaryMetric {
  id: string
  name: string
  threshold: string
  window: string
}

export interface DeploymentPipelineStrategy {
  title: string
  description: string
  lastUpdated: string
  toolchain: string[]
  triggers: string[]
  stages: DeploymentPipelineStage[]
  canary: {
    trafficSteps: CanaryTrafficStep[]
    metrics: CanaryMetric[]
    autoRollback: string[]
    manualApproval: string
    freezeRules: string[]
  }
}

export const deploymentPipelineStrategy: DeploymentPipelineStrategy = {
  title: 'Deployment Pipeline and Canary Policy',
  description:
    'Standardized flow from code submission to full deployment. Ensures rollback capability and traceability.',
  lastUpdated: '2026-02-02T12:20:00Z',
  toolchain: ['GitHub Actions', 'Argo CD', 'Kubernetes', 'Terraform'],
  triggers: ['Main branch merge', 'Hotfix tag', 'Urgent security fix'],
  stages: [
    {
      id: 'stage-build',
      name: 'Build and Package',
      owner: 'Platform CI',
      duration: '10-15 min',
      gates: ['Tests passed', 'Dependency security scan'],
      outputs: ['Deployable image', 'SBOM report'],
    },
    {
      id: 'stage-verify',
      name: 'Integration Verification',
      owner: 'QA/Platform',
      duration: '20 min',
      gates: ['Tests passed', 'Key API P95 < 1.5s'],
      outputs: ['Acceptance report', 'Changelogs'],
    },
    {
      id: 'stage-staging',
      name: 'Staging Deployment',
      owner: 'SRE',
      duration: '30 min',
      gates: ['Smoke test passed', 'Canary toggle ready'],
      outputs: ['Canary-ready version', 'Rollback plan'],
    },
    {
      id: 'stage-canary',
      name: 'Canary Release',
      owner: 'Product Owner',
      duration: '2-6 h',
      gates: ['Error rate < 0.5%', 'P95 < 2s', 'User complaints = 0'],
      outputs: ['Canary metrics', 'Go/no-go recommendation'],
    },
    {
      id: 'stage-full',
      name: 'Full Rollout',
      owner: 'SRE',
      duration: '1 h',
      gates: ['Canary metrics meet targets', 'Stakeholder approval'],
      outputs: ['Release record', 'Monitoring alert baselines'],
    },
  ],
  canary: {
    trafficSteps: [
      {
        id: 'canary-5',
        label: 'Canary 5%',
        traffic: 5,
        duration: '2 h',
        successCriteria: 'Error rate < 0.5% and P95 < 2s',
        rollback: 'Auto rollback to previous stable version',
      },
      {
        id: 'canary-20',
        label: 'Beta 20%',
        traffic: 20,
        duration: '6 h',
        successCriteria: 'No P1/P2 alerts',
        rollback: 'Rollback and lock releases',
      },
      {
        id: 'canary-50',
        label: 'Ramp 50%',
        traffic: 50,
        duration: '12 h',
        successCriteria: 'Key metrics decline < 1%',
        rollback: 'Rollback and create incident ticket',
      },
      {
        id: 'canary-100',
        label: 'Stable 100%',
        traffic: 100,
        duration: '24 h',
        successCriteria: 'All monitoring metrics stable',
        rollback: 'Rollback window retained for 30 min',
      },
    ],
    metrics: [
      {
        id: 'metric-error',
        name: 'Error Rate',
        threshold: '< 0.5%',
        window: '5 min',
      },
      {
        id: 'metric-latency',
        name: 'P95 Latency',
        threshold: '< 2s',
        window: '10 min',
      },
      {
        id: 'metric-conversion',
        name: 'Key Metrics',
        threshold: '>= 99% of baseline',
        window: '2 h',
      },
      {
        id: 'metric-slo',
        name: 'SLO Budget',
        threshold: 'Consumption < 5%',
        window: '24 h',
      },
    ],
    autoRollback: [
      'Error rate > 1% for 10 continuous minutes',
      'P95 latency > 3s for 15 continuous minutes',
      'Trigger P1/P2 alert',
    ],
    manualApproval: 'Canary phase requires Product Owner + SRE approval',
    freezeRules: [
      'End-of-month freeze: only hotfixes allowed',
      'No releases 48h before major events',
    ],
  },
}
