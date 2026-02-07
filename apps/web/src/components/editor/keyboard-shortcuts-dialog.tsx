"use client";

/**
 * ShortcutkeyHelpDialog - Minimalist Style
 */

import { useState, useEffect } from "react";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
 Keyboard,
 Save,
 Undo2,
 Redo2,
 Copy,
 ClipboardPaste,
 Trash2,
 MousePointer2,
 ZoomIn,
 ZoomOut,
 Maximize2,
 Grid3X3,
 Search,
} from "lucide-react";

interface ShortcutItem {
 keys: string[];
 description: string;
 icon?: React.ReactNode;
}

interface ShortcutGroup {
 title: string;
 shortcuts: ShortcutItem[];
}

const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
const cmdKey = isMac ? "⌘" : "Ctrl";

const shortcutGroups: ShortcutGroup[] = [
 {
 title: "FileAction",
 shortcuts: [
 { keys: [cmdKey, "S"], description: "SaveWorkflow", icon: <Save className="h-4 w-4" /> },
 { keys: [cmdKey, "Shift", "S"], description: "as", icon: <Save className="h-4 w-4" /> },
 ],
 },
 {
 title: "EditAction",
 shortcuts: [
 { keys: [cmdKey, "Z"], description: "Undo", icon: <Undo2 className="h-4 w-4" /> },
 { keys: [cmdKey, "Shift", "Z"], description: "Redo", icon: <Redo2 className="h-4 w-4" /> },
 { keys: [cmdKey, "C"], description: "CopyselectNode", icon: <Copy className="h-4 w-4" /> },
 { keys: [cmdKey, "V"], description: "PasteNode", icon: <ClipboardPaste className="h-4 w-4" /> },
 { keys: [cmdKey, "D"], description: "CopyandPaste", icon: <Copy className="h-4 w-4" /> },
 { keys: ["Delete"], description: "DeleteselectNode", icon: <Trash2 className="h-4 w-4" /> },
 { keys: [cmdKey, "A"], description: "Select AllNode", icon: <MousePointer2 className="h-4 w-4" /> },
 ],
 },
 {
 title: "ViewControl",
 shortcuts: [
 { keys: [cmdKey, "+"], description: "large", icon: <ZoomIn className="h-4 w-4" /> },
 { keys: [cmdKey, "-"], description: "small", icon: <ZoomOut className="h-4 w-4" /> },
 { keys: [cmdKey, "0"], description: "ResetZoom", icon: <Maximize2 className="h-4 w-4" /> },
 { keys: [cmdKey, "1"], description: "shouldCanvas", icon: <Maximize2 className="h-4 w-4" /> },
 { keys: [cmdKey, "G"], description: "SwitchGrid", icon: <Grid3X3 className="h-4 w-4" /> },
 ],
 },
 {
 title: "NodeAction",
 shortcuts: [
 { keys: [cmdKey, "F"], description: "SearchNode", icon: <Search className="h-4 w-4" /> },
 { keys: ["Enter"], description: "EditselectNode", icon: <MousePointer2 className="h-4 w-4" /> },
 { keys: ["Escape"], description: "Deselect / ClosePanel", icon: <MousePointer2 className="h-4 w-4" /> },
 { keys: ["Tab"], description: "Switchtodown1Node", icon: <MousePointer2 className="h-4 w-4" /> },
 ],
 },
 {
 title: "CanvasNavigation",
 shortcuts: [
 { keys: ["Space", "Drag"], description: "PanCanvas", icon: <MousePointer2 className="h-4 w-4" /> },
 { keys: ["Scroll Wheel"], description: "ondownScroll", icon: <MousePointer2 className="h-4 w-4" /> },
 { keys: [cmdKey, "Scroll Wheel"], description: "ZoomCanvas", icon: <ZoomIn className="h-4 w-4" /> },
 { keys: ["Shift", "Scroll Wheel"], description: "leftrightScroll", icon: <MousePointer2 className="h-4 w-4" /> },
 ],
 },
];

function KeyBadge({ children }: { children: React.ReactNode }) {
 return (
 <kbd className={cn(
 "inline-flex items-center justify-center min-w-[24px] h-6 px-1.5",
 "text-xs font-mono font-medium",
 "bg-surface-200 border border-border",
 "rounded-md"
 )}>
 {children}
 </kbd>
 );
}

function ShortcutRow({ shortcut }: { shortcut: ShortcutItem }) {
 return (
 <div className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-surface-200">
 <div className="flex items-center gap-2">
 {shortcut.icon && (
 <span className="flex items-center justify-center w-6 h-6 rounded text-foreground-muted">
 {shortcut.icon}
 </span>
 )}
 <span className="text-sm">{shortcut.description}</span>
 </div>
 <div className="flex items-center gap-1">
 {shortcut.keys.map((key, index) => (
 <span key={index} className="flex items-center">
 <KeyBadge>{key}</KeyBadge>
 {index < shortcut.keys.length - 1 && (
 <span className="mx-0.5 text-foreground-muted text-xs">+</span>
 )}
 </span>
 ))}
 </div>
 </div>
 );
}

interface KeyboardShortcutsDialogProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({
 open,
 onOpenChange,
}: KeyboardShortcutsDialogProps) {
 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="max-w-2xl max-h-[85vh]">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2">
 <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-200">
 <Keyboard className="h-4 w-4" />
 </div>
 ShortcutkeyHelp
 </DialogTitle>
 <DialogDescription>
 UsageShortcutkeycanwithmoreEfficientActionEdit
 </DialogDescription>
 </DialogHeader>

 <ScrollArea className="h-[60vh] pr-4">
 <div className="space-y-4">
 {shortcutGroups.map((group) => (
 <div key={group.title} className="p-3 rounded-lg border border-border">
 <h3 className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-2 px-2">
 {group.title}
 </h3>
 <div className="space-y-0.5">
 {group.shortcuts.map((shortcut, index) => (
 <ShortcutRow key={index} shortcut={shortcut} />
 ))}
 </div>
 </div>
 ))}
 </div>
 </ScrollArea>

 <div className="pt-3 border-t border-border text-center">
 <p className="text-xs text-foreground-muted flex items-center justify-center gap-1">
 by <KeyBadge>?</KeyBadge> or <KeyBadge>{cmdKey}</KeyBadge> <span>+</span> <KeyBadge>/</KeyBadge> OpenthisHelp
 </p>
 </div>
 </DialogContent>
 </Dialog>
 );
}

export function useKeyboardShortcutsDialog() {
 const [isOpen, setIsOpen] = useState(false);

 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === "?" || ((e.metaKey || e.ctrlKey) && e.key === "/")) {
 e.preventDefault();
 setIsOpen(true);
 }
 if (e.key === "Escape" && isOpen) {
 setIsOpen(false);
 }
 };

 window.addEventListener("keydown", handleKeyDown);
 return () => window.removeEventListener("keydown", handleKeyDown);
 }, [isOpen]);

 return {
 isOpen,
 setIsOpen,
 open: () => setIsOpen(true),
 close: () => setIsOpen(false),
 };
}
