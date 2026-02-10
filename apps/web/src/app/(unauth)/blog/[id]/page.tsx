'use client'

/**
 * BlogDetailsPage - LobeHub Style Dark Design
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Share2,
  Heart,
  MessageSquare,
  Twitter,
  Linkedin,
  Link2,
  Copy,
  Check,
  ChevronRight,
  BookOpen,
  Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { cn } from '@/lib/utils'

// Mock Blog Article Data
const blogPosts: Record<
  string,
  {
    id: string
    title: string
    excerpt: string
    content: string
    category: string
    author: string
    authorRole: string
    date: string
    readTime: string
    tags: string[]
  }
> = {
  'ai-agent-2-release': {
    id: 'ai-agent-2-release',
    title: 'AI Agent 2.0 Released: Smarter Workflow Automation',
    excerpt:
      'We are excited to announce AI Agent 2.0, featuring more powerful natural language understanding, multi-model support, and smart recommendation features.',
    content: `
## Introduction

Today, we are thrilled to announce the official release of AgentFlow AI Agent 2.0! This is our most significant update yet, packed with new features and performance improvements.

## Key Updates

### 1. Multi-Model Support

AI Agent 2.0 now supports all major large language models:

- **GPT-4 Turbo** - OpenAI's latest and most powerful model
- **Claude 3** - Anthropic's newest model
- **Qwen** - A powerful open-source large model
- **Gemini** - Google's flagship model
- **Local Models** - Locally deployed models supported via Ollama

You can flexibly choose the most suitable model based on task type and cost considerations.

### 2. Natural Language Workflows

This is our most anticipated feature. You can now use natural language to describe the automation tasks you need, and AI will automatically generate the appropriate workflow.

For example, if you need: "Automatically categorize each customer email and reply to FAQs," the system will create a complete workflow for you.

### 3. Smart Recommendation System

Based on your usage patterns and industry characteristics, AI Agent 2.0 will intelligently recommend:

- The most suitable workflow templates for you
- Nodes and integrations you might need
- Optimization suggestions and best practices

### 4. Performance Improvements

- Execution speed improved by **40%**
- Memory usage reduced by **30%**
- Startup time shortened by **50%**

## How to Upgrade

If you are an existing user, AI Agent 2.0 has already been automatically enabled for you. Simply sign in to the console to experience all the new features.

New users can sign up for a free account to start using it right away.

## Future Plans

We will continue to listen to user feedback and continuously improve the product. Upcoming updates include:

- Mobile app
- More third-party integrations
- Enhanced team collaboration
- AI workflow debugging tools

Thank you to all our users for your support and feedback — together, let's make AgentFlow even better!

---

If you have any questions or suggestions, feel free to reach out through the following channels:

- Community Forum: [community.agentflow.ai](https://community.agentflow.ai)
- Twitter: [@agentflow](https://twitter.com/agentflow)
- Email: feedback@agentflow.ai
`,
    category: 'product',
    author: 'Product Team',
    authorRole: 'AgentFlow Product Team',
    date: '2026-01-25',
    readTime: '5 min',
    tags: ['AI Agent', 'Product Update', 'New Features'],
  },
  'workflow-best-practices': {
    id: 'workflow-best-practices',
    title: 'Workflow Design Best Practices: From Beginner to Expert',
    excerpt:
      'We share the best practices gathered from helping thousands of users build workflows, to help you design more efficient and powerful automation flows.',
    content: `
## Introduction

Having helped thousands of users build workflows, we have accumulated extensive experience. In this article, we will share best practices to help you design more efficient and powerful automation flows.

## 1. Start Small

**Principle: Begin with simple workflows, then gradually increase complexity.**

Many users try to build a complex workflow with 10+ nodes right from the start, which often leads to issues. Our recommendation:

- First identify the 2-3 most important steps
- Build a minimum viable workflow
- Verify effectiveness before expanding

## 2. Use Conditional Branches Wisely

Conditional branching is one of the most powerful workflow features, but it can also be easily misused.

### Recommended

- Keep condition checks simple and clear
- Avoid more than 3 levels of nesting
- Use meaningful branch names

### Not Recommended

- Placing multiple conditions in a single node
- Using vague decision logic
- Ignoring edge case handling

## 3. Error Handling is Essential

Any workflow can encounter errors — the key is how to handle them properly.

Recommended error handling strategies:

1. **Retry Mechanism**: For transient errors, set a reasonable retry count
2. **Fallback Processing**: When the primary path fails, switch to a backup plan
3. **Alert Notifications**: Critical errors should trigger timely notifications to relevant team members
4. **Log Recording**: Record detailed information for troubleshooting

## 4. Performance Optimization Tips

### Parallel Execution

When multiple steps have no dependencies, use parallel execution to significantly improve performance.

### Caching Strategy

For frequently accessed data, consider using caching to avoid repeated requests.

### Batch Processing

When processing large datasets, use batch operations instead of processing one by one.

## 5. Testing and Monitoring

### Test Environment

Always verify workflows in a test environment and confirm everything works before deploying to production.

### Key Metrics

Monitor the following key metrics:

- Execution success rate
- Average execution time
- Error distribution
- Resource consumption

## Summary

Effective workflow design requires continuous practice and optimization. We hope these best practices help you build better automation flows.

If you have any questions or want to share your experience, feel free to join the community forum and connect with us!
`,
    category: 'tips',
    author: 'Technology Team',
    authorRole: 'AgentFlow Technology Team',
    date: '2026-01-20',
    readTime: '8 min',
    tags: ['Best Practices', 'Workflow Design', 'Tutorial'],
  },
}

// Related Articles
const relatedPosts = [
  {
    id: 'enterprise-automation-trends',
    title: '2026 Enterprise Automation Trends: AI-Driven Workflows',
    date: '2026-01-15',
    readTime: '10 min',
  },
  {
    id: 'slack-integration-guide',
    title: 'Complete Slack Integration Guide: Building Efficient Team Collaboration',
    date: '2026-01-10',
    readTime: '6 min',
  },
  {
    id: 'error-handling-patterns',
    title: 'Workflow Error Handling: Ensuring Automation Reliability',
    date: '2025-12-28',
    readTime: '9 min',
  },
]

export default function BlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string

  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(42)

  const post = blogPosts[postId]

  // If article doesn't exist, display 404
  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="pt-32 sm:pt-40 pb-16 px-6 text-center">
          <h1 className="text-[20px] font-semibold text-foreground mb-4">Article Not Found</h1>
          <p className="text-[13px] text-foreground-light mb-8">
            Sorry, the article you're looking for doesn't exist or has been deleted
          </p>
          <Link href="/blog">
            <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90">
              Back to Blog
            </Button>
          </Link>
        </div>
        <SiteFooter />
      </div>
    )
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLike = () => {
    if (liked) {
      setLikeCount((prev) => prev - 1)
    } else {
      setLikeCount((prev) => prev + 1)
    }
    setLiked(!liked)
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Article Header */}
      <article className="pt-32 sm:pt-40 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-[13px] text-foreground-light hover:text-foreground mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Blog
          </Link>

          {/* Category & Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="lobe-badge">
              {post.category === 'product'
                ? 'Product Update'
                : post.category === 'tips'
                  ? 'Tips & Tricks'
                  : post.category === 'tech'
                    ? 'Tech Insights'
                    : post.category}
            </span>
            <span className="flex items-center gap-1 text-[12px] text-foreground-lighter">
              <Clock className="w-4 h-4" />
              {post.readTime}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-[26px] sm:text-[32px] font-semibold text-foreground mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Author & Date */}
          <div className="flex items-center justify-between flex-wrap gap-4 pb-8 border-b border-border/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                <User className="w-6 h-6 text-brand" />
              </div>
              <div>
                <div className="text-[14px] font-medium text-foreground">{post.author}</div>
                <div className="text-[12px] text-foreground-lighter">{post.authorRole}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-foreground-lighter">
              <Calendar className="w-4 h-4" />
              {post.date}
            </div>
          </div>

          {/* Content */}
          <div className="py-10">
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              {post.content.split('\n').map((paragraph, index) => {
                if (paragraph.startsWith('## ')) {
                  return (
                    <h2
                      key={index}
                      className="text-[20px] font-semibold text-foreground mt-10 mb-4"
                    >
                      {paragraph.replace('## ', '')}
                    </h2>
                  )
                }
                if (paragraph.startsWith('### ')) {
                  return (
                    <h3 key={index} className="text-[17px] font-semibold text-foreground mt-8 mb-3">
                      {paragraph.replace('### ', '')}
                    </h3>
                  )
                }
                if (paragraph.startsWith('- ')) {
                  return (
                    <li key={index} className="text-[13px] text-foreground-light ml-4">
                      {paragraph.replace('- ', '')}
                    </li>
                  )
                }
                if (
                  paragraph.startsWith('1. ') ||
                  paragraph.startsWith('2. ') ||
                  paragraph.startsWith('3. ') ||
                  paragraph.startsWith('4. ')
                ) {
                  return (
                    <li key={index} className="text-[13px] text-foreground-light ml-4 list-decimal">
                      {paragraph.replace(/^\d+\.\s/, '')}
                    </li>
                  )
                }
                if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                  return (
                    <p key={index} className="text-foreground font-semibold my-4 text-[14px]">
                      {paragraph.replace(/\*\*/g, '')}
                    </p>
                  )
                }
                if (paragraph.startsWith('---')) {
                  return <hr key={index} className="my-8 border-border/30" />
                }
                if (paragraph.trim() === '') return null
                return (
                  <p key={index} className="text-[13px] text-foreground-light leading-relaxed my-4">
                    {paragraph}
                  </p>
                )
              })}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 py-6 border-t border-border/30">
            <Tag className="w-4 h-4 text-foreground-lighter" />
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className="px-3 py-1 rounded-full bg-surface-100/30 text-[12px] text-foreground-light hover:text-foreground transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between py-6 border-t border-border/30">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full transition-all',
                  liked
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-surface-100/30 text-foreground-light hover:text-foreground'
                )}
              >
                <Heart className={cn('w-5 h-5', liked && 'fill-current')} />
                <span className="text-[13px]">{likeCount}</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-100/30 text-foreground-light hover:text-foreground transition-colors">
                <MessageSquare className="w-5 h-5" />
                <span className="text-[13px]">Comment</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[12px] text-foreground-lighter mr-2">Share</span>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-surface-100/30 flex items-center justify-center text-foreground-lighter hover:text-foreground transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-surface-100/30 flex items-center justify-center text-foreground-lighter hover:text-foreground transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <button
                onClick={copyLink}
                className="w-10 h-10 rounded-full bg-surface-100/30 flex items-center justify-center text-foreground-lighter hover:text-foreground transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-brand" /> : <Link2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      <section className="py-16 px-6 bg-gradient-section">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[17px] font-semibold text-foreground mb-8 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand" />
            Related Articles
          </h2>

          <div className="space-y-4">
            {relatedPosts.map((relatedPost) => (
              <Link
                key={relatedPost.id}
                href={`/blog/${relatedPost.id}`}
                className={cn(
                  'flex items-center justify-between p-5 rounded-2xl',
                  'bg-surface-100/30 border border-border/30',
                  'hover:border-brand/30',
                  'transition-all group'
                )}
              >
                <div className="flex-1">
                  <h3 className="text-[14px] font-medium text-foreground group-hover:text-brand transition-colors mb-2">
                    {relatedPost.title}
                  </h3>
                  <div className="flex items-center gap-4 text-[12px] text-foreground-lighter">
                    <span>{relatedPost.date}</span>
                    <span>{relatedPost.readTime}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-foreground-lighter group-hover:text-brand transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[17px] font-semibold text-foreground mb-4">
            Subscribe to Our Newsletter
          </h2>
          <p className="text-[13px] text-foreground-light mb-6">
            Get the latest articles and product updates delivered directly to your inbox every week
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 h-11 px-4 rounded-full bg-surface-100/30 border border-border/30 text-foreground placeholder:text-foreground-lighter focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/50"
            />
            <Button className="h-11 px-6 rounded-full bg-foreground text-background font-medium hover:bg-foreground/90">
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
