/**
 * Billing API Service
 */

import { request } from "./shared";

export interface BudgetSettings {
 monthly_budget: number;
 currency: string;
 thresholds: number[];
 spend_limit: number;
 spend_limit_enabled: boolean;
}

interface ApiResponse<T> {
 code: string;
 message: string;
 data: T;
}

export interface BudgetSettingsUpdate {
 monthly_budget?: number;
 currency?: string;
 thresholds?: number[];
 spend_limit?: number;
 spend_limit_enabled?: boolean;
}

export interface InvoiceLineItem {
 label: string;
 quantity?: number;
 unit_price?: number;
 total: number;
}

export interface InvoiceSummary {
 id: string;
 invoice_no: string;
 period_start: string;
 period_end: string;
 description: string;
 subtotal: number;
 discount_amount: number;
 tax_amount: number;
 total_amount: number;
 tax_rate: number;
 discount_rate: number;
 amount: number;
 currency: string;
 status: "paid" | "pending" | "failed" | "refunded";
 issued_at: string;
 paid_at?: string;
 payment_channel?: string;
 transaction_id?: string;
 payment_updated_at?: string;
 download_url: string;
}

export interface InvoiceDetail extends InvoiceSummary {
 line_items: InvoiceLineItem[];
}

export interface BillingInvoiceSummary {
 id: string;
 date: string;
 period: string;
 description: string;
 subtotal: number;
 discountAmount: number;
 taxAmount: number;
 totalAmount: number;
 taxRate: number;
 discountRate: number;
 amount: number;
 status: "paid" | "pending" | "failed" | "refunded";
 invoice: string;
 currency: string;
 paidAt?: string;
 paymentChannel?: string;
 transactionId?: string;
 invoiceUrl: string;
}

export interface BillingInvoiceDetail extends BillingInvoiceSummary {
 lineItems: Array<{
 label: string;
 quantity?: number;
 unitPrice?: number;
 total: number;
 }>;
}

// Workspace Usage Statistics
export interface WorkspaceUsageStat {
 id: string;
 workspace_id: string;
 workspace_name: string;
 workspace_icon?: string;
 period_start: string;
 period_end: string;
 usage: {
 requests?: number;
 tokens?: number;
 storage?: number;
 bandwidth?: number;
 };
 cost_amount: number;
 currency: string;
  // Trend Related
  trend_percent?: number; // compare percentage, currently as growth or decline
  trend_direction?: "up" | "down" | "flat";
}

export const billingApi = {
 async getBudgetSettings(workspaceId: string): Promise<BudgetSettings> {
 const response = await request<ApiResponse<{ budget: BudgetSettings }>>(
 `/billing/workspaces/${workspaceId}/budget`
 );
 return response.data.budget;
 },

 async updateBudgetSettings(workspaceId: string, payload: BudgetSettingsUpdate): Promise<BudgetSettings> {
 const response = await request<ApiResponse<{ budget: BudgetSettings }>>(
 `/billing/workspaces/${workspaceId}/budget`,
 {
 method: "PATCH",
 body: JSON.stringify(payload),
 }
 );
 return response.data.budget;
 },

 async listInvoices(
 workspaceId: string,
 params?: { limit?: number }
 ): Promise<BillingInvoiceSummary[]> {
 const search = new URLSearchParams();
 if (params?.limit) search.set("limit", String(params.limit));
 const query = search.toString();
 const response = await request<ApiResponse<{ invoices: InvoiceSummary[] }>>(
 `/billing/workspaces/${workspaceId}/invoices${query ? `?${query}` : ""}`
 );
 const invoices = response.data?.invoices || [];
 return invoices.map((invoice) => ({
 id: invoice.id,
 date: invoice.issued_at || invoice.period_end,
 period: `${invoice.period_start} ~ ${invoice.period_end}`,
 description: invoice.description,
 subtotal: invoice.subtotal,
 discountAmount: invoice.discount_amount,
 taxAmount: invoice.tax_amount,
 totalAmount: invoice.total_amount,
 taxRate: invoice.tax_rate,
 discountRate: invoice.discount_rate,
 amount: invoice.amount,
 status: invoice.status,
 invoice: invoice.invoice_no,
 currency: invoice.currency,
 paidAt: invoice.paid_at,
 paymentChannel: invoice.payment_channel,
 transactionId: invoice.transaction_id,
 invoiceUrl: invoice.download_url,
 }));
 },

 async getInvoiceDetail(
 workspaceId: string,
 invoiceId: string
 ): Promise<BillingInvoiceDetail> {
 const response = await request<ApiResponse<{ invoice: InvoiceDetail }>>(
 `/billing/workspaces/${workspaceId}/invoices/${invoiceId}`
 );
 const invoice = response.data.invoice;
 return {
 id: invoice.id,
 date: invoice.issued_at || invoice.period_end,
 period: `${invoice.period_start} ~ ${invoice.period_end}`,
 description: invoice.description,
 subtotal: invoice.subtotal,
 discountAmount: invoice.discount_amount,
 taxAmount: invoice.tax_amount,
 totalAmount: invoice.total_amount,
 taxRate: invoice.tax_rate,
 discountRate: invoice.discount_rate,
 amount: invoice.amount,
 status: invoice.status,
 invoice: invoice.invoice_no,
 currency: invoice.currency,
 paidAt: invoice.paid_at,
 paymentChannel: invoice.payment_channel,
 transactionId: invoice.transaction_id,
 invoiceUrl: invoice.download_url,
 lineItems: (invoice.line_items || []).map((item) => ({
 label: item.label,
 quantity: item.quantity,
 unitPrice: item.unit_price,
 total: item.total,
 })),
 };
 },

 async downloadInvoice(
 workspaceId: string,
 invoiceId: string,
 format: "pdf" | "csv" = "pdf"
 ): Promise<Blob> {
 const { getStoredTokens, API_BASE_URL } = await import("./shared");
 const tokens = getStoredTokens();
 const response = await fetch(
 `${API_BASE_URL}/billing/workspaces/${workspaceId}/invoices/${invoiceId}/download?format=${format}`,
 {
 headers: {
 ...(tokens?.accessToken && {
 Authorization: `Bearer ${tokens.accessToken}`,
 }),
 },
 }
 );
 if (!response.ok) {
 throw new Error(`Failed to download invoice: ${response.statusText}`);
 }
 return response.blob();
 },

  /**
   * Fetch Workspace Usage Statistics
   */
 async getWorkspaceUsageStats(
 workspaceId: string,
 params?: { period_start?: string; period_end?: string }
 ): Promise<WorkspaceUsageStat[]> {
 const search = new URLSearchParams();
 if (params?.period_start) search.set("period_start", params.period_start);
 if (params?.period_end) search.set("period_end", params.period_end);
 const query = search.toString();
 const response = await request<
 ApiResponse<{
 period_start: string;
 period_end: string;
 stats: Array<{
 id: string;
 workspace_id: string;
 period_start: string;
 period_end: string;
 usage: Record<string, number>;
 cost_amount: number;
 currency: string;
 workspace?: {
 id: string;
 name: string;
 icon?: string;
 };
 }>;
 }>
 >(`/billing/workspaces/${workspaceId}/usage${query ? `?${query}` : ""}`);
 const stats = response.data?.stats || [];
    // Calculate Trend (this is already implemented in the backend or frontend mock)
    return stats.map((stat, index, arr) => {
      // Simple Mock Trend Calculate
 const prevStat = arr[index + 1];
 let trendPercent = 0;
 let trendDirection: "up" | "down" | "flat" = "flat";
 if (prevStat && prevStat.cost_amount > 0) {
 trendPercent = ((stat.cost_amount - prevStat.cost_amount) / prevStat.cost_amount) * 100;
 trendDirection = trendPercent > 0 ? "up" : trendPercent < 0 ? "down" : "flat";
 }
 return {
 id: stat.id,
 workspace_id: stat.workspace_id,
 workspace_name: stat.workspace?.name || "Unknown Workspace",
 workspace_icon: stat.workspace?.icon,
 period_start: stat.period_start,
 period_end: stat.period_end,
 usage: {
 requests: stat.usage?.requests,
 tokens: stat.usage?.tokens,
 storage: stat.usage?.storage,
 bandwidth: stat.usage?.bandwidth,
 },
 cost_amount: stat.cost_amount,
 currency: stat.currency,
 trend_percent: Math.round(Math.abs(trendPercent) * 10) / 10,
 trend_direction: trendDirection,
 };
 });
 },
};
