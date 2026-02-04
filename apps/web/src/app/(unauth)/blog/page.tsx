"use client";

/**
 * 博客列表页面 - 博客文章列表
 * Manus 风格：极简、大留白、流畅动效
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  User,
  ArrowRight,
  Search,
  Tag,
  Calendar,
  TrendingUp,
  Sparkles,
  Zap,
  Users,
  Eye,
  Heart,
  MessageSquare,
  Flame,
  Award,
  Lightbulb,
  Code2,
  Rocket,
  Shield,
  Globe,
  BarChart3,
  FileText,
  Video,
  Podcast,
  Trophy,
  Star,
  ThumbsUp,
  Vote,
  Brain,
  CalendarDays,
  MapPin,
  Activity,
  ChevronRight,
  RefreshCw,
  Gift,
  Target,
  Mic,
  GraduationCap,
  HelpCircle,
  Terminal,
  Headphones,
  PieChart,
  Bookmark,
  Share2,
  Copy,
  Check,
  PlayCircle,
  Quote,
  Layers,
  Compass,
  BadgeCheck,
  Medal,
  Puzzle,
  BookMarked,
  Calculator,
  Wrench,
  Link2,
  Hash,
  CircleHelp,
  Timer,
  Percent,
  Crown,
  Gem,
  Swords,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// 博客分类
const categories = [
  { name: "全部", slug: "all", icon: Globe, count: 24 },
  { name: "产品更新", slug: "product", icon: Rocket, count: 6 },
  { name: "技术深度", slug: "tech", icon: Code2, count: 5 },
  { name: "使用技巧", slug: "tips", icon: Lightbulb, count: 4 },
  { name: "案例研究", slug: "case-study", icon: Award, count: 4 },
  { name: "行业洞察", slug: "industry", icon: BarChart3, count: 3 },
  { name: "安全合规", slug: "security", icon: Shield, count: 2 },
];

// 内容类型标签
const contentTypes = [
  { name: "文章", icon: FileText, slug: "article" },
  { name: "视频", icon: Video, slug: "video" },
  { name: "播客", icon: Podcast, slug: "podcast" },
];

// 热门标签
const trendingTags = [
  { name: "AI Agent", count: 12, hot: true },
  { name: "工作流自动化", count: 8, hot: true },
  { name: "多模态", count: 6, hot: false },
  { name: "企业版", count: 5, hot: false },
  { name: "API 集成", count: 4, hot: false },
  { name: "低代码", count: 4, hot: false },
  { name: "数据处理", count: 3, hot: false },
  { name: "团队协作", count: 3, hot: false },
];

// 系列专栏
const blogSeries = [
  {
    id: "ai-fundamentals",
    title: "AI 基础入门系列",
    description: "从零开始了解 AI 工作流，适合新手用户",
    articles: 8,
    totalReadTime: "45 分钟",
    level: "入门",
    color: "emerald",
    icon: Lightbulb,
  },
  {
    id: "enterprise-guide",
    title: "企业级部署指南",
    description: "安全、合规、高可用的企业级最佳实践",
    articles: 6,
    totalReadTime: "60 分钟",
    level: "高级",
    color: "purple",
    icon: Shield,
  },
  {
    id: "integration-mastery",
    title: "集成大师养成",
    description: "掌握 50+ 主流应用集成技巧",
    articles: 12,
    totalReadTime: "90 分钟",
    level: "中级",
    color: "blue",
    icon: Globe,
  },
  {
    id: "automation-patterns",
    title: "自动化设计模式",
    description: "经典自动化场景的解决方案模式",
    articles: 10,
    totalReadTime: "75 分钟",
    level: "中级",
    color: "orange",
    icon: Code2,
  },
];

// 即将举办的网络研讨会
const upcomingWebinars = [
  {
    id: "webinar-1",
    title: "AI Agent 3.0 预览：下一代智能工作流",
    date: "2026-02-05",
    time: "14:00 CST",
    speaker: "张明",
    speakerRole: "首席产品官",
    registrations: 1280,
    isLive: false,
  },
  {
    id: "webinar-2",
    title: "实战：30 分钟搭建智能客服系统",
    date: "2026-02-12",
    time: "15:00 CST",
    speaker: "李薇",
    speakerRole: "技术总监",
    registrations: 856,
    isLive: false,
  },
  {
    id: "webinar-3",
    title: "企业自动化转型：从 0 到 1 的方法论",
    date: "2026-02-20",
    time: "10:00 CST",
    speaker: "陈晓",
    speakerRole: "解决方案架构师",
    registrations: 642,
    isLive: false,
  },
];

// 免费资源下载
const downloadableResources = [
  {
    id: "ebook-automation",
    title: "2026 工作流自动化白皮书",
    type: "电子书",
    format: "PDF",
    pages: 48,
    downloads: 12500,
    icon: FileText,
  },
  {
    id: "template-pack",
    title: "50+ 高效工作流模板包",
    type: "模板包",
    format: "ZIP",
    templates: 50,
    downloads: 8900,
    icon: Rocket,
  },
  {
    id: "checklist-security",
    title: "企业安全合规检查清单",
    type: "清单",
    format: "PDF",
    items: 120,
    downloads: 5600,
    icon: Shield,
  },
  {
    id: "integration-guide",
    title: "API 集成开发者指南",
    type: "指南",
    format: "PDF",
    pages: 86,
    downloads: 7200,
    icon: Code2,
  },
];

// 社区精选
const communityHighlights = [
  {
    id: "community-1",
    title: "我如何用 AgentFlow 自动化了整个营销团队的工作流程",
    author: "David Chen",
    authorCompany: "某电商公司",
    likes: 342,
    comments: 67,
    avatar: null,
  },
  {
    id: "community-2",
    title: "分享：用 AI Agent 每天节省 3 小时数据处理时间",
    author: "Sarah Liu",
    authorCompany: "数据分析师",
    likes: 289,
    comments: 45,
    avatar: null,
  },
  {
    id: "community-3",
    title: "从零到一：我的第一个智能客服机器人搭建心得",
    author: "Michael Wang",
    authorCompany: "SaaS 创业者",
    likes: 256,
    comments: 38,
    avatar: null,
  },
];

// 读者评价
const testimonials = [
  {
    quote: "AgentFlow 的博客是我学习工作流自动化的首选资源，内容深入且实用。",
    author: "李明",
    role: "技术负责人 @ 某科技公司",
    avatar: null,
  },
  {
    quote: "每周必读的 Newsletter，帮助我保持对 AI 行业趋势的了解。",
    author: "张晓",
    role: "产品经理 @ 某互联网企业",
    avatar: null,
  },
  {
    quote: "案例研究非常有参考价值，帮助我们快速落地了自动化项目。",
    author: "王浩",
    role: "运营总监 @ 某电商平台",
    avatar: null,
  },
];

// 本周热点
const weeklyHighlights = {
  weekNumber: 5,
  year: 2026,
  topPosts: [
    { id: "ai-agent-2-release", rank: 1, trend: "up", changePercent: 45 },
    { id: "llm-comparison-2026", rank: 2, trend: "new", changePercent: 0 },
    { id: "workflow-best-practices", rank: 3, trend: "up", changePercent: 12 },
  ],
  totalViews: 125000,
  newSubscribers: 890,
  hotTopic: "AI Agent 2.0",
};

// 最新评论
const latestComments = [
  {
    id: "comment-1",
    postId: "ai-agent-2-release",
    postTitle: "AI Agent 2.0 正式发布",
    author: "技术小白",
    content: "终于等到了！多模型支持太棒了，期待更多集成功能。",
    time: "10 分钟前",
    likes: 23,
  },
  {
    id: "comment-2",
    postId: "workflow-best-practices",
    postTitle: "工作流设计最佳实践",
    author: "自动化爱好者",
    content: "错误处理那部分讲得特别好，已经应用到我的项目中了。",
    time: "32 分钟前",
    likes: 15,
  },
  {
    id: "comment-3",
    postId: "llm-comparison-2026",
    postTitle: "2026 大语言模型对比评测",
    author: "AI研究员小王",
    content: "非常详细的评测，能否增加一些性价比分析？",
    time: "1 小时前",
    likes: 8,
  },
  {
    id: "comment-4",
    postId: "ecommerce-automation",
    postTitle: "电商自动化全攻略",
    author: "电商运营者",
    content: "库存同步这块帮我省了很多人工，感谢分享！",
    time: "2 小时前",
    likes: 31,
  },
];

// 合作伙伴内容
const partnerContent = [
  {
    id: "partner-1",
    title: "如何用 OpenAI API 构建智能工作流",
    partner: "OpenAI",
    partnerLogo: null,
    type: "联合发布",
    date: "2026-01-28",
    featured: true,
  },
  {
    id: "partner-2",
    title: "Slack + AgentFlow：团队效率提升 200% 的秘诀",
    partner: "Slack",
    partnerLogo: null,
    type: "合作案例",
    date: "2026-01-22",
    featured: false,
  },
  {
    id: "partner-3",
    title: "云原生自动化：AWS Lambda 与 AgentFlow 最佳实践",
    partner: "AWS",
    partnerLogo: null,
    type: "技术指南",
    date: "2026-01-18",
    featured: false,
  },
];

// 知识图谱主题
const knowledgeTopics = [
  { name: "入门指南", count: 15, level: 1, related: ["基础概念", "快速开始"] },
  { name: "工作流设计", count: 28, level: 2, related: ["节点", "触发器", "条件"] },
  { name: "AI 集成", count: 32, level: 3, related: ["LLM", "多模态", "提示词"] },
  { name: "企业应用", count: 18, level: 2, related: ["安全", "合规", "扩展"] },
  { name: "行业方案", count: 24, level: 2, related: ["电商", "金融", "医疗"] },
  { name: "开发者", count: 20, level: 3, related: ["API", "SDK", "Webhook"] },
];

// 阅读挑战
const readingChallenge = {
  title: "2026 年 Q1 阅读挑战",
  target: 12,
  current: 8,
  participants: 3240,
  endDate: "2026-03-31",
  rewards: ["专属徽章", "高级模板", "优先支持"],
};

// 里程碑
const milestones = [
  { label: "创立", value: "2023", icon: Rocket },
  { label: "首篇文章", value: "2023.06", icon: FileText },
  { label: "10K 订阅", value: "2024.03", icon: Users },
  { label: "100 万阅读", value: "2024.12", icon: Eye },
  { label: "今天", value: "2M+", icon: Heart },
];

// 行业奖项与认可
const awardsRecognition = [
  {
    id: "award-1",
    title: "最佳 AI 自动化平台",
    organization: "AI Excellence Awards",
    year: "2025",
    badge: "gold",
  },
  {
    id: "award-2",
    title: "年度最佳技术博客",
    organization: "Tech Blog Awards",
    year: "2025",
    badge: "winner",
  },
  {
    id: "award-3",
    title: "开发者首选工具 Top 10",
    organization: "Developer Survey",
    year: "2026",
    badge: "top10",
  },
  {
    id: "award-4",
    title: "内容营销卓越奖",
    organization: "Content Marketing Institute",
    year: "2025",
    badge: "excellence",
  },
];

// 快速技巧 / 你知道吗
const quickTips = [
  {
    id: "tip-1",
    tip: "使用变量存储 API 响应可以让后续节点轻松访问数据",
    category: "工作流设计",
    difficulty: "入门",
  },
  {
    id: "tip-2",
    tip: "设置合理的超时时间可以防止工作流因单个节点卡住而失败",
    category: "性能优化",
    difficulty: "中级",
  },
  {
    id: "tip-3",
    tip: "使用条件分支前先用 Console 节点打印变量值，便于调试",
    category: "调试技巧",
    difficulty: "入门",
  },
  {
    id: "tip-4",
    tip: "批量处理数据时使用 Loop 节点比多次触发工作流更高效",
    category: "性能优化",
    difficulty: "高级",
  },
  {
    id: "tip-5",
    tip: "为关键工作流设置失败通知，第一时间发现并解决问题",
    category: "监控运维",
    difficulty: "中级",
  },
];

// 互动投票
const currentPoll = {
  id: "poll-2026-01",
  question: "您最期待 AgentFlow 下一版本增加哪个功能？",
  options: [
    { id: "opt-1", text: "更多 AI 模型支持", votes: 1245, percentage: 35 },
    { id: "opt-2", text: "可视化工作流调试器", votes: 1067, percentage: 30 },
    { id: "opt-3", text: "团队协作增强", votes: 712, percentage: 20 },
    { id: "opt-4", text: "移动端 App", votes: 534, percentage: 15 },
  ],
  totalVotes: 3558,
  endDate: "2026-02-15",
  hasVoted: false,
};

// AI 推荐阅读
const aiRecommendations = [
  {
    id: "rec-1",
    title: "根据您的阅读历史",
    description: "您可能对这些高级主题感兴趣",
    articles: ["api-rate-limiting", "error-handling-patterns", "webhook-advanced-patterns"],
  },
  {
    id: "rec-2",
    title: "新手必读",
    description: "从这些文章开始您的自动化之旅",
    articles: ["workflow-best-practices", "slack-integration-guide", "ai-customer-service-guide"],
  },
  {
    id: "rec-3",
    title: "本周编辑推荐",
    description: "编辑团队精心挑选的优质内容",
    articles: ["ai-agent-2-release", "multimodal-ai-workflows", "llm-comparison-2026"],
  },
];

// 即将举行的活动
const upcomingEvents = [
  {
    id: "event-1",
    title: "AgentFlow 用户大会 2026",
    type: "线下活动",
    date: "2026-03-15",
    location: "上海",
    registrations: 500,
    capacity: 800,
  },
  {
    id: "event-2",
    title: "AI 工作流黑客松",
    type: "线上活动",
    date: "2026-02-28",
    location: "线上",
    registrations: 1200,
    capacity: 2000,
  },
  {
    id: "event-3",
    title: "企业自动化沙龙 - 北京站",
    type: "线下活动",
    date: "2026-02-20",
    location: "北京",
    registrations: 120,
    capacity: 150,
  },
];

// 实时活动流
const liveActivityFeed = [
  { type: "comment", user: "用户A", action: "评论了", target: "AI Agent 2.0 发布", time: "刚刚" },
  { type: "like", user: "用户B", action: "点赞了", target: "工作流最佳实践", time: "2分钟前" },
  { type: "share", user: "用户C", action: "分享了", target: "企业自动化趋势", time: "5分钟前" },
  { type: "subscribe", user: "用户D", action: "订阅了", target: "Newsletter", time: "8分钟前" },
  { type: "comment", user: "用户E", action: "评论了", target: "Slack 集成指南", time: "12分钟前" },
];

// 学习路径
const learningPaths = [
  {
    id: "path-beginner",
    title: "零基础入门",
    description: "从零开始学习工作流自动化，适合完全没有经验的新手",
    duration: "2 周",
    articles: 12,
    difficulty: "入门",
    color: "emerald",
    icon: GraduationCap,
    progress: 0,
    steps: ["了解基础概念", "创建第一个工作流", "使用常用节点", "调试与优化"],
  },
  {
    id: "path-developer",
    title: "开发者进阶",
    description: "掌握 API 集成、Webhook、自定义函数等高级技巧",
    duration: "4 周",
    articles: 24,
    difficulty: "高级",
    color: "purple",
    icon: Code2,
    progress: 0,
    steps: ["API 集成基础", "Webhook 处理", "自定义函数", "性能优化"],
  },
  {
    id: "path-enterprise",
    title: "企业级部署",
    description: "学习安全、合规、高可用等企业级最佳实践",
    duration: "3 周",
    articles: 18,
    difficulty: "高级",
    color: "blue",
    icon: Shield,
    progress: 0,
    steps: ["安全策略", "权限管理", "审计日志", "灾备方案"],
  },
  {
    id: "path-ai",
    title: "AI 能力精通",
    description: "深入学习 AI 模型集成、提示词工程、多模态处理",
    duration: "3 周",
    articles: 20,
    difficulty: "高级",
    color: "pink",
    icon: Brain,
    progress: 0,
    steps: ["LLM 基础", "提示词工程", "多模态集成", "AI 工作流设计"],
  },
];

// 热门问答
const popularFAQs = [
  {
    id: "faq-1",
    question: "如何处理工作流执行超时问题？",
    answer: "可以通过设置节点超时时间、使用异步执行模式、或将长任务拆分为多个子工作流来解决。",
    votes: 342,
    views: 8500,
    tags: ["性能", "调试"],
  },
  {
    id: "faq-2",
    question: "API 调用失败后如何自动重试？",
    answer: "在节点设置中启用重试机制，配置重试次数和间隔时间。建议使用指数退避策略。",
    votes: 289,
    views: 7200,
    tags: ["API", "错误处理"],
  },
  {
    id: "faq-3",
    question: "如何在工作流之间共享数据？",
    answer: "可以使用全局变量、数据库存储、或通过 Webhook 触发并传递参数来实现数据共享。",
    votes: 256,
    views: 6800,
    tags: ["数据", "架构"],
  },
  {
    id: "faq-4",
    question: "免费版和付费版有什么区别？",
    answer: "免费版支持基础功能和有限的执行次数，付费版提供更多集成、更高配额和优先支持。",
    votes: 234,
    views: 9200,
    tags: ["定价", "功能"],
  },
];

// 代码片段库
const codeSnippets = [
  {
    id: "snippet-1",
    title: "HTTP 请求带重试",
    description: "发送 HTTP 请求并在失败时自动重试",
    language: "javascript",
    code: `async function fetchWithRetry(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}`,
    copies: 1245,
    category: "API 集成",
  },
  {
    id: "snippet-2",
    title: "数据格式转换",
    description: "将 CSV 数据转换为 JSON 格式",
    language: "javascript",
    code: `function csvToJson(csv) {
  const lines = csv.split('\\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return headers.reduce((obj, h, i) => {
      obj[h.trim()] = values[i]?.trim();
      return obj;
    }, {});
  });
}`,
    copies: 892,
    category: "数据处理",
  },
  {
    id: "snippet-3",
    title: "Slack 消息发送",
    description: "发送格式化的 Slack 通知消息",
    language: "javascript",
    code: `async function sendSlackMessage(webhookUrl, message) {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blocks: [{
        type: 'section',
        text: { type: 'mrkdwn', text: message }
      }]
    })
  });
}`,
    copies: 756,
    category: "集成",
  },
];

// 专家访谈预告
const expertInterviews = [
  {
    id: "interview-1",
    guest: "Sam Altman",
    title: "OpenAI CEO",
    topic: "AI 工作流的未来：从自动化到智能化",
    date: "2026-02-10",
    duration: "45 分钟",
    status: "upcoming",
    avatar: null,
  },
  {
    id: "interview-2",
    guest: "Satya Nadella",
    title: "Microsoft CEO",
    topic: "企业 AI 转型：挑战与机遇",
    date: "2026-02-18",
    duration: "60 分钟",
    status: "upcoming",
    avatar: null,
  },
  {
    id: "interview-3",
    guest: "吴恩达",
    title: "AI 教育家",
    topic: "如何培养 AI 时代的自动化人才",
    date: "2026-01-20",
    duration: "50 分钟",
    status: "released",
    avatar: null,
  },
];

// 行业报告
const industryReports = [
  {
    id: "report-1",
    title: "2026 企业自动化趋势报告",
    description: "深度分析 500+ 企业的自动化实践，揭示最新趋势",
    pages: 86,
    downloads: 12500,
    publishDate: "2026-01",
    featured: true,
  },
  {
    id: "report-2",
    title: "AI 工作流 ROI 研究",
    description: "量化分析 AI 工作流带来的投资回报",
    pages: 42,
    downloads: 8900,
    publishDate: "2025-12",
    featured: false,
  },
  {
    id: "report-3",
    title: "低代码自动化市场洞察",
    description: "全球低代码自动化市场规模与竞争格局",
    pages: 68,
    downloads: 6700,
    publishDate: "2025-11",
    featured: false,
  },
];

// 每日一读
const dailyReading = {
  id: "daily-2026-01-31",
  title: "构建可维护的工作流：命名规范与文档最佳实践",
  excerpt: "良好的命名和文档是工作流长期可维护性的关键。本文分享我们团队的命名约定和文档模板。",
  author: "李薇",
  readTime: "6 分钟",
  category: "最佳实践",
  reason: "适合所有级别的用户，帮助建立良好习惯",
};

// 书签收藏集
const curatedCollections = [
  {
    id: "collection-1",
    title: "新手必看 10 篇",
    description: "精选的入门必读文章",
    articleCount: 10,
    followers: 3240,
    curator: "编辑部",
  },
  {
    id: "collection-2",
    title: "API 集成精选",
    description: "最受欢迎的 API 集成教程",
    articleCount: 15,
    followers: 2890,
    curator: "王浩",
  },
  {
    id: "collection-3",
    title: "效率提升秘籍",
    description: "让工作效率翻倍的技巧集合",
    articleCount: 12,
    followers: 2560,
    curator: "张明",
  },
];

// 成就徽章系统
const achievementBadges = [
  {
    id: "badge-1",
    name: "初学者",
    description: "阅读第一篇文章",
    icon: Medal,
    color: "bronze",
    earned: true,
    earnedDate: "2026-01-15",
  },
  {
    id: "badge-2",
    name: "探索者",
    description: "阅读 10 篇不同分类的文章",
    icon: Compass,
    color: "silver",
    earned: true,
    earnedDate: "2026-01-20",
  },
  {
    id: "badge-3",
    name: "知识达人",
    description: "完成一个学习路径",
    icon: GraduationCap,
    color: "gold",
    earned: false,
    progress: 75,
  },
  {
    id: "badge-4",
    name: "社区贡献者",
    description: "发表 5 条有价值的评论",
    icon: MessageSquare,
    color: "purple",
    earned: false,
    progress: 60,
  },
  {
    id: "badge-5",
    name: "收藏家",
    description: "收藏 20 篇文章",
    icon: Bookmark,
    color: "blue",
    earned: true,
    earnedDate: "2026-01-25",
  },
  {
    id: "badge-6",
    name: "挑战冠军",
    description: "完成阅读挑战",
    icon: Crown,
    color: "rainbow",
    earned: false,
    progress: 67,
  },
];

// 知识测验
const knowledgeQuizzes = [
  {
    id: "quiz-1",
    title: "工作流基础测验",
    questions: 10,
    duration: "5 分钟",
    difficulty: "入门",
    completions: 3420,
    avgScore: 85,
    badge: "工作流新手",
  },
  {
    id: "quiz-2",
    title: "API 集成能力测试",
    questions: 15,
    duration: "10 分钟",
    difficulty: "中级",
    completions: 1890,
    avgScore: 72,
    badge: "集成专家",
  },
  {
    id: "quiz-3",
    title: "AI Agent 高级认证",
    questions: 20,
    duration: "15 分钟",
    difficulty: "高级",
    completions: 980,
    avgScore: 68,
    badge: "AI 大师",
  },
];

// 术语词典
const glossaryTerms = [
  {
    term: "工作流 (Workflow)",
    definition: "一系列自动化步骤的集合，用于完成特定任务或业务流程",
    category: "基础概念",
  },
  {
    term: "触发器 (Trigger)",
    definition: "启动工作流执行的事件或条件，如定时触发、Webhook 触发等",
    category: "基础概念",
  },
  {
    term: "节点 (Node)",
    definition: "工作流中的单个执行单元，执行特定的操作或逻辑",
    category: "基础概念",
  },
  {
    term: "AI Agent",
    definition: "具有自主决策能力的 AI 组件，可以理解意图并执行复杂任务",
    category: "AI 相关",
  },
  {
    term: "Webhook",
    definition: "一种 HTTP 回调机制，允许外部系统实时通知您的应用程序",
    category: "集成",
  },
  {
    term: "幂等性 (Idempotency)",
    definition: "多次执行同一操作产生相同结果的特性，对于重试机制很重要",
    category: "高级概念",
  },
];

// ROI 计算器预设
const roiCalculatorPresets = [
  {
    id: "preset-1",
    name: "小型团队",
    manualHours: 40,
    automatedHours: 8,
    hourlyRate: 150,
    monthlyTasks: 200,
  },
  {
    id: "preset-2",
    name: "中型企业",
    manualHours: 120,
    automatedHours: 15,
    hourlyRate: 200,
    monthlyTasks: 800,
  },
  {
    id: "preset-3",
    name: "大型企业",
    manualHours: 500,
    automatedHours: 40,
    hourlyRate: 250,
    monthlyTasks: 5000,
  },
];

// 推荐工具
const recommendedTools = [
  {
    id: "tool-1",
    name: "Postman",
    description: "API 测试和开发工具",
    category: "开发工具",
    url: "https://postman.com",
    icon: "🔧",
  },
  {
    id: "tool-2",
    name: "JSON Formatter",
    description: "JSON 格式化和验证",
    category: "实用工具",
    url: "#",
    icon: "📝",
  },
  {
    id: "tool-3",
    name: "Cron Expression Generator",
    description: "定时表达式生成器",
    category: "实用工具",
    url: "#",
    icon: "⏰",
  },
  {
    id: "tool-4",
    name: "Regex101",
    description: "正则表达式测试工具",
    category: "开发工具",
    url: "https://regex101.com",
    icon: "🔍",
  },
];

// 热门集成
const popularIntegrations = [
  { name: "Slack", category: "协作", users: 12500, growth: "+25%" },
  { name: "GitHub", category: "开发", users: 9800, growth: "+18%" },
  { name: "Google Sheets", category: "数据", users: 8900, growth: "+32%" },
  { name: "Notion", category: "文档", users: 7600, growth: "+45%" },
  { name: "Salesforce", category: "CRM", users: 6200, growth: "+15%" },
  { name: "Jira", category: "项目管理", users: 5800, growth: "+22%" },
];

// 阅读进度追踪
const readingProgress = {
  totalArticles: 240,
  readArticles: 42,
  savedArticles: 18,
  streak: 7,
  lastRead: "2026-01-30",
  thisWeek: 5,
  monthlyGoal: 20,
  monthlyProgress: 15,
};

// 统计数据
const stats = [
  { label: "文章总数", value: "240+", icon: FileText },
  { label: "月活读者", value: "50K+", icon: Users },
  { label: "总阅读量", value: "2M+", icon: Eye },
  { label: "订阅用户", value: "12K+", icon: Heart },
];

// 作者团队
const authors = [
  {
    name: "张明",
    role: "首席产品官",
    avatar: null,
    articles: 28,
    specialty: "产品战略",
  },
  {
    name: "李薇",
    role: "技术总监",
    avatar: null,
    articles: 35,
    specialty: "系统架构",
  },
  {
    name: "王浩",
    role: "AI 研究员",
    avatar: null,
    articles: 22,
    specialty: "机器学习",
  },
  {
    name: "陈晓",
    role: "解决方案架构师",
    avatar: null,
    articles: 19,
    specialty: "企业集成",
  },
];

// 博客文章 - 丰富的内容
const blogPosts = [
  {
    id: "ai-agent-2-release",
    title: "AI Agent 2.0 正式发布：更智能的工作流自动化",
    excerpt: "我们很高兴地宣布 AI Agent 2.0 的正式发布，带来了更强大的自然语言理解能力、多模型支持和智能推荐功能。",
    category: "product",
    author: "张明",
    authorRole: "首席产品官",
    date: "2026-01-25",
    readTime: "5 分钟",
    featured: true,
    image: null,
    views: 12500,
    likes: 486,
    comments: 89,
    tags: ["AI Agent", "产品更新", "新功能"],
    contentType: "article",
  },
  {
    id: "workflow-best-practices",
    title: "工作流设计最佳实践：从入门到精通",
    excerpt: "本文将分享我们在帮助数千位用户构建工作流过程中总结的最佳实践，帮助您设计更高效、更可靠的自动化流程。",
    category: "tips",
    author: "李薇",
    authorRole: "技术总监",
    date: "2026-01-20",
    readTime: "8 分钟",
    featured: true,
    image: null,
    views: 9800,
    likes: 352,
    comments: 67,
    tags: ["最佳实践", "工作流设计", "教程"],
    contentType: "article",
  },
  {
    id: "multimodal-ai-workflows",
    title: "多模态 AI 工作流：图像、语音与文本的无缝集成",
    excerpt: "探索如何在单一工作流中整合视觉识别、语音转写和自然语言处理，打造真正智能的自动化解决方案。",
    category: "tech",
    author: "王浩",
    authorRole: "AI 研究员",
    date: "2026-01-22",
    readTime: "12 分钟",
    featured: true,
    image: null,
    views: 8200,
    likes: 298,
    comments: 45,
    tags: ["多模态AI", "图像识别", "语音处理"],
    contentType: "article",
  },
  {
    id: "enterprise-automation-trends",
    title: "2026 企业自动化趋势：AI 驱动的工作流革命",
    excerpt: "探索 2026 年企业自动化的最新趋势，了解 AI 如何重塑企业工作流程和提升运营效率。",
    category: "industry",
    author: "陈晓",
    authorRole: "解决方案架构师",
    date: "2026-01-15",
    readTime: "10 分钟",
    featured: false,
    image: null,
    views: 7600,
    likes: 245,
    comments: 38,
    tags: ["企业自动化", "行业趋势", "2026"],
    contentType: "article",
  },
  {
    id: "slack-integration-guide",
    title: "Slack 集成完全指南：打造高效团队协作",
    excerpt: "详细介绍如何将 AgentFlow 与 Slack 深度集成，实现消息自动化、工作流触发和团队协作。",
    category: "tips",
    author: "李薇",
    authorRole: "技术总监",
    date: "2026-01-10",
    readTime: "6 分钟",
    featured: false,
    image: null,
    views: 5400,
    likes: 198,
    comments: 32,
    tags: ["Slack", "集成", "团队协作"],
    contentType: "article",
  },
  {
    id: "customer-story-startup",
    title: "客户故事：某科技初创公司如何将AgentFlow 节省 80% 重复工作",
    excerpt: "了解某科技初创公司如何使用 AgentFlow 自动化客户支持、数据同步和内部流程，大幅提升团队效率。",
    category: "case-study",
    author: "陈晓",
    authorRole: "解决方案架构师",
    date: "2026-01-05",
    readTime: "7 分钟",
    featured: false,
    image: null,
    views: 6200,
    likes: 276,
    comments: 41,
    tags: ["客户案例", "初创公司", "效率提升"],
    contentType: "article",
  },
  {
    id: "error-handling-patterns",
    title: "工作流错误处理模式：确保自动化的可靠性",
    excerpt: "深入探讨工作流中的错误处理策略，包括重试机制、降级处理和告警通知，确保您的自动化流程稳定运行。",
    category: "tech",
    author: "李薇",
    authorRole: "技术总监",
    date: "2025-12-28",
    readTime: "9 分钟",
    featured: false,
    image: null,
    views: 4800,
    likes: 187,
    comments: 29,
    tags: ["错误处理", "可靠性", "监控"],
    contentType: "article",
  },
  {
    id: "api-rate-limiting",
    title: "API 速率限制与优化：让您的工作流更高效",
    excerpt: "了解如何优化工作流中的 API 调用，处理速率限制，并实现高效的数据处理。",
    category: "tech",
    author: "王浩",
    authorRole: "AI 研究员",
    date: "2025-12-20",
    readTime: "7 分钟",
    featured: false,
    image: null,
    views: 3900,
    likes: 156,
    comments: 24,
    tags: ["API", "性能优化", "速率限制"],
    contentType: "article",
  },
  {
    id: "december-product-update",
    title: "12 月产品更新：新增 20+ 集成和性能优化",
    excerpt: "回顾 12 月的产品更新，包括新增的集成、性能提升和用户体验改进。",
    category: "product",
    author: "张明",
    authorRole: "首席产品官",
    date: "2025-12-15",
    readTime: "4 分钟",
    featured: false,
    image: null,
    views: 5100,
    likes: 203,
    comments: 35,
    tags: ["产品更新", "集成", "性能"],
    contentType: "article",
  },
  {
    id: "security-compliance-guide",
    title: "企业安全合规指南：SOC 2、GDPR 与数据保护",
    excerpt: "全面解析 AgentFlow 如何帮助企业满足 SOC 2、GDPR 等合规要求，保护敏感数据安全。",
    category: "security",
    author: "陈晓",
    authorRole: "解决方案架构师",
    date: "2025-12-12",
    readTime: "11 分钟",
    featured: false,
    image: null,
    views: 4200,
    likes: 178,
    comments: 27,
    tags: ["安全", "合规", "GDPR", "SOC 2"],
    contentType: "article",
  },
  {
    id: "llm-comparison-2026",
    title: "2026 大语言模型对比评测：GPT-5、Claude 4、Gemini Pro",
    excerpt: "我们对主流大语言模型进行了全面评测，涵盖推理能力、代码生成、多语言支持等多个维度。",
    category: "tech",
    author: "王浩",
    authorRole: "AI 研究员",
    date: "2025-12-08",
    readTime: "15 分钟",
    featured: false,
    image: null,
    views: 11200,
    likes: 567,
    comments: 98,
    tags: ["LLM", "评测", "GPT-5", "Claude 4"],
    contentType: "article",
  },
  {
    id: "fintech-automation-case",
    title: "金融科技案例：银行如何用 AI 工作流处理百万级交易",
    excerpt: "深入了解某大型银行如何利用 AgentFlow 实现交易风控、客户服务和报表自动化。",
    category: "case-study",
    author: "陈晓",
    authorRole: "解决方案架构师",
    date: "2025-12-05",
    readTime: "9 分钟",
    featured: false,
    image: null,
    views: 7800,
    likes: 342,
    comments: 56,
    tags: ["金融科技", "银行", "风控"],
    contentType: "article",
  },
  {
    id: "no-code-vs-low-code",
    title: "无代码 vs 低代码：哪种方案更适合你的团队？",
    excerpt: "深入分析无代码和低代码平台的优缺点，帮助你为团队选择最适合的自动化方案。",
    category: "industry",
    author: "张明",
    authorRole: "首席产品官",
    date: "2025-12-01",
    readTime: "8 分钟",
    featured: false,
    image: null,
    views: 6500,
    likes: 289,
    comments: 47,
    tags: ["无代码", "低代码", "选型"],
    contentType: "article",
  },
  {
    id: "webhook-advanced-patterns",
    title: "Webhook 高级模式：实时数据同步与事件驱动架构",
    excerpt: "掌握 Webhook 的高级用法，构建响应迅速、可靠性高的事件驱动自动化系统。",
    category: "tech",
    author: "李薇",
    authorRole: "技术总监",
    date: "2025-11-28",
    readTime: "10 分钟",
    featured: false,
    image: null,
    views: 4100,
    likes: 167,
    comments: 23,
    tags: ["Webhook", "事件驱动", "实时同步"],
    contentType: "article",
  },
  {
    id: "ai-customer-service-guide",
    title: "AI 客服工作流搭建指南：7¥24 智能响应",
    excerpt: "从零开始搭建智能客服系统，实现自动分类、智能回复和人工转接的完美配合。",
    category: "tips",
    author: "陈晓",
    authorRole: "解决方案架构师",
    date: "2025-11-25",
    readTime: "12 分钟",
    featured: false,
    image: null,
    views: 8900,
    likes: 412,
    comments: 73,
    tags: ["AI客服", "自动化", "客户支持"],
    contentType: "article",
  },
  {
    id: "healthcare-case-study",
    title: "医疗行业案例：AI 如何提升诊所运营效率 300%",
    excerpt: "探索某连锁诊所如何通过智能工作流实现预约管理、病历处理和患者随访自动化。",
    category: "case-study",
    author: "陈晓",
    authorRole: "解决方案架构师",
    date: "2025-11-20",
    readTime: "8 分钟",
    featured: false,
    image: null,
    views: 5600,
    likes: 234,
    comments: 38,
    tags: ["医疗", "诊所", "效率"],
    contentType: "article",
  },
  {
    id: "november-product-update",
    title: "11 月产品更新：AI Agent 智能推荐上线",
    excerpt: "11 月重大更新：AI Agent 现在可以智能推荐工作流优化建议，助您持续提升自动化效率。",
    category: "product",
    author: "张明",
    authorRole: "首席产品官",
    date: "2025-11-15",
    readTime: "5 分钟",
    featured: false,
    image: null,
    views: 4800,
    likes: 198,
    comments: 31,
    tags: ["产品更新", "AI推荐", "智能优化"],
    contentType: "article",
  },
  {
    id: "data-encryption-best-practices",
    title: "数据加密最佳实践：保护工作流中的敏感信息",
    excerpt: "全面了解如何在工作流中实施端到端加密、密钥管理和访问控制。",
    category: "security",
    author: "李薇",
    authorRole: "技术总监",
    date: "2025-11-10",
    readTime: "9 分钟",
    featured: false,
    image: null,
    views: 3800,
    likes: 156,
    comments: 21,
    tags: ["加密", "安全", "数据保护"],
    contentType: "article",
  },
  {
    id: "ecommerce-automation",
    title: "电商自动化全攻略：从订单处理到客户维护",
    excerpt: "为电商卖家打造完整的自动化方案，覆盖订单、库存、发货、售后全流程。",
    category: "tips",
    author: "陈晓",
    authorRole: "解决方案架构师",
    date: "2025-11-05",
    readTime: "14 分钟",
    featured: false,
    image: null,
    views: 9200,
    likes: 423,
    comments: 68,
    tags: ["电商", "订单", "库存管理"],
    contentType: "article",
  },
  {
    id: "ai-agents-future",
    title: "AI Agent 的未来：从工具到伙伴的进化",
    excerpt: "展望 AI Agent 技术的发展方向，探讨它将如何改变人机协作的方式。",
    category: "industry",
    author: "王浩",
    authorRole: "AI 研究员",
    date: "2025-11-01",
    readTime: "10 分钟",
    featured: false,
    image: null,
    views: 7200,
    likes: 356,
    comments: 52,
    tags: ["AI Agent", "未来趋势", "人机协作"],
    contentType: "article",
  },
  {
    id: "notion-integration-deep-dive",
    title: "Notion 集成深度解析：打造知识管理自动化",
    excerpt: "详细讲解如何将 Notion 与 AgentFlow 深度集成，实现文档、数据库和任务的自动化管理。",
    category: "tips",
    author: "李薇",
    authorRole: "技术总监",
    date: "2025-10-28",
    readTime: "11 分钟",
    featured: false,
    image: null,
    views: 6100,
    likes: 267,
    comments: 43,
    tags: ["Notion", "知识管理", "集成"],
    contentType: "article",
  },
  {
    id: "retail-automation-case",
    title: "零售行业案例：连锁店如何将AI 提升运营效率",
    excerpt: "某知名连锁零售品牌通过 AgentFlow 实现库存预警、订单处理和客户分析自动化的成功经验。",
    category: "case-study",
    author: "陈晓",
    authorRole: "解决方案架构师",
    date: "2025-10-25",
    readTime: "8 分钟",
    featured: false,
    image: null,
    views: 5400,
    likes: 223,
    comments: 35,
    tags: ["零售", "库存管理", "运营效率"],
    contentType: "article",
  },
  {
    id: "october-product-update",
    title: "10 月产品更新：工作流版本控制功能上线",
    excerpt: "10 月重磅更新：支持工作流版本管理、回滚和协作，让团队开发更高效。",
    category: "product",
    author: "张明",
    authorRole: "首席产品官",
    date: "2025-10-20",
    readTime: "5 分钟",
    featured: false,
    image: null,
    views: 4500,
    likes: 189,
    comments: 28,
    tags: ["产品更新", "版本控制", "协作"],
    contentType: "article",
  },
  {
    id: "prompt-engineering-guide",
    title: "Prompt 工程指南：让 AI Agent 更懂你的意图",
    excerpt: "系统学习 Prompt 设计技巧，提升 AI Agent 的输出质量和任务完成率。",
    category: "tips",
    author: "王浩",
    authorRole: "AI 研究员",
    date: "2025-10-15",
    readTime: "13 分钟",
    featured: false,
    image: null,
    views: 8700,
    likes: 398,
    comments: 62,
    tags: ["Prompt", "AI", "技巧"],
    contentType: "article",
  },
  {
    id: "data-pipeline-patterns",
    title: "数据管道设计模式：高效处理海量数据",
    excerpt: "探讨在工作流中设计高效数据管道的最佳实践，处理大规模数据的可靠方案。",
    category: "tech",
    author: "李薇",
    authorRole: "技术总监",
    date: "2025-10-10",
    readTime: "12 分钟",
    featured: false,
    image: null,
    views: 4200,
    likes: 176,
    comments: 25,
    tags: ["数据管道", "大数据", "架构"],
    contentType: "article",
  },
  {
    id: "saas-automation-strategies",
    title: "SaaS 公司自动化战略：提升 ARR 的秘密武器",
    excerpt: "了解领先 SaaS 公司如何利用工作流自动化提升客户留存、减少流失并加速增长。",
    category: "industry",
    author: "张明",
    authorRole: "首席产品官",
    date: "2025-10-05",
    readTime: "9 分钟",
    featured: false,
    image: null,
    views: 5800,
    likes: 245,
    comments: 38,
    tags: ["SaaS", "增长", "客户留存"],
    contentType: "article",
  },
  {
    id: "github-actions-integration",
    title: "GitHub Actions 集成：CI/CD 与工作流的完美结合",
    excerpt: "将 AgentFlow 与 GitHub Actions 结合，实现代码部署、测试通知和发布自动化。",
    category: "tech",
    author: "李薇",
    authorRole: "技术总监",
    date: "2025-10-01",
    readTime: "10 分钟",
    featured: false,
    image: null,
    views: 5100,
    likes: 212,
    comments: 31,
    tags: ["GitHub", "CI/CD", "DevOps"],
    contentType: "article",
  },
  {
    id: "legal-industry-case",
    title: "法律行业案例：律所如何用 AI 提升合同审查效率",
    excerpt: "某大型律所通过智能工作流实现合同分析、风险识别和文档管理自动化的实践分享。",
    category: "case-study",
    author: "陈晓",
    authorRole: "解决方案架构师",
    date: "2025-09-28",
    readTime: "9 分钟",
    featured: false,
    image: null,
    views: 4800,
    likes: 198,
    comments: 29,
    tags: ["法律", "合同审查", "文档管理"],
    contentType: "article",
  },
  {
    id: "september-product-update",
    title: "9 月产品更新：AI 调试助手正式发布",
    excerpt: "全新 AI 调试助手帮助您快速定位和修复工作流问题，大幅减少故障排查时间。",
    category: "product",
    author: "张明",
    authorRole: "首席产品官",
    date: "2025-09-20",
    readTime: "4 分钟",
    featured: false,
    image: null,
    views: 4100,
    likes: 167,
    comments: 24,
    tags: ["产品更新", "AI调试", "故障排查"],
    contentType: "article",
  },
];

// 获取分类名称
const getCategoryName = (slug: string) => {
  return categories.find((c) => c.slug === slug)?.name || slug;
};

// 格式化数字
const formatNumber = (num: number) => {
  if (num >= 10000) return (num / 10000).toFixed(1) + "万";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showMorePosts, setShowMorePosts] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // 筛选文章
  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || post.tags.includes(selectedTag);
    return matchesCategory && matchesSearch && matchesTag;
  });

  // 精选文章
  const featuredPosts = blogPosts.filter((post) => post.featured);
  
  // 显示的文章数量
  const displayedPosts = showMorePosts ? filteredPosts : filteredPosts.slice(0, 9);
  
  // 热门文章（按阅读量排序）
  const popularPosts = [...blogPosts].sort((a, b) => b.views - a.views).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Manus 风格背景 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-background),var(--color-muted)/20)]" />
        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[150px] opacity-[0.12]"
          style={{ background: 'radial-gradient(circle, rgba(62,207,142,0.5) 0%, transparent 60%)' }}
        />
        <div 
          className="absolute bottom-1/4 right-0 w-[600px] h-[400px] rounded-full blur-[150px] opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, rgba(147,51,234,0.5) 0%, transparent 60%)' }}
        />
      </div>

      <SiteHeader />

      {/* Hero Section - Manus 风格 */}
      <section className="pt-20 sm:pt-32 pb-12 px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* 标签 */}
          <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
            "bg-muted border border-border",
            "text-sm text-muted-foreground font-medium mb-8",
            "transition-all duration-500",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <Sparkles className="h-3.5 w-3.5" />
            Blog & Resources
          </div>
          
          {/* 主标题 */}
          <h1 className={cn(
            "text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6",
            "transition-all duration-700 delay-100",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            Insights &
            <br />
            <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">inspiration</span>
          </h1>
          
          {/* 副标题 */}
          <p className={cn(
            "text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10",
            "transition-all duration-700 delay-200",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            探索 AI 工作流自动化的最新趋势、产品更新、技术深度解析和成功案例
          </p>

          {/* Search - Manus 风格 */}
          <div className={cn(
            "max-w-xl mx-auto relative mb-10",
            "transition-all duration-700 delay-300",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索文章、教程、案例.."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-11 pr-4 rounded-full bg-card/50 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:ring-primary/20"
            />
          </div>

          {/* Stats Bar */}
          <div className={cn(
            "flex flex-wrap justify-center gap-8 sm:gap-12",
            "transition-all duration-700 delay-400",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            {stats.map((stat, index) => (
              <div key={stat.label} className="flex items-center gap-2">
                <stat.icon className="w-4 h-4 text-primary" />
                <span className="text-xl font-bold text-foreground">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts - Hero Style */}
      {!searchQuery && selectedCategory === "all" && !selectedTag && (
        <section className="pb-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-8">
              <Flame className="w-4 h-4 text-orange-500" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Featured Stories</h2>
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
              {/* 主要精选文章*/}
              <Link
                href={`/blog/${featuredPosts[0]?.id}`}
                className={cn(
                  "lg:col-span-2 group relative overflow-hidden rounded-2xl",
                  "bg-gradient-to-br from-primary/10 via-card to-card",
                  "border border-border hover:border-primary/30",
                  "transition-all duration-500"
                )}
              >
                <div className="p-8 sm:p-10 min-h-[320px] flex flex-col justify-end">
                  <div className="absolute top-6 left-6 flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                      精选                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-card/80 backdrop-blur text-foreground text-xs font-medium border border-border">
                      {getCategoryName(featuredPosts[0]?.category)}
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                    {featuredPosts[0]?.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 line-clamp-2 max-w-xl">
                    {featuredPosts[0]?.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        {featuredPosts[0]?.author}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {featuredPosts[0]?.readTime}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4" />
                        {formatNumber(featuredPosts[0]?.views || 0)}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center group-hover:bg-primary transition-colors">
                      <ArrowRight className="w-5 h-5 text-background" />
                    </div>
                  </div>
                </div>
              </Link>

              {/* 次要精选文章*/}
              <div className="flex flex-col gap-4">
                {featuredPosts.slice(1, 3).map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.id}`}
                    className={cn(
                      "group flex-1 p-6 rounded-2xl",
                      "bg-card border border-border",
                      "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
                      "transition-all duration-300"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {getCategoryName(post.category)}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {post.readTime}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatNumber(post.views)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {post.likes}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trending Tags Section */}
      {!searchQuery && selectedCategory === "all" && !selectedTag && (
        <section className="pb-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="w-4 h-4 text-yellow-500" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Trending Topics</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => setSelectedTag(tag.name)}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
                    "bg-card border border-border",
                    "hover:border-primary/30 hover:bg-primary/5",
                    "transition-all duration-200"
                  )}
                >
                  {tag.hot && <Flame className="w-3 h-3 text-orange-500" />}
                  <span className="text-foreground">{tag.name}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                    {tag.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Selected Tag Notice */}
      {selectedTag && (
        <section className="pb-6 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
              <Tag className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">
                正在筛选标签：<span className="font-semibold">{selectedTag}</span>
              </span>
              <button 
                onClick={() => setSelectedTag(null)}
                className="ml-auto text-sm text-primary hover:underline"
              >
                清除筛选              </button>
            </div>
          </div>
        </section>
      )}

      {/* Categories & Posts - Two Column Layout */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          {/* Categories - 带图标 */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.slug}
                  onClick={() => {
                    setSelectedCategory(category.slug);
                    setSelectedTag(null);
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all",
                    selectedCategory === category.slug
                      ? "bg-foreground text-background shadow-lg"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    selectedCategory === category.slug
                      ? "bg-background/20 text-background"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {category.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Posts Grid */}
            <div className="lg:col-span-2">
              <div className="grid sm:grid-cols-2 gap-4">
                {displayedPosts.map((post, index) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.id}`}
                    className={cn(
                      "group flex flex-col p-5 rounded-2xl",
                      "bg-card border border-border",
                      "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
                      "transition-all duration-300",
                      index === 0 && !searchQuery && selectedCategory === "all" && "sm:col-span-2"
                    )}
                  >
                    {/* Category & Meta */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground font-medium">
                        {getCategoryName(post.category)}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {post.readTime}
                      </span>
                    </div>
                    
                    {/* Title */}
                    <h3 className={cn(
                      "font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2",
                      index === 0 && !searchQuery && selectedCategory === "all" ? "text-lg" : "text-sm"
                    )}>
                      {post.title}
                    </h3>
                    
                    {/* Excerpt */}
                    <p className={cn(
                      "text-muted-foreground mb-4 line-clamp-2 flex-1",
                      index === 0 && !searchQuery && selectedCategory === "all" ? "text-sm" : "text-xs"
                    )}>
                      {post.excerpt}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span 
                          key={tag}
                          className="px-2 py-0.5 rounded text-xs bg-muted/50 text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white text-xs font-medium">
                          {post.author.charAt(0)}
                        </div>
                        <span>{post.author}</span>
                        <span className="mx-1"></span>
                        <span className="font-mono">{post.date}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatNumber(post.views)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {post.likes}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Empty State */}
              {filteredPosts.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                    <Search className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    没有找到相关文章
                  </h3>
                  <p className="text-muted-foreground text-sm mb-8">
                    尝试调整搜索关键词或选择其他分类
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-full px-6"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                      setSelectedTag(null);
                    }}
                  >
                    查看全部
                  </Button>
                </div>
              )}

              {/* Load More */}
              {filteredPosts.length > 9 && !showMorePosts && (
                <div className="text-center mt-8">
                  <Button 
                    variant="outline" 
                    className="h-11 px-8 rounded-full border-border hover:border-primary/30"
                    onClick={() => setShowMorePosts(true)}
                  >
                    加载更多文章
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({filteredPosts.length - 9} 篇)
                    </span>
                  </Button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Popular Posts */}
              <div className="p-6 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground">热门文章</h3>
                </div>
                <div className="space-y-4">
                  {popularPosts.map((post, index) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.id}`}
                      className="group flex gap-3"
                    >
                      <span className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0",
                        index === 0 ? "bg-primary text-primary-foreground" :
                        index === 1 ? "bg-orange-500 text-white" :
                        index === 2 ? "bg-yellow-500 text-primary-foreground" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Eye className="w-3 h-3" />
                          {formatNumber(post.views)} 阅读
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Author Spotlight */}
              <div className="p-6 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-5">
                  <Users className="w-4 h-4 text-purple-500" />
                  <h3 className="font-semibold text-foreground">作者团队</h3>
                </div>
                <div className="space-y-4">
                  {authors.map((author) => (
                    <div key={author.name} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                        {author.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground">{author.name}</h4>
                        <p className="text-xs text-muted-foreground">{author.role}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-foreground">{author.articles}</span>
                        <span className="text-xs text-muted-foreground ml-1">篇</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-emerald-500/5 border border-primary/20">
                <h3 className="font-semibold text-foreground mb-4">快速导航</h3>
                <div className="space-y-2">
                  <Link 
                    href="/docs" 
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    文档中心
                  </Link>
                  <Link 
                    href="/templates" 
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Rocket className="w-4 h-4" />
                    模板库                  </Link>
                  <Link 
                    href="/community" 
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    社区讨论
                  </Link>
                  <Link 
                    href="/changelog" 
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    更新日志
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Series Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">系列专栏</h2>
              </div>
              <p className="text-muted-foreground">系统学习，由浅入深掌握工作流自动化</p>
            </div>
            <Link href="/learn/courses">
              <Button variant="outline" className="rounded-full">
                查看全部课程
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {blogSeries.map((series) => {
              const Icon = series.icon;
              return (
                <Link
                  key={series.id}
                  href={`/learn/courses/${series.id}`}
                  className={cn(
                    "group p-6 rounded-2xl bg-card border border-border",
                    "hover:shadow-lg transition-all duration-300",
                    series.color === "emerald" && "hover:border-emerald-500/30",
                    series.color === "purple" && "hover:border-purple-500/30",
                    series.color === "blue" && "hover:border-blue-500/30",
                    series.color === "orange" && "hover:border-orange-500/30"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                    series.color === "emerald" && "bg-emerald-500/10",
                    series.color === "purple" && "bg-purple-500/10",
                    series.color === "blue" && "bg-blue-500/10",
                    series.color === "orange" && "bg-orange-500/10"
                  )}>
                    <Icon className={cn(
                      "w-6 h-6",
                      series.color === "emerald" && "text-emerald-500",
                      series.color === "purple" && "text-purple-500",
                      series.color === "blue" && "text-blue-500",
                      series.color === "orange" && "text-orange-500"
                    )} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium",
                      series.level === "入门" && "bg-emerald-500/10 text-emerald-500",
                      series.level === "中级" && "bg-blue-500/10 text-blue-500",
                      series.level === "高级" && "bg-purple-500/10 text-purple-500"
                    )}>
                      {series.level}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {series.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                    {series.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{series.articles} 篇文章</span>
                    <span></span>
                    <span>{series.totalReadTime}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Upcoming Webinars Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Video className="w-5 h-5 text-purple-500" />
                <h2 className="text-2xl font-bold text-foreground">即将举办的网络研讨会</h2>
              </div>
              <p className="text-muted-foreground">与专家实时互动，深入学习自动化技术</p>
            </div>
            <Link href="/webinars">
              <Button variant="outline" className="rounded-full">
                查看全部
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {upcomingWebinars.map((webinar) => (
              <div
                key={webinar.id}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-purple-500/30 transition-all"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-500 text-xs font-medium">
                    线上直播
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {webinar.date} {webinar.time}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-3 group-hover:text-purple-500 transition-colors line-clamp-2">
                  {webinar.title}
                </h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-medium">
                    {webinar.speaker.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{webinar.speaker}</p>
                    <p className="text-xs text-muted-foreground">{webinar.speakerRole}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">
                    <Users className="w-3 h-3 inline mr-1" />
                    {webinar.registrations} 人已报名
                  </span>
                  <Button size="sm" className="h-8 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded-full text-xs">
                    立即报名
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Downloadable Resources Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">免费资源下载</h2>
              </div>
              <p className="text-muted-foreground">精心整理的电子书、模板和指南，助您快速上手</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {downloadableResources.map((resource) => {
              const Icon = resource.icon;
              return (
                <div
                  key={resource.id}
                  className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground mb-2 inline-block">
                    {resource.type}  {resource.format}
                  </span>
                  <h3 className="font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {resource.title}
                  </h3>
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">
                      {formatNumber(resource.downloads)} 次下载
                    </span>
                    <Button size="sm" variant="outline" className="h-7 px-3 rounded-full text-xs border-primary/30 text-primary hover:bg-primary/10">
                      免费下载
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Community Highlights Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-orange-500" />
                <h2 className="text-2xl font-bold text-foreground">社区精选</h2>
              </div>
              <p className="text-muted-foreground">来自社区用户的实践经验和成功故事</p>
            </div>
            <Link href="/community">
              <Button variant="outline" className="rounded-full">
                加入社区
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {communityHighlights.map((post) => (
              <Link
                key={post.id}
                href={`/community/post/${post.id}`}
                className="group p-6 rounded-2xl bg-card border border-border hover:border-orange-500/30 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-semibold">
                    {post.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{post.author}</p>
                    <p className="text-xs text-muted-foreground">{post.authorCompany}</p>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-4 group-hover:text-orange-500 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {post.comments}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">读者评价</h2>
            <p className="text-muted-foreground">看看其他用户如何评价我们的内容</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-card border border-border"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Sparkles key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-foreground mb-6 italic">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white font-semibold">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{testimonial.author}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Weekly Highlights & Latest Comments */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Weekly Highlights */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <h3 className="text-xl font-bold text-foreground">本周热点</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium">
                  第 {weeklyHighlights.weekNumber} 周  {weeklyHighlights.year}
                </span>
              </div>
              <div className="space-y-4 mb-6">
                {weeklyHighlights.topPosts.map((item, index) => {
                  const post = blogPosts.find(p => p.id === item.id);
                  return (
                    <Link
                      key={item.id}
                      href={`/blog/${item.id}`}
                      className="group flex items-center gap-3"
                    >
                      <span className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                        index === 0 ? "bg-primary text-primary-foreground" :
                        index === 1 ? "bg-orange-500 text-white" :
                        "bg-yellow-500 text-primary-foreground"
                      )}>
                        {item.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {post?.title}
                        </h4>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        item.trend === "up" ? "bg-emerald-500/10 text-emerald-500" :
                        item.trend === "new" ? "bg-purple-500/10 text-purple-500" :
                        "bg-red-500/10 text-red-500"
                      )}>
                        {item.trend === "up" ? `↑${item.changePercent}%` : 
                         item.trend === "new" ? "NEW" : `↓${item.changePercent}%`}
                      </span>
                    </Link>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-primary/20">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {formatNumber(weeklyHighlights.totalViews)} 周阅读                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    +{weeklyHighlights.newSubscribers} 新订阅                  </span>
                </div>
                <span className="text-xs font-medium text-primary">
                  热门话题：{weeklyHighlights.hotTopic}
                </span>
              </div>
            </div>

            {/* Latest Comments */}
            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <h3 className="text-xl font-bold text-foreground">最新评论</h3>
                </div>
                <Link href="/community" className="text-sm text-blue-500 hover:underline">
                  查看全部
                </Link>
              </div>
              <div className="space-y-4">
                {latestComments.map((comment) => (
                  <div key={comment.id} className="group">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                        {comment.author.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">{comment.author}</span>
                          <span className="text-xs text-muted-foreground"> {comment.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {comment.content}
                        </p>
                        <div className="flex items-center gap-3">
                          <Link 
                            href={`/blog/${comment.postId}`}
                            className="text-xs text-blue-500 hover:underline line-clamp-1"
                          >
                            回复于：{comment.postTitle}
                          </Link>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Heart className="w-3 h-3" />
                            {comment.likes}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Content Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-blue-500" />
                <h2 className="text-2xl font-bold text-foreground">合作伙伴内容</h2>
              </div>
              <p className="text-muted-foreground">与行业领导者联合打造的精品内容</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {partnerContent.map((content) => (
              <Link
                key={content.id}
                href={`/blog/partner/${content.id}`}
                className={cn(
                  "group p-6 rounded-2xl border transition-all",
                  content.featured 
                    ? "bg-gradient-to-br from-blue-500/10 via-card to-card border-blue-500/30" 
                    : "bg-card border-border hover:border-blue-500/30"
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="text-sm font-medium text-blue-500">{content.partner}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                    {content.type}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-3 group-hover:text-blue-500 transition-colors line-clamp-2">
                  {content.title}
                </h3>
                <div className="text-xs text-muted-foreground">
                  {content.date}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Knowledge Topics & Reading Challenge */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Knowledge Topics */}
            <div className="lg:col-span-2 p-8 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-purple-500" />
                <h3 className="text-xl font-bold text-foreground">知识图谱导航</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                按主题探索我们的内容库，找到您感兴趣的领域              </p>
              <div className="flex flex-wrap gap-3">
                {knowledgeTopics.map((topic) => (
                  <button
                    key={topic.name}
                    onClick={() => setSearchQuery(topic.name)}
                    className={cn(
                      "group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all",
                      topic.level === 1 && "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50",
                      topic.level === 2 && "bg-blue-500/5 border-blue-500/20 hover:border-blue-500/50",
                      topic.level === 3 && "bg-purple-500/5 border-purple-500/20 hover:border-purple-500/50"
                    )}
                  >
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      topic.level === 1 && "bg-emerald-500",
                      topic.level === 2 && "bg-blue-500",
                      topic.level === 3 && "bg-purple-500"
                    )} />
                    <span className="text-sm font-medium text-foreground">{topic.name}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {topic.count}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    入门级                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    中级
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    高级
                  </span>
                </div>
              </div>
            </div>

            {/* Reading Challenge */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 via-card to-card border border-purple-500/20">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-bold text-foreground">阅读挑战</h3>
              </div>
              <h4 className="text-sm font-medium text-foreground mb-4">{readingChallenge.title}</h4>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">进度</span>
                  <span className="font-semibold text-foreground">
                    {readingChallenge.current} / {readingChallenge.target} 篇
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${(readingChallenge.current / readingChallenge.target) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">参与人数</span>
                  <span className="font-medium text-foreground">{formatNumber(readingChallenge.participants)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">截止日期</span>
                  <span className="font-medium text-foreground">{readingChallenge.endDate}</span>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs text-muted-foreground mb-2">完成奖励：</p>
                <div className="flex flex-wrap gap-1.5">
                  {readingChallenge.rewards.map((reward) => (
                    <span key={reward} className="px-2 py-1 rounded bg-purple-500/10 text-purple-500 text-xs">
                      {reward}
                    </span>
                  ))}
                </div>
              </div>

              <Button className="w-full h-10 bg-purple-500 hover:bg-purple-600 text-white rounded-full text-sm">
                参加挑战
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Milestones Timeline */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">我们的旅程</h2>
            <p className="text-muted-foreground">与您一起成长的每一步</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-0">
            {milestones.map((milestone, index) => {
              const Icon = milestone.icon;
              return (
                <div key={milestone.label} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center mb-3",
                      index === milestones.length - 1 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={cn(
                      "text-lg font-bold",
                      index === milestones.length - 1 ? "text-primary" : "text-foreground"
                    )}>
                      {milestone.value}
                    </span>
                    <span className="text-xs text-muted-foreground">{milestone.label}</span>
                  </div>
                  {index < milestones.length - 1 && (
                    <div className="hidden md:block w-16 lg:w-24 h-0.5 bg-border mx-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Awards & Recognition + Quick Tips */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Awards & Recognition */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-yellow-500/10 via-card to-card border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="text-xl font-bold text-foreground">行业奖项与认可</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {awardsRecognition.map((award) => (
                  <div
                    key={award.id}
                    className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-yellow-500/30 transition-all"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
                      award.badge === "gold" && "bg-yellow-500/20",
                      award.badge === "winner" && "bg-emerald-500/20",
                      award.badge === "top10" && "bg-blue-500/20",
                      award.badge === "excellence" && "bg-purple-500/20"
                    )}>
                      <Star className={cn(
                        "w-5 h-5",
                        award.badge === "gold" && "text-yellow-500",
                        award.badge === "winner" && "text-emerald-500",
                        award.badge === "top10" && "text-blue-500",
                        award.badge === "excellence" && "text-purple-500"
                      )} />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground mb-1">{award.title}</h4>
                    <p className="text-xs text-muted-foreground">{award.organization}</p>
                    <span className="text-xs font-medium text-muted-foreground">{award.year}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <h3 className="text-xl font-bold text-foreground">快速技巧</h3>
                </div>
                <Button variant="ghost" size="sm" className="text-amber-500 hover:text-amber-600">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  换一批
                </Button>
              </div>
              <div className="space-y-4">
                {quickTips.slice(0, 3).map((tip, index) => (
                  <div
                    key={tip.id}
                    className="group p-4 rounded-xl bg-muted/50 hover:bg-muted transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm text-foreground mb-2">{tip.tip}</p>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                            {tip.category}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs",
                            tip.difficulty === "入门" && "bg-emerald-500/10 text-emerald-500",
                            tip.difficulty === "中级" && "bg-blue-500/10 text-blue-500",
                            tip.difficulty === "高级" && "bg-purple-500/10 text-purple-500"
                          )}>
                            {tip.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Poll + Upcoming Events */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Interactive Poll */}
            <div className="lg:col-span-1 p-8 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-card to-card border border-indigo-500/20">
              <div className="flex items-center gap-2 mb-4">
                <Vote className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-foreground">社区投票</h3>
              </div>
              <p className="text-sm text-foreground mb-6">{currentPoll.question}</p>
              <div className="space-y-3 mb-6">
                {currentPoll.options.map((option) => (
                  <button
                    key={option.id}
                    className="w-full group"
                  >
                    <div className="relative p-3 rounded-lg bg-card border border-border hover:border-indigo-500/30 transition-all overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-indigo-500/10 transition-all"
                        style={{ width: `${option.percentage}%` }}
                      />
                      <div className="relative flex items-center justify-between">
                        <span className="text-sm text-foreground">{option.text}</span>
                        <span className="text-xs font-medium text-muted-foreground">{option.percentage}%</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatNumber(currentPoll.totalVotes)} 人已投票</span>
                <span>截止：{currentPoll.endDate}</span>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="lg:col-span-2 p-8 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-bold text-foreground">即将举行的活动</h3>
                </div>
                <Link href="/events">
                  <Button variant="outline" size="sm" className="rounded-full">
                    查看全部
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="group p-4 rounded-xl bg-muted/50 hover:bg-muted transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                          <span className="text-lg font-bold text-primary">
                            {event.date.split("-")[2]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {event.date.split("-")[1]}月
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {event.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </span>
                            <span className={cn(
                              "px-2 py-0.5 rounded",
                              event.type === "线下活动" ? "bg-orange-500/10 text-orange-500" : "bg-blue-500/10 text-blue-500"
                            )}>
                              {event.type}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-foreground">
                          {event.registrations}/{event.capacity}
                        </div>
                        <div className="text-xs text-muted-foreground">已报名</div>
                        <Button size="sm" className="mt-2 h-7 px-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-xs">
                          立即报名
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Recommendations + Live Activity */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* AI Recommendations */}
            <div className="lg:col-span-2 p-8 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20">
              <div className="flex items-center gap-2 mb-6">
                <Brain className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold text-foreground">AI 智能推荐</h3>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  个性化
                </span>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {aiRecommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all"
                  >
                    <h4 className="text-sm font-semibold text-foreground mb-1">{rec.title}</h4>
                    <p className="text-xs text-muted-foreground mb-3">{rec.description}</p>
                    <div className="space-y-2">
                      {rec.articles.slice(0, 2).map((articleId) => {
                        const article = blogPosts.find(p => p.id === articleId);
                        return article ? (
                          <Link
                            key={articleId}
                            href={`/blog/${articleId}`}
                            className="block text-xs text-foreground hover:text-primary transition-colors line-clamp-1"
                          >
                            → {article.title}
                          </Link>
                        ) : null;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Activity Feed */}
            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-bold text-foreground">实时动态</h3>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </div>
              <div className="space-y-4">
                {liveActivityFeed.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 text-sm"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      activity.type === "comment" && "bg-blue-500/10 text-blue-500",
                      activity.type === "like" && "bg-red-500/10 text-red-500",
                      activity.type === "share" && "bg-green-500/10 text-green-500",
                      activity.type === "subscribe" && "bg-purple-500/10 text-purple-500"
                    )}>
                      {activity.type === "comment" && <MessageSquare className="w-4 h-4" />}
                      {activity.type === "like" && <Heart className="w-4 h-4" />}
                      {activity.type === "share" && <ArrowRight className="w-4 h-4" />}
                      {activity.type === "subscribe" && <Users className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground">
                        <span className="font-medium">{activity.user}</span>
                        <span className="text-muted-foreground"> {activity.action} </span>
                        <span className="text-foreground">{activity.target}</span>
                      </p>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Paths Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-medium mb-4">
              <Compass className="w-4 h-4" />
              系统学习
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">选择您的学习路径</h2>
            <p className="text-muted-foreground">根据您的目标和经验，选择最适合的学习路径</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {learningPaths.map((path) => {
              const Icon = path.icon;
              return (
                <div
                  key={path.id}
                  className={cn(
                    "group p-6 rounded-2xl bg-card border transition-all cursor-pointer",
                    path.color === "emerald" && "border-emerald-500/20 hover:border-emerald-500/50",
                    path.color === "purple" && "border-purple-500/20 hover:border-purple-500/50",
                    path.color === "blue" && "border-blue-500/20 hover:border-blue-500/50",
                    path.color === "pink" && "border-pink-500/20 hover:border-pink-500/50"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform",
                    path.color === "emerald" && "bg-emerald-500/10 text-emerald-500",
                    path.color === "purple" && "bg-purple-500/10 text-purple-500",
                    path.color === "blue" && "bg-blue-500/10 text-blue-500",
                    path.color === "pink" && "bg-pink-500/10 text-pink-500"
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{path.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{path.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {path.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {path.articles} 篇
                    </span>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded text-xs font-medium inline-block",
                    path.difficulty === "入门" && "bg-emerald-500/10 text-emerald-500",
                    path.difficulty === "高级" && "bg-purple-500/10 text-purple-500"
                  )}>
                    {path.difficulty}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Daily Reading + Curated Collections */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Daily Reading */}
            <div className="lg:col-span-2 p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 via-card to-card border border-amber-500/20">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <h3 className="text-xl font-bold text-foreground">每日一读</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium">
                  今日推荐
                </span>
              </div>
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-10 h-10 text-amber-500" />
                </div>
                <div className="flex-1">
                  <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground mb-2 inline-block">
                    {dailyReading.category}
                  </span>
                  <h4 className="text-lg font-semibold text-foreground mb-2 hover:text-amber-500 transition-colors cursor-pointer">
                    {dailyReading.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">{dailyReading.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{dailyReading.author}</span>
                      <span></span>
                      <span>{dailyReading.readTime}</span>
                    </div>
                    <Button size="sm" className="h-8 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-xs">
                      开始阅读
                      <ArrowRight className="ml-1 w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Lightbulb className="w-3 h-3 text-amber-500" />
                  推荐理由：{dailyReading.reason}
                </p>
              </div>
            </div>

            {/* Curated Collections */}
            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-6">
                <Bookmark className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">精选收藏集</h3>
              </div>
              <div className="space-y-4">
                {curatedCollections.map((collection) => (
                  <div
                    key={collection.id}
                    className="group p-4 rounded-xl bg-muted/50 hover:bg-muted transition-all cursor-pointer"
                  >
                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors mb-1">
                      {collection.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-2">{collection.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{collection.articleCount} 篇文章</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {formatNumber(collection.followers)} 关注
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular FAQs + Code Snippets */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Popular FAQs */}
            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-500" />
                  <h3 className="text-xl font-bold text-foreground">热门问答</h3>
                </div>
                <Link href="/faq">
                  <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600">
                    查看全部
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                {popularFAQs.map((faq) => (
                  <div
                    key={faq.id}
                    className="group p-4 rounded-xl bg-muted/50 hover:bg-muted transition-all cursor-pointer"
                  >
                    <h4 className="font-medium text-foreground group-hover:text-blue-500 transition-colors mb-2">
                      {faq.question}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{faq.answer}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {faq.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-500">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {faq.votes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatNumber(faq.views)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Code Snippets */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-xl font-bold text-white">代码片段库</h3>
                </div>
                <Link href="/snippets">
                  <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300">
                    查看全部
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                {codeSnippets.map((snippet) => (
                  <div
                    key={snippet.id}
                    className="group p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white group-hover:text-emerald-400 transition-colors">
                        {snippet.title}
                      </h4>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-slate-400 hover:text-white">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">{snippet.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400">
                        {snippet.category}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Copy className="w-3 h-3" />
                        {formatNumber(snippet.copies)} 次复制                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expert Interviews + Industry Reports */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Expert Interviews */}
            <div className="lg:col-span-2 p-8 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-pink-500" />
                  <h3 className="text-xl font-bold text-foreground">专家访谈</h3>
                </div>
                <Link href="/interviews">
                  <Button variant="outline" size="sm" className="rounded-full">
                    查看全部
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                {expertInterviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="group p-4 rounded-xl bg-muted/50 hover:bg-muted transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                        {interview.guest.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground">{interview.guest}</h4>
                          {interview.status === "upcoming" ? (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-pink-500/10 text-pink-500">
                              即将播出
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-500">
                              已发送                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{interview.title}</p>
                        <p className="text-sm text-foreground group-hover:text-pink-500 transition-colors">
                          {interview.topic}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>{interview.date}</div>
                        <div>{interview.duration}</div>
                        {interview.status === "released" ? (
                          <Button size="sm" className="mt-2 h-7 px-3 bg-pink-500 hover:bg-pink-600 text-white rounded-full text-xs">
                            <PlayCircle className="w-3 h-3 mr-1" />
                            播放
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="mt-2 h-7 px-3 rounded-full text-xs">
                            提醒我                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Industry Reports */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-card to-card border border-indigo-500/20">
              <div className="flex items-center gap-2 mb-6">
                <PieChart className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-foreground">行业报告</h3>
              </div>
              <div className="space-y-4">
                {industryReports.map((report) => (
                  <div
                    key={report.id}
                    className={cn(
                      "group p-4 rounded-xl transition-all cursor-pointer",
                      report.featured 
                        ? "bg-indigo-500/10 border border-indigo-500/30" 
                        : "bg-muted/50 hover:bg-muted"
                    )}
                  >
                    {report.featured && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500 text-white mb-2 inline-block">
                        重磅发布
                      </span>
                    )}
                    <h4 className="font-medium text-foreground group-hover:text-indigo-500 transition-colors mb-1">
                      {report.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">{report.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{report.pages} 页</span>
                      <span>{formatNumber(report.downloads)} 次下载</span>
                    </div>
                    <Button 
                      size="sm" 
                      className={cn(
                        "w-full mt-3 h-8 rounded-full text-xs",
                        report.featured 
                          ? "bg-indigo-500 hover:bg-indigo-600 text-white" 
                          : "bg-muted hover:bg-muted/80 text-foreground"
                      )}
                    >
                      免费下载
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Achievement Badges + Knowledge Quizzes */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Achievement Badges */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-yellow-500/10 via-card to-card border border-yellow-500/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-xl font-bold text-foreground">成就徽章</h3>
                </div>
                <span className="text-sm text-muted-foreground">
                  已获得3/6
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {achievementBadges.map((badge) => {
                  const BadgeIcon = badge.icon;
                  return (
                    <div
                      key={badge.id}
                      className={cn(
                        "relative p-4 rounded-xl text-center transition-all",
                        badge.earned 
                          ? "bg-card border border-border" 
                          : "bg-muted/30 border border-dashed border-border/50 opacity-60"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2",
                        badge.color === "bronze" && "bg-orange-500/20 text-orange-500",
                        badge.color === "silver" && "bg-slate-400/20 text-slate-400",
                        badge.color === "gold" && "bg-yellow-500/20 text-yellow-500",
                        badge.color === "purple" && "bg-purple-500/20 text-purple-500",
                        badge.color === "blue" && "bg-blue-500/20 text-blue-500",
                        badge.color === "rainbow" && "bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 text-purple-500"
                      )}>
                        <BadgeIcon className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-medium text-foreground mb-1">{badge.name}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">{badge.description}</p>
                      {badge.earned ? (
                        <BadgeCheck className="absolute top-2 right-2 w-4 h-4 text-emerald-500" />
                      ) : badge.progress ? (
                        <div className="mt-2">
                          <div className="h-1 rounded-full bg-muted overflow-hidden">
                            <div 
                              className="h-full bg-yellow-500 rounded-full"
                              style={{ width: `${badge.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{badge.progress}%</span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Knowledge Quizzes */}
            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Puzzle className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-bold text-foreground">知识测验</h3>
                </div>
                <Link href="/quizzes">
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/90">
                    查看全部
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                {knowledgeQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="group p-4 rounded-xl bg-muted/50 hover:bg-muted transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {quiz.title}
                      </h4>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs",
                        quiz.difficulty === "入门" && "bg-emerald-500/10 text-emerald-500",
                        quiz.difficulty === "中级" && "bg-blue-500/10 text-blue-500",
                        quiz.difficulty === "高级" && "bg-purple-500/10 text-purple-500"
                      )}>
                        {quiz.difficulty}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <HelpCircle className="w-3 h-3" />
                        {quiz.questions} 周                      </span>
                      <span className="flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {quiz.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {formatNumber(quiz.completions)} 人完成                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">平均分：</span>
                        <span className="text-sm font-semibold text-foreground">{quiz.avgScore}</span>
                        <Medal className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs text-yellow-500">{quiz.badge}</span>
                      </div>
                      <Button size="sm" className="h-7 px-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-xs">
                        开始测试                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reading Progress + Popular Integrations */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Reading Progress */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">阅读进度</h3>
              </div>
              
              {/* Streak */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 mb-4">
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{readingProgress.streak} 天</div>
                  <div className="text-xs text-muted-foreground">连续阅读</div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-card/50 text-center">
                  <div className="text-lg font-bold text-foreground">{readingProgress.readArticles}</div>
                  <div className="text-xs text-muted-foreground">已读文章</div>
                </div>
                <div className="p-3 rounded-lg bg-card/50 text-center">
                  <div className="text-lg font-bold text-foreground">{readingProgress.savedArticles}</div>
                  <div className="text-xs text-muted-foreground">已收藏</div>
                </div>
                <div className="p-3 rounded-lg bg-card/50 text-center">
                  <div className="text-lg font-bold text-foreground">{readingProgress.thisWeek}</div>
                  <div className="text-xs text-muted-foreground">本周阅读</div>
                </div>
                <div className="p-3 rounded-lg bg-card/50 text-center">
                  <div className="text-lg font-bold text-primary">{Math.round((readingProgress.readArticles / readingProgress.totalArticles) * 100)}%</div>
                  <div className="text-xs text-muted-foreground">完成率</div>
                </div>
              </div>

              {/* Monthly Goal */}
              <div className="p-4 rounded-xl bg-card/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground">本月目标</span>
                  <span className="text-sm font-medium text-foreground">
                    {readingProgress.monthlyProgress}/{readingProgress.monthlyGoal}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(readingProgress.monthlyProgress / readingProgress.monthlyGoal) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Popular Integrations */}
            <div className="lg:col-span-2 p-8 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-blue-500" />
                  <h3 className="text-xl font-bold text-foreground">热门集成</h3>
                </div>
                <Link href="/dashboard/integrations">
                  <Button variant="outline" size="sm" className="rounded-full">
                    查看全部集成
                    <ChevronRight className="ml-1 w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {popularIntegrations.map((integration, index) => (
                  <div
                    key={integration.name}
                    className="group p-4 rounded-xl bg-muted/50 hover:bg-muted transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center text-lg font-bold text-foreground border border-border">
                        {integration.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground group-hover:text-blue-500 transition-colors">
                          {integration.name}
                        </h4>
                        <span className="text-xs text-muted-foreground">{integration.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {formatNumber(integration.users)} 用户
                      </span>
                      <span className="text-emerald-500 font-medium">{integration.growth}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Glossary + ROI Calculator + Tools */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Glossary */}
            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BookMarked className="w-5 h-5 text-purple-500" />
                  <h3 className="text-lg font-bold text-foreground">术语词典</h3>
                </div>
                <Link href="/glossary">
                  <Button variant="ghost" size="sm" className="text-purple-500 hover:text-purple-600">
                    完整词典
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {glossaryTerms.slice(0, 4).map((item) => (
                  <div
                    key={item.term}
                    className="group p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Hash className="w-3 h-3 text-purple-500" />
                      <h4 className="text-sm font-medium text-foreground group-hover:text-purple-500 transition-colors">
                        {item.term}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.definition}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ROI Calculator Preview */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-card to-card border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-6">
                <Calculator className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg font-bold text-foreground">ROI 计算器</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                计算自动化为您节省的时间和成本              </p>
              
              {/* Quick Preview */}
              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-xl bg-card/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">以小型团队为例</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">每月节省时间</div>
                      <div className="text-xl font-bold text-emerald-500">128 小时</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">每月节省成本</div>
                      <div className="text-xl font-bold text-emerald-500">¥19,200</div>
                    </div>
                  </div>
                </div>
              </div>

              <Button className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full">
                <Calculator className="w-4 h-4 mr-2" />
                计算您的 ROI
              </Button>
            </div>

            {/* Recommended Tools */}
            <div className="p-8 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-6">
                <Wrench className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-bold text-foreground">推荐工具</h3>
              </div>
              <div className="space-y-3">
                {recommendedTools.map((tool) => (
                  <a
                    key={tool.id}
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all"
                  >
                    <span className="text-2xl">{tool.icon}</span>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-foreground group-hover:text-orange-500 transition-colors">
                        {tool.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">{tool.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Types Section */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">探索更多内容形式</h2>
            <p className="text-muted-foreground">除了文章，我们还提供视频教程和播客节目</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* 文章 */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">深度文章</h3>
              <p className="text-sm text-muted-foreground mb-4">
                技术深度解析、最佳实践和行业洞察
              </p>
              <span className="text-sm font-medium text-primary">240+ 篇文章</span>
            </div>

            {/* 视频 */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:border-purple-500/30 transition-all text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Video className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">视频教程</h3>
              <p className="text-sm text-muted-foreground mb-4">
                手把手教学，从入门到精通              </p>
              <span className="text-sm font-medium text-purple-500">60+ 个视频</span>
            </div>

            {/* 播客 */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:border-orange-500/30 transition-all text-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Podcast className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">播客节目</h3>
              <p className="text-sm text-muted-foreground mb-4">
                与行业专家对话，探讨 AI 前沿话题
              </p>
              <span className="text-sm font-medium text-orange-500">30+ 期节目</span>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter - Enhanced */}
      <section className="py-20 px-6 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="relative p-10 sm:p-12 rounded-3xl bg-card border border-border overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                每周精选推送
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Stay ahead of the curve
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                订阅我们的 Newsletter，获取最新的 AI 工作流自动化趋势、产品更新和独家内容
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  className="h-12 flex-1 rounded-full bg-background border-border focus:border-primary/50 focus:ring-primary/20"
                />
                <Button className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full">
                  立即订阅
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" />
                  12,000+ 订阅者
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  每周三发送                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-primary" />
                  随时取消订阅
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            准备好开始构建智能工作流了吗？
          </h2>
          <p className="text-muted-foreground mb-8">
            免费注册，立即体验 AI Agent 的强大功能
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full">
                免费开始
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" className="h-12 px-8 rounded-full border-border hover:border-foreground/20">
                预约演示
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
