"use client";

import { useMemo, useState } from "react";
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Search,
  LogOut,
  AlertTriangle,
  Clock,
  MapPin,
  Shield,
  RefreshCw,
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
import { cn, formatRelativeTime } from "@/lib/utils";
import { maskIpAddress } from "@/lib/masking";

// ===== Mock Data =====

interface AdminSession {
  id: string;
  user_id: string;
  user_email: string;
  device_type: "desktop" | "mobile" | "tablet" | "unknown";
  device_name: string;
  browser: string;
  os: string;
  ip_address: string;
  location?: string;
  is_current: boolean;
  last_active_at: string;
  created_at: string;
  expires_at: string;
}

const mockSessions: AdminSession[] = [
  {
    id: "sess_001",
    user_id: "u_admin_001",
    user_email: "admin@agentflow.ai",
    device_type: "desktop",
    device_name: "MacBook Pro",
    browser: "Chrome 120",
    os: "macOS 14.2",
    ip_address: "192.168.1.100",
    location: "北京, 中国",
    is_current: true,
    last_active_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sess_002",
    user_id: "u_admin_001",
    user_email: "admin@agentflow.ai",
    device_type: "mobile",
    device_name: "iPhone 15 Pro",
    browser: "Safari",
    os: "iOS 17.2",
    ip_address: "10.0.0.50",
    location: "上海, 中国",
    is_current: false,
    last_active_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 19 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sess_003",
    user_id: "u_ops_001",
    user_email: "ops@agentflow.ai",
    device_type: "desktop",
    device_name: "Windows PC",
    browser: "Edge 120",
    os: "Windows 11",
    ip_address: "172.16.0.25",
    location: "深圳, 中国",
    is_current: false,
    last_active_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 16 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "sess_004",
    user_id: "u_support_001",
    user_email: "support@agentflow.ai",
    device_type: "tablet",
    device_name: "iPad Pro",
    browser: "Safari",
    os: "iPadOS 17",
    ip_address: "192.168.2.88",
    location: "广州, 中国",
    is_current: false,
    last_active_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 21 * 60 * 60 * 1000).toISOString(),
  },
];

const DEVICE_ICONS: Record<AdminSession["device_type"], typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  unknown: Globe,
};

export default function SessionsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Terminate session modal
  const [terminateModalOpen, setTerminateModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AdminSession | null>(null);
  const [terminateReason, setTerminateReason] = useState("");
  const [isTerminating, setIsTerminating] = useState(false);

  // Terminate all modal
  const [terminateAllModalOpen, setTerminateAllModalOpen] = useState(false);

  // Filtering
  const filteredSessions = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return mockSessions.filter((session) => {
      return (
        !normalized ||
        session.user_email.toLowerCase().includes(normalized) ||
        session.device_name.toLowerCase().includes(normalized) ||
        session.ip_address.includes(normalized) ||
        session.location?.toLowerCase().includes(normalized)
      );
    });
  }, [search]);

  const total = filteredSessions.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagedData = filteredSessions.slice((page - 1) * pageSize, page * pageSize);

  const handleTerminateSession = async () => {
    if (!selectedSession || !terminateReason.trim()) return;
    setIsTerminating(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsTerminating(false);
    setTerminateModalOpen(false);
    setSelectedSession(null);
    setTerminateReason("");
  };

  const handleTerminateAll = async () => {
    setIsTerminating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsTerminating(false);
    setTerminateAllModalOpen(false);
  };

  // Stats
  const activeCount = mockSessions.length;
  const uniqueUsers = new Set(mockSessions.map((s) => s.user_id)).size;
  const mobileCount = mockSessions.filter((s) => s.device_type === "mobile" || s.device_type === "tablet").length;

  return (
    <PageContainer>
      <PageHeader
        title="会话管理"
        description="查看和管理管理员登录会话，支持强制终止会话。"
        icon={<Shield className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              刷新
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setTerminateAllModalOpen(true)}
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              终止所有会话
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <div className="text-[11px] text-foreground-muted">活跃会话</div>
              <div className="text-[20px] font-semibold text-foreground">{activeCount}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-success-500" />
            </div>
            <div>
              <div className="text-[11px] text-foreground-muted">在线管理员</div>
              <div className="text-[20px] font-semibold text-foreground">{uniqueUsers}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning-500/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-warning-500" />
            </div>
            <div>
              <div className="text-[11px] text-foreground-muted">移动设备</div>
              <div className="text-[20px] font-semibold text-foreground">{mobileCount}</div>
            </div>
          </div>
        </Card>
      </div>

      <SettingsSection
        title="活跃会话"
        description="所有管理员的登录会话列表，支持按用户、设备或 IP 搜索。"
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[280px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="搜索用户、设备或 IP 地址"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Badge variant="outline" size="sm">
            共 {total} 个会话
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户</TableHead>
              <TableHead>设备</TableHead>
              <TableHead>位置</TableHead>
              <TableHead>最后活跃</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-[12px] text-foreground-muted">
                  暂无活跃会话
                </TableCell>
              </TableRow>
            ) : (
              pagedData.map((session) => {
                const DeviceIcon = DEVICE_ICONS[session.device_type];
                return (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="text-[12px] text-foreground">{session.user_email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-surface-200 flex items-center justify-center">
                          <DeviceIcon className="w-3.5 h-3.5 text-foreground-muted" />
                        </div>
                        <div>
                          <div className="text-[12px] text-foreground">{session.device_name}</div>
                          <div className="text-[11px] text-foreground-muted">
                            {session.browser} / {session.os}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-foreground-muted" />
                        <div>
                          <div className="text-[12px] text-foreground-light">
                            {session.location || "未知位置"}
                          </div>
                          <div className="text-[11px] text-foreground-muted font-mono">
                            {maskIpAddress(session.ip_address)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-foreground-muted" />
                        <span className="text-[12px] text-foreground-light">
                          {formatRelativeTime(session.last_active_at)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {session.is_current ? (
                        <Badge variant="success" size="sm">当前会话</Badge>
                      ) : (
                        <Badge variant="outline" size="sm">活跃</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!session.is_current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSession(session);
                            setTerminateModalOpen(true);
                          }}
                        >
                          <LogOut className="w-3.5 h-3.5 mr-1" />
                          终止
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
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

      {/* Terminate Session Modal */}
      <Dialog open={terminateModalOpen} onOpenChange={setTerminateModalOpen}>
        <DialogContent>
          <DialogHeader icon={<AlertTriangle className="w-6 h-6" />} iconVariant="warning">
            <DialogTitle>终止会话</DialogTitle>
            <DialogDescription>
              确定要终止此会话吗？用户将被强制登出。
            </DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="grid gap-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">用户</span>
                    <span className="text-foreground">{selectedSession.user_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">设备</span>
                    <span className="text-foreground">{selectedSession.device_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">位置</span>
                    <span className="text-foreground">{selectedSession.location || "未知"}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-foreground mb-1.5 block">
                  终止原因 <span className="text-destructive">*</span>
                </label>
                <Input
                  inputSize="sm"
                  placeholder="请输入终止原因"
                  value={terminateReason}
                  onChange={(e) => setTerminateReason(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTerminateModalOpen(false)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={!terminateReason.trim() || isTerminating}
              onClick={handleTerminateSession}
            >
              {isTerminating ? "终止中..." : "确认终止"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terminate All Modal */}
      <Dialog open={terminateAllModalOpen} onOpenChange={setTerminateAllModalOpen}>
        <DialogContent>
          <DialogHeader icon={<AlertTriangle className="w-6 h-6" />} iconVariant="error">
            <DialogTitle>终止所有会话</DialogTitle>
            <DialogDescription>
              此操作将强制登出所有管理员（包括您自己），确定继续吗？
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
              <div className="text-[12px] text-foreground">
                <p className="font-medium">危险操作</p>
                <p className="text-foreground-light mt-1">
                  共有 {activeCount} 个活跃会话将被终止，所有管理员需要重新登录。
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTerminateAllModalOpen(false)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isTerminating}
              onClick={handleTerminateAll}
            >
              {isTerminating ? "终止中..." : "确认终止所有会话"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
