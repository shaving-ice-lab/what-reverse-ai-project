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
        title="Deployment Info"
        description="View multi-region deployment and access endpoint configurations."
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
            loadingText="Refreshing..."
          >
            Refresh
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        <StatsCard
          title="Regions Covered"
          value={regionList.length}
          subtitle="Configured availability zones"
        />
        <StatsCard
          title="Primary Region"
          value={primaryRegion || "-"}
          subtitle="Primary region endpoint"
        />
        <StatsCard
          title="Available Endpoints"
          value={Object.keys(regionBaseUrls).length}
          subtitle="Number of regional Base URLs"
        />
      </div>

      <SettingsSection title="Regional Endpoints" description="View the API Base URL configuration for each region.">
        {isLoading ? (
          <div className="text-[12px] text-foreground-muted">Loading...</div>
        ) : regionList.length === 0 ? (
          <EmptyState
            title="No Deployment Info"
            description="No regional configuration data returned."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Region</TableHead>
                <TableHead>Access Endpoint</TableHead>
                <TableHead>Role</TableHead>
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
