/**
 * 模拟数据文件
 * 用于开发测试和演示
 */

// ============================================
// 工作流模板数据
// ============================================

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: number;
  nodeCount: number;
  useCount: number;
  tags: string[];
  featured: boolean;
  official: boolean;
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "wt-1",
    name: "邮件自动分类处理",
    description: "自动对收到的邮件进行分类，并根据类型执行不同的处理流程",
    icon: "📧",
    category: "productivity",
    difficulty: "beginner",
    estimatedTime: 5,
    nodeCount: 4,
    useCount: 15234,
    tags: ["邮件", "自动化", "分类"],
    featured: true,
    official: true,
  },
  {
    id: "wt-2",
    name: "社交媒体内容发布",
    description: "定时发布内容到多个社交媒体平台，支持图文混排",
    icon: "📱",
    category: "marketing",
    difficulty: "intermediate",
    estimatedTime: 10,
    nodeCount: 6,
    useCount: 12456,
    tags: ["社交媒体", "营销", "自动发布"],
    featured: true,
    official: true,
  },
  {
    id: "wt-3",
    name: "客户反馈情感分析",
    description: "使用 AI 分析客户反馈情感，自动分类为正面、中性、负面",
    icon: "🎯",
    category: "customer",
    difficulty: "intermediate",
    estimatedTime: 8,
    nodeCount: 5,
    useCount: 8934,
    tags: ["客户服务", "AI", "情感分析"],
    featured: true,
    official: false,
  },
  {
    id: "wt-4",
    name: "GitHub Issue 自动处理",
    description: "自动标记、分配和回复 GitHub Issues",
    icon: "🐙",
    category: "developer",
    difficulty: "advanced",
    estimatedTime: 15,
    nodeCount: 8,
    useCount: 7654,
    tags: ["GitHub", "开发", "自动化"],
    featured: false,
    official: true,
  },
  {
    id: "wt-5",
    name: "销售数据日报生成",
    description: "每天自动汇总销售数据，生成可视化报告并发送邮件",
    icon: "📊",
    category: "data",
    difficulty: "intermediate",
    estimatedTime: 12,
    nodeCount: 7,
    useCount: 6543,
    tags: ["数据分析", "报告", "自动化"],
    featured: true,
    official: true,
  },
  {
    id: "wt-6",
    name: "新用户欢迎流程",
    description: "新用户注册后自动发送欢迎邮件和引导内容",
    icon: "👋",
    category: "marketing",
    difficulty: "beginner",
    estimatedTime: 5,
    nodeCount: 3,
    useCount: 5432,
    tags: ["用户引导", "邮件", "自动化"],
    featured: false,
    official: true,
  },
  {
    id: "wt-7",
    name: "竞品价格监控",
    description: "定期抓取竞品价格，价格变动时自动告警",
    icon: "💰",
    category: "research",
    difficulty: "advanced",
    estimatedTime: 20,
    nodeCount: 9,
    useCount: 4321,
    tags: ["竞品分析", "监控", "告警"],
    featured: false,
    official: false,
  },
  {
    id: "wt-8",
    name: "AI 内容审核",
    description: "使用 AI 审核用户生成内容，过滤违规信息",
    icon: "🛡️",
    category: "content",
    difficulty: "intermediate",
    estimatedTime: 10,
    nodeCount: 5,
    useCount: 3987,
    tags: ["内容审核", "AI", "安全"],
    featured: true,
    official: true,
  },
];

// ============================================
// Agent 商店数据
// ============================================

export interface StoreAgent {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  author: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  rating: number;
  reviews: number;
  downloads: number;
  price: number | "free";
  tags: string[];
  featured: boolean;
  capabilities: string[];
  models: string[];
  version: string;
  updatedAt: string;
}

export const storeAgents: StoreAgent[] = [
  {
    id: "agent-1",
    name: "智能写作助手 Pro",
    description: "基于最新 AI 模型的智能写作助手，支持多种文体风格，可生成文章、文案、报告等",
    icon: "✍️",
    category: "writing",
    author: { name: "AI创作工坊", avatar: "", verified: true },
    rating: 4.9,
    reviews: 2456,
    downloads: 45678,
    price: "free",
    tags: ["写作", "AI", "文案", "创作"],
    featured: true,
    capabilities: ["长文写作", "多语言支持", "风格定制", "SEO 优化"],
    models: ["GPT-4", "Claude 3"],
    version: "2.1.0",
    updatedAt: "2026-01-28",
  },
  {
    id: "agent-2",
    name: "数据分析大师",
    description: "一站式数据分析解决方案，支持数据清洗、分析、可视化和报告生成",
    icon: "📊",
    category: "analytics",
    author: { name: "DataLab", avatar: "", verified: true },
    rating: 4.8,
    reviews: 1892,
    downloads: 32456,
    price: 29,
    tags: ["数据分析", "可视化", "报告", "BI"],
    featured: true,
    capabilities: ["数据清洗", "统计分析", "图表生成", "趋势预测"],
    models: ["GPT-4"],
    version: "1.8.5",
    updatedAt: "2026-01-25",
  },
  {
    id: "agent-3",
    name: "代码审查专家",
    description: "自动审查代码质量，检测潜在问题，提供优化建议和最佳实践指导",
    icon: "🔍",
    category: "development",
    author: { name: "DevTools Pro", avatar: "", verified: true },
    rating: 4.7,
    reviews: 1234,
    downloads: 28765,
    price: 49,
    tags: ["代码审查", "质量", "安全", "优化"],
    featured: false,
    capabilities: ["静态分析", "安全扫描", "性能检测", "代码规范"],
    models: ["GPT-4", "Claude 3"],
    version: "3.0.2",
    updatedAt: "2026-01-20",
  },
  {
    id: "agent-4",
    name: "智能客服机器人",
    description: "7x24小时智能客服，支持多轮对话、意图识别和知识库问答",
    icon: "🤖",
    category: "customer-service",
    author: { name: "ServiceAI", avatar: "", verified: false },
    rating: 4.6,
    reviews: 987,
    downloads: 19876,
    price: "free",
    tags: ["客服", "对话", "FAQ", "支持"],
    featured: true,
    capabilities: ["多轮对话", "意图识别", "情感分析", "知识库"],
    models: ["GPT-3.5", "GPT-4"],
    version: "2.5.1",
    updatedAt: "2026-01-22",
  },
  {
    id: "agent-5",
    name: "营销文案生成器",
    description: "快速生成高转化率的营销文案，支持多平台适配和 A/B 测试",
    icon: "📢",
    category: "marketing",
    author: { name: "GrowthHack", avatar: "", verified: true },
    rating: 4.8,
    reviews: 876,
    downloads: 15432,
    price: 19,
    tags: ["营销", "文案", "转化", "广告"],
    featured: false,
    capabilities: ["多平台适配", "A/B 测试", "转化优化", "受众分析"],
    models: ["GPT-4"],
    version: "1.5.0",
    updatedAt: "2026-01-18",
  },
  {
    id: "agent-6",
    name: "翻译与本地化助手",
    description: "专业级翻译工具，支持100+语言，保持原文风格和语境",
    icon: "🌍",
    category: "translation",
    author: { name: "LangBridge", avatar: "", verified: true },
    rating: 4.9,
    reviews: 2134,
    downloads: 38765,
    price: "free",
    tags: ["翻译", "多语言", "本地化", "国际化"],
    featured: true,
    capabilities: ["100+语言", "术语库", "风格保持", "批量翻译"],
    models: ["GPT-4", "Claude 3"],
    version: "4.2.0",
    updatedAt: "2026-01-30",
  },
];

// ============================================
// 对话历史数据
// ============================================

export interface ConversationItem {
  id: string;
  title: string;
  preview: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  starred: boolean;
  pinned: boolean;
  folder: string | null;
  tags: string[];
}

export const conversationHistory: ConversationItem[] = [
  {
    id: "conv-1",
    title: "创建自动化邮件工作流",
    preview: "好的，我来帮你设计这个邮件自动化工作流。首先我们需要确定触发条件...",
    model: "GPT-4",
    createdAt: "2026-01-31T10:30:00Z",
    updatedAt: "刚刚",
    messageCount: 24,
    starred: true,
    pinned: true,
    folder: "工作流设计",
    tags: ["自动化", "邮件"],
  },
  {
    id: "conv-2",
    title: "分析销售数据并生成报告",
    preview: "根据您提供的数据，我已完成分析。以下是主要发现：1) 销售额环比增长...",
    model: "GPT-4",
    createdAt: "2026-01-30T15:20:00Z",
    updatedAt: "2小时前",
    messageCount: 18,
    starred: true,
    pinned: false,
    folder: "数据分析",
    tags: ["数据", "报告"],
  },
  {
    id: "conv-3",
    title: "优化 React 组件性能",
    preview: "让我来分析一下这个组件的性能问题。主要有以下几点可以优化...",
    model: "Claude 3",
    createdAt: "2026-01-30T09:15:00Z",
    updatedAt: "5小时前",
    messageCount: 32,
    starred: false,
    pinned: false,
    folder: "代码开发",
    tags: ["React", "性能优化"],
  },
  {
    id: "conv-4",
    title: "撰写产品发布公告",
    preview: "以下是我为您撰写的产品发布公告草稿，涵盖了主要功能亮点和用户价值...",
    model: "GPT-4",
    createdAt: "2026-01-29T14:00:00Z",
    updatedAt: "昨天",
    messageCount: 12,
    starred: false,
    pinned: false,
    folder: "内容创作",
    tags: ["营销", "文案"],
  },
  {
    id: "conv-5",
    title: "设计数据库架构",
    preview: "基于您的需求，我建议采用以下数据库架构设计。主要考虑了扩展性和查询性能...",
    model: "GPT-4",
    createdAt: "2026-01-28T11:30:00Z",
    updatedAt: "2天前",
    messageCount: 28,
    starred: false,
    pinned: false,
    folder: "技术设计",
    tags: ["数据库", "架构"],
  },
];

// ============================================
// 用户活动数据
// ============================================

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  timeAgo: string;
  status: "success" | "error" | "warning" | "pending";
  metadata?: Record<string, string | number>;
}

export const recentActivities: ActivityItem[] = [
  {
    id: "act-1",
    type: "workflow_executed",
    title: "执行工作流：客户反馈自动处理",
    description: "工作流执行成功，处理了 15 条反馈",
    timestamp: "2026-01-31T10:30:00Z",
    timeAgo: "5 分钟前",
    status: "success",
    metadata: { duration: "12s", records: 15 },
  },
  {
    id: "act-2",
    type: "conversation_started",
    title: "开始新对话",
    description: "使用 GPT-4 模型开始了新对话",
    timestamp: "2026-01-31T10:15:00Z",
    timeAgo: "20 分钟前",
    status: "success",
    metadata: { model: "GPT-4", messages: 8 },
  },
  {
    id: "act-3",
    type: "workflow_created",
    title: "创建工作流：邮件自动分类",
    description: "创建了新的自动化工作流",
    timestamp: "2026-01-31T09:45:00Z",
    timeAgo: "50 分钟前",
    status: "success",
    metadata: { nodes: 6, triggers: 1 },
  },
  {
    id: "act-4",
    type: "workflow_executed",
    title: "执行工作流：数据同步",
    description: "工作流执行失败：API 连接超时",
    timestamp: "2026-01-31T09:30:00Z",
    timeAgo: "1 小时前",
    status: "error",
    metadata: { error: "Connection timeout" },
  },
  {
    id: "act-5",
    type: "agent_created",
    title: "创建 Agent：写作助手",
    description: "创建了新的 AI Agent",
    timestamp: "2026-01-31T09:00:00Z",
    timeAgo: "1.5 小时前",
    status: "success",
    metadata: { model: "GPT-4", capabilities: 3 },
  },
];

// ============================================
// 统计数据
// ============================================

export interface DashboardStats {
  totalConversations: number;
  totalWorkflows: number;
  totalAgents: number;
  totalFiles: number;
  apiCalls: number;
  tokensUsed: number;
  activeWorkflows: number;
  successRate: number;
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
};

// ============================================
// 快捷操作数据
// ============================================

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  shortcut?: string;
  category: string;
}

export const quickActions: QuickAction[] = [
  {
    id: "qa-1",
    title: "新建对话",
    description: "开始新的 AI 对话",
    icon: "MessageSquare",
    href: "/",
    shortcut: "⌘ N",
    category: "创建",
  },
  {
    id: "qa-2",
    title: "新建工作流",
    description: "创建自动化工作流",
    icon: "Zap",
    href: "/workflows/new",
    shortcut: "⌘ W",
    category: "创建",
  },
  {
    id: "qa-3",
    title: "新建 Agent",
    description: "创建自定义 AI 助手",
    icon: "Bot",
    href: "/my-agents/new",
    category: "创建",
  },
  {
    id: "qa-4",
    title: "上传文件",
    description: "上传文件到知识库",
    icon: "Upload",
    href: "/files",
    category: "管理",
  },
  {
    id: "qa-5",
    title: "模板库",
    description: "浏览工作流模板",
    icon: "LayoutGrid",
    href: "/template-gallery",
    category: "浏览",
  },
  {
    id: "qa-6",
    title: "设置",
    description: "管理账户设置",
    icon: "Settings",
    href: "/settings",
    shortcut: "⌘ ,",
    category: "设置",
  },
];

// ============================================
// 帮助/FAQ 数据
// ============================================

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

export const faqItems: FAQItem[] = [
  {
    id: "faq-1",
    question: "如何创建我的第一个工作流？",
    answer: "您可以通过以下步骤创建工作流：1) 进入工作流页面，2) 点击「创建工作流」按钮，3) 在编辑器中拖拽节点构建流程，4) 配置每个节点的参数，5) 保存并测试工作流。",
    category: "入门指南",
    helpful: 234,
  },
  {
    id: "faq-2",
    question: "Agent 和工作流有什么区别？",
    answer: "Agent 是一个智能 AI 助手，可以理解自然语言并自主决策执行任务。工作流则是预定义的自动化流程，按照固定步骤执行。Agent 更灵活，工作流更可控。",
    category: "功能说明",
    helpful: 189,
  },
  {
    id: "faq-3",
    question: "如何配置 API 密钥？",
    answer: "进入设置 → API 密钥页面，点击「添加密钥」，选择服务提供商（如 OpenAI、Claude 等），输入您的 API Key，保存后即可使用。",
    category: "配置",
    helpful: 156,
  },
  {
    id: "faq-4",
    question: "文件上传有什么限制？",
    answer: "免费用户最大单文件 10MB，总存储 1GB。Pro 用户单文件 50MB，总存储 10GB。支持的格式包括：PDF、Word、Excel、图片、代码文件等。",
    category: "限制说明",
    helpful: 145,
  },
  {
    id: "faq-5",
    question: "如何将文件添加到知识库？",
    answer: "在文件库中选择文件，点击「添加到知识库」，选择目标知识库或创建新的知识库。系统会自动进行文档解析和向量化索引。",
    category: "功能说明",
    helpful: 132,
  },
];
