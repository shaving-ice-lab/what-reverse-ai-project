"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import {
  Bookmark,
  BookmarkPlus,
  Check,
  ChevronDown,
  Edit2,
  Loader2,
  MoreHorizontal,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

export interface SavedView {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  sort?: {
    field: string;
    order: "asc" | "desc";
  };
  columns?: string[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedViewsConfig {
  moduleKey: string;
  storageKey?: string;
}

// ============================================
// Hook for managing saved views
// ============================================

export function useSavedViews(config: SavedViewsConfig) {
  const { moduleKey, storageKey } = config;
  const key = storageKey || `admin-saved-views-${moduleKey}`;

  const [views, setViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load views from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as SavedView[];
        setViews(parsed);
        // Find and set default view
        const defaultView = parsed.find((v) => v.isDefault);
        if (defaultView) {
          setActiveViewId(defaultView.id);
        }
      }
    } catch (e) {
      console.error("Failed to load saved views:", e);
    } finally {
      setLoading(false);
    }
  }, [key]);

  // Save views to localStorage
  const saveViews = useCallback(
    (newViews: SavedView[]) => {
      setViews(newViews);
      try {
        localStorage.setItem(key, JSON.stringify(newViews));
      } catch (e) {
        console.error("Failed to save views:", e);
      }
    },
    [key]
  );

  // Create new view
  const createView = useCallback(
    (name: string, filters: Record<string, unknown>, sort?: SavedView["sort"]) => {
      const newView: SavedView = {
        id: `view-${Date.now()}`,
        name,
        filters,
        sort,
        isDefault: views.length === 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveViews([...views, newView]);
      setActiveViewId(newView.id);
      return newView;
    },
    [views, saveViews]
  );

  // Update view
  const updateView = useCallback(
    (id: string, updates: Partial<Omit<SavedView, "id" | "createdAt">>) => {
      saveViews(
        views.map((v) =>
          v.id === id ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
        )
      );
    },
    [views, saveViews]
  );

  // Delete view
  const deleteView = useCallback(
    (id: string) => {
      const newViews = views.filter((v) => v.id !== id);
      // If deleted view was default, make first view default
      if (views.find((v) => v.id === id)?.isDefault && newViews.length > 0) {
        newViews[0].isDefault = true;
      }
      saveViews(newViews);
      if (activeViewId === id) {
        setActiveViewId(newViews.find((v) => v.isDefault)?.id || null);
      }
    },
    [views, activeViewId, saveViews]
  );

  // Set default view
  const setDefaultView = useCallback(
    (id: string) => {
      saveViews(
        views.map((v) => ({
          ...v,
          isDefault: v.id === id,
          updatedAt: v.id === id ? new Date().toISOString() : v.updatedAt,
        }))
      );
    },
    [views, saveViews]
  );

  // Get active view
  const activeView = views.find((v) => v.id === activeViewId) || null;

  return {
    views,
    activeView,
    activeViewId,
    setActiveViewId,
    createView,
    updateView,
    deleteView,
    setDefaultView,
    loading,
  };
}

// ============================================
// Saved Views Dropdown
// ============================================

interface SavedViewsDropdownProps {
  views: SavedView[];
  activeViewId: string | null;
  onSelectView: (id: string | null) => void;
  onCreateView: () => void;
  onEditView: (view: SavedView) => void;
  onDeleteView: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export function SavedViewsDropdown({
  views,
  activeViewId,
  onSelectView,
  onCreateView,
  onEditView,
  onDeleteView,
  onSetDefault,
}: SavedViewsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [menuViewId, setMenuViewId] = useState<string | null>(null);

  const activeView = views.find((v) => v.id === activeViewId);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="min-w-[140px] justify-between"
      >
        <span className="flex items-center gap-2">
          <Bookmark className="w-4 h-4" />
          {activeView ? activeView.name : "All data"}
        </span>
        <ChevronDown className="w-3 h-3 ml-2" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 z-50 min-w-[240px] py-1 bg-background-surface border border-border rounded-lg shadow-lg">
            {/* Default Option */}
            <button
              onClick={() => {
                onSelectView(null);
                setOpen(false);
              }}
              className={cn(
                "w-full px-3 py-2 flex items-center gap-2 text-sm text-left hover:bg-background-hover transition-colors",
                !activeViewId && "bg-brand-500/10 text-brand-500"
              )}
            >
              All data
              {!activeViewId && <Check className="w-4 h-4 ml-auto" />}
            </button>

            {views.length > 0 && <div className="h-px bg-border my-1" />}

            {/* Saved Views */}
            {views.map((view) => (
              <div
                key={view.id}
                className={cn(
                  "relative group",
                  activeViewId === view.id && "bg-brand-500/10"
                )}
              >
                <button
                  onClick={() => {
                    onSelectView(view.id);
                    setOpen(false);
                  }}
                  className="w-full px-3 py-2 flex items-center gap-2 text-sm text-left hover:bg-background-hover transition-colors"
                >
                  {view.isDefault ? (
                    <Star className="w-4 h-4 text-warning" />
                  ) : (
                    <Bookmark className="w-4 h-4 text-foreground-muted" />
                  )}
                  <span
                    className={cn(
                      "flex-1 truncate",
                      activeViewId === view.id && "text-brand-500"
                    )}
                  >
                    {view.name}
                  </span>
                  {activeViewId === view.id && (
                    <Check className="w-4 h-4 text-brand-500" />
                  )}
                </button>

                {/* More Menu */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuViewId(menuViewId === view.id ? null : view.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 hover:bg-background-hover rounded transition-all"
                >
                  <MoreHorizontal className="w-4 h-4 text-foreground-muted" />
                </button>

                {/* Context Menu */}
                {menuViewId === view.id && (
                  <div className="absolute right-0 top-full mt-1 z-50 min-w-[120px] py-1 bg-background-surface border border-border rounded-lg shadow-lg">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditView(view);
                        setMenuViewId(null);
                      }}
                      className="w-full px-3 py-1.5 flex items-center gap-2 text-xs text-left hover:bg-background-hover"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                    {!view.isDefault && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetDefault(view.id);
                          setMenuViewId(null);
                        }}
                        className="w-full px-3 py-1.5 flex items-center gap-2 text-xs text-left hover:bg-background-hover"
                      >
                        <Star className="w-3 h-3" />
                        Set as default
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteView(view.id);
                        setMenuViewId(null);
                      }}
                      className="w-full px-3 py-1.5 flex items-center gap-2 text-xs text-left text-destructive hover:bg-background-hover"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}

            <div className="h-px bg-border my-1" />

            {/* Create New */}
            <button
              onClick={() => {
                onCreateView();
                setOpen(false);
              }}
              className="w-full px-3 py-2 flex items-center gap-2 text-sm text-left text-brand-500 hover:bg-background-hover transition-colors"
            >
              <Plus className="w-4 h-4" />
              Save current view
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// Create/Edit View Dialog
// ============================================

interface SaveViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view?: SavedView | null;
  currentFilters: Record<string, unknown>;
  currentSort?: SavedView["sort"];
  onSave: (name: string, filters: Record<string, unknown>, sort?: SavedView["sort"]) => void;
  onUpdate?: (id: string, name: string) => void;
}

export function SaveViewDialog({
  open,
  onOpenChange,
  view,
  currentFilters,
  currentSort,
  onSave,
  onUpdate,
}: SaveViewDialogProps) {
  const [name, setName] = useState(view?.name || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(view?.name || "");
    }
  }, [open, view]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (view && onUpdate) {
        onUpdate(view.id, name.trim());
      } else {
        onSave(name.trim(), currentFilters, currentSort);
      }
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{view ? "Edit View" : "Save View"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <label className="text-xs font-medium text-foreground-muted uppercase tracking-wide">
              View name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Pending tickets"
              className="mt-2"
              autoFocus
            />
          </div>

          {!view && (
            <div className="p-3 bg-background-hover rounded-lg">
              <p className="text-xs text-foreground-muted">
                Current filter conditions will be saved as this view's default conditions.
                {Object.keys(currentFilters).length === 0 && (
                  <span className="block mt-1 text-warning">
                    Note: There are no filter conditions currently
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()} loading={loading}>
              <BookmarkPlus className="w-4 h-4 mr-1" />
              {view ? "Save" : "Create view"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Quick Filters
// ============================================

interface QuickFilter {
  id: string;
  label: string;
  filters: Record<string, unknown>;
  icon?: ReactNode;
}

interface QuickFiltersProps {
  filters: QuickFilter[];
  activeFilterId?: string | null;
  onSelect: (filter: QuickFilter | null) => void;
}

export function QuickFilters({ filters, activeFilterId, onSelect }: QuickFiltersProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "px-3 py-1.5 text-xs font-medium rounded-full border transition-colors",
          !activeFilterId
            ? "bg-brand-500/10 border-brand-500/30 text-brand-500"
            : "border-border hover:border-foreground-muted text-foreground-muted"
        )}
      >
        All
      </button>
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onSelect(filter)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-full border transition-colors flex items-center gap-1.5",
            activeFilterId === filter.id
              ? "bg-brand-500/10 border-brand-500/30 text-brand-500"
              : "border-border hover:border-foreground-muted text-foreground-muted"
          )}
        >
          {filter.icon}
          {filter.label}
        </button>
      ))}
    </div>
  );
}
