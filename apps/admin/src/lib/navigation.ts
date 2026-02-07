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
  /** Required capability key (from /api/v1/admin/capabilities) */
  capabilityKey?: string;
}

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    title: "Core Management",
    items: [
      { title: "Overview", href: "/", icon: LayoutDashboard },
      { title: "Users", href: "/users", icon: Users, capabilityKey: "users.read" },
      {
        title: "Workspaces",
        href: "/workspaces",
        icon: Building2,
        capabilityKey: "workspaces.read",
      },
      { title: "Apps", href: "/apps", icon: Activity, capabilityKey: "apps.read" },
    ],
  },
  {
    title: "Workflows & Executions",
    items: [
      { title: "Workflows", href: "/workflows", icon: GitBranch, capabilityKey: "workspaces.read" },
      { title: "Executions", href: "/executions", icon: Play, capabilityKey: "workspaces.read" },
    ],
  },
  {
    title: "Support & Billing",
    items: [
      {
        title: "Ticket Center",
        href: "/support/tickets",
        icon: LifeBuoy,
        badge: "7",
        capabilityKey: "support.read",
      },
      {
        title: "Support Channels",
        href: "/support/channels",
        icon: Settings2,
        capabilityKey: "support.manage",
      },
      {
        title: "Support Teams",
        href: "/support/teams",
        icon: Users2,
        capabilityKey: "support.manage",
      },
      {
        title: "Support Queues",
        href: "/support/queues",
        icon: UsersRound,
        capabilityKey: "support.manage",
      },
      {
        title: "Routing Rules",
        href: "/support/routing-rules",
        icon: Route,
        capabilityKey: "support.manage",
      },
      {
        title: "Notification Templates",
        href: "/support/notification-templates",
        icon: Bell,
        capabilityKey: "support.manage",
      },
      { title: "Billing Overview", href: "/billing", icon: CreditCard, capabilityKey: "billing.read" },
      { title: "Invoices", href: "/billing/invoices", icon: Receipt, capabilityKey: "billing.read" },
      { title: "Withdrawals", href: "/billing/withdrawals", icon: Wallet, capabilityKey: "earnings.read" },
      { title: "Refund Requests", href: "/billing/refunds", icon: RotateCcw, capabilityKey: "billing.read" },
      { title: "Billing Anomalies", href: "/billing/anomalies", icon: AlertTriangle, capabilityKey: "billing.read" },
      { title: "Billing Rules", href: "/billing/rules", icon: SlidersHorizontal, capabilityKey: "billing.read" },
    ],
  },
  {
    title: "System Governance",
    items: [
      { title: "System Health", href: "/system/health", icon: Server, capabilityKey: "system.read" },
      { title: "Feature Flags", href: "/system/features", icon: SlidersHorizontal, capabilityKey: "system.read" },
      { title: "Deployment Info", href: "/system/deployment", icon: ServerCog, capabilityKey: "system.read" },
      { title: "Error Codes", href: "/system/error-codes", icon: AlertCircle, capabilityKey: "system.read" },
      { title: "Capacity Monitoring", href: "/system/capacity", icon: Gauge, capabilityKey: "system.read" },
      { title: "Announcements", href: "/announcements", icon: Bell, capabilityKey: "announcements.read" },
    ],
  },
  {
    title: "Operations",
    items: [
      { title: "Job Monitoring", href: "/ops/jobs", icon: Activity, capabilityKey: "system.read" },
      { title: "System Logs", href: "/ops/logs", icon: FileText, capabilityKey: "system.read" },
      { title: "Dead Letter Queues", href: "/ops/queues", icon: AlertTriangle, capabilityKey: "system.write" },
      { title: "Change Approvals", href: "/ops/changes", icon: ClipboardList, capabilityKey: "system.read" },
      { title: "Ops SOPs", href: "/ops/sops", icon: BookOpen, capabilityKey: "system.read" },
    ],
  },
  {
    title: "Security & Config",
    items: [
      { title: "Config Center", href: "/security/config", icon: Settings2, capabilityKey: "config.read" },
      { title: "Secrets Management", href: "/security/secrets", icon: Key, capabilityKey: "secrets.read" },
      { title: "Audit Logs", href: "/security/audit-logs", icon: ScrollText, capabilityKey: "audit.read" },
      { title: "Session Management", href: "/security/sessions", icon: Monitor, capabilityKey: "sessions.read" },
      { title: "IP Whitelist", href: "/security/ip-whitelist", icon: Globe, capabilityKey: "config.write" },
      { title: "Two-Factor Auth", href: "/security/2fa", icon: Lock, capabilityKey: "config.write" },
      { title: "Approval Center", href: "/security/approvals", icon: ShieldCheck, badge: "2", capabilityKey: "approvals.read" },
      { title: "Compliance View", href: "/security/compliance", icon: Shield, capabilityKey: "config.read" },
      { title: "Supply Chain Scan", href: "/security/supply-chain", icon: AlertTriangle, capabilityKey: "config.read" },
    ],
  },
  {
    title: "Analytics & Export",
    items: [
      { title: "Model Usage", href: "/analytics/model-usage", icon: BarChart3, capabilityKey: "analytics.read" },
      { title: "Workspace Behavior", href: "/analytics/workspace-behavior", icon: Activity, capabilityKey: "analytics.read" },
      { title: "App Usage", href: "/analytics/app-usage", icon: AppWindow, capabilityKey: "analytics.read" },
      { title: "Data Export", href: "/exports", icon: Download, capabilityKey: "analytics.export" },
    ],
  },
];

export const segmentLabels: Record<string, string> = {
  users: "Users",
  workspaces: "Workspaces",
  apps: "Apps",
  workflows: "Workflows",
  executions: "Executions",
  conversations: "Conversations",
  creative: "Creative",
  tasks: "Tasks",
  templates: "Templates",
  tags: "Tags",
  analytics: "Analytics",
  "model-usage": "Model Usage",
  "workspace-behavior": "Workspace Behavior",
  "app-usage": "App Usage",
  exports: "Data Export",
  support: "Support",
  tickets: "Tickets",
  channels: "Channels",
  teams: "Teams",
  queues: "Queues",
  "routing-rules": "Routing Rules",
  "notification-templates": "Notification Templates",
  billing: "Billing",
  invoices: "Invoices",
  withdrawals: "Withdrawals",
  refunds: "Refund Requests",
  anomalies: "Billing Anomalies",
  rules: "Billing Rules",
  ops: "Operations",
  sops: "SOPs",
  jobs: "Job Monitoring",
  logs: "System Logs",
  changes: "Change Approvals",
  announcements: "Announcements",
  system: "System",
  health: "Health",
  features: "Feature Flags",
  deployment: "Deployment",
  "error-codes": "Error Codes",
  capacity: "Capacity Monitoring",
  security: "Security",
  config: "Config",
  secrets: "Secrets",
  "audit-logs": "Audit Logs",
  sessions: "Session Management",
  "ip-whitelist": "IP Whitelist",
  "2fa": "Two-Factor Auth",
  approvals: "Approval Center",
  compliance: "Compliance View",
  "supply-chain": "Supply Chain Scan",
};
