"use client";

/**
 * 首页 - AgentFlow 落地页
 * Manus 风格：简约、中性色、大留白、流畅动效
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Workflow,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Sparkles,
  Bot,
  GitBranch,
  Layers,
  Play,
  CheckCircle,
  Star,
  Users,
  Code,
  Puzzle,
  MessageSquare,
  Clock,
  ChevronRight,
  Rocket,
  Settings,
  CircleCheck,
  Send,
  Database,
  ChevronDown,
  Quote,
  Building2,
  ShoppingCart,
  Briefcase,
  GraduationCap,
  HeartPulse,
  Plane,
  Plus,
  Minus,
  Twitter,
  Github,
  Linkedin,
  Youtube,
  Mail,
  MapPin,
  Phone,
  ExternalLink,
  TrendingUp,
  Lightbulb,
  Target,
  Award,
  BarChart3,
  Calendar,
  FileText,
  Headphones,
  X,
  Menu,
  Heart,
  Keyboard,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/layout/site-header";

// 核心功能
const features = [
  {
    icon: Bot,
    title: "智能 AI Agent",
    description: "基于大语言模型的智能代理，自动理解需求并执行复杂任务",
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
  {
    icon: GitBranch,
    title: "可视化工作流",
    description: "拖拽式编辑器，轻松构建和管理自动化工作流",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: Puzzle,
    title: "丰富的集成",
    description: "支持 100+ 主流服务和 API 的无缝集成",
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  {
    icon: Layers,
    title: "模板市场",
    description: "数千个经过验证的工作流模板，一键部署即可使用",
    gradient: "from-orange-500/20 to-amber-500/20",
  },
  {
    icon: Shield,
    title: "企业级安全",
    description: "SOC 2 认证，端到端加密，完善的权限管理",
    gradient: "from-red-500/20 to-rose-500/20",
  },
  {
    icon: Globe,
    title: "全球部署",
    description: "多区域部署，低延迟访问，99.99% 可用性保障",
    gradient: "from-indigo-500/20 to-violet-500/20",
  },
];

// 数据统计
const stats = [
  { value: "50,000+", label: "活跃用户" },
  { value: "1M+", label: "工作流执行" },
  { value: "99.99%", label: "服务可用性" },
  { value: "100+", label: "集成服务" },
];

// 工作流程步骤
const workflowSteps = [
  {
    step: 1,
    title: "描述需求",
    description: "用自然语言告诉 AI 你想要实现什么",
    icon: MessageSquare,
  },
  {
    step: 2,
    title: "AI 生成工作流",
    description: "智能助手自动设计工作流架构",
    icon: Bot,
  },
  {
    step: 3,
    title: "可视化调整",
    description: "通过拖拽编辑器微调和优化流程",
    icon: Settings,
  },
  {
    step: 4,
    title: "一键部署",
    description: "部署到云端，自动触发执行",
    icon: Rocket,
  },
];

// 客户评价
const testimonials = [
  {
    content: "AgentFlow 彻底改变了我们的工作方式。以前需要整个团队一周完成的数据处理任务，现在只需要几分钟。",
    author: "张明",
    role: "技术总监",
    company: "科技创新公司",
    avatar: "Z",
    rating: 5,
  },
  {
    content: "可视化编辑器太棒了，即使没有编程背景的同事也能快速上手创建自动化流程。",
    author: "李华",
    role: "产品经理",
    company: "电商平台",
    avatar: "L",
    rating: 5,
  },
  {
    content: "AI Agent 的智能程度超出预期，它能理解我们的业务逻辑并给出优化建议。",
    author: "王芳",
    role: "运营负责人",
    company: "金融科技",
    avatar: "W",
    rating: 5,
  },
  {
    content: "模板市场里有大量现成的工作流，直接用就能满足 80% 的需求，非常方便。",
    author: "陈伟",
    role: "创始人",
    company: "初创公司",
    avatar: "C",
    rating: 5,
  },
  {
    content: "企业级的安全保障让我们放心地将核心业务流程迁移到 AgentFlow 上。",
    author: "赵丽",
    role: "安全主管",
    company: "大型企业",
    avatar: "ZL",
    rating: 5,
  },
  {
    content: "客户支持团队响应很快，任何问题都能在 24 小时内得到解决。",
    author: "孙强",
    role: "IT 经理",
    company: "制造业",
    avatar: "S",
    rating: 5,
  },
];

// 合作伙伴/客户
const partners = [
  { name: "TechCorp", logo: "TC" },
  { name: "InnovateLabs", logo: "IL" },
  { name: "DataFlow", logo: "DF" },
  { name: "CloudNine", logo: "C9" },
  { name: "AIVentures", logo: "AV" },
  { name: "SmartSystems", logo: "SS" },
  { name: "FutureTech", logo: "FT" },
  { name: "DigitalWave", logo: "DW" },
];

// 用例场景
const useCases = [
  {
    icon: ShoppingCart,
    title: "电商运营",
    description: "自动化订单处理、库存管理、客户通知，提升运营效率 300%",
    metrics: "效率提升 300%",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: Briefcase,
    title: "企业办公",
    description: "审批流程、日程安排、报告生成，让团队专注于核心业务",
    metrics: "节省 40 小时/周",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: TrendingUp,
    title: "营销自动化",
    description: "多渠道内容发布、数据分析、线索跟进，全流程自动化",
    metrics: "转化率提升 150%",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: HeartPulse,
    title: "医疗健康",
    description: "预约管理、患者跟踪、数据归档，合规又高效",
    metrics: "处理量提升 200%",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: GraduationCap,
    title: "教育培训",
    description: "课程管理、学员通知、证书发放，教育机构的得力助手",
    metrics: "管理效率提升 250%",
    color: "from-indigo-500 to-violet-500",
  },
  {
    icon: Building2,
    title: "金融服务",
    description: "风控审核、报表生成、合规检查，安全可靠的自动化",
    metrics: "风险降低 60%",
    color: "from-red-500 to-rose-500",
  },
];

// FAQ 数据
const faqs = [
  {
    question: "AgentFlow 适合什么规模的企业使用？",
    answer: "AgentFlow 适合各种规模的企业使用。从个人创业者到大型企业，我们提供灵活的方案。免费版本适合个人和小团队入门，企业版本则提供更多高级功能、更大的使用量和专属支持服务。",
  },
  {
    question: "需要编程知识才能使用吗？",
    answer: "完全不需要！AgentFlow 的可视化编辑器让任何人都能通过拖拽方式创建工作流。同时，我们的 AI 助手可以根据自然语言描述自动生成工作流。当然，如果你有编程背景，也可以使用高级功能进行更精细的定制。",
  },
  {
    question: "数据安全如何保障？",
    answer: "我们非常重视数据安全。AgentFlow 通过了 SOC 2 Type II 认证，所有数据传输都采用 TLS 1.3 加密，静态数据使用 AES-256 加密。我们还提供企业级的访问控制、审计日志和数据隔离功能。",
  },
  {
    question: "可以与现有系统集成吗？",
    answer: "当然可以！AgentFlow 支持 100+ 主流服务的原生集成，包括 Slack、企业微信、钉钉、Notion、飞书、GitHub 等。同时支持通过 Webhook 和 API 与任何自定义系统集成。",
  },
  {
    question: "免费试用有什么限制？",
    answer: "免费试用期为 14 天，期间可以使用所有专业版功能，无需绑定信用卡。试用结束后，你可以选择继续使用免费版（有一定使用量限制），或升级到付费版本获得更多资源和功能。",
  },
  {
    question: "如何获取技术支持？",
    answer: "我们提供多种支持渠道：在线文档和教程、社区论坛、邮件支持（24小时内响应）。付费用户还可以获得优先技术支持，企业版用户更有专属客户经理提供一对一服务。",
  },
];

// 集成服务
const integrations = [
  { name: "Slack", category: "通讯", icon: "💬" },
  { name: "飞书", category: "通讯", icon: "🐦" },
  { name: "企业微信", category: "通讯", icon: "💼" },
  { name: "钉钉", category: "通讯", icon: "📌" },
  { name: "GitHub", category: "开发", icon: "🐙" },
  { name: "GitLab", category: "开发", icon: "🦊" },
  { name: "Notion", category: "协作", icon: "📝" },
  { name: "Airtable", category: "数据", icon: "📊" },
  { name: "Google Sheets", category: "数据", icon: "📗" },
  { name: "Shopify", category: "电商", icon: "🛒" },
  { name: "Stripe", category: "支付", icon: "💳" },
  { name: "OpenAI", category: "AI", icon: "🤖" },
  { name: "Claude", category: "AI", icon: "🧠" },
  { name: "MySQL", category: "数据库", icon: "🗄️" },
  { name: "PostgreSQL", category: "数据库", icon: "🐘" },
  { name: "MongoDB", category: "数据库", icon: "🍃" },
  { name: "Redis", category: "缓存", icon: "⚡" },
  { name: "AWS S3", category: "云存储", icon: "☁️" },
  { name: "Twilio", category: "短信", icon: "📱" },
  { name: "SendGrid", category: "邮件", icon: "✉️" },
];

// AI 能力
const aiCapabilities = [
  {
    icon: Lightbulb,
    title: "智能理解",
    description: "理解自然语言描述的业务需求，自动分解复杂任务",
    example: "\"当用户下单后，自动发送确认邮件并更新库存\"",
  },
  {
    icon: Code,
    title: "代码生成",
    description: "根据需求自动生成工作流代码和自定义节点",
    example: "自动生成数据转换、API调用等代码",
  },
  {
    icon: Target,
    title: "智能优化",
    description: "分析工作流性能，提供优化建议和自动调整",
    example: "检测瓶颈节点，建议并行化处理",
  },
  {
    icon: Shield,
    title: "异常处理",
    description: "智能识别运行异常，自动重试和告警",
    example: "API超时自动重试，失败自动通知",
  },
];

// 开发者资源
const devResources = [
  {
    icon: Code,
    title: "REST API",
    description: "完整的 RESTful API，支持所有平台功能的编程访问",
    link: "/developers/api",
  },
  {
    icon: Puzzle,
    title: "SDK",
    description: "Node.js、Python、Go 等多语言 SDK，快速集成",
    link: "/developers/sdk",
  },
  {
    icon: Layers,
    title: "插件市场",
    description: "丰富的社区插件，扩展平台能力",
    link: "/plugins",
  },
  {
    icon: FileText,
    title: "开发文档",
    description: "详尽的文档和教程，从入门到精通",
    link: "/docs",
  },
];

// 安全认证
const securityBadges = [
  { name: "SOC 2 Type II", icon: Shield, description: "安全审计认证" },
  { name: "GDPR", icon: Globe, description: "欧盟数据保护" },
  { name: "ISO 27001", icon: Award, description: "信息安全管理" },
  { name: "99.99% SLA", icon: Zap, description: "高可用保障" },
];

// 对比数据
const comparisonData = {
  features: [
    { name: "可视化编辑器", us: true, traditional: false, competitor: true },
    { name: "AI 智能生成", us: true, traditional: false, competitor: false },
    { name: "自然语言交互", us: true, traditional: false, competitor: false },
    { name: "无代码使用", us: true, traditional: false, competitor: true },
    { name: "100+ 集成", us: true, traditional: false, competitor: true },
    { name: "企业级安全", us: true, traditional: true, competitor: false },
    { name: "中国本土化", us: true, traditional: false, competitor: false },
    { name: "私有部署", us: true, traditional: true, competitor: false },
  ],
};

// 媒体报道 & 荣誉
const mediaFeatures = [
  { name: "36氪", quote: "年度最具创新力企业服务产品", logo: "36Kr" },
  { name: "极客公园", quote: "AI 自动化领域的领跑者", logo: "GeekPark" },
  { name: "钛媒体", quote: "重新定义企业自动化", logo: "TMT" },
  { name: "虎嗅", quote: "值得关注的AI工作流平台", logo: "Huxiu" },
  { name: "InfoQ", quote: "开发者最喜爱的自动化工具", logo: "InfoQ" },
];

// 定价方案预览
const pricingPlans = [
  {
    name: "免费版",
    price: "¥0",
    period: "永久免费",
    description: "适合个人用户和小型项目",
    features: ["每月 1,000 次执行", "5 个工作流", "基础集成", "社区支持"],
    highlight: false,
    cta: "免费开始",
  },
  {
    name: "专业版",
    price: "¥99",
    period: "/月",
    description: "适合成长型团队",
    features: ["每月 50,000 次执行", "无限工作流", "高级集成", "AI 助手", "优先支持"],
    highlight: true,
    cta: "免费试用 14 天",
  },
  {
    name: "企业版",
    price: "定制",
    period: "",
    description: "适合大型企业",
    features: ["无限执行", "私有部署", "SSO/SAML", "专属客户经理", "SLA 保障"],
    highlight: false,
    cta: "联系销售",
  },
];

// 产品路线图
const roadmapItems = [
  {
    quarter: "Q1 2026",
    status: "completed",
    items: ["AI Agent 2.0", "飞书深度集成", "全球加速节点"],
  },
  {
    quarter: "Q2 2026",
    status: "in-progress",
    items: ["可视化调试器", "团队协作功能", "移动端 App"],
  },
  {
    quarter: "Q3 2026",
    status: "planned",
    items: ["AI 自动优化", "多租户支持", "高级分析面板"],
  },
  {
    quarter: "Q4 2026",
    status: "planned",
    items: ["边缘计算支持", "工作流市场 2.0", "企业级监控"],
  },
];

// 快速演示用例
const demoUseCases = [
  {
    title: "邮件自动回复",
    description: "AI 分析邮件内容，智能分类并自动回复",
    icon: Mail,
    time: "2分钟创建",
  },
  {
    title: "数据同步",
    description: "在多个系统间自动同步数据",
    icon: Database,
    time: "3分钟创建",
  },
  {
    title: "审批流程",
    description: "自动化处理审批请求和通知",
    icon: CheckCircle,
    time: "5分钟创建",
  },
  {
    title: "社交媒体",
    description: "定时发布和管理多平台内容",
    icon: Globe,
    time: "4分钟创建",
  },
];

// 成功案例
const successCases = [
  {
    company: "某知名电商平台",
    logo: "EC",
    industry: "电商",
    result: "订单处理效率提升 400%",
    quote: "接入 AgentFlow 后，我们的客服团队从原来的 20 人缩减到 5 人，同时响应速度提升了 3 倍。",
    metrics: [
      { label: "效率提升", value: "400%" },
      { label: "成本降低", value: "60%" },
      { label: "客户满意度", value: "98%" },
    ],
    avatar: "张总",
    role: "运营副总裁",
  },
  {
    company: "某金融科技公司",
    logo: "FT",
    industry: "金融",
    result: "风控审核时间从 2 天缩短至 2 小时",
    quote: "AgentFlow 的 AI 能力让我们的风控模型更加智能，误报率下降了 80%。",
    metrics: [
      { label: "审核时间", value: "-95%" },
      { label: "误报率", value: "-80%" },
      { label: "合规率", value: "100%" },
    ],
    avatar: "李总",
    role: "首席技术官",
  },
  {
    company: "某连锁餐饮品牌",
    logo: "FB",
    industry: "餐饮",
    result: "门店运营自动化覆盖率达到 90%",
    quote: "从订单管理到库存预警，AgentFlow 帮我们实现了真正的智能化运营。",
    metrics: [
      { label: "自动化率", value: "90%" },
      { label: "人力成本", value: "-45%" },
      { label: "损耗降低", value: "35%" },
    ],
    avatar: "王总",
    role: "数字化负责人",
  },
];

// 社区统计
const communityStats = [
  { icon: Users, value: "50,000+", label: "活跃用户" },
  { icon: Code, value: "2,000+", label: "开源贡献者" },
  { icon: Layers, value: "5,000+", label: "模板数量" },
  { icon: MessageSquare, value: "100,000+", label: "社区讨论" },
  { icon: Star, value: "15,000+", label: "GitHub Stars" },
  { icon: Globe, value: "80+", label: "国家/地区" },
];

// 技术亮点
const techHighlights = [
  {
    title: "云原生架构",
    description: "基于 Kubernetes 构建，支持弹性伸缩和高可用部署",
    icon: Database,
  },
  {
    title: "多模型支持",
    description: "支持 GPT-4、Claude、文心一言等主流大模型",
    icon: Bot,
  },
  {
    title: "实时协作",
    description: "多人实时编辑工作流，WebSocket 实时同步",
    icon: Users,
  },
  {
    title: "版本控制",
    description: "内置 Git 式版本管理，支持回滚和分支",
    icon: GitBranch,
  },
];

// 荣誉奖项
const awards = [
  { year: "2026", title: "年度最佳 AI 产品", org: "中国人工智能产业联盟" },
  { year: "2025", title: "最具创新力企业服务", org: "36氪 WISE 大会" },
  { year: "2025", title: "开发者最喜爱工具 TOP 10", org: "InfoQ" },
  { year: "2025", title: "最佳低代码平台", org: "Gartner" },
];

// 视频演示
const videoDemo = {
  title: "3 分钟了解 AgentFlow",
  description: "看看如何用自然语言创建复杂的自动化工作流",
  thumbnail: "/video-thumbnail.jpg",
  duration: "3:24",
};

// 即将举办的活动
const upcomingEvents = [
  {
    date: "2026-02-15",
    title: "AgentFlow 线上研讨会",
    description: "AI 自动化最佳实践分享",
    type: "线上",
    link: "/events/webinar-feb",
  },
  {
    date: "2026-02-28",
    title: "开发者 Meetup 上海站",
    description: "与核心团队面对面交流",
    type: "线下",
    link: "/events/meetup-shanghai",
  },
  {
    date: "2026-03-10",
    title: "企业数字化转型峰会",
    description: "AgentFlow 助力企业自动化",
    type: "线上",
    link: "/events/digital-summit",
  },
];

// 移动端信息
const mobileApps = {
  ios: { available: true, version: "2.1.0" },
  android: { available: true, version: "2.1.0" },
  features: ["实时监控工作流", "移动端审批", "推送通知", "离线查看"],
};

// 团队成员
const teamMembers = [
  {
    name: "张明",
    role: "创始人 & CEO",
    avatar: "ZM",
    bio: "前阿里云产品副总裁，15年企业服务经验",
    social: { twitter: "#", linkedin: "#" },
  },
  {
    name: "李雪",
    role: "联合创始人 & CTO",
    avatar: "LX",
    bio: "前 Google AI 研究员，AI/ML 领域专家",
    social: { twitter: "#", linkedin: "#" },
  },
  {
    name: "王磊",
    role: "首席产品官",
    avatar: "WL",
    bio: "前字节跳动产品总监，用户体验专家",
    social: { twitter: "#", linkedin: "#" },
  },
  {
    name: "陈静",
    role: "首席运营官",
    avatar: "CJ",
    bio: "前腾讯云商业化负责人，10年运营经验",
    social: { twitter: "#", linkedin: "#" },
  },
];

// 全球数据中心
const globalDataCenters = [
  { region: "亚太", locations: ["上海", "新加坡", "东京"], latency: "< 20ms" },
  { region: "北美", locations: ["硅谷", "弗吉尼亚"], latency: "< 30ms" },
  { region: "欧洲", locations: ["法兰克福", "伦敦"], latency: "< 25ms" },
];

// 学习资源
const learningResources = [
  {
    title: "AgentFlow 认证课程",
    description: "系统学习，获得官方认证",
    icon: "GraduationCap",
    duration: "8 小时",
    level: "初级到高级",
    link: "/learn/certification",
  },
  {
    title: "实战工作坊",
    description: "跟着专家动手实践",
    icon: "Wrench",
    duration: "2 小时/期",
    level: "中级",
    link: "/learn/workshops",
  },
  {
    title: "案例研究库",
    description: "深入了解成功案例",
    icon: "BookOpen",
    duration: "自定进度",
    level: "所有级别",
    link: "/learn/case-studies",
  },
];

// 合作伙伴计划
const partnerPrograms = [
  {
    type: "技术合作伙伴",
    benefits: ["API 优先接入", "联合市场推广", "技术支持"],
    icon: "Code",
  },
  {
    type: "咨询合作伙伴",
    benefits: ["培训认证", "项目分成", "销售支持"],
    icon: "Briefcase",
  },
  {
    type: "渠道合作伙伴",
    benefits: ["代理授权", "市场资源", "专属折扣"],
    icon: "Users",
  },
];

// 实时平台数据
const livePlatformStats = {
  activeWorkflows: 125847,
  tasksToday: 3284519,
  avgResponseTime: 0.12,
  uptime: 99.99,
};

// 行业解决方案
const industrySolutions = [
  {
    industry: "电子商务",
    icon: "ShoppingCart",
    description: "自动化订单处理、库存管理、客户服务",
    benefits: ["订单处理效率提升 300%", "库存准确率 99.9%", "客服响应 < 1分钟"],
    color: "from-orange-500/20 to-orange-500/5",
  },
  {
    industry: "金融服务",
    icon: "Building2",
    description: "风控审批、合规监测、报表生成",
    benefits: ["风控审批时间缩短 80%", "合规覆盖率 100%", "报表生成自动化"],
    color: "from-blue-500/20 to-blue-500/5",
  },
  {
    industry: "医疗健康",
    icon: "HeartPulse",
    description: "患者管理、预约调度、数据分析",
    benefits: ["预约效率提升 200%", "患者满意度 95%+", "数据洞察实时化"],
    color: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    industry: "教育培训",
    icon: "GraduationCap",
    description: "学员管理、课程安排、学习追踪",
    benefits: ["管理效率提升 250%", "学员留存率 +40%", "个性化学习路径"],
    color: "from-purple-500/20 to-purple-500/5",
  },
];

// 客户支持渠道
const supportChannels = [
  { name: "在线客服", description: "7x24 实时响应", icon: "MessageSquare", available: true },
  { name: "技术支持", description: "专业工程师团队", icon: "Headphones", available: true },
  { name: "社区论坛", description: "开发者互助", icon: "Users", available: true },
  { name: "文档中心", description: "详尽的使用指南", icon: "FileText", available: true },
];

// 博客文章预览
const blogPosts = [
  {
    title: "2026 年企业自动化趋势报告",
    excerpt: "深入分析 AI 自动化如何重塑企业运营模式...",
    category: "行业洞察",
    readTime: "8 分钟",
    date: "2026-01-25",
  },
  {
    title: "从零开始构建智能客服系统",
    excerpt: "手把手教你使用 AgentFlow 搭建 AI 客服...",
    category: "实战教程",
    readTime: "12 分钟",
    date: "2026-01-22",
  },
  {
    title: "AgentFlow vs Zapier：全面对比",
    excerpt: "两大自动化平台的深度对比分析...",
    category: "产品对比",
    readTime: "10 分钟",
    date: "2026-01-18",
  },
];

// 投资方信息
const investors = [
  { name: "红杉资本", logo: "Sequoia" },
  { name: "高瓴创投", logo: "Hillhouse" },
  { name: "腾讯投资", logo: "Tencent" },
  { name: "GGV 纪源资本", logo: "GGV" },
];

// 信任指标
const trustIndicators = [
  { label: "数据加密", value: "端到端 AES-256", icon: "Shield" },
  { label: "数据存储", value: "用户数据本地化", icon: "Database" },
  { label: "隐私合规", value: "GDPR / CCPA", icon: "CheckCircle" },
  { label: "安全审计", value: "SOC 2 Type II", icon: "Award" },
];

// 实时公告
const announcements = [
  { text: "🎉 AgentFlow 2.0 正式发布！AI 能力全面升级", link: "/blog/v2-release", isNew: true },
  { text: "📅 2月15日线上研讨会：AI 自动化最佳实践", link: "/events/webinar-feb", isNew: false },
];

// 产品界面预览
const productScreenshots = [
  { title: "可视化工作流编辑器", description: "拖拽式操作，零代码创建复杂流程" },
  { title: "AI 对话式创建", description: "用自然语言描述，AI 自动生成工作流" },
  { title: "实时监控面板", description: "全方位掌控工作流运行状态" },
  { title: "数据分析报表", description: "深入洞察自动化效果与 ROI" },
];

// 客户分布数据
const customerDistribution = {
  total: 50000,
  regions: [
    { name: "中国", percentage: 45, count: 22500 },
    { name: "北美", percentage: 25, count: 12500 },
    { name: "欧洲", percentage: 18, count: 9000 },
    { name: "亚太其他", percentage: 12, count: 6000 },
  ],
};

// 开源贡献
const openSourceStats = {
  repos: 12,
  stars: 8500,
  contributors: 320,
  commits: 15000,
};

// 热门模板
const popularTemplates = [
  { name: "客服自动回复", uses: "12.5k", category: "客户服务", icon: "MessageSquare" },
  { name: "订单状态同步", uses: "8.3k", category: "电商", icon: "ShoppingCart" },
  { name: "日报自动生成", uses: "6.7k", category: "办公效率", icon: "FileText" },
  { name: "数据备份流程", uses: "5.2k", category: "运维", icon: "Database" },
  { name: "新员工入职", uses: "4.8k", category: "人力资源", icon: "Users" },
  { name: "社交媒体发布", uses: "4.1k", category: "营销", icon: "Globe" },
];

// ROI 计算示例
const roiExamples = [
  { task: "数据录入", before: "2小时/天", after: "5分钟/天", savings: "97%" },
  { task: "报表生成", before: "4小时/周", after: "自动完成", savings: "100%" },
  { task: "客户响应", before: "30分钟", after: "即时", savings: "95%" },
];

// 实时数据
const liveStats = {
  usersOnline: 2847,
  workflowsRunning: 15623,
  tasksCompleted: 892451,
};

// 白皮书资源
const whitepapers = [
  { title: "2026 企业自动化白皮书", downloads: "15k+", pages: 48 },
  { title: "AI Agent 最佳实践指南", downloads: "12k+", pages: 36 },
  { title: "低代码平台选型报告", downloads: "8k+", pages: 24 },
];

// 键盘快捷键
const shortcuts = [
  { keys: ["⌘", "K"], action: "快速搜索" },
  { keys: ["⌘", "N"], action: "新建工作流" },
  { keys: ["⌘", "R"], action: "运行当前流程" },
  { keys: ["⌘", "S"], action: "保存草稿" },
  { keys: ["Space"], action: "预览结果" },
];

// 性能基准
const benchmarks = [
  { metric: "API 响应时间", value: "< 50ms", percentile: "P99" },
  { metric: "工作流执行", value: "< 200ms", percentile: "平均" },
  { metric: "数据同步延迟", value: "< 1s", percentile: "实时" },
];

// 社交媒体推文
const socialPosts = [
  { platform: "Twitter", user: "@techfounder", content: "刚用 AgentFlow 把我们的客服响应时间从 2 小时降到了 5 分钟，太疯狂了！", likes: 892 },
  { platform: "微博", user: "@产品经理老王", content: "终于找到一个不需要写代码就能搞定复杂自动化的工具了，强烈推荐！", likes: 1.2 },
  { platform: "LinkedIn", user: "Sarah Chen", content: "Our team productivity increased by 40% after implementing AgentFlow.", likes: 456 },
];

// 多语言支持
const languages = [
  { code: "zh-CN", name: "简体中文", flag: "🇨🇳" },
  { code: "zh-TW", name: "繁體中文", flag: "🇹🇼" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
];

// 版本历史
const versionHistory = [
  { version: "2.0", date: "2026-01", highlights: ["AI Agent 2.0", "实时协作", "企业 SSO"] },
  { version: "1.8", date: "2025-10", highlights: ["飞书集成", "数据加密升级"] },
  { version: "1.5", date: "2025-06", highlights: ["可视化编辑器", "模板市场"] },
];

// 最新动态
const updates = [
  {
    date: "2026-01-28",
    tag: "新功能",
    tagColor: "bg-primary/10 text-primary",
    title: "AI Agent 2.0 重磅发布",
    description: "全新升级的 AI 引擎，理解能力提升 50%，支持更复杂的业务场景。",
    link: "/blog/ai-agent-2",
  },
  {
    date: "2026-01-20",
    tag: "集成",
    tagColor: "bg-blue-500/10 text-blue-600",
    title: "新增飞书深度集成",
    description: "支持飞书文档、多维表格、审批流程的双向同步。",
    link: "/blog/feishu-integration",
  },
  {
    date: "2026-01-15",
    tag: "性能",
    tagColor: "bg-emerald-500/10 text-emerald-600",
    title: "全球加速节点上线",
    description: "新增东京、新加坡、法兰克福节点，亚太地区延迟降低 60%。",
    link: "/blog/global-acceleration",
  },
];

// 页脚链接
const footerLinks = {
  product: [
    { label: "功能", href: "/features" },
    { label: "定价", href: "/pricing" },
    { label: "模板", href: "/store" },
    { label: "集成", href: "/dashboard/integrations" },
    { label: "更新日志", href: "/whats-new" },
    { label: "路线图", href: "/roadmap" },
  ],
  resources: [
    { label: "文档", href: "/docs" },
    { label: "API 参考", href: "/developers" },
    { label: "博客", href: "/blog" },
    { label: "教程", href: "/learn/courses" },
    { label: "用例", href: "/use-cases" },
    { label: "社区", href: "/community" },
  ],
  company: [
    { label: "关于我们", href: "/about" },
    { label: "招聘", href: "/careers" },
    { label: "新闻", href: "/press" },
    { label: "联系我们", href: "/contact" },
    { label: "合作伙伴", href: "/partners" },
  ],
  legal: [
    { label: "隐私政策", href: "/privacy" },
    { label: "服务条款", href: "/terms" },
    { label: "安全", href: "/security" },
    { label: "SLA", href: "/sla" },
  ],
};

// FAQ 组件
function FAQItem({ question, answer, isOpen, onToggle }: { 
  question: string; 
  answer: string; 
  isOpen: boolean; 
  onToggle: () => void; 
}) {
  return (
    <div className={cn(
      "border border-border rounded-2xl overflow-hidden transition-all duration-300",
      isOpen && "border-primary/30 bg-card"
    )}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium text-foreground pr-4">{question}</span>
        <span className={cn(
          "shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
          isOpen ? "bg-primary text-primary-foreground rotate-0" : "bg-muted text-muted-foreground"
        )}>
          {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </span>
      </button>
      <div className={cn(
        "grid transition-all duration-300 ease-in-out",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <p className="px-6 pb-6 text-muted-foreground leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    setIsLoaded(true);
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % workflowSteps.length);
    }, 3000);
    
    // 自动切换评价
    const testimonialInterval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    
    return () => {
      clearInterval(stepInterval);
      clearInterval(testimonialInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <SiteHeader />

      {/* Announcement Banner */}
      <div className="bg-primary text-primary-foreground py-2.5 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-6 overflow-x-auto">
            {announcements.map((announcement, idx) => (
              <Link
                key={idx}
                href={announcement.link}
                className="flex items-center gap-2 whitespace-nowrap hover:underline group"
              >
                <span>{announcement.text}</span>
                {announcement.isNew && (
                  <span className="px-1.5 py-0.5 rounded text-xs bg-white/20 font-medium">NEW</span>
                )}
                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-32 pb-24 px-6 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full",
              "bg-primary/10 border border-primary/20",
              "text-sm text-primary font-medium mb-8",
              "transition-all duration-700",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <Sparkles className="h-4 w-4" />
            新功能上线：AI Agent 2.0 — 更智能、更强大
            <ArrowRight className="h-3 w-3" />
          </div>

          {/* Title */}
          <h1
            className={cn(
              "text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight mb-6",
              "transition-all duration-700 delay-100",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            构建下一代
            <br className="hidden sm:block" />
            <span className="text-primary">AI 工作流</span>
          </h1>

          {/* Subtitle */}
          <p
            className={cn(
              "text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10",
              "transition-all duration-700 delay-200",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            通过可视化编辑器和智能 AI Agent，快速构建、部署和管理自动化工作流程。
            <span className="text-foreground font-medium">
              让重复性工作交给机器，释放团队创造力。
            </span>
          </p>

          {/* CTA Buttons */}
          <div
            className={cn(
              "flex flex-col sm:flex-row items-center justify-center gap-4 mb-10",
              "transition-all duration-700 delay-300",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <Link href="/register">
              <Button
                size="lg"
                className={cn(
                  "h-12 px-8 rounded-full",
                  "bg-primary hover:bg-primary/90",
                  "text-primary-foreground font-medium",
                  "shadow-lg shadow-primary/20 hover:shadow-primary/30",
                  "transition-all duration-300",
                  "group"
                )}
              >
                免费开始使用
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 rounded-full border-border hover:border-primary/50"
              >
                <Play className="mr-2 h-4 w-4" />
                登录账户
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div
            className={cn(
              "flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm text-muted-foreground",
              "transition-all duration-700 delay-400",
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              免费试用 14 天
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              无需信用卡
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              5 分钟快速上手
            </span>
          </div>
        </div>

        {/* Hero Image/Demo Preview */}
        <div
          className={cn(
            "max-w-5xl mx-auto mt-16 relative",
            "transition-all duration-1000 delay-500",
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="relative rounded-2xl overflow-hidden border border-border bg-card/50 backdrop-blur-sm shadow-2xl shadow-primary/5">
            {/* Browser Frame */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-full bg-background/50 text-xs text-muted-foreground border border-border">
                  app.agentflow.ai/workflow/editor
                </div>
              </div>
            </div>

            {/* Workflow Preview */}
            <div className="p-6 sm:p-8 bg-gradient-to-b from-background to-muted/20 min-h-[300px] sm:min-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Workflow className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">客户反馈自动化流程</h3>
                    <p className="text-xs text-muted-foreground">4 个节点 · 运行中</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    运行中
                  </span>
                </div>
              </div>

              {/* Workflow Nodes */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
                {/* Node 1 */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 flex items-center justify-center",
                    "bg-card shadow-lg transition-all duration-500",
                    activeStep === 0 ? "border-primary scale-110" : "border-border"
                  )}>
                    <MessageSquare className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 transition-colors",
                      activeStep === 0 ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <span className="mt-2 text-xs text-muted-foreground">接收反馈</span>
                </div>

                {/* Connection */}
                <div className="hidden sm:flex items-center">
                  <div className={cn(
                    "h-0.5 w-12 transition-colors duration-500",
                    activeStep >= 1 ? "bg-primary" : "bg-border"
                  )} />
                  <ChevronRight className={cn(
                    "w-4 h-4 -ml-1 transition-colors duration-500",
                    activeStep >= 1 ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>

                {/* Node 2 */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 flex items-center justify-center",
                    "bg-card shadow-lg transition-all duration-500",
                    activeStep === 1 ? "border-primary scale-110" : "border-border"
                  )}>
                    <Bot className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 transition-colors",
                      activeStep === 1 ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <span className="mt-2 text-xs text-muted-foreground">AI 分析</span>
                </div>

                {/* Connection */}
                <div className="hidden sm:flex items-center">
                  <div className={cn(
                    "h-0.5 w-12 transition-colors duration-500",
                    activeStep >= 2 ? "bg-primary" : "bg-border"
                  )} />
                  <ChevronRight className={cn(
                    "w-4 h-4 -ml-1 transition-colors duration-500",
                    activeStep >= 2 ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>

                {/* Node 3 */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 flex items-center justify-center",
                    "bg-card shadow-lg transition-all duration-500",
                    activeStep === 2 ? "border-primary scale-110" : "border-border"
                  )}>
                    <Send className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 transition-colors",
                      activeStep === 2 ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <span className="mt-2 text-xs text-muted-foreground">自动回复</span>
                </div>

                {/* Connection */}
                <div className="hidden sm:flex items-center">
                  <div className={cn(
                    "h-0.5 w-12 transition-colors duration-500",
                    activeStep >= 3 ? "bg-primary" : "bg-border"
                  )} />
                  <ChevronRight className={cn(
                    "w-4 h-4 -ml-1 transition-colors duration-500",
                    activeStep >= 3 ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>

                {/* Node 4 */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 flex items-center justify-center",
                    "bg-card shadow-lg transition-all duration-500",
                    activeStep === 3 ? "border-primary scale-110" : "border-border"
                  )}>
                    <Database className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 transition-colors",
                      activeStep === 3 ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <span className="mt-2 text-xs text-muted-foreground">数据归档</span>
                </div>
              </div>

              {/* Live Activity */}
              <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">最近执行</span>
                  <span className="text-primary">2 秒前</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <CircleCheck className="w-4 h-4 text-primary" />
                  <span className="text-foreground">成功处理来自 <span className="font-medium">user@example.com</span> 的反馈</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "text-center p-6 rounded-2xl",
                  "bg-card/50 border border-border",
                  "hover:border-primary/30 hover:bg-card",
                  "transition-all duration-300"
                )}
              >
                <div className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <Play className="h-3.5 w-3.5" />
              产品演示
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {videoDemo.title}
            </h2>
            <p className="text-lg text-muted-foreground">
              {videoDemo.description}
            </p>
          </div>

          {/* Video Player Placeholder */}
          <div className="relative rounded-3xl overflow-hidden border border-border bg-foreground/5 aspect-video group cursor-pointer">
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />
            
            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center",
                "bg-primary text-primary-foreground",
                "shadow-xl shadow-primary/30",
                "group-hover:scale-110 transition-transform duration-300"
              )}>
                <Play className="w-8 h-8 ml-1" fill="currentColor" />
              </div>
            </div>

            {/* Video Info */}
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">{videoDemo.title}</h3>
                <p className="text-white/70 text-sm">{videoDemo.description}</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-white/20 text-white text-sm backdrop-blur-sm">
                {videoDemo.duration}
              </span>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-[80px]" />
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-primary/10 rounded-full blur-[100px]" />
          </div>

          {/* Quick Links */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/docs/quick-start">
              <Button variant="outline" className="rounded-full">
                <FileText className="mr-2 h-4 w-4" />
                快速入门指南
              </Button>
            </Link>
            <Link href="/learn/courses">
              <Button variant="outline" className="rounded-full">
                <GraduationCap className="mr-2 h-4 w-4" />
                视频教程
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Product Screenshots Section */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <Layers className="h-3.5 w-3.5" />
              产品界面
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              简洁强大的操作界面
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              精心设计的用户体验，让复杂的自动化变得简单直观
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {productScreenshots.map((screenshot, idx) => (
              <div
                key={screenshot.title}
                className={cn(
                  "group relative overflow-hidden rounded-2xl",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-xl",
                  "transition-all duration-300"
                )}
              >
                {/* Screenshot Placeholder */}
                <div className="aspect-video bg-muted/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
                  
                  {/* Mockup UI Elements */}
                  <div className="absolute inset-4 rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                      <div className="flex-1 h-6 rounded bg-muted ml-4" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 rounded bg-muted w-3/4" />
                      <div className="h-4 rounded bg-muted w-1/2" />
                      <div className="h-20 rounded bg-primary/10 mt-4" />
                    </div>
                  </div>
                  
                  {/* Number Badge */}
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </div>
                </div>
                
                {/* Info */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {screenshot.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {screenshot.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/demo">
              <Button className="rounded-full bg-primary hover:bg-primary/90">
                预约产品演示
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <Clock className="h-3.5 w-3.5" />
              5 分钟上手
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              简单四步，开启自动化
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              从创意到部署，全程 AI 辅助，无需任何编程经验
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {workflowSteps.map((step, index) => (
              <div
                key={step.step}
                className={cn(
                  "relative p-6 rounded-2xl",
                  "bg-card border border-border",
                  "hover:border-primary/30",
                  "transition-all duration-300 group"
                )}
              >
                {/* Step Number */}
                <div className="absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground">
                  Step {step.step}
                </div>

                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mt-4 mb-4 transition-transform group-hover:scale-110 bg-primary/10">
                  <step.icon className="w-7 h-7 text-primary" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                {/* Connection Line */}
                {index < workflowSteps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              一站式自动化平台
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              从简单的任务自动化到复杂的企业级工作流，AgentFlow 满足您的一切需求
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={cn(
                  "group p-6 rounded-2xl",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5",
                  "transition-all duration-300"
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                    "bg-gradient-to-br",
                    feature.gradient,
                    "group-hover:scale-110 transition-transform duration-300"
                  )}
                >
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners/Clients Section */}
      <section className="py-16 px-6 border-y border-border/50 bg-muted/30 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-8">
            受到全球领先企业信赖
          </p>
          
          {/* Scrolling logos */}
          <div className="relative">
            <div className="flex gap-12 animate-scroll">
              {[...partners, ...partners].map((partner, index) => (
                <div
                  key={`${partner.name}-${index}`}
                  className={cn(
                    "flex items-center gap-3 px-6 py-3 rounded-xl",
                    "bg-card/50 border border-border/50",
                    "hover:border-primary/30 transition-colors",
                    "shrink-0"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {partner.logo}
                  </div>
                  <span className="text-foreground font-medium whitespace-nowrap">{partner.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats Banner */}
      <section className="py-6 px-6 bg-foreground text-background">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-center">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-sm">
                <span className="font-bold text-lg">{liveStats.usersOnline.toLocaleString()}</span> 用户在线
              </span>
            </div>
            <div className="text-sm">
              <span className="font-bold text-lg">{liveStats.workflowsRunning.toLocaleString()}</span> 工作流运行中
            </div>
            <div className="text-sm">
              今日完成 <span className="font-bold text-lg">{liveStats.tasksCompleted.toLocaleString()}</span> 任务
            </div>
          </div>
        </div>
      </section>

      {/* Popular Templates Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
                <Layers className="h-3.5 w-3.5" />
                热门模板
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                一键启用，即刻生效
              </h2>
            </div>
            <Link href="/templates">
              <Button variant="outline" className="rounded-full group shrink-0">
                浏览全部模板
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularTemplates.map((template) => (
              <Link
                key={template.name}
                href={`/templates/${template.name}`}
                className={cn(
                  "group flex items-center gap-4 p-4 rounded-xl",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-lg",
                  "transition-all duration-300"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl shrink-0",
                  "bg-primary/10 flex items-center justify-center",
                  "group-hover:scale-110 transition-transform"
                )}>
                  {template.icon === "MessageSquare" && <MessageSquare className="w-5 h-5 text-primary" />}
                  {template.icon === "ShoppingCart" && <ShoppingCart className="w-5 h-5 text-primary" />}
                  {template.icon === "FileText" && <FileText className="w-5 h-5 text-primary" />}
                  {template.icon === "Database" && <Database className="w-5 h-5 text-primary" />}
                  {template.icon === "Users" && <Users className="w-5 h-5 text-primary" />}
                  {template.icon === "Globe" && <Globe className="w-5 h-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {template.category} · {template.uses} 次使用
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Demo Section */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <Play className="h-3.5 w-3.5" />
              快速体验
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              几分钟即可上手
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              选择一个场景，体验 AgentFlow 的强大能力
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {demoUseCases.map((demo) => (
              <Link
                key={demo.title}
                href="/register"
                className={cn(
                  "group relative p-6 rounded-2xl overflow-hidden",
                  "bg-card border border-border",
                  "hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10",
                  "transition-all duration-300"
                )}
              >
                {/* Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-4",
                    "bg-primary/10 group-hover:bg-primary/20",
                    "transition-colors duration-300"
                  )}>
                    <demo.icon className="w-7 h-7 text-primary" />
                  </div>
                  
                  <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {demo.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {demo.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-primary font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {demo.time}
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl bg-muted/50 border border-border">
              <div className="text-center sm:text-left">
                <p className="font-medium text-foreground mb-1">想要更多灵感？</p>
                <p className="text-sm text-muted-foreground">探索我们的模板市场，发现更多可能</p>
              </div>
              <Link href="/store">
                <Button variant="outline" className="rounded-full group whitespace-nowrap">
                  浏览模板市场
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Ecosystem Section */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <Puzzle className="h-3.5 w-3.5" />
              集成生态
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              100+ 服务无缝集成
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              连接您正在使用的所有工具和服务，打通数据孤岛
            </p>
          </div>

          {/* Integration Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-3 mb-10">
            {integrations.map((integration, index) => (
              <div
                key={integration.name}
                className={cn(
                  "group relative flex flex-col items-center justify-center p-4 rounded-2xl",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-lg hover:-translate-y-1",
                  "transition-all duration-300",
                  "cursor-pointer"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-2xl mb-2">{integration.icon}</span>
                <span className="text-xs text-muted-foreground text-center truncate w-full">
                  {integration.name}
                </span>
                
                {/* Tooltip */}
                <div className={cn(
                  "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg",
                  "bg-foreground text-background text-xs whitespace-nowrap",
                  "opacity-0 group-hover:opacity-100 pointer-events-none",
                  "transition-opacity duration-200 z-10"
                )}>
                  {integration.category}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/dashboard/integrations">
              <Button variant="outline" className="rounded-full group">
                查看全部集成
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* AI Capabilities Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
                <Bot className="h-3.5 w-3.5" />
                AI 驱动
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                不只是自动化
                <br />
                <span className="text-primary">是智能化</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                AgentFlow 的 AI Agent 不仅能执行任务，还能理解、优化和学习，
                让您的工作流越用越智能
              </p>

              <div className="space-y-6">
                {aiCapabilities.map((capability, index) => (
                  <div
                    key={capability.title}
                    className={cn(
                      "group p-5 rounded-2xl",
                      "bg-card border border-border",
                      "hover:border-primary/30 hover:shadow-lg",
                      "transition-all duration-300"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                        "bg-primary/10 group-hover:bg-primary/20",
                        "transition-colors duration-300"
                      )}>
                        <capability.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">
                          {capability.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {capability.description}
                        </p>
                        <div className="inline-flex items-center px-3 py-1 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                          <code>{capability.example}</code>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Interactive Demo */}
            <div className="relative">
              <div className={cn(
                "relative rounded-3xl overflow-hidden",
                "bg-card border border-border",
                "shadow-2xl shadow-primary/5"
              )}>
                {/* Demo Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <span className="text-xs text-muted-foreground">AI 助手对话</span>
                  </div>
                </div>

                {/* Chat Demo */}
                <div className="p-6 space-y-4 min-h-[400px]">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-primary text-primary-foreground text-sm">
                      帮我创建一个工作流：当收到新邮件时，用 AI 分析内容，
                      如果是客户投诉就自动创建工单并通知客服
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex justify-start">
                    <div className="max-w-[80%] space-y-3">
                      <div className="px-4 py-3 rounded-2xl bg-muted text-foreground text-sm">
                        好的，我来帮您创建这个客户投诉处理工作流 ✨
                      </div>
                      <div className="px-4 py-3 rounded-2xl bg-muted border border-border">
                        <p className="text-sm text-foreground mb-3">已为您生成工作流：</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {["邮件触发器", "AI 分析", "条件判断", "创建工单", "发送通知"].map((node, i) => (
                            <div key={node} className="flex items-center gap-1">
                              <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                                {node}
                              </span>
                              {i < 4 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="px-4 py-3 rounded-2xl bg-muted text-foreground text-sm">
                        需要我帮您配置邮件服务器和工单系统的连接吗？
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-2">
                    <button className="px-3 py-1.5 rounded-full border border-primary/30 text-primary text-xs hover:bg-primary/10 transition-colors">
                      配置邮件
                    </button>
                    <button className="px-3 py-1.5 rounded-full border border-primary/30 text-primary text-xs hover:bg-primary/10 transition-colors">
                      连接工单系统
                    </button>
                    <button className="px-3 py-1.5 rounded-full border border-primary/30 text-primary text-xs hover:bg-primary/10 transition-colors">
                      预览工作流
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className={cn(
                "absolute -top-4 -right-4 px-4 py-2 rounded-full",
                "bg-primary text-primary-foreground text-sm font-medium",
                "shadow-lg shadow-primary/30",
                "animate-bounce"
              )}>
                🚀 实时生成
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <Target className="h-3.5 w-3.5" />
              应用场景
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              适用于各行各业
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              无论您从事什么行业，AgentFlow 都能帮您找到自动化的最佳实践
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase) => (
              <div
                key={useCase.title}
                className={cn(
                  "group relative p-6 rounded-2xl overflow-hidden",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-xl",
                  "transition-all duration-500"
                )}
              >
                {/* Gradient Background on Hover */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500",
                  "bg-gradient-to-br",
                  useCase.color
                )} />
                
                <div className="relative z-10">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-4",
                    "bg-gradient-to-br",
                    useCase.color,
                    "group-hover:scale-110 transition-transform duration-300"
                  )}>
                    <useCase.icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {useCase.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {useCase.description}
                  </p>
                  
                  {/* Metrics Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {useCase.metrics}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/use-cases">
              <Button variant="outline" className="rounded-full group">
                查看更多用例
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Industry Solutions Section */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <Briefcase className="h-3.5 w-3.5" />
              行业解决方案
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              为您的行业量身定制
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              针对不同行业的痛点，提供专业的自动化解决方案
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {industrySolutions.map((solution) => (
              <div
                key={solution.industry}
                className={cn(
                  "group p-8 rounded-2xl",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-xl",
                  "transition-all duration-300"
                )}
              >
                <div className="flex items-start gap-6">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl shrink-0",
                    "bg-gradient-to-br",
                    solution.color,
                    "flex items-center justify-center",
                    "group-hover:scale-110 transition-transform"
                  )}>
                    {solution.icon === "ShoppingCart" && <ShoppingCart className="w-8 h-8 text-primary" />}
                    {solution.icon === "Building2" && <Building2 className="w-8 h-8 text-primary" />}
                    {solution.icon === "HeartPulse" && <HeartPulse className="w-8 h-8 text-primary" />}
                    {solution.icon === "GraduationCap" && <GraduationCap className="w-8 h-8 text-primary" />}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {solution.industry}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {solution.description}
                    </p>
                    
                    <ul className="space-y-2">
                      {solution.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-foreground">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-border">
                  <Link href={`/solutions/${solution.industry}`}>
                    <Button variant="ghost" className="w-full justify-between group/btn">
                      了解 {solution.industry} 解决方案
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Cases Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <Award className="h-3.5 w-3.5" />
              成功案例
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              真实的业务成果
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              看看我们的客户如何通过 AgentFlow 实现业务突破
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {successCases.map((caseItem) => (
              <div
                key={caseItem.company}
                className={cn(
                  "group p-8 rounded-3xl",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-xl",
                  "transition-all duration-300"
                )}
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {caseItem.logo}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{caseItem.company}</h3>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                      {caseItem.industry}
                    </span>
                  </div>
                </div>

                {/* Result Highlight */}
                <div className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <p className="text-primary font-semibold text-lg">
                    {caseItem.result}
                  </p>
                </div>

                {/* Quote */}
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 italic">
                  "{caseItem.quote}"
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {caseItem.metrics.map((metric) => (
                    <div key={metric.label} className="text-center">
                      <div className="text-xl font-bold text-primary">{metric.value}</div>
                      <div className="text-xs text-muted-foreground">{metric.label}</div>
                    </div>
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {caseItem.avatar.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{caseItem.avatar}</p>
                    <p className="text-xs text-muted-foreground">{caseItem.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/case-studies">
              <Button variant="outline" className="rounded-full group">
                查看更多案例
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <Star className="h-3.5 w-3.5 fill-primary" />
              客户评价
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              他们的选择，您的参考
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              听听我们的用户怎么说
            </p>
          </div>

          {/* Featured Testimonial */}
          <div className="mb-12">
            <div className={cn(
              "relative p-8 sm:p-12 rounded-3xl",
              "bg-card border border-border",
              "shadow-lg"
            )}>
              {/* Quote Icon */}
              <Quote className="absolute top-6 left-6 w-12 h-12 text-primary/20" />
              
              <div className="relative z-10 text-center max-w-3xl mx-auto">
                {/* Rating */}
                <div className="flex items-center justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-5 h-5",
                        i < testimonials[activeTestimonial].rating
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                  ))}
                </div>
                
                {/* Quote */}
                <p className="text-xl sm:text-2xl text-foreground leading-relaxed mb-8 font-medium">
                  "{testimonials[activeTestimonial].content}"
                </p>
                
                {/* Author */}
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold">
                    {testimonials[activeTestimonial].avatar}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">
                      {testimonials[activeTestimonial].author}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {testimonials[activeTestimonial].role} · {testimonials[activeTestimonial].company}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Navigation Dots */}
              <div className="flex items-center justify-center gap-2 mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      index === activeTestimonial
                        ? "bg-primary w-6"
                        : "bg-border hover:bg-muted-foreground"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Testimonial Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.slice(0, 3).map((testimonial, index) => (
              <div
                key={testimonial.author}
                className={cn(
                  "p-6 rounded-2xl",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-lg",
                  "transition-all duration-300"
                )}
              >
                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-4 h-4",
                        i < testimonial.rating
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                  ))}
                </div>
                
                {/* Quote */}
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  "{testimonial.content}"
                </p>
                
                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {testimonial.author}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/testimonials">
              <Button variant="outline" className="rounded-full group">
                查看更多评价
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <Users className="h-3.5 w-3.5" />
              我们的团队
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              由行业专家领导
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              来自全球顶尖科技公司的精英团队，致力于打造最好的自动化平台
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className={cn(
                  "group p-6 rounded-2xl text-center",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-xl",
                  "transition-all duration-300"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-20 h-20 mx-auto mb-4 rounded-full",
                  "bg-gradient-to-br from-primary/20 to-primary/5",
                  "flex items-center justify-center",
                  "text-2xl font-bold text-primary",
                  "group-hover:scale-110 transition-transform"
                )}>
                  {member.avatar}
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {member.name}
                </h3>
                <p className="text-sm text-primary font-medium mb-3">
                  {member.role}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {member.bio}
                </p>

                {/* Social Links */}
                <div className="flex items-center justify-center gap-3">
                  <a href={member.social.twitter} className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <Twitter className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </a>
                  <a href={member.social.linkedin} className="p-2 rounded-lg hover:bg-muted transition-colors">
                    <Linkedin className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Join Us CTA */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">想加入我们？</p>
            <Link href="/careers">
              <Button variant="outline" className="rounded-full group">
                查看开放职位
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Investors Section */}
      <section className="py-16 px-6 bg-muted/20">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-muted-foreground mb-6">获得顶级投资机构支持</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {investors.map((investor) => (
              <div
                key={investor.name}
                className="group flex flex-col items-center"
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl mb-2",
                  "bg-card border border-border",
                  "flex items-center justify-center",
                  "text-xl font-bold text-muted-foreground",
                  "group-hover:border-primary/30 group-hover:text-primary",
                  "transition-all duration-300"
                )}>
                  {investor.logo.charAt(0)}
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {investor.name}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            累计融资 <span className="text-foreground font-semibold">$50M+</span>，估值 <span className="text-foreground font-semibold">$500M</span>
          </p>
        </div>
      </section>

      {/* Media Features Section */}
      <section className="py-16 px-6 border-y border-border/50">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-8">
            媒体报道
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {mediaFeatures.map((media) => (
              <div
                key={media.name}
                className={cn(
                  "flex flex-col items-center justify-center p-6 rounded-2xl",
                  "bg-card/50 border border-border/50",
                  "hover:border-primary/30 hover:bg-card",
                  "transition-all duration-300 group"
                )}
              >
                <div className="text-2xl font-bold text-primary mb-2">
                  {media.logo}
                </div>
                <p className="text-xs text-center text-muted-foreground group-hover:text-foreground transition-colors">
                  "{media.quote}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Updates/News Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                最新动态
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                产品更新
              </h2>
            </div>
            <Link href="/whats-new">
              <Button variant="outline" className="rounded-full group shrink-0">
                查看全部更新
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {updates.map((update) => (
              <Link
                key={update.title}
                href={update.link}
                className={cn(
                  "group p-6 rounded-2xl",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-xl",
                  "transition-all duration-300"
                )}
              >
                {/* Date & Tag */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs text-muted-foreground">{update.date}</span>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", update.tagColor)}>
                    {update.tag}
                  </span>
                </div>
                
                {/* Title */}
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {update.title}
                </h3>
                
                {/* Description */}
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {update.description}
                </p>
                
                {/* Read More */}
                <span className="inline-flex items-center text-sm text-primary font-medium">
                  阅读更多
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Preview Section */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
                <FileText className="h-3.5 w-3.5" />
                博客精选
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                深度内容，助力成长
              </h2>
            </div>
            <Link href="/blog">
              <Button variant="outline" className="rounded-full group shrink-0">
                查看全部文章
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <Link
                key={post.title}
                href={`/blog/${post.title}`}
                className={cn(
                  "group p-6 rounded-2xl",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-xl",
                  "transition-all duration-300"
                )}
              >
                {/* Category & Read Time */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {post.category}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{post.date}</span>
                  <span className="text-sm text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    阅读
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <Shield className="h-3.5 w-3.5" />
              安全合规
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              企业级安全保障
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              通过国际顶级安全认证，让您的数据安全无忧
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {securityBadges.map((badge) => (
              <div
                key={badge.name}
                className={cn(
                  "flex flex-col items-center justify-center p-8 rounded-2xl",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-lg",
                  "transition-all duration-300 group"
                )}
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center mb-4",
                  "bg-primary/10 group-hover:bg-primary/20",
                  "transition-colors duration-300"
                )}>
                  <badge.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-center mb-1">
                  {badge.name}
                </h3>
                <p className="text-xs text-muted-foreground text-center">
                  {badge.description}
                </p>
              </div>
            ))}
          </div>

          {/* Security Features */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-500" />
                </div>
                <h4 className="font-semibold text-foreground">端到端加密</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                TLS 1.3 传输加密，AES-256 静态数据加密，确保数据全程安全
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <h4 className="font-semibold text-foreground">细粒度权限</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                基于角色的访问控制，支持自定义权限策略，精确管控数据访问
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-500" />
                </div>
                <h4 className="font-semibold text-foreground">审计日志</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                完整的操作审计记录，满足合规要求，支持日志导出和分析
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Global Infrastructure Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <Globe className="h-3.5 w-3.5" />
              全球基础设施
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              全球部署，就近访问
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              遍布全球的数据中心，确保低延迟和高可用性
            </p>
          </div>

          {/* World Map Visualization */}
          <div className="relative mb-12 p-8 rounded-3xl bg-card border border-border overflow-hidden">
            {/* Decorative Globe Background */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border-2 border-foreground" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-foreground" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-foreground" />
            </div>

            <div className="relative grid md:grid-cols-3 gap-8">
              {globalDataCenters.map((dc) => (
                <div
                  key={dc.region}
                  className={cn(
                    "p-6 rounded-2xl text-center",
                    "bg-muted/50 border border-border/50",
                    "hover:border-primary/30 hover:bg-muted",
                    "transition-all duration-300"
                  )}
                >
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{dc.region}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {dc.locations.join(" · ")}
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    延迟 {dc.latency}
                  </div>
                </div>
              ))}
            </div>

            {/* Live Stats */}
            <div className="mt-8 pt-8 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-foreground">{livePlatformStats.activeWorkflows.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">活跃工作流</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{(livePlatformStats.tasksToday / 1000000).toFixed(1)}M+</div>
                <div className="text-sm text-muted-foreground">今日任务执行</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{livePlatformStats.avgResponseTime}s</div>
                <div className="text-sm text-muted-foreground">平均响应时间</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{livePlatformStats.uptime}%</div>
                <div className="text-sm text-muted-foreground">正常运行时间</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <Zap className="h-3.5 w-3.5" />
              灵活定价
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              适合各种规模的方案
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              从个人用户到大型企业，总有一款适合你
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative p-8 rounded-3xl",
                  "bg-card border-2",
                  plan.highlight 
                    ? "border-primary shadow-xl shadow-primary/10" 
                    : "border-border",
                  "transition-all duration-300 hover:shadow-lg"
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    最受欢迎
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.name === "企业版" ? "/contact" : "/register"}>
                  <Button 
                    className={cn(
                      "w-full rounded-full h-12",
                      plan.highlight 
                        ? "bg-primary hover:bg-primary/90" 
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    )}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/pricing" className="text-primary hover:underline text-sm">
              查看完整定价详情 →
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <BarChart3 className="h-3.5 w-3.5" />
              为什么选择我们
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              AgentFlow vs 传统方案
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              看看 AgentFlow 如何全方位领先
            </p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 p-6 border-b border-border bg-muted/30">
              <div className="font-medium text-muted-foreground">功能特性</div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <Workflow className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-semibold text-foreground">AgentFlow</span>
                </div>
              </div>
              <div className="text-center font-medium text-muted-foreground">传统开发</div>
              <div className="text-center font-medium text-muted-foreground">其他平台</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border">
              {comparisonData.features.map((feature, index) => (
                <div
                  key={feature.name}
                  className={cn(
                    "grid grid-cols-4 gap-4 p-4 items-center",
                    "hover:bg-muted/30 transition-colors"
                  )}
                >
                  <div className="text-sm text-foreground">{feature.name}</div>
                  <div className="flex justify-center">
                    {feature.us ? (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-primary" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <X className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-center">
                    {feature.traditional ? (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <X className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-center">
                    {feature.competitor ? (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <X className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-10 text-center">
            <p className="text-muted-foreground mb-4">
              还在犹豫？试试看就知道
            </p>
            <Link href="/register">
              <Button className="rounded-full h-12 px-8 bg-primary hover:bg-primary/90 group">
                免费体验 14 天
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <TrendingUp className="h-3.5 w-3.5" />
              效率提升
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              看看能节省多少时间
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              真实客户的效率提升数据
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
              <div>任务类型</div>
              <div>自动化前</div>
              <div>自动化后</div>
              <div className="text-right">节省时间</div>
            </div>
            {roiExamples.map((example, idx) => (
              <div
                key={example.task}
                className={cn(
                  "grid grid-cols-4 gap-4 p-4 items-center",
                  idx !== roiExamples.length - 1 && "border-b border-border"
                )}
              >
                <div className="font-medium text-foreground">{example.task}</div>
                <div className="text-muted-foreground">{example.before}</div>
                <div className="text-primary font-medium">{example.after}</div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-bold">
                    ↓ {example.savings}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/roi-calculator">
              <Button variant="outline" className="rounded-full group">
                计算您的 ROI
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Whitepapers Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
                <FileText className="h-3.5 w-3.5" />
                深度内容
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                免费下载白皮书
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {whitepapers.map((paper) => (
              <div
                key={paper.title}
                className={cn(
                  "group p-6 rounded-2xl",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-lg",
                  "transition-all duration-300"
                )}
              >
                <div className="w-full h-32 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4">
                  <FileText className="w-12 h-12 text-primary/50" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {paper.title}
                </h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                  <span>{paper.pages} 页</span>
                  <span>·</span>
                  <span>{paper.downloads} 下载</span>
                </div>
                <Button variant="outline" size="sm" className="w-full rounded-full group/btn">
                  免费下载
                  <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer Resources Section */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
                <Code className="h-3.5 w-3.5" />
                开发者资源
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                为开发者而生
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                完善的 API、SDK 和插件系统，让您可以深度定制和扩展 AgentFlow 的能力
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {devResources.map((resource) => (
                  <Link
                    key={resource.title}
                    href={resource.link}
                    className={cn(
                      "group p-5 rounded-2xl",
                      "bg-card border border-border",
                      "hover:border-primary/30 hover:shadow-lg",
                      "transition-all duration-300"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                      "bg-primary/10 group-hover:bg-primary/20",
                      "transition-colors duration-300"
                    )}>
                      <resource.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {resource.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right: Code Preview */}
            <div className={cn(
              "relative rounded-2xl overflow-hidden",
              "bg-card border border-border",
              "shadow-2xl"
            )}>
              {/* Code Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-white/40">workflow.ts</span>
                </div>
              </div>

              {/* Code Content */}
              <div className="p-6 font-mono text-sm overflow-x-auto">
                <pre className="text-white/80">
                  <code>{`import { AgentFlow } from '@agentflow/sdk';

const workflow = new AgentFlow()
  .trigger('webhook', { path: '/api/orders' })
  .action('ai.analyze', {
    prompt: '分析订单数据并提取关键信息'
  })
  .condition('order.type === "urgent"', {
    true: 'sendUrgentNotification',
    false: 'normalProcess'
  })
  .action('slack.send', {
    channel: '#orders',
    message: '{{ai.summary}}'
  });

await workflow.deploy();`}</code>
                </pre>
              </div>

              {/* Floating Badge */}
              <div className={cn(
                "absolute top-4 right-4 px-3 py-1.5 rounded-full",
                "bg-primary text-primary-foreground text-xs font-medium"
              )}>
                TypeScript SDK
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Resources Section */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
                <GraduationCap className="h-3.5 w-3.5" />
                学习中心
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                掌握 AgentFlow
              </h2>
            </div>
            <Link href="/learn/courses">
              <Button variant="outline" className="rounded-full group shrink-0">
                探索全部资源
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {learningResources.map((resource) => (
              <Link
                key={resource.title}
                href={resource.link}
                className={cn(
                  "group p-6 rounded-2xl",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-xl",
                  "transition-all duration-300"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {resource.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {resource.description}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {resource.duration}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-muted">
                    {resource.level}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Programs Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <Puzzle className="h-3.5 w-3.5" />
              合作伙伴计划
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              携手共赢
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              加入我们的合作伙伴生态，共同为客户创造价值
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {partnerPrograms.map((program) => (
              <div
                key={program.type}
                className={cn(
                  "group p-8 rounded-2xl text-center",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-xl",
                  "transition-all duration-300"
                )}
              >
                <div className={cn(
                  "w-16 h-16 mx-auto mb-6 rounded-2xl",
                  "bg-gradient-to-br from-primary/20 to-primary/5",
                  "flex items-center justify-center",
                  "group-hover:scale-110 transition-transform"
                )}>
                  {program.icon === "Code" && <Code className="w-8 h-8 text-primary" />}
                  {program.icon === "Briefcase" && <Briefcase className="w-8 h-8 text-primary" />}
                  {program.icon === "Users" && <Users className="w-8 h-8 text-primary" />}
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {program.type}
                </h3>

                <ul className="space-y-3 mb-6">
                  {program.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>

                <Link href="/partners">
                  <Button variant="outline" className="w-full rounded-full group">
                    了解更多
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          {/* Existing Partners */}
          <div className="mt-16 text-center">
            <p className="text-muted-foreground mb-6">已有 200+ 合作伙伴加入我们的生态</p>
            <Link href="/partners/apply">
              <Button className="rounded-full bg-primary hover:bg-primary/90">
                申请成为合作伙伴
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Roadmap Section */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <Rocket className="h-3.5 w-3.5" />
              产品路线图
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              持续进化，永不止步
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              透明的开发计划，让您了解我们的前进方向
            </p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-border md:-translate-x-0.5" />
            
            <div className="space-y-8">
              {roadmapItems.map((item, index) => (
                <div
                  key={item.quarter}
                  className={cn(
                    "relative flex flex-col md:flex-row gap-8",
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  )}
                >
                  {/* Timeline Dot */}
                  <div className={cn(
                    "absolute left-8 md:left-1/2 w-4 h-4 rounded-full -translate-x-1/2 z-10",
                    "border-4 border-background",
                    item.status === "completed" ? "bg-primary" :
                    item.status === "in-progress" ? "bg-amber-500 animate-pulse" :
                    "bg-muted-foreground"
                  )} />
                  
                  {/* Content */}
                  <div className={cn(
                    "ml-16 md:ml-0 md:w-[calc(50%-2rem)]",
                    index % 2 === 0 ? "md:text-right md:pr-8" : "md:text-left md:pl-8"
                  )}>
                    <div className={cn(
                      "inline-block px-3 py-1 rounded-full text-sm font-medium mb-3",
                      item.status === "completed" ? "bg-primary/10 text-primary" :
                      item.status === "in-progress" ? "bg-amber-500/10 text-amber-600" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {item.quarter}
                      {item.status === "completed" && " ✓"}
                      {item.status === "in-progress" && " 进行中"}
                    </div>
                    
                    <div className={cn(
                      "p-6 rounded-2xl",
                      "bg-card border border-border",
                      item.status === "in-progress" && "border-amber-500/30"
                    )}>
                      <ul className={cn(
                        "space-y-2",
                        index % 2 === 0 ? "md:text-right" : "md:text-left"
                      )}>
                        {item.items.map((roadmapItem) => (
                          <li
                            key={roadmapItem}
                            className={cn(
                              "flex items-center gap-2 text-sm",
                              index % 2 === 0 ? "md:flex-row-reverse" : ""
                            )}
                          >
                            <CircleCheck className={cn(
                              "w-4 h-4 shrink-0",
                              item.status === "completed" ? "text-primary" : "text-muted-foreground"
                            )} />
                            <span className={cn(
                              item.status === "completed" ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {roadmapItem}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/roadmap">
              <Button variant="outline" className="rounded-full group">
                查看完整路线图
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <Users className="h-3.5 w-3.5" />
              开发者社区
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              加入活跃的开发者社区
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              与全球开发者一起探索自动化的无限可能
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
            {communityStats.map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "flex flex-col items-center justify-center p-6 rounded-2xl",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-lg",
                  "transition-all duration-300 group"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
                  "bg-primary/10 group-hover:bg-primary/20",
                  "transition-colors duration-300"
                )}>
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground text-center">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Community Links */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://github.com/agentflow"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-full",
                "bg-foreground text-background",
                "hover:bg-foreground/90 transition-colors"
              )}
            >
              <Github className="w-5 h-5" />
              GitHub
            </a>
            <Link href="/community">
              <Button variant="outline" className="rounded-full">
                <MessageSquare className="mr-2 w-4 h-4" />
                社区论坛
              </Button>
            </Link>
            <Link href="https://discord.gg/agentflow">
              <Button variant="outline" className="rounded-full">
                Discord
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Customer Distribution Section */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <Globe className="h-3.5 w-3.5" />
              全球客户
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              服务全球 {customerDistribution.total.toLocaleString()}+ 企业
            </h2>
            <p className="text-lg text-muted-foreground">
              来自世界各地的企业正在使用 AgentFlow 提升效率
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {customerDistribution.regions.map((region) => (
              <div
                key={region.name}
                className={cn(
                  "p-6 rounded-2xl text-center",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-lg",
                  "transition-all duration-300"
                )}
              >
                <div className="text-3xl font-bold text-primary mb-1">
                  {region.percentage}%
                </div>
                <div className="text-lg font-semibold text-foreground mb-1">
                  {region.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {region.count.toLocaleString()} 企业
                </div>
                {/* Progress Bar */}
                <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${region.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
                <Github className="h-3.5 w-3.5" />
                开源贡献
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                开放、透明、共建
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                AgentFlow 核心组件开源，与全球开发者共同构建更好的自动化未来
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link href="https://github.com/agentflow">
                  <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </Button>
                </Link>
                <Link href="/docs/contributing">
                  <Button variant="outline" className="rounded-full">
                    贡献指南
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={cn(
                "p-6 rounded-2xl text-center",
                "bg-card border border-border",
              )}>
                <div className="text-3xl font-bold text-foreground mb-1">{openSourceStats.repos}</div>
                <div className="text-sm text-muted-foreground">开源仓库</div>
              </div>
              <div className={cn(
                "p-6 rounded-2xl text-center",
                "bg-card border border-border",
              )}>
                <div className="text-3xl font-bold text-foreground mb-1 flex items-center justify-center gap-1">
                  <Star className="w-5 h-5 text-yellow-500" />
                  {(openSourceStats.stars / 1000).toFixed(1)}k
                </div>
                <div className="text-sm text-muted-foreground">GitHub Stars</div>
              </div>
              <div className={cn(
                "p-6 rounded-2xl text-center",
                "bg-card border border-border",
              )}>
                <div className="text-3xl font-bold text-foreground mb-1">{openSourceStats.contributors}</div>
                <div className="text-sm text-muted-foreground">贡献者</div>
              </div>
              <div className={cn(
                "p-6 rounded-2xl text-center",
                "bg-card border border-border",
              )}>
                <div className="text-3xl font-bold text-foreground mb-1">{(openSourceStats.commits / 1000).toFixed(0)}k+</div>
                <div className="text-sm text-muted-foreground">提交数</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Wall */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <MessageSquare className="h-3.5 w-3.5" />
              用户心声
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              来自社交媒体的真实反馈
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {socialPosts.map((post, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-6 rounded-2xl",
                  "bg-card border border-border",
                  "hover:shadow-lg transition-shadow"
                )}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    post.platform === "Twitter" && "bg-sky-500/10 text-sky-600",
                    post.platform === "微博" && "bg-red-500/10 text-red-600",
                    post.platform === "LinkedIn" && "bg-blue-600/10 text-blue-600"
                  )}>
                    {post.platform}
                  </span>
                  <span className="text-sm text-muted-foreground">{post.user}</span>
                </div>
                <p className="text-foreground mb-4 leading-relaxed">&ldquo;{post.content}&rdquo;</p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span>{typeof post.likes === "number" ? post.likes : `${post.likes}k`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Keyboard Shortcuts Preview */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
                <Keyboard className="h-3.5 w-3.5" />
                效率至上
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                键盘快捷键，飞速操作
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                无需鼠标，全键盘操作，让专业用户的效率再提升 50%
              </p>
            </div>

            <div className="space-y-3">
              {shortcuts.map((shortcut) => (
                <div
                  key={shortcut.action}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl",
                    "bg-card border border-border"
                  )}
                >
                  <span className="text-foreground">{shortcut.action}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, idx) => (
                      <span key={idx}>
                        <kbd className="px-2 py-1 rounded bg-muted border border-border text-sm font-mono">
                          {key}
                        </kbd>
                        {idx < shortcut.keys.length - 1 && <span className="mx-1 text-muted-foreground">+</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Performance Benchmarks */}
      <section className="py-16 px-6 bg-foreground text-background">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">极致性能</h2>
            <p className="text-background/70">企业级基础设施，毫秒级响应</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {benchmarks.map((benchmark) => (
              <div
                key={benchmark.metric}
                className="text-center p-6 rounded-xl bg-background/5 border border-background/10"
              >
                <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">{benchmark.value}</div>
                <div className="text-background font-medium mb-1">{benchmark.metric}</div>
                <div className="text-sm text-background/60">{benchmark.percentile}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Version History Timeline */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <Clock className="h-3.5 w-3.5" />
              持续进化
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              版本历程
            </h2>
          </div>

          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-8">
              {versionHistory.map((release, idx) => (
                <div key={release.version} className="relative flex gap-6">
                  <div className={cn(
                    "w-12 h-12 rounded-full shrink-0 flex items-center justify-center z-10",
                    idx === 0 ? "bg-primary text-primary-foreground" : "bg-card border border-border"
                  )}>
                    <span className="text-sm font-bold">v{release.version}</span>
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="text-sm text-muted-foreground mb-1">{release.date}</div>
                    <div className="flex flex-wrap gap-2">
                      {release.highlights.map((highlight) => (
                        <span
                          key={highlight}
                          className="px-3 py-1 rounded-full bg-muted text-sm text-foreground"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Multi-language Support */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-xl font-semibold text-foreground mb-6">全球化支持</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {languages.map((lang) => (
              <div
                key={lang.code}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full",
                  "bg-card border border-border",
                  lang.code === "zh-CN" && "border-primary bg-primary/5"
                )}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="text-sm font-medium text-foreground">{lang.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Highlights Section */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <Zap className="h-3.5 w-3.5" />
              技术优势
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              企业级技术架构
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {techHighlights.map((tech) => (
              <div
                key={tech.title}
                className={cn(
                  "p-6 rounded-2xl text-center",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-lg",
                  "transition-all duration-300 group"
                )}
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4",
                  "bg-primary/10 group-hover:bg-primary/20",
                  "transition-colors duration-300"
                )}>
                  <tech.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{tech.title}</h3>
                <p className="text-sm text-muted-foreground">{tech.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Awards Section */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-8">
            荣誉与认可
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {awards.map((award) => (
              <div
                key={award.title}
                className={cn(
                  "flex flex-col items-center text-center p-6 rounded-2xl",
                  "bg-card/50 border border-border/50",
                  "hover:border-primary/30 hover:bg-card",
                  "transition-all duration-300"
                )}
              >
                <Award className="w-8 h-8 text-primary mb-3" />
                <span className="text-xs text-primary font-medium mb-1">{award.year}</span>
                <h4 className="font-semibold text-foreground text-sm mb-1">{award.title}</h4>
                <p className="text-xs text-muted-foreground">{award.org}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
                <Calendar className="h-3.5 w-3.5" />
                近期活动
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                与我们一起学习
              </h2>
            </div>
            <Link href="/events">
              <Button variant="outline" className="rounded-full group shrink-0">
                查看全部活动
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <Link
                key={event.title}
                href={event.link}
                className={cn(
                  "group p-6 rounded-2xl",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-xl",
                  "transition-all duration-300"
                )}
              >
                {/* Date Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-muted-foreground">{event.date}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    event.type === "线上" 
                      ? "bg-emerald-500/10 text-emerald-600" 
                      : "bg-blue-500/10 text-blue-600"
                  )}>
                    {event.type}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {event.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {event.description}
                </p>
                
                <span className="inline-flex items-center text-sm text-primary font-medium">
                  了解更多
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-10 sm:p-16">
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />
            
            <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
                  <Phone className="h-3.5 w-3.5" />
                  移动端 App
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  随时随地掌控工作流
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  下载 AgentFlow 移动端 App，在手机上监控工作流、处理审批、接收通知
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {mobileApps.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Download Buttons */}
                <div className="flex flex-wrap gap-4">
                  <a
                    href="#"
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 rounded-xl",
                      "bg-foreground text-background",
                      "hover:bg-foreground/90 transition-colors"
                    )}
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.5 12.5c0-1.58-.79-2.66-2.39-3.45l-.79-.39c-1.19-.59-1.45-.98-1.45-1.58 0-.79.59-1.19 1.58-1.19.99 0 1.58.59 1.58 1.58h2.37c0-2.17-1.38-3.56-3.56-3.56-2.17 0-3.95 1.38-3.95 3.56 0 1.58.79 2.66 2.39 3.45l.79.39c1.19.59 1.45.98 1.45 1.58 0 .79-.59 1.19-1.58 1.19-.99 0-1.58-.59-1.58-1.58H9.99c0 2.17 1.38 3.56 3.56 3.56s3.95-1.38 3.95-3.56z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs opacity-70">Download on the</div>
                      <div className="font-semibold">App Store</div>
                    </div>
                  </a>
                  <a
                    href="#"
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 rounded-xl",
                      "bg-foreground text-background",
                      "hover:bg-foreground/90 transition-colors"
                    )}
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                    </svg>
                    <div className="text-left">
                      <div className="text-xs opacity-70">GET IT ON</div>
                      <div className="font-semibold">Google Play</div>
                    </div>
                  </a>
                </div>

                <p className="mt-4 text-xs text-muted-foreground">
                  当前版本: iOS {mobileApps.ios.version} / Android {mobileApps.android.version}
                </p>
              </div>

              {/* Phone Mockup */}
              <div className="relative flex justify-center">
                <div className={cn(
                  "relative w-64 h-[500px] rounded-[3rem] border-8 border-foreground/10",
                  "bg-card shadow-2xl overflow-hidden"
                )}>
                  {/* Phone Screen */}
                  <div className="absolute inset-2 rounded-[2.5rem] bg-muted/50 overflow-hidden">
                    {/* Status Bar */}
                    <div className="h-8 bg-foreground/5 flex items-center justify-center">
                      <div className="w-20 h-5 rounded-full bg-foreground/10" />
                    </div>
                    
                    {/* App Content Preview */}
                    <div className="p-4 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                          <Workflow className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-sm">AgentFlow</div>
                          <div className="text-xs text-muted-foreground">3 个工作流运行中</div>
                        </div>
                      </div>
                      
                      {/* Mini Cards */}
                      <div className="space-y-2">
                        {["订单处理", "数据同步", "审批流程"].map((name, i) => (
                          <div key={name} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              i === 0 ? "bg-emerald-500" : i === 1 ? "bg-amber-500 animate-pulse" : "bg-primary"
                            )} />
                            <span className="text-xs text-foreground flex-1">{name}</span>
                            <span className="text-xs text-muted-foreground">{i === 1 ? "运行中" : "正常"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Notification */}
                <div className={cn(
                  "absolute -right-4 top-20 p-3 rounded-xl",
                  "bg-card border border-border shadow-lg",
                  "animate-bounce"
                )}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-foreground">工作流完成</div>
                      <div className="text-xs text-muted-foreground">订单已处理</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Channels Section */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <Headphones className="h-3.5 w-3.5" />
              客户支持
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              随时为您服务
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              多种支持渠道，确保您在使用过程中获得及时帮助
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportChannels.map((channel) => (
              <div
                key={channel.name}
                className={cn(
                  "group p-6 rounded-2xl text-center",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-lg",
                  "transition-all duration-300"
                )}
              >
                <div className={cn(
                  "w-14 h-14 mx-auto mb-4 rounded-xl",
                  "bg-primary/10 flex items-center justify-center",
                  "group-hover:scale-110 transition-transform"
                )}>
                  {channel.icon === "MessageSquare" && <MessageSquare className="w-6 h-6 text-primary" />}
                  {channel.icon === "Headphones" && <Headphones className="w-6 h-6 text-primary" />}
                  {channel.icon === "Users" && <Users className="w-6 h-6 text-primary" />}
                  {channel.icon === "FileText" && <FileText className="w-6 h-6 text-primary" />}
                </div>
                <h3 className="font-semibold text-foreground mb-1">{channel.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{channel.description}</p>
                {channel.available && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    在线
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 p-6 rounded-2xl bg-card border border-border">
            <p className="text-center text-sm text-muted-foreground mb-6">信任与安全</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {trustIndicators.map((indicator) => (
                <div key={indicator.label} className="text-center">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-primary/10 flex items-center justify-center">
                    {indicator.icon === "Shield" && <Shield className="w-5 h-5 text-primary" />}
                    {indicator.icon === "Database" && <Database className="w-5 h-5 text-primary" />}
                    {indicator.icon === "CheckCircle" && <CheckCircle className="w-5 h-5 text-primary" />}
                    {indicator.icon === "Award" && <Award className="w-5 h-5 text-primary" />}
                  </div>
                  <p className="text-sm font-medium text-foreground">{indicator.label}</p>
                  <p className="text-xs text-muted-foreground">{indicator.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium mb-4">
              <MessageSquare className="h-3.5 w-3.5" />
              常见问题
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              有疑问？我们来解答
            </h2>
            <p className="text-lg text-muted-foreground">
              找不到答案？随时
              <Link href="/contact" className="text-primary hover:underline ml-1">
                联系我们
              </Link>
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === index}
                onToggle={() => setOpenFAQ(openFAQ === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-foreground p-10 sm:p-16">
            {/* Decorations */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/30 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/20 rounded-full blur-[100px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
              {/* Left Content */}
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-background mb-4 leading-tight">
                  准备好开启
                  <br />
                  <span className="text-primary">自动化之旅</span>了吗？
                </h2>
                <p className="text-lg text-background/70 mb-8">
                  加入 50,000+ 已经在使用 AgentFlow 的团队
                  <br className="hidden sm:block" />
                  免费试用 14 天，无需信用卡
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4">
                  <Link href="/register">
                    <Button
                      size="lg"
                      className={cn(
                        "h-14 px-10 rounded-full text-base",
                        "bg-primary hover:bg-primary/90",
                        "text-primary-foreground font-medium",
                        "shadow-xl shadow-primary/30",
                        "group"
                      )}
                    >
                      免费开始使用
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-14 px-10 rounded-full text-base border-background/30 text-background hover:bg-background/10"
                    >
                      <Headphones className="mr-2 h-5 w-5" />
                      预约演示
                    </Button>
                  </Link>
                </div>

                {/* Trust Badges */}
                <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-background/60 text-sm">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    免费试用 14 天
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    无需信用卡
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    随时取消
                  </span>
                </div>
              </div>

              {/* Right Stats */}
              <div className="shrink-0 grid grid-cols-2 gap-4">
                {[
                  { value: "50K+", label: "活跃用户", icon: Users },
                  { value: "4.9", label: "用户评分", icon: Star },
                  { value: "99.99%", label: "可用性", icon: Shield },
                  { value: "24/7", label: "技术支持", icon: Headphones },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={cn(
                      "p-5 rounded-2xl text-center",
                      "bg-background/10 backdrop-blur-sm",
                      "border border-background/20"
                    )}
                  >
                    <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-background">{stat.value}</div>
                    <div className="text-xs text-background/60">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background">
        {/* Main Footer */}
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Workflow className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">AgentFlow</span>
              </div>
              <p className="text-background/60 text-sm leading-relaxed mb-6">
                通过智能 AI Agent 和可视化工作流，让自动化变得简单。释放团队创造力，专注于真正重要的事。
              </p>
              {/* Social Links */}
              <div className="flex items-center gap-3">
                {[
                  { icon: Twitter, href: "https://twitter.com/agentflow" },
                  { icon: Github, href: "https://github.com/agentflow" },
                  { icon: Linkedin, href: "https://linkedin.com/company/agentflow" },
                  { icon: Youtube, href: "https://youtube.com/@agentflow" },
                ].map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center",
                      "bg-background/10 hover:bg-primary",
                      "text-background/60 hover:text-primary-foreground",
                      "transition-all duration-300"
                    )}
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">产品</h4>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-background/60 hover:text-primary text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">资源</h4>
              <ul className="space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-background/60 hover:text-primary text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">公司</h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-background/60 hover:text-primary text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">法律</h4>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-background/60 hover:text-primary text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-background/10">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="font-semibold mb-1">订阅我们的通讯</h4>
                <p className="text-background/60 text-sm">获取最新的产品更新和自动化技巧</p>
              </div>
              <form className="flex gap-2 w-full md:w-auto">
                <input
                  type="email"
                  placeholder="输入您的邮箱"
                  className={cn(
                    "flex-1 md:w-64 h-11 px-4 rounded-lg",
                    "bg-background/10 border border-background/20",
                    "text-background placeholder:text-background/40",
                    "focus:outline-none focus:border-primary",
                    "transition-colors"
                  )}
                />
                <Button className="h-11 px-6 rounded-lg bg-primary hover:bg-primary/90">
                  订阅
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/10">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-background/50">
              <p>&copy; 2026 AgentFlow. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <Link href="/status" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  系统正常运行
                </Link>
                <span>|</span>
                <span>
                  Made with <span className="text-primary">♥</span> in China
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
