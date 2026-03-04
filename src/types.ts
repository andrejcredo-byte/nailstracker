export interface User {
  telegram_id: string;
  username: string;
  name: string;
  photo: string;
  created_at: string;
}

export interface Session {
  session_id: string;
  telegram_id: string;
  date: string;
  duration_seconds: number;
  intention: string;
  mood: string;
}

export interface LiveSession {
  telegram_id: string;
  start_time: string;
  intention: string;
}

export interface AppData {
  users: User[];
  sessions: Session[];
  live_sessions: LiveSession[];
}
