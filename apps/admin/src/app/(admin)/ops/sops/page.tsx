"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, Copy } from "lucide-react";
import {
  EmptyState,
  PageContainer,
  PageHeader,
  SettingsSection,
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
import { opsApi } from "@/lib/api/ops";
import { isLocalModeEnabled } from "@/lib/env";
import type { OpsSop } from "@/types/ops";

const LOCAL_SOPS: OpsSop[] = [
  {
    key: "ops-support-sops",
    title: "Support & Ops SOP",
    summary: "Customer service, troubleshooting, and incident response procedures.",
    severity: "P2",
    owners: ["support"],
    triggers: [],
    preconditions: [],
    steps: [],
    references: [{ label: "Docs", target: "docs/operations/OPS-SUPPORT-SOPS.md" }],
  },
  {
    key: "sql-schema-index",
    title: "SQL Schema & Index Standards",
    summary: "Database index and constraint conventions.",
    severity: "P2",
    owners: ["database"],
    triggers: [],
    preconditions: [],
    steps: [],
    references: [{ label: "Docs", target: "docs/operations/SQL-SCHEMA-INDEX-CONSTRAINTS.md" }],
  },
  {
    key: "test-case-template",
    title: "Test Case Template",
    summary: "Reference templates for test and acceptance cases.",
    severity: "P3",
    owners: ["qa"],
    triggers: [],
    preconditions: [],
    steps: [],
    references: [{ label: "Docs", target: "docs/operations/TEST-CASE-TEMPLATES.md" }],
  },
];

const resolveSeverityVariant = (severity: string): "info" | "warning" | "error" => {
  const normalized = severity.trim().toUpperCase();
  if (normalized === "P0" || normalized === "P1") return "error";
  if (normalized === "P2") return "warning";
  return "info";
};

export default function OpsSopsPage() {
  const localMode = isLocalModeEnabled();

  const sopsQuery = useQuery({
    queryKey: ["ops", "sops"],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => opsApi.listSops(),
  });

  const sops = localMode ? LOCAL_SOPS : sopsQuery.data || [];
  const isLoading = !localMode && sopsQuery.isPending;
  const hasError = !localMode && sopsQuery.isError;

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("SOP identifier copied");
    } catch {
      toast.error("Copy failed, please copy manually");
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Ops SOP Documents"
        description="Centralized access to ops and support SOP documents."
        icon={<BookOpen className="w-4 h-4" />}
      />

      <SettingsSection title="SOP Document Directory" description="View key information and identifiers for ops SOPs.">
        {hasError ? (
          <EmptyState title="Load Failed" description="Unable to fetch SOP list. Please check the service or permissions." />
        ) : sops.length === 0 && !isLoading ? (
          <EmptyState title="No SOP Documents" description="No ops SOP documents have been configured." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SOP</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Key</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-[12px] text-foreground-muted"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : (
                sops.map((sop) => {
                  const copyValue = sop.references?.[0]?.target || sop.key;
                  return (
                    <TableRow key={sop.key}>
                      <TableCell>
                        <div className="text-[12px] font-medium text-foreground">
                          {sop.title}
                        </div>
                        <div className="text-[11px] text-foreground-muted">
                          {sop.summary || "No summary"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={resolveSeverityVariant(sop.severity)} size="sm">
                          {sop.severity || "P3"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[12px] text-foreground-light">
                        {sop.owners.length > 0 ? sop.owners.join(", ") : "-"}
                      </TableCell>
                      <TableCell className="text-[12px] text-foreground-light">
                        {sop.key}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Copy className="w-4 h-4" />}
                          onClick={() => handleCopy(copyValue)}
                        >
                          Copy ID
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </SettingsSection>
    </PageContainer>
  );
}
