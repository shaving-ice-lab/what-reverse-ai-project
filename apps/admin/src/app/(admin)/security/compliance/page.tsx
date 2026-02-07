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
    { id: "f-1", severity: "medium", title: "Missing data encryption audit logs", framework: "SOC 2", status: "open", created_at: "2026-02-01T10:00:00Z" },
    { id: "f-2", severity: "low", title: "Access control policy needs update", framework: "GDPR", status: "in_progress", created_at: "2026-01-28T14:00:00Z" },
    { id: "f-3", severity: "high", title: "Sensitive data storage policy does not meet HIPAA requirements", framework: "HIPAA", status: "open", created_at: "2026-01-25T09:00:00Z" },
  ],
};

const mockFrameworkControls = [
  { id: "ctrl-1", name: "Access Control Management", status: "passed", evidence: ["access-policy.pdf"], notes: "Passed annual review" },
  { id: "ctrl-2", name: "Data Encryption Requirements", status: "passed", evidence: ["encryption-audit.pdf"], notes: "AES-256 encryption deployed" },
  { id: "ctrl-3", name: "Log Audit Requirements", status: "failed", evidence: [], notes: "Audit logs need to be supplemented" },
  { id: "ctrl-4", name: "Backup & Recovery", status: "passed", evidence: ["backup-test-report.pdf"], notes: "Daily backups, RTO < 4 hours" },
  { id: "ctrl-5", name: "Security Awareness Training", status: "in_progress", evidence: [], notes: "Training plan in progress" },
];

const STATUS_LABELS: Record<string, string> = {
  compliant: "Compliant",
  partial: "Partially Compliant",
  in_progress: "Under Review",
  non_compliant: "Non-Compliant",
};

const STATUS_VARIANTS: Record<string, "success" | "warning" | "info" | "destructive"> = {
  compliant: "success",
  partial: "warning",
  in_progress: "info",
  non_compliant: "destructive",
};

const CONTROL_STATUS_LABELS: Record<string, string> = {
  passed: "Passed",
  failed: "Failed",
  in_progress: "In Progress",
  not_applicable: "N/A",
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
      toast.success("Control updated");
      setEditControlOpen(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "security", "compliance"] });
    },
    onError: () => toast.error("Update failed"),
  });

  const openEditControl = (control: Control) => {
    setEditControlOpen(control);
    setControlStatus(control.status);
    setControlNotes(control.notes);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Compliance Overview"
        description="View and manage compliance framework status and controls."
        icon={<Shield className="w-4 h-4" />}
        backHref="/security"
        backLabel="Back to Security Overview"
      />

      <div className="page-grid grid-cols-2 lg:grid-cols-4 mb-6">
        <StatsCard
          title="Compliance Score"
          value={`${complianceStatus.overall_score}%`}
          subtitle="overall score"
          trend={{
            value: complianceStatus.overall_score,
            isPositive: complianceStatus.overall_score >= 80,
          }}
        />
        <StatsCard
          title="Compliance Frameworks"
          value={complianceStatus.frameworks.length.toString()}
          subtitle="frameworks"
        />
        <StatsCard
          title="Open Findings"
          value={complianceStatus.recent_findings.filter((f) => f.status === "open").length.toString()}
          subtitle="issues"
        />
        <StatsCard
          title="Controls Passed"
          value={complianceStatus.frameworks.reduce((sum, f) => sum + f.controls_passed, 0).toString()}
          subtitle="controls"
        />
      </div>

      <SettingsSection
        title="Compliance Frameworks"
        description="Enabled compliance frameworks and their status."
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
                    Last Audit: {formatDate(framework.last_audit)}
                  </div>
                </div>
                <Badge variant={STATUS_VARIANTS[framework.status]} size="sm">
                  {STATUS_LABELS[framework.status]}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-foreground-muted">Compliance Score</span>
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
                  {framework.controls_passed} / {framework.controls_total} controls passed
                </div>
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Recent Findings"
        description="Compliance issues that need attention."
      >
        {complianceStatus.recent_findings.length === 0 ? (
          <div className="text-[12px] text-foreground-muted">No findings</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Framework</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Discovered At</TableHead>
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
                      {finding.severity === "high" ? "High" : finding.severity === "medium" ? "Medium" : "Low"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={finding.status === "open" ? "warning" : finding.status === "in_progress" ? "info" : "success"}
                      size="sm"
                    >
                      {finding.status === "open" ? "Open" : finding.status === "in_progress" ? "In Progress" : "Closed"}
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
              View and manage compliance control status.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Control</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                        <span>{control.evidence.length} file(s)</span>
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
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Control Dialog */}
      <Dialog open={Boolean(editControlOpen)} onOpenChange={(open) => !open && setEditControlOpen(null)}>
        <DialogContent size="md">
          <DialogHeader icon={<Shield className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>Edit Control</DialogTitle>
            <DialogDescription>
              {editControlOpen?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[12px] text-foreground">Status</label>
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
              <label className="text-[12px] text-foreground">Notes</label>
              <textarea
                value={controlNotes}
                onChange={(e) => setControlNotes(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-border bg-surface-100 px-3 py-2 text-[12px] text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-brand-500/30"
                placeholder="Enter notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditControlOpen(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => updateControlMutation.mutate()}
              loading={updateControlMutation.isPending}
              loadingText="Saving..."
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
