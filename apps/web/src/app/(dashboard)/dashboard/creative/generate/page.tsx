"use client";

/**
 * 创作生成页面 - Supabase 风格
 * 左侧输入，右侧结果，强调面板层级
 */

import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Copy,
  RefreshCw,
  Save,
  ChevronDown,
  Settings,
  History,
  Wand2,
  FileText,
  Image,
  Code,
  MessageSquare,
  ArrowLeft,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// AI 模型列表
const aiModels = [
  { id: "gpt-4", name: "GPT-4 Turbo", provider: "OpenAI" },
  { id: "claude-3", name: "Claude 3.5 Sonnet", provider: "Anthropic" },
  { id: "qwen", name: "通义千问 2.5", provider: "阿里云" },
];

// 类型配置 - Supabase 风格
const typeConfig = {
  text: { icon: FileText, label: "文本生成", color: "text-foreground-light" },
  image: { icon: Image, label: "图片生成", color: "text-foreground-light" },
  code: { icon: Code, label: "代码生成", color: "text-brand-500" },
  chat: { icon: MessageSquare, label: "对话生成", color: "text-foreground-light" },
};

export default function GeneratePage() {
  const searchParams = useSearchParams();
  const type = (searchParams.get("type") || "text") as keyof typeof typeConfig;
  
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const config = typeConfig[type] || typeConfig.text;

  // 自动调整输入高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    setResult("");
    
    // 模拟输出
    const mockResponse = `以下是为你生成的初稿内容：

## 核心亮点

1. **清晰定位**：明确目标受众与场景
2. **结构化表达**：先结论后细节，阅读更顺畅
3. **行动引导**：给出下一步建议

### 行动建议

你可以在末尾添加 CTA，或者补充更多数据支撑，使内容更具说服力。

如需微调语气或长度，请继续告诉我。`;

    // 逐字输出效果
    for (let i = 0; i <= mockResponse.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 10));
      setResult(mockResponse.slice(0, i));
    }
    
    setIsGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-background-studio">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-background-studio/95 backdrop-blur">
        <div className="max-w-[1400px] mx-auto w-full px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/creative"
              className="p-2 rounded-md hover:bg-surface-75 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground-muted" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-surface-200 flex items-center justify-center">
                <config.icon className={cn("w-4 h-4", config.color)} />
              </div>
              <div>
                <p className="page-caption">Creative</p>
                <div className="text-sm font-medium text-foreground">{config.label}</div>
                <div className="text-xs text-foreground-muted">创作生成</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-border bg-surface-100 p-1">
            {/* 模型选择 */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-[13px] text-foreground hover:bg-surface-200 transition-colors"
              >
                <span>{aiModels.find(m => m.id === selectedModel)?.name}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showSettings && (
                <div className="absolute right-0 top-full mt-2 w-56 p-2 rounded-md bg-surface-100 border border-border z-50">
                  {aiModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setShowSettings(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] transition-colors",
                        selectedModel === model.id
                          ? "bg-brand-200 text-brand-500"
                          : "text-foreground hover:bg-surface-200"
                      )}
                    >
                      <span>{model.name}</span>
                      <span className="text-xs text-foreground-muted">{model.provider}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground-muted hover:text-foreground">
              <History className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground-muted hover:text-foreground">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="grid h-full lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Input Panel */}
          <section className="flex flex-col border-b border-border lg:border-b-0 lg:border-r">
            <div className="page-panel-header flex items-center justify-between">
              <div>
                <h2 className="page-panel-title">输入提示</h2>
                <p className="page-panel-description">描述你的需求，支持 Markdown</p>
              </div>
              <span className="text-xs text-foreground-muted">Ctrl / ⌘ + Enter</span>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-3">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="描述你想生成的内容..."
                className={cn(
                  "w-full min-h-[240px] p-4 rounded-md",
                  "bg-surface-100 border border-border text-foreground",
                  "placeholder:text-foreground-muted resize-none",
                  "focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400",
                  "text-sm leading-relaxed"
                )}
              />
              <p className="text-xs text-foreground-muted">
                结果将实时显示在右侧，可复制或保存。
              </p>
            </div>

            <div className="p-4 border-t border-border bg-background-studio">
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full h-11 bg-brand-500 hover:bg-brand-600 text-background font-medium"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    开始生成
                  </>
                )}
              </Button>
            </div>
          </section>

          {/* Output Panel */}
          <section className="flex flex-col">
            <div className="page-panel-header flex items-center justify-between">
              <div>
                <h2 className="page-panel-title">生成结果</h2>
                <p className="page-panel-description">支持复制、保存与重新生成</p>
              </div>
              {result && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-8"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 mr-1 text-brand-500" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    {copied ? "已复制" : "复制"}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8">
                    <Save className="w-4 h-4 mr-1" />
                    保存
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="h-8"
                  >
                    <RefreshCw className={cn("w-4 h-4 mr-1", isGenerating && "animate-spin")} />
                    重新生成
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-auto p-6">
              {result ? (
                <div className="page-panel p-6">
                  <div className="prose prose-neutral dark:prose-invert max-w-none">
                    {result.split('\n').map((line, i) => {
                      if (line.startsWith("## ")) {
                        return (
                          <h2 key={i} className="text-xl font-semibold text-foreground mt-6 mb-3">
                            {line.replace("## ", "")}
                          </h2>
                        );
                      }
                      if (line.startsWith("### ")) {
                        return (
                          <h3 key={i} className="text-lg font-semibold text-foreground mt-4 mb-2">
                            {line.replace("### ", "")}
                          </h3>
                        );
                      }
                      if (line.startsWith("- ") || /^\d+\.\s/.test(line)) {
                        return (
                          <li key={i} className="text-foreground-muted ml-4">
                            {line.replace(/^[-\d.]+\s/, "")}
                          </li>
                        );
                      }
                      if (line.trim() === "") return <br key={i} />;
                      return (
                        <p key={i} className="text-foreground-muted my-2">
                          {line}
                        </p>
                      );
                    })}
                    {isGenerating && (
                      <span className="inline-block w-2 h-5 bg-brand-500 animate-pulse ml-1" />
                    )}
                  </div>
                </div>
              ) : (
                <div className="page-panel p-8 h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-md bg-surface-200 flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-7 h-7 text-foreground-muted" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      开始生成内容
                    </h3>
                    <p className="text-foreground-muted">
                      输入需求后，AI 将为你生成结构化内容。
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
