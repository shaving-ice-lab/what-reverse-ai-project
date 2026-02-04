"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle,
  Clock,
  Edit,
  FileCheck,
  Shield,
  XCircle,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi } from "@/lib/api/admin";
import { isLocalModeEnabled } from "@/lib/env";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";

// Mock data
const mockComplianceStatus = {
  overall_score: 87,
  frameworks: [
    { id: "soc2", name: "SOC 2 Type II", status: "compliant", score: 92, last_audit: "2026-01-15T00:00:00Z", controls_passed: 46, controls_total: 50 },
    { id: "gdpr", name: "GDPR", status: "compliant", score: 88, last_audit: "2026-01-20T00:00:00Z", controls_passed: 44, controls_total: 50 },
    { id: "hipaa", name: "HIPAA", status: "partial", score: 75, last_audit: "2026-01-10T00:00:00Z", controls_passed: 30, controls_total: 40 },
    { id: "iso27001", name: "ISO 27001", status: "in_progress", score: 65, last_audit: "2025-12-01T00:00:00Z", controls_passed: 78, controls_total: 120 },
  ],
  recent_findings: [
    { id: "f-1", severity: "medium", title: "缺少数据加密审计日志", framework: "SOC 2", status: "open", created_at: "2026-02-01T10:00:00Z" },
    { id: "f-2", severity: "low", title: "访问控制策略待更新", framework: "GDPR", status: "in_progress", created_at: "2026-01-28T14:00:00Z" },
    { id: "f-3", severity: "high", title: "敏感数据存储策略不符合 HIPAA 要求", framework: "HIPAA", status: "open", created_at: "2026-01-25T09:00:00Z" },
  ],
};

const mockFrameworkControls = [
  { id: "ctrl-1", name: "访问控制管理", status: "passed", evidence: ["access-policy.pdf"], notes: "已通过年度审核" },
  { id: "ctrl-2", name: "数据加密要求", status: "passed", evidence: ["encryption-audit.pdf"], notes: "AES-256 加密已部署" },
  { id: "ctrl-3", name: "日志审计要求", status: "failed", evidence: [], notes: "需要补充审计日志" },
  { id: "ctrl-4", name: "备份与恢复", status: "passed", evidence: ["backup-test-report.pdf"], notes: "每日备份，RTO < 4小时" },
  { id: "ctrl-5", name: "安全意识培训", status: "in_progress", evidence: [], notes: "培训计划进行中" },
];

const STATUS_LABELS: Record<string, string> = {
  compliant: "合规",
  partial: "部分合规",
  in_progress: "审核中",
  non_compliant: "不合规",
};

const STATUS_VARIANTS: Record<string, "success" | "warning" | "info" | "destructive"> = {
  compliant: "success",
  partial: "warning",
  in_progress: "info",
  non_compliant: "destructive",
};

const CONTROL_STATUS_LABELS: Record<string, string> = {
  passed: "通过",
  failed: "未通过",
  in_progress: "进行中",
  not_applicable: "不适用",
};

const FINDING_SEVERITY_VARIANTS: Record<string, "destructive" | "warning" | "secondary"> = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
};

type Framework = (typeof mockComplianceStatus.frameworks)[number];
type Control = (typeof mockFrameworkControls)[number];

export default function CompliancePage() {
  const localMode = isLocalModeEnabled();
  const queryClient = useQueryClient();

  const [detailsOpen, setDetailsOpen] = useState<Framework | null>(null);
  const [editControlOpen, setEditControlOpen] = useState<Control | null>(null);
  const [controlStatus, setControlStatus] = useState("");
  const [controlNotes, setControlNotes] = useState("");

  const complianceQuery = useQuery({
    queryKey: ["admin", "security", "compliance"],
    enabled: !localMode,
    queryFn: () => adminApi.security.compliance.getStatus(),
  });

  const complianceStatus = localMode ? mockComplianceStatus : complianceQuery.data || mockComplianceStatus;

  const updateControlMutation = useMutation({
    mutationFn: async () => {
      if (!detailsOpen || !editControlOpen) throw new Error("No control selected");
      if (localMode) {
        return { success: true };
      }
      return adminApi.security.compliance.updateControlStatus(detailsOpen.id, editControlOpen.id, {
        status: controlStatus,
        notes: controlNotes,
      });
    },
    onSuccess: () => {
      toast.success("控制项已更新");
      setEditControlOpen(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "security", "compliance"] });
    },
    onError: () => toast.error("更新失败"),
  });

  const openEditControl = (control: Control) => {
    setEditControlOpen(control);
    setControlStatus(control.status);
    setControlNotes(control.notes);
  };

  return (
    <PageContainer>
      <PageHeader
        title="合规视图"
        description="查看和管理合规框架状态与控制项。"
        icon={<Shield className="w-4 h-4" />}
        backHref="/security"
        backLabel="返回安全概览"
      />

      <div className="page-grid grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="合规分数"
          value={`${complianceStatus.overall_score}%`}
          subtitle="总体评分"
          trend={{
            value: complianceStatus.overall_score,
            isPositive: complianceStatus.overall_score >= 80,
          }}
        />
        <StatsCard
          title="合规框架"
          value={complianceStatus.frameworks.length.toString()}
          subtitle="个框架"
        />
        <StatsCard
          title="待处理发现"
          value={complianceStatus.recent_findings.filter((f) => f.status === "open").length.toString()}
          subtitle="个问题"
        />
        <StatsCard
          title="已通过控制"
          value={complianceStatus.frameworks.reduce((sum, f) => sum + f.controls_passed, 0).toString()}
          subtitle="个控制项"
        />
      </div>

      <SettingsSection
        title="合规框架"
        description="已启用的合规框架及其状态。"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complianceStatus.frameworks.map((framework) => (
            <div
              key={framework.id}
              className="rounded-lg border border-border bg-surface-75 p-4 hover:border-brand-500/30 transition-colors cursor-pointer"
              onClick={() => setDetailsOpen(framework)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-brand-500" />
                    <span className="text-[14px] font-medium text-foreground">{framework.name}</span>
                  </div>
                  <div className="text-[11px] text-foreground-muted mt-1">
                    最近审核: {formatDate(framework.last_audit)}
                  </div>
                </div>
                <Badge variant={STATUS_VARIANTS[framework.status]} size="sm">
                  {STATUS_LABELS[framework.status]}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-foreground-muted">合规分数</span>
                  <span className="text-foreground font-medium">{framework.score}%</span>
                </div>
                <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      framework.score >= 80 ? "bg-brand-500" : framework.score >= 60 ? "bg-warning-400" : "bg-destructive-400"
                    )}
                    style={{ width: `${framework.score}%` }}
                  />
                </div>
                <div className="text-[11px] text-foreground-muted">
                  {framework.controls_passed} / {framework.controls_total} 控制项通过
                </div>
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="最近发现"
        description="需要关注的合规问题。"
      >
        {complianceStatus.recent_findings.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">暂无发现</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>问题</TableHead>
                <TableHead>框架</TableHead>
                <TableHead>严重性</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>发现时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complianceStatus.recent_findings.map((finding) => (
                <TableRow key={finding.id}>
                  <TableCell className="text-[12px] font-medium text-foreground">
                    {finding.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">
                      {finding.framework}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={FINDING_SEVERITY_VARIANTS[finding.severity]} size="sm">
                      {finding.severity === "high" ? "高" : finding.severity === "medium" ? "中" : "低"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={finding.status === "open" ? "warning" : finding.status === "in_progress" ? "info" : "success"}
                      size="sm"
                    >
                      {finding.status === "open" ? "待处理" : finding.status === "in_progress" ? "处理中" : "已关闭"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {formatRelativeTime(finding.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SettingsSection>

      {/* Framework Details Dialog */}
      <Dialog open={Boolean(detailsOpen)} onOpenChange={(open) => !open && setDetailsOpen(null)}>
        <DialogContent size="xl">
          <DialogHeader icon={<FileCheck className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>{detailsOpen?.name}</DialogTitle>
            <DialogDescription>
              查看和管理合规控制项状态。
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>控制项</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>证据</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockFrameworkControls.map((control) => (
                  <TableRow key={control.id}>
                    <TableCell className="text-[12px] font-medium text-foreground">
                      {control.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          control.status === "passed"
                            ? "success"
                            : control.status === "failed"
                            ? "destructive"
                            : control.status === "in_progress"
                            ? "info"
                            : "secondary"
                        }
                        size="sm"
                      >
                        {CONTROL_STATUS_LABELS[control.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[11px] text-foreground-muted">
                      {control.evidence.length > 0 ? (
                        <span>{control.evidence.length} 个文件</span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-[12px] text-foreground-light max-w-[200px] truncate">
                      {control.notes || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditControl(control)}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button onClick={() => setDetailsOpen(null)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Control Dialog */}
      <Dialog open={Boolean(editControlOpen)} onOpenChange={(open) => !open && setEditControlOpen(null)}>
        <DialogContent size="md">
          <DialogHeader icon={<Shield className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>编辑控制项</DialogTitle>
            <DialogDescription>
              {editControlOpen?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[12px] text-foreground">状态</label>
              <div className="flex flex-wrap gap-2">
                {["passed", "failed", "in_progress", "not_applicable"].map((status) => (
                  <Button
                    key={status}
                    type="button"
                    variant={controlStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setControlStatus(status)}
                  >
                    {status === "passed" && <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                    {status === "failed" && <XCircle className="w-3.5 h-3.5 mr-1" />}
                    {status === "in_progress" && <Clock className="w-3.5 h-3.5 mr-1" />}
                    {CONTROL_STATUS_LABELS[status]}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[12px] text-foreground">备注</label>
              <textarea
                value={controlNotes}
                onChange={(e) => setControlNotes(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-border bg-surface-100 px-3 py-2 text-[12px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                placeholder="输入备注..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditControlOpen(null)}>
              取消
            </Button>
            <Button
              onClick={() => updateControlMutation.mutate()}
              loading={updateControlMutation.isPending}
              loadingText="保存中..."
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
