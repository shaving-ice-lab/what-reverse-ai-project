"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  X,
  Play,
  Download,
  Star,
  Eye,
  GitFork,
  Clock,
  User,
  Tag,
  ArrowRight,
  CheckCircle,
  Zap,
  Bot,
  Database,
  Globe,
  Code2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Workflow,
  Heart,
  Share2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// 模板类型定义
export interface TemplateData {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  author: string;
  authorAvatar?: string;
  category: string;
  tags: string[];
  stars: number;
  downloads: number;
  views: number;
  price: number | "free";
  previewImage?: string;
  screenshots?: string[];
  nodes: number;
  complexity: "beginner" | "intermediate" | "advanced";
  features: string[];
  requirements?: string[];
  version: string;
  updatedAt: string;
  createdAt: string;
}

// 示例模板数据
const sampleTemplates: TemplateData[] = [
  {
    id: "ai-customer-service",
    name: "智能客服助手",
    description: "基于 GPT-4 的多轮对话客服系统，支持情感分析和自动分类",
    longDescription: "这是一个完整的智能客服解决方案，集成了多轮对话管理、情感分析、意图识别和自动工单分类功能。适用于电商、SaaS、金融等多种业务场景。支持多语言，可快速对接现有客服系统。",
    author: "AgentFlow 官方",
    authorAvatar: "A",
    category: "AI 应用",
    tags: ["客服", "GPT-4", "对话", "NLP"],
    stars: 1234,
    downloads: 5678,
    views: 12345,
    price: "free",
    nodes: 12,
    complexity: "intermediate",
    features: [
      "多轮对话上下文管理",
      "实时情感分析",
      "智能意图识别",
      "自动工单创建",
      "多语言支持",
      "对话历史记录",
    ],
    requirements: ["GPT-4 API Key", "数据库连接"],
    version: "2.1.0",
    updatedAt: "2026-01-25",
    createdAt: "2025-06-15",
  },
  {
    id: "data-pipeline",
    name: "数据处理管道",
    description: "企业级 ETL 数据管道，支持多数据源同步和转换",
    longDescription: "高性能数据处理管道，支持从多种数据源（MySQL、PostgreSQL、MongoDB、API）提取数据，进行清洗、转换和加载。内置数据质量检查和错误处理机制。",
    author: "DataMaster",
    authorAvatar: "D",
    category: "数据处理",
    tags: ["ETL", "数据同步", "管道"],
    stars: 856,
    downloads: 3421,
    views: 8765,
    price: 29,
    nodes: 18,
    complexity: "advanced",
    features: [
      "多数据源支持",
      "增量同步",
      "数据质量检查",
      "错误自动重试",
      "实时监控",
      "调度管理",
    ],
    requirements: ["数据库连接", "API 访问权限"],
    version: "1.5.2",
    updatedAt: "2026-01-20",
    createdAt: "2025-09-01",
  },
];

export interface TemplatePreviewModalProps {
  /** 模板数据 */
  template: TemplateData | null;
  /** 是否打开 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 使用模板回调 */
  onUseTemplate?: (template: TemplateData) => void;
  /** 收藏回调 */
  onFavorite?: (template: TemplateData) => void;
}

export function TemplatePreviewModal({
  template,
  isOpen,
  onClose,
  onUseTemplate,
  onFavorite,
}: TemplatePreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "preview" | "code">("overview");
  const [isFavorited, setIsFavorited] = useState(false);
  const [copied, setCopied] = useState(false);

  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ESC 关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen || !template) return null;

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(template.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    onFavorite?.(template);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "beginner":
        return "text-emerald-500 bg-emerald-500/10";
      case "intermediate":
        return "text-yellow-500 bg-yellow-500/10";
      case "advanced":
        return "text-red-500 bg-red-500/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getComplexityLabel = (complexity: string) => {
    switch (complexity) {
      case "beginner":
        return "入门";
      case "intermediate":
        return "中级";
      case "advanced":
        return "高级";
      default:
        return complexity;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-4xl max-h-[90vh] overflow-hidden",
          "bg-background border border-border rounded-2xl shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-300"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Workflow className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{template.name}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-3.5 h-3.5" />
                {template.author}
                <span className="text-border">•</span>
                <span>v{template.version}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-border bg-muted/30">
          {(["overview", "preview", "code"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "overview" && "概览"}
              {tab === "preview" && "预览"}
              {tab === "code" && "代码"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          {activeTab === "overview" && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">描述</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {template.longDescription || template.description}
                  </p>
                </div>

                {/* Features */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">功能特点</h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {template.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                      >
                        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                {template.requirements && template.requirements.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3">使用要求</h3>
                    <div className="flex flex-wrap gap-2">
                      {template.requirements.map((req) => (
                        <span
                          key={req}
                          className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-500 text-sm"
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-muted text-sm text-muted-foreground"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Stats Card */}
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-lg font-bold text-foreground">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {template.stars.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">收藏</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-lg font-bold text-foreground">
                        <Download className="w-4 h-4 text-primary" />
                        {template.downloads.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">下载</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-lg font-bold text-foreground">
                        <Eye className="w-4 h-4 text-blue-500" />
                        {template.views.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">浏览</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">分类</span>
                      <span className="text-foreground">{template.category}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">节点数</span>
                      <span className="text-foreground">{template.nodes} 个</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">难度</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        getComplexityColor(template.complexity)
                      )}>
                        {getComplexityLabel(template.complexity)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">更新时间</span>
                      <span className="text-foreground">{template.updatedAt}</span>
                    </div>
                  </div>
                </div>

                {/* Template ID */}
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">模板 ID</span>
                    <button
                      onClick={handleCopyId}
                      className="p-1 rounded hover:bg-muted transition-colors"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  <code className="text-sm font-mono text-foreground">{template.id}</code>
                </div>
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="space-y-4">
              {/* Workflow Preview */}
              <div className="aspect-video rounded-xl bg-background border border-border overflow-hidden flex items-center justify-center">
                <div className="text-center p-8">
                  <Workflow className="w-16 h-16 text-primary/50 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">工作流预览</p>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => onUseTemplate?.(template)}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    在编辑器中打开
                  </Button>
                </div>
              </div>

              {/* Node List */}
              <div className="grid sm:grid-cols-3 gap-3">
                {["触发器", "LLM 处理", "条件分支", "数据转换", "API 调用", "输出"].slice(0, template.nodes > 6 ? 6 : template.nodes).map((node, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-card border border-border flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      {i === 0 && <Zap className="w-4 h-4 text-primary" />}
                      {i === 1 && <Bot className="w-4 h-4 text-primary" />}
                      {i === 2 && <GitFork className="w-4 h-4 text-primary" />}
                      {i === 3 && <Database className="w-4 h-4 text-primary" />}
                      {i === 4 && <Globe className="w-4 h-4 text-primary" />}
                      {i === 5 && <Code2 className="w-4 h-4 text-primary" />}
                    </div>
                    <span className="text-sm text-foreground">{node}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "code" && (
            <div className="rounded-xl bg-background border border-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border/50">
                <span className="text-xs text-muted-foreground">workflow.json</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify({ id: template.id, name: template.name }, null, 2));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <pre className="p-4 text-sm font-mono text-foreground overflow-x-auto">
{`{
  "id": "${template.id}",
  "name": "${template.name}",
  "version": "${template.version}",
  "nodes": [
    {
      "id": "trigger_1",
      "type": "webhook",
      "config": { "method": "POST" }
    },
    {
      "id": "llm_1", 
      "type": "llm",
      "model": "gpt-4",
      "prompt": "..."
    },
    // ... ${template.nodes - 2} more nodes
  ],
  "connections": [
    { "from": "trigger_1", "to": "llm_1" }
  ]
}`}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <button
              onClick={handleFavorite}
              className={cn(
                "p-2 rounded-lg transition-all",
                isFavorited
                  ? "bg-red-500/10 text-red-500"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Heart className={cn("w-5 h-5", isFavorited && "fill-current")} />
            </button>
            <button className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-all">
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right mr-4">
              {template.price === "free" ? (
                <span className="text-lg font-bold text-primary">免费</span>
              ) : (
                <span className="text-lg font-bold text-foreground">${template.price}</span>
              )}
            </div>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => window.open(`/templates/${template.id}`, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              详情
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
              onClick={() => onUseTemplate?.(template)}
            >
              {template.price === "free" ? "立即使用" : "购买使用"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 导出示例模板数据供外部使用
export { sampleTemplates };
