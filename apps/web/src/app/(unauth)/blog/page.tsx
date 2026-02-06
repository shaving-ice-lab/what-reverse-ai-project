"use client";

/**
 * 博客列表页面 - LobeHub 风格暗色设计
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

// 博客文章
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
      <SiteHeader />

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 px-6 bg-gradient-hero">
        <div className="max-w-5xl mx-auto text-center">
          <div className={cn(
            "lobe-badge mb-8",
            "transition-all duration-500",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <Sparkles className="h-3.5 w-3.5" />
            Blog & Resources
          </div>
          
          <h1 className={cn(
            "text-[32px] sm:text-[40px] lg:text-[48px] font-semibold text-foreground tracking-tight mb-6 leading-tight",
            "transition-all duration-700 delay-100",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            Insights &
            <br />
            <span className="text-brand">inspiration</span>
          </h1>
          
          <p className={cn(
            "text-[15px] text-foreground-light max-w-2xl mx-auto mb-10",
            "transition-all duration-700 delay-200",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            探索 AI 工作流自动化的最新趋势、产品更新、技术深度解析和成功案例
          </p>

          {/* Search */}
          <div className={cn(
            "max-w-xl mx-auto relative mb-10",
            "transition-all duration-700 delay-300",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-lighter" />
            <Input
              placeholder="搜索文章、教程、案例..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-11 pr-4 rounded-full bg-surface-100/50 backdrop-blur-sm border-border/30 text-foreground placeholder:text-foreground-lighter focus:border-brand/50 focus:ring-brand/20"
            />
          </div>

          {/* Stats Bar */}
          <div className={cn(
            "flex flex-wrap justify-center gap-8 sm:gap-12",
            "transition-all duration-700 delay-400",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}>
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <stat.icon className="w-4 h-4 text-brand" />
                <span className="text-xl font-semibold text-foreground">{stat.value}</span>
                <span className="text-[13px] text-foreground-lighter">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {!searchQuery && selectedCategory === "all" && !selectedTag && (
        <section className="pb-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="lobe-section-header mb-8">
              <Flame className="w-4 h-4 text-orange-500" />
              <h2>Featured Stories</h2>
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
              {/* Main Featured */}
              <Link
                href={`/blog/${featuredPosts[0]?.id}`}
                className={cn(
                  "lg:col-span-2 group relative overflow-hidden rounded-2xl",
                  "bg-surface-100/30 border border-border/30",
                  "hover:border-brand/30 transition-all duration-500"
                )}
              >
                <div className="p-8 sm:p-10 min-h-[320px] flex flex-col justify-end">
                  <div className="absolute top-6 left-6 flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-full bg-brand text-background text-[11px] font-semibold">
                      精选
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-surface-100/80 backdrop-blur text-foreground text-[11px] font-medium border border-border/30">
                      {getCategoryName(featuredPosts[0]?.category)}
                    </span>
                  </div>
                  <h3 className="text-[22px] sm:text-[26px] font-semibold text-foreground mb-4 group-hover:text-brand transition-colors">
                    {featuredPosts[0]?.title}
                  </h3>
                  <p className="text-[13px] text-foreground-light mb-6 line-clamp-2 max-w-xl">
                    {featuredPosts[0]?.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[12px] text-foreground-lighter">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {featuredPosts[0]?.author}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {featuredPosts[0]?.readTime}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        {formatNumber(featuredPosts[0]?.views || 0)}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center group-hover:bg-brand transition-colors">
                      <ArrowRight className="w-5 h-5 text-background" />
                    </div>
                  </div>
                </div>
              </Link>

              {/* Secondary Featured */}
              <div className="flex flex-col gap-4">
                {featuredPosts.slice(1, 3).map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.id}`}
                    className={cn(
                      "group flex-1 p-6 rounded-2xl",
                      "bg-surface-100/30 border border-border/30",
                      "hover:border-brand/30",
                      "transition-all duration-300"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="lobe-badge">
                        {getCategoryName(post.category)}
                      </span>
                      <span className="text-[11px] text-foreground-lighter">
                        {post.readTime}
                      </span>
                    </div>
                    <h3 className="text-[14px] font-semibold text-foreground mb-2 group-hover:text-brand transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-[12px] text-foreground-light mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] text-foreground-lighter">
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

      {/* Trending Tags */}
      {!searchQuery && selectedCategory === "all" && !selectedTag && (
        <section className="pb-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="lobe-section-header mb-6">
              <Zap className="w-4 h-4 text-yellow-500" />
              <h2>Trending Topics</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => setSelectedTag(tag.name)}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium",
                    "bg-surface-100/30 border border-border/30",
                    "hover:border-brand/30 hover:bg-brand/5",
                    "transition-all duration-200"
                  )}
                >
                  {tag.hot && <Flame className="w-3 h-3 text-orange-500" />}
                  <span className="text-foreground">{tag.name}</span>
                  <span className="text-[11px] text-foreground-lighter bg-surface-200/50 px-1.5 py-0.5 rounded-full">
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
            <div className="flex items-center gap-3 p-4 rounded-xl bg-brand/10 border border-brand/20">
              <Tag className="w-4 h-4 text-brand" />
              <span className="text-[13px] text-foreground">
                正在筛选标签：<span className="font-semibold">{selectedTag}</span>
              </span>
              <button 
                onClick={() => setSelectedTag(null)}
                className="ml-auto text-[13px] text-brand hover:underline"
              >
                清除筛选
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Categories & Posts */}
      <section className="py-16 px-6 bg-gradient-section">
        <div className="max-w-6xl mx-auto">
          {/* Categories */}
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
                    "inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-medium transition-all",
                    selectedCategory === category.slug
                      ? "bg-foreground text-background shadow-lg"
                      : "bg-surface-100/30 border border-border/30 text-foreground-light hover:text-foreground hover:border-foreground/20"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                  <span className={cn(
                    "text-[11px] px-1.5 py-0.5 rounded-full",
                    selectedCategory === category.slug
                      ? "bg-background/20 text-background"
                      : "bg-surface-200/50 text-foreground-lighter"
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
                      "bg-surface-100/30 border border-border/30",
                      "hover:border-brand/30",
                      "transition-all duration-300",
                      index === 0 && !searchQuery && selectedCategory === "all" && "sm:col-span-2"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="lobe-badge">
                        {getCategoryName(post.category)}
                      </span>
                      <span className="text-[11px] text-foreground-lighter">
                        {post.readTime}
                      </span>
                    </div>
                    
                    <h3 className={cn(
                      "font-semibold text-foreground mb-2 group-hover:text-brand transition-colors line-clamp-2",
                      index === 0 && !searchQuery && selectedCategory === "all" ? "text-[15px]" : "text-[13px]"
                    )}>
                      {post.title}
                    </h3>
                    
                    <p className={cn(
                      "text-foreground-light mb-4 line-clamp-2 flex-1",
                      index === 0 && !searchQuery && selectedCategory === "all" ? "text-[13px]" : "text-[12px]"
                    )}>
                      {post.excerpt}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span 
                          key={tag}
                          className="px-2 py-0.5 rounded text-[11px] bg-surface-200/30 text-foreground-lighter"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-border/20">
                      <div className="flex items-center gap-2 text-[11px] text-foreground-lighter">
                        <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center text-brand text-[10px] font-medium">
                          {post.author.charAt(0)}
                        </div>
                        <span>{post.author}</span>
                        <span className="mx-1">·</span>
                        <span>{post.date}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-foreground-lighter">
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
                  <div className="w-16 h-16 rounded-2xl bg-surface-100/30 flex items-center justify-center mx-auto mb-6">
                    <Search className="w-7 h-7 text-foreground-lighter" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-foreground mb-2">
                    没有找到相关文章
                  </h3>
                  <p className="text-foreground-light text-[13px] mb-8">
                    尝试调整搜索关键词或选择其他分类
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-full px-6 border-border/30"
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
                    className="h-11 px-8 rounded-full border-border/30 hover:border-brand/30"
                    onClick={() => setShowMorePosts(true)}
                  >
                    加载更多文章
                    <span className="ml-2 text-[11px] text-foreground-lighter">
                      ({filteredPosts.length - 9} 篇)
                    </span>
                  </Button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Popular Posts */}
              <div className="p-6 rounded-2xl bg-surface-100/30 border border-border/30">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="w-4 h-4 text-brand" />
                  <h3 className="text-[14px] font-semibold text-foreground">热门文章</h3>
                </div>
                <div className="space-y-4">
                  {popularPosts.map((post, index) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.id}`}
                      className="group flex gap-3"
                    >
                      <span className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0",
                        index === 0 ? "bg-brand text-white" :
                        index === 1 ? "bg-orange-500 text-white" :
                        index === 2 ? "bg-yellow-500 text-black" :
                        "bg-surface-200/50 text-foreground-lighter"
                      )}>
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-medium text-foreground group-hover:text-brand transition-colors line-clamp-2">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-foreground-lighter">
                          <Eye className="w-3 h-3" />
                          {formatNumber(post.views)} 阅读
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Author Spotlight */}
              <div className="p-6 rounded-2xl bg-surface-100/30 border border-border/30">
                <div className="flex items-center gap-2 mb-5">
                  <Users className="w-4 h-4 text-purple-400" />
                  <h3 className="text-[14px] font-semibold text-foreground">作者团队</h3>
                </div>
                <div className="space-y-4">
                  {authors.map((author) => (
                    <div key={author.name} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center text-brand font-semibold text-[13px]">
                        {author.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-medium text-foreground">{author.name}</h4>
                        <p className="text-[11px] text-foreground-lighter">{author.role}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[13px] font-semibold text-foreground">{author.articles}</span>
                        <span className="text-[11px] text-foreground-lighter ml-1">篇</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="p-6 rounded-2xl bg-surface-100/30 border border-brand/20">
                <h3 className="text-[14px] font-semibold text-foreground mb-4">快速导航</h3>
                <div className="space-y-2">
                  {[
                    { href: "/docs", icon: BookOpen, label: "文档中心" },
                    { href: "/templates", icon: Rocket, label: "模板库" },
                    { href: "/community", icon: MessageSquare, label: "社区讨论" },
                    { href: "/changelog", icon: Sparkles, label: "更新日志" },
                  ].map((item) => (
                    <Link 
                      key={item.href}
                      href={item.href} 
                      className="flex items-center gap-2 text-[13px] text-foreground-light hover:text-brand transition-colors"
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Series */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="lobe-section-header mb-2">
                <BookOpen className="w-5 h-5 text-brand" />
                <h2 className="text-[20px]">系列专栏</h2>
              </div>
              <p className="text-[13px] text-foreground-light">系统学习，由浅入深掌握工作流自动化</p>
            </div>
            <Link href="/learn/courses">
              <Button variant="outline" className="rounded-full border-border/30">
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
                    "group p-6 rounded-2xl bg-surface-100/30 border border-border/30",
                    "hover:border-brand/30 transition-all duration-300"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                    "bg-brand/10"
                  )}>
                    <Icon className="w-6 h-6 text-brand" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-medium",
                      series.level === "入门" && "bg-emerald-500/10 text-emerald-400",
                      series.level === "中级" && "bg-blue-500/10 text-blue-400",
                      series.level === "高级" && "bg-purple-500/10 text-purple-400"
                    )}>
                      {series.level}
                    </span>
                  </div>
                  <h3 className="text-[14px] font-semibold text-foreground mb-2 group-hover:text-brand transition-colors">
                    {series.title}
                  </h3>
                  <p className="text-[12px] text-foreground-light mb-4 line-clamp-2">
                    {series.description}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-foreground-lighter">
                    <span>{series.articles} 篇文章</span>
                    <span>·</span>
                    <span>{series.totalReadTime}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Webinars */}
      <section className="py-16 px-6 bg-gradient-section">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="lobe-section-header mb-2">
                <Video className="w-5 h-5 text-purple-400" />
                <h2 className="text-[20px]">即将举办的网络研讨会</h2>
              </div>
              <p className="text-[13px] text-foreground-light">与专家实时互动，深入学习自动化技术</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {upcomingWebinars.map((webinar) => (
              <div
                key={webinar.id}
                className="group p-6 rounded-2xl bg-surface-100/30 border border-border/30 hover:border-purple-500/30 transition-all"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[11px] font-medium">
                    线上直播
                  </span>
                  <span className="text-[11px] text-foreground-lighter">
                    {webinar.date} {webinar.time}
                  </span>
                </div>
                <h3 className="text-[14px] font-semibold text-foreground mb-3 group-hover:text-purple-400 transition-colors line-clamp-2">
                  {webinar.title}
                </h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-[11px] font-medium">
                    {webinar.speaker.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{webinar.speaker}</p>
                    <p className="text-[11px] text-foreground-lighter">{webinar.speakerRole}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border/20">
                  <span className="text-[11px] text-foreground-lighter">
                    <Users className="w-3 h-3 inline mr-1" />
                    {webinar.registrations} 人已报名
                  </span>
                  <Button size="sm" className="h-8 px-4 rounded-full bg-foreground text-background text-[11px]">
                    立即报名
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="lobe-section-header mb-10">
            <Award className="w-5 h-5 text-brand" />
            <h2 className="text-[20px]">免费资源下载</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {downloadableResources.map((resource) => {
              const Icon = resource.icon;
              return (
                <div
                  key={resource.id}
                  className="group p-6 rounded-2xl bg-surface-100/30 border border-border/30 hover:border-brand/30 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-brand" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface-200/50 text-foreground-lighter mb-2 inline-block">
                    {resource.type} · {resource.format}
                  </span>
                  <h3 className="text-[14px] font-semibold text-foreground mb-3 group-hover:text-brand transition-colors">
                    {resource.title}
                  </h3>
                  <div className="flex items-center justify-between pt-4 border-t border-border/20">
                    <span className="text-[11px] text-foreground-lighter">
                      {formatNumber(resource.downloads)} 次下载
                    </span>
                    <Button size="sm" variant="outline" className="h-7 px-3 rounded-full text-[11px] border-brand/30 text-brand hover:bg-brand/10">
                      免费下载
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Community */}
      <section className="py-16 px-6 bg-gradient-section">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div className="lobe-section-header">
              <MessageSquare className="w-5 h-5 text-orange-400" />
              <h2 className="text-[20px]">社区精选</h2>
            </div>
            <Link href="/community">
              <Button variant="outline" className="rounded-full border-border/30">
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
                className="group p-6 rounded-2xl bg-surface-100/30 border border-border/30 hover:border-orange-500/30 transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-semibold text-[13px]">
                    {post.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{post.author}</p>
                    <p className="text-[11px] text-foreground-lighter">{post.authorCompany}</p>
                  </div>
                </div>
                <h3 className="text-[14px] font-semibold text-foreground mb-4 group-hover:text-orange-400 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <div className="flex items-center gap-4 text-[11px] text-foreground-lighter">
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

      {/* Testimonials */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[20px] font-semibold text-foreground mb-4">读者评价</h2>
            <p className="text-[13px] text-foreground-light">看看其他用户如何评价我们的内容</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-surface-100/30 border border-border/30"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-[13px] text-foreground mb-6 italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center text-brand font-semibold text-[13px]">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{testimonial.author}</p>
                    <p className="text-[11px] text-foreground-lighter">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-20 px-6 bg-gradient-section">
        <div className="max-w-4xl mx-auto">
          <div className="relative p-10 sm:p-12 rounded-3xl bg-surface-100/30 border border-border/30 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative text-center">
              <div className="lobe-badge mb-6 mx-auto w-fit">
                <Sparkles className="w-4 h-4" />
                每周精选推送
              </div>
              <h2 className="text-[24px] sm:text-[30px] font-semibold text-foreground mb-4">
                Stay ahead of the curve
              </h2>
              <p className="text-[15px] text-foreground-light mb-8 max-w-xl mx-auto">
                订阅我们的 Newsletter，获取最新的 AI 工作流自动化趋势、产品更新和独家内容
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  className="h-12 flex-1 rounded-full bg-surface-100/50 border-border/30 text-foreground placeholder:text-foreground-lighter focus:border-brand/50"
                />
                <Button className="h-12 px-8 rounded-full bg-foreground text-background font-semibold hover:bg-foreground/90">
                  立即订阅
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap justify-center gap-6 text-[12px] text-foreground-lighter">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-brand" />
                  12,000+ 订阅者
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand" />
                  每周三发送
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-brand" />
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
          <h2 className="text-[20px] font-semibold text-foreground mb-4">
            准备好开始构建智能工作流了吗？
          </h2>
          <p className="text-[13px] text-foreground-light mb-8">
            免费注册，立即体验 AI Agent 的强大功能
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button className="h-12 px-8 rounded-full bg-foreground text-background font-semibold hover:bg-foreground/90">
                免费开始
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" className="h-12 px-8 rounded-full border-border/30 hover:border-foreground/20">
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
