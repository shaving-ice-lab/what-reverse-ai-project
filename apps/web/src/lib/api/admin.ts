import { api } from "../api";
import type { SupportTicket } from "./support";

export type AdminCapability = {
  key: string;
  title: string;
  description: string;
};

export type AdminListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};

export type AdminUser = {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  role: "user" | "admin" | "creator";
  status: "active" | "suspended";
  status_reason?: string;
  status_updated_at?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
};

export type AdminWorkspace = {
  id: string;
  owner_user_id: string;
  name: string;
  slug: string;
  icon?: string;
  status: string;
  status_reason?: string;
  status_updated_at?: string;
  plan: string;
  region?: string;
  default_app_id?: string;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    email: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
};

export type AdminApp = {
  id: string;
  workspace_id: string;
  owner_user_id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  status: string;
  status_reason?: string;
  status_updated_at?: string;
  current_version_id?: string;
  pricing_type: string;
  price?: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  workspace?: {
    id: string;
    name: string;
    slug: string;
  };
  owner?: {
    id: string;
    email: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
};

export const adminApi = {
  getCapabilities() {
    return api.get<{ capabilities: AdminCapability[] }>("/admin/capabilities");
  },
  listUsers(params?: {
    search?: string;
    status?: string;
    role?: string;
    page?: number;
    page_size?: number;
  }) {
    return api.get<AdminListResponse<AdminUser>>("/admin/users", { params });
  },
  updateUserStatus(id: string, payload: { status: string; reason?: string }) {
    return api.patch<{ user: AdminUser }>(`/admin/users/${id}/status`, payload);
  },
  updateUserRole(id: string, payload: { role: string }) {
    return api.patch<{ user: AdminUser }>(`/admin/users/${id}/role`, payload);
  },
  listWorkspaces(params?: {
    search?: string;
    status?: string;
    owner_id?: string;
    include_deleted?: boolean;
    page?: number;
    page_size?: number;
  }) {
    return api.get<AdminListResponse<AdminWorkspace>>("/admin/workspaces", { params });
  },
  updateWorkspaceStatus(id: string, payload: { status: string; reason?: string }) {
    return api.patch<{ workspace: AdminWorkspace }>(
      `/admin/workspaces/${id}/status`,
      payload
    );
  },
  listApps(params?: {
    search?: string;
    status?: string;
    workspace_id?: string;
    owner_id?: string;
    page?: number;
    page_size?: number;
  }) {
    return api.get<AdminListResponse<AdminApp>>("/admin/apps", { params });
  },
  updateAppStatus(id: string, payload: { status: string; reason?: string }) {
    return api.patch<{ app: AdminApp }>(`/admin/apps/${id}/status`, payload);
  },
  listSupportTickets(params?: {
    search?: string;
    status?: string;
    priority?: string;
    category?: string;
    workspace_id?: string;
    app_id?: string;
    page?: number;
    page_size?: number;
  }) {
    return api.get<AdminListResponse<SupportTicket>>("/admin/support/tickets", { params });
  },
  updateSupportTicketStatus(id: string, payload: { status: string; note?: string }) {
    return api.patch<{ ticket: SupportTicket }>(
      `/admin/support/tickets/${id}/status`,
      payload
    );
  },
};
