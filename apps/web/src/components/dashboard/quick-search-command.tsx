"use client";

/**
 * Command Panel Quick Search Component
 * 
 * Global workflow search (Cmd+K), recent access + favorites list, quick actions (Run/Edit/Copy)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
 Search,
 X,
 Clock,
 Star,
 Play,
 Edit,
 Copy,
 Trash2,
 ArrowRight,
 Command,
 FileText,
 Zap,
 Settings,
 HelpCircle,
 Plus,
 Layers,
} from "lucide-react";

interface SearchResult {
 id: string;
 name: string;
 icon: string;
 type: "workflow" | "template" | "doc" | "action";
 description?: string;
 isFavorite?: boolean;
 lastAccess?: Date;
 href?: string;
}

// Mock Data
const recentItems: SearchResult[] = [
{ id: "1", name: "Support auto reply", icon: "🤖", type: "workflow", description: "Use AI to reply to customer issues", lastAccess: new Date() },
  { id: "2", name: "Data sync task", icon: "🔄", type: "workflow", description: "Daily data sync", lastAccess: new Date(Date.now() - 3600000) },
  { id: "3", name: "Email category assistant", icon: "📧", type: "workflow", description: "Auto-categorize and mark email", lastAccess: new Date(Date.now() - 7200000) },
];

const favoriteItems: SearchResult[] = [
 { id: "1", name: "Support auto reply", icon: "🤖", type: "workflow", isFavorite: true },
 { id: "4", name: "Content Generation", icon: "✨", type: "workflow", isFavorite: true },
];

const quickActions: SearchResult[] = [
 { id: "new", name: "Create New Workflow", icon: "", type: "action", href: "/dashboard/workflows/new" },
 { id: "templates", name: "Browse Templates", icon: "", type: "action", href: "/dashboard/template-gallery" },
 { id: "docs", name: "View Documentation", icon: "", type: "action", href: "/docs" },
 { id: "settings", name: "Settings", icon: "", type: "action", href: "/dashboard/settings" },
];

const allWorkflows: SearchResult[] = [
 ...recentItems,
{ id: "4", name: "Content generate", icon: "✨", type: "workflow", description: "Batch generate marketing copy" },
  { id: "5", name: "Data analytics report", icon: "📊", type: "workflow", description: "Auto-generate data analytics report" },
  { id: "6", name: "Social media monitor", icon: "📱", type: "workflow", description: "Real-time social media monitoring" },
  { id: "7", name: "Order process flow", icon: "🛒", type: "workflow", description: "Auto-process e-commerce orders" },
];

interface QuickSearchCommandProps {
 isOpen: boolean;
 onClose: () => void;
}

export function QuickSearchCommand({ isOpen, onClose }: QuickSearchCommandProps) {
 const router = useRouter();
 const [query, setQuery] = useState("");
 const [selectedIndex, setSelectedIndex] = useState(0);
 const [selectedAction, setSelectedAction] = useState<string | null>(null);
 const inputRef = useRef<HTMLInputElement>(null);

 // Search results
 const searchResults = query
 ? allWorkflows.filter(
 (item) =>
 item.name.toLowerCase().includes(query.toLowerCase()) ||
 item.description?.toLowerCase().includes(query.toLowerCase())
 )
 : [];

 // Display list
 const displayItems = query ? searchResults : [...quickActions, ...recentItems];

 // Focus input
 useEffect(() => {
 if (isOpen && inputRef.current) {
 inputRef.current.focus();
 }
 if (!isOpen) {
 setQuery("");
 setSelectedIndex(0);
 setSelectedAction(null);
 }
 }, [isOpen]);

 // Keyboard navigation
 const handleKeyDown = useCallback(
 (e: KeyboardEvent) => {
 if (!isOpen) return;

 switch (e.key) {
 case "ArrowDown":
 e.preventDefault();
 setSelectedIndex((prev) => Math.min(prev + 1, displayItems.length - 1));
 break;
 case "ArrowUp":
 e.preventDefault();
 setSelectedIndex((prev) => Math.max(prev - 1, 0));
 break;
 case "Enter":
 e.preventDefault();
 const selectedItem = displayItems[selectedIndex];
 if (selectedItem) {
 handleSelect(selectedItem);
 }
 break;
 case "Escape":
 e.preventDefault();
 if (selectedAction) {
 setSelectedAction(null);
 } else {
 onClose();
 }
 break;
 }
 },
 [isOpen, selectedIndex, displayItems, selectedAction, onClose]
 );

 useEffect(() => {
 window.addEventListener("keydown", handleKeyDown);
 return () => window.removeEventListener("keydown", handleKeyDown);
 }, [handleKeyDown]);

 const handleSelect = (item: SearchResult) => {
 if (item.type === "action") {
 if (item.href) {
 router.push(item.href);
 onClose();
 }
 } else if (item.type === "workflow") {
 setSelectedAction(item.id);
 }
 };

 const handleWorkflowAction = (workflowId: string, action: "run" | "edit" | "copy" | "delete") => {
 switch (action) {
 case "run":
 console.log("Running workflow:", workflowId);
 break;
 case "edit":
 router.push(`/workflows/${workflowId}`);
 break;
 case "copy":
 console.log("Copying workflow:", workflowId);
 break;
 case "delete":
 console.log("Deleting workflow:", workflowId);
 break;
 }
 onClose();
 };

 const getIconComponent = (item: SearchResult) => {
 if (item.type === "action") {
 switch (item.id) {
 case "new":
 return <Plus className="w-4 h-4" />;
 case "templates":
 return <Layers className="w-4 h-4" />;
 case "docs":
 return <FileText className="w-4 h-4" />;
 case "settings":
 return <Settings className="w-4 h-4" />;
 default:
 return <Zap className="w-4 h-4" />;
 }
 }
 return <span className="text-lg">{item.icon}</span>;
 };

 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
 {/* Background Mask - Enhanced Blur Effect */}
 <div
 className="absolute inset-0 bg-black/60 backdrop-blur-md"
 onClick={onClose}
 />

 {/* Search Panel - Enhanced Visual Effect */}
 <div className="relative w-full max-w-xl bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5">
 {/* Top Gradient Decoration */}
 <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
 
 {/* Search Input */}
 <div className="flex items-center gap-3 px-4 border-b border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-violet-500/5">
 <div className="p-1.5 rounded-lg bg-primary/10">
 <Search className="w-4 h-4 text-primary shrink-0" />
 </div>
 <input
 ref={inputRef}
 type="text"
 value={query}
 onChange={(e) => {
 setQuery(e.target.value);
 setSelectedIndex(0);
 setSelectedAction(null);
 }}
 placeholder="Search workflows, templates or actions..."
 className="flex-1 py-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
 />
 {query && (
 <button
 onClick={() => setQuery("")}
 className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors group"
 >
 <X className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
 </button>
 )}
 <div className="flex items-center gap-1 text-xs text-muted-foreground">
 <kbd className="px-2 py-1 rounded-md bg-muted/50 font-mono text-[10px] ring-1 ring-border/50">ESC</kbd>
 </div>
 </div>

 {/* Workflow Action Panel - Enhanced */}
 {selectedAction && (
 <div className="border-b border-border/50 p-4 bg-gradient-to-r from-muted/30 via-transparent to-muted/30">
 <div className="flex items-center gap-3 mb-4">
 <button
 onClick={() => setSelectedAction(null)}
 className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors group"
 >
 <ArrowRight className="w-4 h-4 rotate-180 text-muted-foreground group-hover:text-primary transition-colors" />
 </button>
 <div className="flex items-center gap-2">
 <span className="text-lg">
 {displayItems.find((i) => i.id === selectedAction)?.icon}
 </span>
 <span className="text-sm font-semibold text-foreground">
 {displayItems.find((i) => i.id === selectedAction)?.name}
 </span>
 </div>
 </div>
 <div className="grid grid-cols-4 gap-3">
 {[
 { action: "run" as const, icon: Play, label: "Run", color: "text-primary", bg: "bg-primary/10 hover:bg-primary/20", ring: "ring-primary/20" },
 { action: "edit" as const, icon: Edit, label: "Edit", color: "text-blue-500", bg: "bg-blue-500/10 hover:bg-blue-500/20", ring: "ring-blue-500/20" },
 { action: "copy" as const, icon: Copy, label: "Copy", color: "text-purple-500", bg: "bg-purple-500/10 hover:bg-purple-500/20", ring: "ring-purple-500/20" },
 { action: "delete" as const, icon: Trash2, label: "Delete", color: "text-red-500", bg: "bg-red-500/10 hover:bg-red-500/20", ring: "ring-red-500/20" },
 ].map(({ action, icon: Icon, label, color, bg, ring }) => (
 <button
 key={action}
 onClick={() => handleWorkflowAction(selectedAction, action)}
 className={cn(
 "flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200",
 bg, "ring-1", ring,
 "hover:scale-105 hover:shadow-lg"
 )}
 >
 <Icon className={cn("w-5 h-5", color)} />
 <span className="text-xs font-medium text-muted-foreground">{label}</span>
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Search Results / Shortcut List */}
 <div className="max-h-80 overflow-auto">
 {!selectedAction && (
 <>
 {/* Quick Actions - Enhanced */}
 {!query && (
 <div className="p-3">
 <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
 <Zap className="w-3 h-3" />
 Quick Actions
 </div>
 {quickActions.map((item, index) => (
 <button
 key={item.id}
 onClick={() => handleSelect(item)}
 onMouseEnter={() => setSelectedIndex(index)}
 className={cn(
 "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 group",
 selectedIndex === index 
 ? "bg-gradient-to-r from-primary/10 to-transparent ring-1 ring-primary/20" 
 : "hover:bg-muted/50"
 )}
 >
 <div className={cn(
 "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
 selectedIndex === index 
 ? "bg-primary/20 text-primary shadow-lg shadow-primary/10" 
 : "bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
 )}>
 {getIconComponent(item)}
 </div>
 <span className={cn(
 "text-sm font-medium transition-colors",
 selectedIndex === index ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
 )}>
 {item.name}
 </span>
 <ArrowRight className={cn(
 "w-4 h-4 ml-auto transition-all duration-200",
 selectedIndex === index 
 ? "text-primary translate-x-0" 
 : "text-muted-foreground/50 -translate-x-1 group-hover:translate-x-0 group-hover:text-muted-foreground"
 )} />
 </button>
 ))}
 </div>
 )}

 {/* Favorites - Enhanced */}
 {!query && favoriteItems.length > 0 && (
 <div className="p-3 border-t border-border/50">
 <div className="px-2 py-1.5 text-[10px] font-semibold text-amber-500/80 uppercase tracking-wider flex items-center gap-2">
 <Star className="w-3 h-3 fill-amber-500/50" />
 Favorite
 </div>
 {favoriteItems.map((item, index) => {
 const actualIndex = quickActions.length + index;
 return (
 <button
 key={item.id}
 onClick={() => handleSelect(item)}
 onMouseEnter={() => setSelectedIndex(actualIndex)}
 className={cn(
 "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 group",
 selectedIndex === actualIndex 
 ? "bg-gradient-to-r from-amber-500/10 to-transparent ring-1 ring-amber-500/20" 
 : "hover:bg-muted/50"
 )}
 >
 <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
 {item.icon}
 </div>
 <span className={cn(
 "text-sm font-medium transition-colors",
 selectedIndex === actualIndex ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
 )}>
 {item.name}
 </span>
 <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 ml-auto" />
 </button>
 );
 })}
 </div>
 )}

 {/* Recent Access - Enhanced */}
 {!query && recentItems.length > 0 && (
 <div className="p-3 border-t border-border/50">
 <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
 <Clock className="w-3 h-3" />
 Recent
 </div>
 {recentItems.map((item, index) => {
 const actualIndex = quickActions.length + index;
 return (
 <button
 key={item.id}
 onClick={() => handleSelect(item)}
 onMouseEnter={() => setSelectedIndex(actualIndex)}
 className={cn(
 "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 group",
 selectedIndex === actualIndex 
 ? "bg-gradient-to-r from-primary/10 to-transparent ring-1 ring-primary/20" 
 : "hover:bg-muted/50"
 )}
 >
 <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
 {item.icon}
 </div>
 <div className="flex-1 text-left min-w-0">
 <p className={cn(
 "text-sm font-medium transition-colors truncate",
 selectedIndex === actualIndex ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
 )}>
 {item.name}
 </p>
 {item.description && (
 <p className="text-xs text-muted-foreground/70 truncate">
 {item.description}
 </p>
 )}
 </div>
 </button>
 );
 })}
 </div>
 )}

 {/* Search Results - Enhanced */}
 {query && (
 <div className="p-3">
 {searchResults.length > 0 ? (
 <>
 <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
 <Search className="w-3 h-3" />
 Search Results
 <span className="ml-auto text-primary">{searchResults.length} results</span>
 </div>
 {searchResults.map((item, index) => (
 <button
 key={item.id}
 onClick={() => handleSelect(item)}
 onMouseEnter={() => setSelectedIndex(index)}
 className={cn(
 "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 group",
 selectedIndex === index 
 ? "bg-gradient-to-r from-primary/10 to-transparent ring-1 ring-primary/20" 
 : "hover:bg-muted/50"
 )}
 >
 <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
 {item.icon}
 </div>
 <div className="flex-1 text-left min-w-0">
 <p className={cn(
 "text-sm font-medium transition-colors truncate",
 selectedIndex === index ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
 )}>
 {item.name}
 </p>
 {item.description && (
 <p className="text-xs text-muted-foreground/70 truncate">
 {item.description}
 </p>
 )}
 </div>
 </button>
 ))}
 </>
 ) : (
 <div className="py-12 text-center">
 <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
 <HelpCircle className="w-7 h-7 text-muted-foreground/50" />
 </div>
<p className="text-sm font-medium text-muted-foreground">No matching results</p>
  <p className="text-xs text-muted-foreground/60 mt-1">Try different keywords</p>
 </div>
 )}
 </div>
 )}
 </>
 )}
 </div>

 {/* Footer Tip - Enhanced */}
 <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-gradient-to-r from-muted/30 via-transparent to-muted/30 text-xs text-muted-foreground">
 <div className="flex items-center gap-4">
 <span className="flex items-center gap-1.5">
 <kbd className="px-1.5 py-0.5 rounded-md bg-muted/50 font-mono text-[10px] ring-1 ring-border/50">↑↓</kbd>
 <span className="text-muted-foreground/70">Navigation</span>
 </span>
 <span className="flex items-center gap-1.5">
 <kbd className="px-1.5 py-0.5 rounded-md bg-muted/50 font-mono text-[10px] ring-1 ring-border/50">↵</kbd>
 <span className="text-muted-foreground/70">Select</span>
 </span>
 </div>
 <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/5 ring-1 ring-primary/10">
 <Command className="w-3 h-3 text-primary" />
 <span className="text-primary/80 font-medium">K</span>
 <span className="text-muted-foreground/60">Open search</span>
 </div>
 </div>
 
 {/* Footer Gradient Decoration */}
 <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
 </div>
 </div>
 );
}
