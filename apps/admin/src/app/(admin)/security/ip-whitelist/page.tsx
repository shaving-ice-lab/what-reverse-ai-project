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
    description: "Company Intranet",
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
    description: "Operations Server",
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
    description: "VPN Subnet",
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
    description: "External Audit Server",
    type: "single",
    enabled: false,
    created_by: "finance@agentflow.ai",
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    match_count: 0,
  },
];

const mockRegions: RegionRestriction[] = [
  { id: "r_001", region: "CN", region_name: "China", allowed: true, created_at: new Date().toISOString() },
  { id: "r_002", region: "HK", region_name: "Hong Kong", allowed: true, created_at: new Date().toISOString() },
  { id: "r_003", region: "TW", region_name: "Taiwan", allowed: true, created_at: new Date().toISOString() },
  { id: "r_004", region: "SG", region_name: "Singapore", allowed: true, created_at: new Date().toISOString() },
  { id: "r_005", region: "JP", region_name: "Japan", allowed: false, created_at: new Date().toISOString() },
  { id: "r_006", region: "US", region_name: "United States", allowed: false, created_at: new Date().toISOString() },
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
        title="IP Whitelist & Region Restrictions"
        description="Configure allowed IP addresses and regions for admin panel access."
        icon={<Shield className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="w-3.5 h-3.5 mr-1" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-3.5 h-3.5 mr-1" />
              Export
            </Button>
            <Button size="sm" onClick={handleOpenAddModal}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add IP
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
                <div className="text-[13px] font-medium text-foreground">IP Whitelist</div>
                <div className="text-[11px] text-foreground-muted">
                  {enabledCount} rules enabled
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
              IP whitelist is disabled, all IPs can access
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
                <div className="text-[13px] font-medium text-foreground">Region Restrictions</div>
                <div className="text-[11px] text-foreground-muted">
                  {allowedRegions} regions allowed
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
              Region restrictions are disabled, all regions can access
            </div>
          )}
        </Card>
      </div>

      {/* IP Whitelist */}
      <SettingsSection
        title="IP Whitelist"
        description="Configure allowed IP addresses or CIDR ranges."
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="Search IP or description"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Badge variant="outline" size="sm">
            {total} rules total
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>IP Address/Range</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Match Count</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-[12px] text-foreground-muted">
                  No IP whitelist rules found
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
                      Created by {entry.created_by}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" size="sm">
                      {entry.type === "cidr" ? "CIDR Range" : "Single IP"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-[12px] text-foreground">{entry.match_count.toLocaleString()}</div>
                    {entry.last_matched_at && (
                      <div className="text-[11px] text-foreground-muted">
                        Last matched {formatRelativeTime(entry.last_matched_at)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {entry.enabled ? (
                      <Badge variant="success" size="sm">
                        <Check className="w-3 h-3 mr-1" />
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="outline" size="sm">
                        <X className="w-3 h-3 mr-1" />
                        Disabled
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
        title="Region Restrictions"
        description="Configure allowed regions. Regions not in the list are denied by default."
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
            <DialogTitle>{editingEntry ? "Edit IP Rule" : "Add IP Rule"}</DialogTitle>
            <DialogDescription>
              {editingEntry ? "Modify IP whitelist rule configuration." : "Add a new IP whitelist rule."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-[12px] font-medium text-foreground mb-1.5 block">
                IP Address/Range <span className="text-destructive">*</span>
              </label>
              <Input
                inputSize="sm"
                placeholder="e.g., 192.168.1.0/24 or 10.0.0.100"
                value={formData.ip_address}
                onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
              />
              <div className="text-[11px] text-foreground-muted mt-1">
                Supports single IP or CIDR format ranges
              </div>
            </div>

            <div>
              <label className="text-[12px] font-medium text-foreground mb-1.5 block">
                Description <span className="text-destructive">*</span>
              </label>
              <Input
                inputSize="sm"
                placeholder="e.g., Company Intranet"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[12px] font-medium text-foreground mb-1.5 block">Type</label>
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
                  <span className="text-[12px] text-foreground">Single IP</span>
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
                  <span className="text-[12px] text-foreground">CIDR Range</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!formData.ip_address.trim() || !formData.description.trim() || isSaving}
              onClick={handleSave}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader icon={<AlertTriangle className="w-6 h-6" />} iconVariant="warning">
            <DialogTitle>Delete IP Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this IP whitelist rule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deletingEntry && (
            <div className="rounded-lg border border-border bg-surface-75 p-4">
              <div className="grid gap-2 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-foreground-muted">IP Address</span>
                  <code className="font-mono text-foreground">{deletingEntry.ip_address}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-muted">Description</span>
                  <span className="text-foreground">{deletingEntry.description}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" disabled={isSaving} onClick={handleDelete}>
              {isSaving ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
