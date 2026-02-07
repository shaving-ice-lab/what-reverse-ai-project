"use client";

/**
 * Createnew Agent Page
 * Supabase Style: Minimal, Professional, WizardCreate
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
 Bot,
 ArrowLeft,
 ArrowRight,
 Check,
 Sparkles,
 MessageSquare,
 Code,
 Zap,
 Shield,
 Settings,
 Eye,
 Save,
 Play,
 Upload,
 Image as ImageIcon,
 Trash2,
 Plus,
 AlertCircle,
 HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// CreateStep
const steps = [
 { id: 1, title: "Basic Info", description: "Settings Agent NameandDescription" },
 { id: 2, title: "canpowerConfig", description: "Select Agent 'sCorecanpower" },
 { id: 3, title: "ModelSettings", description: "Config AI ModelParameter" },
 { id: 4, title: "TestPreview", description: "TestConcurrency Agent" },
];

// Agent Template
const agentTemplates = [
 {
 id: "assistant",
 name: "useAssistant",
 description: "multipleFeatures AI Assistant, canProcesstypeTask",
 icon: Bot,
 capabilities: ["Conversation", "TextGenerate", "Q&A"],
 },
 {
 id: "coder",
 name: "ProgrammingAssistant",
 description: "FocusatCodeWriteandTechnologyIssue",
 icon: Code,
 capabilities: ["CodeGenerate", "CodeReview", "TechnologyQ&A"],
 },
 {
 id: "writer",
 name: "WritingAssistant",
 description: "Professional'sContentCreativeandCopyWrite",
 icon: Sparkles,
 capabilities: ["ArticleWriting", "CopyCreative", "Contentoptimal"],
 },
 {
 id: "analyst",
 name: "DataAnalytics",
 description: "DataAnalyticsandReportGenerate",
 icon: Zap,
 capabilities: ["DataAnalytics", "ReportGenerate", "InsightsExtract"],
 },
 {
 id: "custom",
 name: "Custom Agent",
 description: "fromStartCreateyou'sExclusive Agent",
 icon: Settings,
 capabilities: ["completeallCustom"],
 },
];

// AI ModelOption
const aiModels = [
 {
 id: "gpt-4",
 name: "GPT-4",
 provider: "OpenAI",
 description: "Bestlarge'sModel, SuitableComplexTask",
 speed: "etc",
 quality: "most",
 },
 {
 id: "gpt-3.5-turbo",
 name: "GPT-3.5 Turbo",
 provider: "OpenAI",
 description: "QuickandEconomy, SuitablelargemultiplecountTask",
 speed: "Quick",
 quality: "",
 },
 {
 id: "claude-3",
 name: "Claude 3",
 provider: "Anthropic",
 description: "TextandAnalyticsTask",
 speed: "etc",
 quality: "optimal",
 },
 {
 id: "qwen",
 name: "Tongyi1000",
 provider: "in",
 description: "Understandcanpower",
 speed: "Quick",
 quality: "optimal",
 },
];

// canpowerOption
const capabilities = [
 { id: "chat", name: "Conversation", icon: MessageSquare, description: "NaturalLanguageConversation" },
 { id: "code", name: "Code", icon: Code, description: "CodeGenerateandAnalytics" },
 { id: "write", name: "Writing", icon: Sparkles, description: "ContentCreative" },
 { id: "analyze", name: "Analytics", icon: Zap, description: "DataAnalytics" },
 { id: "search", name: "Search", icon: Eye, description: "NetworkSearch" },
];

export default function NewAgentPage() {
 const router = useRouter();
 const [currentStep, setCurrentStep] = useState(1);
 const [isCreating, setIsCreating] = useState(false);

 // FormStatus
 const [formData, setFormData] = useState({
 name: "",
 description: "",
 template: "",
 avatar: "",
 model: "gpt-3.5-turbo",
 capabilities: [] as string[],
 systemPrompt: "",
 temperature: 0.7,
 maxTokens: 2048,
 welcomeMessage: "you!Iisyou's AI Assistant, hasWhatcanwithHelpyou's?",
 });

 // TestConversation
 const [testMessages, setTestMessages] = useState<{ role: string; content: string }[]>([]);
 const [testInput, setTestInput] = useState("");
 const [isTesting, setIsTesting] = useState(false);

 // UpdateForm
 const updateForm = (field: string, value: any) => {
 setFormData((prev) => ({ ...prev, [field]: value }));
 };

 // Switchcanpower
 const toggleCapability = (id: string) => {
 setFormData((prev) => ({
 ...prev,
 capabilities: prev.capabilities.includes(id)
 ? prev.capabilities.filter((c) => c !== id)
 : [...prev.capabilities, id],
 }));
 };

 // SelectTemplate
 const selectTemplate = (templateId: string) => {
 const template = agentTemplates.find((t) => t.id === templateId);
 if (template) {
 updateForm("template", templateId);
 if (templateId !== "custom") {
 updateForm("name", template.name);
 updateForm("description", template.description);
 }
 }
 };

 // Next
 const nextStep = () => {
 if (currentStep < steps.length) {
 setCurrentStep(currentStep + 1);
 }
 };

 // Previous
 const prevStep = () => {
 if (currentStep > 1) {
 setCurrentStep(currentStep - 1);
 }
 };

 // SendTestMessage
 const sendTestMessage = async () => {
 if (!testInput.trim()) return;

 const userMessage = { role: "user", content: testInput };
 setTestMessages((prev) => [...prev, userMessage]);
 setTestInput("");
 setIsTesting(true);

 // Mock AI Reply
 await new Promise((resolve) => setTimeout(resolve, 1000));
 
 const aiMessage = {
 role: "assistant",
 content: `thisis ${formData.name || "AI Assistant"} 'sTestReply.Itoyou'sMessage: "${testInput}".atcurrentlyPublishafter, IwillUsage ${formData.model} ModelcomeGeneratemoreSmart'sReply.`,
 };
 setTestMessages((prev) => [...prev, aiMessage]);
 setIsTesting(false);
 };

 // Create Agent
 const createAgent = async () => {
 setIsCreating(true);
 
 // MockCreatepast
 await new Promise((resolve) => setTimeout(resolve, 2000));
 
 // Navigateto Agent List
 router.push("/dashboard/my-agents");
 };

 // VerifyCurrentStep
 const isStepValid = () => {
 switch (currentStep) {
 case 1:
 return formData.name.trim() !== "" && formData.template !== "";
 case 2:
 return formData.capabilities.length > 0;
 case 3:
 return formData.model !== "";
 case 4:
 return true;
 default:
 return false;
 }
 };

 return (
 <div className="min-h-full bg-background-studio">
 {/* Header */}
 <header className="sticky top-0 z-40 bg-background-studio/95 backdrop-blur border-b border-border">
 <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
 <div className="flex items-center gap-4">
 <Link
 href="/dashboard/my-agents"
 className="flex items-center gap-2 text-[13px] text-foreground-light hover:text-foreground transition-colors"
 >
 <ArrowLeft className="w-4 h-4" />
 Back
 </Link>
 <div className="h-5 w-px bg-border-muted" />
 <div>
 <p className="page-caption">Agents</p>
 <h1 className="text-page-title text-foreground">Createnew Agent</h1>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={() => router.push("/dashboard/my-agents")}
 className="border-border text-foreground-light"
 >
 Cancel
 </Button>
 {currentStep === steps.length ? (
 <Button
 size="sm"
 className="bg-brand-500 hover:bg-brand-600 text-background"
 onClick={createAgent}
 disabled={isCreating}
 >
 {isCreating ? (
 <>Create...</>
 ) : (
 <>
 <Save className="w-4 h-4 mr-2" />
 Create Agent
 </>
 )}
 </Button>
 ) : (
 <Button
 size="sm"
 className="bg-brand-500 hover:bg-brand-600 text-background"
 onClick={nextStep}
 disabled={!isStepValid()}
 >
 Next
 <ArrowRight className="w-4 h-4 ml-2" />
 </Button>
 )}
 </div>
 </div>
 </header>

 {/* Progress Steps */}
 <div className="border-b border-border bg-surface-75/80">
 <div className="max-w-6xl mx-auto px-6 py-4">
 <div className="flex items-center justify-between">
 {steps.map((step, index) => (
 <div key={step.id} className="flex items-center">
 <div className="flex items-center gap-3">
 <div
 className={cn(
 "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium",
 currentStep > step.id
 ? "bg-brand-500 text-background"
 : currentStep === step.id
 ? "bg-brand-500 text-background"
 : "bg-surface-200 text-foreground-muted"
 )}
 >
 {currentStep > step.id ? (
 <Check className="w-4 h-4" />
 ) : (
 step.id
 )}
 </div>
 <div className="hidden sm:block">
 <div className={cn(
 "text-[13px] font-medium",
 currentStep >= step.id ? "text-foreground" : "text-foreground-muted"
 )}>
 {step.title}
 </div>
 <div className="text-xs text-foreground-muted">
 {step.description}
 </div>
 </div>
 </div>
 {index < steps.length - 1 && (
 <div className={cn(
 "w-12 sm:w-24 h-0.5 mx-4",
 currentStep > step.id ? "bg-brand-500" : "bg-border-muted"
 )} />
 )}
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Content */}
 <div className="max-w-6xl mx-auto px-6 py-8">
 {/* Step 1: Basic Info */}
 {currentStep === 1 && (
 <div className="space-y-8">
 <div>
 <h2 className="text-lg font-semibold text-foreground mb-2">
 Select Agent Template
 </h2>
 <p className="text-[13px] text-foreground-light">
 Select1TemplateQuickStart, orfromCreateCustom Agent
 </p>
 </div>

 <div className="page-grid sm:grid-cols-2 lg:grid-cols-3">
 {agentTemplates.map((template) => (
 <button
 key={template.id}
 onClick={() => selectTemplate(template.id)}
 className={cn(
 "p-5 rounded-md text-left transition-supabase",
 formData.template === template.id
 ? "bg-brand-200 border-2 border-brand-500"
 : "bg-surface-100 border border-border hover:border-border-strong"
 )}
 >
 <template.icon className={cn(
 "w-6 h-6 mb-3",
 formData.template === template.id ? "text-brand-500" : "text-foreground-muted"
 )} />
 <h3 className="text-[13px] font-semibold text-foreground mb-1">
 {template.name}
 </h3>
 <p className="text-xs text-foreground-muted mb-3">
 {template.description}
 </p>
 <div className="flex flex-wrap gap-1">
 {template.capabilities.map((cap) => (
 <span
 key={cap}
 className="px-2 py-0.5 rounded-md bg-surface-200 text-xs text-foreground-muted"
 >
 {cap}
 </span>
 ))}
 </div>
 </button>
 ))}
 </div>

 {formData.template && (
 <div className="space-y-6 pt-6 border-t border-border">
 <h3 className="text-sm font-medium text-foreground">Basic Info</h3>
 
 <div className="page-grid sm:grid-cols-2">
 <div>
 <label className="block text-[13px] font-medium text-foreground mb-2">
 Agent Name *
 </label>
 <Input
 value={formData.name}
 onChange={(e) => updateForm("name", e.target.value)}
 placeholder="toyou's Agent char"
 className="h-9 bg-surface-200 border-border"
 />
 </div>
 
 <div>
 <label className="block text-[13px] font-medium text-foreground mb-2">
 Avatar
 </label>
 <div className="flex items-center gap-4">
 <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center">
 {formData.avatar ? (
 <img
 src={formData.avatar}
 alt=""
 className="w-full h-full rounded-md object-cover"
 />
 ) : (
 <Bot className="w-5 h-5 text-foreground-muted" />
 )}
 </div>
 <Button variant="outline" size="sm" className="border-border text-foreground-light">
 <Upload className="w-4 h-4 mr-2" />
 UploadImage
 </Button>
 </div>
 </div>
 </div>

 <div>
 <label className="block text-[13px] font-medium text-foreground mb-2">
 Description
 </label>
 <textarea
 value={formData.description}
 onChange={(e) => updateForm("description", e.target.value)}
 placeholder="Descriptionthis Agent 'sFeaturesanduse..."
 rows={3}
 className="w-full px-4 py-3 rounded-md bg-surface-200 border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none text-[13px]"
 />
 </div>
 </div>
 )}
 </div>
 )}

 {/* Step 2: canpowerConfig */}
 {currentStep === 2 && (
 <div className="space-y-8">
 <div>
 <h2 className="text-lg font-semibold text-foreground mb-2">
 Config Agent canpower
 </h2>
 <p className="text-[13px] text-foreground-light">
 SelectyouHope Agent 'sCorecanpower
 </p>
 </div>

 <div className="page-grid sm:grid-cols-2 lg:grid-cols-3">
 {capabilities.map((cap) => (
 <button
 key={cap.id}
 onClick={() => toggleCapability(cap.id)}
 className={cn(
 "p-5 rounded-md text-left transition-supabase",
 formData.capabilities.includes(cap.id)
 ? "bg-brand-200 border-2 border-brand-500"
 : "bg-surface-100 border border-border hover:border-border-strong"
 )}
 >
 <cap.icon className={cn(
 "w-5 h-5 mb-3",
 formData.capabilities.includes(cap.id) ? "text-brand-500" : "text-foreground-muted"
 )} />
 <h3 className="text-[13px] font-semibold text-foreground mb-1">
 {cap.name}
 </h3>
 <p className="text-xs text-foreground-muted">
 {cap.description}
 </p>
 </button>
 ))}
 </div>

 <div className="space-y-4 pt-6 border-t border-border">
 <h3 className="text-sm font-medium text-foreground">System Prompt</h3>
 <p className="text-xs text-foreground-muted">
 Definition Agent 'sRole, rowasandReplyStyle
 </p>
 <textarea
 value={formData.systemPrompt}
 onChange={(e) => updateForm("systemPrompt", e.target.value)}
 placeholder="youis1Professional's AI Assistant..."
 rows={6}
 className="w-full px-4 py-3 rounded-md bg-surface-200 border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none font-mono text-[13px]"
 />
 </div>

 <div className="space-y-4">
 <h3 className="text-sm font-medium text-foreground">WelcomeMessage</h3>
 <Input
 value={formData.welcomeMessage}
 onChange={(e) => updateForm("welcomeMessage", e.target.value)}
 placeholder="Agent StartConversationtime'sWelcomeMessage..."
 className="h-9 bg-surface-200 border-border"
 />
 </div>
 </div>
 )}

 {/* Step 3: ModelSettings */}
 {currentStep === 3 && (
 <div className="space-y-8">
 <div>
 <h2 className="text-lg font-semibold text-foreground mb-2">
 Select AI Model
 </h2>
 <p className="text-[13px] text-foreground-light">
 SelectmostSuitableyouRequirements's AI Model
 </p>
 </div>

 <div className="page-grid sm:grid-cols-2">
 {aiModels.map((model) => (
 <button
 key={model.id}
 onClick={() => updateForm("model", model.id)}
 className={cn(
 "p-5 rounded-md text-left transition-supabase",
 formData.model === model.id
 ? "bg-brand-200 border-2 border-brand-500"
 : "bg-surface-100 border border-border hover:border-border-strong"
 )}
 >
 <div className="flex items-center justify-between mb-3">
 <h3 className="text-[13px] font-semibold text-foreground">
 {model.name}
 </h3>
 <span className="text-xs text-foreground-muted px-2 py-0.5 rounded-md bg-surface-200">
 {model.provider}
 </span>
 </div>
 <p className="text-xs text-foreground-muted mb-3">
 {model.description}
 </p>
 <div className="flex gap-4 text-xs">
 <span className="text-foreground-muted">
 Speed: <span className="text-foreground">{model.speed}</span>
 </span>
 <span className="text-foreground-muted">
 : <span className="text-foreground">{model.quality}</span>
 </span>
 </div>
 </button>
 ))}
 </div>

 <div className="space-y-6 pt-6 border-t border-border">
 <h3 className="text-sm font-medium text-foreground">Advanced Settings</h3>
 
 <div className="page-grid sm:grid-cols-2">
 <div>
 <label className="block text-[13px] font-medium text-foreground mb-2">
 Temperature (Temperature)
 <span className="ml-2 text-foreground-muted font-normal">
 {formData.temperature}
 </span>
 </label>
 <input
 type="range"
 min="0"
 max="2"
 step="0.1"
 value={formData.temperature}
 onChange={(e) => updateForm("temperature", parseFloat(e.target.value))}
 className="w-full"
 />
 <div className="flex justify-between text-xs text-foreground-muted mt-1">
 <span>Precise</span>
 <span>Creative</span>
 </div>
 </div>

 <div>
 <label className="block text-[13px] font-medium text-foreground mb-2">
 Maximum Token count
 </label>
 <Input
 type="number"
 value={formData.maxTokens}
 onChange={(e) => updateForm("maxTokens", parseInt(e.target.value))}
 min={256}
 max={8192}
 className="h-9 bg-surface-200 border-border"
 />
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Step 4: TestPreview */}
 {currentStep === 4 && (
 <div className="space-y-8">
 <div>
 <h2 className="text-lg font-semibold text-foreground mb-2">
 Testyou's Agent
 </h2>
 <p className="text-[13px] text-foreground-light">
 atPublishbeforeTest Agent 'sConversationEffect
 </p>
 </div>

 <div className="page-grid lg:grid-cols-2">
 {/* ConfigSummary */}
 <div className="p-5 rounded-md bg-surface-100 border border-border">
 <h3 className="text-sm font-medium text-foreground mb-4">ConfigSummary</h3>
 
 <div className="space-y-4">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-md bg-brand-200 flex items-center justify-center">
 <Bot className="w-5 h-5 text-brand-500" />
 </div>
 <div>
 <div className="text-[13px] font-medium text-foreground">
 {formData.name || "not yetNaming Agent"}
 </div>
 <div className="text-xs text-foreground-muted">
 {formData.description || "NoneDescription"}
 </div>
 </div>
 </div>

 <div className="pt-4 border-t border-border space-y-3">
 <div className="flex justify-between text-xs">
 <span className="text-foreground-muted">Model</span>
 <span className="text-foreground">
 {aiModels.find((m) => m.id === formData.model)?.name}
 </span>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-foreground-muted">canpower</span>
 <span className="text-foreground">
 {formData.capabilities.length} 
 </span>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-foreground-muted">Temperature</span>
 <span className="text-foreground">{formData.temperature}</span>
 </div>
 </div>
 </div>
 </div>

 {/* TestConversation */}
 <div className="flex flex-col rounded-md bg-surface-100 border border-border overflow-hidden">
 <div className="p-4 border-b border-border bg-surface-75">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-md bg-brand-200 flex items-center justify-center">
 <Bot className="w-4 h-4 text-brand-500" />
 </div>
 <div>
 <div className="text-[13px] font-medium text-foreground">
 {formData.name || "AI Agent"}
 </div>
 <div className="text-xs text-foreground-muted">TestConversation</div>
 </div>
 </div>
 </div>

 <div className="flex-1 p-4 space-y-4 min-h-[300px] max-h-[400px] overflow-y-auto">
 {/* WelcomeMessage */}
 <div className="flex gap-3">
 <div className="w-8 h-8 rounded-md bg-brand-200 flex items-center justify-center shrink-0">
 <Bot className="w-4 h-4 text-brand-500" />
 </div>
 <div className="px-4 py-2 rounded-md bg-surface-200 text-xs text-foreground max-w-[80%]">
 {formData.welcomeMessage}
 </div>
 </div>

 {/* ConversationMessage */}
 {testMessages.map((msg, index) => (
 <div
 key={index}
 className={cn(
 "flex gap-3",
 msg.role === "user" && "justify-end"
 )}
 >
 {msg.role === "assistant" && (
 <div className="w-8 h-8 rounded-md bg-brand-200 flex items-center justify-center shrink-0">
 <Bot className="w-4 h-4 text-brand-500" />
 </div>
 )}
 <div
 className={cn(
 "px-4 py-2 rounded-md text-xs max-w-[80%]",
 msg.role === "user"
 ? "bg-brand-500 text-background"
 : "bg-surface-200 text-foreground"
 )}
 >
 {msg.content}
 </div>
 </div>
 ))}

 {isTesting && (
 <div className="flex gap-3">
 <div className="w-8 h-8 rounded-md bg-brand-200 flex items-center justify-center shrink-0">
 <Bot className="w-4 h-4 text-brand-500" />
 </div>
 <div className="px-4 py-2 rounded-md bg-surface-200 text-xs text-foreground-muted">
 currentlyatThink...
 </div>
 </div>
 )}
 </div>

 <div className="p-4 border-t border-border">
 <div className="flex gap-2">
 <Input
 value={testInput}
 onChange={(e) => setTestInput(e.target.value)}
 placeholder="InputTestMessage..."
 className="h-9 bg-surface-200 border-border"
 onKeyDown={(e) => e.key === "Enter" && sendTestMessage()}
 />
 <Button
 onClick={sendTestMessage}
 disabled={!testInput.trim() || isTesting}
 className="bg-brand-500 hover:bg-brand-600 text-background"
 >
 <Play className="w-4 h-4" />
 </Button>
 </div>
 </div>
 </div>
 </div>

 {/* Tip */}
 <div className="p-4 rounded-md bg-brand-200 border border-brand-400">
 <div className="flex items-start gap-3">
 <AlertCircle className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
 <div>
 <h4 className="text-[13px] font-medium text-foreground mb-1">Ready to Publish</h4>
 <p className="text-xs text-foreground-light">
 Once configuration is complete, click the &quot;Create Agent&quot; button to publish. You can edit the configuration in Settings after publishing.
 </p>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Navigation Buttons */}
 <div className="flex items-center justify-between mt-8 pt-8 border-t border-border">
 <Button
 variant="outline"
 onClick={prevStep}
 disabled={currentStep === 1}
 className="border-border text-foreground-light"
 >
 <ArrowLeft className="w-4 h-4 mr-2" />
 Previous
 </Button>

 <div className="text-xs text-foreground-muted">
 Step {currentStep} / {steps.length}
 </div>

 {currentStep === steps.length ? (
 <Button
 className="bg-brand-500 hover:bg-brand-600 text-background"
 onClick={createAgent}
 disabled={isCreating}
 >
 {isCreating ? "Create...": "Create Agent"}
 </Button>
 ) : (
 <Button
 className="bg-brand-500 hover:bg-brand-600 text-background"
 onClick={nextStep}
 disabled={!isStepValid()}
 >
 Next
 <ArrowRight className="w-4 h-4 ml-2" />
 </Button>
 )}
 </div>
 </div>
 </div>
 );
}
