"use client";

/**
 * 文档详情页面 - Supabase 风格
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Copy,
  Download,
  Share2,
  Trash2,
  MoreHorizontal,
  Clock,
  FileText,
  Edit3,
  Check,
  Loader2,
  History,
  Star,
  MessageSquare,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 模拟文档数据
const mockDocuments: Record<string, {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
}> = {
  "1": {
    id: "1",
    title: "Q1 营销方案",
    content: `# Q1 营销方案

## 执行摘要

本季度营销重点聚焦于品牌升级和用户增长，通过多渠道整合营销策略，实现用户量和品牌影响力的双重提升。

## 核心目标

1. **用户增长目标**：新增注册用户 50,000+
2. **品牌曝光目标**：全网曝光量达到 1000 万+
3. **转化目标**：付费转化率提升至 5%

## 营销策略

### 内容营销

- 每周发布 3-5 篇高质量技术博客
- 制作 2-3 个产品使用教程视频
- 开展行业白皮书研究

### 社交媒体营销

- 微信公众号日更运营
- 知乎、掘金技术社区深度运营
- Twitter/LinkedIn 国际社区布局

### 活动营销

- 线上直播：每月 2 场产品直播
- 线下活动：北京、上海用户见面会
- 行业展会：参加 2-3 场行业展会

## 预算分配

| 类别 | 预算 | 占比 |
|------|------|------|
| 内容制作 | 50,000 | 25% |
| 广告投放 | 80,000 | 40% |
| 活动运营 | 50,000 | 25% |
| 其他 | 20,000 | 10% |

## 时间表

- 1月：品牌升级，新官网上线
- 2月：春节营销活动
- 3月：新版本发布会，Q1 总结

## 预期成果

通过本季度的营销投入，预计实现：

- DAU 提升 30%
- 品牌搜索指数翻倍
- 行业内品牌认知度显著提升`, type: "text",
    createdAt: "2026-01-15",
    updatedAt: "10 分钟前",
    wordCount: 458,
  },
  "2": {
    id: "2",
    title: "产品发布公告",
    content: `# AgentFlow 2.3 正式发布

我们很高兴地宣布 AgentFlow 2.3 版本正式发布！

## 主要更新

### Multi-Agent 协作

全新的 Multi-Agent 协作功能，支持多个 AI Agent 协同工作，处理复杂的多步骤任务。

### 性能优化

- 执行速度提升 50%
- 内存占用降低 30%

### 新增集成

- 飞书集成
- 语雀知识库
- Notion 数据库

## 升级方式

如果您是现有用户，系统已自动为您升级。

感谢您的支持！`, type: "text",
    createdAt: "2026-01-20",
    updatedAt: "2 小时前",
    wordCount: 156,
  },
};

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  
  const [document, setDocument] = useState(mockDocuments[documentId]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (document) {
      setEditedContent(document.content);
    }
  }, [document]);

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-2">文档不存在</h2>
          <p className="text-foreground-muted mb-4">该文档可能已被删除</p>
          <Link href="/creative">
            <Button className="bg-brand-500 hover:bg-brand-600 text-foreground">
              返回创意助手
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setDocument(prev => prev ? { ...prev, content: editedContent } : prev);
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(document.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (confirm("确定要删除这个文档吗？")) {
      router.push("/creative");
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background-studio/95 backdrop-blur">
        <div className="max-w-5xl mx-auto w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/creative"
              className="p-2 rounded-md hover:bg-surface-75 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground-muted" />
            </Link>
            <div>
              <p className="page-caption">Creative</p>
              <h1 className="text-lg font-semibold text-foreground">{document.title}</h1>
              <div className="flex items-center gap-3 text-xs text-foreground-muted mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  更新于 {document.updatedAt}
                </span>
                <span>{document.wordCount} 字</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setEditedContent(document.content);
                  setIsEditing(false);
                }}
              >
                取消
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-brand-500 hover:bg-brand-600 text-background"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    保存
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-brand-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <Button variant="outline" size="icon">
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                编辑
              </Button>
              
              <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
                
                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 p-1 rounded-md bg-surface-100 border border-border z-50">
                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground hover:bg-surface-75 transition-colors">
                      <Star className="w-4 h-4" />
                      添加到收藏
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground hover:bg-surface-75 transition-colors">
                      <Share2 className="w-4 h-4" />
                      分享
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground hover:bg-surface-75 transition-colors">
                      <History className="w-4 h-4" />
                      历史版本
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground hover:bg-surface-75 transition-colors">
                      <Wand2 className="w-4 h-4" />
                      AI 续写
                    </button>
                    <div className="my-1 border-t border-border" />
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className={cn(
                "w-full min-h-[600px] p-6 rounded-md",
                "bg-surface-100 border border-border text-foreground",
                "font-mono text-sm leading-relaxed",
                "focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400",
                "resize-none"
              )}
            />
          ) : (
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              {document.content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) {
                  return <h1 key={i} className="text-2xl font-semibold text-foreground mb-6">{line.replace('# ', '')}</h1>;
                }
                if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-2xl font-bold text-foreground mt-8 mb-4">{line.replace('## ', '')}</h2>;
                }
                if (line.startsWith('### ')) {
                  return <h3 key={i} className="text-xl font-semibold text-foreground mt-6 mb-3">{line.replace('### ', '')}</h3>;
                }
                if (line.startsWith('- ')) {
                  return <li key={i} className="text-foreground-muted ml-4">{line.replace('- ', '')}</li>;
                }
                if (/^\d+\.\s/.test(line)) {
                  return <li key={i} className="text-foreground-muted ml-4 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>;
                }
                if (line.startsWith('|')) {
                  return (
                    <div key={i} className="overflow-x-auto my-4">
                      <pre className="text-sm text-foreground-muted bg-surface-100 p-2 rounded">{line}</pre>
                    </div>
                  );
                }
                if (line.trim() === '') return <br key={i} />;
                return <p key={i} className="text-foreground-muted my-3 leading-relaxed">{line}</p>;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
