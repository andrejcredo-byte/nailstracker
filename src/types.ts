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
  type: 'nails' | 'meditation';
}

export interface Challenge {
  id: string;
  creator_id: string;
  opponent_id: string | null;
  creator_name: string;
  opponent_name: string | null;
  creator_photo: string;
  opponent_photo: string | null;
  status: 'pending' | 'active' | 'completed';
  start_date: string;
  end_date: string;
  creator_total_seconds: number;
  opponent_total_seconds: number;
}

export interface LiveSession {
  id?: string;
  telegram_id: string;
  name: string;
  username?: string;
  photo_url?: string;
  intention: string;
  start_time: string;
  last_ping: string;
  type: 'nails' | 'meditation';
}

export interface AppData {
  sessions: Session[];
  live_sessions: LiveSession[];
  challenges: Challenge[];
  live_error?: string | null;
}
