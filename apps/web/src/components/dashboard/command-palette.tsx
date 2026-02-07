"use client";

/**
 * allCommandPanel - Manus Style

 * SupportShortcutSearch, CommandExecute, NavigationNavigate
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
 Search,

 X,

 Zap,

 MessageSquare,

 Settings,

 FileText,

 Users,

 Store,

 Palette,

 LayoutGrid,

 HelpCircle,

 Plus,

 ArrowRight,

 Command,

 Clock,

 Star,

 Folder,

 Bot,

 Code,

 Image as ImageIcon,

 Terminal,

 Mail,

 Github,

 Database,

 Globe,

 ChevronRight,

 Sparkles,

 History,

 Bookmark,

 Hash,
} from "lucide-react";

// CommandType

type CommandType = "navigation" | "action" | "recent" | "workflow" | "agent";

interface CommandItem {
 id: string;

 type: CommandType;

 title: string;

 description?: string;

 icon: React.ElementType;

 shortcut?: string;

 href?: string;

 action?: () => void;

 keywords?: string[];
}

// CommandGroup

const commandGroups: { title: string; items: CommandItem[] }[] = [

 {
 title: "Quick Actions",

 items: [

 {
 id: "new-conversation",

 type: "action",

 title: "CreateConversation",

 description: "Start1new's AI Conversation",

 icon: MessageSquare,

 shortcut: "⌘N",

 href: "/dashboard/conversations",

 },

 {
 id: "new-workflow",

 type: "action",

 title: "CreateWorkflow",

 description: "Createnew'sAutomationWorkflow",

 icon: Zap,

 shortcut: "⌘W",

 href: "/dashboard/workflows/new",

 },

 {
 id: "new-agent",

 type: "action",

 title: "Create Agent",

 description: "CreateCustom AI Agent",

 icon: Bot,

 href: "/dashboard/my-agents/new",

 },

 {
 id: "generate-code",

 type: "action",

 title: "GenerateCode",

 description: "Usage AI GenerateCode",

 icon: Code,

 shortcut: "⌘K",

 },

 {
 id: "generate-image",

 type: "action",

 title: "GenerateImage",

 description: "Usage AI GenerateImage",

 icon: ImageIcon,

 shortcut: "⌘I",

 },

 ],

 },

 {
 title: "Navigation",

 items: [

 {
 id: "nav-workflows",

 type: "navigation",

 title: "WorkflowList",

 icon: Zap,

 href: "/dashboard/workflows",

 keywords: ["workflow", "automation", "Automation"],

 },

 {
 id: "nav-creative",

 type: "navigation",

 title: "CreativeWorkshop",

 icon: Palette,

 href: "/dashboard/creative",

 keywords: ["creative", "design", "Creative", "Design"],

 },

 {
 id: "nav-templates",

 type: "navigation",

 title: "Template Gallery",

 icon: LayoutGrid,

 href: "/dashboard/template-gallery",

 keywords: ["template", "Template"],

 },

 {
 id: "nav-store",

 type: "navigation",

 title: "App Store",

 icon: Store,

 href: "/dashboard/store",

 keywords: ["store", "app", "App", "Store"],

 },

 {
 id: "nav-agents",

 type: "navigation",

 title: "I's Agent",

 icon: Users,

 href: "/dashboard/my-agents",

 keywords: ["agent", "bot"],

 },

 {
 id: "nav-settings",

 type: "navigation",

 title: "Settings",

 icon: Settings,

 href: "/dashboard/settings",

 keywords: ["settings", "Settings", "Config"],

 },

 {
 id: "nav-docs",

 type: "navigation",

 title: "Document",

 icon: FileText,

 href: "/docs",

 keywords: ["docs", "documentation", "Document", "Help"],

 },

 ],

 },

 {
 title: "RecentUsage",

 items: [

 {
 id: "recent-1",

 type: "recent",

 title: "CustomerFeedbackAutoProcess",

 description: "Workflow Editat 2 hbefore",

 icon: Zap,

 href: "/dashboard/workflows/wf-1",

 },

 {
 id: "recent-2",

 type: "recent",

 title: "EmailAssistant Agent",

 description: "Agent Editat Yesterday",

 icon: Bot,

 href: "/dashboard/my-agents/agent-1",

 },

 {
 id: "recent-3",

 type: "recent",

 title: "DataAnalyticsReport",

 description: "Conversation 3 daysbefore",

 icon: MessageSquare,

 href: "/dashboard/conversations",

 },

 ],

 },

];

interface CommandPaletteProps {
 isOpen: boolean;

 onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
 const router = useRouter();

 const [query, setQuery] = useState("");

 const [selectedIndex, setSelectedIndex] = useState(0);

 const inputRef = useRef<HTMLInputElement>(null);

 const listRef = useRef<HTMLDivElement>(null);

 // FilterCommand

 const filteredGroups = commandGroups

 .map((group) => ({
 ...group,

 items: group.items.filter((item) => {
 const searchLower = query.toLowerCase();

 return (
 item.title.toLowerCase().includes(searchLower) ||

 item.description?.toLowerCase().includes(searchLower) ||

 item.keywords?.some((k) => k.toLowerCase().includes(searchLower))

 );

 }),

 }))

 .filter((group) => group.items.length > 0);

 // Flat'sCommandList

 const flatItems = filteredGroups.flatMap((group) => group.items);

 // ExecuteCommand

 const executeCommand = useCallback(
 (item: CommandItem) => {
 if (item.action) {
 item.action();

 } else if (item.href) {
 router.push(item.href);

 }

 onClose();

 },

 [router, onClose]

 );

 // keyNavigation

 useEffect(() => {
 if (!isOpen) return;

 const handleKeyDown = (e: KeyboardEvent) => {
 switch (e.key) {
 case "ArrowDown":

 e.preventDefault();

 setSelectedIndex((prev) =>

 prev < flatItems.length - 1 ? prev + 1 : 0

 );

 break;

 case "ArrowUp":

 e.preventDefault();

 setSelectedIndex((prev) =>

 prev > 0 ? prev - 1 : flatItems.length - 1

 );

 break;

 case "Enter":

 e.preventDefault();

 if (flatItems[selectedIndex]) {
 executeCommand(flatItems[selectedIndex]);

 }

 break;

 case "Escape":

 e.preventDefault();

 onClose();

 break;

 }

 };

 window.addEventListener("keydown", handleKeyDown);

 return () => window.removeEventListener("keydown", handleKeyDown);

 }, [isOpen, selectedIndex, flatItems, executeCommand, onClose]);

 // ResetselectStatus

 useEffect(() => {
 setSelectedIndex(0);

 }, [query]);

 // AutoFocus

 useEffect(() => {
 if (isOpen) {
 inputRef.current?.focus();

 setQuery("");

 setSelectedIndex(0);

 }

 }, [isOpen]);

 // Scrolltoselect

 useEffect(() => {
 if (listRef.current && flatItems[selectedIndex]) {
 const item = listRef.current.querySelector(
 `[data-index="${selectedIndex}"]`

 );

 item?.scrollIntoView({ block: "nearest" });

 }

 }, [selectedIndex, flatItems]);

 if (!isOpen) return null;

 // CalculateFlatIndex

 let flatIndex = -1;

 return (
 <>

 {/* BackgroundMask */}

 <div

 className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"

 onClick={onClose}

 />

 {/* CommandPanel */}

 <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-[600px] bg-card border border-border rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden animate-in zoom-in-95 fade-in duration-150">

 {/* SearchInput */}

 <div className="flex items-center gap-3 p-4 border-b border-border">

 <Search className="w-5 h-5 text-foreground-light" />

 <input

 ref={inputRef}

 type="text"

 value={query}

 onChange={(e) => setQuery(e.target.value)}

 placeholder="SearchCommand, PageorFeatures..."

 className="flex-1 bg-transparent text-foreground text-sm placeholder:text-foreground-light focus:outline-none"

 />

 {query && (
 <button

 onClick={() => setQuery("")}

 className="p-1 rounded-lg hover:bg-surface-200 text-foreground-light hover:text-foreground/70 transition-colors"

 >

 <X className="w-4 h-4" />

 </button>

 )}

 <kbd className="px-2 py-1 text-[10px] font-mono rounded bg-surface-200 text-foreground-light">

 ESC

 </kbd>

 </div>

 {/* CommandList */}

 <div

 ref={listRef}

 className="max-h-[400px] overflow-y-auto py-2"

 >

 {filteredGroups.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-12 text-center">

 <Search className="w-10 h-10 text-foreground-light/30 mb-3" />

 <p className="text-sm text-foreground-light">not yettoRelatedCommand</p>

 <p className="text-xs text-foreground-light/70 mt-1">TryotherheKeywords</p>

 </div>

 ) : (
 filteredGroups.map((group) => (
 <div key={group.title} className="mb-2">

 <div className="px-4 py-2 text-[11px] font-medium text-foreground-light uppercase tracking-wider">

 {group.title}

 </div>

 {group.items.map((item) => {
 flatIndex++;

 const currentIndex = flatIndex;

 const isSelected = selectedIndex === currentIndex;

 return (
 <button

 key={item.id}

 data-index={currentIndex}

 onClick={() => executeCommand(item)}

 onMouseEnter={() => setSelectedIndex(currentIndex)}

 className={cn(
 "w-full flex items-center gap-3 px-4 py-3 transition-all",

 isSelected

 ? "bg-surface-200"

 : "hover:bg-muted/50"

 )}

 >

 {/* Icon */}

 <div

 className={cn(
 "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",

 isSelected

 ? "bg-primary/20 text-primary"

 : "bg-surface-200 text-foreground-light"

 )}

 >

 <item.icon className="w-4 h-4" />

 </div>

 {/* Content */}

 <div className="flex-1 min-w-0 text-left">

 <p

 className={cn(
 "text-sm font-medium truncate",

 isSelected ? "text-foreground" : "text-foreground/80"

 )}

 >

 {item.title}

 </p>

 {item.description && (
 <p className="text-xs text-foreground-light truncate mt-0.5">

 {item.description}

 </p>

 )}

 </div>

 {/* Shortcutkey */}

 {item.shortcut && (
 <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-surface-200 text-foreground-light">

 {item.shortcut}

 </kbd>

 )}

 {/* head */}

 <ChevronRight

 className={cn(
 "w-4 h-4 shrink-0 transition-all",

 isSelected

 ? "text-foreground/70 translate-x-0.5"

 : "text-foreground-light/50"

 )}

 />

 </button>

 );

 })}

 </div>

 ))

 )}

 </div>

 {/* FooterTip */}

 <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">

 <div className="flex items-center gap-4 text-[11px] text-foreground-light">

 <span className="flex items-center gap-1">

 <kbd className="px-1 py-0.5 rounded bg-surface-200">↑</kbd>

 <kbd className="px-1 py-0.5 rounded bg-surface-200">↓</kbd>

 Navigation

 </span>

 <span className="flex items-center gap-1">

 <kbd className="px-1.5 py-0.5 rounded bg-surface-200">↵</kbd>

 Execute

 </span>

 </div>

 <div className="flex items-center gap-2 text-[11px] text-foreground-light">

 <Sparkles className="w-3 h-3 text-primary" />

 <span>AgentFlow</span>

 </div>

 </div>

 </div>

 </>

 );
}

