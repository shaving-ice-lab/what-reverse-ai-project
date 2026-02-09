"use client";

/**
 * Create New Workflow Page
 * Supabase Style: Dense layout, clear hierarchy, guided flow
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

// Trigger Types
const triggers = [
 {
 id: "manual",
 name: "Manual Trigger",
 description: "Manually click to run the workflow",
 icon: Play,
 },
 {
 id: "schedule",
 name: "Scheduled Trigger",
 description: "Automatically run at a scheduled time",
 icon: Clock,
 },
 {
 id: "webhook",
 name: "Webhook",
 description: "Trigger via HTTP request",
 icon: Webhook,
 },
 {
 id: "email",
 name: "Email Trigger",
 description: "Trigger when a specific email is received",
 icon: Mail,
 },
];

// Template Categories
const templateCategories = [
 { id: "all", name: "All" },
 { id: "popular", name: "Popular" },
 { id: "automation", name: "Automation" },
 { id: "ai", name: "AI App" },
 { id: "integration", name: "Integration" },
 { id: "data", name: "Data Processing" },
];

// Workflow Templates
const templates = [
 {
 id: "blank",
 name: "Empty Workflow",
 description: "Create your workflow from scratch",
 icon: FileText,
 category: "all",
 popular: false,
 },
 {
 id: "ai-assistant",
 name: "AI Smart Assistant",
 description: "Use AI to automatically reply and process tasks",
 icon: Bot,
 category: "ai",
 popular: true,
 },
 {
 id: "data-sync",
 name: "Data Sync",
 description: "Sync data between multiple systems",
 icon: Database,
 category: "data",
 popular: true,
 },
 {
 id: "notification",
 name: "Message Notifications",
 description: "Automatically send messages to Slack, Email, etc.",
 icon: MessageSquare,
 category: "automation",
 popular: true,
 },
 {
 id: "schedule-report",
 name: "Scheduled Report",
 description: "Periodically generate and send reports",
 icon: Calendar,
 category: "automation",
 popular: false,
 },
 {
 id: "form-handler",
 name: "Form Processing",
 description: "Automatically process form submission data",
 icon: FileText,
 category: "integration",
 popular: false,
 },
 {
 id: "crm-sync",
 name: "CRM Sync",
 description: "Bidirectional data sync with CRM systems",
 icon: Users,
 category: "integration",
 popular: false,
 },
 {
 id: "order-process",
 name: "Order Processing",
 description: "Automate the order processing flow",
 icon: ShoppingCart,
 category: "automation",
 popular: false,
 },
 {
 id: "code-review",
 name: "Code Review",
 description: "Automatically review PRs and add comments",
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

  // Filter Templates
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
 { label: "Template selected", ok: !!selectedTemplate },
 { label: "Workflow named", ok: !!workflowName },
 { label: "Trigger method selected", ok: !!selectedTrigger },
 ];

  // Create Workflow
 const handleCreate = async () => {
 setIsCreating(true);
    // Mock Create
 await new Promise((resolve) => setTimeout(resolve, 1500));
    // Navigate to Editor
 router.push("/dashboard/editor/new-workflow-id");
 };

  // Next Step
 const handleNext = () => {
 if (step === 1 && selectedTemplate) {
 if (selectedTemplate === "blank") {
 setStep(2);
 } else {
      // Use template to create directly
 handleCreate();
 }
 } else if (step === 2 && workflowName && selectedTrigger) {
 handleCreate();
 }
 };

  // Check if can proceed
 const canProceed = step === 1
 ? !!selectedTemplate
 : workflowName && selectedTrigger;

 return (
 <PageContainer fullWidth>
 <div className="border-b border-border bg-background-studio">
 <div className="mx-auto w-full max-w-[1400px] px-6 py-6">
 <PageHeader
 title="Create Workflow"
 description="Select a template, configure a trigger and automate your flow."
 eyebrow="Workflows"
 backHref="/dashboard/workflows"
 backLabel="Back to Workflows"
 badge={(
 <span className="inline-flex items-center gap-1 rounded-full border border-brand-500/30 bg-brand-200/40 px-2.5 py-0.5 text-[11px] text-brand-500">
 <Sparkles className="h-3.5 w-3.5" />
 Workflow Builder
 </span>
 )}
 actions={(
 <div className="flex items-center gap-3">
 <span className="text-xs text-foreground-muted">Step</span>
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
 Template {templates.length}
 </span>
 <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-200/60 px-2.5 py-1">
 Trigger {triggers.length}
 </span>
 <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-200/60 px-2.5 py-1">
 Step {step}/2
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
 Step 1/2
 </div>
 <div>
 <h2 className="text-section-title text-foreground">Select Template</h2>
 <p className="text-description">
 Select a template to get started quickly, or start from an empty workflow.
 </p>
 </div>
 </div>

 <div className="p-6 space-y-6">
 <div className="flex flex-wrap items-center gap-4">
 <Input
 placeholder="Search templates..."
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
 Popular
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
 Category: {template.category}
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
 Step 2/2
 </div>
 <div>
 <h2 className="text-section-title text-foreground">Configure Workflow</h2>
 <p className="text-description">
 Name your workflow and select a trigger method.
 </p>
 </div>
 </div>

 <div className="p-6 space-y-8 max-w-2xl">
 <div>
 <label className="block text-[13px] font-medium text-foreground mb-2">
 Workflow Name
 </label>
 <Input
 value={workflowName}
 onChange={(e) => setWorkflowName(e.target.value)}
 placeholder="e.g., Customer Feedback Auto-Processing"
 inputSize="sm"
 className="bg-surface-200 border-border"
 />
 </div>

 <div>
 <label className="block text-[13px] font-medium text-foreground mb-3">
 Select Trigger Method
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
 Previous
 </Button>
 ) : (
 <Link href="/dashboard/workflows">
 <Button variant="outline" size="sm">
 Cancel
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
 Create...
 </>
 ) : step === 1 && selectedTemplate !== "blank" ? (
 <>
 Use This Template
 <ArrowRight className="ml-2 h-4 w-4" />
 </>
 ) : step === 1 ? (
 <>
 Next
 <ArrowRight className="ml-2 h-4 w-4" />
 </>
 ) : (
 <>
 Create Workflow
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
 <span className="text-xs text-foreground-muted">Template Overview</span>
 <span className={cn(
 "text-[11px] px-2 py-0.5 rounded-full border",
 selectedTemplateData
 ? "border-brand-500/30 bg-brand-200/40 text-brand-500"
 : "border-border bg-surface-200/60 text-foreground-muted"
 )}>
 {selectedTemplateData ? "Selected": "Not selected"}
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
 Category: {selectedTemplateData.category}
 </span>
 {selectedTemplateData.popular && (
 <span className="rounded-md border border-brand-500/30 bg-brand-200/40 px-2 py-0.5 text-brand-500">
 Popular Template
 </span>
 )}
 </div>
 </div>
 ) : (
 <div className="rounded-md border border-dashed border-border bg-surface-100/60 p-3 text-xs text-foreground-muted">
 Select a template to see detailed info and recommended trigger methods.
 </div>
 )}
 </div>

 <div className="page-panel p-4 space-y-3">
 <div className="text-xs text-foreground-muted">Selection Tips</div>
 <div className="space-y-2 text-xs text-foreground-muted">
 <div className="flex items-start gap-2">
 <CheckCircle className="mt-0.5 h-3.5 w-3.5 text-brand-500" />
 Popular templates require less configuration time.
 </div>
 <div className="flex items-start gap-2">
 <CheckCircle className="mt-0.5 h-3.5 w-3.5 text-brand-500" />
 Empty templates are suitable for custom flows and complex logic.
 </div>
 </div>
 </div>
 </>
 ) : (
 <>
 <div className="page-panel p-4 space-y-3">
 <div className="text-xs text-foreground-muted">Configuration Summary</div>
 <div className="space-y-2 text-xs">
 <div className="flex items-center justify-between">
 <span className="text-foreground-muted">Workflow Name</span>
 <span className="text-foreground">
 {workflowName || "Not named yet"}
 </span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-foreground-muted">Template</span>
 <span className="text-foreground">
 {selectedTemplateData?.name || "Not selected"}
 </span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-foreground-muted">Trigger Method</span>
 <span className="text-foreground">
 {selectedTriggerData?.name || "Not selected"}
 </span>
 </div>
 </div>
 </div>

 <div className="page-panel p-4 space-y-3">
 <div className="text-xs text-foreground-muted">Checklist</div>
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
