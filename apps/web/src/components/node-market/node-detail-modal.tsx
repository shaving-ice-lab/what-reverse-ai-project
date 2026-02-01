"use client";

/**
 * 节点详情弹窗组件
 * 
 * 展示节点的完整信息、评价和操作
 */

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Star,
  Download,
  Package,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  FileText,
  Code2,
  Clock,
  User,
  Cpu,
  Database,
  Globe,
  Wrench,
  MessageSquare,
  HardDrive,
  Sparkles,
  Heart,
  Share2,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { customNodeApi } from "@/lib/api/custom-node";
import type { CustomNodeDetail, CustomNodeCategory, CustomNodeReview } from "@/types/custom-node";

// 分类图标映射
const categoryIconMap: Record<CustomNodeCategory, typeof Cpu> = {
  ai: Cpu,
  data: Database,
  integration: Globe,
  utility: Wrench,
  logic: GitBranch,
  communication: MessageSquare,
  storage: HardDrive,
  other: Sparkles,
};

// 分类名称映射
const categoryNameMap: Record<CustomNodeCategory, string> = {
  ai: "AI/LLM",
  data: "数据处理",
  integration: "集成",
  utility: "工具",
  logic: "逻辑控制",
  communication: "通信",
  storage: "存储",
  other: "其他",
};

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

interface NodeDetailModalProps {
  nodeSlug: string;
  isOpen: boolean;
  onClose: () => void;
  onInstallSuccess?: () => void;
}

export function NodeDetailModal({
  nodeSlug,
  isOpen,
  onClose,
  onInstallSuccess,
}: NodeDetailModalProps) {
  const [node, setNode] = useState<CustomNodeDetail | null>(null);
  const [reviews, setReviews] = useState<CustomNodeReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "code" | "versions" | "reviews">("overview");
  
  // 操作状态
  const [isInstalling, setIsInstalling] = useState(false);
  const [isStarring, setIsStarring] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  
  // 展开状态
  const [showAllVersions, setShowAllVersions] = useState(false);

  // 加载节点详情
  const loadNode = useCallback(async () => {
    if (!nodeSlug) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await customNodeApi.getBySlug(nodeSlug);
      setNode(response.data);
      setIsStarred(response.data.userState?.isStarred || false);
      setIsInstalled(response.data.userState?.isInstalled || false);
    } catch (err) {
      console.error("加载节点详情失败:", err);
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  }, [nodeSlug]);

  // 加载评价
  const loadReviews = useCallback(async () => {
    if (!node) return;
    
    try {
      const response = await customNodeApi.getReviews(node.id, { pageSize: 5 });
      setReviews(response.data || []);
    } catch (err) {
      console.error("加载评价失败:", err);
    }
  }, [node]);

  // 安装节点
  const handleInstall = async () => {
    if (!node || isInstalling) return;
    
    setIsInstalling(true);
    try {
      await customNodeApi.install(node.id);
      setIsInstalled(true);
      onInstallSuccess?.();
    } catch (err) {
      console.error("安装失败:", err);
      alert(err instanceof Error ? err.message : "安装失败");
    } finally {
      setIsInstalling(false);
    }
  };

  // 卸载节点
  const handleUninstall = async () => {
    if (!node || isInstalling) return;
    
    setIsInstalling(true);
    try {
      await customNodeApi.uninstall(node.id);
      setIsInstalled(false);
    } catch (err) {
      console.error("卸载失败:", err);
      alert(err instanceof Error ? err.message : "卸载失败");
    } finally {
      setIsInstalling(false);
    }
  };

  // 收藏/取消收藏
  const handleStar = async () => {
    if (!node || isStarring) return;
    
    setIsStarring(true);
    try {
      const response = await customNodeApi.star(node.id);
      setIsStarred(response.data.isStarred);
    } catch (err) {
      console.error("收藏失败:", err);
    } finally {
      setIsStarring(false);
    }
  };

  // 复制代码
  const handleCopyCode = () => {
    if (node?.exampleCode) {
      navigator.clipboard.writeText(node.exampleCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNode();
    }
  }, [isOpen, loadNode]);

  useEffect(() => {
    if (node) {
      loadReviews();
    }
  }, [node, loadReviews]);

  // 关闭弹窗时重置状态
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("overview");
      setShowAllVersions(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const CategoryIcon = node ? categoryIconMap[node.category] : Sparkles;
  const categoryName = node ? categoryNameMap[node.category] : "其他";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative w-full max-w-4xl max-h-[90vh] m-4 rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 加载状态 */}
        {isLoading && (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* 错误状态 */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-32">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={loadNode} className="mt-4">
              重试
            </Button>
          </div>
        )}

        {/* 节点内容 */}
        {node && !isLoading && !error && (
          <>
            {/* 头部 */}
            <div className="p-6 border-b border-border shrink-0">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-3xl shrink-0">
                  {node.icon || "📦"}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold text-foreground">{node.name}</h2>
                    <span className="text-sm text-muted-foreground">v{node.version}</span>
                    {node.author.isVerified && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        认证
                      </span>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground mb-3">{node.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CategoryIcon className="w-4 h-4" />
                      {categoryName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      {node.avgRating.toFixed(1)} ({node.reviewCount} 评价)
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      {formatNumber(node.installCount)} 安装
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {node.author.displayName || node.author.username}
                    </span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleStar}
                    disabled={isStarring}
                  >
                    {isStarring ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Heart className={cn("w-4 h-4", isStarred && "fill-red-500 text-red-500")} />
                    )}
                  </Button>
                  <Button variant="outline" size="icon">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  {isInstalled ? (
                    <Button
                      variant="outline"
                      onClick={handleUninstall}
                      disabled={isInstalling}
                      className="text-destructive hover:text-destructive"
                    >
                      {isInstalling ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Package className="w-4 h-4 mr-2" />
                      )}
                      卸载
                    </Button>
                  ) : (
                    <Button
                      onClick={handleInstall}
                      disabled={isInstalling}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {isInstalling ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      安装
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Tab 导航 */}
            <div className="border-b border-border shrink-0">
              <div className="flex gap-1 px-6">
                {[
                  { id: "overview" as const, label: "概述" },
                  { id: "code" as const, label: "示例代码" },
                  { id: "versions" as const, label: "版本历史" },
                  { id: "reviews" as const, label: `评价 (${node.reviewCount})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                      activeTab === tab.id
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab 内容 */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* 概述 */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* 详细描述 */}
                  {node.longDescription && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-3">详细介绍</h3>
                      <div className="p-4 rounded-xl bg-muted/50 border border-border">
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {node.longDescription}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 输入输出端口 */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-3">输入端口</h3>
                      <div className="space-y-2">
                        {node.inputs.map((input, index) => (
                          <div
                            key={index}
                            className="p-3 rounded-lg bg-muted/50 border border-border"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <code className="text-sm font-mono text-primary">
                                {input.name}
                              </code>
                              <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 text-xs">
                                {input.type}
                              </span>
                              {input.required && (
                                <span className="text-destructive text-xs">*必填</span>
                              )}
                            </div>
                            {input.description && (
                              <p className="text-xs text-muted-foreground">{input.description}</p>
                            )}
                          </div>
                        ))}
                        {node.inputs.length === 0 && (
                          <p className="text-sm text-muted-foreground">无输入端口</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-3">输出端口</h3>
                      <div className="space-y-2">
                        {node.outputs.map((output, index) => (
                          <div
                            key={index}
                            className="p-3 rounded-lg bg-muted/50 border border-border"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <code className="text-sm font-mono text-primary">
                                {output.name}
                              </code>
                              <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 text-xs">
                                {output.type}
                              </span>
                            </div>
                            {output.description && (
                              <p className="text-xs text-muted-foreground">{output.description}</p>
                            )}
                          </div>
                        ))}
                        {node.outputs.length === 0 && (
                          <p className="text-sm text-muted-foreground">无输出端口</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 链接 */}
                  <div className="flex flex-wrap gap-3">
                    {node.repositoryUrl && (
                      <a
                        href={node.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <GitBranch className="w-4 h-4" />
                        源代码
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {node.documentationUrl && (
                      <a
                        href={node.documentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        文档
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* 标签 */}
                  {node.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-3">标签</h3>
                      <div className="flex flex-wrap gap-2">
                        {node.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-3 py-1.5 rounded-full bg-muted text-sm text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 示例代码 */}
              {activeTab === "code" && (
                <div>
                  {node.exampleCode ? (
                    <div className="relative">
                      <button
                        onClick={handleCopyCode}
                        className="absolute top-3 right-3 p-2 rounded-lg bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copiedCode ? (
                          <Check className="w-4 h-4 text-primary" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <pre className="p-4 rounded-xl bg-popover border border-border overflow-x-auto">
                        <code className="text-sm font-mono text-foreground">
                          {node.exampleCode}
                        </code>
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Code2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>暂无示例代码</p>
                    </div>
                  )}
                </div>
              )}

              {/* 版本历史 */}
              {activeTab === "versions" && (
                <div className="space-y-3">
                  {(showAllVersions ? node.versions : node.versions.slice(0, 5)).map((version, index) => (
                    <div
                      key={version.version}
                      className={cn(
                        "p-4 rounded-xl border transition-colors",
                        index === 0
                          ? "bg-primary/5 border-primary/20"
                          : "bg-card border-border"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">v{version.version}</span>
                          {index === 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                              最新
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(version.publishedAt), { addSuffix: true, locale: zhCN })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{version.changelog}</p>
                    </div>
                  ))}
                  
                  {node.versions.length > 5 && (
                    <button
                      onClick={() => setShowAllVersions(!showAllVersions)}
                      className="flex items-center justify-center gap-1 w-full py-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      {showAllVersions ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          收起
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          查看全部 ({node.versions.length} 个版本)
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* 评价 */}
              {activeTab === "reviews" && (
                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div
                        key={review.id}
                        className="p-4 rounded-xl bg-card border border-border"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                            {(review.user.displayName || review.user.username || "U").charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-foreground">
                                {review.user.displayName || review.user.username}
                              </span>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={cn(
                                      "w-3.5 h-3.5",
                                      i < review.rating
                                        ? "fill-yellow-500 text-yellow-500"
                                        : "text-muted-foreground"
                                    )}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.title && (
                              <h4 className="font-medium text-foreground mb-1">{review.title}</h4>
                            )}
                            <p className="text-sm text-muted-foreground">{review.content}</p>
                            <span className="text-xs text-muted-foreground mt-2 block">
                              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: zhCN })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>暂无评价</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
