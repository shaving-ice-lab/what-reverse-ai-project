"use client";

/**
 * 团队管理页面 - Supabase 风格
 * 管理团队成员、角色和权限
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PageContainer, PageHeader } from "@/components/dashboard/page-layout";
import {
  Users,

  UserPlus,

  Search,

  MoreHorizontal,

  Shield,

  Mail,

  Clock,

  Check,

  X,

  Crown,

  Settings,

  Edit3,

  Trash2,

  Copy,

  ExternalLink,

  Link,

  Send,

  RefreshCw,

  AlertCircle,

  ChevronDown,

  Filter,

  UserCog,

  Key,

  Eye,

  EyeOff,

  Zap,

  MessageSquare,

  FileText,

  Bot,
} from "lucide-react";

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

// 角色配置 - Supabase 风格

const roles = [

  {
    id: "owner",

    name: "所有者",

    description: "完全控制权限，可以管理团队设置和账单",

    color: "text-warning",

    bgColor: "bg-warning-200",

    icon: Crown,

  },

  {
    id: "admin",

    name: "管理员",

    description: "可以管理成员和大部分设置",

    color: "text-brand-500",

    bgColor: "bg-brand-200",

    icon: Shield,

  },

  {
    id: "editor",

    name: "编辑者",

    description: "可以创建和编辑工作流、Agent",

    color: "text-foreground-light",

    bgColor: "bg-surface-200",

    icon: Edit3,

  },

  {
    id: "viewer",

    name: "查看者",

    description: "只能查看内容，不能编辑",

    color: "text-foreground-muted",

    bgColor: "bg-surface-200",

    icon: Eye,

  },

];

// 团队成员数据

const teamMembers = [

  {
    id: "1",

    name: "张明",

    email: "zhangming@example.com",

    avatar: null,

    role: "owner",

    status: "active",

    joinedAt: "2025-10-15",

    lastActive: "刚刚",

    stats: { workflows: 12, agents: 5, conversations: 156 },

  },

  {
    id: "2",

    name: "李华",

    email: "lihua@example.com",

    avatar: null,

    role: "admin",

    status: "active",

    joinedAt: "2025-11-20",

    lastActive: "5分钟前",

    stats: { workflows: 8, agents: 3, conversations: 89 },

  },

  {
    id: "3",

    name: "王芳",

    email: "wangfang@example.com",

    avatar: null,

    role: "editor",

    status: "active",

    joinedAt: "2025-12-05",

    lastActive: "1小时前",

    stats: { workflows: 5, agents: 2, conversations: 45 },

  },

  {
    id: "4",

    name: "赵强",

    email: "zhaoqiang@example.com",

    avatar: null,

    role: "viewer",

    status: "pending",

    joinedAt: null,

    lastActive: null,

    stats: { workflows: 0, agents: 0, conversations: 0 },

  },

];

// 待处理邀请

const pendingInvites = [

  {
    id: "inv-1",

    email: "newuser@example.com",

    role: "editor",

    sentAt: "2026-01-28",

    expiresAt: "2026-02-04",

  },

];

// 团队统计

const teamStats = {
  members: 4,

  maxMembers: 5,

  workflows: 25,

  agents: 10,

  apiCalls: 15600,
};

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedRole, setSelectedRole] = useState<string>("all");

  const [showInviteModal, setShowInviteModal] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");

  const [inviteRole, setInviteRole] = useState("editor");

  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());

  // 筛选成员

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =

      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||

      member.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = selectedRole === "all" || member.role === selectedRole;

    return matchesSearch && matchesRole;

  });

  // 获取角色配置

  const getRoleConfig = (roleId: string) => {
    return roles.find((r) => r.id === roleId) || roles[3];

  };

  // 切换选择

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedMembers);

    if (newSelected.has(id)) {
      newSelected.delete(id);

    } else {
      newSelected.add(id);

    }

    setSelectedMembers(newSelected);

  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="团队管理"
          description="管理团队成员、角色和访问权限"
          actions={(
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" leftIcon={<Settings className="w-4 h-4" />}>
                团队设置
              </Button>
              <Button size="sm" leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => setShowInviteModal(true)}>
                邀请成员
              </Button>
            </div>
          )}
        >
          <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              成员 {teamStats.members}/{teamStats.maxMembers}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              工作流 {teamStats.workflows}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" />
              Agent {teamStats.agents}
            </span>
          </div>
        </PageHeader>

        <div className="page-divider" />

        {/* 团队概览 */}

        <div className="page-grid grid-cols-2 lg:grid-cols-4">

          <div className="page-panel p-4">

            <div className="flex items-center justify-between mb-3">

              <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center">

                <Users className="w-4 h-4 text-foreground-light" />

              </div>

              <span className="text-xs text-foreground-light">

                {teamStats.members}/{teamStats.maxMembers}

              </span>

            </div>

            <p className="text-stat-number text-foreground">{teamStats.members}</p>

            <p className="text-xs text-foreground-muted">团队成员</p>

          </div>

          <div className="page-panel p-4">

            <div className="flex items-center justify-between mb-3">

              <div className="w-9 h-9 rounded-md bg-brand-200 flex items-center justify-center">

                <Zap className="w-4 h-4 text-brand-500" />

              </div>

            </div>

            <p className="text-stat-number text-foreground">{teamStats.workflows}</p>

            <p className="text-xs text-foreground-muted">工作流</p>

          </div>

          <div className="page-panel p-4">

            <div className="flex items-center justify-between mb-3">

              <div className="w-9 h-9 rounded-md bg-surface-200 flex items-center justify-center">

                <Bot className="w-4 h-4 text-foreground-light" />

              </div>

            </div>

            <p className="text-stat-number text-foreground">{teamStats.agents}</p>

            <p className="text-xs text-foreground-muted">AI Agent</p>

          </div>

          <div className="page-panel p-4">

            <div className="flex items-center justify-between mb-3">

              <div className="w-9 h-9 rounded-md bg-brand-200 flex items-center justify-center">

                <MessageSquare className="w-4 h-4 text-brand-500" />

              </div>

            </div>

            <p className="text-stat-number text-foreground">{(teamStats.apiCalls / 1000).toFixed(1)}K</p>

            <p className="text-xs text-foreground-muted">本月 API 调用</p>

          </div>

        </div>

        {/* 待处理邀请 */}

        {pendingInvites.length > 0 && (
          <div className="p-4 rounded-md bg-warning-200 border border-border-muted">

            <div className="flex items-center gap-2 mb-3">

              <Clock className="w-4 h-4 text-warning" />

              <span className="font-medium text-foreground">待接受的邀请</span>

              <Badge variant="secondary" className="bg-warning-200 text-warning">

                {pendingInvites.length}

              </Badge>

            </div>

            <div className="space-y-2">

              {pendingInvites.map((invite) => {
                const roleConfig = getRoleConfig(invite.role);

                return (
                  <div

                    key={invite.id}

                    className="flex items-center justify-between p-3 rounded-md bg-surface-100"

                  >

                    <div className="flex items-center gap-3">

                      <Mail className="w-4 h-4 text-foreground-muted" />

                      <div>

                        <p className="text-sm font-medium text-foreground">{invite.email}</p>

                        <p className="text-xs text-foreground-muted">

                          发送于 {invite.sentAt}  将于 {invite.expiresAt} 过期

                        </p>

                      </div>

                    </div>

                    <div className="flex items-center gap-2">

                      <Badge variant="secondary" className={cn(roleConfig.bgColor, roleConfig.color)}>

                        {roleConfig.name}

                      </Badge>

                      <Button variant="ghost" size="sm" className="text-foreground-light hover:text-foreground hover:bg-surface-200">

                        <RefreshCw className="w-4 h-4 mr-1" />

                        重发

                      </Button>

                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive-200">

                        <X className="w-4 h-4" />

                      </Button>

                    </div>

                  </div>

                );

              })}

            </div>

          </div>

        )}

        {/* 成员列表 */}

        <div className="rounded-md bg-surface-100 border border-border overflow-hidden">

          {/* 筛选栏 */}

          <div className="p-4 border-b border-border">

            <div className="flex items-center gap-4">

              <div className="relative flex-1 max-w-sm">

                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />

                <Input

                  placeholder="搜索成员..."

                  value={searchQuery}

                  onChange={(e) => setSearchQuery(e.target.value)}

                  className="pl-9 h-10 bg-surface-75 border-border focus:bg-surface-100 focus:border-brand-500"

                />

              </div>

              <Select value={selectedRole} onValueChange={setSelectedRole}>

                <SelectTrigger className="w-[140px] h-10 bg-surface-75 border-border text-foreground-light">

                  <SelectValue placeholder="角色筛选" />

                </SelectTrigger>

                <SelectContent className="bg-surface-100 border-border">

                  <SelectItem value="all">全部角色</SelectItem>

                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>

                      {role.name}

                    </SelectItem>

                  ))}

                </SelectContent>

              </Select>

            </div>

          </div>

          {/* 成员表格 */}

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>

                <tr className="border-b border-border bg-surface-75">

                  <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wider px-4 py-3">

                    成员

                  </th>

                  <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wider px-4 py-3">

                    角色

                  </th>

                  <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wider px-4 py-3">

                    状态

                  </th>

                  <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wider px-4 py-3">

                    活动

                  </th>

                  <th className="text-left text-xs font-medium text-foreground-muted uppercase tracking-wider px-4 py-3">

                    贡献

                  </th>

                  <th className="text-right text-xs font-medium text-foreground-muted uppercase tracking-wider px-4 py-3">

                    操作

                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredMembers.map((member) => {
                  const roleConfig = getRoleConfig(member.role);

                  const RoleIcon = roleConfig.icon;

                  return (
                    <tr key={member.id} className="border-b border-border hover:bg-surface-75 transition-colors">

                      <td className="px-4 py-4">

                        <div className="flex items-center gap-3">

                          <Avatar className="w-10 h-10">

                            <AvatarImage src={member.avatar || undefined} />

                            <AvatarFallback className="bg-brand-200 text-brand-500">

                              {member.name.slice(0, 2)}

                            </AvatarFallback>

                          </Avatar>

                          <div>

                            <p className="font-medium text-foreground">{member.name}</p>

                            <p className="text-sm text-foreground-light">{member.email}</p>

                          </div>

                        </div>

                      </td>

                      <td className="px-4 py-4">

                        <Badge variant="secondary" className={cn("gap-1", roleConfig.bgColor, roleConfig.color)}>

                          <RoleIcon className="w-3 h-3" />

                          {roleConfig.name}

                        </Badge>

                      </td>

                      <td className="px-4 py-4">

                        {member.status === "active" ? (
                          <span className="flex items-center gap-1.5 text-sm text-brand-500">

                            <span className="w-2 h-2 rounded-full bg-brand-500" />

                            活跃

                          </span>

                        ) : (
                          <span className="flex items-center gap-1.5 text-sm text-warning">

                            <span className="w-2 h-2 rounded-full bg-warning" />

                            待接受

                          </span>

                        )}

                      </td>

                      <td className="px-4 py-4">

                        <div className="text-sm">

                          {member.lastActive ? (
                            <>

                              <p className="text-foreground">{member.lastActive}</p>

                              <p className="text-xs text-foreground-muted">

                                加入于 {member.joinedAt}

                              </p>

                            </>

                          ) : (
                            <p className="text-foreground-muted">尚未加入</p>

                          )}

                        </div>

                      </td>

                      <td className="px-4 py-4">

                        <div className="flex items-center gap-4 text-xs text-foreground-muted">

                          <span className="flex items-center gap-1">

                            <Zap className="w-3 h-3" />

                            {member.stats.workflows}

                          </span>

                          <span className="flex items-center gap-1">

                            <Bot className="w-3 h-3" />

                            {member.stats.agents}

                          </span>

                          <span className="flex items-center gap-1">

                            <MessageSquare className="w-3 h-3" />

                            {member.stats.conversations}

                          </span>

                        </div>

                      </td>

                      <td className="px-4 py-4 text-right">

                        <DropdownMenu>

                          <DropdownMenuTrigger asChild>

                            <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground-muted hover:text-foreground hover:bg-surface-200">

                              <MoreHorizontal className="w-4 h-4" />

                            </Button>

                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" className="w-48 bg-surface-100 border-border">

                            <DropdownMenuItem className="text-foreground-light hover:text-foreground hover:bg-surface-200">

                              <UserCog className="w-4 h-4 mr-2" />

                              更改角色

                            </DropdownMenuItem>

                            <DropdownMenuItem className="text-foreground-light hover:text-foreground hover:bg-surface-200">

                              <Key className="w-4 h-4 mr-2" />

                              管理权限

                            </DropdownMenuItem>

                            <DropdownMenuItem className="text-foreground-light hover:text-foreground hover:bg-surface-200">

                              <Mail className="w-4 h-4 mr-2" />

                              发送消息

                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-border" />

                            {member.role !== "owner" && (
                              <DropdownMenuItem className="text-destructive hover:bg-destructive-200">

                                <Trash2 className="w-4 h-4 mr-2" />

                                移除成员

                              </DropdownMenuItem>

                            )}

                          </DropdownMenuContent>

                        </DropdownMenu>

                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

        </div>

        {/* 角色说明 */}

        <div className="p-6 rounded-md bg-surface-100 border border-border">

          <h3 className="font-semibold text-foreground mb-4">角色权限说明</h3>

          <div className="page-grid md:grid-cols-2 lg:grid-cols-4">

            {roles.map((role) => {
              const RoleIcon = role.icon;

              return (
                <div key={role.id} className="p-4 rounded-md bg-surface-75">

                  <div className="flex items-center gap-2 mb-2">

                    <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", role.bgColor)}>

                      <RoleIcon className={cn("w-4 h-4", role.color)} />

                    </div>

                    <span className={cn("font-medium", role.color)}>{role.name}</span>

                  </div>

                  <p className="text-sm text-foreground-muted">{role.description}</p>

                </div>

              );

            })}

          </div>

        </div>

      </div>

      {/* 邀请成员弹窗 */}

      {showInviteModal && (
        <>

          <div

            className="fixed inset-0 bg-background/80 z-50"

            onClick={() => setShowInviteModal(false)}

          />

          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 rounded-md bg-surface-100 border border-border z-50">

            <h3 className="text-lg font-semibold text-foreground mb-4">邀请新成员</h3>

            <div className="space-y-4">

              <div>

                <label className="block text-sm font-medium text-foreground mb-2">

                  邮箱地址

                </label>

                <Input

                  type="email"

                  placeholder="输入邮箱地址"

                  value={inviteEmail}

                  onChange={(e) => setInviteEmail(e.target.value)}

                  className="h-10 bg-surface-75 border-border focus:border-brand-500"

                />

              </div>

              <div>

                <label className="block text-sm font-medium text-foreground mb-2">

                  角色

                </label>

                <Select value={inviteRole} onValueChange={setInviteRole}>

                  <SelectTrigger className="h-10 bg-surface-75 border-border">

                    <SelectValue />

                  </SelectTrigger>

                  <SelectContent className="bg-surface-100 border-border">

                    {roles.filter(r => r.id !== "owner").map((role) => (
                      <SelectItem key={role.id} value={role.id}>

                        <span className="flex items-center gap-2">

                          <role.icon className={cn("w-4 h-4", role.color)} />

                          {role.name}

                        </span>

                      </SelectItem>

                    ))}

                  </SelectContent>

                </Select>

              </div>

              <div className="p-3 rounded-md bg-surface-75 text-sm text-foreground-light">

                <p>邀请链接将发送到指定邮箱，有效期 7 天。</p>

              </div>

            </div>

            <div className="flex items-center justify-end gap-3 mt-6">

              <Button variant="outline" onClick={() => setShowInviteModal(false)} className="border-border text-foreground-light hover:text-foreground hover:bg-surface-200">

                取消

              </Button>

              <Button className="bg-brand-500 hover:bg-brand-600 text-background">

                <Send className="w-4 h-4 mr-2" />

                发送邀请

              </Button>

            </div>

          </div>

        </>

      )}

    </div>
  </PageContainer>
  );
}

