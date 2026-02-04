import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  AppWindow,
  Building2,
  CreditCard,
  LifeBuoy,
  Play,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  SettingsSection,
  StatsCard,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  auditEvents,
  globalTodoEntries,
  queueItems,
  systemHealth,
  userRows,
  workspaceRows,
  appRows,
  executionRows,
} from "@/lib/mock-data";

// Compute real stats from mock data
const totalUsers = userRows.length;
const activeUsers = userRows.filter((u) => u.status === "active").length;
const totalWorkspaces = workspaceRows.length;
const activeWorkspaces = workspaceRows.filter((w) => w.status === "active").length;
const totalApps = appRows.length;
const publishedApps = appRows.filter((a) => a.status === "published").length;
const totalExecutions = executionRows.length;
const failedExecutions = executionRows.filter((e) => e.status === "failed").length;
const errorRate = totalExecutions > 0 ? ((failedExecutions / totalExecutions) * 100).toFixed(2) : "0.00";

const dashboardStats = [
  {
    title: "总用户数",
    value: totalUsers.toLocaleString(),
    subtitle: `${activeUsers} 活跃`,
    trend: { value: 3.2, isPositive: true },
    icon: <Users className="w-4 h-4" />,
  },
  {
    title: "Workspace",
    value: totalWorkspaces.toLocaleString(),
    subtitle: `${activeWorkspaces} 已启用`,
    trend: { value: 1.1, isPositive: true },
    icon: <Building2 className="w-4 h-4" />,
  },
  {
    title: "应用",
    value: totalApps.toLocaleString(),
    subtitle: `${publishedApps} 已发布`,
    trend: { value: 2.5, isPositive: true },
    icon: <AppWindow className="w-4 h-4" />,
  },
  {
    title: "执行记录",
    value: totalExecutions.toLocaleString(),
    subtitle: `${failedExecutions} 失败`,
    trend: { value: 5.8, isPositive: true },
    icon: <Play className="w-4 h-4" />,
  },
  {
    title: "错误率",
    value: `${errorRate}%`,
    subtitle: "近 24 小时",
    trend: { value: 0.3, isPositive: parseFloat(errorRate) < 1 },
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  {
    title: "待处理工单",
    value: "7",
    subtitle: "需支持团队处理",
    trend: { value: 2, isPositive: false },
    icon: <LifeBuoy className="w-4 h-4" />,
  },
];

const badgeVariantMap: Record<string, "warning" | "info" | "error" | "success"> = {
  warning: "warning",
  info: "info",
  error: "error",
  success: "success",
};

const todoIconMap: Record<string, React.ReactNode> = {
  tickets: <LifeBuoy className="w-4 h-4" />,
  reviews: <ShieldCheck className="w-4 h-4" />,
  refunds: <CreditCard className="w-4 h-4" />,
};

export default function AdminDashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Admin 控制台"
        description="统一管理用户、Workspace、应用与系统治理能力。"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/security/audit-logs">审计日志</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/announcements">新建公告</Link>
            </Button>
          </div>
        }
      />

      <div className="page-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {dashboardStats.map((stat) => (
          <StatsCard
            key={stat.title}
            icon={stat.icon}
            title={stat.title}
            value={stat.value}
            subtitle={stat.subtitle}
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="page-grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
        <SettingsSection
          title="待处理事项"
          description="需要优先处理的审核、退款与异常队列。"
          compact
        >
          <div className="space-y-3">
            {queueItems.map((item) => (
              <div
                key={item.title}
                className="flex items-center justify-between rounded-md border border-border bg-surface-75 px-3 py-2"
              >
                <div>
                  <div className="text-[12px] font-medium text-foreground">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-foreground-light">
                    {item.description}
                  </div>
                </div>
                <Badge
                  variant={badgeVariantMap[item.status] || "warning"}
                  size="sm"
                >
                  {item.badge}
                </Badge>
              </div>
            ))}
          </div>
        </SettingsSection>

        <SettingsSection
          title="系统健康"
          description="关键服务状态与负载概览。"
          compact
        >
          <div className="space-y-3">
            {systemHealth.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-md border border-border bg-surface-75 px-3 py-2"
              >
                <div>
                  <div className="text-[12px] font-medium text-foreground">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-foreground-light">
                    {item.detail}
                  </div>
                </div>
                <Badge
                  variant={item.status === "healthy" ? "success" : "warning"}
                  size="sm"
                >
                  {item.status === "healthy" ? "正常" : "注意"}
                </Badge>
              </div>
            ))}
          </div>
        </SettingsSection>
      </div>

      <SettingsSection title="全局待办入口" description="快速进入工单、审核与退款处理。">
        <div className="grid gap-3 md:grid-cols-3">
          {globalTodoEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col gap-3 rounded-md border border-border bg-surface-75 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-100 text-foreground-light">
                  {todoIconMap[entry.icon] || <Activity className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-[12px] font-medium text-foreground">{entry.title}</div>
                  <div className="text-[11px] text-foreground-light">{entry.description}</div>
                  <div className="mt-2">
                    <Badge variant={badgeVariantMap[entry.status] || "info"} size="sm">
                      {entry.badge}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={entry.href}>进入</Link>
              </Button>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="最近审计事件"
        description="关键操作与高风险变更的审计记录。"
        footer={
          <Button asChild variant="outline" size="sm">
            <Link href="/security/audit-logs">查看全部审计</Link>
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>操作者</TableHead>
              <TableHead>动作</TableHead>
              <TableHead>目标</TableHead>
              <TableHead>时间</TableHead>
              <TableHead className="text-right">级别</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="text-[12px] text-foreground">
                  {event.actor}
                </TableCell>
                <TableCell className="text-[12px] text-foreground-light">
                  {event.action}
                </TableCell>
                <TableCell className="text-[12px] text-foreground-light">
                  {event.target}
                </TableCell>
                <TableCell className="text-[12px] text-foreground-muted">
                  {event.time}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={badgeVariantMap[event.severity] || "warning"}
                    size="sm"
                  >
                    {event.severity === "success"
                      ? "正常"
                      : event.severity === "info"
                      ? "信息"
                      : event.severity === "warning"
                      ? "注意"
                      : "高危"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SettingsSection>
    </PageContainer>
  );
}
