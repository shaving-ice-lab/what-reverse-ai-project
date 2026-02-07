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
    location: "Beijing, China",
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
    location: "Shanghai, China",
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
    location: "Shenzhen, China",
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
    location: "Guangzhou, China",
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
        title="Session Management"
        description="View and manage admin login sessions with force termination support."
        icon={<Shield className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Refresh
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setTerminateAllModalOpen(true)}
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Terminate All Sessions
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
              <div className="text-[11px] text-foreground-muted">Active Sessions</div>
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
              <div className="text-[11px] text-foreground-muted">Online Admins</div>
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
              <div className="text-[11px] text-foreground-muted">Mobile Devices</div>
              <div className="text-[20px] font-semibold text-foreground">{mobileCount}</div>
            </div>
          </div>
        </Card>
      </div>

      <SettingsSection
        title="Active Sessions"
        description="All admin login sessions. Search by user, device, or IP address."
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[280px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="Search user, device, or IP address"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Badge variant="outline" size="sm">
            {total} sessions
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-[12px] text-foreground-muted">
                  No active sessions
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
                            {session.location || "Unknown location"}
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
                        <Badge variant="success" size="sm">Current Session</Badge>
                      ) : (
                        <Badge variant="outline" size="sm">Active</Badge>
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
                          Terminate
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
            <DialogTitle>Terminate Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to terminate this session? The user will be forced to log out.
            </DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-surface-75 p-4">
                <div className="grid gap-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">User</span>
                    <span className="text-foreground">{selectedSession.user_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Device</span>
                    <span className="text-foreground">{selectedSession.device_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Location</span>
                    <span className="text-foreground">{selectedSession.location || "Unknown"}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-foreground mb-1.5 block">
                  Termination Reason <span className="text-destructive">*</span>
                </label>
                <Input
                  inputSize="sm"
                  placeholder="Enter termination reason"
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
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={!terminateReason.trim() || isTerminating}
              onClick={handleTerminateSession}
            >
              {isTerminating ? "Terminating..." : "Confirm Terminate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terminate All Modal */}
      <Dialog open={terminateAllModalOpen} onOpenChange={setTerminateAllModalOpen}>
        <DialogContent>
          <DialogHeader icon={<AlertTriangle className="w-6 h-6" />} iconVariant="error">
            <DialogTitle>Terminate All Sessions</DialogTitle>
            <DialogDescription>
              This will force log out all admins (including yourself). Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5" />
              <div className="text-[12px] text-foreground">
                <p className="font-medium">Dangerous Operation</p>
                <p className="text-foreground-light mt-1">
                  {activeCount} active sessions will be terminated. All admins will need to log in again.
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
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isTerminating}
              onClick={handleTerminateAll}
            >
              {isTerminating ? "Terminating..." : "Confirm Terminate All Sessions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
