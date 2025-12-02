export interface ReportReason {
  id: number;
  name: string;
  description: string;
}

export interface ContentReport {
  id: number;
  content_type: number;
  content_type_str: string;
  object_id: number;
  reason: ReportReason;
  description: string;
  reported_at: string;
  reported_content_str: string;
  reporter?: {
    id: number;
    username: string;
  };
  reviewed_at?: string;
  reviewed_by?: {
    id: number;
    username: string;
  };
  verdict: 'pending' | 'upheld_hidden' | 'upheld_warning' | 'upheld_banned' | 'rejected' | 'processing';
  verdict_note?: string;
  action_taken: boolean;
}

export interface ReportsResponse {
  results: ContentReport[];
  count: number;
  next?: string;
  previous?: string;
}

export const VERDICT_CHOICES = [
  { value: 'pending', label: 'Pending Review' },
  { value: 'upheld_hidden', label: 'Upheld - Content Hidden' },
  { value: 'upheld_warning', label: 'Upheld - Warning Issued' },
  { value: 'upheld_banned', label: 'Upheld - User Banned' },
  { value: 'rejected', label: 'Rejected - Content Follows Rules' },
  { value: 'processing', label: 'Processing...' },
] as const;