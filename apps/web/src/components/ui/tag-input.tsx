"use client";

/**
 * TagsInputComponent
 * Used forInputandManagemultipleTags
 */

import { useState, useRef, KeyboardEvent } from "react";
import { X, Plus, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

// ============================================
// TagsInputComponent
// ============================================

interface TagInputProps {
 value: string[];
 onChange: (tags: string[]) => void;
 placeholder?: string;
 maxTags?: number;
 maxLength?: number;
 allowDuplicates?: boolean;
 suggestions?: string[];
 disabled?: boolean;
 className?: string;
}

export function TagInput({
 value = [],
 onChange,
 placeholder = "InputTagsafterby Enter",
 maxTags,
 maxLength = 20,
 allowDuplicates = false,
 suggestions = [],
 disabled = false,
 className,
}: TagInputProps) {
 const [inputValue, setInputValue] = useState("");
 const [isFocused, setIsFocused] = useState(false);
 const inputRef = useRef<HTMLInputElement>(null);

 const handleAddTag = (tag: string) => {
 const trimmedTag = tag.trim();
 if (!trimmedTag) return;
 if (maxTags && value.length >= maxTags) return;
 if (!allowDuplicates && value.includes(trimmedTag)) return;
 if (maxLength && trimmedTag.length > maxLength) return;

 onChange([...value, trimmedTag]);
 setInputValue("");
 };

 const handleRemoveTag = (index: number) => {
 const newTags = value.filter((_, i) => i !== index);
 onChange(newTags);
 };

 const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
 if (e.key === "Enter") {
 e.preventDefault();
 handleAddTag(inputValue);
 } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
 handleRemoveTag(value.length - 1);
 }
 };

 const handleContainerClick = () => {
 inputRef.current?.focus();
 };

 const filteredSuggestions = suggestions.filter(
 (s) =>
 s.toLowerCase().includes(inputValue.toLowerCase()) &&
 !value.includes(s)
 );

 const canAddMore = !maxTags || value.length < maxTags;

 return (
 <div className={cn("relative", className)}>
 {/* mainInputRegion */}
 <div
 onClick={handleContainerClick}
 className={cn(
 "min-h-[44px] p-2 rounded-xl border transition-all cursor-text",
 "flex flex-wrap items-center gap-2",
 isFocused
 ? "border-primary ring-2 ring-brand-500/20"
 : "border-border hover:border-primary/30",
 disabled && "opacity-50 cursor-not-allowed"
 )}
 >
 {/* alreadyAdd'sTags */}
 {value.map((tag, index) => (
 <Badge
 key={index}
 variant="secondary"
 className="gap-1 px-2 py-1 text-sm bg-primary/10 text-primary hover:bg-primary/20"
 >
 {tag}
 {!disabled && (
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 handleRemoveTag(index);
 }}
 className="ml-1 hover:text-foreground transition-colors"
 >
 <X className="w-3 h-3" />
 </button>
 )}
 </Badge>
 ))}

 {/* Input */}
 {canAddMore && !disabled && (
 <input
 ref={inputRef}
 type="text"
 value={inputValue}
 onChange={(e) => setInputValue(e.target.value)}
 onKeyDown={handleKeyDown}
 onFocus={() => setIsFocused(true)}
 onBlur={() => setIsFocused(false)}
 placeholder={value.length === 0 ? placeholder : ""}
 className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-foreground placeholder:text-foreground-light"
 />
 )}
 </div>

 {/* Suggestiondown */}
 {isFocused && inputValue && filteredSuggestions.length > 0 && (
 <div className="absolute z-10 w-full mt-1 p-1 rounded-xl border border-border bg-card shadow-lg">
 {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
 <button
 key={index}
 type="button"
 onMouseDown={(e) => {
 e.preventDefault();
 handleAddTag(suggestion);
 }}
 className="w-full px-3 py-2 text-left text-sm rounded-lg hover:bg-surface-200 transition-colors flex items-center gap-2"
 >
 <Tag className="w-3 h-3 text-foreground-light" />
 {suggestion}
 </button>
 ))}
 </div>
 )}

 {/* LimitTip */}
 {maxTags && (
 <p className="text-xs text-foreground-light mt-1">
 {value.length}/{maxTags} Tags
 </p>
 )}
 </div>
 );
}

// ============================================
// SimpleTagsShowcase
// ============================================

interface TagListProps {
 tags: string[];
 onRemove?: (index: number) => void;
 variant?: "default" | "primary" | "secondary";
 size?: "sm" | "md";
 className?: string;
}

export function TagList({
 tags,
 onRemove,
 variant = "default",
 size = "md",
 className,
}: TagListProps) {
 const getVariantClasses = () => {
 switch (variant) {
 case "primary":
 return "bg-primary/10 text-primary";
 case "secondary":
 return "bg-surface-200 text-foreground-light";
 default:
 return "bg-surface-200 text-foreground";
 }
 };

 const sizeClasses = {
 sm: "px-2 py-0.5 text-xs",
 md: "px-3 py-1 text-sm",
 };

 return (
 <div className={cn("flex flex-wrap gap-2", className)}>
 {tags.map((tag, index) => (
 <span
 key={index}
 className={cn(
 "inline-flex items-center gap-1 rounded-full font-medium",
 getVariantClasses(),
 sizeClasses[size]
 )}
 >
 {tag}
 {onRemove && (
 <button
 type="button"
 onClick={() => onRemove(index)}
 className="ml-0.5 hover:opacity-70 transition-opacity"
 >
 <X className="w-3 h-3" />
 </button>
 )}
 </span>
 ))}
 </div>
 );
}

// ============================================
// OptionalTagsgroup
// ============================================

interface SelectableTagsProps {
 options: string[];
 selected: string[];
 onChange: (selected: string[]) => void;
 maxSelections?: number;
 className?: string;
}

export function SelectableTags({
 options,
 selected,
 onChange,
 maxSelections,
 className,
}: SelectableTagsProps) {
 const toggleTag = (tag: string) => {
 if (selected.includes(tag)) {
 onChange(selected.filter((t) => t !== tag));
 } else {
 if (maxSelections && selected.length >= maxSelections) return;
 onChange([...selected, tag]);
 }
 };

 return (
 <div className={cn("flex flex-wrap gap-2", className)}>
 {options.map((tag) => {
 const isSelected = selected.includes(tag);
 const isDisabled = !isSelected && maxSelections && selected.length >= maxSelections;

 return (
 <button
 key={tag}
 type="button"
 onClick={() => !isDisabled && toggleTag(tag)}
 disabled={isDisabled}
 className={cn(
 "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
 isSelected
 ? "bg-primary text-primary-foreground"
 : "bg-surface-200 text-foreground-light hover:text-foreground hover:bg-surface-200/80",
 isDisabled && "opacity-50 cursor-not-allowed"
 )}
 >
 {tag}
 </button>
 );
 })}
 </div>
 );
}

// ============================================
// Icon'sTags
// ============================================

interface IconTag {
 label: string;
 icon?: typeof Tag;
 color?: string;
 bgColor?: string;
}

interface IconTagListProps {
 tags: IconTag[];
 onRemove?: (index: number) => void;
 className?: string;
}

export function IconTagList({
 tags,
 onRemove,
 className,
}: IconTagListProps) {
 return (
 <div className={cn("flex flex-wrap gap-2", className)}>
 {tags.map((tag, index) => {
 const Icon = tag.icon || Tag;
 return (
 <span
 key={index}
 className={cn(
 "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium",
 tag.bgColor || "bg-surface-200",
 tag.color || "text-foreground"
 )}
 >
 <Icon className="w-3.5 h-3.5" />
 {tag.label}
 {onRemove && (
 <button
 type="button"
 onClick={() => onRemove(index)}
 className="ml-1 hover:opacity-70 transition-opacity"
 >
 <X className="w-3 h-3" />
 </button>
 )}
 </span>
 );
 })}
 </div>
 );
}
