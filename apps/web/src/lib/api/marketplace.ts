/**
 * 应用市场 API 服务
 */

import { request } from "./shared";

export interface MarketplaceWorkspace {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

export interface MarketplaceApp {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string | null;
  pricing_type: string;
  price?: number | null;
  published_at?: string | null;
  access_mode: string;
  workspace: MarketplaceWorkspace;
  rating_avg: number;
  rating_count: number;
}

export interface MarketplaceAppListParams {
  search?: string;
  pricing?: "free" | "paid" | string;
  sort?: "popular" | "rating" | "newest" | string;
  page?: number;
  page_size?: number;
}

export interface MarketplaceAppListResponse {
  data: {
    apps: MarketplaceApp[];
  };
  meta?: {
    total?: number;
    page?: number;
    page_size?: number;
  };
}

export interface MarketplaceRatingUser {
  id: string;
  username?: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

export interface MarketplaceRating {
  id: string;
  app_id: string;
  user_id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  user?: MarketplaceRatingUser;
}

export interface MarketplaceRatingListResponse {
  data: {
    ratings: MarketplaceRating[];
  };
  meta?: {
    total?: number;
    page?: number;
    page_size?: number;
  };
}

export interface SubmitMarketplaceRatingResponse {
  data: {
    rating: MarketplaceRating;
  };
}

export const marketplaceApi = {
  async listApps(params: MarketplaceAppListParams = {}): Promise<MarketplaceAppListResponse> {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set("search", params.search);
    if (params.pricing) searchParams.set("pricing", params.pricing);
    if (params.sort) searchParams.set("sort", params.sort);
    if (params.page) searchParams.set("page", String(params.page));
    if (params.page_size) searchParams.set("page_size", String(params.page_size));
    const query = searchParams.toString();
    return request<MarketplaceAppListResponse>(`/marketplace/apps${query ? `?${query}` : ""}`);
  },

  async getApp(id: string): Promise<{ data: { app: MarketplaceApp } }> {
    return request<{ data: { app: MarketplaceApp } }>(`/marketplace/apps/${id}`);
  },

  async listRatings(appId: string, params?: { page?: number; page_size?: number; sort?: string }): Promise<MarketplaceRatingListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.page_size) searchParams.set("page_size", String(params.page_size));
    if (params?.sort) searchParams.set("sort", params.sort);
    const query = searchParams.toString();
    return request<MarketplaceRatingListResponse>(
      `/marketplace/apps/${appId}/ratings${query ? `?${query}` : ""}`
    );
  },

  async submitRating(appId: string, payload: { rating: number; comment?: string | null }): Promise<SubmitMarketplaceRatingResponse> {
    return request<SubmitMarketplaceRatingResponse>(`/marketplace/apps/${appId}/ratings`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
