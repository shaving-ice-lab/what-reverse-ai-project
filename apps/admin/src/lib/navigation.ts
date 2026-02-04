import type { ElementType } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  AppWindow,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  ClipboardList,
  CreditCard,
  Download,
  FileText,
  Gauge,
  GitBranch,
  Globe,
  Key,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  MessageSquare,
  Monitor,
  Play,
  Receipt,
  RotateCcw,
  Route,
  ScrollText,
  ServerCog,
  Settings2,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Server,
  Sparkles,
  Tag,
  Users,
  Users2,
  UsersRound,
  Wallet,
} from "lucide-react";

export interface AdminNavItem {
  title: string;
  href: string;
  icon: ElementType;
  badge?: string;
  external?: boolean;
  /** 所需能力点（来自 /api/v1/admin/capabilities） */
  capabilityKey?: string;
}

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    title: "核心管理",
    items: [
      { title: "总览", href: "/", icon: LayoutDashboard },
      { title: "用户", href: "/users", icon: Users, capabilityKey: "users.read" },
      {
        title: "Workspace",
        href: "/workspaces",
        icon: Building2,
        capabilityKey: "workspaces.read",
      },
      { title: "应用", href: "/apps", icon: Activity, capabilityKey: "apps.read" },
    ],
  },
  {
    title: "流程与执行",
    items: [
      { title: "工作流", href: "/workflows", icon: GitBranch, capabilityKey: "workspaces.read" },
      { title: "执行记录", href: "/executions", icon: Play, capabilityKey: "workspaces.read" },
    ],
  },
  {
    title: "支持与计费",
    items: [
      {
        title: "工单中心",
        href: "/support/tickets",
        icon: LifeBuoy,
        badge: "7",
        capabilityKey: "support.read",
      },
      {
        title: "支持渠道",
        href: "/support/channels",
        icon: Settings2,
        capabilityKey: "support.manage",
      },
      {
        title: "支持团队",
        href: "/support/teams",
        icon: Users2,
        capabilityKey: "support.manage",
      },
      {
        title: "支持队列",
        href: "/support/queues",
        icon: UsersRound,
        capabilityKey: "support.manage",
      },
      {
        title: "路由规则",
        href: "/support/routing-rules",
        icon: Route,
        capabilityKey: "support.manage",
      },
      {
        title: "通知模板",
        href: "/support/notification-templates",
        icon: Bell,
        capabilityKey: "support.manage",
      },
      { title: "计费概览", href: "/billing", icon: CreditCard, capabilityKey: "billing.read" },
      { title: "账单发票", href: "/billing/invoices", icon: Receipt, capabilityKey: "billing.read" },
      { title: "提现处理", href: "/billing/withdrawals", icon: Wallet, capabilityKey: "earnings.read" },
      { title: "退款申请", href: "/billing/refunds", icon: RotateCcw, capabilityKey: "billing.read" },
      { title: "计费异常", href: "/billing/anomalies", icon: AlertTriangle, capabilityKey: "billing.read" },
      { title: "计费规则", href: "/billing/rules", icon: SlidersHorizontal, capabilityKey: "billing.read" },
    ],
  },
  {
    title: "系统治理",
    items: [
      { title: "系统健康", href: "/system/health", icon: Server, capabilityKey: "system.read" },
      { title: "功能开关", href: "/system/features", icon: SlidersHorizontal, capabilityKey: "system.read" },
      { title: "部署信息", href: "/system/deployment", icon: ServerCog, capabilityKey: "system.read" },
      { title: "错误码", href: "/system/error-codes", icon: AlertCircle, capabilityKey: "system.read" },
      { title: "容量监控", href: "/system/capacity", icon: Gauge, capabilityKey: "system.read" },
      { title: "公告管理", href: "/announcements", icon: Bell, capabilityKey: "announcements.read" },
    ],
  },
  {
    title: "运维管理",
    items: [
      { title: "任务监控", href: "/ops/jobs", icon: Activity, capabilityKey: "system.read" },
      { title: "系统日志", href: "/ops/logs", icon: FileText, capabilityKey: "system.read" },
      { title: "死信队列", href: "/ops/queues", icon: AlertTriangle, capabilityKey: "system.write" },
      { title: "变更审批", href: "/ops/changes", icon: ClipboardList, capabilityKey: "system.read" },
      { title: "运维 SOP", href: "/ops/sops", icon: BookOpen, capabilityKey: "system.read" },
    ],
  },
  {
    title: "安全与配置",
    items: [
      { title: "配置中心", href: "/security/config", icon: Settings2, capabilityKey: "config.read" },
      { title: "密钥管理", href: "/security/secrets", icon: Key, capabilityKey: "secrets.read" },
      { title: "审计日志", href: "/security/audit-logs", icon: ScrollText, capabilityKey: "audit.read" },
      { title: "会话管理", href: "/security/sessions", icon: Monitor, capabilityKey: "sessions.read" },
      { title: "IP 白名单", href: "/security/ip-whitelist", icon: Globe, capabilityKey: "config.write" },
      { title: "双因素认证", href: "/security/2fa", icon: Lock, capabilityKey: "config.write" },
      { title: "审批中心", href: "/security/approvals", icon: ShieldCheck, badge: "2", capabilityKey: "approvals.read" },
      { title: "合规视图", href: "/security/compliance", icon: Shield, capabilityKey: "config.read" },
      { title: "供应链扫描", href: "/security/supply-chain", icon: AlertTriangle, capabilityKey: "config.read" },
    ],
  },
  {
    title: "分析与导出",
    items: [
      { title: "模型用量", href: "/analytics/model-usage", icon: BarChart3, capabilityKey: "analytics.read" },
      { title: "Workspace 行为", href: "/analytics/workspace-behavior", icon: Activity, capabilityKey: "analytics.read" },
      { title: "应用用量", href: "/analytics/app-usage", icon: AppWindow, capabilityKey: "analytics.read" },
      { title: "数据导出", href: "/exports", icon: Download, capabilityKey: "analytics.export" },
    ],
  },
];

export const segmentLabels: Record<string, string> = {
  users: "用户",
  workspaces: "Workspace",
  apps: "应用",
  workflows: "工作流",
  executions: "执行记录",
  conversations: "对话",
  creative: "创意",
  tasks: "任务",
  templates: "模板",
  tags: "标签",
  analytics: "分析",
  "model-usage": "模型用量",
  "workspace-behavior": "Workspace 行为",
  "app-usage": "应用用量",
  exports: "数据导出",
  support: "支持",
  tickets: "工单",
  channels: "渠道",
  teams: "团队",
  queues: "队列",
  "routing-rules": "路由规则",
  "notification-templates": "通知模板",
  billing: "计费",
  invoices: "账单发票",
  withdrawals: "提现处理",
  refunds: "退款申请",
  anomalies: "计费异常",
  rules: "计费规则",
  ops: "运维",
  sops: "SOP",
  jobs: "任务监控",
  logs: "系统日志",
  changes: "变更审批",
  announcements: "公告",
  system: "系统",
  health: "健康",
  features: "开关",
  deployment: "部署",
  "error-codes": "错误码",
  capacity: "容量监控",
  security: "安全",
  config: "配置",
  secrets: "密钥",
  "audit-logs": "审计日志",
  sessions: "会话管理",
  "ip-whitelist": "IP 白名单",
  "2fa": "双因素认证",
  approvals: "审批中心",
  compliance: "合规视图",
  "supply-chain": "供应链扫描",
};
