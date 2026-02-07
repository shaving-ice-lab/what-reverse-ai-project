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

// TemplateTypeDefinition
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

// ExampleTemplateData
const sampleTemplates: TemplateData[] = [
 {
 id: "ai-customer-service",
 name: "SmartSupportAssistant",
 description: "Based on GPT-4 'smultipleConversationSupportSystem, SupportSentimentAnalyticsandAutoCategory",
 longDescription: "thisis1Complete'sSmartSupportResolvePlan, IntegrationmultipleConversationManage, SentimentAnalytics, Intent RecognitionandAutoTicketCategoryFeatures.Used forE-commerce, SaaS, FinanceetcmultipletypeBusinessScenario.SupportmultipleLanguage, canQuickforExistingSupportSystem.",
 author: "AgentFlow method",
 authorAvatar: "A",
 category: "AI App",
 tags: ["Support", "GPT-4", "Conversation", "NLP"],
 stars: 1234,
 downloads: 5678,
 views: 12345,
 price: "free",
 nodes: 12,
 complexity: "intermediate",
 features: [
 "multipleConversationContextManage",
 "Real-timeSentimentAnalytics",
 "SmartIntent Recognition",
 "AutoTicketCreate",
 "multipleLanguageSupport",
 "ConversationHistoryRecord",
 ],
 requirements: ["GPT-4 API Key", "DatabaseConnect"],
 version: "2.1.0",
 updatedAt: "2026-01-25",
 createdAt: "2025-06-15",
 },
 {
 id: "data-pipeline",
 name: "DataProcessPipeline",
 description: "Enterprise-grade ETL DataPipeline, SupportmultipleDataSyncandConvert",
 longDescription: "canDataProcessPipeline, SupportfrommultipletypeData(MySQL, PostgreSQL, MongoDB, API)ExtractData, ProceedClean, ConvertandLoad.inDataCheckandErrorProcessMechanism.",
 author: "DataMaster",
 authorAvatar: "D",
 category: "DataProcess",
 tags: ["ETL", "DataSync", "Pipeline"],
 stars: 856,
 downloads: 3421,
 views: 8765,
 price: 29,
 nodes: 18,
 complexity: "advanced",
 features: [
 "multipleDataSupport",
 "Sync",
 "DataCheck",
 "ErrorAutoRetry",
 "Real-timeMonitor",
 "ScheduleManage",
 ],
 requirements: ["DatabaseConnect", "API AccessPermission"],
 version: "1.5.2",
 updatedAt: "2026-01-20",
 createdAt: "2025-09-01",
 },
];

export interface TemplatePreviewModalProps {
 /** TemplateData */
 template: TemplateData | null;
 /** isnoOpen */
 isOpen: boolean;
 /** CloseCallback */
 onClose: () => void;
 /** UsageTemplateCallback */
 onUseTemplate?: (template: TemplateData) => void;
 /** FavoriteCallback */
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

 // BlockBackgroundScroll
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

 // ESC Close
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
 return "Getting Started";
 case "intermediate":
 return "";
 case "advanced":
 return "Advanced";
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
 {tab === "overview" && "Overview"}
 {tab === "preview" && "Preview"}
 {tab === "code" && "Code"}
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
 <h3 className="text-sm font-medium text-foreground mb-2">Description</h3>
 <p className="text-muted-foreground leading-relaxed">
 {template.longDescription || template.description}
 </p>
 </div>

 {/* Features */}
 <div>
 <h3 className="text-sm font-medium text-foreground mb-3">FeaturesFeature</h3>
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
 <h3 className="text-sm font-medium text-foreground mb-3">Usageneed</h3>
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
 <h3 className="text-sm font-medium text-foreground mb-3">Tags</h3>
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
 <p className="text-xs text-muted-foreground">Favorite</p>
 </div>
 <div className="text-center">
 <div className="flex items-center justify-center gap-1 text-lg font-bold text-foreground">
 <Download className="w-4 h-4 text-primary" />
 {template.downloads.toLocaleString()}
 </div>
 <p className="text-xs text-muted-foreground">Download</p>
 </div>
 <div className="text-center">
 <div className="flex items-center justify-center gap-1 text-lg font-bold text-foreground">
 <Eye className="w-4 h-4 text-blue-500" />
 {template.views.toLocaleString()}
 </div>
 <p className="text-xs text-muted-foreground">Browse</p>
 </div>
 </div>

 <div className="space-y-3 pt-4 border-t border-border">
 <div className="flex items-center justify-between text-sm">
 <span className="text-muted-foreground">Category</span>
 <span className="text-foreground">{template.category}</span>
 </div>
 <div className="flex items-center justify-between text-sm">
 <span className="text-muted-foreground">Nodecount</span>
 <span className="text-foreground">{template.nodes} </span>
 </div>
 <div className="flex items-center justify-between text-sm">
 <span className="text-muted-foreground">Difficulty</span>
 <span className={cn(
 "px-2 py-0.5 rounded text-xs font-medium",
 getComplexityColor(template.complexity)
 )}>
 {getComplexityLabel(template.complexity)}
 </span>
 </div>
 <div className="flex items-center justify-between text-sm">
 <span className="text-muted-foreground">Updated At</span>
 <span className="text-foreground">{template.updatedAt}</span>
 </div>
 </div>
 </div>

 {/* Template ID */}
 <div className="p-4 rounded-xl bg-muted/50 border border-border">
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs text-muted-foreground">Template ID</span>
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
 <p className="text-muted-foreground mb-4">WorkflowPreview</p>
 <Button
 variant="outline"
 className="rounded-xl"
 onClick={() => onUseTemplate?.(template)}
 >
 <Play className="w-4 h-4 mr-2" />
 atEditOpen
 </Button>
 </div>
 </div>

 {/* Node List */}
 <div className="grid sm:grid-cols-3 gap-3">
 {["Trigger", "LLM Process", "ConditionBranch", "DataConvert", "API Call", "Output"].slice(0, template.nodes > 6 ? 6: template.nodes).map((node, i) => (
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
 <span className="text-lg font-bold text-primary">Free</span>
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
 Details
 </Button>
 <Button
 className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
 onClick={() => onUseTemplate?.(template)}
 >
 {template.price === "free" ? "NowUsage": "PurchaseUsage"}
 <ArrowRight className="w-4 h-4 ml-2" />
 </Button>
 </div>
 </div>
 </div>
 </div>
 );
}

// ExportExampleTemplateDataoutsidesectionUsage
export { sampleTemplates };
