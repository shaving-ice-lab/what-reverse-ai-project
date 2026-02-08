"use client";

/**
 * Condition Builder Component - Minimalist Style
 */

import {
 Plus,
 Trash2,
 GripVertical,
 Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { VariableSelector } from "./variable-selector";
import { generateId } from "@/lib/utils";
import { cn } from "@/lib/utils";

const operators = [
 { value: "eq", label: "Equals", symbol: "==" },
 { value: "neq", label: "Not equals", symbol: "!=" },
 { value: "gt", label: "Greater than", symbol: ">" },
 { value: "gte", label: "Greater than or equal", symbol: ">=" },
    { value: "lt", label: "Less than", symbol: "<" },
    { value: "lte", label: "Less than or equal", symbol: "<=" },
 { value: "contains", label: "Contains", symbol: "∋" },
 { value: "notContains", label: "Does not contain", symbol: "∌" },
 { value: "startsWith", label: "Starts with", symbol: "^" },
 { value: "endsWith", label: "Ends with", symbol: "$" },
    { value: "matches", label: "Matches regex", symbol: "~" },
 { value: "empty", label: "Is empty", symbol: "∅" },
 { value: "notEmpty", label: "Is not empty", symbol: "≠∅" },
];

export interface Condition {
 id: string;
 left: string;
 operator: string;
 right: string;
}

export interface ConditionGroup {
 id: string;
 conditions: Condition[];
 logic: "and" | "or";
}

interface ConditionBuilderProps {
 groups: ConditionGroup[];
 logic: "and" | "or";
 currentNodeId?: string;
 onChange: (groups: ConditionGroup[], logic: "and" | "or") => void;
}

function ConditionRow({
 condition,
 currentNodeId,
 onUpdate,
 onDelete,
 canDelete,
}: {
 condition: Condition;
 currentNodeId?: string;
 onUpdate: (condition: Condition) => void;
 onDelete: () => void;
 canDelete: boolean;
}) {
 const isUnaryOperator = ["empty", "notEmpty"].includes(condition.operator);

 const handleVariableSelect = (field: "left" | "right", path: string) => {
 onUpdate({ ...condition, [field]: path });
 };

 return (
 <div className="flex items-center gap-2 p-2 rounded-md border border-border bg-surface-200 group">
 <GripVertical className="h-4 w-4 text-foreground-muted cursor-grab" />
 
 <div className="flex-1 relative">
 <Input
 value={condition.left}
 onChange={(e) => onUpdate({ ...condition, left: e.target.value })}
 placeholder="{{Variable}} or value"
 className="h-8 pr-8 font-mono text-sm"
 />
 <div className="absolute right-1 top-1/2 -translate-y-1/2">
 <VariableSelector
 currentNodeId={currentNodeId}
 onSelect={(v) => handleVariableSelect("left", v.path)}
 className="h-6 px-1.5"
 />
 </div>
 </div>

 <Select
 value={condition.operator}
 onValueChange={(value) => onUpdate({ ...condition, operator: value })}
 >
 <SelectTrigger className="w-[120px] h-8">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {operators.map((op) => (
 <SelectItem key={op.value} value={op.value}>
 <span className="flex items-center gap-2">
 <code className="text-xs px-1 py-0.5 rounded bg-surface-200 font-mono">{op.symbol}</code>
 {op.label}
 </span>
 </SelectItem>
 ))}
 </SelectContent>
 </Select>

 {!isUnaryOperator && (
 <div className="flex-1 relative">
 <Input
 value={condition.right}
 onChange={(e) => onUpdate({ ...condition, right: e.target.value })}
 placeholder="{{Variable}} or value"
 className="h-8 pr-8 font-mono text-sm"
 />
 <div className="absolute right-1 top-1/2 -translate-y-1/2">
 <VariableSelector
 currentNodeId={currentNodeId}
 onSelect={(v) => handleVariableSelect("right", v.path)}
 className="h-6 px-1.5"
 />
 </div>
 </div>
 )}

 <Button
 variant="ghost"
 size="icon"
 className={cn(
 "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
 "hover:bg-destructive-200 hover:text-destructive",
 !canDelete && "invisible"
 )}
 onClick={onDelete}
 disabled={!canDelete}
 >
 <Trash2 className="h-3.5 w-3.5" />
 </Button>
 </div>
 );
}

function ConditionGroupEditor({
 group,
 groupIndex,
 currentNodeId,
 onUpdate,
 onDelete,
 canDelete,
}: {
 group: ConditionGroup;
 groupIndex: number;
 currentNodeId?: string;
 onUpdate: (group: ConditionGroup) => void;
 onDelete: () => void;
 canDelete: boolean;
}) {
 const updateCondition = (index: number, condition: Condition) => {
 const newConditions = [...group.conditions];
 newConditions[index] = condition;
 onUpdate({ ...group, conditions: newConditions });
 };

 const deleteCondition = (index: number) => {
 const newConditions = group.conditions.filter((_, i) => i !== index);
 onUpdate({ ...group, conditions: newConditions });
 };

 const addCondition = () => {
 const newCondition: Condition = {
 id: generateId("cond"),
 left: "",
 operator: "eq",
 right: "",
 };
 onUpdate({ ...group, conditions: [...group.conditions, newCondition] });
 };

 return (
 <div className="rounded-lg p-3 space-y-2 border border-border bg-surface-100">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Badge variant="secondary" className="font-mono px-2">
 group {groupIndex + 1}
 </Badge>
 <Select
 value={group.logic}
 onValueChange={(value: "and" | "or") =>
 onUpdate({ ...group, logic: value })
 }
 >
 <SelectTrigger className="w-[80px] h-7 text-xs font-medium">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="and">AND</SelectItem>
 <SelectItem value="or">OR</SelectItem>
 </SelectContent>
 </Select>
 </div>
 {canDelete && (
 <Button 
 variant="ghost" 
 size="icon" 
 className="h-7 w-7 hover:bg-destructive-200 hover:text-destructive" 
 onClick={onDelete}
 >
 <Trash2 className="h-3.5 w-3.5" />
 </Button>
 )}
 </div>

 <div className="space-y-2">
 {group.conditions.map((condition, index) => (
 <div key={condition.id}>
 {index > 0 && (
 <div className="flex items-center gap-2 py-1.5 px-2">
 <div className="flex-1 border-t border-border" />
 <span className="text-xs font-medium px-2 py-0.5 rounded bg-warning-200 text-warning">
 {group.logic.toUpperCase()}
 </span>
 <div className="flex-1 border-t border-border" />
 </div>
 )}
 <ConditionRow
 condition={condition}
 currentNodeId={currentNodeId}
 onUpdate={(cond) => updateCondition(index, cond)}
 onDelete={() => deleteCondition(index)}
 canDelete={group.conditions.length > 1}
 />
 </div>
 ))}
 </div>

 <Button
 variant="outline"
 size="sm"
 className="w-full"
 onClick={addCondition}
 >
 <Plus className="h-3.5 w-3.5 mr-1" />
Add Condition
    </Button>
 </div>
 );
}

export function ConditionBuilder({
 groups,
 logic,
 currentNodeId,
 onChange,
}: ConditionBuilderProps) {
 const updateGroup = (index: number, group: ConditionGroup) => {
 const newGroups = [...groups];
 newGroups[index] = group;
 onChange(newGroups, logic);
 };

 const deleteGroup = (index: number) => {
 const newGroups = groups.filter((_, i) => i !== index);
 onChange(newGroups, logic);
 };

 const addGroup = () => {
 const newGroup: ConditionGroup = {
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
 };
 onChange([...groups, newGroup], logic);
 };

 return (
 <div className="space-y-2">
 {groups.map((group, index) => (
 <div key={group.id}>
 {index > 0 && (
 <div className="flex items-center gap-2 py-2">
 <div className="flex-1 border-t border-dashed border-border" />
 <Select
 value={logic}
 onValueChange={(value: "and" | "or") => onChange(groups, value)}
 >
 <SelectTrigger className="w-[80px] h-7 text-xs font-medium border-dashed">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="and">AND</SelectItem>
 <SelectItem value="or">OR</SelectItem>
 </SelectContent>
 </Select>
 <div className="flex-1 border-t border-dashed border-border" />
 </div>
 )}
 <ConditionGroupEditor
 group={group}
 groupIndex={index}
 currentNodeId={currentNodeId}
 onUpdate={(grp) => updateGroup(index, grp)}
 onDelete={() => deleteGroup(index)}
 canDelete={groups.length > 1}
 />
 </div>
 ))}

 <Button
 variant="outline"
 size="sm"
 className="w-full border-dashed"
 onClick={addGroup}
 >
 <Plus className="h-3.5 w-3.5 mr-1" />
 Add Condition Group
 </Button>

 {groups.length > 0 && (
 <div className="mt-3 p-3 rounded-md border border-border bg-surface-200">
 <div className="text-xs font-medium text-foreground-muted mb-1.5 flex items-center gap-1">
 <Code2 className="h-3.5 w-3.5" />
 Condition Preview
 </div>
 <code className="text-xs break-all font-mono p-2 block rounded bg-surface-100 border border-border">
 {groups.map((group, gi) => {
 const groupExpr = group.conditions
 .map((c) => {
 const op = operators.find((o) => o.value === c.operator);
 if (["empty", "notEmpty"].includes(c.operator)) {
 return `${c.left} ${op?.symbol || c.operator}`;
 }
 return `${c.left} ${op?.symbol || c.operator} ${c.right}`;
 })
 .join(` ${group.logic.toUpperCase()} `);
 return gi > 0 ? ` ${logic.toUpperCase()} (${groupExpr})` : `(${groupExpr})`;
 }).join("")}
 </code>
 </div>
 )}
 </div>
 );
}
