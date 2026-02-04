"use client";

import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { RefreshCcw, ServerCog } from "lucide-react";
import {
  EmptyState,
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
import { systemApi } from "@/lib/api/system";
import { isLocalModeEnabled } from "@/lib/env";
import { deploymentInfo as deploymentMock } from "@/lib/mock-data";
import type { DeploymentInfo } from "@/types/system";

export default function SystemDeploymentPage() {
  const localMode = isLocalModeEnabled();

  const deploymentQuery = useQuery({
    queryKey: ["system", "deployment"],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => systemApi.getDeployment(),
  });

  const deployment: DeploymentInfo | undefined = localMode
    ? (deploymentMock as DeploymentInfo)
    : deploymentQuery.data;

  const regionBaseUrls = deployment?.region_base_urls || {};
  const primaryRegion = deployment?.primary_region || deployment?.region || "";

  const regionList = useMemo(() => {
    const set = new Set<string>();
    (deployment?.regions || []).forEach((region) => set.add(region));
    Object.keys(regionBaseUrls).forEach((region) => set.add(region));
    return Array.from(set);
  }, [deployment?.regions, regionBaseUrls]);

  const isLoading = !localMode && deploymentQuery.isPending;

  return (
    <PageContainer>
      <PageHeader
        title="部署信息"
        description="查看多地域部署与访问入口配置。"
        icon={<ServerCog className="w-4 h-4" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCcw className="w-4 h-4" />}
            onClick={() => {
              if (!localMode) deploymentQuery.refetch();
            }}
            loading={!localMode && deploymentQuery.isFetching}
            loadingText="刷新中..."
          >
            刷新
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <StatsCard
          title="覆盖区域"
          value={regionList.length}
          subtitle="已配置可用区"
        />
        <StatsCard
          title="Primary Region"
          value={primaryRegion || "-"}
          subtitle="主区域入口"
        />
        <StatsCard
          title="可用入口"
          value={Object.keys(regionBaseUrls).length}
          subtitle="区域 Base URL 数量"
        />
      </div>

      <SettingsSection title="区域入口" description="查看各区域的 API Base URL 配置。">
        {isLoading ? (
          <div className="text-[12px] text-foreground-muted">正在加载...</div>
        ) : regionList.length === 0 ? (
          <EmptyState
            title="暂无部署信息"
            description="尚未返回区域配置数据。"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>区域</TableHead>
                <TableHead>访问入口</TableHead>
                <TableHead>角色</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regionList.map((region) => {
                const isPrimary = region === primaryRegion;
                return (
                  <TableRow key={region}>
                    <TableCell className="text-[12px] font-medium text-foreground">
                      {region}
                    </TableCell>
                    <TableCell className="text-[12px] text-foreground-light">
                      {regionBaseUrls[region] || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isPrimary ? "success" : "outline"} size="sm">
                        {isPrimary ? "Primary" : "Secondary"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </SettingsSection>
    </PageContainer>
  );
}
