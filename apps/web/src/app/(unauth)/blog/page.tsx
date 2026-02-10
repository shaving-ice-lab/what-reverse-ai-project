'use client'

/**
 * Blog List Page - LobeHub Style Dark Design
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { cn } from '@/lib/utils'

// Blog Categories
const categories = [
  { name: 'All', slug: 'all', icon: Globe, count: 24 },
  { name: 'Product Updates', slug: 'product', icon: Rocket, count: 6 },
  { name: 'Technology Deep Dives', slug: 'tech', icon: Code2, count: 5 },
  { name: 'Usage Tips', slug: 'tips', icon: Lightbulb, count: 4 },
  { name: 'Case Studies', slug: 'case-study', icon: Award, count: 4 },
  { name: 'Industry Insights', slug: 'industry', icon: BarChart3, count: 3 },
  { name: 'Security & Compliance', slug: 'security', icon: Shield, count: 2 },
]

// Content Type Tags
const contentTypes = [
  { name: 'Article', icon: FileText, slug: 'article' },
  { name: 'Video', icon: Video, slug: 'video' },
  { name: 'Podcast', icon: Podcast, slug: 'podcast' },
]

// Popular Tags
const trendingTags = [
  { name: 'AI Agent', count: 12, hot: true },
  { name: 'Workflow Automation', count: 8, hot: true },
  { name: 'Multimodal', count: 6, hot: false },
  { name: 'Enterprise', count: 5, hot: false },
  { name: 'API Integration', count: 4, hot: false },
  { name: 'Code', count: 4, hot: false },
  { name: 'Data Processing', count: 3, hot: false },
  { name: 'Team Collaboration', count: 3, hot: false },
]

// Blog Series
const blogSeries = [
  {
    id: 'ai-fundamentals',
    title: 'AI Basics: Getting Started Series',
    description: 'Get started with AI workflows, perfect for new users',
    articles: 8,
    totalReadTime: '45 min',
    level: 'Getting Started',
    color: 'emerald',
    icon: Lightbulb,
  },
  {
    id: 'enterprise-guide',
    title: 'Enterprise Deployment Guide',
    description: 'Security, compliance, and enterprise best practices',
    articles: 6,
    totalReadTime: '60 min',
    level: 'Advanced',
    color: 'purple',
    icon: Shield,
  },
  {
    id: 'integration-mastery',
    title: 'Integration Mastery',
    description: 'Master 50+ app integration tips',
    articles: 12,
    totalReadTime: '90 min',
    level: 'Intermediate',
    color: 'blue',
    icon: Globe,
  },
  {
    id: 'automation-patterns',
    title: 'Automation Design Patterns',
    description: 'Automation design patterns and solutions',
    articles: 10,
    totalReadTime: '75 min',
    level: 'Intermediate',
    color: 'orange',
    icon: Code2,
  },
]

// Upcoming Webinars
const upcomingWebinars = [
  {
    id: 'webinar-1',
    title: 'AI Agent 3.0 Preview: Next-Gen Smart Workflows',
    date: '2026-02-05',
    time: '14:00 CST',
    speaker: 'Zhang Lei',
    speakerRole: 'Product Lead',
    registrations: 1280,
    isLive: false,
  },
  {
    id: 'webinar-2',
    title: 'Practical: Build a Smart Support System in 30 Minutes',
    date: '2026-02-12',
    time: '15:00 CST',
    speaker: 'Li Wei',
    speakerRole: 'Tech Lead',
    registrations: 856,
    isLive: false,
  },
  {
    id: 'webinar-3',
    title: 'Enterprise automation: from 0 to 1',
    date: '2026-02-20',
    time: '10:00 CST',
    speaker: 'Chen Xiao',
    speakerRole: 'Solution Architect',
    registrations: 642,
    isLive: false,
  },
]

// Free Resource Downloads
const downloadableResources = [
  {
    id: 'ebook-automation',
    title: '2026 Workflow Automation White Paper',
    type: 'E-book',
    format: 'PDF',
    pages: 48,
    downloads: 12500,
    icon: FileText,
  },
  {
    id: 'template-pack',
    title: '50+ Efficient Workflow Templates',
    type: 'Template',
    format: 'ZIP',
    templates: 50,
    downloads: 8900,
    icon: Rocket,
  },
  {
    id: 'checklist-security',
    title: 'Enterprise Security and Compliance Checklist',
    type: 'Checklist',
    format: 'PDF',
    items: 120,
    downloads: 5600,
    icon: Shield,
  },
  {
    id: 'integration-guide',
    title: 'API Integration Developer Guide',
    type: 'Guide',
    format: 'PDF',
    pages: 86,
    downloads: 7200,
    icon: Code2,
  },
]

// Community Featured
const communityHighlights = [
  {
    id: 'community-1',
    title: 'How to use AgentFlow for marketing team workflows',
    author: 'David Chen',
    authorCompany: 'E-commerce Company',
    likes: 342,
    comments: 67,
    avatar: null,
  },
  {
    id: 'community-2',
    title: 'Share: use AI Agent to save 3h of data processing per day',
    author: 'Sarah Liu',
    authorCompany: 'Data Analytics',
    likes: 289,
    comments: 45,
    avatar: null,
  },
  {
    id: 'community-3',
    title: 'From 0 to 1: build your first smart support bot',
    author: 'Michael Wang',
    authorCompany: 'SaaS User',
    likes: 256,
    comments: 38,
    avatar: null,
  },
]

// Reader Reviews
const testimonials = [
  {
    quote: "AgentFlow's blog is my go-to for workflow automation and content.",
    author: 'Li Ming',
    role: 'Tech Lead @ Startup',
    avatar: null,
  },
  {
    quote: 'Read the weekly newsletter to stay on top of AI industry trends.',
    author: 'Zhang Wei',
    role: 'Product Manager @ Enterprise',
    avatar: null,
  },
  {
    quote: 'Case studies are very helpful for quick automation.',
    author: 'Wang Hao',
    role: 'Operations Lead @ E-commerce Platform',
    avatar: null,
  },
]

// This Week's Highlights
const weeklyHighlights = {
  weekNumber: 5,
  year: 2026,
  topPosts: [
    { id: 'ai-agent-2-release', rank: 1, trend: 'up', changePercent: 45 },
    { id: 'llm-comparison-2026', rank: 2, trend: 'new', changePercent: 0 },
    { id: 'workflow-best-practices', rank: 3, trend: 'up', changePercent: 12 },
  ],
  totalViews: 125000,
  newSubscribers: 890,
  hotTopic: 'AI Agent 2.0',
}

// Latest Comments
const latestComments = [
  {
    id: 'comment-1',
    postId: 'ai-agent-2-release',
    postTitle: 'AI Agent 2.0 Now Released',
    author: 'Tech Enthusiast',
    content: 'Multi-model support is great; more integrations coming soon.',
    time: '10 min ago',
    likes: 23,
  },
  {
    id: 'comment-2',
    postId: 'workflow-best-practices',
    postTitle: 'Workflow design best practices',
    author: 'Automation User',
    content:
      "The error handling section is really helpful — I've already applied it to my projects.",
    time: '32 min ago',
    likes: 15,
  },
  {
    id: 'comment-3',
    postId: 'llm-comparison-2026',
    postTitle: '2026 large language model benchmark',
    author: 'AI Researcher',
    content: 'Very detailed benchmarks. Can we add comparison analytics?',
    time: '1 hour ago',
    likes: 8,
  },
  {
    id: 'comment-4',
    postId: 'ecommerce-automation',
    postTitle: 'E-commerce Automation Guide',
    author: 'E-commerce Ops User',
    content: 'Inventory sync is used by many; thanks for sharing!',
    time: '2 hours ago',
    likes: 31,
  },
]

// Partner Content
const partnerContent = [
  {
    id: 'partner-1',
    title: 'How to use the OpenAI API to build smart workflows',
    partner: 'OpenAI',
    partnerLogo: null,
    type: 'Joint Publication',
    date: '2026-01-28',
    featured: true,
  },
  {
    id: 'partner-2',
    title: 'Slack + AgentFlow: Team Efficiency Improved by 200%',
    partner: 'Slack',
    partnerLogo: null,
    type: 'Partnership Case Study',
    date: '2026-01-22',
    featured: false,
  },
  {
    id: 'partner-3',
    title: 'Cloud-Native Automation: AWS Lambda and AgentFlow Best Practices',
    partner: 'AWS',
    partnerLogo: null,
    type: 'Technology Guide',
    date: '2026-01-18',
    featured: false,
  },
]

// Knowledge Graph Topics
const knowledgeTopics = [
  {
    name: 'Getting Started Guide',
    count: 15,
    level: 1,
    related: ['Basic Concepts', 'Quick Start'],
  },
  { name: 'Workflow Design', count: 28, level: 2, related: ['Node', 'Trigger', 'Condition'] },
  { name: 'AI Integration', count: 32, level: 3, related: ['LLM', 'Multimodal', 'Prompt'] },
  {
    name: 'Enterprise Applications',
    count: 18,
    level: 2,
    related: ['Security', 'Compliance', 'Scalability'],
  },
  {
    name: 'Industry Solutions',
    count: 24,
    level: 2,
    related: ['E-commerce', 'Finance', 'Healthcare'],
  },
  { name: 'Developers', count: 20, level: 3, related: ['API', 'SDK', 'Webhook'] },
]

// Reading Challenge
const readingChallenge = {
  title: '2026 Q1 Reading Challenge',
  target: 12,
  current: 8,
  participants: 3240,
  endDate: '2026-03-31',
  rewards: ['Exclusive Badge', 'Advanced Template', 'Priority Support'],
}

// Milestones
const milestones = [
  { label: 'Blog Launched', value: '2023', icon: Rocket },
  { label: 'First Article', value: '2023.06', icon: FileText },
  { label: '10K Subscribers', value: '2024.03', icon: Users },
  { label: 'First 100K Reads', value: '2024.12', icon: Eye },
  { label: 'Today', value: '2M+', icon: Heart },
]

// Statistics
const stats = [
  { label: 'Total Articles', value: '240+', icon: FileText },
  { label: 'Monthly Readers', value: '50K+', icon: Users },
  { label: 'Total Reads', value: '2M+', icon: Eye },
  { label: 'Subscribers', value: '12K+', icon: Heart },
]

// Author Team
const authors = [
  {
    name: 'Zhang Lei',
    role: 'Product Lead',
    avatar: null,
    articles: 28,
    specialty: 'Product Strategy',
  },
  {
    name: 'Li Wei',
    role: 'Tech Lead',
    avatar: null,
    articles: 35,
    specialty: 'System Architecture',
  },
  {
    name: 'Wang Hao',
    role: 'AI Researcher',
    avatar: null,
    articles: 22,
    specialty: 'Machine Learning',
  },
  {
    name: 'Chen Xiao',
    role: 'Solution Architect',
    avatar: null,
    articles: 19,
    specialty: 'Enterprise Integration',
  },
]

// Blog Articles
const blogPosts = [
  {
    id: 'ai-agent-2-release',
    title: 'AI Agent 2.0: smarter workflow automation',
    excerpt:
      'AI Agent 2.0 is here with stronger natural language understanding, multi-model support and smart recommendations.',
    category: 'product',
    author: 'Zhang Lei',
    authorRole: 'Product Lead',
    date: '2026-01-25',
    readTime: '5 min',
    featured: true,
    image: null,
    views: 12500,
    likes: 486,
    comments: 89,
    tags: ['AI Agent', 'Product Update', 'New Features'],
    contentType: 'article',
  },
  {
    id: 'workflow-best-practices',
    title: 'Workflow design best practices: from getting started to expert',
    excerpt: 'Best practices from 1000+ users to help you design more efficient automation flows.',
    category: 'tips',
    author: 'Li Wei',
    authorRole: 'Tech Lead',
    date: '2026-01-20',
    readTime: '8 min',
    featured: true,
    image: null,
    views: 9800,
    likes: 352,
    comments: 67,
    tags: ['Best Practices', 'Workflow Design', 'Tutorial'],
    contentType: 'article',
  },
  {
    id: 'multimodal-ai-workflows',
    title: 'Multimodal AI Workflow: Image, Voice, and Text in One',
    excerpt:
      'Integrate visual, voice, and natural language in one workflow for smarter automation.',
    category: 'tech',
    author: 'Wang Hao',
    authorRole: 'AI Researcher',
    date: '2026-01-22',
    readTime: '12 min',
    featured: true,
    image: null,
    views: 8200,
    likes: 298,
    comments: 45,
    tags: ['Multimodal AI', 'Image Recognition', 'Voice Processing'],
    contentType: 'article',
  },
  {
    id: 'enterprise-automation-trends',
    title: '2026 Enterprise Automation Trends: AI-Driven Workflows',
    excerpt: 'Explore the latest 2026 trends: AI reshaping enterprise workflows and operations.',
    category: 'industry',
    author: 'Chen Xiao',
    authorRole: 'Solution Architect',
    date: '2026-01-15',
    readTime: '10 min',
    featured: false,
    image: null,
    views: 7600,
    likes: 245,
    comments: 38,
    tags: ['Enterprise Automation', 'Industry Trends', '2026'],
    contentType: 'article',
  },
  {
    id: 'slack-integration-guide',
    title: 'Slack integration guide: build efficient team collaboration',
    excerpt: 'Deep integration of AgentFlow and Slack for message automation and team workflows.',
    category: 'tips',
    author: 'Li Wei',
    authorRole: 'Tech Lead',
    date: '2026-01-10',
    readTime: '6 min',
    featured: false,
    image: null,
    views: 5400,
    likes: 198,
    comments: 32,
    tags: ['Slack', 'Integration', 'Team Collaboration'],
    contentType: 'article',
  },
  {
    id: 'customer-story-startup',
    title: 'Customer story: how AgentFlow saved 80% rework',
    excerpt: 'How one company used AgentFlow for support, data sync and internal flows.',
    category: 'case-study',
    author: 'Chen Xiao',
    authorRole: 'Solution Architect',
    date: '2026-01-05',
    readTime: '7 min',
    featured: false,
    image: null,
    views: 6200,
    likes: 276,
    comments: 41,
    tags: ['Customer Case Study', 'Startup', 'Efficiency Improvement'],
    contentType: 'article',
  },
  {
    id: 'error-handling-patterns',
    title: 'Workflow error handling: keep automation reliable',
    excerpt: 'Error handling policies: retry, fallback, and alerts so your automation runs stably.',
    category: 'tech',
    author: 'Li Wei',
    authorRole: 'Tech Lead',
    date: '2025-12-28',
    readTime: '9 min',
    featured: false,
    image: null,
    views: 4800,
    likes: 187,
    comments: 29,
    tags: ['Error Handling', 'Reliability', 'Monitoring'],
    contentType: 'article',
  },
  {
    id: 'api-rate-limiting',
    title: 'API rate limits and optimization: make workflows more efficient',
    excerpt: 'Optimize workflow API usage, rate limits and data processing.',
    category: 'tech',
    author: 'Wang Hao',
    authorRole: 'AI Researcher',
    date: '2025-12-20',
    readTime: '7 min',
    featured: false,
    image: null,
    views: 3900,
    likes: 156,
    comments: 24,
    tags: ['API', 'Optimization', 'Rate Limit'],
    contentType: 'article',
  },
  {
    id: 'december-product-update',
    title: 'December product update: 20+ integrations and improvements',
    excerpt: 'Latest product update: new integrations and better user experience.',
    category: 'product',
    author: 'Zhang Lei',
    authorRole: 'Product Lead',
    date: '2025-12-15',
    readTime: '4 min',
    featured: false,
    image: null,
    views: 5100,
    likes: 203,
    comments: 35,
    tags: ['Product Update', 'Integration', 'Improvements'],
    contentType: 'article',
  },
  {
    id: 'security-compliance-guide',
    title: 'Enterprise security and compliance: SOC 2, GDPR and data protection',
    excerpt: 'How AgentFlow helps enterprises meet SOC 2, GDPR and protect sensitive data.',
    category: 'security',
    author: 'Chen Xiao',
    authorRole: 'Solution Architect',
    date: '2025-12-12',
    readTime: '11 min',
    featured: false,
    image: null,
    views: 4200,
    likes: 178,
    comments: 27,
    tags: ['Security', 'Compliance', 'GDPR', 'SOC 2'],
    contentType: 'article',
  },
  {
    id: 'llm-comparison-2026',
    title: '2026 LLM benchmark: GPT-5, Claude 4, Gemini Pro',
    excerpt:
      'Benchmark of major LLMs: inference, code generation, multi-language support and more.',
    category: 'tech',
    author: 'Wang Hao',
    authorRole: 'AI Researcher',
    date: '2025-12-08',
    readTime: '15 min',
    featured: false,
    image: null,
    views: 11200,
    likes: 567,
    comments: 98,
    tags: ['LLM', 'Benchmark', 'GPT-5', 'Claude 4'],
    contentType: 'article',
  },
  {
    id: 'fintech-automation-case',
    title: 'Finance Case Study: Using AI Workflows to Process 100K+ Transactions',
    excerpt:
      'How to use AgentFlow for transaction risk control, customer service and report automation.',
    category: 'case-study',
    author: 'Chen Xiao',
    authorRole: 'Solution Architect',
    date: '2025-12-05',
    readTime: '9 min',
    featured: false,
    image: null,
    views: 7800,
    likes: 342,
    comments: 56,
    tags: ['Finance', 'Fintech', 'Risk Control'],
    contentType: 'article',
  },
]

// Get Category Name
const getCategoryName = (slug: string) => {
  return categories.find((c) => c.slug === slug)?.name || slug
}

// Format Number
const formatNumber = (num: number) => {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showMorePosts, setShowMorePosts] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  // Filter Articles
  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = !selectedTag || post.tags.includes(selectedTag)
    return matchesCategory && matchesSearch && matchesTag
  })

  // Featured Articles
  const featuredPosts = blogPosts.filter((post) => post.featured)

  // Displayed Articles Count
  const displayedPosts = showMorePosts ? filteredPosts : filteredPosts.slice(0, 9)

  // Popular Articles (sorted by views)
  const popularPosts = [...blogPosts].sort((a, b) => b.views - a.views).slice(0, 5)

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 px-6 bg-gradient-hero">
        <div className="max-w-5xl mx-auto text-center">
          <div
            className={cn(
              'lobe-badge mb-8',
              'transition-all duration-500',
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Blog & Resources
          </div>

          <h1
            className={cn(
              'text-[32px] sm:text-[40px] lg:text-[48px] font-semibold text-foreground tracking-tight mb-6 leading-tight',
              'transition-all duration-700 delay-100',
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            Insights &
            <br />
            <span className="text-brand">inspiration</span>
          </h1>

          <p
            className={cn(
              'text-[15px] text-foreground-light max-w-2xl mx-auto mb-10',
              'transition-all duration-700 delay-200',
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            Explore the latest AI workflow automation trends, product updates, and case studies
          </p>

          {/* Search */}
          <div
            className={cn(
              'max-w-xl mx-auto relative mb-10',
              'transition-all duration-700 delay-300',
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-lighter" />
            <Input
              placeholder="Search articles, tutorials, case studies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-11 pr-4 rounded-full bg-surface-100/50 backdrop-blur-sm border-border/30 text-foreground placeholder:text-foreground-lighter focus:border-brand/50 focus:ring-brand/20"
            />
          </div>

          {/* Stats Bar */}
          <div
            className={cn(
              'flex flex-wrap justify-center gap-8 sm:gap-12',
              'transition-all duration-700 delay-400',
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
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
      {!searchQuery && selectedCategory === 'all' && !selectedTag && (
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
                  'lg:col-span-2 group relative overflow-hidden rounded-2xl',
                  'bg-surface-100/30 border border-border/30',
                  'hover:border-brand/30 transition-all duration-500'
                )}
              >
                <div className="p-8 sm:p-10 min-h-[320px] flex flex-col justify-end">
                  <div className="absolute top-6 left-6 flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-full bg-brand text-background text-[11px] font-semibold">
                      Featured
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
                      'group flex-1 p-6 rounded-2xl',
                      'bg-surface-100/30 border border-border/30',
                      'hover:border-brand/30',
                      'transition-all duration-300'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="lobe-badge">{getCategoryName(post.category)}</span>
                      <span className="text-[11px] text-foreground-lighter">{post.readTime}</span>
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
      {!searchQuery && selectedCategory === 'all' && !selectedTag && (
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
                    'inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium',
                    'bg-surface-100/30 border border-border/30',
                    'hover:border-brand/30 hover:bg-brand/5',
                    'transition-all duration-200'
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
                Currently filtering by tag: <span className="font-semibold">{selectedTag}</span>
              </span>
              <button
                onClick={() => setSelectedTag(null)}
                className="ml-auto text-[13px] text-brand hover:underline"
              >
                Clear Filter
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
              const Icon = category.icon
              return (
                <button
                  key={category.slug}
                  onClick={() => {
                    setSelectedCategory(category.slug)
                    setSelectedTag(null)
                  }}
                  className={cn(
                    'inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-medium transition-all',
                    selectedCategory === category.slug
                      ? 'bg-foreground text-background shadow-lg'
                      : 'bg-surface-100/30 border border-border/30 text-foreground-light hover:text-foreground hover:border-foreground/20'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {category.name}
                  <span
                    className={cn(
                      'text-[11px] px-1.5 py-0.5 rounded-full',
                      selectedCategory === category.slug
                        ? 'bg-background/20 text-background'
                        : 'bg-surface-200/50 text-foreground-lighter'
                    )}
                  >
                    {category.count}
                  </span>
                </button>
              )
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
                      'group flex flex-col p-5 rounded-2xl',
                      'bg-surface-100/30 border border-border/30',
                      'hover:border-brand/30',
                      'transition-all duration-300',
                      index === 0 && !searchQuery && selectedCategory === 'all' && 'sm:col-span-2'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="lobe-badge">{getCategoryName(post.category)}</span>
                      <span className="text-[11px] text-foreground-lighter">{post.readTime}</span>
                    </div>

                    <h3
                      className={cn(
                        'font-semibold text-foreground mb-2 group-hover:text-brand transition-colors line-clamp-2',
                        index === 0 && !searchQuery && selectedCategory === 'all'
                          ? 'text-[15px]'
                          : 'text-[13px]'
                      )}
                    >
                      {post.title}
                    </h3>

                    <p
                      className={cn(
                        'text-foreground-light mb-4 line-clamp-2 flex-1',
                        index === 0 && !searchQuery && selectedCategory === 'all'
                          ? 'text-[13px]'
                          : 'text-[12px]'
                      )}
                    >
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
                    No related articles
                  </h3>
                  <p className="text-foreground-light text-[13px] mb-8">
                    Try adjusting your search keywords or selecting another category
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-full px-6 border-border/30"
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCategory('all')
                      setSelectedTag(null)
                    }}
                  >
                    View all
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
                    Load More Articles
                    <span className="ml-2 text-[11px] text-foreground-lighter">
                      ({filteredPosts.length - 9} )
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
                  <h3 className="text-[14px] font-semibold text-foreground">Popular Articles</h3>
                </div>
                <div className="space-y-4">
                  {popularPosts.map((post, index) => (
                    <Link key={post.id} href={`/blog/${post.id}`} className="group flex gap-3">
                      <span
                        className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-bold shrink-0',
                          index === 0
                            ? 'bg-brand text-white'
                            : index === 1
                              ? 'bg-orange-500 text-white'
                              : index === 2
                                ? 'bg-yellow-500 text-black'
                                : 'bg-surface-200/50 text-foreground-lighter'
                        )}
                      >
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-medium text-foreground group-hover:text-brand transition-colors line-clamp-2">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-foreground-lighter">
                          <Eye className="w-3 h-3" />
                          {formatNumber(post.views)} reads
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
                  <h3 className="text-[14px] font-semibold text-foreground">Author Team</h3>
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
                        <span className="text-[13px] font-semibold text-foreground">
                          {author.articles}
                        </span>
                        <span className="text-[11px] text-foreground-lighter ml-1">articles</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="p-6 rounded-2xl bg-surface-100/30 border border-brand/20">
                <h3 className="text-[14px] font-semibold text-foreground mb-4">Quick Navigation</h3>
                <div className="space-y-2">
                  {[
                    { href: '/docs', icon: BookOpen, label: 'Documentation Center' },
                    { href: '/templates', icon: Rocket, label: 'Template Gallery' },
                    { href: '/community', icon: MessageSquare, label: 'Community Discussion' },
                    { href: '/changelog', icon: Sparkles, label: 'Changelog' },
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
                <h2 className="text-[20px]">Series</h2>
              </div>
              <p className="text-[13px] text-foreground-light">
                Learn the system and master workflow automation
              </p>
            </div>
            <Link href="/learn/courses">
              <Button variant="outline" className="rounded-full border-border/30">
                View All Courses
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {blogSeries.map((series) => {
              const Icon = series.icon
              return (
                <Link
                  key={series.id}
                  href={`/learn/courses/${series.id}`}
                  className={cn(
                    'group p-6 rounded-2xl bg-surface-100/30 border border-border/30',
                    'hover:border-brand/30 transition-all duration-300'
                  )}
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                      'bg-brand/10'
                    )}
                  >
                    <Icon className="w-6 h-6 text-brand" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[11px] font-medium',
                        series.level === 'Getting Started' && 'bg-emerald-500/10 text-emerald-400',
                        series.level === '' && 'bg-blue-500/10 text-blue-400',
                        series.level === 'Advanced' && 'bg-purple-500/10 text-purple-400'
                      )}
                    >
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
                    <span>{series.articles} Articles</span>
                    <span>·</span>
                    <span>{series.totalReadTime}</span>
                  </div>
                </Link>
              )
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
                <h2 className="text-[20px]">Upcoming Webinars</h2>
              </div>
              <p className="text-[13px] text-foreground-light">
                Interact with experts in real time and learn automation technology
              </p>
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
                    Online Live
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
                    {webinar.registrations} people already registered
                  </span>
                  <Button
                    size="sm"
                    className="h-8 px-4 rounded-full bg-foreground text-background text-[11px]"
                  >
                    Register Now
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
            <h2 className="text-[20px]">Free Resource Downloads</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {downloadableResources.map((resource) => {
              const Icon = resource.icon
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
                      {formatNumber(resource.downloads)} downloads
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 rounded-full text-[11px] border-brand/30 text-brand hover:bg-brand/10"
                    >
                      Free Download
                    </Button>
                  </div>
                </div>
              )
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
              <h2 className="text-[20px]">Community Featured</h2>
            </div>
            <Link href="/community">
              <Button variant="outline" className="rounded-full border-border/30">
                Join Community
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
            <h2 className="text-[20px] font-semibold text-foreground mb-4">User Reviews</h2>
            <p className="text-[13px] text-foreground-light">
              See what other users say about our content.
            </p>
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
                Weekly Featured Newsletter
              </div>
              <h2 className="text-[24px] sm:text-[30px] font-semibold text-foreground mb-4">
                Stay ahead of the curve
              </h2>
              <p className="text-[15px] text-foreground-light mb-8 max-w-xl mx-auto">
                Subscribe to our newsletter for the latest AI workflow automation trends, product
                updates and content
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  className="h-12 flex-1 rounded-full bg-surface-100/50 border-border/30 text-foreground placeholder:text-foreground-lighter focus:border-brand/50"
                />
                <Button className="h-12 px-8 rounded-full bg-foreground text-background font-semibold hover:bg-foreground/90">
                  Subscribe Now
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap justify-center gap-6 text-[12px] text-foreground-lighter">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-brand" />
                  12,000+ Subscribers
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand" />3 issues per week
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-brand" />
                  Unsubscribe anytime
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
            Ready to Build Smart Workflows?
          </h2>
          <p className="text-[13px] text-foreground-light mb-8">
            Sign up for free and experience the full power of AI agents
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button className="h-12 px-8 rounded-full bg-foreground text-background font-semibold hover:bg-foreground/90">
                Get Started Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                variant="outline"
                className="h-12 px-8 rounded-full border-border/30 hover:border-foreground/20"
              >
                Book a Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
