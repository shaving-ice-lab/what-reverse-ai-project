"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LazyWorkflowEditor } from "@/components/editor";
import { workflowApi } from "@/lib/api";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 工作流编辑器页面
 * Supabase 风格：极简、清晰、专业
 *
 * 使用懒加载编辑器实现代码分割，
 * 减少初始加载时间
 *
 * 功能：
 * - 工作流数据加载
 * - 自动保存状态
 * - 协作编辑指示
 * - 执行状态反馈
 */

type SaveStatus = "saved" | "saving" | "unsaved" | "error";

interface EditorState {
  isLoading: boolean;
  error: string | null;
  workflowData: {
    id?: string;
    name: string;
    description?: string;
    nodes: unknown[];
    edges: unknown[];
    variables?: Record<string, unknown>;
    version?: number;
  } | null;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  isOnline: boolean;
  collaborators: Array<{ id: string; name: string; avatar?: string; cursor?: { x: number; y: number } }>;
  executionStatus: "idle" | "running" | "completed" | "failed";
}

export default function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  
  // 判断是新建还是编辑
  const isNew = id === "new";

  // 编辑器状态
  const [state, setState] = useState<EditorState>({
    isLoading: !isNew,
    error: null,
    workflowData: isNew ? {
      name: "未命名工作流",
      description: "",
      nodes: [],
      edges: [],
      variables: {},
    } : null,
    saveStatus: isNew ? "unsaved" : "saved",
    lastSavedAt: null,
    isOnline: true,
    collaborators: [],
    executionStatus: "idle",
  });

  // 监听在线状态
  useEffect(() => {
    const handleOnline = () => setState(s => ({ ...s, isOnline: true }));
    const handleOffline = () => setState(s => ({ ...s, isOnline: false }));
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 加载工作流数据
  useEffect(() => {
    if (isNew) return;

    const loadWorkflow = async () => {
      setState(s => ({ ...s, isLoading: true, error: null }));
      
      try {
        const workflow = await workflowApi.get(id);
        
        setState(s => ({
          ...s,
          isLoading: false,
          workflowData: {
            id: workflow.id,
            name: workflow.name,
            description: workflow.description || "",
            nodes: workflow.definition?.nodes || [],
            edges: workflow.definition?.edges || [],
            variables: workflow.variables || {},
            version: workflow.version,
          },
          lastSavedAt: new Date(workflow.updatedAt),
        }));
      } catch (err) {
        setState(s => ({
          ...s,
          isLoading: false,
          error: err instanceof Error ? err.message : "加载工作流失败",
        }));
      }
    };

    loadWorkflow();
  }, [id, isNew]);

  // 保存工作流
  const handleSave = useCallback(async () => {
    if (!state.workflowData) return;
    
    setState(s => ({ ...s, saveStatus: "saving" }));
    
    try {
      if (isNew) {
        // 创建新工作流
        const created = await workflowApi.create({
          name: state.workflowData.name,
          description: state.workflowData.description,
          definition: {
            nodes: state.workflowData.nodes,
            edges: state.workflowData.edges,
          },
          variables: state.workflowData.variables,
        });
        
        // 跳转到编辑页面
        router.replace(`/editor/${created.id}`);
      } else {
        // 更新现有工作流
        await workflowApi.update(id, {
          name: state.workflowData.name,
          description: state.workflowData.description,
          definition: {
            nodes: state.workflowData.nodes,
            edges: state.workflowData.edges,
          },
          variables: state.workflowData.variables,
        });
      }
      
      setState(s => ({
        ...s,
        saveStatus: "saved",
        lastSavedAt: new Date(),
      }));
    } catch (err) {
      setState(s => ({
        ...s,
        saveStatus: "error",
      }));
      console.error("保存失败:", err);
    }
  }, [state.workflowData, isNew, id, router]);

  // 执行工作流
  const handleExecute = useCallback(async () => {
    if (isNew || !state.workflowData?.id) return;
    
    setState(s => ({ ...s, executionStatus: "running" }));
    
    try {
      await workflowApi.execute(id, {});
      setState(s => ({ ...s, executionStatus: "completed" }));
      
      // 3秒后重置状态
      setTimeout(() => {
        setState(s => ({ ...s, executionStatus: "idle" }));
      }, 3000);
    } catch (err) {
      setState(s => ({ ...s, executionStatus: "failed" }));
      console.error("执行失败:", err);
    }
  }, [isNew, state.workflowData?.id, id]);

  // 重试加载
  const handleRetry = () => {
    if (!isNew) {
      setState(s => ({ ...s, isLoading: true, error: null }));
      // 触发重新加载
      window.location.reload();
    }
  };

  // 加载状态 - Supabase 风格
  if (state.isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-background-studio">
        <div className="page-panel px-6 py-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-md bg-surface-200 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">正在加载工作流</h3>
            <p className="text-xs text-foreground-muted mt-1">准备编辑器资源...</p>
          </div>
        </div>
      </div>
    );
  }

  // 错误状态 - Supabase 风格
  if (state.error) {
    return (
      <div className="h-full flex items-center justify-center bg-background-studio">
        <div className="page-panel px-6 py-5 flex flex-col items-center gap-4 max-w-md">
          <div className="h-10 w-10 rounded-md bg-surface-200 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-foreground-light" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium text-foreground">加载失败</h3>
            <p className="text-xs text-foreground-muted mt-1">{state.error}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              返回
            </Button>
            <Button size="sm" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-1.5" />
              重试
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 准备初始数据
  const initialData = state.workflowData ? {
    name: state.workflowData.name,
    nodes: state.workflowData.nodes,
    edges: state.workflowData.edges,
  } : {
    name: "未命名工作流",
    nodes: [],
    edges: [],
  };

  return (
    <div className="h-full bg-background-studio">
      <LazyWorkflowEditor
        workflowId={id}
        initialData={initialData}
        workflowVersion={state.workflowData?.version}
        saveStatus={state.saveStatus}
        lastSavedAt={state.lastSavedAt}
        isOnline={state.isOnline}
        collaborators={state.collaborators}
        executionStatus={state.executionStatus}
        onSave={handleSave}
        onExecute={handleExecute}
      />
    </div>
  );
}
