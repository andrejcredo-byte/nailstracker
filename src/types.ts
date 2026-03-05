export interface User {
  id: string;
  username: string;
  first_name: string;
  photo: string;
  created_at: string;
  is_mock?: boolean;
}

export interface Session {
  id: string;
  telegram_id: string;
  name: string;
  username?: string;
  photo_url?: string;
  duration_seconds: number;
  intention: string;
  mood: string;
  start_time: string;
}

export interface AppData {
  sessions: Session[];
  live_sessions?: any[];
  live_error?: string | null;
}
