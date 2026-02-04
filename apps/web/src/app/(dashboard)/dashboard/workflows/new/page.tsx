"use client";

/**
 * 创建新工作流页面
 * Supabase 风格：密度更高、层次清晰、引导明确
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Zap,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Clock,
  Webhook,
  Play,
  Mail,
  Calendar,
  Database,
  MessageSquare,
  Code,
  Bot,
  FileText,
  Users,
  ShoppingCart,
  Search,
  Star,
  Loader2,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// 触发器类型
const triggers = [
  {
    id: "manual",
    name: "手动触发",
    description: "手动点击运行工作流",
    icon: Play,
  },
  {
    id: "schedule",
    name: "定时触发",
    description: "按设定的时间表自动运行",
    icon: Clock,
  },
  {
    id: "webhook",
    name: "Webhook",
    description: "通过 HTTP 请求触发",
    icon: Webhook,
  },
  {
    id: "email",
    name: "邮件触发",
    description: "收到特定邮件时触发",
    icon: Mail,
  },
];

// 模板分类
const templateCategories = [
  { id: "all", name: "全部" },
  { id: "popular", name: "热门" },
  { id: "automation", name: "自动化" },
  { id: "ai", name: "AI 应用" },
  { id: "integration", name: "集成" },
  { id: "data", name: "数据处理" },
];

// 工作流模板
const templates = [
  {
    id: "blank",
    name: "空白工作流",
    description: "从零开始创建您的工作流",
    icon: FileText,
    category: "all",
    popular: false,
  },
  {
    id: "ai-assistant",
    name: "AI 智能助手",
    description: "使用 AI 自动回复和处理任务",
    icon: Bot,
    category: "ai",
    popular: true,
  },
  {
    id: "data-sync",
    name: "数据同步",
    description: "在多个系统间同步数据",
    icon: Database,
    category: "data",
    popular: true,
  },
  {
    id: "notification",
    name: "消息通知",
    description: "自动发送消息到 Slack、邮件等",
    icon: MessageSquare,
    category: "automation",
    popular: true,
  },
  {
    id: "schedule-report",
    name: "定时报告",
    description: "定期生成并发送报告",
    icon: Calendar,
    category: "automation",
    popular: false,
  },
  {
    id: "form-handler",
    name: "表单处理",
    description: "自动处理表单提交数据",
    icon: FileText,
    category: "integration",
    popular: false,
  },
  {
    id: "crm-sync",
    name: "CRM 同步",
    description: "与 CRM 系统双向同步数据",
    icon: Users,
    category: "integration",
    popular: false,
  },
  {
    id: "order-process",
    name: "订单处理",
    description: "自动化订单处理流程",
    icon: ShoppingCart,
    category: "automation",
    popular: false,
  },
  {
    id: "code-review",
    name: "代码审查",
    description: "自动审查 PR 并添加评论",
    icon: Code,
    category: "ai",
    popular: false,
  },
];

export default function NewWorkflowPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [workflowName, setWorkflowName] = useState("");
  const [selectedTrigger, setSelectedTrigger] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templateCategory, setTemplateCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // 筛选模板
  const filteredTemplates = templates.filter((template) => {
    const matchesCategory =
      templateCategory === "all" ||
      (templateCategory === "popular" && template.popular) ||
      template.category === templateCategory;
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedTemplateData = templates.find((template) => template.id === selectedTemplate);
  const selectedTriggerData = triggers.find((trigger) => trigger.id === selectedTrigger);

  const checklistItems = [
    { label: "已选择模板", ok: !!selectedTemplate },
    { label: "已命名工作流", ok: !!workflowName },
    { label: "已选择触发方式", ok: !!selectedTrigger },
  ];

  // 创建工作流
  const handleCreate = async () => {
    setIsCreating(true);
    // 模拟创建
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // 跳转到编辑器
    router.push("/dashboard/editor/new-workflow-id");
  };

  // 下一步
  const handleNext = () => {
    if (step === 1 && selectedTemplate) {
      if (selectedTemplate === "blank") {
        setStep(2);
      } else {
        // 使用模板直接创建
        handleCreate();
      }
    } else if (step === 2 && workflowName && selectedTrigger) {
      handleCreate();
    }
  };

  // 检查是否可以继续
  const canProceed = step === 1
    ? !!selectedTemplate
    : workflowName && selectedTrigger;

  return (
    <PageContainer fullWidth>
      <div className="border-b border-border bg-background-studio">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-6">
          <PageHeader
            title="创建工作流"
            description="选择模板、配置触发器并发布自动化流程。"
            eyebrow="Workflows"
            backHref="/dashboard/workflows"
            backLabel="返回工作流"
            badge={(
              <span className="inline-flex items-center gap-1 rounded-full border border-brand-500/30 bg-brand-200/40 px-2.5 py-0.5 text-[11px] text-brand-500">
                <Sparkles className="h-3.5 w-3.5" />
                Workflow Builder
              </span>
            )}
            actions={(
              <div className="flex items-center gap-3">
                <span className="text-xs text-foreground-muted">步骤</span>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium border border-border",
                      step >= 1
                        ? "border-brand-500/50 bg-brand-200/40 text-brand-500 ring-1 ring-brand-500/20"
                        : "bg-surface-200 text-foreground-muted"
                    )}
                  >
                    1
                  </div>
                  <div className={cn("w-10 h-0.5", step >= 2 ? "bg-brand-500" : "bg-border")} />
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium border border-border",
                      step >= 2
                        ? "border-brand-500/50 bg-brand-200/40 text-brand-500 ring-1 ring-brand-500/20"
                        : "bg-surface-200 text-foreground-muted"
                    )}
                  >
                    2
                  </div>
                </div>
              </div>
            )}
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-200/60 px-2.5 py-1">
                模板 {templates.length}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-200/60 px-2.5 py-1">
                触发器 {triggers.length}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-200/60 px-2.5 py-1">
                当前步骤 {step}/2
              </span>
            </div>
          </PageHeader>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-6 py-6">
        <div className="page-grid lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {step === 1 ? (
              <div className="page-panel">
                <div className="page-panel-header space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-200/40 border border-brand-500/30 text-xs text-brand-500 font-medium">
                    <Sparkles className="h-4 w-4" />
                    步骤 1/2
                  </div>
                  <div>
                    <h2 className="text-section-title text-foreground">选择模板</h2>
                    <p className="text-description">
                      选择一个模板快速开始，或从空白工作流开始。
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <Input
                      placeholder="搜索模板..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      inputSize="sm"
                      variant="search"
                      leftIcon={<Search className="h-4 w-4" />}
                      className="min-w-[220px] max-w-md flex-1"
                    />
                    <div className="flex items-center gap-1 p-1 rounded-md bg-surface-200/60 border border-border">
                      {templateCategories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setTemplateCategory(category.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-md text-[11px] font-medium transition-supabase",
                            templateCategory === category.id
                              ? "bg-surface-200 text-foreground shadow-sm"
                              : "text-foreground-muted hover:text-foreground hover:bg-surface-200/60"
                          )}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="page-grid sm:grid-cols-2 lg:grid-cols-3">
                    {filteredTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={cn(
                          "page-panel p-5 text-left transition-supabase group",
                          selectedTemplate === template.id
                            ? "border-brand-500/50 ring-1 ring-brand-500/20 bg-brand-200/10"
                            : "hover:border-border-strong hover:bg-surface-200/60"
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-md flex items-center justify-center border border-border",
                              selectedTemplate === template.id
                                ? "bg-brand-200/40 border-brand-500/40"
                                : "bg-surface-200"
                            )}
                          >
                            <template.icon
                              className={cn(
                                "w-4 h-4",
                                selectedTemplate === template.id
                                  ? "text-brand-500"
                                  : "text-foreground-muted"
                              )}
                            />
                          </div>
                          {template.popular && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-200/70 text-brand-500">
                              <Star className="w-3 h-3 fill-brand-500" />
                              热门
                            </span>
                          )}
                        </div>
                        <h3 className="text-[13px] font-medium text-foreground mb-1 group-hover:text-foreground-light transition-colors">
                          {template.name}
                        </h3>
                        <p className="text-xs text-foreground-muted">
                          {template.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-foreground-muted">
                          <span className="rounded-md border border-border bg-surface-200/60 px-2 py-0.5">
                            分类：{template.category}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="page-panel">
                <div className="page-panel-header space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-200/40 border border-brand-500/30 text-xs text-brand-500 font-medium">
                    <Sparkles className="h-4 w-4" />
                    步骤 2/2
                  </div>
                  <div>
                    <h2 className="text-section-title text-foreground">配置工作流</h2>
                    <p className="text-description">
                      为您的工作流命名并选择触发方式。
                    </p>
                  </div>
                </div>

                <div className="p-6 space-y-8 max-w-2xl">
                  <div>
                    <label className="block text-[13px] font-medium text-foreground mb-2">
                      工作流名称
                    </label>
                    <Input
                      value={workflowName}
                      onChange={(e) => setWorkflowName(e.target.value)}
                      placeholder="例如：客户反馈自动处理"
                      inputSize="sm"
                      className="bg-surface-200 border-border"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-foreground mb-3">
                      选择触发方式
                    </label>
                    <div className="page-grid sm:grid-cols-2">
                      {triggers.map((trigger) => (
                        <button
                          key={trigger.id}
                          onClick={() => setSelectedTrigger(trigger.id)}
                          className={cn(
                            "page-panel flex items-start gap-3 p-4 text-left transition-supabase",
                            selectedTrigger === trigger.id
                              ? "border-brand-500/40 bg-brand-200/30"
                              : "hover:border-border-strong hover:bg-surface-200/60"
                          )}
                        >
                          <div
                            className={cn(
                              "w-9 h-9 rounded-md flex items-center justify-center shrink-0 border border-border",
                              selectedTrigger === trigger.id
                                ? "bg-brand-200/40 border-brand-500/40"
                                : "bg-surface-200"
                            )}
                          >
                            <trigger.icon
                              className={cn(
                                "w-4 h-4",
                                selectedTrigger === trigger.id
                                  ? "text-brand-500"
                                  : "text-foreground-muted"
                              )}
                            />
                          </div>
                          <div>
                            <h4 className="text-[13px] font-medium text-foreground">
                              {trigger.name}
                            </h4>
                            <p className="text-xs text-foreground-muted">
                              {trigger.description}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="page-panel p-4 flex flex-wrap items-center justify-between gap-3">
              {step > 1 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(step - 1)}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  上一步
                </Button>
              ) : (
                <Link href="/dashboard/workflows">
                  <Button variant="outline" size="sm">
                    取消
                  </Button>
                </Link>
              )}

              <Button
                onClick={handleNext}
                disabled={!canProceed || isCreating}
                size="sm"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    创建中...
                  </>
                ) : step === 1 && selectedTemplate !== "blank" ? (
                  <>
                    使用此模板
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : step === 1 ? (
                  <>
                    下一步
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    创建工作流
                    <Zap className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6 h-fit">
            {step === 1 ? (
              <>
                <div className="page-panel p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground-muted">模板概览</span>
                    <span className={cn(
                      "text-[11px] px-2 py-0.5 rounded-full border",
                      selectedTemplateData
                        ? "border-brand-500/30 bg-brand-200/40 text-brand-500"
                        : "border-border bg-surface-200/60 text-foreground-muted"
                    )}>
                      {selectedTemplateData ? "已选择" : "未选择"}
                    </span>
                  </div>
                  {selectedTemplateData ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-md border border-border bg-surface-200 flex items-center justify-center">
                          <selectedTemplateData.icon className="w-4 h-4 text-brand-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {selectedTemplateData.name}
                          </p>
                          <p className="text-xs text-foreground-muted">
                            {selectedTemplateData.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] text-foreground-muted">
                        <span className="rounded-md border border-border bg-surface-200 px-2 py-0.5">
                          分类：{selectedTemplateData.category}
                        </span>
                        {selectedTemplateData.popular && (
                          <span className="rounded-md border border-brand-500/30 bg-brand-200/40 px-2 py-0.5 text-brand-500">
                            热门模板
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed border-border bg-surface-100/60 p-3 text-xs text-foreground-muted">
                      选择模板后显示详细信息与推荐触发方式。
                    </div>
                  )}
                </div>

                <div className="page-panel p-4 space-y-3">
                  <div className="text-xs text-foreground-muted">选择建议</div>
                  <div className="space-y-2 text-xs text-foreground-muted">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-3.5 w-3.5 text-brand-500" />
                      优先选择热门模板，减少配置时间。
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-3.5 w-3.5 text-brand-500" />
                      空白模板适合自定义流程与复杂逻辑。
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="page-panel p-4 space-y-3">
                  <div className="text-xs text-foreground-muted">配置摘要</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted">工作流名称</span>
                      <span className="text-foreground">
                        {workflowName || "未命名"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted">模板</span>
                      <span className="text-foreground">
                        {selectedTemplateData?.name || "未选择"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted">触发方式</span>
                      <span className="text-foreground">
                        {selectedTriggerData?.name || "未选择"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="page-panel p-4 space-y-3">
                  <div className="text-xs text-foreground-muted">检查清单</div>
                  <div className="space-y-2">
                    {checklistItems.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className={item.ok ? "text-foreground" : "text-foreground-muted"}>
                          {item.label}
                        </span>
                        {item.ok ? (
                          <CheckCircle className="h-3.5 w-3.5 text-brand-500" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </PageContainer>
  );
}
