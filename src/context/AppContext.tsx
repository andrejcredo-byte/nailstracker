import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppData, User, Session } from '../types';
import { supabase } from '../supabaseClient';
import { Achievement } from '../constants/achievements';
import { checkNewAchievements } from '../utils/achievementLogic';

interface AppContextType {
  user: User | null;
  data: AppData;
  loading: boolean;
  error: string | null;
  isPracticing: boolean;
  newlyUnlocked: Achievement[];
  showAchievements: boolean;
  setShowAchievements: (show: boolean) => void;
  clearNewlyUnlocked: () => void;
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
  const [isPracticing, setIsPracticing] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);

  const clearNewlyUnlocked = () => setNewlyUnlocked([]);

  const refreshData = async () => {
    try {
      console.log('Fetching data from Supabase...');
      
      // 1. Cleanup stale live sessions (older than 1 minute of inactivity)
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
      
      // Delete sessions that haven't pinged in 1 minute
      await supabase
        .from("live_sessions")
        .delete()
        .lt('last_ping', oneMinuteAgo);

      // Fallback: delete sessions with null last_ping that started more than 5 mins ago
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      await supabase
        .from("live_sessions")
        .delete()
        .is('last_ping', null)
        .lt('start_time', fiveMinsAgo);

      // 2. Fetch completed sessions
      let { data: sessions, error: sessionsError } = await supabase
        .from("sessions")
        .select("*")
        .order("start_time", { ascending: false });

      if (sessionsError) {
        console.error('Supabase sessions fetch error:', sessionsError);
        // If start_time is missing, try fetching without order
        if (sessionsError.message.includes('start_time')) {
          const { data: retrySessions, error: retryError } = await supabase.from("sessions").select("*");
          if (!retryError && retrySessions) {
            sessions = retrySessions;
            sessionsError = null; // Clear error if retry worked
          }
        }
        
        if (sessionsError) {
          setError(`Ошибка загрузки сессий: ${sessionsError.message}`);
        }
      }

      // 3. Fetch live sessions
      const { data: liveSessions, error: liveError } = await supabase
        .from("live_sessions")
        .select("*");

      let liveErrorMsg: string | null = null;
      if (liveError) {
        console.error('Supabase live_sessions fetch error:', liveError);
        if (liveError.code === 'PGRST116' || liveError.message.includes('does not exist')) {
          liveErrorMsg = 'Таблица live_sessions не найдена.';
        } else {
          liveErrorMsg = `Ошибка Live: ${liveError.message}`;
        }
      }

      console.log(`Fetched ${sessions?.length || 0} sessions and ${liveSessions?.length || 0} live sessions`);
      if (liveSessions && liveSessions.length > 0) {
        console.log('Current live sessions:', liveSessions);
      }
      
      setData({
        sessions: sessions || [],
        live_sessions: liveSessions || [],
        live_error: liveErrorMsg
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
          is_mock: true,
        });
      }

      await refreshData();
      setLoading(false);
    };

    initApp();
    
    const interval = setInterval(refreshData, 15000); // More frequent updates for live sessions
    return () => clearInterval(interval);
  }, []);

  // Heartbeat effect
  useEffect(() => {
    if (!isPracticing || !user || user.is_mock) return;

    const sendPing = async () => {
      try {
        await supabase
          .from("live_sessions")
          .update({ last_ping: new Date().toISOString() })
          .eq('telegram_id', user.id);
      } catch (err) {
        console.error('Heartbeat failed:', err);
      }
    };

    const pingInterval = setInterval(sendPing, 20000); // Ping every 20 seconds
    return () => clearInterval(pingInterval);
  }, [isPracticing, user]);

  const startPractice = async (intention: string) => {
    if (!user || user.is_mock) {
      console.log('Practice started in preview mode (not saving)');
      setIsPracticing(true);
      return;
    }
    
    try {
      console.log('Starting live session...', { telegram_id: user.id, intention });
      
      // First, try to remove any stale session for this user
      await supabase.from("live_sessions").delete().eq('telegram_id', user.id);

      const { error: liveError } = await supabase
        .from("live_sessions")
        .insert({
          telegram_id: user.id,
          name: user.first_name,
          username: user.username || '',
          photo_url: user.photo || '',
          intention: intention,
          start_time: new Date().toISOString(),
          last_ping: new Date().toISOString()
        });

      if (liveError) {
        console.error('Supabase live_sessions start error:', liveError);
        setError(`Ошибка запуска Live: ${liveError.message} (Код: ${liveError.code})`);
      } else {
        console.log('Live session record created successfully');
        setIsPracticing(true);
        await refreshData();
      }
    } catch (err: any) {
      console.error('Critical failure in startPractice:', err);
      setError(`Критическая ошибка: ${err.message || 'Не удалось запустить сессию'}`);
    }
  };

  const endPractice = async (duration: number, intention: string, mood: string) => {
    setIsPracticing(false);
    if (!user || user.is_mock) {
      console.log('Practice ended in preview mode (not saving)');
      return;
    }
    
    try {
      console.log('Saving session to Supabase...', { telegram_id: user.id, duration });
      
      // 1. Insert into completed sessions
      const { error: insertError } = await supabase
        .from("sessions")
        .insert({
          telegram_id: user.id,
          name: user.first_name,
          username: user.username,
          photo_url: user.photo,
          duration_seconds: duration,
          intention,
          mood,
          start_time: new Date().toISOString()
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
      
      // Check for new achievements
      if (user && !user.is_mock) {
        const newSessions = [...data.sessions, { 
          telegram_id: user.id, 
          duration_seconds: duration, 
          start_time: new Date().toISOString() 
        } as any];
        const unlocked = checkNewAchievements(data.sessions, newSessions, user.id);
        if (unlocked.length > 0) {
          console.log('New achievements unlocked:', unlocked);
          setNewlyUnlocked(unlocked);
          
          // Haptic feedback via Telegram WebApp
          const tg = (window as any).Telegram?.WebApp;
          if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('heavy');
            setTimeout(() => {
              tg.HapticFeedback.notificationOccurred('success');
            }, 50);
          }
        }
      }

      await refreshData();
    } catch (err: any) {
      console.error('Failed to save session to Supabase:', err);
      setError(`Ошибка сохранения: ${err.message || 'Неизвестная ошибка'}`);
    }
  };

  return (
    <AppContext.Provider value={{ 
      user, data, loading, error, isPracticing, 
      newlyUnlocked, showAchievements, setShowAchievements, clearNewlyUnlocked,
      refreshData, startPractice, endPractice 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
