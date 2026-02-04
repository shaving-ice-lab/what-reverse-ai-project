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
    href: "/dashboard/conversations",
    shortcut: "⌘ N",
    category: "创建",
  },
  {
    id: "qa-2",
    title: "新建工作流",
    description: "创建自动化工作流",
    icon: "Zap",
    href: "/dashboard/workflows/new",
    shortcut: "⌘ W",
    category: "创建",
  },
  {
    id: "qa-3",
    title: "新建 Agent",
    description: "创建自定义 AI 助手",
    icon: "Bot",
    href: "/dashboard/my-agents/new",
    category: "创建",
  },
  {
    id: "qa-4",
    title: "上传文件",
    description: "上传文件到知识库",
    icon: "Upload",
    href: "/dashboard/files",
    category: "管理",
  },
  {
    id: "qa-5",
    title: "模板库",
    description: "浏览工作流模板",
    icon: "LayoutGrid",
    href: "/dashboard/template-gallery",
    category: "浏览",
  },
  {
    id: "qa-6",
    title: "设置",
    description: "管理账户设置",
    icon: "Settings",
    href: "/dashboard/settings",
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

// ============================================
// AI 质量回归测试集
// ============================================

export type RegressionCaseStatus = "pass" | "fail" | "needs_review" | "flaky";

export interface RegressionTestCase {
  id: string;
  title: string;
  prompt: string;
  expected: string;
  rubric: string;
  tags: string[];
  status: RegressionCaseStatus;
  lastRunAt: string;
  owner: string;
  score: number;
}

export const regressionTestCases: RegressionTestCase[] = [
  {
    id: "rt-1",
    title: "客服工单摘要",
    prompt: "请将以下工单内容总结为 3 个要点并给出优先级。",
    expected: "包含问题、影响范围、处理建议。",
    rubric: "要点覆盖率 ≥ 90%，禁止输出敏感信息。",
    tags: ["摘要", "客服", "结构化"],
    status: "pass",
    lastRunAt: "2026-02-01T09:12:00Z",
    owner: "质量团队",
    score: 94,
  },
  {
    id: "rt-2",
    title: "营销文案 A/B",
    prompt: "生成面向企业采购的冷启动邮件标题。",
    expected: "语气专业、包含价值点、可读性强。",
    rubric: "可读性 ≥ 90，命中关键卖点 ≥ 2。",
    tags: ["营销", "文案", "标题"],
    status: "needs_review",
    lastRunAt: "2026-02-01T08:40:00Z",
    owner: "增长团队",
    score: 86,
  },
  {
    id: "rt-3",
    title: "金融数据解释",
    prompt: "解释该表格中的同比增长原因，要求给出 2 条可验证事实。",
    expected: "使用表格数据，避免凭空猜测。",
    rubric: "事实一致性 ≥ 88，引用表格字段。",
    tags: ["数据", "分析", "事实一致性"],
    status: "fail",
    lastRunAt: "2026-01-31T16:05:00Z",
    owner: "分析团队",
    score: 72,
  },
  {
    id: "rt-4",
    title: "合规风险提示",
    prompt: "识别对话中潜在的合规风险并提出替代表述。",
    expected: "输出风险点 + 替代表述。",
    rubric: "风险识别覆盖 ≥ 95，替代表述无违规。",
    tags: ["合规", "安全", "风控"],
    status: "pass",
    lastRunAt: "2026-01-31T14:22:00Z",
    owner: "安全团队",
    score: 97,
  },
  {
    id: "rt-5",
    title: "多语言翻译一致性",
    prompt: "将产品功能描述翻译成日语并保持术语一致。",
    expected: "关键术语一致，语气自然。",
    rubric: "术语一致率 ≥ 92，风格一致。",
    tags: ["翻译", "本地化", "术语"],
    status: "flaky",
    lastRunAt: "2026-01-31T12:18:00Z",
    owner: "国际化团队",
    score: 88,
  },
  {
    id: "rt-6",
    title: "知识库问答",
    prompt: "基于知识库说明回答定价问题，并附上引用段落。",
    expected: "答案简洁，引用与事实一致。",
    rubric: "引用准确率 ≥ 95，简洁度 ≥ 85。",
    tags: ["知识库", "引用", "问答"],
    status: "pass",
    lastRunAt: "2026-01-31T10:02:00Z",
    owner: "内容团队",
    score: 92,
  },
];

// ============================================
// 人工评审抽样策略
// ============================================

export type ReviewSamplingPriority = "high" | "medium" | "low";
export type ReviewSamplingStatus = "active" | "paused";

export interface ReviewSamplingRule {
  id: string;
  scenario: string;
  trigger: string;
  sampleRate: number;
  priority: ReviewSamplingPriority;
  status: ReviewSamplingStatus;
  slaHours: number;
  reviewers: string[];
  notes?: string;
}

export interface ReviewSamplingCoverage {
  id: string;
  label: string;
  rate: number;
  goal: string;
}

export interface ReviewSamplingStrategy {
  baseRate: number;
  dailyMin: number;
  dailyMax: number;
  escalationThreshold: number;
  confidenceGate: number;
  lastUpdated: string;
  owner: string;
  reviewers: string[];
  triggers: Array<{ id: string; label: string; description: string }>;
  coverage: ReviewSamplingCoverage[];
  rules: ReviewSamplingRule[];
  checklist: Array<{ id: string; label: string; required: boolean }>;
}

export const reviewSamplingStrategy: ReviewSamplingStrategy = {
  baseRate: 0.08,
  dailyMin: 40,
  dailyMax: 260,
  escalationThreshold: 0.85,
  confidenceGate: 0.9,
  lastUpdated: "2026-02-01T11:20:00Z",
  owner: "AI 质量负责人",
  reviewers: ["质量团队", "领域专家", "合规审查"],
  triggers: [
    {
      id: "t-1",
      label: "低置信度输出",
      description: "模型置信度 < 0.90 自动进入抽样池",
    },
    {
      id: "t-2",
      label: "高影响场景",
      description: "财务、法律、医疗等高风险领域强制抽样",
    },
    {
      id: "t-3",
      label: "新模型版本",
      description: "新模型上线 7 天内提升抽样比例",
    },
    {
      id: "t-4",
      label: "用户投诉触发",
      description: "连续 3 次负反馈触发加严抽样",
    },
  ],
  coverage: [
    { id: "c-1", label: "知识库问答", rate: 0.12, goal: "引用准确率 ≥ 95%" },
    { id: "c-2", label: "营销文案", rate: 0.1, goal: "可读性 ≥ 90" },
    { id: "c-3", label: "数据分析", rate: 0.15, goal: "事实一致性 ≥ 88" },
    { id: "c-4", label: "客服摘要", rate: 0.08, goal: "结构完整度 ≥ 90" },
  ],
  rules: [
    {
      id: "r-1",
      scenario: "高风险内容",
      trigger: "敏感行业 / 合规关键词命中",
      sampleRate: 0.35,
      priority: "high",
      status: "active",
      slaHours: 12,
      reviewers: ["合规审查", "质量团队"],
      notes: "强制双人复核",
    },
    {
      id: "r-2",
      scenario: "新模型灰度",
      trigger: "模型版本 < 7 天",
      sampleRate: 0.2,
      priority: "high",
      status: "active",
      slaHours: 24,
      reviewers: ["质量团队"],
    },
    {
      id: "r-3",
      scenario: "低置信度输出",
      trigger: "置信度 < 0.90",
      sampleRate: 0.18,
      priority: "medium",
      status: "active",
      slaHours: 24,
      reviewers: ["质量团队"],
    },
    {
      id: "r-4",
      scenario: "高成本调用",
      trigger: "单次成本 > ¥2.0",
      sampleRate: 0.12,
      priority: "medium",
      status: "active",
      slaHours: 36,
      reviewers: ["成本优化组"],
    },
    {
      id: "r-5",
      scenario: "低频场景回归",
      trigger: "7 日内调用 < 20 次",
      sampleRate: 0.08,
      priority: "low",
      status: "paused",
      slaHours: 48,
      reviewers: ["质量团队"],
      notes: "待样本积累后恢复",
    },
  ],
  checklist: [
    { id: "q-1", label: "输出是否遵循场景要求", required: true },
    { id: "q-2", label: "事实与引用是否一致", required: true },
    { id: "q-3", label: "是否包含敏感/违规内容", required: true },
    { id: "q-4", label: "格式与语言是否清晰", required: false },
    { id: "q-5", label: "可否给出可执行建议", required: false },
  ],
};

// ============================================
// 内置示例 App 清单
// ============================================

export type SampleAppComplexity = "beginner" | "intermediate" | "advanced";

export interface SampleApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  scenario: string;
  complexity: SampleAppComplexity;
  tags: string[];
  updatedAt: string;
  href: string;
}

export const sampleApps: SampleApp[] = [
  {
    id: "sa-1",
    name: "智能客服接入台",
    description: "统一处理多渠道咨询，自动识别意图并生成结构化回复。",
    icon: "🎧",
    category: "客户服务",
    scenario: "高频咨询 · 多轮对话",
    complexity: "beginner",
    tags: ["意图识别", "FAQ", "多轮对话"],
    updatedAt: "2026-01-30T09:30:00Z",
    href: "/dashboard/template-gallery",
  },
  {
    id: "sa-2",
    name: "销售报价助手",
    description: "基于需求自动生成报价清单与交付方案，支持多版本对比。",
    icon: "💼",
    category: "销售运营",
    scenario: "售前支持 · 报价生成",
    complexity: "intermediate",
    tags: ["报价", "方案生成", "对比"],
    updatedAt: "2026-01-28T14:10:00Z",
    href: "/dashboard/template-gallery",
  },
  {
    id: "sa-3",
    name: "市场简报工坊",
    description: "汇总趋势数据与舆情信息，一键输出市场周报。",
    icon: "📰",
    category: "市场情报",
    scenario: "趋势追踪 · 周报生成",
    complexity: "intermediate",
    tags: ["舆情", "简报", "可视化"],
    updatedAt: "2026-01-27T16:45:00Z",
    href: "/dashboard/template-gallery",
  },
  {
    id: "sa-4",
    name: "合同合规检查",
    description: "对合同条款进行风险识别与修改建议，输出审查摘要。",
    icon: "🧾",
    category: "法务合规",
    scenario: "风险识别 · 合规审查",
    complexity: "advanced",
    tags: ["合规", "风险", "条款审查"],
    updatedAt: "2026-01-26T11:20:00Z",
    href: "/dashboard/template-gallery",
  },
  {
    id: "sa-5",
    name: "知识库问答台",
    description: "基于企业知识库提供引用式回答，支持多来源汇总。",
    icon: "📚",
    category: "知识运营",
    scenario: "知识问答 · 引用校验",
    complexity: "beginner",
    tags: ["知识库", "引用", "检索增强"],
    updatedAt: "2026-01-25T10:00:00Z",
    href: "/dashboard/template-gallery",
  },
  {
    id: "sa-6",
    name: "运营日报生成器",
    description: "自动拉取业务指标并生成可发送的运营日报模板。",
    icon: "📈",
    category: "运营分析",
    scenario: "日报 · 业务指标",
    complexity: "beginner",
    tags: ["日报", "指标", "自动化"],
    updatedAt: "2026-01-24T08:25:00Z",
    href: "/dashboard/template-gallery",
  },
];

// ============================================
// Demo 数据与脚手架
// ============================================

export type DemoDataFormat = "csv" | "json" | "parquet";

export interface DemoDataPack {
  id: string;
  name: string;
  description: string;
  format: DemoDataFormat;
  records: number;
  fields: number;
  size: string;
  tags: string[];
  updatedAt: string;
}

export const demoDataPacks: DemoDataPack[] = [
  {
    id: "dd-1",
    name: "客服工单样本集",
    description: "多渠道客服对话与工单标签，适合演示意图识别与自动摘要。",
    format: "json",
    records: 4200,
    fields: 18,
    size: "12.4MB",
    tags: ["客服", "意图识别", "摘要"],
    updatedAt: "2026-02-01T08:30:00Z",
  },
  {
    id: "dd-2",
    name: "营销触达数据集",
    description: "包含投放渠道、用户行为与转化结果，用于演示归因分析。",
    format: "csv",
    records: 12800,
    fields: 22,
    size: "18.1MB",
    tags: ["营销", "转化", "归因"],
    updatedAt: "2026-01-30T15:45:00Z",
  },
  {
    id: "dd-3",
    name: "知识库问答语料",
    description: "企业知识库片段与问答对，用于演示引用式回答与检索。",
    format: "parquet",
    records: 7600,
    fields: 12,
    size: "9.7MB",
    tags: ["知识库", "引用", "检索"],
    updatedAt: "2026-01-29T11:05:00Z",
  },
];

export interface DemoScaffoldTemplate {
  id: string;
  name: string;
  description: string;
  language: string;
  entry: string;
  code: string;
  tags: string[];
  updatedAt: string;
}

export const demoScaffoldTemplates: DemoScaffoldTemplate[] = [
  {
    id: "ds-1",
    name: "客服质检回路",
    description: "基于工单样本自动生成摘要、风险标注与跟进建议。",
    language: "json",
    entry: "workflow.customer-qa.json",
    code: `{
  "name": "客服质检回路",
  "nodes": [
    {
      "type": "input",
      "id": "ticket",
      "config": { "schema": "support_ticket" }
    },
    {
      "type": "llm",
      "id": "summary",
      "config": { "model": "gpt-4", "prompt": "生成 3 条摘要与风险提示" }
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
    tags: ["客服", "质检", "风险"],
    updatedAt: "2026-02-01T09:40:00Z",
  },
  {
    id: "ds-2",
    name: "市场周报生成",
    description: "从营销触达数据集中自动生成趋势洞察与行动建议。",
    language: "json",
    entry: "workflow.market-brief.json",
    code: `{
  "name": "市场周报生成",
  "nodes": [
    { "type": "dataset", "id": "campaigns", "config": { "source": "marketing_pack" } },
    { "type": "transform", "id": "metrics", "config": { "operation": "aggregate" } },
    { "type": "llm", "id": "insights", "config": { "model": "gpt-4", "prompt": "提炼 5 条洞察" } },
    { "type": "output", "id": "brief", "config": { "format": "slide" } }
  ]
}`,
    tags: ["营销", "洞察", "周报"],
    updatedAt: "2026-01-31T16:10:00Z",
  },
  {
    id: "ds-3",
    name: "知识库问答脚手架",
    description: "引用式检索 + 置信度门槛，适合演示可信回答链路。",
    language: "json",
    entry: "workflow.kb-qa.json",
    code: `{
  "name": "知识库问答脚手架",
  "nodes": [
    { "type": "retrieval", "id": "kb", "config": { "top_k": 5 } },
    { "type": "llm", "id": "answer", "config": { "model": "claude-3", "prompt": "引用来源回答" } },
    { "type": "rule", "id": "confidence", "config": { "min": 0.9 } },
    { "type": "output", "id": "final", "config": { "format": "json" } }
  ]
}`,
    tags: ["知识库", "引用", "置信度"],
    updatedAt: "2026-01-30T10:25:00Z",
  },
];

// ============================================
// 演示流程脚本
// ============================================

export interface DemoFlowLink {
  label: string;
  href: string;
}

export interface DemoFlowStep {
  id: string;
  title: string;
  duration: string;
  owner: string;
  goal: string;
  actions: string[];
  deliverable: string;
  links: DemoFlowLink[];
}

export interface DemoFlowScript {
  title: string;
  description: string;
  totalDuration: string;
  audience: string[];
  notes: string[];
  steps: DemoFlowStep[];
}

export const demoFlowScript: DemoFlowScript = {
  title: "标准演示流程（30 分钟）",
  description: "面向业务与技术双角色的产品演示脚本，可直接复用。",
  totalDuration: "30 分钟",
  audience: ["业务负责人", "技术负责人", "运营团队"],
  notes: ["演示前确认数据包已加载", "重点突出价值与落地路径"],
  steps: [
    {
      id: "step-1",
      title: "场景对齐与目标确认",
      duration: "3 分钟",
      owner: "产品顾问",
      goal: "明确演示场景与评估目标",
      actions: ["选择示例 App", "确认业务痛点", "定义验收指标"],
      deliverable: "场景确认清单",
      links: [{ label: "示例 App", href: "/dashboard/apps" }],
    },
    {
      id: "step-2",
      title: "加载数据包与脚手架",
      duration: "5 分钟",
      owner: "解决方案工程师",
      goal: "快速搭建可演示流程",
      actions: ["选择数据包", "加载脚手架模板", "检查节点配置"],
      deliverable: "可运行的 Demo 工作流",
      links: [
        { label: "Demo Kit", href: "/dashboard/apps" },
        { label: "模板库", href: "/dashboard/template-gallery" },
      ],
    },
    {
      id: "step-3",
      title: "运行与效果展示",
      duration: "7 分钟",
      owner: "解决方案工程师",
      goal: "展示端到端输出效果",
      actions: ["触发执行", "展示输出结果", "说明业务价值"],
      deliverable: "演示结果样例",
      links: [{ label: "运行监控", href: "/dashboard/workspaces/demo/apps/demo/monitoring" }],
    },
    {
      id: "step-4",
      title: "质量与回归保障",
      duration: "6 分钟",
      owner: "质量负责人",
      goal: "说明可控质量与评审机制",
      actions: ["展示回归用例", "讲解抽样策略", "说明风险控制"],
      deliverable: "质量保障说明",
      links: [{ label: "质量监控", href: "/dashboard/workspaces/demo/apps/demo/monitoring" }],
    },
    {
      id: "step-5",
      title: "成本与迭代路径",
      duration: "5 分钟",
      owner: "产品顾问",
      goal: "清晰交付路径与成本预估",
      actions: ["讲解成本结构", "说明上线节奏", "确定下一步行动"],
      deliverable: "演示行动计划",
      links: [{ label: "使用分析", href: "/dashboard/analytics" }],
    },
    {
      id: "step-6",
      title: "Q&A 与收尾",
      duration: "4 分钟",
      owner: "全员",
      goal: "收集反馈并确认后续",
      actions: ["解答疑问", "记录需求", "确认负责人"],
      deliverable: "会议纪要",
      links: [{ label: "反馈中心", href: "/dashboard/feedback" }],
    },
  ],
};

// ============================================
// 发布节奏与窗口
// ============================================

export type ReleaseWindowType = "feature" | "maintenance" | "hotfix";
export type ReleaseWindowStatus = "open" | "restricted";

export interface ReleaseWindow {
  id: string;
  label: string;
  type: ReleaseWindowType;
  cadence: string;
  timeRange: string;
  scope: string;
  gate: string;
  owner: string;
  status: ReleaseWindowStatus;
}

export interface ReleaseFreezeWindow {
  id: string;
  label: string;
  rule: string;
  notes: string;
}

export interface ReleaseChannel {
  id: string;
  label: string;
  rollout: number;
  duration: string;
  guardrail: string;
}

export interface ReleaseCadencePlan {
  title: string;
  timezone: string;
  owner: string;
  description: string;
  regularWindows: ReleaseWindow[];
  freezeWindows: ReleaseFreezeWindow[];
  channels: ReleaseChannel[];
  hotfixPolicy: {
    window: string;
    approval: string;
    rollback: string;
    comms: string;
  };
  checklist: string[];
}

export const releaseCadencePlan: ReleaseCadencePlan = {
  title: "发布节奏与窗口",
  timezone: "Asia/Shanghai (UTC+8)",
  owner: "Release Manager",
  description: "保持稳定的发布节奏，确保可回滚、可追踪。",
  regularWindows: [
    {
      id: "rw-1",
      label: "标准发布窗",
      type: "feature",
      cadence: "每周二 / 周四",
      timeRange: "10:00 - 12:00",
      scope: "Web / API / Runtime",
      gate: "回归通过 + 监控阈值 OK",
      owner: "平台团队",
      status: "open",
    },
    {
      id: "rw-2",
      label: "灰度发布窗",
      type: "feature",
      cadence: "每周三",
      timeRange: "14:00 - 16:00",
      scope: "新功能灰度",
      gate: "灰度指标达标",
      owner: "产品负责人",
      status: "open",
    },
    {
      id: "rw-3",
      label: "维护窗口",
      type: "maintenance",
      cadence: "每周日",
      timeRange: "22:00 - 23:00",
      scope: "DB / Infra / 低频任务",
      gate: "无中断/可回滚",
      owner: "SRE",
      status: "restricted",
    },
  ],
  freezeWindows: [
    {
      id: "fw-1",
      label: "月末冻结",
      rule: "每月最后 2 个工作日",
      notes: "仅允许 P0/P1 热修复",
    },
    {
      id: "fw-2",
      label: "节假日冻结",
      rule: "法定节假日前 24 小时",
      notes: "关闭标准发布窗",
    },
  ],
  channels: [
    {
      id: "rc-1",
      label: "Canary 5%",
      rollout: 5,
      duration: "2 小时",
      guardrail: "错误率 < 0.5%",
    },
    {
      id: "rc-2",
      label: "Beta 20%",
      rollout: 20,
      duration: "6 小时",
      guardrail: "P95 < 2s",
    },
    {
      id: "rc-3",
      label: "Stable 100%",
      rollout: 100,
      duration: "24 小时",
      guardrail: "告警阈值全部通过",
    },
  ],
  hotfixPolicy: {
    window: "随时触发（需值班确认）",
    approval: "值班负责人 + 安全审查",
    rollback: "15 分钟内可回滚",
    comms: "2 小时内同步公告",
  },
  checklist: [
    "版本号升级并记录变更",
    "回归测试集全部通过",
    "监控与告警阈值确认",
    "发布后 30 分钟健康巡检",
  ],
};

// ============================================
// 版本变更公告模板
// ============================================

export interface ReleaseNoteSection {
  title: string;
  items: string[];
}

export interface ReleaseNoteTemplate {
  version: string;
  date: string;
  title: string;
  summary: string;
  highlights: string[];
  sections: ReleaseNoteSection[];
  impact: {
    downtime: string;
    affected: string;
    migration: string;
  };
  rollback: string;
  links: Array<{ label: string; href: string }>;
  acknowledgements: string[];
}

export const releaseNoteTemplate: ReleaseNoteTemplate = {
  version: "v3.27.0",
  date: "2026-02-02",
  title: "质量与发布管理增强",
  summary: "新增质量回归面板、发布节奏与 Demo 脚手架，提升可演示与可运维性。",
  highlights: [
    "新增回归测试集与抽样策略面板",
    "发布节奏与窗口策略可视化",
    "提供 Demo 数据包与脚手架模板",
  ],
  sections: [
    {
      title: "新增",
      items: [
        "Workbench 增加 Demo Kit 与演示流程脚本",
        "质量评估页支持回归用例与抽样策略",
        "插件 Manifest SemVer 校验统一",
      ],
    },
    {
      title: "优化",
      items: [
        "版本号规范统一为 SemVer，支持预发布版本",
        "演示数据包结构优化，支持多格式",
      ],
    },
    {
      title: "修复",
      items: ["修复演示流程脚本链接指引缺失的问题"],
    },
  ],
  impact: {
    downtime: "无计划停机",
    affected: "Web 控制台 / 插件校验",
    migration: "无需迁移",
  },
  rollback: "如发布后 30 分钟内出现 P1 告警，执行回滚到上一稳定版本。",
  links: [
    { label: "发布说明", href: "/whats-new" },
    { label: "状态页", href: "/status" },
    { label: "反馈中心", href: "/dashboard/feedback" },
  ],
  acknowledgements: ["平台团队", "质量团队", "SRE"],
};

// ============================================
// 容器化与镜像规范
// ============================================

export interface ContainerImageSpec {
  id: string;
  service: string;
  repository: string;
  runtime: string;
  tagPolicy: string;
  rollback: string;
  healthCheck: string;
}

export interface ContainerizationSpec {
  registry: string;
  tagFormat: string;
  latestTag: string;
  retention: string;
  rollbackPolicy: string;
  scanPolicy: string;
  signingPolicy: string;
  lastUpdated: string;
  buildPipeline: string[];
  images: ContainerImageSpec[];
}

export const containerizationSpec: ContainerizationSpec = {
  registry: "registry.agentflow.ai",
  tagFormat: "agentflow/{service}:v{semver}-{shortSha}",
  latestTag: "agentflow/{service}:stable",
  retention: "保留最近 10 个 Tag（稳定版保留 3 个）",
  rollbackPolicy: "30 分钟内可回滚至上一稳定版本",
  scanPolicy: "镜像推送前执行漏洞扫描（高危阻断）",
  signingPolicy: "生产镜像必须签名并记录 SBOM",
  lastUpdated: "2026-02-02T10:20:00Z",
  buildPipeline: [
    "多阶段构建（build/runtime 分离）",
    "使用 buildx + 缓存加速",
    "生成 SBOM 与镜像签名",
    "推送至 Registry 并同步标签",
  ],
  images: [
    {
      id: "img-web",
      service: "web",
      repository: "agentflow/web",
      runtime: "node18-alpine",
      tagPolicy: "v{semver}-{shortSha}",
      rollback: "保留最近 3 个稳定 Tag",
      healthCheck: "/healthz",
    },
    {
      id: "img-api",
      service: "api",
      repository: "agentflow/api",
      runtime: "go1.22-alpine",
      tagPolicy: "v{semver}-{shortSha}",
      rollback: "保留最近 5 个 Tag",
      healthCheck: "/healthz",
    },
    {
      id: "img-runtime",
      service: "runtime",
      repository: "agentflow/runtime",
      runtime: "go1.22-alpine",
      tagPolicy: "v{semver}-{shortSha}",
      rollback: "保留最近 5 个 Tag",
      healthCheck: "/healthz",
    },
    {
      id: "img-db",
      service: "db-provisioner",
      repository: "agentflow/db-provisioner",
      runtime: "go1.22-alpine",
      tagPolicy: "v{semver}-{shortSha}",
      rollback: "保留最近 3 个稳定 Tag",
      healthCheck: "/healthz",
    },
    {
      id: "img-domain",
      service: "domain-service",
      repository: "agentflow/domain-service",
      runtime: "go1.22-alpine",
      tagPolicy: "v{semver}-{shortSha}",
      rollback: "保留最近 3 个稳定 Tag",
      healthCheck: "/healthz",
    },
  ],
};

// ============================================
// 环境隔离与命名规范
// ============================================

export interface EnvironmentScope {
  id: string;
  label: string;
  env: "dev" | "staging" | "prod";
  purpose: string;
  access: string;
  namespace: string;
  domainPattern: string;
  dataRetention: string;
  configPrefix: string;
  secretPrefix: string;
}

export interface EnvironmentNamingRule {
  id: string;
  resource: string;
  pattern: string;
  example: string;
  notes: string;
}

export interface EnvironmentNamingSpec {
  title: string;
  description: string;
  lastUpdated: string;
  namingPattern: string;
  environments: EnvironmentScope[];
  resourceRules: EnvironmentNamingRule[];
  guardrails: string[];
}

export const environmentNamingSpec: EnvironmentNamingSpec = {
  title: "环境隔离与命名规范",
  description: "统一 dev / staging / prod 的命名规则与隔离边界。",
  lastUpdated: "2026-02-02T11:40:00Z",
  namingPattern: "af-{workspace}-{env}-{service}",
  environments: [
    {
      id: "env-dev",
      label: "开发",
      env: "dev",
      purpose: "功能开发与联调",
      access: "内部",
      namespace: "af-{workspace}-dev",
      domainPattern: "{app}.dev.agentflow.ai",
      dataRetention: "7 天",
      configPrefix: "DEV_",
      secretPrefix: "AF_DEV_{SERVICE}_",
    },
    {
      id: "env-staging",
      label: "预发布",
      env: "staging",
      purpose: "灰度验证与验收",
      access: "受控",
      namespace: "af-{workspace}-stg",
      domainPattern: "{app}.staging.agentflow.ai",
      dataRetention: "14 天",
      configPrefix: "STG_",
      secretPrefix: "AF_STG_{SERVICE}_",
    },
    {
      id: "env-prod",
      label: "生产",
      env: "prod",
      purpose: "正式对外服务",
      access: "严格",
      namespace: "af-{workspace}-prod",
      domainPattern: "{app}.agentflow.ai",
      dataRetention: "30 天",
      configPrefix: "PROD_",
      secretPrefix: "AF_PROD_{SERVICE}_",
    },
  ],
  resourceRules: [
    {
      id: "rule-db",
      resource: "数据库",
      pattern: "af_{env}_{app}",
      example: "af_prod_checkout",
      notes: "跨环境禁止共享实例",
    },
    {
      id: "rule-bucket",
      resource: "对象存储",
      pattern: "af-{env}-{workspace}-{bucket}",
      example: "af-prod-acme-assets",
      notes: "Bucket 需启用版本化",
    },
    {
      id: "rule-secret",
      resource: "Secret",
      pattern: "AF_{ENV}_{SERVICE}_{KEY}",
      example: "AF_PROD_API_OPENAI",
      notes: "密钥按环境独立轮换",
    },
  ],
  guardrails: [
    "禁止跨环境共享数据库与密钥",
    "staging 与 prod 需独立监控与告警",
    "所有环境必须启用审计日志",
  ],
};

// ============================================
// 部署流水线与灰度策略
// ============================================

export interface DeploymentPipelineStage {
  id: string;
  name: string;
  owner: string;
  duration: string;
  gates: string[];
  outputs: string[];
}

export interface CanaryTrafficStep {
  id: string;
  label: string;
  traffic: number;
  duration: string;
  successCriteria: string;
  rollback: string;
}

export interface CanaryMetric {
  id: string;
  name: string;
  threshold: string;
  window: string;
}

export interface DeploymentPipelineStrategy {
  title: string;
  description: string;
  lastUpdated: string;
  toolchain: string[];
  triggers: string[];
  stages: DeploymentPipelineStage[];
  canary: {
    trafficSteps: CanaryTrafficStep[];
    metrics: CanaryMetric[];
    autoRollback: string[];
    manualApproval: string;
    freezeRules: string[];
  };
}

export const deploymentPipelineStrategy: DeploymentPipelineStrategy = {
  title: "部署流水线与灰度策略",
  description: "标准化从代码提交到全量发布的流程，保障可回滚与可追踪。",
  lastUpdated: "2026-02-02T12:20:00Z",
  toolchain: ["GitHub Actions", "Argo CD", "Kubernetes", "Terraform"],
  triggers: ["main 分支合并", "hotfix 标记", "紧急安全修复"],
  stages: [
    {
      id: "stage-build",
      name: "构建与单测",
      owner: "平台 CI",
      duration: "10-15 分钟",
      gates: ["单测通过", "依赖安全扫描"],
      outputs: ["可部署镜像", "SBOM 报告"],
    },
    {
      id: "stage-verify",
      name: "集成验证",
      owner: "QA/平台",
      duration: "20 分钟",
      gates: ["契约测试通过", "关键接口 P95 < 1.5s"],
      outputs: ["验收报告", "变更日志"],
    },
    {
      id: "stage-staging",
      name: "预发布部署",
      owner: "SRE",
      duration: "30 分钟",
      gates: ["Smoke test 通过", "灰度开关可控"],
      outputs: ["可灰度版本", "回滚点"],
    },
    {
      id: "stage-canary",
      name: "灰度发布",
      owner: "产品负责人",
      duration: "2-6 小时",
      gates: ["错误率 < 0.5%", "P95 < 2s", "用户投诉 = 0"],
      outputs: ["灰度指标", "放量建议"],
    },
    {
      id: "stage-full",
      name: "全量发布",
      owner: "SRE",
      duration: "1 小时",
      gates: ["灰度指标达标", "值班确认"],
      outputs: ["发布记录", "监控告警基线"],
    },
  ],
  canary: {
    trafficSteps: [
      {
        id: "canary-5",
        label: "Canary 5%",
        traffic: 5,
        duration: "2 小时",
        successCriteria: "错误率 < 0.5% 且 P95 < 2s",
        rollback: "自动回滚至上一稳定版本",
      },
      {
        id: "canary-20",
        label: "Beta 20%",
        traffic: 20,
        duration: "6 小时",
        successCriteria: "无 P1/P2 告警",
        rollback: "回滚并锁定发布窗",
      },
      {
        id: "canary-50",
        label: "Ramp 50%",
        traffic: 50,
        duration: "12 小时",
        successCriteria: "关键转化不下降 > 1%",
        rollback: "回滚并触发问题复盘",
      },
      {
        id: "canary-100",
        label: "Stable 100%",
        traffic: 100,
        duration: "24 小时",
        successCriteria: "监控阈值稳定",
        rollback: "保留回滚窗口 30 分钟",
      },
    ],
    metrics: [
      {
        id: "metric-error",
        name: "错误率",
        threshold: "< 0.5%",
        window: "5 分钟滑窗",
      },
      {
        id: "metric-latency",
        name: "P95 延迟",
        threshold: "< 2s",
        window: "10 分钟滑窗",
      },
      {
        id: "metric-conversion",
        name: "关键转化",
        threshold: ">= 99% 基线",
        window: "2 小时",
      },
      {
        id: "metric-slo",
        name: "SLO 预算",
        threshold: "消耗 < 5%",
        window: "24 小时",
      },
    ],
    autoRollback: [
      "错误率连续 10 分钟 > 1%",
      "P95 延迟持续 15 分钟 > 3s",
      "触发 P1/P2 告警",
    ],
    manualApproval: "灰度阶段放量需产品负责人 + 值班 SRE 确认",
    freezeRules: ["月末冻结期仅允许 hotfix", "重大活动前 48 小时禁止放量"],
  },
};
