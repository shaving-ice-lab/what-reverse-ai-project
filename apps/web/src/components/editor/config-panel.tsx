"use client";

import { useMemo, useRef, useState } from "react";
import {
 Settings,
 X,
 Bot,
 Globe,
 GitBranch,
 Repeat,
 Code2,
 FileText,
 Variable,
 Database,
 FormInput,
 FileOutput,
 ChevronDown,
 ChevronRight,
 Sparkles,
 Zap,
 Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkflowStore, type WorkflowNode } from "@/stores/useWorkflowStore";
import { VariableSelector } from "./variable-selector";
import { ConditionBuilder, type ConditionGroup } from "./condition-builder";
import { generateId, cn } from "@/lib/utils";

/**
 * ConfigPanel - Minimalist Style
 */

const nodeIcons: Record<string, React.ReactNode> = {
 llm: <Bot className="h-4 w-4" />,
 http: <Globe className="h-4 w-4" />,
 condition: <GitBranch className="h-4 w-4" />,
 loop: <Repeat className="h-4 w-4" />,
 code: <Code2 className="h-4 w-4" />,
 template: <FileText className="h-4 w-4" />,
 variable: <Variable className="h-4 w-4" />,
 db_select: <Database className="h-4 w-4" />,
 db_insert: <Database className="h-4 w-4" />,
 db_update: <Database className="h-4 w-4" />,
 db_delete: <Database className="h-4 w-4" />,
 db_migrate: <Database className="h-4 w-4" />,
 input: <FormInput className="h-4 w-4" />,
 output: <FileOutput className="h-4 w-4" />,
};

// Node Type Color Config
const nodeTypeColors: Record<string, { bg: string; icon: string; border: string }> = {
 llm: { bg: "bg-brand-200/60", icon: "text-brand-500", border: "border-brand-400/40" },
 http: { bg: "bg-surface-200/80", icon: "text-foreground-muted", border: "border-border/70" },
 condition: { bg: "bg-surface-200/80", icon: "text-foreground-muted", border: "border-border/70" },
 loop: { bg: "bg-surface-200/80", icon: "text-foreground-muted", border: "border-border/70" },
 code: { bg: "bg-surface-200/80", icon: "text-foreground-muted", border: "border-border/70" },
 template: { bg: "bg-surface-200/80", icon: "text-foreground-muted", border: "border-border/70" },
 variable: { bg: "bg-brand-200/40", icon: "text-brand-500", border: "border-brand-400/30" },
 db_select: { bg: "bg-surface-200/80", icon: "text-foreground-muted", border: "border-border/70" },
 db_insert: { bg: "bg-surface-200/80", icon: "text-foreground-muted", border: "border-border/70" },
 db_update: { bg: "bg-surface-200/80", icon: "text-foreground-muted", border: "border-border/70" },
 db_delete: { bg: "bg-surface-200/80", icon: "text-foreground-muted", border: "border-border/70" },
 db_migrate: { bg: "bg-surface-200/80", icon: "text-foreground-muted", border: "border-border/70" },
 input: { bg: "bg-brand-200/60", icon: "text-brand-500", border: "border-brand-400/40" },
 output: { bg: "bg-surface-200/80", icon: "text-foreground-muted", border: "border-border/70" },
 start: { bg: "bg-brand-200/60", icon: "text-brand-500", border: "border-brand-400/40" },
 end: { bg: "bg-destructive-200/80", icon: "text-destructive", border: "border-destructive/30" },
};

// Collapsible Config Section Component
function ConfigSection({
 title,
 icon,
 children,
 defaultOpen = true,
}: {
 title: string;
 icon?: React.ReactNode;
 children: React.ReactNode;
 defaultOpen?: boolean;
}) {
 const [isOpen, setIsOpen] = useState(defaultOpen);
 
 return (
 <div className="border-b border-border/70 last:border-0">
 <button
 onClick={() => setIsOpen(!isOpen)}
 className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-surface-200/60 transition-colors"
 >
 {isOpen ? (
 <ChevronDown className="w-3.5 h-3.5 text-foreground-muted" />
 ) : (
 <ChevronRight className="w-3.5 h-3.5 text-foreground-muted" />
 )}
 {icon && <span className="text-foreground-muted">{icon}</span>}
 <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
 {title}
 </span>
 </button>
 <div
 className={cn(
 "overflow-hidden transition-all duration-200",
 isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
 )}
 >
 <div className="px-4 pb-4">{children}</div>
 </div>
 </div>
 );
}

// Unified form input style
const inputStyles = "bg-surface-200/80 border-border/70 text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-colors";
const labelStyles = "text-sm font-medium text-foreground mb-1.5 block";

// LLM NodeConfig
function LLMNodeConfig({
 node,
 onUpdate,
}: {
 node: WorkflowNode;
 onUpdate: (data: Partial<WorkflowNode["data"]>) => void;
}) {
 const userPromptRef = useRef<HTMLTextAreaElement>(null);
 const [showAdvanced, setShowAdvanced] = useState(false);
 const config = node.data.config as {
 model?: string;
 systemPrompt?: string;
 userPrompt?: string;
 temperature?: number;
 maxTokens?: number;
 outputSchema?: string | Record<string, unknown>;
 output_schema?: string | Record<string, unknown>;
 streaming?: boolean;
 };
 const outputSchemaRaw = config.outputSchema ?? config.output_schema;
 const outputSchemaText =
 typeof outputSchemaRaw === "string"
 ? outputSchemaRaw
 : outputSchemaRaw
 ? JSON.stringify(outputSchemaRaw, null, 2)
 : "";

 const updateConfig = (key: string, value: unknown) => {
 onUpdate({
 config: { ...config, [key]: value },
 });
 };

 const insertVariable = (path: string) => {
 const textarea = userPromptRef.current;
 if (!textarea) return;

 const start = textarea.selectionStart;
 const end = textarea.selectionEnd;
 const currentValue = config.userPrompt || "";
 const newValue = currentValue.substring(0, start) + path + currentValue.substring(end);
 
 updateConfig("userPrompt", newValue);
 
 setTimeout(() => {
 textarea.focus();
 textarea.setSelectionRange(start + path.length, start + path.length);
 }, 0);
 };

 return (
 <div className="space-y-4">
 <div className="space-y-1.5">
 <label className={labelStyles}>Model</label>
 <Select
 value={config.model || "gpt-4"}
 onValueChange={(value) => updateConfig("model", value)}
 >
 <SelectTrigger className={inputStyles}>
 <SelectValue placeholder="Select model" />
 </SelectTrigger>
 <SelectContent className="bg-surface-100/95 border-border/70 shadow-lg shadow-black/20">
 <SelectItem value="gpt-4" className="text-foreground focus:bg-surface-200 focus:text-foreground">GPT-4</SelectItem>
 <SelectItem value="gpt-4-turbo" className="text-foreground focus:bg-surface-200 focus:text-foreground">GPT-4 Turbo</SelectItem>
 <SelectItem value="gpt-3.5-turbo" className="text-foreground focus:bg-surface-200 focus:text-foreground">GPT-3.5 Turbo</SelectItem>
 <SelectItem value="claude-3-opus" className="text-foreground focus:bg-surface-200 focus:text-foreground">Claude 3 Opus</SelectItem>
 <SelectItem value="claude-3-sonnet" className="text-foreground focus:bg-surface-200 focus:text-foreground">Claude 3 Sonnet</SelectItem>
 <SelectItem value="local" className="text-foreground focus:bg-surface-200 focus:text-foreground">Local model</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-1.5">
 <label className={labelStyles}>System Prompt</label>
 <Textarea
 value={config.systemPrompt || ""}
 onChange={(e) => updateConfig("systemPrompt", e.target.value)}
 placeholder="Set the AI's role and behavior..."
 rows={3}
 className={cn(inputStyles, "resize-none")}
 />
 </div>

 <div className="space-y-1.5">
 <div className="flex items-center justify-between">
 <label className={labelStyles}>User Prompt</label>
 <VariableSelector
 currentNodeId={node.id}
 onSelect={(variable) => insertVariable(variable.path)}
 />
 </div>
 <Textarea
 ref={userPromptRef}
 value={config.userPrompt || ""}
 onChange={(e) => updateConfig("userPrompt", e.target.value)}
 placeholder="Input prompt, supports {{variable}} syntax"
 rows={4}
 className={cn(inputStyles, "resize-none")}
 />
 <p className="text-[11px] text-foreground-muted">
 Use {"{{variable}}"} syntax to insert variables
 </p>
 </div>

 {/* Advanced SettingsCollapse */}
 <div className="pt-2">
 <button
 onClick={() => setShowAdvanced(!showAdvanced)}
 className="flex items-center gap-2 text-xs text-foreground-muted hover:text-foreground transition-colors"
 >
 {showAdvanced ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
 <span className="font-medium">Advanced Settings</span>
 </button>
 
 <div className={cn(
 "overflow-hidden transition-all duration-200",
 showAdvanced ? "max-h-[420px] opacity-100 mt-3" : "max-h-0 opacity-0"
 )}>
 <div className="space-y-4 p-3 rounded-lg bg-surface-200/60 border border-border">
 <div className="space-y-2">
 <div className="flex justify-between items-center">
 <label className="text-xs text-foreground-muted">Temperature</label>
 <span className="text-xs font-mono text-brand-500 bg-brand-200/60 px-1.5 py-0.5 rounded">
 {config.temperature ?? 0.7}
 </span>
 </div>
 <Input
 type="range"
 min={0}
 max={2}
 step={0.1}
 value={config.temperature ?? 0.7}
 onChange={(e) => updateConfig("temperature", parseFloat(e.target.value))}
 className="cursor-pointer accent-brand-500"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs text-foreground-muted">Max Tokens</label>
 <Input
 type="number"
 min={1}
 max={32000}
 value={config.maxTokens ?? 2048}
 onChange={(e) => updateConfig("maxTokens", parseInt(e.target.value))}
 className={cn(inputStyles, "h-8 text-sm")}
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs text-foreground-muted">Output Schema (JSON)</label>
 <Textarea
 value={outputSchemaText}
 onChange={(e) => updateConfig("outputSchema", e.target.value)}
 placeholder='{"type":"object","properties":{}}'
 rows={4}
 className={cn(inputStyles, "resize-none text-xs")}
 />
 </div>

 <div className="flex items-center justify-between">
 <label className="text-xs text-foreground-muted">Streaming Output</label>
 <Switch
 checked={config.streaming ?? false}
 onCheckedChange={(checked) => updateConfig("streaming", checked)}
 className="data-[state=checked]:bg-brand-500"
 />
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}

// HTTP NodeConfig
function HTTPNodeConfig({
 node,
 onUpdate,
}: {
 node: WorkflowNode;
 onUpdate: (data: Partial<WorkflowNode["data"]>) => void;
}) {
 const config = node.data.config as {
 method?: string;
 url?: string;
 headers?: Record<string, string>;
 body?: string;
 };

 const updateConfig = (key: string, value: unknown) => {
 onUpdate({
 config: { ...config, [key]: value },
 });
 };

 return (
 <div className="space-y-4">
 <div className="space-y-2">
 <Label>Request method</Label>
 <Select
 value={config.method || "GET"}
 onValueChange={(value) => updateConfig("method", value)}
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="GET">GET</SelectItem>
 <SelectItem value="POST">POST</SelectItem>
 <SelectItem value="PUT">PUT</SelectItem>
 <SelectItem value="PATCH">PATCH</SelectItem>
 <SelectItem value="DELETE">DELETE</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-2">
 <Label>URL</Label>
 <Input
 value={config.url || ""}
 onChange={(e) => updateConfig("url", e.target.value)}
 placeholder="https://api.example.com/endpoint"
 />
 </div>

 <div className="space-y-2">
 <Label>Headers (JSON)</Label>
 <Textarea
 value={JSON.stringify(config.headers || {}, null, 2)}
 onChange={(e) => {
 try {
 updateConfig("headers", JSON.parse(e.target.value));
 } catch {
 // Ignore JSON ParseError
 }
 }}
 placeholder='{"Content-Type": "application/json"}'
 rows={3}
 className="font-mono text-sm"
 />
 </div>

 {config.method !== "GET" && (
 <div className="space-y-2">
 <Label>Body (JSON)</Label>
 <Textarea
 value={config.body || ""}
 onChange={(e) => updateConfig("body", e.target.value)}
 placeholder='{"key": "value"}'
 rows={4}
 className="font-mono text-sm"
 />
 </div>
 )}
 </div>
 );
}

// CodeNodeConfig
function CodeNodeConfig({
 node,
 onUpdate,
}: {
 node: WorkflowNode;
 onUpdate: (data: Partial<WorkflowNode["data"]>) => void;
}) {
 const config = node.data.config as {
 code?: string;
 timeout?: number;
 };

 const updateConfig = (key: string, value: unknown) => {
 onUpdate({
 config: { ...config, [key]: value },
 });
 };

 return (
 <div className="space-y-4">
 <div className="space-y-2">
 <Label>JavaScript Code</Label>
 <Textarea
 value={config.code || ""}
 onChange={(e) => updateConfig("code", e.target.value)}
 placeholder="async function main(inputs) { ... }"
 rows={12}
 className="font-mono text-sm"
 />
 <p className="text-xs text-foreground-muted">
 Function receives inputs parameter, returns value as node output
 </p>
 </div>

 <div className="space-y-2">
 <Label>Timeout (seconds)</Label>
 <Input
 type="number"
 min={1000}
 max={300000}
 value={config.timeout ?? 30000}
 onChange={(e) => updateConfig("timeout", parseInt(e.target.value))}
 />
 </div>
 </div>
 );
}

// TemplateNodeConfig
function TemplateNodeConfig({
 node,
 onUpdate,
}: {
 node: WorkflowNode;
 onUpdate: (data: Partial<WorkflowNode["data"]>) => void;
}) {
 const config = node.data.config as {
 template?: string;
 };

 const updateConfig = (key: string, value: unknown) => {
 onUpdate({
 config: { ...config, [key]: value },
 });
 };

 return (
 <div className="space-y-4">
 <div className="space-y-2">
 <Label>Template content</Label>
 <Textarea
 value={config.template || ""}
 onChange={(e) => updateConfig("template", e.target.value)}
 placeholder="Hello, {{name}}! Welcome to {{place}}."
 rows={8}
 />
 <p className="text-xs text-foreground-muted">
 Use {"{{variable}}"} syntax to insert variables
 </p>
 </div>
 </div>
 );
}

// VariableNodeConfig
function VariableNodeConfig({
 node,
 onUpdate,
}: {
 node: WorkflowNode;
 onUpdate: (data: Partial<WorkflowNode["data"]>) => void;
}) {
 const config = node.data.config as {
 variableName?: string;
 valueType?: string;
 value?: unknown;
 };

 const updateConfig = (key: string, value: unknown) => {
 onUpdate({
 config: { ...config, [key]: value },
 });
 };

 return (
 <div className="space-y-4">
 <div className="space-y-2">
 <Label>Variable</Label>
 <Input
 value={config.variableName || ""}
 onChange={(e) => updateConfig("variableName", e.target.value)}
 placeholder="myVariable"
 className="font-mono"
 />
 </div>

 <div className="space-y-2">
 <Label>Data type</Label>
 <Select
 value={config.valueType || "string"}
 onValueChange={(value) => updateConfig("valueType", value)}
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="string">String</SelectItem>
 <SelectItem value="number">Number</SelectItem>
 <SelectItem value="boolean">Boolean</SelectItem>
 <SelectItem value="object">Object</SelectItem>
 <SelectItem value="array">Array</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-2">
 <Label>Default value</Label>
 <Textarea
 value={
 typeof config.value === "object"
 ? JSON.stringify(config.value, null, 2)
 : String(config.value ?? "")
 }
 onChange={(e) => {
 const val = e.target.value;
 if (config.valueType === "object" || config.valueType === "array") {
 try {
 updateConfig("value", JSON.parse(val));
 } catch {
 updateConfig("value", val);
 }
 } else if (config.valueType === "number") {
 updateConfig("value", parseFloat(val) || 0);
 } else if (config.valueType === "boolean") {
 updateConfig("value", val === "true");
 } else {
 updateConfig("value", val);
 }
 }}
 rows={4}
 className="font-mono text-sm"
 />
 </div>
 </div>
 );
}

// InputNodeConfig
function InputNodeConfig({
 node,
 onUpdate,
}: {
 node: WorkflowNode;
 onUpdate: (data: Partial<WorkflowNode["data"]>) => void;
}) {
 const config = node.data.config as {
 inputType?: string;
 name?: string;
 label?: string;
 placeholder?: string;
 defaultValue?: unknown;
 required?: boolean;
 options?: Array<{ label: string; value: string }>;
 validation?: {
 min?: number;
 max?: number;
 pattern?: string;
 };
 };

 const updateConfig = (key: string, value: unknown) => {
 onUpdate({
 config: { ...config, [key]: value },
 });
 };

 const updateValidation = (key: "min" | "max" | "pattern", value: unknown) => {
 const next = { ...(config.validation || {}) } as Record<string, unknown>;
 if (value === undefined || value === "") {
 delete next[key];
 } else {
 next[key] = value;
 }
 updateConfig("validation", Object.keys(next).length ? next : undefined);
 };

 const inputType = config.inputType || "text";

 return (
 <div className="space-y-4">
 <div className="space-y-2">
 <Label>Field</Label>
 <Input
 value={config.name || ""}
 onChange={(e) => updateConfig("name", e.target.value)}
 placeholder="input"
 className="font-mono"
 />
 <p className="text-xs text-foreground-muted">
 Used for input mapping. Suggestion: use string/number/boolean
 </p>
 </div>

 <div className="space-y-2">
 <Label>Display name</Label>
 <Input
 value={config.label || ""}
 onChange={(e) => updateConfig("label", e.target.value)}
 placeholder="User input"
 />
 </div>

 <div className="space-y-2">
 <Label>Input type</Label>
 <Select
 value={inputType}
 onValueChange={(value) => updateConfig("inputType", value)}
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="text">Text</SelectItem>
 <SelectItem value="textarea">Textarea</SelectItem>
 <SelectItem value="number">Number</SelectItem>
 <SelectItem value="boolean">Toggle</SelectItem>
 <SelectItem value="select">Select</SelectItem>
 <SelectItem value="password">Password</SelectItem>
 <SelectItem value="email">Email</SelectItem>
 <SelectItem value="url">URL</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-2">
 <Label>Placeholder</Label>
 <Input
 value={config.placeholder || ""}
 onChange={(e) => updateConfig("placeholder", e.target.value)}
 placeholder="Enter placeholder text..."
 />
 </div>

 <div className="space-y-2">
 <Label>Default value</Label>
 <Input
 value={config.defaultValue === undefined ? "" : String(config.defaultValue)}
 onChange={(e) => updateConfig("defaultValue", e.target.value)}
 placeholder="Optional"
 />
 </div>

 <div className="flex items-center justify-between">
 <label className="text-xs text-foreground-muted">Required</label>
 <Switch
 checked={Boolean(config.required)}
 onCheckedChange={(checked) => updateConfig("required", checked)}
 className="data-[state=checked]:bg-brand-500"
 />
 </div>

 {inputType === "select" && (
 <div className="space-y-2">
 <Label>Option (JSON)</Label>
 <Textarea
 value={JSON.stringify(config.options || [], null, 2)}
 onChange={(e) => {
 try {
 const parsed = JSON.parse(e.target.value) as Array<{ label: string; value: string }>;
 updateConfig("options", parsed);
 } catch {
 // Ignore JSON ParseError
 }
 }}
 rows={4}
 className="font-mono text-sm"
 />
 <p className="text-xs text-foreground-muted">
 Format: [{`{"label":"Option","value":"option"}`}] 
 </p>
 </div>
 )}

 <div className="space-y-2">
 <Label>Validation rule</Label>
 <div className="grid grid-cols-2 gap-2">
 <Input
 type="number"
 value={config.validation?.min ?? ""}
 onChange={(e) => updateValidation("min", e.target.value === "" ? undefined : Number(e.target.value))}
 placeholder="Minimum value"
 className={inputStyles}
 />
 <Input
 type="number"
 value={config.validation?.max ?? ""}
 onChange={(e) => updateValidation("max", e.target.value === "" ? undefined : Number(e.target.value))}
 placeholder="Maximum value"
 className={inputStyles}
 />
 </div>
 <Input
 value={config.validation?.pattern || ""}
 onChange={(e) => updateValidation("pattern", e.target.value)}
 placeholder="Regex pattern"
 className={inputStyles}
 />
 </div>
 </div>
 );
}

// OutputNodeConfig
function OutputNodeConfig({
 node,
 onUpdate,
}: {
 node: WorkflowNode;
 onUpdate: (data: Partial<WorkflowNode["data"]>) => void;
}) {
 const config = node.data.config as {
 outputType?: string;
 title?: string;
 showTimestamp?: boolean;
 maxLength?: number;
 };

 const updateConfig = (key: string, value: unknown) => {
 onUpdate({
 config: { ...config, [key]: value },
 });
 };

 return (
 <div className="space-y-4">
 <div className="space-y-2">
 <Label>Display type</Label>
 <Select
 value={config.outputType || "text"}
 onValueChange={(value) => updateConfig("outputType", value)}
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="text">Text</SelectItem>
 <SelectItem value="json">JSON</SelectItem>
 <SelectItem value="table">Table</SelectItem>
 <SelectItem value="markdown">Markdown</SelectItem>
 <SelectItem value="image">Image</SelectItem>
 <SelectItem value="html">HTML</SelectItem>
 <SelectItem value="file">File</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <div className="space-y-2">
 <Label>Title</Label>
 <Input
 value={config.title || ""}
 onChange={(e) => updateConfig("title", e.target.value)}
 placeholder="Output result"
 />
 </div>

 <div className="space-y-2">
 <Label>Maximum length</Label>
 <Input
 type="number"
 min={0}
 value={config.maxLength ?? ""}
 onChange={(e) => updateConfig("maxLength", e.target.value === "" ? undefined : Number(e.target.value))}
 placeholder="0 means no limit"
 />
 </div>

 <div className="flex items-center justify-between">
 <label className="text-xs text-foreground-muted">Display time</label>
 <Switch
 checked={Boolean(config.showTimestamp)}
 onCheckedChange={(checked) => updateConfig("showTimestamp", checked)}
 className="data-[state=checked]:bg-brand-500"
 />
 </div>
 </div>
 );
}

// ConditionNodeConfig
function ConditionNodeConfig({
 node,
 onUpdate,
}: {
 node: WorkflowNode;
 onUpdate: (data: Partial<WorkflowNode["data"]>) => void;
}) {
 const config = node.data.config as {
 conditions?: ConditionGroup[];
 logic?: "and" | "or";
 };

 const groups: ConditionGroup[] = config.conditions?.length
 ? config.conditions
 : [
 {
 id: generateId("grp"),
 conditions: [
 {
 id: generateId("cond"),
 left: "",
 operator: "eq",
 right: "",
 },
 ],
 logic: "and",
 },
 ];

 const handleChange = (newGroups: ConditionGroup[], logic: "and" | "or") => {
 onUpdate({
 config: {
 ...config,
 conditions: newGroups,
 logic,
 },
 });
 };

 return (
 <div className="space-y-4">
 <div className="space-y-2">
 <Label>Condition config</Label>
 <p className="text-xs text-foreground-muted">
 Configure conditions. When satisfied, the True branch executes; otherwise, the False branch executes.
 </p>
 </div>
 <ConditionBuilder
 groups={groups}
 logic={config.logic || "and"}
 currentNodeId={node.id}
 onChange={handleChange}
 />
 </div>
 );
}

// LoopNodeConfig
function LoopNodeConfig({
 node,
 onUpdate,
}: {
 node: WorkflowNode;
 onUpdate: (data: Partial<WorkflowNode["data"]>) => void;
}) {
 const config = node.data.config as {
 mode?: "forEach" | "while" | "count";
 items?: string;
 condition?: string;
 count?: number;
 maxIterations?: number;
 };

 const updateConfig = (key: string, value: unknown) => {
 onUpdate({
 config: { ...config, [key]: value },
 });
 };

 return (
 <div className="space-y-4">
 <div className="space-y-2">
 <Label>Loop</Label>
 <Select
 value={config.mode || "forEach"}
 onValueChange={(value) => updateConfig("mode", value)}
 >
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="forEach">Traverse array (For Each)</SelectItem>
 <SelectItem value="while">Condition loop (While)</SelectItem>
 <SelectItem value="count">Fixed times loop</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {config.mode === "forEach" && (
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <Label>Traverse array</Label>
 <VariableSelector
 currentNodeId={node.id}
 onSelect={(v) => updateConfig("items", v.path)}
 />
 </div>
 <Input
 value={config.items || ""}
 onChange={(e) => updateConfig("items", e.target.value)}
 placeholder="{{arrayVariable}}"
 />
 <p className="text-xs text-foreground-muted">
 Input must be an array variable
 </p>
 </div>
 )}

 {config.mode === "while" && (
 <div className="space-y-2">
 <Label>Loop condition</Label>
 <Input
 value={config.condition || ""}
 onChange={(e) => updateConfig("condition", e.target.value)}
 placeholder="{{Variable}} == true"
 />
 <p className="text-xs text-foreground-muted">
 The loop continues while this condition is true
 </p>
 </div>
 )}

 {config.mode === "count" && (
 <div className="space-y-2">
 <Label>Loop Count</Label>
 <Input
 type="number"
 min={1}
 max={10000}
 value={config.count ?? 10}
 onChange={(e) => updateConfig("count", parseInt(e.target.value))}
 />
 </div>
 )}

 <Separator />

 <div className="space-y-2">
 <Label>Max iterations</Label>
 <Input
 type="number"
 min={1}
 max={100000}
 value={config.maxIterations ?? 1000}
 onChange={(e) => updateConfig("maxIterations", parseInt(e.target.value))}
 />
 <p className="text-xs text-foreground-muted">
 Prevent infinite loops (security limit)
 </p>
 </div>
 </div>
 );
}

// DatabaseNodeConfig
function DatabaseNodeConfig({
 node,
 onUpdate,
}: {
 node: WorkflowNode;
 onUpdate: (data: Partial<WorkflowNode["data"]>) => void;
}) {
 const config = node.data.config as {
 operation?: string;
 table?: string;
 where?: string;
 values?: unknown;
 limit?: number;
 sql?: string;
 };

 const operation = (config.operation || node.type.replace("db_", "") || "select").toLowerCase();

 const updateConfig = (key: string, value: unknown) => {
 onUpdate({
 config: { ...config, operation, [key]: value },
 });
 };

 const valuesText =
 typeof config.values === "string"
 ? config.values
 : config.values !== undefined
 ? JSON.stringify(config.values, null, 2)
 : "";

 const showTable = operation !== "migrate";
 const showWhere = operation === "select" || operation === "update" || operation === "delete";
 const showValues = operation === "insert" || operation === "update";
 const showLimit = operation === "select";
 const showSQL = operation === "migrate";

 return (
 <div className="space-y-4">
 <div className="space-y-1.5">
 <label className={labelStyles}>Action type</label>
 <div className="text-xs text-foreground-muted">
 {operation.toUpperCase()}
 </div>
 </div>

 {showTable && (
 <div className="space-y-1.5">
 <label className={labelStyles}>Data</label>
 <Input
 value={config.table || ""}
 onChange={(e) => updateConfig("table", e.target.value)}
 placeholder="table_name"
 className={inputStyles}
 />
 </div>
 )}

 {showWhere && (
 <div className="space-y-1.5">
 <label className={labelStyles}>Condition (Where)</label>
 <Textarea
 value={config.where || ""}
 onChange={(e) => updateConfig("where", e.target.value)}
 placeholder="id = {{input.id}}"
 rows={2}
 className={cn(inputStyles, "resize-none font-mono text-xs")}
 />
 </div>
 )}

 {showLimit && (
 <div className="space-y-1.5">
 <label className={labelStyles}>Limit</label>
 <Input
 type="number"
 min={1}
 value={config.limit ?? 100}
 onChange={(e) =>
 updateConfig("limit", e.target.value ? parseInt(e.target.value, 10) : undefined)
 }
 className={inputStyles}
 />
 </div>
 )}

 {showValues && (
 <div className="space-y-1.5">
 <label className={labelStyles}>Values (JSON)</label>
 <Textarea
 value={valuesText}
 onChange={(e) => updateConfig("values", e.target.value)}
 placeholder='{"field":"value"}'
 rows={4}
 className={cn(inputStyles, "resize-none font-mono text-xs")}
 />
 </div>
 )}

 {showSQL && (
 <div className="space-y-1.5">
 <label className={labelStyles}>SQL</label>
 <Textarea
 value={config.sql || ""}
 onChange={(e) => updateConfig("sql", e.target.value)}
 placeholder="CREATE TABLE ..."
 rows={4}
 className={cn(inputStyles, "resize-none font-mono text-xs")}
 />
 </div>
 )}
 </div>
 );
}

// Basic Config
function BasicConfig({
 node,
 onUpdate,
}: {
 node: WorkflowNode;
 onUpdate: (data: Partial<WorkflowNode["data"]>) => void;
}) {
 return (
 <div className="space-y-4">
 <div className="space-y-2">
 <Label>Node name</Label>
 <Input
 value={node.data.label || ""}
 onChange={(e) => onUpdate({ label: e.target.value })}
 placeholder="Node name"
 />
 </div>

 <div className="space-y-2">
 <Label>Description</Label>
 <Textarea
 value={node.data.description || ""}
 onChange={(e) => onUpdate({ description: e.target.value })}
 placeholder="Node description (optional)"
 rows={2}
 />
 </div>
 </div>
 );
}

// Render Config Based on Node Type
function NodeConfigByType({
 node,
 onUpdate,
}: {
 node: WorkflowNode;
 onUpdate: (data: Partial<WorkflowNode["data"]>) => void;
}) {
 switch (node.type) {
 case "llm":
 return <LLMNodeConfig node={node} onUpdate={onUpdate} />;
 case "http":
 return <HTTPNodeConfig node={node} onUpdate={onUpdate} />;
 case "code":
 return <CodeNodeConfig node={node} onUpdate={onUpdate} />;
 case "template":
 return <TemplateNodeConfig node={node} onUpdate={onUpdate} />;
 case "variable":
 return <VariableNodeConfig node={node} onUpdate={onUpdate} />;
 case "input":
 return <InputNodeConfig node={node} onUpdate={onUpdate} />;
 case "output":
 return <OutputNodeConfig node={node} onUpdate={onUpdate} />;
 case "condition":
 return <ConditionNodeConfig node={node} onUpdate={onUpdate} />;
 case "loop":
 return <LoopNodeConfig node={node} onUpdate={onUpdate} />;
 case "db_select":
 case "db_insert":
 case "db_update":
 case "db_delete":
 case "db_migrate":
 return <DatabaseNodeConfig node={node} onUpdate={onUpdate} />;
 default:
 return (
 <div className="py-4 text-center text-foreground-muted text-sm">
 This node has no configurable options
 </div>
 );
 }
}

export function ConfigPanel() {
 const { nodes, selectedNodeIds, updateNode, clearSelection } = useWorkflowStore();

 const selectedNode = useMemo(() => {
 if (selectedNodeIds.length !== 1) return null;
 return nodes.find((n) => n.id === selectedNodeIds[0]) || null;
 }, [nodes, selectedNodeIds]);

 const handleUpdate = (data: Partial<WorkflowNode["data"]>) => {
 if (selectedNode) {
 updateNode(selectedNode.id, data);
 }
 };

 if (!selectedNode) {
 return (
 <aside className="w-full h-full bg-transparent flex flex-col">
 {/* Header */}
 <div className="h-12 px-4 flex items-center border-b border-border bg-surface-75/80">
 <span className="text-sm font-medium text-foreground">Node config</span>
 </div>
 <div className="flex-1 flex items-center justify-center p-6">
 <div className="text-center max-w-[200px]">
 <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-linear-to-br from-surface-100 to-surface-200 border border-border flex items-center justify-center">
 <Settings className="h-6 w-6 text-foreground-muted" />
 </div>
 <p className="text-sm font-medium text-foreground mb-1">Select node</p>
 <p className="text-xs text-foreground-muted leading-relaxed">Click a node on the canvas to view and edit its config.</p>
 </div>
 </div>
 </aside>
 );
 }

 const nodeIcon = nodeIcons[selectedNode.type || ""] || <Settings className="h-4 w-4" />;
 const colors = nodeTypeColors[selectedNode.type || ""] || nodeTypeColors.code;

 return (
 <aside className="w-full h-full bg-transparent flex flex-col">
 {/* Header - Display Node Type and Name */}
 <div className="px-4 py-3 border-b border-border bg-surface-75/80">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className={cn(
 "w-9 h-9 rounded-lg flex items-center justify-center",
 colors.bg
 )}>
 <span className={colors.icon}>{nodeIcon}</span>
 </div>
 <div className="min-w-0">
 <h3 className="text-sm font-medium text-foreground truncate">
 {selectedNode.data.label || "Unnamed Node"}
 </h3>
 <p className="text-[11px] text-foreground-muted capitalize">{selectedNode.type}</p>
 </div>
 </div>
 <Button 
 variant="ghost" 
 size="icon" 
 onClick={clearSelection} 
 className="h-7 w-7 text-foreground-muted hover:text-foreground hover:bg-surface-200 shrink-0"
 >
 <X className="h-4 w-4" />
 </Button>
 </div>
 </div>

{/* Config Content */}
 <ScrollArea className="flex-1">
  {/* General Settings */}
 <ConfigSection title="Current settings" icon={<Info className="w-3.5 h-3.5" />}>
 <div className="space-y-4">
 <div>
 <label className={labelStyles}>Node Name</label>
 <Input 
 value={selectedNode.data.label || ""} 
 onChange={(e) => handleUpdate({ label: e.target.value })}
 className={inputStyles}
 />
 </div>
 <div>
 <label className={labelStyles}>Description</label>
 <Textarea
 value={selectedNode.data.description || ""}
 onChange={(e) => handleUpdate({ description: e.target.value })}
 placeholder="Node description (optional)"
 rows={2}
 className={cn(inputStyles, "resize-none")}
 />
 </div>
 </div>
 </ConfigSection>

 {/* Node-Specific Config */}
 <ConfigSection 
 title="Node config" 
 icon={<Zap className="w-3.5 h-3.5" />}
 >
 <NodeConfigByType node={selectedNode} onUpdate={handleUpdate} />
 </ConfigSection>
 </ScrollArea>

 {/* Footer Info */}
 <div className="px-4 py-2.5 border-t border-border bg-surface-75/80">
 <div className="flex items-center justify-between text-[10px] text-foreground-muted">
 <span>ID</span>
 <code className="font-mono bg-surface-200 px-1.5 py-0.5 rounded text-foreground-muted select-all">
 {selectedNode.id.slice(0, 16)}...
 </code>
 </div>
 </div>
 </aside>
 );
}
