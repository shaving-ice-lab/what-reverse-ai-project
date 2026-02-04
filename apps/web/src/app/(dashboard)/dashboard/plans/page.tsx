"use client";

/**
 * 规划模块 - 可编辑 + 可视化
 * 以 Workspace 为作用域的 WBS 编辑器与看板视图
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Sparkles,
  Layers,
  Wand2,
  PencilLine,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  ShieldAlert,
  Timer,
  Link2,
  GitBranch,
  CalendarRange,
  History,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PageContainer,
  PageHeader,
  PageWithSidebar,
} from "@/components/dashboard/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ExceptionState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { workspaceApi, type Workspace } from "@/lib/api/workspace";
import { planApi, type PlanModule, type PlanTask, type PlanVersionSummary, type PlanVersion } from "@/lib/api/plan";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  buildWorkspacePermissions,
  hasWorkspacePermission,
  resolveWorkspaceRoleFromUser,
} from "@/lib/permissions";

type StatusKey = "todo" | "in_progress" | "blocked" | "done";

const statusColumns: Array<{
  key: StatusKey;
  label: string;
  accent: string;
  icon: React.ElementType;
}> = [
  { key: "todo", label: "待点亮", accent: "text-foreground-light", icon: CircleDashed },
  { key: "in_progress", label: "推进中", accent: "text-sky-300", icon: Sparkles },
  { key: "blocked", label: "受阻", accent: "text-amber-300", icon: ShieldAlert },
  { key: "done", label: "已封存", accent: "text-emerald-300", icon: CheckCircle2 },
];

const phasePalette: Record<string, { label: string; color: string; glow: string }> = {
  foundation: { label: "基底", color: "bg-[#2b6b5d]", glow: "shadow-[0_0_16px_rgba(43,107,93,0.6)]" },
  core: { label: "核心", color: "bg-[#3b7aa0]", glow: "shadow-[0_0_16px_rgba(59,122,160,0.6)]" },
  release: { label: "发布", color: "bg-[#80628a]", glow: "shadow-[0_0_16px_rgba(128,98,138,0.55)]" },
  access: { label: "访问", color: "bg-[#9b7d4a]", glow: "shadow-[0_0_16px_rgba(155,125,74,0.55)]" },
  other: { label: "其他", color: "bg-[#3a3a3a]", glow: "shadow-[0_0_12px_rgba(58,58,58,0.4)]" },
};

function toDependencies(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDependencies(list?: string[]): string {
  return list && list.length > 0 ? list.join(", ") : "";
}

function normalizePhase(phase?: string) {
  const key = (phase || "").toLowerCase();
  return phasePalette[key] ? key : "other";
}

function normalizeDependencyKey(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeTaskKey(value?: string) {
  if (!value) return "";
  return normalizeDependencyKey(value);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date: Date) {
  if (Number.isNaN(date.getTime())) return "-";
  return date.toISOString().slice(0, 10);
}

function getTaskStats(tasks: PlanTask[]) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "done").length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
  const estimate = tasks.reduce((sum, task) => sum + (task.estimate_days || 0), 0);
  return { total, completed, progress, estimate };
}

type PlanDiff = {
  modulesAdded: string[];
  modulesRemoved: string[];
  tasksAdded: string[];
  tasksRemoved: string[];
  statusChanged: Array<{ title: string; from: string; to: string }>;
};

function buildPlanDiff(currentModules: PlanModule[], snapshotModules: Array<Record<string, unknown>>): PlanDiff {
  const currentModuleKeys = new Map<string, string>();
  currentModules.forEach((module) => {
    const key = module.key || module.name || module.id;
    if (key) currentModuleKeys.set(normalizeTaskKey(key), module.name || key);
  });

  const snapshotModuleKeys = new Map<string, string>();
  snapshotModules.forEach((module) => {
    const key = String(module?.key || module?.name || module?.id || "");
    if (key) snapshotModuleKeys.set(normalizeTaskKey(key), String(module?.name || key));
  });

  const modulesAdded: string[] = [];
  const modulesRemoved: string[] = [];

  snapshotModuleKeys.forEach((label, key) => {
    if (!currentModuleKeys.has(key)) modulesAdded.push(label);
  });
  currentModuleKeys.forEach((label, key) => {
    if (!snapshotModuleKeys.has(key)) modulesRemoved.push(label);
  });

  const currentTasks = new Map<string, { title: string; status: string }>();
  currentModules.forEach((module) => {
    const moduleLabel = module.name || module.key || module.id;
    (module.tasks || []).forEach((task) => {
      const key = normalizeTaskKey(task.code || task.id || task.title);
      if (!key) return;
      const title = `${moduleLabel} · ${task.title}`;
      currentTasks.set(key, { title, status: task.status });
    });
  });

  const snapshotTasks = new Map<string, { title: string; status: string }>();
  snapshotModules.forEach((module) => {
    const moduleLabel = String(module?.name || module?.key || module?.id || "模块");
    const tasks = Array.isArray(module?.tasks) ? (module?.tasks as Record<string, unknown>[]) : [];
    tasks.forEach((task) => {
      const rawKey = String(task?.code || task?.id || task?.title || "");
      const key = normalizeTaskKey(rawKey);
      if (!key) return;
      const title = `${moduleLabel} · ${String(task?.title || rawKey)}`;
      const status = String(task?.status || "todo");
      snapshotTasks.set(key, { title, status });
    });
  });

  const tasksAdded: string[] = [];
  const tasksRemoved: string[] = [];
  const statusChanged: Array<{ title: string; from: string; to: string }> = [];

  snapshotTasks.forEach((task, key) => {
    if (!currentTasks.has(key)) {
      tasksAdded.push(task.title);
    } else {
      const current = currentTasks.get(key);
      if (current && current.status !== task.status) {
        statusChanged.push({ title: task.title, from: current.status, to: task.status });
      }
    }
  });

  currentTasks.forEach((task, key) => {
    if (!snapshotTasks.has(key)) tasksRemoved.push(task.title);
  });

  return {
    modulesAdded,
    modulesRemoved,
    tasksAdded,
    tasksRemoved,
    statusChanged,
  };
}

function formatTimestamp(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PlansPage() {
  const { user } = useAuthStore();
  const workspaceRole = resolveWorkspaceRoleFromUser(user?.role);
  const permissions = buildWorkspacePermissions(workspaceRole);
  const canManagePlan =
    hasWorkspacePermission(permissions, "plan_manage") ||
    hasWorkspacePermission(permissions, "workspace_admin");

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("");
  const [modules, setModules] = useState<PlanModule[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string>("");
  const [activeView, setActiveView] = useState<"board" | "dependency" | "gantt">("board");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<PlanModule | null>(null);
  const [moduleForm, setModuleForm] = useState({
    name: "",
    key: "",
    description: "",
  });

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PlanTask | null>(null);
  const [taskForm, setTaskForm] = useState({
    code: "",
    title: "",
    phase: "foundation",
    owner: "",
    deliverable: "",
    acceptance: "",
    estimate_days: 1,
    status: "todo" as StatusKey,
    dependencies: "",
  });

  const [versions, setVersions] = useState<PlanVersionSummary[]>([]);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [versionForm, setVersionForm] = useState({ label: "", note: "" });
  const [previewVersion, setPreviewVersion] = useState<PlanVersion | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [dragSourceId, setDragSourceId] = useState<string | null>(null);
  const [ganttStartDate, setGanttStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const dependencyCanvasRef = useRef<HTMLDivElement | null>(null);
  const [dependencyWidth, setDependencyWidth] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        const data = await workspaceApi.list();
        setWorkspaces(data);
        if (data.length > 0) {
          setActiveWorkspaceId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load workspaces:", err);
        setError("工作空间加载失败，请稍后重试。");
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    loadModules(activeWorkspaceId);
    loadVersions(activeWorkspaceId);
  }, [activeWorkspaceId]);

  const loadModules = async (workspaceId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await planApi.listModules(workspaceId);
      setModules(data);
      if (data.length > 0) {
        setActiveModuleId((prev) => prev || data[0].id);
      } else {
        setActiveModuleId("");
      }
    } catch (err) {
      console.error("Failed to load plan modules:", err);
      setError("规划模块加载失败，请检查权限或稍后重试。");
    } finally {
      setIsLoading(false);
    }
  };

  const loadVersions = async (workspaceId: string) => {
    try {
      const data = await planApi.listVersions(workspaceId);
      setVersions(data);
    } catch (err) {
      console.error("Failed to load plan versions:", err);
    }
  };

  const activeModule = useMemo(() => {
    return modules.find((module) => module.id === activeModuleId) || modules[0] || null;
  }, [modules, activeModuleId]);

  const activeTasks = activeModule?.tasks || [];
  const stats = getTaskStats(activeTasks);

  useEffect(() => {
    const updateWidth = () => {
      if (!dependencyCanvasRef.current) return;
      setDependencyWidth(dependencyCanvasRef.current.clientWidth);
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [activeView, activeTasks.length]);

  const phaseDistribution = useMemo(() => {
    const totals: Record<string, number> = {};
    activeTasks.forEach((task) => {
      const key = normalizePhase(task.phase);
      totals[key] = (totals[key] || 0) + (task.estimate_days || 0);
    });
    return totals;
  }, [activeTasks]);

  const phaseTotal = Object.values(phaseDistribution).reduce((sum, value) => sum + value, 0);

  const getDependencyKey = (task: PlanTask) => task.code || task.id || task.title;

  const dependencyGraph = useMemo(() => {
    const byCode = new Map<string, PlanTask>();
    const byTitle = new Map<string, PlanTask>();
    const byId = new Map<string, PlanTask>();
    activeTasks.forEach((task) => {
      if (task.code) byCode.set(task.code, task);
      if (task.title) byTitle.set(task.title, task);
      byId.set(task.id, task);
    });

    const edges: Array<{ from: PlanTask; to: PlanTask; ref: string }> = [];
    const unresolved: Array<{ task: PlanTask; ref: string }> = [];
    activeTasks.forEach((task) => {
      const deps = task.dependencies || [];
      deps.forEach((ref) => {
        const normalizedRef = normalizeDependencyKey(ref);
        const resolved =
          byCode.get(ref) ||
          byCode.get(normalizedRef) ||
          byId.get(ref) ||
          byTitle.get(ref);
        if (resolved) {
          edges.push({ from: resolved, to: task, ref });
        } else {
          unresolved.push({ task, ref });
        }
      });
    });
    return { edges, unresolved };
  }, [activeTasks]);

  const dependencyRows = useMemo(() => {
    return [...activeTasks].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  }, [activeTasks]);

  const dependencyIndex = useMemo(() => {
    const index = new Map<string, number>();
    dependencyRows.forEach((task, idx) => {
      index.set(task.id, idx);
    });
    return index;
  }, [dependencyRows]);

  const ganttRows = useMemo(() => {
    const sorted = [...activeTasks].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
    const baseDate = new Date(`${ganttStartDate}T00:00:00`);
    let cursor = 0;
    return sorted.map((task) => {
      const duration = Math.max(task.estimate_days || 1, 1);
      const start = cursor;
      const end = cursor + duration;
      const startDate = addDays(baseDate, start);
      const endDate = addDays(baseDate, end - 1);
      cursor = end;
      return { task, start, end, duration, startDate, endDate };
    });
  }, [activeTasks, ganttStartDate]);

  const ganttTotalDays = ganttRows.length > 0 ? ganttRows[ganttRows.length - 1].end : 0;
  const ganttEndDate = ganttRows.length > 0 ? ganttRows[ganttRows.length - 1].endDate : null;

  const previewSummary = useMemo(() => {
    if (!previewVersion) return null;
    const snapshot = previewVersion.snapshot as Record<string, unknown>;
    const modules = Array.isArray(snapshot?.modules) ? (snapshot.modules as Record<string, unknown>[]) : [];
    const totalModules =
      typeof snapshot?.total_modules === "number" ? (snapshot.total_modules as number) : modules.length;
    const totalTasks =
      typeof snapshot?.total_tasks === "number"
        ? (snapshot.total_tasks as number)
        : modules.reduce((sum, module) => {
            const tasks = Array.isArray(module?.tasks) ? module.tasks : [];
            return sum + tasks.length;
          }, 0);
    return { modules, totalModules, totalTasks, capturedAt: snapshot?.captured_at as string | undefined };
  }, [previewVersion]);

  const planDiff = useMemo(() => {
    if (!previewSummary) return null;
    return buildPlanDiff(modules, previewSummary.modules);
  }, [modules, previewSummary]);

  const openCreateModule = () => {
    setEditingModule(null);
    setModuleForm({ name: "", key: "", description: "" });
    setModuleDialogOpen(true);
  };

  const handleDependencyDrop = async (targetTask: PlanTask) => {
    if (!canManagePlan || !dragSourceId || !activeWorkspaceId) return;
    if (targetTask.id === dragSourceId) return;
    const sourceTask = activeTasks.find((task) => task.id === dragSourceId);
    if (!sourceTask) return;
    const dependencyKey = getDependencyKey(sourceTask);
    if (!dependencyKey) return;
    const existing = new Set(targetTask.dependencies || []);
    if (existing.has(dependencyKey)) return;
    existing.add(dependencyKey);
    try {
      await planApi.updateTask(targetTask.id, {
        dependencies: Array.from(existing),
      });
      await loadModules(activeWorkspaceId);
    } catch (err) {
      console.error("Failed to update dependencies:", err);
      setError("更新依赖失败，请稍后重试。");
    } finally {
      setDragSourceId(null);
    }
  };

  const removeDependency = async (task: PlanTask, dependency: string) => {
    if (!canManagePlan || !activeWorkspaceId) return;
    const nextDeps = (task.dependencies || []).filter((dep) => dep !== dependency);
    try {
      await planApi.updateTask(task.id, { dependencies: nextDeps });
      await loadModules(activeWorkspaceId);
    } catch (err) {
      console.error("Failed to remove dependency:", err);
      setError("移除依赖失败，请稍后重试。");
    }
  };

  const openEditModule = (module: PlanModule) => {
    setEditingModule(module);
    setModuleForm({
      name: module.name,
      key: module.key || "",
      description: module.description || "",
    });
    setModuleDialogOpen(true);
  };

  const submitModule = async () => {
    if (!activeWorkspaceId || !moduleForm.name.trim()) return;
    try {
      if (editingModule) {
        await planApi.updateModule(editingModule.id, {
          name: moduleForm.name.trim(),
          key: moduleForm.key.trim() || undefined,
          description: moduleForm.description.trim() || undefined,
        });
      } else {
        await planApi.createModule(activeWorkspaceId, {
          name: moduleForm.name.trim(),
          key: moduleForm.key.trim() || undefined,
          description: moduleForm.description.trim() || undefined,
        });
      }
      setModuleDialogOpen(false);
      await loadModules(activeWorkspaceId);
    } catch (err) {
      console.error("Failed to save module:", err);
      setError("保存模块失败，请检查权限或稍后重试。");
    }
  };

  const deleteModule = async (moduleId: string) => {
    if (!activeWorkspaceId) return;
    if (!confirm("确认删除该模块及其任务？此操作无法撤销。")) return;
    try {
      await planApi.deleteModule(moduleId);
      await loadModules(activeWorkspaceId);
    } catch (err) {
      console.error("Failed to delete module:", err);
      setError("删除模块失败，请稍后重试。");
    }
  };

  const openCreateTask = (status: StatusKey) => {
    setEditingTask(null);
    setTaskForm({
      code: "",
      title: "",
      phase: "foundation",
      owner: "",
      deliverable: "",
      acceptance: "",
      estimate_days: 1,
      status,
      dependencies: "",
    });
    setTaskDialogOpen(true);
  };

  const openEditTask = (task: PlanTask) => {
    setEditingTask(task);
    setTaskForm({
      code: task.code || "",
      title: task.title,
      phase: task.phase || "foundation",
      owner: task.owner || "",
      deliverable: task.deliverable || "",
      acceptance: task.acceptance || "",
      estimate_days: task.estimate_days || 0,
      status: (task.status as StatusKey) || "todo",
      dependencies: formatDependencies(task.dependencies),
    });
    setTaskDialogOpen(true);
  };

  const submitTask = async () => {
    if (!activeModule) return;
    if (!taskForm.title.trim()) return;
    const dependencies = toDependencies(taskForm.dependencies);
    try {
      if (editingTask) {
        await planApi.updateTask(editingTask.id, {
          code: taskForm.code.trim() || undefined,
          title: taskForm.title.trim(),
          phase: taskForm.phase.trim(),
          owner: taskForm.owner.trim(),
          deliverable: taskForm.deliverable.trim(),
          acceptance: taskForm.acceptance.trim(),
          estimate_days: taskForm.estimate_days,
          status: taskForm.status,
          dependencies,
        });
      } else {
        await planApi.createTask(activeModule.id, {
          code: taskForm.code.trim() || undefined,
          title: taskForm.title.trim(),
          phase: taskForm.phase.trim(),
          owner: taskForm.owner.trim(),
          deliverable: taskForm.deliverable.trim(),
          acceptance: taskForm.acceptance.trim(),
          estimate_days: taskForm.estimate_days,
          status: taskForm.status,
          dependencies,
        });
      }
      setTaskDialogOpen(false);
      await loadModules(activeWorkspaceId);
    } catch (err) {
      console.error("Failed to save task:", err);
      setError("保存任务失败，请稍后重试。");
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!activeWorkspaceId) return;
    if (!confirm("确认删除该任务？")) return;
    try {
      await planApi.deleteTask(taskId);
      await loadModules(activeWorkspaceId);
    } catch (err) {
      console.error("Failed to delete task:", err);
      setError("删除任务失败，请稍后重试。");
    }
  };

  const seedDefaults = async () => {
    if (!activeWorkspaceId) return;
    try {
      await planApi.seedModules(activeWorkspaceId);
      await loadModules(activeWorkspaceId);
    } catch (err) {
      console.error("Failed to seed modules:", err);
      setError("初始化默认 WBS 失败，可能已初始化或无权限。");
    }
  };

  const openCreateVersion = () => {
    setVersionForm({ label: "", note: "" });
    setVersionDialogOpen(true);
  };

  const submitVersion = async () => {
    if (!activeWorkspaceId) return;
    try {
      await planApi.createVersion(activeWorkspaceId, {
        label: versionForm.label.trim() || undefined,
        note: versionForm.note.trim() || undefined,
      });
      setVersionDialogOpen(false);
      await loadVersions(activeWorkspaceId);
    } catch (err) {
      console.error("Failed to create plan version:", err);
      setError("创建规划版本失败，请稍后重试。");
    }
  };

  const openPreviewVersion = async (versionId: string) => {
    try {
      const version = await planApi.getVersion(versionId);
      setPreviewVersion(version);
      setPreviewOpen(true);
    } catch (err) {
      console.error("Failed to load plan version:", err);
      setError("加载版本详情失败，请稍后重试。");
    }
  };

  const restoreVersion = async () => {
    if (!previewVersion || !activeWorkspaceId) return;
    if (!confirm("确认恢复到此版本？当前规划将被替换。")) return;
    try {
      await planApi.restoreVersion(previewVersion.id);
      setPreviewOpen(false);
      await loadModules(activeWorkspaceId);
      await loadVersions(activeWorkspaceId);
    } catch (err) {
      console.error("Failed to restore plan version:", err);
      setError("恢复版本失败，请稍后重试。");
    }
  };

  const renderViewContent = () => {
    if (isLoading) {
      return (
        <div className="rounded-xl border border-border bg-surface-100 p-6 text-[12px] text-foreground-light">
          正在加载规划数据...
        </div>
      );
    }

    if (activeView === "board") {
      return activeTasks.length === 0 ? (
        <ExceptionState
          variant="empty"
          title="还没有任务"
          description="为当前模块创建首个任务，或导入默认 WBS。"
          action={
            canManagePlan
              ? {
                  label: "新建任务",
                  onClick: () => openCreateTask("todo"),
                  icon: Plus,
                }
              : undefined
          }
          secondaryAction={
            canManagePlan
              ? {
                  label: "导入默认 WBS",
                  onClick: seedDefaults,
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {statusColumns.map((column) => {
            const ColumnIcon = column.icon;
            const tasks = activeTasks.filter((task) => task.status === column.key);
            return (
              <div
                key={column.key}
                className="rounded-xl border border-border bg-surface-100/60 p-4 flex flex-col min-h-[260px]"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ColumnIcon className={cn("w-4 h-4", column.accent)} />
                    <div className="text-[12px] text-foreground">{column.label}</div>
                    <Badge variant="outline" className="text-[11px] border-border">
                      {tasks.length}
                    </Badge>
                  </div>
                  <button
                    className={cn(
                      "text-foreground-light hover:text-foreground",
                      !canManagePlan && "opacity-40 cursor-not-allowed"
                    )}
                    onClick={() => {
                      if (canManagePlan) openCreateTask(column.key);
                    }}
                    disabled={!canManagePlan}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 flex-1">
                  {tasks.length === 0 && (
                    <div className="text-[11px] text-foreground-light border border-dashed border-border rounded-lg p-3">
                      暂无任务，点击右上角 + 添加。
                    </div>
                  )}
                  {tasks.map((task) => {
                    const phaseKey = normalizePhase(task.phase);
                    const palette = phasePalette[phaseKey];
                    return (
                      <div
                        key={task.id}
                        className="rounded-lg border border-border bg-background-200 p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-[13px] text-foreground font-medium">
                              {task.title}
                            </div>
                            <div className="text-[11px] text-foreground-light flex items-center gap-2">
                              <Timer className="w-3 h-3" />
                              {task.estimate_days || 0} 天
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className={cn(
                                "text-foreground-light hover:text-foreground",
                                !canManagePlan && "opacity-40 cursor-not-allowed"
                              )}
                              onClick={() => {
                                if (canManagePlan) openEditTask(task);
                              }}
                              disabled={!canManagePlan}
                            >
                              <PencilLine className="w-4 h-4" />
                            </button>
                            <button
                              className={cn(
                                "text-foreground-light hover:text-destructive",
                                !canManagePlan && "opacity-40 cursor-not-allowed"
                              )}
                              onClick={() => {
                                if (canManagePlan) deleteTask(task.id);
                              }}
                              disabled={!canManagePlan}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("w-2.5 h-2.5 rounded-full", palette.color)} />
                          <span className="text-[11px] text-foreground-light">
                            {palette.label}
                          </span>
                          {task.code && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border text-foreground-light">
                              {task.code}
                            </span>
                          )}
                          {task.owner && (
                            <span className="text-[11px] text-foreground-light">
                              · {task.owner}
                            </span>
                          )}
                        </div>

                        {(task.dependencies?.length || 0) > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="inline-flex items-center gap-1 text-[10px] text-foreground-light">
                              <Link2 className="w-3 h-3" />
                              依赖
                            </span>
                            {task.dependencies?.map((dep) => (
                              <span
                                key={dep}
                                className="text-[10px] px-1.5 py-0.5 rounded-full border border-border text-foreground-light"
                              >
                                {dep}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (activeView === "dependency") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
          <div className="rounded-xl border border-border bg-surface-100/60 p-4">
            <div className="flex items-center gap-2 mb-3 text-[12px] text-foreground">
              <GitBranch className="w-4 h-4" />
              依赖关系流
              <Badge variant="outline" className="text-[11px] border-border">
                {dependencyGraph.edges.length}
              </Badge>
            </div>
            {dependencyRows.length === 0 ? (
              <EmptyState
                icon={GitBranch}
                title="暂无依赖关系"
                description="先为任务配置依赖。"
                size="sm"
                className="py-6"
              />
            ) : (
              <div
                ref={dependencyCanvasRef}
                className="relative rounded-lg border border-border bg-background-200/50 overflow-hidden"
                style={{ height: Math.max(220, dependencyRows.length * 52 + 24) }}
              >
                <svg
                  className="absolute inset-0 pointer-events-none"
                  width={dependencyWidth}
                  height={Math.max(220, dependencyRows.length * 52 + 24)}
                >
                  {dependencyGraph.edges.map((edge, index) => {
                    const fromIndex = dependencyIndex.get(edge.from.id) ?? 0;
                    const toIndex = dependencyIndex.get(edge.to.id) ?? 0;
                    const rowHeight = 52;
                    const padding = 16;
                    const y1 = padding + fromIndex * rowHeight + rowHeight / 2;
                    const y2 = padding + toIndex * rowHeight + rowHeight / 2;
                    const leftX = 150;
                    const rightX = Math.max(dependencyWidth - 150, leftX + 80);
                    const midX = (leftX + rightX) / 2;
                    const path = `M ${leftX} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${rightX} ${y2}`;
                    return (
                      <g key={`${edge.from.id}-${edge.to.id}-${index}`}>
                        <path
                          d={path}
                          stroke="rgba(62,207,142,0.5)"
                          strokeWidth="1.5"
                          fill="none"
                        />
                        <circle cx={leftX} cy={y1} r="3" fill="rgba(62,207,142,0.8)" />
                        <circle cx={rightX} cy={y2} r="3" fill="rgba(62,207,142,0.8)" />
                      </g>
                    );
                  })}
                </svg>

                {dependencyRows.map((task, index) => {
                  const top = 16 + index * 52;
                  return (
                    <div key={task.id} className="absolute inset-x-0" style={{ top }}>
                      <div className="flex items-center justify-between px-4">
                        <div className="w-[130px] text-[11px] text-foreground truncate">
                          {task.title}
                        </div>
                        <div className="text-[10px] text-foreground-light">
                          {task.code || task.id.slice(0, 6)}
                        </div>
                        <div className="w-[130px] text-[11px] text-foreground truncate text-right">
                          {task.title}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface-100/60 p-4">
              <div className="flex items-center gap-2 text-[12px] text-foreground mb-3">
                <GitBranch className="w-4 h-4 text-foreground-light" />
                拖拽建立依赖
                <span className="text-[10px] text-foreground-light">
                  把任务拖到目标任务上
                </span>
              </div>
              <div className="space-y-2">
                {activeTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable={canManagePlan}
                    onDragStart={() => setDragSourceId(task.id)}
                    onDragEnd={() => setDragSourceId(null)}
                    onDragOver={(event) => {
                      if (canManagePlan) event.preventDefault();
                    }}
                    onDrop={() => handleDependencyDrop(task)}
                    className={cn(
                      "rounded-lg border px-3 py-2 transition",
                      dragSourceId === task.id
                        ? "border-brand-500 bg-brand-200/30"
                        : "border-border bg-background-200",
                      canManagePlan ? "cursor-grab active:cursor-grabbing" : "opacity-60"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[12px] text-foreground truncate">
                        {task.title}
                      </div>
                      {task.code && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border text-foreground-light">
                          {task.code}
                        </span>
                      )}
                    </div>
                    {(task.dependencies?.length || 0) > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {task.dependencies?.map((dep) => (
                          <button
                            key={`${task.id}-${dep}`}
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-full border border-border text-foreground-light",
                              canManagePlan && "hover:text-foreground hover:border-foreground"
                            )}
                            onClick={() => removeDependency(task, dep)}
                            disabled={!canManagePlan}
                            title={canManagePlan ? "点击移除依赖" : "无权限编辑"}
                          >
                            {dep}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {activeTasks.length === 0 && (
                  <div className="text-[11px] text-foreground-light border border-dashed border-border rounded-lg p-3">
                    暂无任务可拖拽。
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface-100/60 p-4 space-y-3">
              <div className="flex items-center gap-2 text-[12px] text-foreground">
                <AlertTriangle className="w-4 h-4 text-warning" />
                未解析依赖
              </div>
              {dependencyGraph.unresolved.length === 0 ? (
                <div className="text-[11px] text-foreground-light border border-dashed border-border rounded-lg p-3">
                  当前依赖均已解析。
                </div>
              ) : (
                <div className="space-y-2">
                  {dependencyGraph.unresolved.map((item, index) => (
                    <div
                      key={`${item.task.id}-${item.ref}-${index}`}
                      className="rounded-lg border border-border bg-background-200 px-3 py-2 text-[11px] text-foreground-light"
                    >
                      <div className="text-foreground">{item.task.title}</div>
                      <div className="mt-1">未匹配依赖：{item.ref}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-border bg-surface-100/60 p-4 overflow-x-auto">
        <div className="min-w-[720px] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-foreground-light">
            <div className="flex items-center gap-2">
              <span>开始日期</span>
              <Input
                type="date"
                value={ganttStartDate}
                onChange={(event) => setGanttStartDate(event.target.value)}
                className="h-8 text-[11px] bg-surface-75 border-border"
              />
            </div>
            <div className="flex items-center gap-3">
              <span>累计估算 {ganttTotalDays} 天</span>
              <span>结束日期：{ganttEndDate ? formatDate(ganttEndDate) : "-"}</span>
            </div>
          </div>
          <div className="space-y-3">
            {ganttRows.length === 0 && (
              <EmptyState
                icon={CalendarRange}
                title="暂无任务"
                description="甘特图为空。"
                size="sm"
                className="py-6"
              />
            )}
            {ganttRows.map((row) => {
              const left = ganttTotalDays === 0 ? 0 : (row.start / ganttTotalDays) * 100;
              const width = ganttTotalDays === 0 ? 0 : (row.duration / ganttTotalDays) * 100;
              return (
                <div key={row.task.id} className="flex items-center gap-3">
                  <div className="w-40 text-[12px] text-foreground truncate">{row.task.title}</div>
                  <div className="relative flex-1 h-6 rounded-full bg-surface-200 overflow-hidden">
                    <div
                      className={cn(
                        "absolute inset-y-0 rounded-full",
                        row.task.status === "done"
                          ? "bg-emerald-400"
                          : row.task.status === "in_progress"
                          ? "bg-sky-400"
                          : row.task.status === "blocked"
                          ? "bg-amber-400"
                          : "bg-surface-400"
                      )}
                      style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
                    />
                  </div>
                  <div className="w-28 text-right text-[11px] text-foreground-light">
                    {formatDate(row.startDate)} → {formatDate(row.endDate)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const sidebar = (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface-100/60 p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-40 pointer-events-none bg-[linear-gradient(135deg,rgba(125,255,214,0.12),transparent_45%),linear-gradient(0deg,rgba(98,216,255,0.12),transparent_60%)]" />
        <div className="relative space-y-3">
          <div className="text-[11px] tracking-[0.3em] uppercase text-foreground-light">
            Workspace Signal
          </div>
          <Select value={activeWorkspaceId} onValueChange={setActiveWorkspaceId}>
            <SelectTrigger className="h-9 bg-surface-75 border-border">
              <SelectValue placeholder="选择工作空间" />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-[12px] text-foreground-light">
            当前模块数：<span className="text-foreground">{modules.length}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-100/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-foreground-light">
            模块清单
          </div>
          <Badge variant="outline" className="text-[11px] border-border">
            WBS
          </Badge>
        </div>
        <div className="space-y-2">
          {modules.length === 0 && (
            <EmptyState
              icon={Layers}
              title="还没有模块"
              description="先导入默认 WBS 或新建模块。"
              tone="info"
              size="sm"
              className="py-6"
              action={
                canManagePlan
                  ? {
                      label: "导入默认 WBS",
                      onClick: seedDefaults,
                      icon: Wand2,
                    }
                  : undefined
              }
              secondaryAction={
                canManagePlan
                  ? {
                      label: "新建模块",
                      onClick: openCreateModule,
                    }
                  : undefined
              }
            />
          )}
          {modules.map((module) => {
            const taskCount = module.tasks?.length || 0;
            return (
              <button
                key={module.id}
                onClick={() => setActiveModuleId(module.id)}
                className={cn(
                  "w-full text-left rounded-lg border transition-all px-3 py-2",
                  module.id === activeModule?.id
                    ? "border-brand-500/70 bg-brand-200/40 shadow-[0_0_18px_rgba(62,207,142,0.2)]"
                    : "border-border bg-surface-75 hover:border-border-strong"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[13px] text-foreground font-medium">{module.name}</div>
                    <div className="text-[11px] text-foreground-light">任务 {taskCount} 项</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className={cn(
                        "text-foreground-light hover:text-foreground",
                        !canManagePlan && "opacity-40 cursor-not-allowed"
                      )}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (canManagePlan) openEditModule(module);
                      }}
                      disabled={!canManagePlan}
                    >
                      <PencilLine className="w-4 h-4" />
                    </button>
                    <button
                      className={cn(
                        "text-foreground-light hover:text-destructive",
                        !canManagePlan && "opacity-40 cursor-not-allowed"
                      )}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (canManagePlan) deleteModule(module.id);
                      }}
                      disabled={!canManagePlan}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-100/60 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-foreground-light">
            版本快照
          </div>
          <Badge variant="outline" className="text-[11px] border-border">
            History
          </Badge>
        </div>
        <div className="space-y-2">
          {versions.length === 0 && (
            <EmptyState
              icon={History}
              title="暂无版本记录"
              description="点击右上角“版本快照”生成。"
              size="sm"
              className="py-6"
            />
          )}
          {versions.map((version) => (
            <div
              key={version.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface-75 px-3 py-2"
            >
              <div>
                <div className="text-[12px] text-foreground">
                  {version.label || "未命名快照"}
                </div>
                <div className="text-[10px] text-foreground-light">
                  {formatTimestamp(version.created_at)}
                </div>
              </div>
              <button
                className="text-foreground-light hover:text-foreground"
                onClick={() => openPreviewVersion(version.id)}
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <PageWithSidebar sidebarTitle="规划" sidebarWidth="wide" sidebar={sidebar}>
      <PageContainer fullWidth className="min-h-[calc(100vh-48px)]">
        <div className="space-y-6">
          <PageHeader
            title="规划母版"
            eyebrow="计划 / 可视化 / 可编辑"
            description="将 WBS 变成可编排的执行画布：模块、任务与阶段一屏掌握。"
            icon={<Layers className="w-4 h-4" />}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => loadModules(activeWorkspaceId)}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  刷新
                </Button>
                <Button variant="ghost" size="sm" onClick={openCreateVersion} disabled={!canManagePlan}>
                  <History className="w-4 h-4 mr-1" />
                  版本快照
                </Button>
                <Button variant="ghost" size="sm" onClick={seedDefaults} disabled={!canManagePlan}>
                  <Wand2 className="w-4 h-4 mr-1" />
                  导入默认 WBS
                </Button>
                <Button size="sm" onClick={openCreateModule} disabled={!canManagePlan}>
                  <Plus className="w-4 h-4 mr-1" />
                  新建模块
                </Button>
              </div>
            }
          />

          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <button
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition",
                  activeView === "board"
                    ? "border-brand-500 bg-brand-200/40 text-foreground"
                    : "border-border text-foreground-light hover:text-foreground"
                )}
                onClick={() => setActiveView("board")}
              >
                <Layers className="w-3.5 h-3.5" />
                看板
              </button>
              <button
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition",
                  activeView === "dependency"
                    ? "border-brand-500 bg-brand-200/40 text-foreground"
                    : "border-border text-foreground-light hover:text-foreground"
                )}
                onClick={() => setActiveView("dependency")}
              >
                <GitBranch className="w-3.5 h-3.5" />
                依赖图
              </button>
              <button
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition",
                  activeView === "gantt"
                    ? "border-brand-500 bg-brand-200/40 text-foreground"
                    : "border-border text-foreground-light hover:text-foreground"
                )}
                onClick={() => setActiveView("gantt")}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                甘特图
              </button>
            </div>

            <div className="rounded-2xl border border-border bg-surface-100/70 p-5 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none opacity-50 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-size-[14px_14px]" />
              <div className="relative">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.35em] text-foreground-light">
                      Signal Pulse
                    </div>
                    <div className="text-[20px] font-semibold text-foreground mt-2">
                      {activeModule?.name || "规划视图"}
                    </div>
                    <div className="text-[12px] text-foreground-light mt-1">
                      {activeModule?.description || "从模块视角对任务、阶段与依赖进行编排。"}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border bg-background-200 px-3 py-2">
                      <div className="text-[11px] text-foreground-light">总任务</div>
                      <div className="text-[16px] text-foreground font-semibold">{stats.total}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-background-200 px-3 py-2">
                      <div className="text-[11px] text-foreground-light">完成率</div>
                      <div className="text-[16px] text-foreground font-semibold">{stats.progress}%</div>
                    </div>
                    <div className="rounded-lg border border-border bg-background-200 px-3 py-2">
                      <div className="text-[11px] text-foreground-light">估算天数</div>
                      <div className="text-[16px] text-foreground font-semibold">{stats.estimate}</div>
                    </div>
                    <div className="rounded-lg border border-border bg-background-200 px-3 py-2">
                      <div className="text-[11px] text-foreground-light">已完成</div>
                      <div className="text-[16px] text-foreground font-semibold">{stats.completed}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-[11px] text-foreground-light mb-2">
                    <span>阶段能量轨</span>
                    <span>总估算 {phaseTotal} 天</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-surface-200 overflow-hidden flex">
                    {Object.entries(phaseDistribution).map(([key, value]) => {
                      if (value <= 0 || phaseTotal === 0) return null;
                      const palette = phasePalette[key] || phasePalette.other;
                      const width = `${(value / phaseTotal) * 100}%`;
                      return (
                        <div
                          key={key}
                          className={cn("h-full", palette.color)}
                          style={{ width }}
                          title={`${palette.label} ${value}天`}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(phaseDistribution).map(([key, value]) => {
                      if (value <= 0) return null;
                      const palette = phasePalette[key] || phasePalette.other;
                      return (
                        <span
                          key={key}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[11px]",
                            palette.glow
                          )}
                        >
                          <span className={cn("w-2 h-2 rounded-full", palette.color)} />
                          {palette.label} · {value}天
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <ExceptionState
                variant="error"
                title="规划模块加载失败"
                description={error}
                size="sm"
                action={
                  activeWorkspaceId
                    ? {
                        label: "重试加载",
                        onClick: () => loadModules(activeWorkspaceId),
                        icon: RefreshCw,
                      }
                    : undefined
                }
              />
            )}

            {renderViewContent()}
          </div>
        </div>

        {/* 模块编辑弹窗 */}
        <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
          <DialogContent className="bg-surface-100 border-border">
            <DialogHeader>
              <DialogTitle>{editingModule ? "编辑模块" : "新建模块"}</DialogTitle>
              <DialogDescription>为规划模块设置清晰的名字与标识。</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <div className="text-[12px] text-foreground-light mb-1">模块名称</div>
                <Input
                  value={moduleForm.name}
                  onChange={(event) => setModuleForm({ ...moduleForm, name: event.target.value })}
                  placeholder="例如：Workspace / App / Runtime"
                />
              </div>
              <div>
                <div className="text-[12px] text-foreground-light mb-1">Key（可选）</div>
                <Input
                  value={moduleForm.key}
                  onChange={(event) => setModuleForm({ ...moduleForm, key: event.target.value })}
                  placeholder="例如：workspace"
                />
              </div>
              <div>
                <div className="text-[12px] text-foreground-light mb-1">描述（可选）</div>
                <Textarea
                  value={moduleForm.description}
                  onChange={(event) => setModuleForm({ ...moduleForm, description: event.target.value })}
                  placeholder="描述模块的范围与交付目标"
                  className="min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setModuleDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={submitModule}>{editingModule ? "保存" : "创建"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* 任务编辑弹窗 */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="bg-surface-100 border-border">
          <DialogHeader>
            <DialogTitle>{editingTask ? "编辑任务" : "新建任务"}</DialogTitle>
            <DialogDescription>将任务拆解为可追踪的执行单元。</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <div className="text-[12px] text-foreground-light mb-1">任务标题</div>
              <Input
                value={taskForm.title}
                onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}
                placeholder="例如：发布流程状态机"
              />
            </div>
            <div>
              <div className="text-[12px] text-foreground-light mb-1">任务代码（可选）</div>
              <Input
                value={taskForm.code}
                onChange={(event) => setTaskForm({ ...taskForm, code: event.target.value })}
                placeholder="例如：app-models"
              />
            </div>
            <div>
              <div className="text-[12px] text-foreground-light mb-1">阶段</div>
              <Select
                value={taskForm.phase}
                onValueChange={(value) => setTaskForm({ ...taskForm, phase: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择阶段" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="foundation">基底</SelectItem>
                  <SelectItem value="core">核心</SelectItem>
                  <SelectItem value="release">发布</SelectItem>
                  <SelectItem value="access">访问</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-[12px] text-foreground-light mb-1">状态</div>
              <Select
                value={taskForm.status}
                onValueChange={(value) =>
                  setTaskForm({ ...taskForm, status: value as StatusKey })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">待点亮</SelectItem>
                  <SelectItem value="in_progress">推进中</SelectItem>
                  <SelectItem value="blocked">受阻</SelectItem>
                  <SelectItem value="done">已封存</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-[12px] text-foreground-light mb-1">负责人</div>
              <Input
                value={taskForm.owner}
                onChange={(event) => setTaskForm({ ...taskForm, owner: event.target.value })}
                placeholder="owner / admin / frontend"
              />
            </div>
            <div>
              <div className="text-[12px] text-foreground-light mb-1">估算天数</div>
              <Input
                type="number"
                min={0}
                value={taskForm.estimate_days}
                onChange={(event) =>
                  setTaskForm({ ...taskForm, estimate_days: Number(event.target.value) })
                }
              />
            </div>
            <div className="md:col-span-2">
              <div className="text-[12px] text-foreground-light mb-1">交付物</div>
              <Textarea
                value={taskForm.deliverable}
                onChange={(event) =>
                  setTaskForm({ ...taskForm, deliverable: event.target.value })
                }
                placeholder="输出与可交付结果"
                className="min-h-[70px]"
              />
            </div>
            <div className="md:col-span-2">
              <div className="text-[12px] text-foreground-light mb-1">验收标准</div>
              <Textarea
                value={taskForm.acceptance}
                onChange={(event) =>
                  setTaskForm({ ...taskForm, acceptance: event.target.value })
                }
                placeholder="验收方式与条件"
                className="min-h-[70px]"
              />
            </div>
            <div className="md:col-span-2">
              <div className="text-[12px] text-foreground-light mb-1">依赖（逗号分隔）</div>
              <Input
                value={taskForm.dependencies}
                onChange={(event) =>
                  setTaskForm({ ...taskForm, dependencies: event.target.value })
                }
                placeholder="例如：app-models, ws-api-contracts"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTaskDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={submitTask}>{editingTask ? "保存" : "创建"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 版本快照弹窗 */}
      <Dialog open={versionDialogOpen} onOpenChange={setVersionDialogOpen}>
        <DialogContent className="bg-surface-100 border-border">
          <DialogHeader>
            <DialogTitle>创建版本快照</DialogTitle>
            <DialogDescription>冻结当前规划状态，便于后续对比与追踪。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <div className="text-[12px] text-foreground-light mb-1">版本名称（可选）</div>
              <Input
                value={versionForm.label}
                onChange={(event) => setVersionForm({ ...versionForm, label: event.target.value })}
                placeholder="例如：V1 规划基线"
              />
            </div>
            <div>
              <div className="text-[12px] text-foreground-light mb-1">备注（可选）</div>
              <Textarea
                value={versionForm.note}
                onChange={(event) => setVersionForm({ ...versionForm, note: event.target.value })}
                placeholder="记录本次快照目的与变更"
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setVersionDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={submitVersion} disabled={!canManagePlan}>
              创建快照
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 版本预览弹窗 */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="bg-surface-100 border-border">
          <DialogHeader>
            <DialogTitle>版本详情</DialogTitle>
            <DialogDescription>
              {previewVersion?.label || "未命名快照"} · {formatTimestamp(previewVersion?.created_at)}
            </DialogDescription>
          </DialogHeader>
          {previewSummary ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-surface-75 px-3 py-2 text-[11px] text-foreground-light">
                恢复将自动创建“恢复前备份”快照，以便随时回滚。
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-surface-75 px-3 py-2">
                  <div className="text-[11px] text-foreground-light">模块数</div>
                  <div className="text-[16px] text-foreground font-semibold">
                    {previewSummary.totalModules}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface-75 px-3 py-2">
                  <div className="text-[11px] text-foreground-light">任务数</div>
                  <div className="text-[16px] text-foreground font-semibold">
                    {previewSummary.totalTasks}
                  </div>
                </div>
              </div>
              {planDiff && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-background-200 px-3 py-2">
                    <div className="text-[11px] text-foreground-light">将新增模块</div>
                    <div className="text-[14px] text-foreground font-semibold">
                      {planDiff.modulesAdded.length}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-background-200 px-3 py-2">
                    <div className="text-[11px] text-foreground-light">将移除模块</div>
                    <div className="text-[14px] text-foreground font-semibold">
                      {planDiff.modulesRemoved.length}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-background-200 px-3 py-2">
                    <div className="text-[11px] text-foreground-light">将新增任务</div>
                    <div className="text-[14px] text-foreground font-semibold">
                      {planDiff.tasksAdded.length}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-background-200 px-3 py-2">
                    <div className="text-[11px] text-foreground-light">将移除任务</div>
                    <div className="text-[14px] text-foreground font-semibold">
                      {planDiff.tasksRemoved.length}
                    </div>
                  </div>
                </div>
              )}
              {previewSummary.capturedAt && (
                <div className="text-[11px] text-foreground-light">
                  捕获时间：{formatTimestamp(previewSummary.capturedAt)}
                </div>
              )}
              {planDiff && planDiff.statusChanged.length > 0 && (
                <div className="rounded-lg border border-border bg-surface-75 px-3 py-2">
                  <div className="text-[11px] text-foreground-light mb-2">状态变化预览</div>
                  <div className="space-y-1 text-[11px] text-foreground-light">
                    {planDiff.statusChanged.slice(0, 5).map((item) => (
                      <div key={item.title} className="flex items-center justify-between">
                        <span className="truncate text-foreground">{item.title}</span>
                        <span>
                          {item.from} → {item.to}
                        </span>
                      </div>
                    ))}
                    {planDiff.statusChanged.length > 5 && (
                      <div className="text-[10px] text-foreground-light">
                        还有 {planDiff.statusChanged.length - 5} 项未展示
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {(previewSummary.modules || []).slice(0, 6).map((module) => (
                  <div
                    key={String(module.id)}
                    className="rounded-lg border border-border bg-surface-75 px-3 py-2"
                  >
                    <div className="text-[12px] text-foreground">
                      {String(module.name || "未命名模块")}
                    </div>
                    <div className="text-[10px] text-foreground-light">
                      任务数：{Array.isArray(module.tasks) ? module.tasks.length : 0}
                    </div>
                  </div>
                ))}
                {previewSummary.modules.length > 6 && (
                  <div className="text-[11px] text-foreground-light">
                    还有 {previewSummary.modules.length - 6} 个模块未展示。
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-[12px] text-foreground-light">暂无版本信息。</div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPreviewOpen(false)}>
              关闭
            </Button>
            <Button onClick={restoreVersion} disabled={!canManagePlan}>
              恢复/回滚此版本
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  </PageWithSidebar>
  );
}
