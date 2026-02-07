"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ExternalLink, LifeBuoy, Search } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ticketRows } from "@/lib/mock-data";
import { adminApi } from "@/lib/api/admin";
import { isLocalModeEnabled } from "@/lib/env";
import { formatRelativeTime } from "@/lib/utils";
import type { SupportTicket, SupportTicketPriority, SupportTicketStatus } from "@/types/admin";

const PRIORITY_OPTIONS = ["all", "low", "medium", "high", "urgent"] as const;
const PRIORITY_LABELS: Record<string, string> = {
  all: "All Priorities",
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const STATUS_OPTIONS = [
  "all",
  "open",
  "in_progress",
  "waiting_on_customer",
  "resolved",
  "closed",
] as const;
const STATUS_LABELS: Record<string, string> = {
  all: "All Statuses",
  open: "Open",
  in_progress: "In Progress",
  waiting_on_customer: "Waiting on Customer",
  resolved: "Resolved",
  closed: "Closed",
};

export default function SupportTicketsPage() {
  const localMode = isLocalModeEnabled();
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<(typeof PRIORITY_OPTIONS)[number]>("all");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [localTickets] = useState<SupportTicket[]>(() => ticketRows as unknown as SupportTicket[]);

  const apiParams = useMemo<{
    search?: string;
    priority?: "" | SupportTicketPriority;
    status?: "" | SupportTicketStatus;
    page?: number;
    page_size?: number;
  }>(
    () => ({
      search: search.trim() || undefined,
      priority: priorityFilter === "all" ? "" : (priorityFilter as SupportTicketPriority),
      status: statusFilter === "all" ? "" : (statusFilter as SupportTicketStatus),
      page,
      page_size: pageSize,
    }),
    [page, pageSize, priorityFilter, search, statusFilter]
  );

  const ticketsQuery = useQuery({
    queryKey: ["admin", "support", "tickets", apiParams],
    enabled: !localMode,
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.support.tickets.list(apiParams),
  });

  const filteredTickets = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return localTickets.filter((ticket) => {
      const matchesSearch =
        !normalized ||
        ticket.subject.toLowerCase().includes(normalized) ||
        ticket.reference.toLowerCase().includes(normalized) ||
        ticket.id.toLowerCase().includes(normalized);
      const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [localTickets, priorityFilter, search, statusFilter]);

  const localTotal = filteredTickets.length;
  const localTotalPages = Math.max(1, Math.ceil(localTotal / pageSize));
  const localPagedTickets = filteredTickets.slice((page - 1) * pageSize, page * pageSize);

  const rows = localMode ? localPagedTickets : ticketsQuery.data?.items || [];
  const total = localMode ? localTotal : ticketsQuery.data?.total || 0;
  const totalPages = localMode ? localTotalPages : Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPage(1);
  }, [search, priorityFilter, statusFilter, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <PageContainer>
      <PageHeader
        title="Ticket Center"
        description="Track user feedback and SLA processing progress."
        icon={<LifeBuoy className="w-4 h-4" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Export Tickets
            </Button>
            <Button size="sm">New Ticket</Button>
          </div>
        }
      />

      <SettingsSection title="Pending Tickets" description="Prioritize high-priority and overdue tasks.">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="w-[260px]">
            <Input
              variant="search"
              inputSize="sm"
              placeholder="Search ticket subject or ID"
              leftIcon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">Priority</span>
            <select
              value={priorityFilter}
              onChange={(event) =>
                setPriorityFilter(event.target.value as (typeof PRIORITY_OPTIONS)[number])
              }
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-foreground-muted">Status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as (typeof STATUS_OPTIONS)[number])
              }
              className="h-7 rounded-md border border-border bg-surface-100 px-2 text-[11px] text-foreground-light focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <Badge variant="outline" size="sm">
            {total} total
          </Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ticketsQuery.isPending && !localMode ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-[12px] text-foreground-muted"
                >
                  {ticketsQuery.error && !localMode
                    ? "Failed to load. Please check API or permission settings."
                    : "No matching tickets"}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <div className="text-[12px] font-medium text-foreground">
                      {ticket.subject}
                    </div>
                    <div className="text-[11px] text-foreground-muted">
                      {ticket.reference} · {ticket.id}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ticket.priority === "urgent"
                          ? "error"
                          : ticket.priority === "high"
                          ? "warning"
                          : ticket.priority === "low"
                          ? "secondary"
                          : "info"
                      }
                      size="sm"
                    >
                      {PRIORITY_LABELS[ticket.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={ticket.status === "open" ? "warning" : "info"}
                      size="sm"
                    >
                      {STATUS_LABELS[ticket.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[12px] text-foreground-muted">
                    {ticket.updated_at ? formatRelativeTime(ticket.updated_at) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/support/tickets/${ticket.id}`}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                        View Details
                      </Button>
                    </Link>
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
    </PageContainer>
  );
}
