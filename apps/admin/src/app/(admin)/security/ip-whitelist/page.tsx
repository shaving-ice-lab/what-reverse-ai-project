"use client";

import { useMemo, useState } from "react";
import {
  Shield,
  Search,
  Plus,
  Trash2,
  Edit2,
  Globe,
  AlertTriangle,
  Check,
  X,
  Download,
  Upload,
} from "lucide-react";
import {
  PageContainer,
  PageHeader,
  SettingsSection,
} from "@/components/dashboard/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FullPagination } from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { formatRelativeTime } from "@/lib/utils";

// ===== Types =====

interface IpWhitelistEntry {
  id: string;
  ip_address: string;
  cidr?: string;
  description: string;
  type: "single" | "range" | "cidr";
  enabled: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_matched_at?: string;
  match_count: number;
}

interface RegionRestriction {
  id: string;
  region: string;
  region_name: string;
  allowed: boolean;
  created_at: string;
}

// ===== Mock Data =====

const mockWhitelist: IpWhitelistEntry[] = [
  {
    id: "wl_001",
    ip_address: "192.168.1.0/24",
    cidr: "/24",
    description: "公司内网",
    type: "cidr",
    enabled: true,
    created_by: "admin@agentflow.ai",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    last_matched_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    match_count: 1523,
  },
  {
    id: "wl_002",
    ip_address: "10.0.0.100",
    description: "运维服务器",
    type: "single",
    enabled: true,
    created_by: "ops@agentflow.ai",
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    last_matched_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    match_count: 456,
  },
  {
    id: "wl_003",
    ip_address: "172.16.0.0/16",
    cidr: "/16",
    description: "VPN 网段",
    type: "cidr",
    enabled: true,
    created_by: "admin@agentflow.ai",
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    last_matched_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    match_count: 789,
  },
  {
    id: "wl_004",
    ip_address: "203.0.113.50",
    description: "外部审计服务器",
    type: "single",
    enabled: false,
    created_by: "finance@agentflow.ai",
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    match_count: 0,
  },
];

const mockRegions: RegionRestriction[] = [
  { id: "r_001", region: "CN", region_name: "中国", allowed: true, created_at: new Date().toISOString() },
  { id: "r_002", region: "HK", region_name: "中国香港", allowed: true, created_at: new Date().toISOString() },
  { id: "r_003", region: "TW", region_name: "中国台湾", allowed: true, created_at: new Date().toISOString() },
  { id: "r_004", region: "SG", region_name: "新加坡", allowed: true, created_at: new Date().toISOString() },
  { id: "r_005", region: "JP", region_name: "日本", allowed: false, created_at: new Date().toISOString() },
  { id: "r_006", region: "US", region_name: "美国", allowed: false, created_at: new Date().toISOString() },
];

export default function IpWhitelistPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [whitelistEnabled, setWhitelistEnabled] = useState(true);
  const [regionEnabled, setRegionEnabled] = useState(true);

  // Add/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<IpWhitelistEntry | null>(null);
  const [formData, setFormData] = useState({
    ip_address: "",
    description: "",
    type: "single" as "single" | "cidr",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState<IpWhitelistEntry | null>(null);

  // Filtering
  const filteredWhitelist = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return mockWhitelist.filter((entry) => {
      return (
        !normalized ||
        entry.ip_address.toLowerCase().includes(normalized) ||
        entry.description.toLowerCase().includes(normalized) ||
        entry.created_by.toLowerCase().includes(normalized)
      );
    });
  }, [search]);

  const total = filteredWhitelist.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagedData = filteredWhitelist.slice((page - 1) * pageSize, page * pageSize);

  const handleOpenAddModal = () => {
    setEditingEntry(null);
    setFormData({ ip_address: "", description: "", type: "single" });
    setModalOpen(true);
  };

  const handleOpenEditModal = (entry: IpWhitelistEntry) => {
    setEditingEntry(entry);
    setFormData({
      ip_address: entry.ip_address,
      description: entry.description,
      type: entry.type === "cidr" ? "cidr" : "single",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.ip_address.trim() || !formData.description.trim()) return;
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deletingEntry) return;
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setDeleteModalOpen(false);
    setDeletingEntry(null);
  };

  const enabledCount = mockWhitelist.filter((e) => e.enabled).length;
  const allowedRegions = mockRegions.filter((r) => r.allowed).length;

  return (
    <PageContainer>
      <PageHeader
        title="IP 白名单与区域限制"
        description="配置允许访问管理后台的 IP 地址和地区范围。"
        icon={<Shield className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="w-3.5 h-3.5 mr-1" />
              导入
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-3.5 h-3.5 mr-1" />
              导出
            </Button>
            <Button size="sm" onClick={handleOpenAddModal}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              添加 IP
            </Button>
          </div>
        }
      />

      {/* Global Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <div className="text-[13px] font-medium text-foreground">IP 白名单</div>
                <div className="text-[11px] text-foreground-muted">
                  {enabledCount} 条规则已启用
                </div>
              </div>
            </div>
            <Switch
              checked={whitelistEnabled}
              onCheckedChange={setWhitelistEnabled}
            />
          </div>
          {!whitelistEnabled && (
            <div className="mt-3 flex items-center gap-2 text-[11px] text-warning-600 bg-warning-500/10 rounded-md px-2 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              IP 白名单已禁用，所有 IP 均可访问
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success-500/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-success-500" />
              </div>
              <div>
                <div className="text-[13px] font-medium text-foreground">区域限制</div>
                <div className="text-[11px] text-foreground-muted">
                  允许 {allowedRegions} 个地区访问
                </div>
              </div>
            </div>
            <Switch
              checked={regionEnabled}
              onCheckedChange={setRegionEnabled}
            />
          </div>
          {!regionEnabled && (
            <div className="mt-3 flex items-center gap-2 text-[11px] text-warning-600 bg-warning-500/10 rounded-md px-2 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              区域限制已禁用，所有地区均可访问
            </div>
          )}
        </Card>
      </div>

      {/* IP Whitelist */}
      <SettingsSection
        title="IP 白名单"
        description="配置允许访问的 IP 地址或 CIDR 网段。"
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="搜索 IP 或描述"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Badge variant="outline" size="sm">
            共 {total} 条规则
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>IP 地址/网段</TableHead>
              <TableHead>描述</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>匹配次数</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-[12px] text-foreground-muted">
                  暂无 IP 白名单规则
                </TableCell>
              </TableRow>
            ) : (
              pagedData.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <code className="text-[12px] font-mono text-foreground bg-surface-100 px-1.5 py-0.5 rounded">
                      {entry.ip_address}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="text-[12px] text-foreground">{entry.description}</div>
                    <div className="text-[11px] text-foreground-muted">
                      由 {entry.created_by} 创建
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">
                      {entry.type === "cidr" ? "CIDR 网段" : "单个 IP"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-[12px] text-foreground">{entry.match_count.toLocaleString()}</div>
                    {entry.last_matched_at && (
                      <div className="text-[11px] text-foreground-muted">
                        最后匹配 {formatRelativeTime(entry.last_matched_at)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.enabled ? (
                      <Badge variant="success" size="sm">
                        <Check className="w-3 h-3 mr-1" />
                        启用
                      </Badge>
                    ) : (
                      <Badge variant="outline" size="sm">
                        <X className="w-3 h-3 mr-1" />
                        禁用
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditModal(entry)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingEntry(entry);
                          setDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="mt-4">
          <FullPagination
            page={page}
            totalPages={totalPages}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            showInput={false}
            size="sm"
            variant="outline"
          />
        </div>
      </SettingsSection>

      {/* Region Restrictions */}
      <SettingsSection
        title="区域限制"
        description="配置允许访问的地区。未在列表中的地区默认禁止访问。"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {mockRegions.map((region) => (
            <div
              key={region.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-75"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-foreground-muted" />
                <div>
                  <div className="text-[12px] font-medium text-foreground">{region.region_name}</div>
                  <div className="text-[11px] text-foreground-muted">{region.region}</div>
                </div>
              </div>
              <Switch checked={region.allowed} onCheckedChange={() => {}} />
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader icon={<Shield className="w-6 h-6" />} iconVariant="info">
            <DialogTitle>{editingEntry ? "编辑 IP 规则" : "添加 IP 规则"}</DialogTitle>
            <DialogDescription>
              {editingEntry ? "修改 IP 白名单规则配置。" : "添加新的 IP 白名单规则。"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-[12px] font-medium text-foreground mb-1.5 block">
                IP 地址/网段 <span className="text-destructive">*</span>
              </label>
              <Input
                inputSize="sm"
                placeholder="例如：192.168.1.0/24 或 10.0.0.100"
                value={formData.ip_address}
                onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
              />
              <div className="text-[11px] text-foreground-muted mt-1">
                支持单个 IP 或 CIDR 格式的网段
              </div>
            </div>

            <div>
              <label className="text-[12px] font-medium text-foreground mb-1.5 block">
                描述 <span className="text-destructive">*</span>
              </label>
              <Input
                inputSize="sm"
                placeholder="例如：公司内网"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[12px] font-medium text-foreground mb-1.5 block">类型</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="single"
                    checked={formData.type === "single"}
                    onChange={() => setFormData({ ...formData, type: "single" })}
                    className="accent-brand-500"
                  />
                  <span className="text-[12px] text-foreground">单个 IP</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="cidr"
                    checked={formData.type === "cidr"}
                    onChange={() => setFormData({ ...formData, type: "cidr" })}
                    className="accent-brand-500"
                  />
                  <span className="text-[12px] text-foreground">CIDR 网段</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              取消
            </Button>
            <Button
              size="sm"
              disabled={!formData.ip_address.trim() || !formData.description.trim() || isSaving}
              onClick={handleSave}
            >
              {isSaving ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader icon={<AlertTriangle className="w-6 h-6" />} iconVariant="warning">
            <DialogTitle>删除 IP 规则</DialogTitle>
            <DialogDescription>
              确定要删除此 IP 白名单规则吗？此操作不可恢复。
            </DialogDescription>
          </DialogHeader>

          {deletingEntry && (
            <div className="rounded-lg border border-border bg-surface-75 p-4">
              <div className="grid gap-2 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-foreground-muted">IP 地址</span>
                  <code className="font-mono text-foreground">{deletingEntry.ip_address}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted">描述</span>
                  <span className="text-foreground">{deletingEntry.description}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" size="sm" disabled={isSaving} onClick={handleDelete}>
              {isSaving ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
