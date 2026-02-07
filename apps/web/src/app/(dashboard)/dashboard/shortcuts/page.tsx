"use client";

/**
 * ShortcutkeyGuidePage - Supabase Style
 * DisplayAllAvailable'skeyBoard Shortcutskey
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

// ShortcutkeyCategory
const shortcutCategories = [
 {
 title: "allShortcutkey",
 icon: Command,
 shortcuts: [
 { keys: ["⌘", "K"], description: "OpenCommandPanel/Search", action: "search" },
 { keys: ["⌘", "N"], description: "CreateConversation", action: "new-chat" },
 { keys: ["⌘", "⇧", "N"], description: "CreateWorkflow", action: "new-workflow" },
 { keys: ["⌘", ","], description: "OpenSettings", action: "settings" },
 { keys: ["⌘", "/"], description: "DisplayShortcutkeyHelp", action: "shortcuts" },
 { keys: ["Esc"], description: "CloseModal/CancelAction", action: "escape" },
 ],
 },
 {
 title: "ConversationAction",
 icon: MessageSquare,
 shortcuts: [
 { keys: ["/"], description: "FocustoInput", action: "focus-input" },
 { keys: ["⌘", "↵"], description: "SendMessage", action: "send" },
 { keys: ["⇧", "↵"], description: "row(notSend)", action: "newline" },
 { keys: ["↑"], description: "Editon1Message", action: "edit-last" },
 { keys: ["⌘", "C"], description: "CopyselectContent/Message", action: "copy" },
 { keys: ["⌘", "⇧", "C"], description: "CopyCodeblock", action: "copy-code" },
 ],
 },
 {
 title: "Navigation",
 icon: Navigation,
 shortcuts: [
 { keys: ["⌘", "1"], description: "SwitchtoConversationPage", action: "nav-chat" },
 { keys: ["⌘", "2"], description: "SwitchtoWorkflowPage", action: "nav-workflow" },
 { keys: ["⌘", "3"], description: "SwitchtoCreativeWorkshop", action: "nav-creative" },
 { keys: ["⌘", "4"], description: "SwitchtoTemplate Gallery", action: "nav-templates" },
 { keys: ["⌘", "["], description: "Backon1page", action: "back" },
 { keys: ["⌘", "]"], description: "beforetodown1page", action: "forward" },
 ],
 },
 {
 title: "WorkflowEdit",
 icon: Zap,
 shortcuts: [
 { keys: ["⌘", "S"], description: "SaveWorkflow", action: "save" },
 { keys: ["⌘", "Z"], description: "Undo", action: "undo" },
 { keys: ["⌘", "⇧", "Z"], description: "Redo", action: "redo" },
 { keys: ["⌘", "D"], description: "CopyselectNode", action: "duplicate" },
 { keys: ["Delete"], description: "DeleteselectNode", action: "delete" },
 { keys: ["⌘", "A"], description: "Select AllNode", action: "select-all" },
 { keys: ["+"], description: "largeCanvas", action: "zoom-in" },
 { keys: ["-"], description: "smallCanvas", action: "zoom-out" },
 { keys: ["0"], description: "ResetZoom", action: "zoom-reset" },
 ],
 },
 {
 title: "EditAction",
 icon: Edit3,
 shortcuts: [
 { keys: ["⌘", "B"], description: "", action: "bold" },
 { keys: ["⌘", "I"], description: "", action: "italic" },
 { keys: ["⌘", "U"], description: "downline", action: "underline" },
 { keys: ["⌘", "⇧", "K"], description: "enterCodeblock", action: "code-block" },
 { keys: ["⌘", "⇧", "L"], description: "enterLink", action: "link" },
 { keys: ["Tab"], description: "IncreaseIndent", action: "indent" },
 { keys: ["⇧", "Tab"], description: "fewIndent", action: "outdent" },
 ],
 },
 {
 title: "ViewandDisplay",
 icon: Eye,
 shortcuts: [
 { keys: ["⌘", "\\"], description: "SwitchSidebar", action: "toggle-sidebar" },
 { keys: ["⌘", "⇧", "F"], description: "all", action: "fullscreen" },
 { keys: ["⌘", "⇧", "D"], description: "SwitchDark Mode", action: "dark-mode" },
 { keys: ["⌘", "+"], description: "largeface", action: "ui-zoom-in" },
 { keys: ["⌘", "-"], description: "smallface", action: "ui-zoom-out" },
 ],
 },
];

// ShortcutkeystyleComponent
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
 const [isMac] = useState(true); // ActualshouldDetectUserSystem

 // FilterShortcutkey
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
 title="ShortcutkeyGuide"
 description="UsagekeyBoard ShortcutskeyImproveWorkrate"
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
 <p className="page-panel-title">SearchShortcutkey</p>
 <p className="page-panel-description">byNameorgroupkeyFilterShortcutkey</p>
 </div>
 </div>
 <div className="px-6 pb-6">
 <Input
 variant="search"
 placeholder="SearchShortcutkey..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 leftIcon={<Search className="w-4 h-4" />}
 className="max-w-md"
 />
 </div>
 </div>
 {/* SystemTip */}
 <div className="page-panel p-4">
 <p className="text-[13px] text-foreground-light">
 <span className="font-medium text-foreground">Tip: </span> 
 withdownShortcutkeyUsed for {isMac ? "macOS": "Windows/Linux"} System.
 {isMac ? " ⌘ Represent Command key, ⇧ Represent Shift key.": " Ctrl keyAlternative ⌘, otherhekeySame."}
 </p>
 </div>

 {/* ShortcutkeyList */}
 {filteredCategories.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-16">
 <div className="w-14 h-14 rounded-md bg-surface-200 flex items-center justify-center mb-4">
 <Keyboard className="w-6 h-6 text-foreground-muted" />
 </div>
 <h3 className="text-base font-medium text-foreground mb-2">NotoRelatedShortcutkey</h3>
 <p className="text-[13px] text-foreground-light">TryotherheKeywords</p>
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

 {/* CustomShortcutkeyTip */}
 <div className="page-panel border-brand-400/30 bg-brand-200/20 text-center">
 <div className="p-5">
 <h3 className="text-sm font-medium text-foreground mb-2">CustomShortcutkey</h3>
 <p className="text-[13px] text-foreground-light mb-4">
 youcanwithatSettingsCustomShortcutkeywithshouldyou'sUsage
 </p>
 <Button
 variant="outline"
 size="sm"
 className="border-border-muted text-foreground-light hover:text-foreground hover:border-border"
 >
 <Settings className="w-4 h-4 mr-2" />
 OpenShortcutkeySettings
 </Button>
 </div>
 </div>
 </div>
 </PageContainer>
 );
}
