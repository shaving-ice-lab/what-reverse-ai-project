"use client";

/**
 * 全局搜索结果页面 - Supabase 风格
 * 统一搜索工作流、Agent、对话、文件等
 */

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import {
  Search,
  Zap,
  Bot,
  MessageSquare,
  FileText,
  FolderOpen,
  Users,
  Clock,
  Star,
  ArrowRight,
  Filter,
  ChevronDown,
  Sparkles,
  X,
  History,
  TrendingUp,
  Hash,
  ExternalLink,
  Play,
  Eye,
} from "lucide-react";

// 搜索结果类型
type ResultType = "all" | "workflow" | "agent" | "conversation" | "file" | "template";

// 搜索结果类型配置
const resultTypes = [
  { id: "all", label: "全部", icon: Search },
  { id: "workflow", label: "工作流", icon: Zap },
  { id: "agent", label: "Agent", icon: Bot },
  { id: "conversation", label: "对话", icon: MessageSquare },
  { id: "file", label: "文件", icon: FileText },
  { id: "template", label: "模板", icon: FolderOpen },
];

// 模拟搜索结果
const mockResults = {
  workflows: [
    {
      id: "wf-1",
      type: "workflow",
      title: "客户反馈自动处理",
      description: "自动收集、分类和回复客户反馈",
      status: "active",
      lastRun: "2小时前",
      runs: 1256,
      starred: true,
    },
    {
      id: "wf-2",
      type: "workflow",
      title: "邮件自动分类",
      description: "基于内容自动分类收件邮件",
      status: "active",
      lastRun: "5小时前",
      runs: 892,
      starred: false,
    },
  ],
  agents: [
    {
      id: "ag-1",
      type: "agent",
      title: "写作助手",
      description: "帮助您撰写各类文档和内容",
      model: "GPT-4",
      conversations: 156,
      starred: true,
    },
    {
      id: "ag-2",
      type: "agent",
      title: "代码审查助手",
      description: "自动审查代码并提供优化建议",
      model: "Claude 3",
      conversations: 89,
      starred: false,
    },
  ],
  conversations: [
    {
      id: "cv-1",
      type: "conversation",
      title: "产品需求讨论",
      preview: "关于新功能的需求分析和优先级排序...",
      model: "GPT-4",
      messages: 24,
      updatedAt: "1小时前",
    },
    {
      id: "cv-2",
      type: "conversation",
      title: "技术方案评审",
      preview: "讨论系统架构设计和技术选型...",
      model: "Claude 3",
      messages: 18,
      updatedAt: "3小时前",
    },
  ],
  files: [
    {
      id: "fl-1",
      type: "file",
      title: "产品需求文档 v2.0.docx",
      fileType: "document",
      size: "2.4 MB",
      updatedAt: "2天前",
      indexed: true,
    },
    {
      id: "fl-2",
      type: "file",
      title: "API 接口规范.md",
      fileType: "document",
      size: "156 KB",
      updatedAt: "1周前",
      indexed: true,
    },
  ],
  templates: [
    {
      id: "tp-1",
      type: "template",
      title: "客服自动回复模板",
      description: "自动化客服回复工作流模板",
      category: "客户服务",
      uses: 2450,
    },
    {
      id: "tp-2",
      type: "template",
      title: "数据分析报告生成",
      description: "自动生成数据分析报告",
      category: "数据分析",
      uses: 1820,
    },
  ],
};

// 热门搜索
const popularSearches = [
  "工作流自动化",
  "AI 写作",
  "数据分析",
  "客服机器人",
  "邮件处理",
];

// 最近搜索
const recentSearches = [
  "客户反馈",
  "GPT-4",
  "API 文档",
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [activeType, setActiveType] = useState<ResultType>("all");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);

  // 模拟搜索
  useEffect(() => {
    if (initialQuery) {
      setIsSearching(true);
      setTimeout(() => {
        setIsSearching(false);
        setHasSearched(true);
      }, 500);
    }
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setHasSearched(true);
    }, 500);
  };

  // 获取筛选后的结果
  const getFilteredResults = () => {
    if (activeType === "all") {
      return [
        ...mockResults.workflows,
        ...mockResults.agents,
        ...mockResults.conversations,
        ...mockResults.files,
        ...mockResults.templates,
      ];
    }
    switch (activeType) {
      case "workflow":
        return mockResults.workflows;
      case "agent":
        return mockResults.agents;
      case "conversation":
        return mockResults.conversations;
      case "file":
        return mockResults.files;
      case "template":
        return mockResults.templates;
      default:
        return [];
    }
  };

  const filteredResults = getFilteredResults();
  const resultCounts = {
    all: Object.values(mockResults).flat().length,
    workflow: mockResults.workflows.length,
    agent: mockResults.agents.length,
    conversation: mockResults.conversations.length,
    file: mockResults.files.length,
    template: mockResults.templates.length,
  };

  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="page-caption">Search</div>
        <PageHeader
          title="全局搜索"
          description="统一搜索工作流、Agent、对话与文件"
        >
          <div className="space-y-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                <Input
                  type="text"
                  placeholder="搜索工作流、Agent、对话、文件..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-12 pr-12 h-12 text-base bg-surface-200 border-border text-foreground placeholder:text-foreground-muted focus:border-brand-400"
                  autoFocus
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-surface-200"
                  >
                    <X className="w-4 h-4 text-foreground-muted" />
                  </button>
                )}
              </div>
            </form>

            {/* 类型筛选 */}
            {hasSearched && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {resultTypes.map((type) => {
                  const Icon = type.icon;
                  const count = resultCounts[type.id as keyof typeof resultCounts];
                  return (
                    <button
                      key={type.id}
                      onClick={() => setActiveType(type.id as ResultType)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-md text-[13px] whitespace-nowrap transition-colors",
                        activeType === type.id
                          ? "bg-brand-500 text-background"
                          : "bg-surface-200 text-foreground-light hover:text-foreground hover:bg-surface-300"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {type.label}
                      <span className="text-xs opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </PageHeader>

        <div className="page-divider" />
        {/* 未搜索时显示建议 */}
        {!hasSearched && (
          <div className="space-y-6">
            {/* 最近搜索 */}
            {recentSearches.length > 0 && (
              <div className="page-panel">
                <div className="page-panel-header flex items-center gap-2">
                  <History className="w-4 h-4 text-foreground-muted" />
                  <span className="page-panel-title">最近搜索</span>
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setQuery(term);
                        setIsSearching(true);
                        setTimeout(() => {
                          setIsSearching(false);
                          setHasSearched(true);
                        }, 500);
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-md bg-surface-100 border border-border-muted hover:border-border-strong transition-colors"
                    >
                      <Clock className="w-4 h-4 text-foreground-muted" />
                      <span className="text-[13px] text-foreground">{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 热门搜索 */}
            <div className="page-panel">
              <div className="page-panel-header flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-foreground-muted" />
                <span className="page-panel-title">热门搜索</span>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      setIsSearching(true);
                      setTimeout(() => {
                        setIsSearching(false);
                        setHasSearched(true);
                      }, 500);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-surface-100 border border-border hover:border-border-strong transition-colors"
                  >
                    <Hash className="w-4 h-4 text-foreground-muted" />
                    <span className="text-[13px] text-foreground">{term}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 快捷入口 */}
            <div className="page-panel">
              <div className="page-panel-header flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-foreground-muted" />
                <span className="page-panel-title">快捷入口</span>
              </div>
              <div className="p-4 page-grid md:grid-cols-3">
                <Link href="/dashboard/workflows/new" className="p-4 rounded-md bg-surface-100 border border-border-muted hover:border-border-strong transition-supabase group">
                  <Zap className="w-6 h-6 text-warning mb-3" />
                  <h4 className="text-sm font-medium text-foreground group-hover:text-brand-500 transition-colors">创建工作流</h4>
                  <p className="text-[13px] text-foreground-light mt-1">自动化您的任务</p>
                </Link>
                <Link href="/dashboard/my-agents/new" className="p-4 rounded-md bg-surface-100 border border-border-muted hover:border-border-strong transition-supabase group">
                  <Bot className="w-6 h-6 text-foreground-light mb-3" />
                  <h4 className="text-sm font-medium text-foreground group-hover:text-brand-500 transition-colors">创建 Agent</h4>
                  <p className="text-[13px] text-foreground-light mt-1">定制您的 AI 助手</p>
                </Link>
                <Link href="/dashboard/conversations" className="p-4 rounded-md bg-surface-100 border border-border-muted hover:border-border-strong transition-supabase group">
                  <MessageSquare className="w-6 h-6 text-brand-500 mb-3" />
                  <h4 className="text-sm font-medium text-foreground group-hover:text-brand-500 transition-colors">开始对话</h4>
                  <p className="text-[13px] text-foreground-light mt-1">与 AI 畅聊</p>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 搜索中 */}
        {isSearching && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mb-4" />
            <p className="text-[13px] text-foreground-light">搜索中...</p>
          </div>
        )}

        {/* 搜索结果 */}
        {hasSearched && !isSearching && (
          <div className="page-panel">
            <div className="page-panel-header">
              <div>
                <h3 className="page-panel-title">搜索结果</h3>
                <p className="page-panel-description">
                  找到 {filteredResults.length} 个与 "{query || initialQuery}" 相关的结果
                </p>
              </div>
            </div>

            <div className="p-4">
              {filteredResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-14 h-14 rounded-md bg-surface-200 flex items-center justify-center mb-4">
                    <Search className="w-6 h-6 text-foreground-muted" />
                  </div>
                  <h3 className="text-base font-medium text-foreground mb-2">没有找到结果</h3>
                  <p className="text-[13px] text-foreground-light">尝试其他搜索关键词</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredResults.map((result: any) => (
                    <Link
                      key={result.id}
                      href={
                        result.type === "workflow" ? `/workflows/${result.id}` :
                        result.type === "agent" ? `/my-agents/${result.id}` :
                        result.type === "conversation" ? `/conversations/${result.id}` :
                        result.type === "file" ? `/files/${result.id}` :
                        result.type === "template" ? `/template-gallery/${result.id}` :
                        "#"
                      }
                      className="flex items-start gap-4 p-4 rounded-md bg-surface-100 border border-border hover:border-border-strong transition-supabase group"
                    >
                      {/* 图标 */}
                      <div className={cn(
                        "w-9 h-9 rounded-md flex items-center justify-center shrink-0",
                        result.type === "workflow" ? "bg-warning-200" :
                        result.type === "agent" ? "bg-surface-200" :
                        result.type === "conversation" ? "bg-brand-200" :
                        result.type === "file" ? "bg-brand-200" :
                        "bg-surface-200"
                      )}>
                        {result.type === "workflow" && <Zap className="w-4 h-4 text-warning" />}
                        {result.type === "agent" && <Bot className="w-4 h-4 text-foreground-light" />}
                        {result.type === "conversation" && <MessageSquare className="w-4 h-4 text-brand-500" />}
                        {result.type === "file" && <FileText className="w-4 h-4 text-brand-500" />}
                        {result.type === "template" && <FolderOpen className="w-4 h-4 text-foreground-light" />}
                      </div>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-foreground group-hover:text-brand-500 transition-colors truncate">
                            {result.title}
                          </h4>
                          {result.starred && <Star className="w-4 h-4 text-warning fill-warning" />}
                          {result.indexed && (
                            <Badge variant="secondary" className="text-xs bg-brand-200 text-brand-500">
                              已索引
                            </Badge>
                          )}
                        </div>
                        <p className="text-[13px] text-foreground-light line-clamp-1">
                          {result.description || result.preview}
                        </p>
                        
                        {/* 元信息 */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-foreground-muted">
                          <Badge variant="secondary" className="text-xs capitalize bg-surface-200 text-foreground-light">
                            {result.type === "workflow" ? "工作流" :
                             result.type === "agent" ? "Agent" :
                             result.type === "conversation" ? "对话" :
                             result.type === "file" ? "文件" : "模板"}
                          </Badge>
                          
                          {result.runs && (
                            <span className="flex items-center gap-1">
                              <Play className="w-3 h-3" />
                              {result.runs} 次运行
                            </span>
                          )}
                          {result.model && (
                            <span>{result.model}</span>
                          )}
                          {result.messages && (
                            <span>{result.messages} 条消息</span>
                          )}
                          {result.size && (
                            <span>{result.size}</span>
                          )}
                          {result.uses && (
                            <span>{result.uses} 次使用</span>
                          )}
                          {(result.updatedAt || result.lastRun) && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {result.updatedAt || result.lastRun}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 箭头 */}
                      <ArrowRight className="w-5 h-5 text-foreground-muted group-hover:text-brand-500 transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
