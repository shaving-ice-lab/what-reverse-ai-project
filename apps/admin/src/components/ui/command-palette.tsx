"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  Building2,
  CreditCard,
  FileText,
  GitBranch,
  LifeBuoy,
  Play,
  Search,
  Server,
  Sparkles,
  Tag,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminNavGroups, segmentLabels } from "@/lib/navigation";

export interface SearchResult {
  id: string;
  type: "user" | "workspace" | "app" | "ticket" | "workflow" | "execution" | "page";
  title: string;
  subtitle?: string;
  href: string;
  icon?: React.ReactNode;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  user: <Users className="w-4 h-4" />,
  workspace: <Building2 className="w-4 h-4" />,
  app: <Activity className="w-4 h-4" />,
  ticket: <LifeBuoy className="w-4 h-4" />,
  workflow: <GitBranch className="w-4 h-4" />,
  execution: <Play className="w-4 h-4" />,
  page: <FileText className="w-4 h-4" />,
};

const typeLabels: Record<string, string> = {
  user: "User",
  workspace: "Workspace",
  app: "App",
  ticket: "Ticket",
  workflow: "Workflow",
  execution: "Execution",
  page: "Page",
};

// Mock search function - replace with actual API call
const searchResources = async (query: string): Promise<SearchResult[]> => {
  if (!query.trim()) return [];

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  const results: SearchResult[] = [];

  // Search in navigation pages
  adminNavGroups.forEach((group) => {
    group.items.forEach((item) => {
      if (
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.href.toLowerCase().includes(query.toLowerCase())
      ) {
        results.push({
          id: `page-${item.href}`,
          type: "page",
          title: item.title,
          subtitle: group.title,
          href: item.href,
          icon: <item.icon className="w-4 h-4" />,
        });
      }
    });
  });

  // Mock data search results
  const mockData: SearchResult[] = [
    {
      id: "user-1",
      type: "user",
      title: "admin@agentflow.ai",
      subtitle: "SuperAdmin • Active",
      href: "/users/usr_1",
    },
    {
      id: "user-2",
      type: "user",
      title: "test@example.com",
      subtitle: "User • Active",
      href: "/users/usr_2",
    },
    {
      id: "ws-1",
      type: "workspace",
      title: "AgentFlow Team",
      subtitle: "Pro plan • 5 members",
      href: "/workspaces/ws_1",
    },
    {
      id: "app-1",
      type: "app",
      title: "Smart Customer Service Assistant",
      subtitle: "Published • AgentFlow Team",
      href: "/apps/app_1",
    },
    {
      id: "ticket-1",
      type: "ticket",
      title: "#TK-2024001 Login Issue",
      subtitle: "Pending • High Priority",
      href: "/support/tickets/tk_1",
    },
    {
      id: "workflow-1",
      type: "workflow",
      title: "Document Analysis Workflow",
      subtitle: "Active • 120 executions",
      href: "/workflows/wf_1",
    },
  ];

  mockData.forEach((item) => {
    if (
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(query.toLowerCase())
    ) {
      results.push(item);
    }
  });

  return results.slice(0, 10);
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Search on query change
  useEffect(() => {
    const search = async () => {
      setLoading(true);
      try {
        const data = await searchResources(query);
        setResults(data);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(search, 150);
    return () => clearTimeout(debounce);
  }, [query]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            router.push(results[selectedIndex].href);
            onOpenChange(false);
          }
          break;
        case "Escape":
          e.preventDefault();
          onOpenChange(false);
          break;
      }
    },
    [results, selectedIndex, router, onOpenChange]
  );

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach((result) => {
      if (!groups[result.type]) {
        groups[result.type] = [];
      }
      groups[result.type].push(result);
    });
    return groups;
  }, [results]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Command Palette */}
      <div className="absolute left-1/2 top-[15%] -translate-x-1/2 w-full max-w-[640px] px-4">
        <div className="bg-background-surface border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="w-5 h-5 text-foreground-muted shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search users, workspaces, apps, tickets..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground-muted outline-none"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1 hover:bg-background-hover rounded"
              >
                <X className="w-4 h-4 text-foreground-muted" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] text-foreground-muted">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && query && (
              <div className="px-4 py-8 text-center text-sm text-foreground-muted">
                <div className="inline-block w-5 h-5 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-2" />
                <p>Searching...</p>
              </div>
            )}

            {!loading && query && results.length === 0 && (
              <div className="px-4 py-8 text-center">
                <AlertCircle className="w-8 h-8 text-foreground-muted mx-auto mb-2" />
                <p className="text-sm text-foreground-muted">
                  No results found for "{query}"
                </p>
                <p className="text-xs text-foreground-muted mt-1">
                  Try searching with different keywords
                </p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="py-2">
                {Object.entries(groupedResults).map(([type, items]) => (
                  <div key={type}>
                    <div className="px-4 py-1.5 text-[11px] font-medium text-foreground-muted uppercase tracking-wide">
                      {typeLabels[type] || type}
                    </div>
                    {items.map((result, idx) => {
                      const globalIndex = results.findIndex(
                        (r) => r.id === result.id
                      );
                      const isSelected = globalIndex === selectedIndex;

                      return (
                        <button
                          key={result.id}
                          onClick={() => {
                            router.push(result.href);
                            onOpenChange(false);
                          }}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={cn(
                            "w-full px-4 py-2 flex items-center gap-3 text-left transition-colors",
                            isSelected
                              ? "bg-brand-500/10 text-foreground"
                              : "text-foreground-light hover:bg-background-hover"
                          )}
                        >
                          <span
                            className={cn(
                              "shrink-0",
                              isSelected
                                ? "text-brand-500"
                                : "text-foreground-muted"
                            )}
                          >
                            {result.icon || typeIcons[result.type]}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {result.title}
                            </div>
                            {result.subtitle && (
                              <div className="text-xs text-foreground-muted truncate">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border bg-background px-1.5 font-mono text-[10px] text-foreground-muted">
                              ↵
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions when empty */}
            {!query && (
              <div className="py-2">
                <div className="px-4 py-1.5 text-[11px] font-medium text-foreground-muted uppercase tracking-wide">
                  Quick Navigation
                </div>
                {[
                  { title: "User Management", href: "/users", icon: Users },
                  { title: "Workspace", href: "/workspaces", icon: Building2 },
                  { title: "Ticket Center", href: "/support/tickets", icon: LifeBuoy },
                  { title: "System Health", href: "/system/health", icon: Server },
                ].map((item) => (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href);
                      onOpenChange(false);
                    }}
                    className="w-full px-4 py-2 flex items-center gap-3 text-left text-foreground-light hover:bg-background-hover transition-colors"
                  >
                    <item.icon className="w-4 h-4 text-foreground-muted" />
                    <span className="text-sm">{item.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[11px] text-foreground-muted">
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-4 items-center rounded border border-border px-1 font-mono">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-4 items-center rounded border border-border px-1 font-mono">
                ↵
              </kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-4 items-center rounded border border-border px-1 font-mono">
                esc
              </kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for global keyboard shortcut
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { open, setOpen };
}
