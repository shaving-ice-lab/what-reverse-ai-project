"use client";

/**
 * AI WritingAssistantPanel
 * Used forCreativeContentGenerate, ProvideSmartWritingSuggestionandEnhancedFeatures
 */

import { useState, useEffect, useRef } from "react";
import {
 Sparkles,
 Wand2,
 RefreshCw,
 Copy,
 Check,
 ChevronDown,
 ChevronUp,
 Lightbulb,
 MessageSquare,
 Zap,
 FileText,
 PenTool,
 Globe,
 Target,
 TrendingUp,
 Languages,
 MoreHorizontal,
 Loader2,
 ThumbsUp,
 ThumbsDown,
 ArrowRight,
 Settings,
 Mic,
 Type,
 List,
 AlignLeft,
 Hash,
 AtSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
 DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";

// WritingStyle
const writingStyles = [
 { id: "professional", label: "Professionalcurrently", icon: FileText },
 { id: "casual", label: "Easy", icon: MessageSquare },
 { id: "creative", label: "Creative", icon: Sparkles },
 { id: "persuasive", label: "power", icon: Target },
 { id: "informative", label: "InfoRich", icon: Lightbulb },
];

// ContentType
const contentTypes = [
 { id: "article", label: "Article", icon: FileText },
 { id: "marketing", label: "Marketing Copy", icon: TrendingUp },
 { id: "social", label: "Social Media", icon: Globe },
 { id: "email", label: "Email", icon: AtSign },
 { id: "blog", label: "Blog", icon: PenTool },
];

// Quick Actions
const quickActions = [
 { id: "expand", label: "ExtendContent", icon: ArrowRight, description: "letContentmoreDetailedRich" },
 { id: "summarize", label: "StreamlineSummary", icon: List, description: "Coreneed" },
 { id: "rewrite", label: "optimal", icon: RefreshCw, description: "1typemethod" },
 { id: "translate", label: "TranslateConvert", icon: Languages, description: "TranslateotherheLanguage" },
 { id: "tone", label: "AdjustTone", icon: Type, description: "ChangeWritingStyle" },
 { id: "grammar", label: "SyntaxCheck", icon: Check, description: "currentlySyntaxError" },
];

// AI Suggestion
const aiSuggestions = [
 "Add1personenter'shead",
 "JoinDataorCase StudiescomeSupport",
 "Usagemore's",
 "Adduse",
 "optimalParagraphpast",
];

interface AIWritingPanelProps {
 content: string;
 onContentChange: (content: string) => void;
 onGenerate?: (prompt: string) => Promise<string>;
 className?: string;
}

export function AIWritingPanel({
 content,
 onContentChange,
 onGenerate,
 className,
}: AIWritingPanelProps) {
 const [isGenerating, setIsGenerating] = useState(false);
 const [selectedStyle, setSelectedStyle] = useState("professional");
 const [selectedType, setSelectedType] = useState("article");
 const [prompt, setPrompt] = useState("");
 const [showSuggestions, setShowSuggestions] = useState(true);
 const [generatedVariants, setGeneratedVariants] = useState<string[]>([]);
 const [activeVariant, setActiveVariant] = useState(0);
 const [copied, setCopied] = useState(false);
 const textareaRef = useRef<HTMLTextAreaElement>(null);

 // CopyContent
 const handleCopy = () => {
 navigator.clipboard.writeText(content);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 };

 // ExecuteQuick Actions
 const handleQuickAction = async (actionId: string) => {
 if (!content.trim()) return;
 
 setIsGenerating(true);
 
 // Mock AI Process
 await new Promise((resolve) => setTimeout(resolve, 1500));
 
 let newContent = content;
 
 switch (actionId) {
 case "expand":
 newContent = `${content}\n\nthisoutside, value1'sis, this1stillcanwithfromwithdownmethodfaceProceedenterDiscuss: \n\n1. first, fromfacecomesee...\n2. othertimes, PracticeCase StudiesAnalytics...\n3. mostafter, not yetcomeDevelopmentTrend...`;
 break;
 case "summarize":
 newContent = `Coreneed: \n• ${content.slice(0, 100)}...\n• mainneed: ContentalreadyStreamline\n• key: PleaseView`;
 break;
 case "rewrite":
 newContent = `pastoptimal'sVersion: \n\n${content.replace(/./g, '!').replace(/, /g, ', ')}`;
 break;
 default:
 break;
 }
 
 onContentChange(newContent);
 setIsGenerating(false);
 };

 // GenerateContent
 const handleGenerate = async () => {
 if (!prompt.trim()) return;
 
 setIsGenerating(true);
 
 // MockGenerate
 await new Promise((resolve) => setTimeout(resolve, 2000));
 
 const generatedContent = `Based onyou'sneed"${prompt}", withdownisGenerate's${contentTypes.find(t => t.id === selectedType)?.label}Content: \n\n${selectedStyle === 'professional' ? ''sreaduser, \n\n': '!\n\n'}thisis1 AI Generate'sExampleContent.atActualUsage, thisinwillBased onyou'sSpecificRequirementsGenerateshould'sContent.\n\n${selectedStyle === 'professional' ? 'WeHopewithonContentcanSatisfyyou'sRequirements.': 'HopeforyouhasHelp!'}`;
 
 onContentChange(generatedContent);
 setPrompt("");
 setIsGenerating(false);
 };

 // AppSuggestion
 const handleApplySuggestion = (suggestion: string) => {
 setPrompt(suggestion);
 };

 return (
 <div className={cn("flex flex-col h-full", className)}>
 {/* Toolbar */}
 <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50">
 {/* ContentType */}
 <Select value={selectedType} onValueChange={setSelectedType}>
 <SelectTrigger className="w-[120px] h-9">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {contentTypes.map((type) => (
 <SelectItem key={type.id} value={type.id}>
 <span className="flex items-center gap-2">
 <type.icon className="w-4 h-4" />
 {type.label}
 </span>
 </SelectItem>
 ))}
 </SelectContent>
 </Select>

 {/* WritingStyle */}
 <Select value={selectedStyle} onValueChange={setSelectedStyle}>
 <SelectTrigger className="w-[120px] h-9">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {writingStyles.map((style) => (
 <SelectItem key={style.id} value={style.id}>
 <span className="flex items-center gap-2">
 <style.icon className="w-4 h-4" />
 {style.label}
 </span>
 </SelectItem>
 ))}
 </SelectContent>
 </Select>

 <div className="flex-1" />

 {/* Quick Actions */}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button variant="outline" size="sm" className="gap-2">
 <Wand2 className="w-4 h-4" />
 AI Action
 <ChevronDown className="w-3 h-3" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-56">
 {quickActions.map((action) => (
 <DropdownMenuItem
 key={action.id}
 onClick={() => handleQuickAction(action.id)}
 disabled={!content.trim() || isGenerating}
 >
 <action.icon className="w-4 h-4 mr-2" />
 <div className="flex-1">
 <p className="font-medium">{action.label}</p>
 <p className="text-xs text-foreground-light">{action.description}</p>
 </div>
 </DropdownMenuItem>
 ))}
 </DropdownMenuContent>
 </DropdownMenu>

 <Button
 variant="outline"
 size="sm"
 onClick={handleCopy}
 disabled={!content.trim()}
 >
 {copied ? (
 <>
 <Check className="w-4 h-4 mr-2" />
 alreadyCopy
 </>
 ) : (
 <>
 <Copy className="w-4 h-4 mr-2" />
 Copy
 </>
 )}
 </Button>
 </div>

 {/* ContentEdit */}
 <div className="flex-1 p-4 overflow-auto">
 <Textarea
 ref={textareaRef}
 value={content}
 onChange={(e) => onContentChange(e.target.value)}
 placeholder="atthisinInputorGenerateContent..."
 className="min-h-[300px] resize-none border-none focus-visible:ring-0 text-base leading-relaxed"
 />
 </div>

 {/* AI GeneratePanel */}
 <div className="border-t border-border bg-card/50 p-4 space-y-4">
 {/* AI Suggestion */}
 {showSuggestions && (
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-xs font-medium text-foreground-light flex items-center gap-1">
 <Lightbulb className="w-3 h-3" />
 AI Suggestion
 </span>
 <button
 onClick={() => setShowSuggestions(false)}
 className="text-xs text-foreground-light hover:text-foreground"
 >
 Hide
 </button>
 </div>
 <div className="flex flex-wrap gap-2">
 {aiSuggestions.map((suggestion, index) => (
 <button
 key={index}
 onClick={() => handleApplySuggestion(suggestion)}
 className="px-3 py-1.5 rounded-full bg-surface-200 text-xs text-foreground-light hover:bg-primary/10 hover:text-primary transition-colors"
 >
 {suggestion}
 </button>
 ))}
 </div>
 </div>
 )}

 {/* GenerateInput */}
 <div className="flex items-end gap-3">
 <div className="flex-1">
 <Textarea
 value={prompt}
 onChange={(e) => setPrompt(e.target.value)}
 placeholder="DescriptionyouwantneedGenerate'sContent..."
 className="min-h-[80px] resize-none"
 />
 </div>
 <Button
 onClick={handleGenerate}
 disabled={!prompt.trim() || isGenerating}
 className="h-10 px-6 bg-primary hover:bg-primary/90"
 >
 {isGenerating ? (
 <>
 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
 Generating...
 </>
 ) : (
 <>
 <Sparkles className="w-4 h-4 mr-2" />
 Generate
 </>
 )}
 </Button>
 </div>

 {/* ShortcutTip */}
 <div className="flex items-center justify-between text-xs text-foreground-light">
 <span>Tip: Usage Cmd+Enter QuickGenerate</span>
 <span>Token Usage: 0 / 4,000</span>
 </div>
 </div>
 </div>
 );
}

// WritingSuggestionCard
interface WritingSuggestionCardProps {
 title: string;
 description: string;
 icon: React.ComponentType<{ className?: string }>;
 onClick: () => void;
}

export function WritingSuggestionCard({
 title,
 description,
 icon: Icon,
 onClick,
}: WritingSuggestionCardProps) {
 return (
 <button
 onClick={onClick}
 className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all text-left group"
 >
 <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
 <Icon className="w-5 h-5 text-primary" />
 </div>
 <div>
 <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
 {title}
 </h4>
 <p className="text-sm text-foreground-light mt-1">{description}</p>
 </div>
 </button>
 );
}
