"use client";

/**
 * Creative Generate Page - Supabase Style
 * Left side: Input, Right side: Result, Emphasize Panel Hierarchy
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

// AI Model List
const aiModels = [
 { id: "gpt-4", name: "GPT-4 Turbo", provider: "OpenAI" },
 { id: "claude-3", name: "Claude 3.5 Sonnet", provider: "Anthropic" },
  { id: "qwen", name: "Qwen 2.5", provider: "Alibaba" },
];

// Type Config - Supabase Style
const typeConfig = {
  text: { icon: FileText, label: "Text Generation", color: "text-foreground-light" },
  image: { icon: Image, label: "Image Generation", color: "text-foreground-light" },
  code: { icon: Code, label: "Code Generation", color: "text-brand-500" },
  chat: { icon: MessageSquare, label: "Chat Generation", color: "text-foreground-light" },
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

  // Auto-adjust input height
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
 
    // Mock output
    const mockResponse = `Here is your generated content: 

## Core Highlights

1. **Clarity**: Define your target audience and scenario clearly
2. **Structure**: Use logical flow for better readability
3. **Call to Action**: Guide users to the next step

### Suggestions

You can add a CTA at the end, or provide more data to make the content more compelling.

If you need to fine-tune tone or length, tell me.`;

    // Character-by-character output effect
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
 href="/dashboard/creative"
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
 <div className="text-xs text-foreground-muted">Creative generate</div>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-2 rounded-md border border-border bg-surface-100 p-1">
 {/* Model Select */}
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
              <h2 className="page-panel-title">Input Prompt</h2>
 <p className="page-panel-description">Describe your requirements; Markdown is supported.</p>
 </div>
 <span className="text-xs text-foreground-muted">Ctrl / ⌘ + Enter</span>
 </div>
 <div className="flex-1 overflow-auto p-6 space-y-3">
 <textarea
 ref={textareaRef}
 value={prompt}
 onChange={(e) => setPrompt(e.target.value)}
 onKeyDown={handleKeyDown}
 placeholder="Describe the content you want to generate..."
 className={cn(
 "w-full min-h-[240px] p-4 rounded-md",
 "bg-surface-100 border border-border text-foreground",
 "placeholder:text-foreground-muted resize-none",
 "focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400",
 "text-sm leading-relaxed"
 )}
 />
 <p className="text-xs text-foreground-muted">
 Results are shown in real time on the right; you can copy or save.
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
 Generating...
 </>
 ) : (
 <>
              <Wand2 className="w-4 h-4 mr-2" />
              Start Generating
 </>
 )}
 </Button>
 </div>
 </section>

 {/* Output Panel */}
 <section className="flex flex-col">
 <div className="page-panel-header flex items-center justify-between">
 <div>
<h2 className="page-panel-title">Generate result</h2>
  <p className="page-panel-description">Copy, save or generate again</p>
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
 {copied ? "Copied" : "Copy"}
 </Button>
 <Button variant="ghost" size="sm" className="h-8">
 <Save className="w-4 h-4 mr-1" />
 Save
 </Button>
 <Button
 variant="ghost"
 size="sm"
 onClick={handleGenerate}
 disabled={isGenerating}
 className="h-8"
 >
 <RefreshCw className={cn("w-4 h-4 mr-1", isGenerating && "animate-spin")} />
                Regenerate
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
                Start Generating Content
              </h3>
              <p className="text-foreground-muted">
                After you enter your requirements, AI will generate structured content for you.
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
