/**
 * Announcement types for Admin console.
 */

export interface Announcement {
  id: string;
  title: string;
  description: string;
  type: "feature" | "improvement" | "notice" | "warning" | string;
  priority: number;
  is_active: boolean;
  starts_at: string;
  ends_at?: string | null;
  created_at: string;
  updated_at: string;
  read_count?: number;
  total_users?: number;
  read_rate?: number;
}
