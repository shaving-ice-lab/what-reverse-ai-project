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
    title: "Total Users",
    value: totalUsers.toLocaleString(),
    subtitle: `${activeUsers} active`,
    trend: { value: 3.2, isPositive: true },
    icon: <Users className="w-4 h-4" />,
  },
  {
    title: "Workspace",
    value: totalWorkspaces.toLocaleString(),
    subtitle: `${activeWorkspaces} enabled`,
    trend: { value: 1.1, isPositive: true },
    icon: <Building2 className="w-4 h-4" />,
  },
  {
    title: "Apps",
    value: totalApps.toLocaleString(),
    subtitle: `${publishedApps} published`,
    trend: { value: 2.5, isPositive: true },
    icon: <AppWindow className="w-4 h-4" />,
  },
  {
    title: "Executions",
    value: totalExecutions.toLocaleString(),
    subtitle: `${failedExecutions} failed`,
    trend: { value: 5.8, isPositive: true },
    icon: <Play className="w-4 h-4" />,
  },
  {
    title: "Error Rate",
    value: `${errorRate}%`,
    subtitle: "Last 24 hours",
    trend: { value: 0.3, isPositive: parseFloat(errorRate) < 1 },
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  {
    title: "Pending Tickets",
    value: "7",
    subtitle: "Requires support team",
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
        title="Admin Console"
        description="Manage users, workspaces, apps, and system governance."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/security/audit-logs">Audit Logs</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/announcements">New Announcement</Link>
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
          title="Pending Actions"
          description="Priority review, refund, and exception queues."
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
          title="System Health"
          description="Key service status and load overview."
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
                  {item.status === "healthy" ? "Healthy" : "Warning"}
                </Badge>
              </div>
            ))}
          </div>
        </SettingsSection>
      </div>

      <SettingsSection title="Global To-Do Hub" description="Quick access to tickets, reviews, and refund processing.">
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
                <Link href={entry.href}>Enter</Link>
              </Button>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Recent Audit Events"
        description="Audit records of critical operations and high-risk changes."
        footer={
          <Button asChild variant="outline" size="sm">
            <Link href="/security/audit-logs">View All Audits</Link>
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Severity</TableHead>
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
                      ? "Normal"
                      : event.severity === "info"
                      ? "Info"
                      : event.severity === "warning"
                      ? "Warning"
                      : "Critical"}
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
