"use client";

/**
 * AI ParameterSettingsPanelComponent
 * Used forConfig AI ResponseParameter
 */

import { useState, useEffect } from "react";
import {
 Settings,
 Thermometer,
 Hash,
 Percent,
 ChevronDown,
 ChevronUp,
 RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import {
 Collapsible,
 CollapsibleContent,
 CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
 Tooltip,
 TooltipContent,
 TooltipProvider,
 TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AIParameters } from "@/types/conversation";

// DefaultParametervalue
const DEFAULT_PARAMS: Required<AIParameters> = {
 temperature: 1.0,
 maxTokens: 4096,
 topP: 1.0,
 topK: 0,
 frequencyPenalty: 0.0,
 presencePenalty: 0.0,
};

// ParameterDescription
const PARAM_DESCRIPTIONS = {
 temperature: "ControlOutput'sRandom.'svaluemakeOutputmoreRandom, 'svaluemakeOutputmoreandOK.",
 maxTokens: "LimitGenerate'sMaximum token Count.",
 topP: "SamplingParameter.ControlConsider's token ratevalue.",
 topK: "Top-K Sampling.LimiteachtimesConsiderratemost's K token.0 RepresentDisable.",
 frequencyPenalty: "ratePenalty.Reducere-'sAppearrate.currentlyvaluefewre-, valueIncreasere-.",
 presencePenalty: "atPenalty.Modelnew.currentlyvalueIncreasemultiplestyle, valuefewmultiplestyle.",
};

interface AISettingsPanelProps {
 params: AIParameters;
 onChange: (params: AIParameters) => void;
 className?: string;
 compact?: boolean;
}

export function AISettingsPanel({
 params,
 onChange,
 className,
 compact = false,
}: AISettingsPanelProps) {
 const [isOpen, setIsOpen] = useState(!compact);
 const [localParams, setLocalParams] = useState<AIParameters>({
 ...DEFAULT_PARAMS,
 ...params,
 });

 useEffect(() => {
 setLocalParams({ ...DEFAULT_PARAMS, ...params });
 }, [params]);

 const handleChange = (key: keyofAIParameters, value: number) => {
 const newParams = { ...localParams, [key]: value };
 setLocalParams(newParams);
 onChange(newParams);
 };

 const resetToDefaults = () => {
 setLocalParams(DEFAULT_PARAMS);
 onChange(DEFAULT_PARAMS);
 };

 const content = (
 <div className="space-y-5">
 {/* Temperature */}
 <TooltipProvider>
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <Tooltip>
 <TooltipTrigger asChild>
 <Label className="flex items-center gap-2 cursor-help text-[12px] text-foreground">
 <Thermometer className="w-4 h-4 text-brand-500" />
 Temperature
 </Label>
 </TooltipTrigger>
 <TooltipContent side="right" className="max-w-[250px] bg-surface-100 border-border text-foreground">
 {PARAM_DESCRIPTIONS.temperature}
 </TooltipContent>
 </Tooltip>
 <span className="text-sm text-foreground-light">
 {localParams.temperature?.toFixed(2)}
 </span>
 </div>
 <Slider
 value={[localParams.temperature ?? 1.0]}
 onValueChange={([value]) => handleChange("temperature", value)}
 min={0}
 max={2}
 step={0.01}
 className="w-full"
 />
 </div>

 {/* Max Tokens */}
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <Tooltip>
 <TooltipTrigger asChild>
 <Label className="flex items-center gap-2 cursor-help text-[12px] text-foreground">
 <Hash className="w-4 h-4 text-foreground-muted" />
 Max Tokens
 </Label>
 </TooltipTrigger>
 <TooltipContent side="right" className="max-w-[250px] bg-surface-100 border-border text-foreground">
 {PARAM_DESCRIPTIONS.maxTokens}
 </TooltipContent>
 </Tooltip>
 </div>
 <Input
 type="number"
 value={localParams.maxTokens ?? 4096}
 onChange={(e) => handleChange("maxTokens", parseInt(e.target.value) || 4096)}
 min={1}
 max={128000}
 inputSize="sm"
 />
 </div>

 {/* Top P */}
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <Tooltip>
 <TooltipTrigger asChild>
 <Label className="flex items-center gap-2 cursor-help text-[12px] text-foreground">
 <Percent className="w-4 h-4 text-foreground-muted" />
 Top P
 </Label>
 </TooltipTrigger>
 <TooltipContent side="right" className="max-w-[250px] bg-surface-100 border-border text-foreground">
 {PARAM_DESCRIPTIONS.topP}
 </TooltipContent>
 </Tooltip>
 <span className="text-sm text-foreground-light">
 {localParams.topP?.toFixed(2)}
 </span>
 </div>
 <Slider
 value={[localParams.topP ?? 1.0]}
 onValueChange={([value]) => handleChange("topP", value)}
 min={0}
 max={1}
 step={0.01}
 className="w-full"
 />
 </div>

 {/* Top K */}
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <Tooltip>
 <TooltipTrigger asChild>
 <Label className="flex items-center gap-2 cursor-help text-[12px] text-foreground">
 <Hash className="w-4 h-4 text-foreground-muted" />
 Top K
 </Label>
 </TooltipTrigger>
 <TooltipContent side="right" className="max-w-[250px] bg-surface-100 border-border text-foreground">
 {PARAM_DESCRIPTIONS.topK}
 </TooltipContent>
 </Tooltip>
 </div>
 <Input
 type="number"
 value={localParams.topK ?? 0}
 onChange={(e) => handleChange("topK", parseInt(e.target.value) || 0)}
 min={0}
 max={100}
 inputSize="sm"
 />
 </div>

 {/* Frequency Penalty */}
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <Tooltip>
 <TooltipTrigger asChild>
 <Label className="flex items-center gap-2 cursor-help text-[12px] text-foreground">
 ratePenalty
 </Label>
 </TooltipTrigger>
 <TooltipContent side="right" className="max-w-[250px] bg-surface-100 border-border text-foreground">
 {PARAM_DESCRIPTIONS.frequencyPenalty}
 </TooltipContent>
 </Tooltip>
 <span className="text-sm text-foreground-light">
 {localParams.frequencyPenalty?.toFixed(2)}
 </span>
 </div>
 <Slider
 value={[localParams.frequencyPenalty ?? 0]}
 onValueChange={([value]) => handleChange("frequencyPenalty", value)}
 min={-2}
 max={2}
 step={0.01}
 className="w-full"
 />
 </div>

 {/* Presence Penalty */}
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <Tooltip>
 <TooltipTrigger asChild>
 <Label className="flex items-center gap-2 cursor-help text-[12px] text-foreground">
 atPenalty
 </Label>
 </TooltipTrigger>
 <TooltipContent side="right" className="max-w-[250px] bg-surface-100 border-border text-foreground">
 {PARAM_DESCRIPTIONS.presencePenalty}
 </TooltipContent>
 </Tooltip>
 <span className="text-sm text-foreground-light">
 {localParams.presencePenalty?.toFixed(2)}
 </span>
 </div>
 <Slider
 value={[localParams.presencePenalty ?? 0]}
 onValueChange={([value]) => handleChange("presencePenalty", value)}
 min={-2}
 max={2}
 step={0.01}
 className="w-full"
 />
 </div>
 </TooltipProvider>

 {/* ResetButton */}
 <Button
 variant="outline"
 size="sm"
 onClick={resetToDefaults}
 className="w-full text-foreground-light hover:text-foreground"
 >
 <RotateCcw className="w-4 h-4 mr-2" />
 RestoreDefaultvalue
 </Button>
 </div>
 );

 if (compact) {
 return (
 <Collapsible
 open={isOpen}
 onOpenChange={setIsOpen}
 className={cn("rounded-lg border border-border bg-surface-100 p-4", className)}
 >
 <CollapsibleTrigger asChild>
 <Button
 variant="ghost"
 className="w-full flex items-center justify-between p-0 h-auto text-foreground hover:text-foreground hover:bg-transparent"
 >
 <span className="flex items-center gap-2 text-sm font-medium">
 <Settings className="w-4 h-4" />
 AI ParameterSettings
 </span>
 {isOpen ? (
 <ChevronUp className="w-4 h-4" />
 ) : (
 <ChevronDown className="w-4 h-4" />
 )}
 </Button>
 </CollapsibleTrigger>
 <CollapsibleContent className="pt-4">{content}</CollapsibleContent>
 </Collapsible>
 );
 }

 return (
 <div className={cn("space-y-4", className)}>
 <div className="flex items-center gap-2 text-sm font-medium">
 <Settings className="w-4 h-4" />
 AI ParameterSettings
 </div>
 {content}
 </div>
 );
}

// ExportDefaultParameter
export { DEFAULT_PARAMS as DEFAULT_AI_PARAMS };
