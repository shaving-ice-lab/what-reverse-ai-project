"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

export interface KeyboardShortcut {
  id: string;
  keys: string[];
  label: string;
  description?: string;
  category: string;
  handler: () => void;
  enabled?: boolean;
}

interface KeyboardShortcutsContextValue {
  shortcuts: KeyboardShortcut[];
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (id: string) => void;
  showHelp: () => void;
  hideHelp: () => void;
}

// ============================================
// Context
// ============================================

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue | null>(null);

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error("useKeyboardShortcuts must be used within KeyboardShortcutsProvider");
  }
  return context;
}

// ============================================
// Provider
// ============================================

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
}

export function KeyboardShortcutsProvider({ children }: KeyboardShortcutsProviderProps) {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts((prev) => {
      const filtered = prev.filter((s) => s.id !== shortcut.id);
      return [...filtered, shortcut];
    });
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const showHelp = useCallback(() => setHelpOpen(true), []);
  const hideHelp = useCallback(() => setHelpOpen(false), []);

  // Global keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Check for ? key to show help
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }

      // Find matching shortcut
      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;

        const match = shortcut.keys.every((key) => {
          if (key === "cmd" || key === "meta") return e.metaKey;
          if (key === "ctrl") return e.ctrlKey;
          if (key === "shift") return e.shiftKey;
          if (key === "alt") return e.altKey;
          return e.key.toLowerCase() === key.toLowerCase();
        });

        if (match) {
          e.preventDefault();
          shortcut.handler();
          return;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);

  return (
    <KeyboardShortcutsContext.Provider
      value={{ shortcuts, registerShortcut, unregisterShortcut, showHelp, hideHelp }}
    >
      {children}
      <KeyboardShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </KeyboardShortcutsContext.Provider>
  );
}

// ============================================
// Hook for registering shortcuts
// ============================================

export function useRegisterShortcut(shortcut: KeyboardShortcut) {
  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts();

  useEffect(() => {
    registerShortcut(shortcut);
    return () => unregisterShortcut(shortcut.id);
  }, [shortcut, registerShortcut, unregisterShortcut]);
}

// ============================================
// Shortcuts Help Dialog
// ============================================

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function KeyboardShortcutsDialog({ open, onOpenChange }: KeyboardShortcutsDialogProps) {
  const { shortcuts } = useKeyboardShortcuts();

  // Group shortcuts by category
  const grouped = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-2">
                {category}
              </h4>
              <div className="space-y-1">
                {items.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm text-foreground">{shortcut.label}</span>
                    <KeyCombo keys={shortcut.keys} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Built-in shortcuts */}
          <div>
            <h4 className="text-xs font-medium text-foreground-muted uppercase tracking-wide mb-2">
              General
            </h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-foreground">Show keyboard shortcuts</span>
                <KeyCombo keys={["?"]} />
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-foreground">Global search</span>
                <KeyCombo keys={["cmd", "k"]} />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-foreground-muted text-center">
            Press <kbd className="px-1 py-0.5 bg-background-hover rounded text-foreground">?</kbd> to view shortcuts anytime
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Key Combo Display
// ============================================

interface KeyComboProps {
  keys: string[];
  className?: string;
}

export function KeyCombo({ keys, className }: KeyComboProps) {
  const formatKey = (key: string) => {
    const isMac = typeof navigator !== "undefined" && navigator.platform.includes("Mac");

    const keyMap: Record<string, string> = {
      cmd: isMac ? "⌘" : "Ctrl",
      meta: isMac ? "⌘" : "Ctrl",
      ctrl: isMac ? "⌃" : "Ctrl",
      shift: isMac ? "⇧" : "Shift",
      alt: isMac ? "⌥" : "Alt",
      enter: "↵",
      escape: "Esc",
      backspace: "⌫",
      delete: "Del",
      up: "↑",
      down: "↓",
      left: "←",
      right: "→",
    };

    return keyMap[key.toLowerCase()] || key.toUpperCase();
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {keys.map((key, i) => (
        <kbd
          key={i}
          className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-border bg-background px-1.5 font-mono text-[10px] text-foreground-muted"
        >
          {formatKey(key)}
        </kbd>
      ))}
    </div>
  );
}
