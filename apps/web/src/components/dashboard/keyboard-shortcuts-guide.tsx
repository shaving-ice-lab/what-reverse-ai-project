"use client";

/**
 * keyBoard ShortcutskeyGuideComponent
 * ShowcaseAllAvailable'skeyBoard Shortcutskey
 */

import { useState, useEffect, useCallback } from "react";
import {
 Keyboard,
 X,
 Search,
 Plus,
 MessageSquare,
 Zap,
 Bot,
 Settings,
 Home,
 ArrowUp,
 ArrowDown,
 CornerDownLeft,
 Command,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ShortcutkeyGroup
const shortcutGroups = [
 {
 name: "all",
 shortcuts: [
 { keys: ["⌘", "K"], description: "OpenCommandPanel", icon: Search },
 { keys: ["⌘", "N"], description: "CreateConversation", icon: MessageSquare },
 { keys: ["⌘", "W"], description: "CreateWorkflow", icon: Zap },
 { keys: ["⌘", ","], description: "OpenSettings", icon: Settings },
 { keys: ["?"], description: "DisplayShortcutkeyHelp", icon: Keyboard },
 { keys: ["Esc"], description: "CloseModal/Panel", icon: X },
 ],
 },
 {
 name: "Navigation",
 shortcuts: [
 { keys: ["G", "H"], description: "BackHome", icon: Home },
 { keys: ["G", "W"], description: "WorkflowList", icon: Zap },
 { keys: ["G", "A"], description: "I's Agent", icon: Bot },
 { keys: ["G", "S"], description: "SettingsPage", icon: Settings },
 ],
 },
 {
 name: "Conversation",
 shortcuts: [
 { keys: ["Enter"], description: "SendMessage", icon: CornerDownLeft },
 { keys: ["Shift", "Enter"], description: "row", icon: CornerDownLeft },
 { keys: ["⌘", "↑"], description: "Editon1Message", icon: ArrowUp },
 { keys: ["/"], description: "FocusInput", icon: Search },
 ],
 },
 {
 name: "CommandPanel",
 shortcuts: [
 { keys: ["↑", "↓"], description: "SelectCommand", icon: ArrowDown },
 { keys: ["Enter"], description: "ExecuteselectCommand", icon: CornerDownLeft },
 { keys: ["Tab"], description: "Autoall", icon: Command },
 ],
 },
];

interface KeyboardShortcutsGuideProps {
 isOpen: boolean;
 onClose: () => void;
}

export function KeyboardShortcutsGuide({ isOpen, onClose }: KeyboardShortcutsGuideProps) {
 const [searchQuery, setSearchQuery] = useState("");

 // FilterShortcutkey
 const filteredGroups = shortcutGroups.map((group) => ({
 ...group,
 shortcuts: group.shortcuts.filter(
 (shortcut) =>
 shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
 shortcut.keys.join("").toLowerCase().includes(searchQuery.toLowerCase())
 ),
 })).filter((group) => group.shortcuts.length > 0);

 // ESC Close
 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === "Escape" && isOpen) {
 onClose();
 }
 };

 document.addEventListener("keydown", handleKeyDown);
 return () => document.removeEventListener("keydown", handleKeyDown);
 }, [isOpen, onClose]);

 if (!isOpen) return null;

 return (
 <>
 {/* BackgroundMask */}
 <div
 className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
 onClick={onClose}
 />

 {/* ShortcutkeyPanel */}
 <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl bg-card border border-border shadow-2xl z-50">
 {/* Header */}
 <div className="flex items-center justify-between p-4 border-b border-border">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
 <Keyboard className="w-5 h-5 text-primary" />
 </div>
 <div>
 <h2 className="font-semibold text-foreground">keyBoard Shortcutskey</h2>
 <p className="text-sm text-muted-foreground">QuickAccessuseFeatures</p>
 </div>
 </div>
 <button
 onClick={onClose}
 className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Search Box */}
 <div className="p-4 border-b border-border">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <input
 type="text"
 placeholder="SearchShortcutkey..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full h-10 pl-9 pr-4 rounded-lg bg-muted border-none text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
 autoFocus
 />
 </div>
 </div>

 {/* ShortcutkeyList */}
 <div className="overflow-y-auto max-h-[calc(80vh-180px)] p-4">
 {filteredGroups.length === 0 ? (
 <div className="text-center py-8">
 <Keyboard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
 <p className="text-muted-foreground">NotoMatch'sShortcutkey</p>
 </div>
 ) : (
 <div className="space-y-6">
 {filteredGroups.map((group) => (
 <div key={group.name}>
 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
 {group.name}
 </h3>
 <div className="grid gap-2">
 {group.shortcuts.map((shortcut, index) => {
 const Icon = shortcut.icon;
 return (
 <div
 key={index}
 className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
 >
 <div className="flex items-center gap-3">
 <Icon className="w-4 h-4 text-muted-foreground" />
 <span className="text-sm text-foreground">
 {shortcut.description}
 </span>
 </div>
 <div className="flex items-center gap-1">
 {shortcut.keys.map((key, idx) => (
 <kbd
 key={idx}
 className="min-w-[24px] h-6 px-2 flex items-center justify-center rounded bg-card border border-border text-xs font-medium text-muted-foreground"
 >
 {key}
 </kbd>
 ))}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* FooterTip */}
 <div className="p-4 border-t border-border bg-muted/30">
 <p className="text-xs text-muted-foreground text-center">
 by <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">?</kbd> keyAnytimeOpenthisPanel
 </p>
 </div>
 </div>
 </>
 );
}

// Shortcutkey Hook
export function useKeyboardShortcuts() {
 const [isGuideOpen, setIsGuideOpen] = useState(false);

 const openGuide = useCallback(() => setIsGuideOpen(true), []);
 const closeGuide = useCallback(() => setIsGuideOpen(false), []);

 // Listen ? key
 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 // IgnoreInput'sbykey
 if (
 e.target instanceof HTMLInputElement ||
 e.target instanceof HTMLTextAreaElement
 ) {
 return;
 }

 if (e.key === "?") {
 e.preventDefault();
 setIsGuideOpen(true);
 }
 };

 document.addEventListener("keydown", handleKeyDown);
 return () => document.removeEventListener("keydown", handleKeyDown);
 }, []);

 return {
 isGuideOpen,
 openGuide,
 closeGuide,
 };
}
