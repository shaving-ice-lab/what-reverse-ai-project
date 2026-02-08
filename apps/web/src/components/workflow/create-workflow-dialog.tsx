"use client";

/**
 * CreateWorkflowDialog - Enhanced UI/UX
 * 
 * Features: 
 * - Smooth animation effects
 * - Template preview
 * - Smart form validation
 * - Keyboard shortcuts
 */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
 Loader2, 
 Plus, 
 Sparkles, 
 FileCode, 
 Bot, 
 Webhook, 
 Zap, 
 AlertCircle,
 ArrowRight,
 CheckCircle2,
 Layers,
 MessageSquare,
 Database,
 GitBranch,
 Code2,
 Brain,
 Wand2,
} from "lucide-react";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { workflowApi } from "@/lib/api/workflow";

interface CreateWorkflowDialogProps {
 trigger?: React.ReactNode;
 folderId?: string;
 onSuccess?: (workflowId: string) => void;
}

// Preset templates - enhanced config
const templates = [
 {
 id: "blank",
 name: "Empty workflow",
 description: "Start from scratch, fully customizable",
 icon: Plus,
 color: "#6366f1",
 gradient: "from-indigo-500/20 to-purple-500/20",
 nodeCount: 0,
 popular: false,
 },
 {
 id: "llm-chat",
 name: "AI Conversation",
 description: "Simple LLM conversation flow",
 icon: MessageSquare,
 color: "#8b5cf6",
 gradient: "from-violet-500/20 to-purple-500/20",
 nodeCount: 3,
 popular: true,
 },
 {
 id: "api-processor",
    name: "API Data Processing",
 description: "Call API and process response data",
 icon: Database,
 color: "#f97316",
 gradient: "from-orange-500/20 to-amber-500/20",
 nodeCount: 5,
 popular: false,
 },
 {
 id: "auto-workflow",
    name: "Automation Workflow",
 description: "Conditions, branching and loop processing",
 icon: GitBranch,
 color: "#22c55e",
 gradient: "from-emerald-500/20 to-green-500/20",
 nodeCount: 6,
 popular: true,
 },
 {
 id: "code-generator",
    name: "Code Generation",
 description: "Use AI to generate code",
 icon: Code2,
 color: "#ec4899",
 gradient: "from-pink-500/20 to-rose-500/20",
 nodeCount: 4,
 popular: false,
 },
 {
 id: "ai-assistant",
 name: "AI Assistant",
 description: "Multi-conversation smart assistant",
 icon: Brain,
 color: "#06b6d4",
 gradient: "from-cyan-500/20 to-teal-500/20",
 nodeCount: 5,
 popular: true,
 },
];

export function CreateWorkflowDialog({
 trigger,
 folderId,
 onSuccess,
}: CreateWorkflowDialogProps) {
 const router = useRouter();
 const [open, setOpen] = useState(false);
 const [tab, setTab] = useState<"blank" | "template">("blank");
 const [name, setName] = useState("");
 const [description, setDescription] = useState("");
 const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [isSuccess, setIsSuccess] = useState(false);
 const nameInputRef = useRef<HTMLInputElement>(null);
 
  // Auto-focus name input
 useEffect(() => {
 if (open && nameInputRef.current) {
 setTimeout(() => nameInputRef.current?.focus(), 100);
 }
 }, [open, tab]);
 
 const handleCreate = async () => {
 if (!name.trim()) {
 setError("Please enter workflow name.");
 nameInputRef.current?.focus();
 return;
 }
 
 setIsLoading(true);
 setError(null);
 
 try {
 const response = await workflowApi.create({
 name: name.trim(),
 description: description.trim() || undefined,
 folderId,
 templateId: tab === "template" ? selectedTemplate || undefined : undefined,
 });
 
 setIsSuccess(true);
 
      // Delay to display success state
 setTimeout(() => {
 setOpen(false);
 
 if (onSuccess) {
 onSuccess(response.workflow.id);
 } else {
 router.push(`/editor/${response.workflow.id}`);
 }
 }, 500);
 } catch (err) {
 setError(err instanceof Error ? err.message : "Create failed.");
 } finally {
 setIsLoading(false);
 }
 };
 
 const handleOpenChange = (isOpen: boolean) => {
 setOpen(isOpen);
 if (!isOpen) {
      // Delay reset to avoid content flash during close animation
 setTimeout(() => {
 setName("");
 setDescription("");
 setSelectedTemplate(null);
 setError(null);
 setTab("blank");
 setIsSuccess(false);
 }, 200);
 }
 };

  // Keyboard shortcuts
 const handleKeyDown = (e: React.KeyboardEvent) => {
 if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
 handleCreate();
 }
 };
 
  // Get selected template details
 const selectedTemplateDetails = templates.find(t => t.id === selectedTemplate);
 
 return (
 <Dialog open={open} onOpenChange={handleOpenChange}>
 <DialogTrigger asChild>
 {trigger || (
 <Button 
 size="sm"
 className={cn(
 "bg-primary",
 "hover:bg-primary/90",
 "hover:shadow-lg hover:shadow-primary/20",
 "text-primary-foreground font-medium",
 "transition-all duration-200"
 )}
 >
 <Plus className="mr-1.5 h-4 w-4" />
 Create
 </Button>
 )}
 </DialogTrigger>
 <DialogContent 
 className="sm:max-w-[580px] overflow-hidden"
 onKeyDown={handleKeyDown}
 >
        {/* Success State Overlay */}
 {isSuccess && (
 <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fadeIn">
 <div className="flex flex-col items-center gap-4 text-center">
 <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-scaleIn">
 <CheckCircle2 className="w-8 h-8 text-primary" />
 </div>
 <div>
 <h3 className="text-lg font-semibold text-foreground">Created successfully!</h3>
              <p className="text-sm text-muted-foreground mt-1">Navigating to editor...</p>
 </div>
 </div>
 </div>
 )}
 
 <DialogHeader className="pb-2">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/30">
 <Wand2 className="w-5 h-5 text-primary" />
 </div>
 <div>
 <DialogTitle className="text-xl">Create Workflow</DialogTitle>
 <DialogDescription className="mt-0.5">
 Create a new AI workflow to automate your tasks
 </DialogDescription>
 </div>
 </div>
 </DialogHeader>
 
 <Tabs value={tab} onValueChange={(v) => setTab(v as "blank" | "template")} className="mt-2">
 <TabsList className="w-full h-11 p-1 bg-muted/50 rounded-xl">
 <TabsTrigger 
 value="blank" 
 className="flex-1 h-9 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
 >
 <Plus className="w-4 h-4 mr-2" />
              From Scratch
 </TabsTrigger>
 <TabsTrigger 
 value="template" 
 className="flex-1 h-9 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
 >
 <Layers className="w-4 h-4 mr-2" />
              From Template
 </TabsTrigger>
 </TabsList>
 
 <TabsContent value="blank" className="space-y-4 mt-5 animate-fadeIn">
            {/* From Scratch Tip */}
 <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
 <div className="flex items-start gap-3">
 <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
 <Sparkles className="w-5 h-5 text-primary" />
 </div>
 <div>
 <p className="text-sm font-medium text-foreground">Start from Scratch</p>
 <p className="text-xs text-muted-foreground mt-1">
 Create an empty workflow and drag & drop nodes in the editor to build your automation flow
 </p>
 </div>
 </div>
 </div>
 
 <div className="space-y-2">
 <Label htmlFor="name" className="text-sm font-medium">
Workflow name <span className="text-destructive">*</span>
</Label>
<Input
ref={nameInputRef}
id="name"
placeholder="e.g. Customer data analytics flow"
 value={name}
 onChange={(e) => {
 setName(e.target.value);
 if (error) setError(null);
 }}
 className={cn(
 "h-11 rounded-xl transition-all",
 error && !name.trim() && "border-destructive focus:border-destructive focus:ring-destructive/20"
 )}
 />
 </div>
 
 <div className="space-y-2">
 <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
 Description
 <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
 </Label>
 <Textarea
 id="description"
 placeholder="Brief description of this workflow's use..."
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 rows={3}
 className="resize-none rounded-xl"
 />
 </div>
 </TabsContent>
 
 <TabsContent value="template" className="space-y-4 mt-5 animate-fadeIn">
            {/* Template Selection Grid */}
 <div className="grid grid-cols-2 gap-3">
 {templates.map((template, index) => {
 const Icon = template.icon;
 const isSelected = selectedTemplate === template.id;
 
 return (
 <button
 key={template.id}
 type="button"
 onClick={() => {
 setSelectedTemplate(template.id);
 if (!name || templates.some(t => t.name === name)) {
 setName(template.name);
 }
 }}
 className={cn(
 "group relative flex flex-col p-4 rounded-xl text-left transition-all duration-300",
 "border-2 cursor-pointer overflow-hidden",
 isSelected
 ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
 : "border-border/50 hover:border-primary/40 hover:bg-muted/50 hover:shadow-md"
 )}
 style={{
 animationDelay: `${index * 50}ms`,
 }}
 >
                  {/* Background Gradient */}
 <div className={cn(
 "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
 template.gradient
 )} />
 
                  {/* Popular Tag */}
 {template.popular && (
 <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-medium">
 Popular
 </div>
 )}
 
 <div className="relative z-10">
 <div
 className={cn(
 "w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300",
 "group-hover:scale-110",
 isSelected && "scale-110"
 )}
 style={{ 
 backgroundColor: `${template.color}15`,
 color: template.color,
 border: `1px solid ${template.color}30`,
 }}
 >
 <Icon className="h-5 w-5" />
 </div>
 <div className="text-sm font-semibold text-foreground mb-1">{template.name}</div>
 <div className="text-xs text-muted-foreground leading-relaxed">
 {template.description}
 </div>
 {template.nodeCount > 0 && (
 <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground/70">
 <Layers className="w-3 h-3" />
{template.nodeCount} preset nodes
</div>
 )}
 </div>
 
                  {/* Selection Indicator */}
 {isSelected && (
 <div className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
 <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />
 </div>
 )}
 </button>
 );
 })}
 </div>
 
            {/* Name Input */}
 <div className="space-y-2 pt-2">
 <Label htmlFor="template-name" className="text-sm font-medium">
Workflow name <span className="text-destructive">*</span>
</Label>
<Input
ref={tab === "template" ? nameInputRef : undefined}
id="template-name"
placeholder="Enter workflow name"
 value={name}
 onChange={(e) => {
 setName(e.target.value);
 if (error) setError(null);
 }}
 className={cn(
 "h-11 rounded-xl transition-all",
 error && !name.trim() && "border-destructive focus:border-destructive focus:ring-destructive/20"
 )}
 />
 </div>
 </TabsContent>
 </Tabs>
 
        {/* Error Message */}
 {error && (
 <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm animate-shake">
 <AlertCircle className="h-4 w-4 shrink-0" />
 {error}
 </div>
 )}
 
 <DialogFooter className="gap-2 sm:gap-2 pt-2">
 <div className="hidden sm:flex items-center text-xs text-muted-foreground mr-auto">
 <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px] mr-1">⌘</kbd>
 <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px] mr-1.5">Enter</kbd>
              Quick create
 </div>
 <Button 
 variant="ghost" 
 onClick={() => setOpen(false)}
 className="rounded-xl"
 >
 Cancel
 </Button>
 <Button 
 onClick={handleCreate} 
 disabled={isLoading || !name.trim()}
 className={cn(
 "min-w-[100px] rounded-xl",
 "bg-primary",
 "hover:bg-primary/90",
 "hover:shadow-lg hover:shadow-primary/25",
 "text-primary-foreground font-medium",
 "transition-all duration-200",
 "disabled:opacity-50 disabled:cursor-not-allowed"
 )}
 >
 {isLoading ? (
 <>
 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
 Create
 </>
 ) : (
 <>
              Create Workflow
 <ArrowRight className="ml-2 h-4 w-4" />
 </>
 )}
 </Button>
 </DialogFooter>
 
        {/* Animation styles */}
 <style jsx global>{`
 @keyframes shake {
 0%, 100% { transform: translateX(0); }
 25% { transform: translateX(-4px); }
 75% { transform: translateX(4px); }
 }
 
 @keyframes fadeIn {
 from { opacity: 0; }
 to { opacity: 1; }
 }
 
 @keyframes scaleIn {
 from { opacity: 0; transform: scale(0.9); }
 to { opacity: 1; transform: scale(1); }
 }
 
 .animate-shake {
 animation: shake 0.3s ease-in-out;
 }
 
 .animate-fadeIn {
 animation: fadeIn 0.3s ease-out;
 }
 
 .animate-scaleIn {
 animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
 }
 `}</style>
 </DialogContent>
 </Dialog>
 );
}
