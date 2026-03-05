import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppData, User, Session } from '../types';
import { supabase } from '../supabaseClient';

interface AppContextType {
  user: User | null;
  data: AppData;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  startPractice: (intention: string) => Promise<void>;
  endPractice: (duration: number, intention: string, mood: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData>({ sessions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      console.log('Fetching data from Supabase...');
      
      // Fetch completed sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from("sessions")
        .select("*")
        .order("created_at", { ascending: false });

      if (sessionsError) {
        console.error('Supabase sessions fetch error:', sessionsError);
        setError(`Ошибка загрузки сессий: ${sessionsError.message}`);
      }

      // Fetch live sessions
      const { data: liveSessions, error: liveError } = await supabase
        .from("live_sessions")
        .select("*");

      if (liveError) {
        console.warn('Supabase live_sessions fetch error (table might not exist):', liveError);
        // We don't set a hard error here in case the table doesn't exist yet
      }

      console.log(`Fetched ${sessions?.length || 0} sessions and ${liveSessions?.length || 0} live sessions`);
      
      setData({
        sessions: sessions || [],
        live_sessions: liveSessions || []
      });
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch data from Supabase:', err);
      setError(`Ошибка сети: ${err.message || 'Неизвестная ошибка'}`);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      console.log('Initializing App...');
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('Supabase environment variables are missing!');
        setError('Конфигурация Supabase отсутствует. Проверьте переменные окружения.');
      }

      const tg = (window as any).Telegram?.WebApp;
      
      if (tg && tg.initDataUnsafe?.user) {
        tg.ready();
        tg.expand();
        
        const tgUser = tg.initDataUnsafe.user;
        setUser({
          id: String(tgUser.id),
          username: tgUser.username || '',
          first_name: tgUser.first_name || 'User',
          photo: tgUser.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tgUser.first_name || 'U')}&background=random`,
          created_at: new Date().toISOString(),
        });
      } else {
        // Mock user for development
        setUser({
          id: '123456789',
          username: 'dev_sadhu',
          first_name: 'Разработчик',
          photo: 'https://picsum.photos/seed/dev/100',
          created_at: new Date().toISOString(),
        });
      }

      await refreshData();
      setLoading(false);
    };

    initApp();
    
    const interval = setInterval(refreshData, 15000); // More frequent updates for live sessions
    return () => clearInterval(interval);
  }, []);

  const startPractice = async (intention: string) => {
    if (!user) return;
    
    try {
      console.log('Starting live session in Supabase...', { telegram_id: user.id, intention });
      const { error: liveError } = await supabase
        .from("live_sessions")
        .upsert({
          telegram_id: user.id,
          name: user.first_name,
          photo_url: user.photo,
          intention: intention,
          start_time: new Date().toISOString()
        });

      if (liveError) {
        console.error('Supabase live_sessions start error:', liveError);
        // Don't show error to user, just log it
      }
      
      await refreshData();
    } catch (err) {
      console.error('Failed to start live session:', err);
    }
  };

  const endPractice = async (duration: number, intention: string, mood: string) => {
    if (!user) return;
    
    try {
      console.log('Saving session to Supabase...', { telegram_id: user.id, duration });
      
      // 1. Insert into completed sessions
      const { error: insertError } = await supabase
        .from("sessions")
        .insert({
          telegram_id: user.id,
          name: user.first_name,
          photo_url: user.photo,
          duration_seconds: duration,
          intention,
          mood
        });

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        setError(`Ошибка сохранения: ${insertError.message}`);
        return;
      }

      // 2. Remove from live sessions
      const { error: deleteError } = await supabase
        .from("live_sessions")
        .delete()
        .eq('telegram_id', user.id);

      if (deleteError) {
        console.warn('Supabase live_sessions delete error:', deleteError);
      }

      console.log('Session saved and live session removed');
      await refreshData();
    } catch (err: any) {
      console.error('Failed to save session to Supabase:', err);
      setError(`Ошибка сохранения: ${err.message || 'Неизвестная ошибка'}`);
    }
  };

  return (
    <AppContext.Provider value={{ user, data, loading, error, refreshData, startPractice, endPractice }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
