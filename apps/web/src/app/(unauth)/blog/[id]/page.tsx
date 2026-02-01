"use client";

/**
 * 博客详情页面 - 单篇文章展示
 * Manus 风格：简约、中性色
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

// 模拟博客文章数据
const blogPosts: Record<string, {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  authorRole: string;
  date: string;
  readTime: string;
  tags: string[];
}> = {
  "ai-agent-2-release": {
    id: "ai-agent-2-release",
    title: "AI Agent 2.0 正式发布：更智能的工作流自动化",
    excerpt: "我们很高兴地宣布 AI Agent 2.0 的正式发布，带来了更强大的自然语言理解能力、多模型支持和智能推荐功能。",
    content: `
## 引言

今天，我们非常激动地宣布 AgentFlow AI Agent 2.0 的正式发布！这是我们迄今为止最重要的更新，带来了革命性的新功能和显著的性能提升。

## 主要更新

### 1. 多模型支持

AI Agent 2.0 现在支持市面上所有主流的大语言模型：

- **GPT-4 Turbo** - OpenAI 最新最强大的模型
- **Claude 3** - Anthropic 的新一代模型
- **通义千问** - 阿里巴巴的大模型
- **文心一言** - 百度的大模型
- **本地模型** - 通过 Ollama 支持本地部署的模型

您可以根据任务类型和成本考虑，灵活选择最适合的模型。

### 2. 自然语言转工作流

这是我们最期待的功能之一。现在您可以用自然语言描述您想要自动化的任务，AI 会自动生成对应的工作流。

例如，您只需要说："每当收到客户邮件时，自动分类并回复常见问题"，系统就会为您创建完整的工作流。

### 3. 智能推荐系统

基于您的使用习惯和行业特点，AI Agent 2.0 会智能推荐：

- 最适合您的工作流模板
- 可能需要的节点和集成
- 优化建议和最佳实践

### 4. 性能大幅提升

- 执行速度提升 **40%**
- 内存占用降低 **30%**
- 启动时间缩短 **50%**

## 如何升级

如果您是现有用户，AI Agent 2.0 已经自动为您启用。您只需要登录控制台，就能体验所有新功能。

新用户可以通过注册免费账户立即开始使用。

## 下一步计划

我们会继续倾听用户反馈，持续改进产品。接下来的重点方向包括：

- 移动端 App
- 更多第三方集成
- 团队协作增强
- AI 工作流调试工具

感谢所有用户的支持和反馈，正是你们让 AgentFlow 变得更好！

---

如果您有任何问题或建议，欢迎通过以下方式联系我们：

- 社区论坛：[community.agentflow.ai](https://community.agentflow.ai)
- Twitter：[@agentflow](https://twitter.com/agentflow)
- 邮箱：feedback@agentflow.ai
    `", category: "product",
    author: "产品团队",
    authorRole: "AgentFlow 产品部",
    date: "2026-01-25",
    readTime: "5 分钟",
    tags: ["AI Agent", "产品更新", "新功能"],
  },
  "workflow-best-practices": {
    id: "workflow-best-practices",
    title: "工作流设计最佳实践：从入门到精通",
    excerpt: "本文将分享我们在帮助数千位用户构建工作流过程中总结的最佳实践，帮助您设计更高效、更可靠的自动化流程。",
    content: `
## 引言

在帮助数千位用户构建工作流的过程中，我们积累了大量的经验和教训。本文将分享这些宝贵的最佳实践，帮助您设计更高效、更可靠的自动化流程。

## 1. 从小处着手

**原则：先从简单的工作流开始，逐步增加复杂度。**

很多用户一开始就想构建一个包含几十个节点的复杂工作流，结果往往事与愿违。建议您：

- 首先识别最重要的 2-3 个步骤
- 构建一个最小可用的工作流
- 验证效果后再逐步扩展

## 2. 合理使用条件分支

条件分支是工作流中最强大的功能之一，但也容易被滥用。

### 推荐做法

- 条件判断应该简单明确
- 避免超过 3 层嵌套
- 使用有意义的分支名称

### 不推荐做法

- 在一个节点中放置过多条件
- 使用模糊的判断逻辑
- 忽略边界情况处理

## 3. 错误处理是必须的

任何工作流都可能遇到错误，关键是如何优雅地处理它们。

建议的错误处理策略：

1. **重试机制**：对于临时性错误，设置合理的重试次数
2. **降级处理**：当主要路径失败时，切换到备用方案
3. **告警通知**：重要错误应该及时通知相关人员
4. **日志记录**：记录足够的信息以便排查问题

## 4. 性能优化技巧

### 并行执行

当多个步骤之间没有依赖关系时，使用并行执行可以大幅提升性能。

### 缓存策略

对于频繁访问的数据，考虑使用缓存避免重复请求。

### 批量处理

处理大量数据时，使用批量操作而不是逐条处理。

## 5. 测试和监控

### 测试环境

始终在测试环境中验证工作流，确认无误后再部署到生产环境。

### 监控指标

关注以下关键指标：

- 执行成功率
- 平均执行时间
- 错误分布
- 资源消耗

## 总结

好的工作流设计需要不断实践和优化。希望这些最佳实践能帮助您构建更好的自动化流程。

如果您有任何问题或想分享您的经验，欢迎在社区论坛与我们交流！
    `", category: "tips",
    author: "技术团队",
    authorRole: "AgentFlow 技术部",
    date: "2026-01-20",
    readTime: "8 分钟",
    tags: ["最佳实践", "工作流设计", "教程"],
  },
};

// 相关文章
const relatedPosts = [
  {
    id: "enterprise-automation-trends",
    title: "2026 企业自动化趋势：AI 驱动的工作流革命",
    date: "2026-01-15",
    readTime: "10 分钟",
  },
  {
    id: "slack-integration-guide",
    title: "Slack 集成完全指南：打造高效团队协作",
    date: "2026-01-10",
    readTime: "6 分钟",
  },
  {
    id: "error-handling-patterns",
    title: "工作流错误处理模式：确保自动化的可靠性",
    date: "2025-12-28",
    readTime: "9 分钟",
  },
];

export default function BlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(42);
  
  const post = blogPosts[postId];

  // 如果文章不存在，显示 404
  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="pt-32 pb-16 px-6 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">文章不存在</h1>
          <p className="text-muted-foreground mb-8">抱歉，您访问的文章不存在或已被删除</p>
          <Link href="/blog">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              返回博客列表
            </Button>
          </Link>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = () => {
    if (liked) {
      setLikeCount(prev => prev - 1);
    } else {
      setLikeCount(prev => prev + 1);
    }
    setLiked(!liked);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Article Header */}
      <article className="pt-20 sm:pt-28 pb-16 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            返回博客
          </Link>

          {/* Category & Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {post.category === "product" ? "产品更新" : 
               post.category === "tips" ? "使用技巧" : 
               post.category === "tech" ? "技术分享" : post.category}
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {post.readTime}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Author & Date */}
          <div className="flex items-center justify-between flex-wrap gap-4 pb-8 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground">{post.author}</div>
                <div className="text-sm text-muted-foreground">{post.authorRole}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                    <h2 key={index} className="text-2xl font-bold text-foreground mt-10 mb-4">
                      {paragraph.replace('## ', '')}
                    </h2>
                  );
                }
                if (paragraph.startsWith('### ')) {
                  return (
                    <h3 key={index} className="text-xl font-semibold text-foreground mt-8 mb-3">
                      {paragraph.replace('### ', '')}
                    </h3>
                  );
                }
                if (paragraph.startsWith('- ')) {
                  return (
                    <li key={index} className="text-muted-foreground ml-4">
                      {paragraph.replace('- ', '')}
                    </li>
                  );
                }
                if (paragraph.startsWith('1. ') || paragraph.startsWith('2. ') || paragraph.startsWith('3. ') || paragraph.startsWith('4. ')) {
                  return (
                    <li key={index} className="text-muted-foreground ml-4 list-decimal">
                      {paragraph.replace(/^\d+\.\s/, '')}
                    </li>
                  );
                }
                if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                  return (
                    <p key={index} className="text-foreground font-semibold my-4">
                      {paragraph.replace(/\*\*/g, '')}
                    </p>
                  );
                }
                if (paragraph.startsWith('---')) {
                  return <hr key={index} className="my-8 border-border" />;
                }
                if (paragraph.trim() === '') return null;
                return (
                  <p key={index} className="text-muted-foreground leading-relaxed my-4">
                    {paragraph}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 py-6 border-t border-border">
            <Tag className="w-4 h-4 text-muted-foreground" />
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className="px-3 py-1 rounded-full bg-muted text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between py-6 border-t border-border">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                  liked
                    ? "bg-red-500/10 text-red-500"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <Heart className={cn("w-5 h-5", liked && "fill-current")} />
                <span>{likeCount}</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <MessageSquare className="w-5 h-5" />
                <span>评论</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground mr-2">分享</span>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <button
                onClick={copyLink}
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Link2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      <section className="py-16 px-6 bg-muted/20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-8 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            相关文章
          </h2>

          <div className="space-y-4">
            {relatedPosts.map((relatedPost) => (
              <Link
                key={relatedPost.id}
                href={`/blog/${relatedPost.id}`}
                className={cn(
                  "flex items-center justify-between p-5 rounded-xl",
                  "bg-card border border-border",
                  "hover:border-primary/30 hover:shadow-md",
                  "transition-all group"
                )}
              >
                <div className="flex-1">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors mb-2">
                    {relatedPost.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{relatedPost.date}</span>
                    <span>{relatedPost.readTime}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold text-foreground mb-4">
            订阅我们的 Newsletter
          </h2>
          <p className="text-muted-foreground mb-6">
            每周精选最新文章和产品更新，直接发送到您的邮箱
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 h-11 px-4 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
            />
            <Button className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
              订阅
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
