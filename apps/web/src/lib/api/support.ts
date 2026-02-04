import { api } from "../api";

export type SupportSLATarget = {
  priority: string;
  first_response_minutes: number;
  first_response_target: string;
  update_cadence: string;
  update_cadence_minutes?: number;
  resolution_target: string;
  resolution_minutes?: number;
  applies_to: string[];
};

export type SupportSLA = {
  key: string;
  title: string;
  targets: SupportSLATarget[];
  notes?: string[];
};

export type SupportTicket = {
  id: string;
  reference: string;
  workspace_id?: string;
  app_id?: string;
  requester_user_id?: string;
  requester_name?: string;
  requester_email: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  status_note?: string;
  channel: string;
  assignee_type?: string;
  assignee_value?: string;
  assigned_at?: string;
  sla_response_due_at?: string;
  sla_update_due_at?: string;
  sla_resolve_due_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CreateSupportTicketRequest = {
  workspace_id?: string;
  app_id?: string;
  requester_name?: string;
  requester_email: string;
  subject: string;
  description: string;
  category?: string;
  priority?: string;
  channel?: string;
  metadata?: Record<string, unknown>;
  captcha_token?: string;
};

export type SupportTicketListResponse = {
  items: SupportTicket[];
  total: number;
  page: number;
  page_size: number;
};

export type UpdateSupportTicketStatusRequest = {
  status: string;
  note?: string;
};

export type SupportChannel = {
  id: string;
  key: string;
  name: string;
  description?: string;
  contact?: string;
  sla_overrides?: Record<string, number>;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type SupportAssignmentRule = {
  id: string;
  name: string;
  priority: string;
  category: string;
  channel: string;
  keyword: string;
  assignee_type: string;
  assignee_value: string;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type SupportTicketComment = {
  id: string;
  ticket_id: string;
  author_user_id?: string;
  author_name?: string;
  body: string;
  is_internal: boolean;
  created_at: string;
};

export type SupportTeam = {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type SupportTeamMember = {
  id: string;
  team_id: string;
  user_id: string;
  role?: string;
  sort_order: number;
  created_at: string;
};

export type SupportQueue = {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type SupportQueueMember = {
  id: string;
  queue_id: string;
  user_id: string;
  sort_order: number;
  created_at: string;
};

export type SupportNotificationTemplate = {
  title: string;
  content: string;
};

export type SupportNotificationTemplates = {
  ticket_created: SupportNotificationTemplate;
  status_updated: SupportNotificationTemplate;
  comment_added: SupportNotificationTemplate;
};

export type SupportNotificationTemplateConfig = {
  default_channel: string;
  default_locale: string;
  channels: Record<string, Record<string, SupportNotificationTemplates>>;
};

export const supportApi = {
  getChannels() {
    return api.get<{ channels: SupportChannel[] }>("/support/channels");
  },
  getSLA() {
    return api.get<{ sla: SupportSLA }>("/support/sla");
  },
  createTicket(payload: CreateSupportTicketRequest) {
    return api.post<{ ticket: SupportTicket; sla: SupportSLA }>("/support/tickets", payload);
  },
  getTicket(ticketId: string) {
    return api.get<{ ticket: SupportTicket }>(`/support/tickets/${ticketId}`);
  },
  adminListTickets(params: {
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
    workspace_id?: string;
    app_id?: string;
    page?: number;
    page_size?: number;
  }) {
    return api.get<SupportTicketListResponse>("/admin/support/tickets", {
      params,
    });
  },
  adminGetTicket(ticketId: string) {
    return api.get<{ ticket: SupportTicket }>(`/admin/support/tickets/${ticketId}`);
  },
  adminUpdateStatus(ticketId: string, payload: UpdateSupportTicketStatusRequest) {
    return api.patch<{ ticket: SupportTicket }>(`/admin/support/tickets/${ticketId}/status`, payload);
  },
  adminListChannels(includeDisabled?: boolean) {
    return api.get<{ channels: SupportChannel[] }>("/admin/support/channels", {
      params: { include_disabled: includeDisabled ? true : undefined },
    });
  },
  adminCreateChannel(payload: {
    key: string;
    name: string;
    description?: string;
    contact?: string;
    sla_overrides?: Record<string, number>;
    enabled?: boolean;
    sort_order?: number;
  }) {
    return api.post<{ channel: SupportChannel }>("/admin/support/channels", payload);
  },
  adminUpdateChannel(channelId: string, payload: {
    key?: string;
    name?: string;
    description?: string;
    contact?: string;
    sla_overrides?: Record<string, number>;
    enabled?: boolean;
    sort_order?: number;
  }) {
    return api.patch<{ channel: SupportChannel }>(`/admin/support/channels/${channelId}`, payload);
  },
  adminListRules(includeDisabled?: boolean) {
    return api.get<{ rules: SupportAssignmentRule[] }>("/admin/support/routing-rules", {
      params: { include_disabled: includeDisabled ? true : undefined },
    });
  },
  adminCreateRule(payload: {
    name: string;
    priority?: string;
    category?: string;
    channel?: string;
    keyword?: string;
    assignee_type?: string;
    assignee_value?: string;
    enabled?: boolean;
    sort_order?: number;
  }) {
    return api.post<{ rule: SupportAssignmentRule }>("/admin/support/routing-rules", payload);
  },
  adminUpdateRule(ruleId: string, payload: {
    name?: string;
    priority?: string;
    category?: string;
    channel?: string;
    keyword?: string;
    assignee_type?: string;
    assignee_value?: string;
    enabled?: boolean;
    sort_order?: number;
  }) {
    return api.patch<{ rule: SupportAssignmentRule }>(`/admin/support/routing-rules/${ruleId}`, payload);
  },
  adminListComments(ticketId: string) {
    return api.get<{ comments: SupportTicketComment[] }>(
      `/admin/support/tickets/${ticketId}/comments`
    );
  },
  adminCreateComment(ticketId: string, payload: {
    body: string;
    is_internal?: boolean;
    author_name?: string;
  }) {
    return api.post<{ comment: SupportTicketComment }>(
      `/admin/support/tickets/${ticketId}/comments`,
      payload
    );
  },
  adminListTeams(includeDisabled?: boolean) {
    return api.get<{ teams: SupportTeam[] }>("/admin/support/teams", {
      params: { include_disabled: includeDisabled ? true : undefined },
    });
  },
  adminCreateTeam(payload: { name: string; description?: string; enabled?: boolean }) {
    return api.post<{ team: SupportTeam }>("/admin/support/teams", payload);
  },
  adminUpdateTeam(teamId: string, payload: { name?: string; description?: string; enabled?: boolean }) {
    return api.patch<{ team: SupportTeam }>(`/admin/support/teams/${teamId}`, payload);
  },
  adminListTeamMembers(teamId: string) {
    return api.get<{ members: SupportTeamMember[] }>(`/admin/support/teams/${teamId}/members`);
  },
  adminAddTeamMember(teamId: string, payload: { user_id: string; role?: string; sort_order?: number }) {
    return api.post<{ member: SupportTeamMember }>(`/admin/support/teams/${teamId}/members`, payload);
  },
  adminRemoveTeamMember(teamId: string, userId: string) {
    return api.delete<Record<string, never>>(`/admin/support/teams/${teamId}/members/${userId}`);
  },
  adminListQueues(includeDisabled?: boolean) {
    return api.get<{ queues: SupportQueue[] }>("/admin/support/queues", {
      params: { include_disabled: includeDisabled ? true : undefined },
    });
  },
  adminCreateQueue(payload: { name: string; description?: string; enabled?: boolean }) {
    return api.post<{ queue: SupportQueue }>("/admin/support/queues", payload);
  },
  adminUpdateQueue(queueId: string, payload: { name?: string; description?: string; enabled?: boolean }) {
    return api.patch<{ queue: SupportQueue }>(`/admin/support/queues/${queueId}`, payload);
  },
  adminListQueueMembers(queueId: string) {
    return api.get<{ members: SupportQueueMember[] }>(`/admin/support/queues/${queueId}/members`);
  },
  adminAddQueueMember(queueId: string, payload: { user_id: string; sort_order?: number }) {
    return api.post<{ member: SupportQueueMember }>(`/admin/support/queues/${queueId}/members`, payload);
  },
  adminRemoveQueueMember(queueId: string, userId: string) {
    return api.delete<Record<string, never>>(`/admin/support/queues/${queueId}/members/${userId}`);
  },
  adminGetNotificationTemplates() {
    return api.get<{ templates: SupportNotificationTemplateConfig }>("/admin/support/notification-templates");
  },
  adminUpdateNotificationTemplates(payload: SupportNotificationTemplateConfig) {
    return api.put<{ templates: SupportNotificationTemplateConfig }>(
      "/admin/support/notification-templates",
      payload
    );
  },
};
