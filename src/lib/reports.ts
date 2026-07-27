import { api } from './api';
import type { Paginated } from './properties';

export const REPORT_CATEGORIES = [
  'Scam or Fraud',
  'Inappropriate Content',
  'Harassment',
  'Fake Listing',
  'Other',
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

// GET /tenant/reports returns the paginator's raw JSON — the controller
// never routes it through ReportResource — so `property`/`reported_user`
// are whatever columns Eloquent's default serialization includes, not the
// curated Resource shape. Typed loosely on purpose; only the fields this
// list actually renders are relied on.
export type Report = {
  report_id: number;
  reporter_id: number;
  property_id: number | null;
  reported_user_id: number | null;
  report_reason: string;
  report_status: 'Pending' | 'Resolved';
  created_at: string;
  property?: { property_id: number; title: string } | null;
  reported_user?: { user_id: number; first_name: string; last_name: string } | null;
};

export async function listMyReports(): Promise<Paginated<Report>> {
  const { data } = await api.get<Paginated<Report>>('/tenant/reports');
  return data;
}

export async function submitReport(payload: {
  target_type: 'property' | 'user';
  property_id?: number;
  reported_user_id?: number;
  category: ReportCategory;
  details?: string;
}): Promise<void> {
  await api.post('/reports', payload);
}
