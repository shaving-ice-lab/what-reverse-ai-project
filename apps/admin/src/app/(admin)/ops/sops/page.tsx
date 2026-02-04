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
    title: "支持与运维 SOP",
    summary: "客服、故障排查与应急处理流程。",
    severity: "P2",
    owners: ["support"],
    triggers: [],
    preconditions: [],
    steps: [],
    references: [{ label: "文档", target: "docs/operations/OPS-SUPPORT-SOPS.md" }],
  },
  {
    key: "sql-schema-index",
    title: "SQL Schema 与索引规范",
    summary: "数据库索引与约束约定。",
    severity: "P2",
    owners: ["database"],
    triggers: [],
    preconditions: [],
    steps: [],
    references: [{ label: "文档", target: "docs/operations/SQL-SCHEMA-INDEX-CONSTRAINTS.md" }],
  },
  {
    key: "test-case-template",
    title: "测试用例模板",
    summary: "测试与验收用例参考模板。",
    severity: "P3",
    owners: ["qa"],
    triggers: [],
    preconditions: [],
    steps: [],
    references: [{ label: "文档", target: "docs/operations/TEST-CASE-TEMPLATES.md" }],
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
      toast.success("已复制 SOP 标识");
    } catch {
      toast.error("复制失败，请手动复制");
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="运维 SOP 文档"
        description="集中查看运维与支持 SOP 文档入口。"
        icon={<BookOpen className="w-4 h-4" />}
      />

      <SettingsSection title="SOP 文档目录" description="按需查看运维 SOP 的关键信息与标识。">
        {hasError ? (
          <EmptyState title="加载失败" description="无法获取 SOP 列表，请检查服务或权限。" />
        ) : sops.length === 0 && !isLoading ? (
          <EmptyState title="暂无 SOP 文档" description="未配置任何运维 SOP 文档。" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SOP</TableHead>
                <TableHead>级别</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Key</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-[12px] text-foreground-muted"
                  >
                    正在加载...
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
                          {sop.summary || "暂无摘要"}
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
                          复制标识
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
