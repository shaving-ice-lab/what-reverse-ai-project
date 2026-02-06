"use client";

/**
 * Workspace 入口页 - Supabase 风格
 * 工作空间列表、创建、选择
 */

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Users,
  LayoutGrid,
  ChevronRight,
  Crown,
  Bot,
  Globe,
  Loader2,
  FolderOpen,
  Star,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  PageContainer,
  PageHeader,
  SettingsSection,
  EmptyState,
  PageWithSidebar,
  SidebarNavGroup,
  SidebarNavItem,
} from "@/components/dashboard/page-layout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { workspaceApi, type Workspace } from "@/lib/api/workspace";
import { useAuthStore } from "@/stores/useAuthStore";

// 计划配置
const planConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  free: { label: "FREE", color: "text-foreground-muted", bgColor: "bg-surface-200" },
  pro: { label: "PRO", color: "text-brand-500", bgColor: "bg-brand-200" },
  enterprise: { label: "ENTERPRISE", color: "text-warning", bgColor: "bg-warning-200" },
};

// 状态配置
const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "活跃", color: "text-brand-500" },
  suspended: { label: "已暂停", color: "text-warning" },
  deleted: { label: "已删除", color: "text-destructive" },
};

const regionOptions = [
  { value: "cn-east-1", label: "中国-华东（上海）" },
  { value: "ap-southeast-1", label: "亚太-新加坡" },
  { value: "us-east-1", label: "美国-弗吉尼亚" },
];

const workspaceSidebarLinks = [
  { id: "overview", label: "概览", icon: LayoutGrid },
  { id: "create", label: "创建 Workspace", icon: Plus },
  { id: "guides", label: "计划与区域", icon: Crown },
  { id: "list", label: "空间列表", icon: FolderOpen },
];

const WORKSPACE_STORAGE_KEY = "last_workspace_id";

export default function WorkspacesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinHint, setJoinHint] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    slug: "",
    region: regionOptions[0]?.value || "",
    plan: "free",
  });
  const [isCreating, setIsCreating] = useState(false);

  const rememberWorkspace = (workspaceId: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId);
    }
  };

  // 加载工作空间列表
  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await workspaceApi.list();
      setWorkspaces(data);
    } catch (error) {
      console.error("Failed to load workspaces:", error);
      setLoadError("工作空间加载失败，请稍后重试。");
    } finally {
      setIsLoading(false);
    }
  };

  // 自动生成 slug
  const handleNameChange = (name: string) => {
    setCreateForm((prev) => ({
      ...prev,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
        .replace(/^-|-$/g, ""),
    }));
  };

  // 创建工作空间
  const handleCreate = async () => {
    if (!createForm.name || !createForm.slug || !createForm.region) return;

    try {
      setIsCreating(true);
      const workspace = await workspaceApi.create({
        name: createForm.name,
        slug: createForm.slug,
        region: createForm.region,
      });
      setShowCreateDialog(false);
      setCreateForm({
        name: "",
        slug: "",
        region: regionOptions[0]?.value || "",
        plan: "free",
      });
      rememberWorkspace(workspace.id);
      router.push("/dashboard/apps");
    } catch (error) {
      console.error("Failed to create workspace:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancelCreate = () => {
    setCreateForm({
      name: "",
      slug: "",
      region: regionOptions[0]?.value || "",
      plan: "free",
    });
  };

  const handleJoinWorkspace = () => {
    if (!joinCode.trim()) {
      setJoinHint("请输入邀请链接或代码");
      return;
    }
    setJoinHint("已记录邀请信息，请联系管理员完成加入。");
    setShowJoinDialog(false);
    setJoinCode("");
  };

  // 筛选工作空间
  const filteredWorkspaces = workspaces.filter((ws) => {
    const matchesSearch =
      ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // 获取计划配置
  const getPlanConfig = (plan: string) => {
    return planConfig[plan] || planConfig.free;
  };

  const workspaceStats = useMemo(() => {
    const stats = {
      total: workspaces.length,
      active: 0,
      suspended: 0,
      deleted: 0,
      planFree: 0,
      planPro: 0,
      planEnterprise: 0,
    };
    workspaces.forEach((workspace) => {
      if (workspace.status === "active") stats.active += 1;
      if (workspace.status === "suspended") stats.suspended += 1;
      if (workspace.status === "deleted") stats.deleted += 1;
      if (workspace.plan === "free") stats.planFree += 1;
      if (workspace.plan === "pro") stats.planPro += 1;
      if (workspace.plan === "enterprise") stats.planEnterprise += 1;
    });
    return stats;
  }, [workspaces]);

  const recentWorkspaces = useMemo(() => {
    return [...workspaces]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 3);
  }, [workspaces]);

  const sidebar = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Button size="sm" className="w-full" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          创建工作空间
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-border text-foreground-light hover:text-foreground"
          onClick={() => setShowJoinDialog(true)}
        >
          加入 Workspace
        </Button>
        {joinHint && (
          <div className="text-[11px] text-foreground-muted px-1">
            {joinHint}
          </div>
        )}
      </div>

      <SidebarNavGroup title="导航">
        {workspaceSidebarLinks.map((item) => {
          const Icon = item.icon;
          return (
            <SidebarNavItem
              key={item.id}
              href={`#${item.id}`}
              label={item.label}
              icon={<Icon className="w-3.5 h-3.5" />}
            />
          );
        })}
      </SidebarNavGroup>

      <div className="rounded-md border border-border bg-surface-100/70 p-3 space-y-2">
        <div className="text-[11px] uppercase tracking-wider text-foreground-muted">
          快速搜索
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
          <Input
            placeholder="搜索 Workspace"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 bg-surface-75 border-border focus:bg-surface-100 focus:border-brand-500"
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-foreground-muted">
          <span>当前结果</span>
          <span>
            {filteredWorkspaces.length} / {workspaces.length}
          </span>
        </div>
      </div>

      <div className="rounded-md border border-border bg-surface-100/70 p-3 space-y-3">
        <div className="text-[11px] uppercase tracking-wider text-foreground-muted">
          空间概览
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-md border border-border bg-surface-75 px-2 py-2">
            <div className="text-foreground-muted">总计</div>
            <div className="text-foreground font-semibold">{workspaceStats.total}</div>
          </div>
          <div className="rounded-md border border-border bg-surface-75 px-2 py-2">
            <div className="text-foreground-muted">活跃</div>
            <div className="text-foreground font-semibold">{workspaceStats.active}</div>
          </div>
          <div className="rounded-md border border-border bg-surface-75 px-2 py-2">
            <div className="text-foreground-muted">暂停</div>
            <div className="text-foreground font-semibold">{workspaceStats.suspended}</div>
          </div>
          <div className="rounded-md border border-border bg-surface-75 px-2 py-2">
            <div className="text-foreground-muted">已删除</div>
            <div className="text-foreground font-semibold">{workspaceStats.deleted}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="secondary"
            className={cn("text-[10px] font-semibold", planConfig.free.bgColor, planConfig.free.color)}
          >
            FREE · {workspaceStats.planFree}
          </Badge>
          <Badge
            variant="secondary"
            className={cn("text-[10px] font-semibold", planConfig.pro.bgColor, planConfig.pro.color)}
          >
            PRO · {workspaceStats.planPro}
          </Badge>
          <Badge
            variant="secondary"
            className={cn("text-[10px] font-semibold", planConfig.enterprise.bgColor, planConfig.enterprise.color)}
          >
            ENT · {workspaceStats.planEnterprise}
          </Badge>
        </div>
      </div>

      <SidebarNavGroup title="最近更新">
        {recentWorkspaces.length === 0 ? (
          <div className="px-2 text-[11px] text-foreground-muted">
            暂无更新记录
          </div>
        ) : (
          recentWorkspaces.map((workspace) => {
            const plan = getPlanConfig(workspace.plan);
            return (
              <Link
                key={workspace.id}
                href="/dashboard/apps"
                onClick={() => rememberWorkspace(workspace.id)}
                className="flex items-center justify-between px-2 py-1.5 rounded-md text-[12px] text-foreground-light hover:text-foreground hover:bg-surface-100/60 transition-colors"
              >
                <span className="truncate">{workspace.name}</span>
                <span
                  className={cn(
                    "text-[9px] font-semibold px-1.5 py-0.5 rounded",
                    plan.bgColor,
                    plan.color
                  )}
                >
                  {plan.label}
                </span>
              </Link>
            );
          })
        )}
      </SidebarNavGroup>
    </div>
  );

  const errorBanner = loadError ? (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
      {loadError}
    </div>
  ) : null;

  return (
    <PageWithSidebar sidebarTitle="Workspaces" sidebarWidth="narrow" sidebar={sidebar}>
      <PageContainer>
        <div className="space-y-6">
          {/* 页面头部 */}
          <PageHeader
            title="工作空间"
            description="管理你的工作空间、默认配置与计划信息，快速创建或切换到现有空间"
            actions={
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                创建工作空间
              </Button>
            }
          />

          {errorBanner}

        {/* 默认配置与说明 */}
        <section id="overview" className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 rounded-md bg-surface-100 border border-border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-surface-200 border border-border flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 text-foreground-muted" />
              </div>
              <div>
                <h3 className="text-[12px] font-medium text-foreground mb-1">
                  默认 Workspace
                </h3>
                <p className="text-[11px] text-foreground-light leading-relaxed">
                  作为团队协作与资源隔离的基础单元，承载应用、成员权限与配额设置。
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-md bg-surface-100 border border-border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-surface-200 border border-border flex items-center justify-center shrink-0">
                <Crown className="w-4 h-4 text-brand-500" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[12px] font-medium text-foreground">计划与配额</h3>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] font-semibold",
                      planConfig.free.bgColor,
                      planConfig.free.color
                    )}
                  >
                    {planConfig.free.label}
                  </Badge>
                </div>
                <p className="text-[11px] text-foreground-light leading-relaxed">
                  新工作空间默认使用免费计划，最多支持 3 个应用并含基础调用配额。
                </p>
                <Link
                  href="/dashboard/billing"
                  className="text-[11px] text-brand-500 hover:underline"
                >
                  查看配额与升级
                </Link>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-md bg-surface-100 border border-border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-surface-200 border border-border flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-foreground-muted" />
              </div>
              <div>
                <h3 className="text-[12px] font-medium text-foreground mb-1">
                  区域与数据驻留
                </h3>
                <p className="text-[11px] text-foreground-light leading-relaxed">
                  创建时选择区域，影响运行时延迟与合规要求；默认区域可在设置中查看。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="create" className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
          <SettingsSection
            title="创建 Workspace"
            description="填写名称、区域与计划信息，创建后可立即切换"
            compact
          >
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-foreground mb-2">
                  工作空间名称 <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="例如：我的团队"
                  value={createForm.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="h-9 bg-surface-75 border-border focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-foreground mb-2">
                  URL 标识 <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-foreground-muted shrink-0">
                    agentflow.app/
                  </span>
                  <Input
                    placeholder="my-team"
                    value={createForm.slug}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    className="h-9 bg-surface-75 border-border focus:border-brand-500"
                  />
                </div>
                <p className="text-[11px] text-foreground-muted mt-1.5">
                  只能包含小写字母、数字和连字符
                </p>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-foreground mb-2">
                  部署区域 <span className="text-destructive">*</span>
                </label>
                <Select
                  value={createForm.region}
                  onValueChange={(value) =>
                    setCreateForm((prev) => ({ ...prev, region: value }))
                  }
                >
                  <SelectTrigger className="h-9 bg-surface-75 border-border">
                    <SelectValue placeholder="选择区域" />
                  </SelectTrigger>
                  <SelectContent className="bg-surface-100 border-border">
                    {regionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border border-border bg-surface-75 px-3 py-3 text-[12px] text-foreground-light">
                <div className="flex items-center justify-between">
                  <span>当前计划</span>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] font-semibold",
                      planConfig.free.bgColor,
                      planConfig.free.color
                    )}
                  >
                    {planConfig.free.label}
                  </Badge>
                </div>
                <p className="mt-2 text-[11px] text-foreground-muted">
                  创建后可在设置中升级计划与配额。
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={!createForm.name || !createForm.slug || !createForm.region || isCreating}
                >
                  {isCreating && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
                  创建
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelCreate}
                  className="border-border text-foreground-light hover:text-foreground"
                >
                  取消
                </Button>
              </div>
            </div>
          </SettingsSection>

          <div id="guides">
            <SettingsSection
              title="计划与区域说明"
              description="了解配额与区域选择的影响"
              compact
            >
              <div className="space-y-4 text-[12px] text-foreground-light">
                <div className="rounded-md border border-border bg-surface-75 p-3">
                  <p className="font-medium text-foreground mb-1">计划与配额</p>
                  <p>免费计划可创建 3 个应用，适合试用与小型团队。</p>
                  <Link href="/dashboard/billing" className="text-brand-500 hover:underline text-[11px]">
                    查看配额详情
                  </Link>
                </div>
                <div className="rounded-md border border-border bg-surface-75 p-3">
                  <p className="font-medium text-foreground mb-1">区域选择</p>
                  <p>区域影响访问延迟与合规要求，建议选择目标用户最近的区域。</p>
                  <p className="text-[11px] text-foreground-muted mt-1">
                    当前可选区域：{regionOptions.map((option) => option.label).join(" / ")}
                  </p>
                </div>
                <div className="text-[11px] text-foreground-muted">
                  需要加入现有 Workspace？可在左侧快速入口提交申请。
                </div>
              </div>
            </SettingsSection>
          </div>
        </section>

        <section id="list" className="space-y-3">
          <div>
            <h3 className="text-[13px] font-medium text-foreground">选择工作空间</h3>
            <p className="text-[12px] text-foreground-light">
              从你已加入的工作空间中选择，或创建新的空间开始构建。
            </p>
            {searchQuery && (
              <p className="text-[11px] text-foreground-muted mt-1">
                当前搜索：{searchQuery}
              </p>
            )}
          </div>
          <span className="text-[11px] text-foreground-muted">点击卡片即可切换</span>
        </section>

        {/* 工作空间列表 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-foreground-muted" />
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="w-6 h-6" />}
            title={searchQuery ? "未找到匹配的工作空间" : "暂无工作空间"}
            description={
              searchQuery
                ? "尝试使用其他关键词搜索"
                : "创建你的第一个工作空间，开始构建应用"
            }
            action={
              !searchQuery
                ? {
                    label: "创建工作空间",
                    onClick: () => setShowCreateDialog(true),
                  }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkspaces.map((workspace) => {
              const plan = getPlanConfig(workspace.plan);
              return (
                <Link
                  key={workspace.id}
                  href="/dashboard/apps"
                  onClick={() => rememberWorkspace(workspace.id)}
                  className="group"
                >
                  <div className="p-4 rounded-md bg-surface-100 border border-border hover:border-brand-500/50 transition-all">
                    {/* 头部 */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-surface-200 border border-border flex items-center justify-center text-foreground-light group-hover:border-brand-500/50 transition-colors">
                          {workspace.icon ? (
                            <span className="text-lg">{workspace.icon}</span>
                          ) : (
                            <LayoutGrid className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-[13px] font-medium text-foreground group-hover:text-brand-500 transition-colors">
                            {workspace.name}
                          </h3>
                          <p className="text-[11px] text-foreground-muted">
                            /{workspace.slug}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] font-semibold",
                          plan.bgColor,
                          plan.color
                        )}
                      >
                        {plan.label}
                      </Badge>
                    </div>

                    {/* 统计 */}
                    <div className="flex items-center gap-4 text-[11px] text-foreground-muted mb-3">
                      <span className="flex items-center gap-1">
                        <Bot className="w-3.5 h-3.5" />
                        -- 应用
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        -- 成员
                      </span>
                    </div>

                    {/* 底部 */}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-1 text-[10px] text-foreground-muted">
                        <Clock className="w-3 h-3" />
                        {new Date(workspace.updated_at).toLocaleDateString("zh-CN")}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-foreground-muted">
                        切换
                        <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:text-brand-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* 创建工作空间对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md bg-surface-100 border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">创建工作空间</DialogTitle>
            <DialogDescription className="text-foreground-light">
              创建一个新的工作空间来组织你的应用和团队
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="block text-[12px] font-medium text-foreground mb-2">
                工作空间名称 <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="例如：我的团队"
                value={createForm.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="h-9 bg-surface-75 border-border focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-foreground mb-2">
                URL 标识 <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-foreground-muted shrink-0">
                  agentflow.app/
                </span>
                <Input
                  placeholder="my-team"
                  value={createForm.slug}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, slug: e.target.value })
                  }
                  className="h-9 bg-surface-75 border-border focus:border-brand-500"
                />
              </div>
              <p className="text-[11px] text-foreground-muted mt-1.5">
                只能包含小写字母、数字和连字符
              </p>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-foreground mb-2">
                部署区域 <span className="text-destructive">*</span>
              </label>
              <Select
                value={createForm.region}
                onValueChange={(value) =>
                  setCreateForm((prev) => ({ ...prev, region: value }))
                }
              >
                <SelectTrigger className="h-9 bg-surface-75 border-border">
                  <SelectValue placeholder="选择区域" />
                </SelectTrigger>
                <SelectContent className="bg-surface-100 border-border">
                  {regionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 rounded-md bg-surface-75 text-[12px] text-foreground-light">
              <p className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-foreground-muted" />
                新工作空间将使用免费计划，最多支持 3 个应用
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="border-border text-foreground-light hover:text-foreground"
            >
              取消
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!createForm.name || !createForm.slug || !createForm.region || isCreating}
            >
              {isCreating && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent className="sm:max-w-md bg-surface-100 border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">加入 Workspace</DialogTitle>
            <DialogDescription className="text-foreground-light">
              通过邀请链接或邀请码加入已有工作空间
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-[12px] font-medium text-foreground mb-2">
                邀请链接/邀请码 <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="粘贴邀请链接或输入邀请码"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value)}
                className="h-9 bg-surface-75 border-border focus:border-brand-500"
              />
            </div>
            <div className="p-3 rounded-md bg-surface-75 text-[11px] text-foreground-muted">
              需要管理员发送邀请链接才能完成加入。
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowJoinDialog(false)}
              className="border-border text-foreground-light hover:text-foreground"
            >
              取消
            </Button>
            <Button onClick={handleJoinWorkspace} disabled={!joinCode.trim()}>
              提交申请
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  </PageWithSidebar>
  );
}
