"use client";

import { useCallback, useEffect, useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Layers, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import { NodePanel } from "./node-panel";
import { EditorCanvas } from "./editor-canvas";
import { ConfigPanel } from "./config-panel";
import { EditorToolbar } from "./editor-toolbar";
import { ExecutionPanel } from "./execution-panel";
import { useWorkflowStore } from "@/stores/useWorkflowStore";
import { useIsMobile, useIsTablet } from "@/hooks/useMediaQuery";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * 工作流编辑器主组件 - Manus 风格
 * 
 * 布局结构:
 * ┌──────────────────────────────────────────────────────┐
 * │                  Header/Toolbar (h-12)               │
 * ├────────────┬─────────────────────────┬───────────────┤
 * │            │                         │               │
 * │ Node Panel │       Canvas Area       │ Config Panel  │
 * │  w-[260px] │        flex-1           │   w-[320px]   │
 * │            │                         │   (可折叠)     │
 * ├────────────┴─────────────────────────┴───────────────┤
 * │              Execution Panel (可折叠, max-h-[300px])   │
 * └──────────────────────────────────────────────────────┘
 * 
 * 注：编辑器画布区域始终使用深色主题以获得最佳视觉效果
 */

// Manus 风格面板宽度
const PANEL_WIDTH = {
  left: 260,
  right: 320,
  leftTablet: 220,
  rightTablet: 280,
};

type SaveStatus = "saved" | "saving" | "unsaved" | "error";

interface WorkflowEditorProps {
  workflowId?: string;
  workflowVersion?: number;
  initialData?: {
    name?: string;
    nodes?: unknown[];
    edges?: unknown[];
  };
  showEmptyState?: boolean;
  // 状态属性
  saveStatus?: SaveStatus;
  lastSavedAt?: Date | null;
  isOnline?: boolean;
  collaborators?: Array<{ id: string; name: string; avatar?: string }>;
  executionStatus?: "idle" | "running" | "completed" | "failed";
  onSave?: () => void;
  onExecute?: () => void;
}

export function WorkflowEditor({ 
  workflowId, 
  workflowVersion,
  initialData,
  showEmptyState = true,
  saveStatus = "saved",
  lastSavedAt,
  isOnline = true,
  collaborators = [],
  executionStatus = "idle",
  onSave,
  onExecute,
}: WorkflowEditorProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // 响应式面板宽度 - Manus 规格
  const leftPanelWidth = isTablet ? PANEL_WIDTH.leftTablet : PANEL_WIDTH.left;
  const rightPanelWidth = isTablet ? PANEL_WIDTH.rightTablet : PANEL_WIDTH.right;
  
  // 面板折叠状态
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(true);
  const [isExecutionPanelCollapsed, setIsExecutionPanelCollapsed] = useState(true);
  
  // 移动端 Sheet 状态
  const [isNodeSheetOpen, setIsNodeSheetOpen] = useState(false);
  const [isConfigSheetOpen, setIsConfigSheetOpen] = useState(false);

  const {
    setWorkflow,
    setNodes,
    setEdges,
    nodes,
    edges,
    selectedNodeIds,
    setExecuting,
    isExecuting,
    isDirty,
    markSaved,
  } = useWorkflowStore();

  // 初始化工作流数据
  useEffect(() => {
    if (initialData) {
      if (initialData.name) {
        setWorkflow({
          id: workflowId || "new",
          name: initialData.name,
          description: "",
          icon: "workflow",
          status: "draft",
          triggerType: "manual",
          triggerConfig: {},
          variables: {},
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      if (initialData.nodes) {
        setNodes(initialData.nodes as Parameters<typeof setNodes>[0]);
      }
      if (initialData.edges) {
        setEdges(initialData.edges as Parameters<typeof setEdges>[0]);
      }
      markSaved();
    }
  }, [workflowId, initialData, setWorkflow, setNodes, setEdges, markSaved]);

  // 保存工作流
  const handleSave = useCallback(async () => {
    console.log("Saving workflow...", { nodes, edges });
    onSave?.();
  }, [nodes, edges, onSave]);

  // 快捷键处理
  useEffect(() => {
    const isInputElement = () => {
      const activeElement = document.activeElement;
      return (
        activeElement?.tagName === "INPUT" ||
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.getAttribute("contenteditable") === "true"
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey;

      if (isCmd && e.key === "s") {
        e.preventDefault();
        handleSave();
      }

      if (isCmd && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        useWorkflowStore.getState().undo();
      }

      if ((isCmd && e.key === "z" && e.shiftKey) || (isCmd && e.key === "y")) {
        e.preventDefault();
        useWorkflowStore.getState().redo();
      }

      if (isCmd && e.key === "c" && !isInputElement()) {
        if (selectedNodeIds.length > 0) {
          e.preventDefault();
          useWorkflowStore.getState().copySelectedNodes();
        }
      }

      if (isCmd && e.key === "v" && !isInputElement()) {
        e.preventDefault();
        useWorkflowStore.getState().pasteNodes();
      }

      if (isCmd && e.key === "d" && !isInputElement()) {
        if (selectedNodeIds.length > 0) {
          e.preventDefault();
          useWorkflowStore.getState().duplicateSelectedNodes();
        }
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedNodeIds.length > 0) {
        if (!isInputElement()) {
          e.preventDefault();
          useWorkflowStore.getState().removeNodes(selectedNodeIds);
        }
      }

      if (isCmd && e.key === "a") {
        if (!isInputElement()) {
          e.preventDefault();
          useWorkflowStore.getState().selectAll();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeIds, handleSave]);

  // 运行工作流
  const handleRun = useCallback(async () => {
    console.log("Running workflow...");
    setExecuting(true);
    setIsExecutionPanelCollapsed(false); // 运行时展开执行面板
    onExecute?.();
    setTimeout(() => {
      setExecuting(false);
    }, 3000);
  }, [setExecuting, onExecute]);

  // 停止执行
  const handleStop = useCallback(async () => {
    console.log("Stopping workflow...");
    setExecuting(false);
  }, [setExecuting]);

  // 根据选中状态自动显示/隐藏配置面板
  useEffect(() => {
    if (selectedNodeIds.length > 0) {
      if (isMobile) {
        setIsConfigSheetOpen(true);
      } else if (isRightPanelCollapsed) {
        setIsRightPanelCollapsed(false);
      }
    }
  }, [selectedNodeIds, isRightPanelCollapsed, isMobile]);

  // 编辑器始终使用深色主题的样式类
  const editorBg = "bg-background-studio";
  const panelBg = "bg-surface-100/95 backdrop-blur-sm";
  const borderColor = "border-border";
  const buttonBg = "bg-surface-200/80 backdrop-blur-sm";
  const buttonBorder = "border-border/70";

  // 移动端布局
  if (isMobile) {
    return (
      <ReactFlowProvider>
        <div className={cn("flex flex-col h-full overflow-hidden", editorBg)}>
          {/* 顶部工具栏 */}
          <EditorToolbar
            workflowName={initialData?.name || "未命名工作流"}
            workflowVersion={workflowVersion}
            onSave={handleSave}
            onRun={handleRun}
            onStop={handleStop}
            saveStatus={saveStatus}
            lastSavedAt={lastSavedAt}
            isOnline={isOnline}
            collaborators={collaborators}
            executionStatus={executionStatus}
          />

          {/* 画布区域 (全屏) */}
          <div className="flex-1 relative overflow-hidden">
            <EditorCanvas showEmptyState={showEmptyState} />
            
            {/* 移动端浮动操作按钮 */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10">
              <Sheet open={isNodeSheetOpen} onOpenChange={setIsNodeSheetOpen}>
                <SheetTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="outline"
                    className={cn("h-12 w-12 rounded-xl shadow-lg", buttonBg, buttonBorder)}
                  >
                    <Layers className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className={cn("w-[280px] p-0", panelBg, borderColor)}>
                  <SheetHeader className={cn("px-4 py-3 border-b", borderColor)}>
                    <SheetTitle className="flex items-center gap-2 text-sm text-foreground">
                      <Layers className="h-4 w-4 text-brand-500" />
                      节点
                    </SheetTitle>
                  </SheetHeader>
                  <div className="h-[calc(100%-52px)] overflow-auto">
                    <NodePanel />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
              <Sheet open={isConfigSheetOpen} onOpenChange={setIsConfigSheetOpen}>
                <SheetTrigger asChild>
                  <Button 
                    size="icon" 
                    variant={selectedNodeIds.length > 0 ? "default" : "outline"}
                    className={cn(
                      "h-12 w-12 rounded-xl shadow-lg",
                      selectedNodeIds.length > 0 
                        ? "bg-linear-to-r from-brand-500 to-brand-600" 
                        : cn(buttonBg, buttonBorder)
                    )}
                    disabled={selectedNodeIds.length === 0}
                  >
                    <Settings2 className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className={cn("w-[300px] p-0", panelBg, borderColor)}>
                  <SheetHeader className={cn("px-4 py-3 border-b", borderColor)}>
                    <SheetTitle className="flex items-center gap-2 text-sm text-foreground">
                      <Settings2 className="h-4 w-4 text-brand-500" />
                      配置
                    </SheetTitle>
                  </SheetHeader>
                  <div className="h-[calc(100%-52px)] overflow-auto">
                    <ConfigPanel />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </ReactFlowProvider>
    );
  }

  // 桌面端布局 - Manus 风格
  return (
    <ReactFlowProvider>
      <div className={cn("flex flex-col h-full overflow-hidden", editorBg)}>
        {/* 顶部工具栏 - h-12 */}
        <EditorToolbar
          workflowName={initialData?.name || "未命名工作流"}
          workflowVersion={workflowVersion}
          onSave={handleSave}
          onRun={handleRun}
          onStop={handleStop}
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt}
          isOnline={isOnline}
          collaborators={collaborators}
          executionStatus={executionStatus}
        />

        {/* 主体区域 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 左侧节点面板 - w-[260px] */}
          <aside
            className={cn(
              "shrink-0 overflow-hidden border-r",
              borderColor, panelBg,
              "transition-[width] duration-200 ease-out"
            )}
            style={{ width: isLeftPanelCollapsed ? 0 : leftPanelWidth }}
          >
            <NodePanel />
          </aside>

          {/* 中间画布区域 + 底部执行面板 */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* 画布区域 */}
            <div className="flex-1 relative overflow-hidden">
            <EditorCanvas showEmptyState={showEmptyState} />
              
              {/* 面板折叠按钮 - 左侧 */}
              <button
                onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 z-10 left-0",
                  "w-5 h-12 rounded-r-lg",
                  buttonBg, "border border-l-0", borderColor,
                  "flex items-center justify-center",
                  "shadow-sm",
                  "hover:bg-surface-200",
                  "transition-colors duration-150"
                )}
              >
                <ChevronLeft 
                  className={cn(
                    "h-4 w-4 text-foreground-muted transition-transform duration-150",
                    isLeftPanelCollapsed && "rotate-180"
                  )}
                />
              </button>

              {/* 面板折叠按钮 - 右侧 */}
              <button
                onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 z-10 right-0",
                  "w-5 h-12 rounded-l-lg",
                  buttonBg, "border border-r-0", borderColor,
                  "flex items-center justify-center",
                  "shadow-sm",
                  "hover:bg-surface-200",
                  "transition-colors duration-150"
                )}
              >
                <ChevronRight 
                  className={cn(
                    "h-4 w-4 text-foreground-muted transition-transform duration-150",
                    isRightPanelCollapsed && "rotate-180"
                  )}
                />
              </button>

              {/* 底部执行面板折叠按钮 */}
              <button
                onClick={() => setIsExecutionPanelCollapsed(!isExecutionPanelCollapsed)}
                className={cn(
                  "absolute bottom-0 left-1/2 -translate-x-1/2 z-10",
                  "h-5 w-12 rounded-t-lg",
                  buttonBg, "border border-b-0", borderColor,
                  "flex items-center justify-center",
                  "shadow-sm",
                  "hover:bg-surface-200",
                  "transition-colors duration-150"
                )}
              >
                {isExecutionPanelCollapsed ? (
                  <ChevronUp className="h-4 w-4 text-foreground-muted" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-foreground-muted" />
                )}
              </button>
            </div>

            {/* 底部执行面板 - 可折叠 */}
            <div
              className={cn(
                "overflow-hidden border-t",
                borderColor, panelBg,
                "transition-[max-height] duration-200 ease-out"
              )}
              style={{ maxHeight: isExecutionPanelCollapsed ? 0 : 300 }}
            >
              <ExecutionPanel
                workflowId={workflowId || "new"}
                onExecute={handleRun}
                onCancel={handleStop}
              />
            </div>
          </div>

          {/* 右侧配置面板 - w-[320px] */}
          <aside
            className={cn(
              "shrink-0 overflow-hidden border-l",
              borderColor, panelBg,
              "transition-[width] duration-200 ease-out"
            )}
            style={{ width: isRightPanelCollapsed ? 0 : rightPanelWidth }}
          >
            <ConfigPanel />
          </aside>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
