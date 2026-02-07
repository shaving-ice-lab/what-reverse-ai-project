"use client";

/**
 * VariableSelectComponent - Minimalist Style
 */

import { useState, useMemo } from "react";
import {
 Popover,
 PopoverContent,
 PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
 Braces,
 Search,
 Hash,
 Type,
 ToggleLeft,
 Box,
 List,
 Asterisk,
 Clock,
} from "lucide-react";
import { useWorkflowStore } from "@/stores/useWorkflowStore";
import { cn } from "@/lib/utils";

interface Variable {
 id: string;
 name: string;
 path: string;
 type: string;
 source: "node" | "global" | "system";
 sourceNodeId?: string;
 sourceNodeLabel?: string;
}

interface VariableSelectorProps {
 onSelect: (variable: Variable) => void;
 currentNodeId?: string;
 className?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
 string: <Type className="h-3 w-3" />,
 number: <Hash className="h-3 w-3" />,
 boolean: <ToggleLeft className="h-3 w-3" />,
 object: <Box className="h-3 w-3" />,
 array: <List className="h-3 w-3" />,
 any: <Asterisk className="h-3 w-3" />,
};

const typeColors: Record<string, string> = {
 string: "bg-brand-200 text-brand-500",
 number: "bg-warning-200 text-warning",
 boolean: "bg-surface-200 text-foreground-muted",
 object: "bg-surface-200 text-foreground-muted",
 array: "bg-surface-200 text-foreground-muted",
 any: "bg-surface-200 text-foreground-muted",
};

const systemVariables: Variable[] = [
 {
 id: "sys_execution_id",
 name: "Execute ID",
 path: "system.executionId",
 type: "string",
 source: "system",
 },
 {
 id: "sys_timestamp",
 name: "CurrentTime",
 path: "system.timestamp",
 type: "number",
 source: "system",
 },
 {
 id: "sys_datetime",
 name: "CurrentDate & Time",
 path: "system.datetime",
 type: "string",
 source: "system",
 },
];

export function VariableSelector({
 onSelect,
 currentNodeId,
 className,
}: VariableSelectorProps) {
 const [open, setOpen] = useState(false);
 const [searchQuery, setSearchQuery] = useState("");
 const { nodes, edges } = useWorkflowStore();

 const nodeVariables = useMemo(() => {
 const variables: Variable[] = [];

 if (!currentNodeId) {
 nodes.forEach((node) => {
 if (node.data.outputs) {
 node.data.outputs.forEach((output) => {
 variables.push({
 id: `${node.id}_${output.id}`,
 name: output.name,
 path: `{{${node.data.label}.${output.name}}}`,
 type: output.type,
 source: "node",
 sourceNodeId: node.id,
 sourceNodeLabel: node.data.label,
 });
 });
 }
 });
 return variables;
 }

 const findUpstreamNodes = (nodeId: string, visited = new Set<string>()): string[] => {
 if (visited.has(nodeId)) return [];
 visited.add(nodeId);

 const upstreamNodeIds: string[] = [];
 edges.forEach((edge) => {
 if (edge.target === nodeId) {
 upstreamNodeIds.push(edge.source);
 upstreamNodeIds.push(...findUpstreamNodes(edge.source, visited));
 }
 });

 return upstreamNodeIds;
 };

 const upstreamNodeIds = findUpstreamNodes(currentNodeId);

 upstreamNodeIds.forEach((nodeId) => {
 const node = nodes.find((n) => n.id === nodeId);
 if (node && node.data.outputs) {
 node.data.outputs.forEach((output) => {
 variables.push({
 id: `${node.id}_${output.id}`,
 name: output.name,
 path: `{{${node.data.label}.${output.name}}}`,
 type: output.type,
 source: "node",
 sourceNodeId: node.id,
 sourceNodeLabel: node.data.label,
 });
 });
 }
 });

 return variables;
 }, [nodes, edges, currentNodeId]);

 const filteredVariables = useMemo(() => {
 const query = searchQuery.toLowerCase();
 if (!query) {
 return {
 nodeVars: nodeVariables,
 systemVars: systemVariables,
 };
 }

 return {
 nodeVars: nodeVariables.filter(
 (v) =>
 v.name.toLowerCase().includes(query) ||
 v.path.toLowerCase().includes(query) ||
 v.sourceNodeLabel?.toLowerCase().includes(query)
 ),
 systemVars: systemVariables.filter(
 (v) =>
 v.name.toLowerCase().includes(query) ||
 v.path.toLowerCase().includes(query)
 ),
 };
 }, [nodeVariables, searchQuery]);

 const handleSelect = (variable: Variable) => {
 onSelect(variable);
 setOpen(false);
 };

 return (
 <Popover open={open} onOpenChange={setOpen}>
 <PopoverTrigger asChild>
 <Button
 variant="outline"
 size="sm"
 className={cn("gap-1.5", className)}
 >
 <Braces className="h-3.5 w-3.5" />
 Variable
 </Button>
 </PopoverTrigger>
 <PopoverContent className="w-72 p-0" align="end">
 <div className="p-2 border-b border-border">
 <div className="relative">
 <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
 <Input
 placeholder="SearchVariable..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-8 h-8"
 />
 </div>
 </div>

 <ScrollArea className="h-[280px]">
 {filteredVariables.nodeVars.length > 0 && (
 <div className="p-2">
 <div className="px-2 py-1 text-xs font-medium text-foreground-muted uppercase tracking-wider">
 NodeOutput
 </div>
 <div className="space-y-0.5">
 {filteredVariables.nodeVars.map((variable) => (
 <button
 key={variable.id}
 onClick={() => handleSelect(variable)}
 className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-left hover:bg-surface-200"
 >
 <div className={cn("p-1 rounded", typeColors[variable.type] || typeColors.any)}>
 {typeIcons[variable.type] || typeIcons.any}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-1.5">
 <span className="text-sm font-medium truncate">{variable.name}</span>
 <Badge variant="secondary" className="text-[10px]">
 {variable.sourceNodeLabel}
 </Badge>
 </div>
 <p className="text-xs text-foreground-muted font-mono truncate">
 {variable.path}
 </p>
 </div>
 </button>
 ))}
 </div>
 </div>
 )}

 {filteredVariables.systemVars.length > 0 && (
 <div className="p-2 border-t border-border">
 <div className="px-2 py-1 text-xs font-medium text-foreground-muted uppercase tracking-wider flex items-center gap-1">
 <Clock className="h-3 w-3" />
 SystemVariable
 </div>
 <div className="space-y-0.5">
 {filteredVariables.systemVars.map((variable) => (
 <button
 key={variable.id}
 onClick={() => handleSelect(variable)}
 className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-left hover:bg-surface-200"
 >
 <div className={cn("p-1 rounded", typeColors[variable.type] || typeColors.any)}>
 {typeIcons[variable.type] || typeIcons.any}
 </div>
 <div className="flex-1 min-w-0">
 <span className="text-sm font-medium">{variable.name}</span>
 <p className="text-xs text-foreground-muted font-mono">
 {variable.path}
 </p>
 </div>
 </button>
 ))}
 </div>
 </div>
 )}

 {filteredVariables.nodeVars.length === 0 &&
 filteredVariables.systemVars.length === 0 && (
 <div className="p-6 text-center text-foreground-muted">
 <div className="w-10 h-10 mx-auto mb-2 rounded-md bg-surface-200 flex items-center justify-center">
 <Braces className="h-5 w-5 opacity-50" />
 </div>
 <p className="text-sm">NotoVariable</p>
 <p className="text-xs mt-0.5">ConnectonNodewithFetchVariable</p>
 </div>
 )}
 </ScrollArea>

 <div className="p-2 border-t border-border bg-surface-200">
 <p className="text-xs text-foreground-muted text-center">
 Usage <code className="font-mono bg-surface-200 px-1 py-0.5 rounded border border-border">{"{{Variable}}"}</code> use
 </p>
 </div>
 </PopoverContent>
 </Popover>
 );
}
