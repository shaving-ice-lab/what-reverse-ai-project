"use client";

/**
 * Shortcut Key Guide Page - Supabase Style
 * Display all available keyboard shortcuts
 */

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import {
 Keyboard,
 Search,
 MessageSquare,
 Zap,
 FileText,
 Settings,
 Navigation,
 Edit3,
 Eye,
 Command,
 ArrowUp,
 ArrowDown,
 ArrowLeft,
 ArrowRight,
 CornerDownLeft,
 Delete,
} from "lucide-react";

// Shortcut Key Categories
const shortcutCategories = [
 {
 title: "All Shortcuts",
 icon: Command,
 shortcuts: [
 { keys: ["⌘", "K"], description: "Open command panel / search", action: "search" },
 { keys: ["⌘", "N"], description: "Create conversation", action: "new-chat" },
 { keys: ["⌘", "⇧", "N"], description: "Create workflow", action: "new-workflow" },
 { keys: ["⌘", ","], description: "Open settings", action: "settings" },
 { keys: ["⌘", "/"], description: "Display shortcut key help", action: "shortcuts" },
 { keys: ["Esc"], description: "Close modal or cancel action", action: "escape" },
 ],
 },
 {
 title: "Conversation Actions",
 icon: MessageSquare,
 shortcuts: [
 { keys: ["/"], description: "Focus input", action: "focus-input" },
 { keys: ["⌘", "↵"], description: "Send message", action: "send" },
 { keys: ["⇧", "↵"], description: "New line (without sending)", action: "newline" },
 { keys: ["↑"], description: "Edit last message", action: "edit-last" },
 { keys: ["⌘", "C"], description: "Copy selected content/message", action: "copy" },
 { keys: ["⌘", "⇧", "C"], description: "Copy code block", action: "copy-code" },
 ],
 },
 {
 title: "Navigation",
 icon: Navigation,
 shortcuts: [
{ keys: ["⌘", "1"], description: "Switch to conversation page", action: "nav-chat" },
   { keys: ["⌘", "2"], description: "Switch to workflow page", action: "nav-workflow" },
   { keys: ["⌘", "3"], description: "Switch to creative workshop", action: "nav-creative" },
 { keys: ["⌘", "4"], description: "Switch to template gallery", action: "nav-templates" },
 { keys: ["⌘", "["], description: "Go back one page", action: "back" },
 { keys: ["⌘", "]"], description: "Go forward one page", action: "forward" },
 ],
 },
 {
 title: "Workflow Editor",
 icon: Zap,
 shortcuts: [
 { keys: ["⌘", "S"], description: "Save workflow", action: "save" },
 { keys: ["⌘", "Z"], description: "Undo", action: "undo" },
 { keys: ["⌘", "⇧", "Z"], description: "Redo", action: "redo" },
 { keys: ["⌘", "D"], description: "Duplicate selected node", action: "duplicate" },
 { keys: ["Delete"], description: "Delete selected node", action: "delete" },
 { keys: ["⌘", "A"], description: "Select all nodes", action: "select-all" },
 { keys: ["+"], description: "Zoom in canvas", action: "zoom-in" },
 { keys: ["-"], description: "Zoom out canvas", action: "zoom-out" },
 { keys: ["0"], description: "Reset zoom", action: "zoom-reset" },
 ],
 },
 {
 title: "Editing Actions",
 icon: Edit3,
 shortcuts: [
 { keys: ["⌘", "B"], description: "Bold", action: "bold" },
 { keys: ["⌘", "I"], description: "Italic", action: "italic" },
 { keys: ["⌘", "U"], description: "Underline", action: "underline" },
 { keys: ["⌘", "⇧", "K"], description: "Insert code block", action: "code-block" },
 { keys: ["⌘", "⇧", "L"], description: "Insert link", action: "link" },
 { keys: ["Tab"], description: "Increase indent", action: "indent" },
 { keys: ["⇧", "Tab"], description: "Decrease indent", action: "outdent" },
 ],
 },
 {
 title: "View and Display",
 icon: Eye,
 shortcuts: [
 { keys: ["⌘", "\\"], description: "Toggle sidebar", action: "toggle-sidebar" },
 { keys: ["⌘", "⇧", "F"], description: "Full screen", action: "fullscreen" },
 { keys: ["⌘", "⇧", "D"], description: "Toggle dark mode", action: "dark-mode" },
 { keys: ["⌘", "+"], description: "Zoom in UI", action: "ui-zoom-in" },
 { keys: ["⌘", "-"], description: "Zoom out UI", action: "ui-zoom-out" },
 ],
 },
];

// Shortcut Key Style Component
function KeyCap({ children, isSpecial = false }: { children: React.ReactNode; isSpecial?: boolean }) {
 return (
 <span
 className={cn(
 "inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-md text-xs font-medium",
 "bg-surface-200 border border-border",
 isSpecial ? "text-foreground-muted" : "text-foreground"
 )}
 >
 {children}
 </span>
 );
}

export default function ShortcutsPage() {
 const [searchQuery, setSearchQuery] = useState("");
 const [isMac] = useState(true); // Should detect user system

 // Filter Shortcuts
 const filteredCategories = shortcutCategories
 .map((category) => ({
 ...category,
 shortcuts: category.shortcuts.filter(
 (shortcut) =>
 shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
 shortcut.keys.join("").toLowerCase().includes(searchQuery.toLowerCase())
 ),
 }))
 .filter((category) => category.shortcuts.length > 0);

 return (
 <PageContainer>
 <div className="space-y-6">
 <PageHeader
 title="Shortcut key guide"
 description="Use keyboard shortcuts to improve your workflow"
 >
 <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
 <span className="inline-flex items-center gap-1.5">
 <Keyboard className="w-3.5 h-3.5" />
 Used for {isMac ? "macOS": "Windows/Linux"}
 </span>
 </div>
 </PageHeader>

 <div className="page-divider" />

 <div className="page-panel">
 <div className="page-panel-header">
 <div>
 <p className="page-panel-title">Search Shortcuts</p>
 <p className="page-panel-description">Filter shortcuts by name or group</p>
 </div>
 </div>
 <div className="px-6 pb-6">
 <Input
 variant="search"
 placeholder="Search shortcut keys..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 leftIcon={<Search className="w-4 h-4" />}
 className="max-w-md"
 />
 </div>
 </div>
 {/* System Tip */}
 <div className="page-panel p-4">
 <p className="text-[13px] text-foreground-light">
 <span className="font-medium text-foreground">Tip: </span> 
 The shortcuts below are for {isMac ? "macOS": "Windows/Linux"}.
 {isMac ? " ⌘ = Command key, ⇧ = Shift key." : " Ctrl = alternative to ⌘; other keys are the same."}
 </p>
 </div>

 {/* Shortcut Key List */}
 {filteredCategories.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-16">
 <div className="w-14 h-14 rounded-md bg-surface-200 flex items-center justify-center mb-4">
 <Keyboard className="w-6 h-6 text-foreground-muted" />
 </div>
 <h3 className="text-base font-medium text-foreground mb-2">No related shortcut keys</h3>
 <p className="text-[13px] text-foreground-light">Try other keywords</p>
 </div>
 ) : (
 <div className="space-y-6">
 {filteredCategories.map((category) => {
 const Icon = category.icon;
 return (
 <div key={category.title} className="page-panel overflow-hidden">
 <div className="page-panel-header flex items-center gap-2">
 <Icon className="w-4 h-4 text-brand-500" />
 <span className="page-panel-title">{category.title}</span>
 </div>

 <div className="p-4">
 <div className="rounded-md bg-surface-100 border border-border overflow-hidden">
 <table className="w-full">
 <tbody>
 {category.shortcuts.map((shortcut, index) => (
 <tr
 key={shortcut.action}
 className={cn(
 "hover:bg-surface-75 transition-colors",
 index !== category.shortcuts.length - 1 && "border-b border-border-muted"
 )}
 >
 <td className="px-4 py-3 w-48">
 <div className="flex items-center gap-1">
 {shortcut.keys.map((key, idx) => (
 <span key={idx} className="flex items-center">
 {idx > 0 && <span className="text-foreground-muted mx-0.5">+</span>}
 <KeyCap isSpecial={["⌘", "⇧", "Ctrl", "Alt", "Esc"].includes(key)}>
 {key === "↵" ? <CornerDownLeft className="w-3.5 h-3.5" /> :
 key === "↑" ? <ArrowUp className="w-3.5 h-3.5" /> :
 key === "↓" ? <ArrowDown className="w-3.5 h-3.5" /> :
 key === "←" ? <ArrowLeft className="w-3.5 h-3.5" /> :
 key === "→" ? <ArrowRight className="w-3.5 h-3.5" /> :
 key === "Delete" ? <Delete className="w-3.5 h-3.5" /> :
 key}
 </KeyCap>
 </span>
 ))}
 </div>
 </td>
 <td className="px-4 py-3 text-[13px] text-foreground-light">
 {shortcut.description}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* Custom Shortcut Tip */}
 <div className="page-panel border-brand-400/30 bg-brand-200/20 text-center">
 <div className="p-5">
 <h3 className="text-sm font-medium text-foreground mb-2">Custom Shortcuts</h3>
 <p className="text-[13px] text-foreground-light mb-4">
 You can customize shortcut keys in Settings to match your usage.
 </p>
 <Button
 variant="outline"
 size="sm"
 className="border-border-muted text-foreground-light hover:text-foreground hover:border-border"
 >
 <Settings className="w-4 h-4 mr-2" />
 Open Shortcut Settings
 </Button>
 </div>
 </div>
 </div>
 </PageContainer>
 );
}
