export interface User {
  id: string;
  username: string;
  first_name: string;
  photo: string;
  created_at: string;
}

export interface Session {
  id: string;
  telegram_id: string;
  name: string;
  duration_seconds: number;
  intention: string;
  mood: string;
  created_at: string;
}

export interface AppData {
  sessions: Session[];
  live_sessions?: any[];
}
