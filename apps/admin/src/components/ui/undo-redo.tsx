"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Redo2, Undo2, X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

export interface UndoableAction<T = unknown> {
  id: string;
  label: string;
  data: T;
  timestamp: number;
  undo: () => void | Promise<void>;
  redo: () => void | Promise<void>;
}

interface UndoRedoContextValue {
  canUndo: boolean;
  canRedo: boolean;
  undoStack: UndoableAction[];
  redoStack: UndoableAction[];
  pushAction: <T>(action: Omit<UndoableAction<T>, "id" | "timestamp">) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  clear: () => void;
}

// ============================================
// Context
// ============================================

const UndoRedoContext = createContext<UndoRedoContextValue | null>(null);

export function useUndoRedo() {
  const context = useContext(UndoRedoContext);
  if (!context) {
    throw new Error("useUndoRedo must be used within UndoRedoProvider");
  }
  return context;
}

// ============================================
// Provider
// ============================================

interface UndoRedoProviderProps {
  children: ReactNode;
  maxStackSize?: number;
}

export function UndoRedoProvider({
  children,
  maxStackSize = 50,
}: UndoRedoProviderProps) {
  const [undoStack, setUndoStack] = useState<UndoableAction[]>([]);
  const [redoStack, setRedoStack] = useState<UndoableAction[]>([]);
  const [toast, setToast] = useState<{ action: UndoableAction; type: "undo" | "redo" } | null>(null);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  const pushAction = useCallback(
    <T,>(action: Omit<UndoableAction<T>, "id" | "timestamp">) => {
      const newAction: UndoableAction<T> = {
        ...action,
        id: `action-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: Date.now(),
      };

      setUndoStack((prev) => {
        const next = [...prev, newAction as UndoableAction];
        // Limit stack size
        if (next.length > maxStackSize) {
          return next.slice(-maxStackSize);
        }
        return next;
      });

      // Clear redo stack when new action is pushed
      setRedoStack([]);
    },
    [maxStackSize]
  );

  const undo = useCallback(async () => {
    if (undoStack.length === 0) return;

    const action = undoStack[undoStack.length - 1];
    await action.undo();

    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, action]);
    setToast({ action, type: "undo" });
  }, [undoStack]);

  const redo = useCallback(async () => {
    if (redoStack.length === 0) return;

    const action = redoStack[redoStack.length - 1];
    await action.redo();

    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, action]);
    setToast({ action, type: "redo" });
  }, [redoStack]);

  const clear = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  // Keyboard shortcuts
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

      // Cmd/Ctrl + Z = Undo
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y = Redo
      if (
        ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "z") ||
        ((e.metaKey || e.ctrlKey) && e.key === "y")
      ) {
        e.preventDefault();
        redo();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <UndoRedoContext.Provider
      value={{
        canUndo,
        canRedo,
        undoStack,
        redoStack,
        pushAction,
        undo,
        redo,
        clear,
      }}
    >
      {children}
      {toast && (
        <UndoRedoToast
          action={toast.action}
          type={toast.type}
          onUndo={toast.type === "undo" ? redo : undo}
          onDismiss={() => setToast(null)}
        />
      )}
    </UndoRedoContext.Provider>
  );
}

// ============================================
// Toast Notification
// ============================================

interface UndoRedoToastProps {
  action: UndoableAction;
  type: "undo" | "redo";
  onUndo: () => void;
  onDismiss: () => void;
}

function UndoRedoToast({ action, type, onUndo, onDismiss }: UndoRedoToastProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4 duration-200">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-background-surface border border-border rounded-xl shadow-xl">
        <div className="flex items-center gap-2">
          {type === "undo" ? (
            <Undo2 className="w-4 h-4 text-foreground-muted" />
          ) : (
            <Redo2 className="w-4 h-4 text-foreground-muted" />
          )}
          <span className="text-sm text-foreground">
            {type === "undo" ? "已撤销" : "已重做"}：{action.label}
          </span>
        </div>
        <button
          onClick={onUndo}
          className="text-sm text-brand-500 hover:text-brand-400 font-medium"
        >
          {type === "undo" ? "重做" : "撤销"}
        </button>
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-background-hover rounded"
        >
          <X className="w-4 h-4 text-foreground-muted" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// Undo/Redo Toolbar Buttons
// ============================================

interface UndoRedoButtonsProps {
  className?: string;
}

export function UndoRedoButtons({ className }: UndoRedoButtonsProps) {
  const { canUndo, canRedo, undo, redo } = useUndoRedo();

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={undo}
        disabled={!canUndo}
        title="撤销 (⌘Z)"
      >
        <Undo2 className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={redo}
        disabled={!canRedo}
        title="重做 (⌘⇧Z)"
      >
        <Redo2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ============================================
// Hook for creating undoable operations
// ============================================

export function useUndoableOperation<T>(
  label: string,
  onExecute: (data: T) => void | Promise<void>,
  onRevert: (data: T) => void | Promise<void>
) {
  const { pushAction } = useUndoRedo();

  const execute = useCallback(
    async (data: T) => {
      await onExecute(data);

      pushAction({
        label,
        data,
        undo: () => onRevert(data),
        redo: () => onExecute(data),
      });
    },
    [label, onExecute, onRevert, pushAction]
  );

  return execute;
}
