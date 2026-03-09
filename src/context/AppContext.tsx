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
  newPersonalBest: number | null;
  showAchievements: boolean;
  practiceMode: 'nails' | 'meditation';
  setPracticeMode: (mode: 'nails' | 'meditation') => void;
  setShowAchievements: (show: boolean) => void;
  clearNewlyUnlocked: () => void;
  clearNewPersonalBest: () => void;
  refreshData: () => Promise<void>;
  startPractice: (intention: string) => Promise<void>;
  endPractice: (duration: number, intention: string, mood: string) => Promise<void>;
  createChallenge: () => Promise<string>;
  acceptChallenge: (challengeId: string) => Promise<void>;
  leaveChallenge: (challengeId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData>({ sessions: [], challenges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPracticing, setIsPracticing] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
  const [newPersonalBest, setNewPersonalBest] = useState<number | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [practiceMode, setPracticeMode] = useState<'nails' | 'meditation'>('nails');

  const clearNewlyUnlocked = () => setNewlyUnlocked([]);
  const clearNewPersonalBest = () => setNewPersonalBest(null);

  const refreshData = async () => {
    try {
      console.log('Fetching data from Supabase...');
      
      // 1. Cleanup stale live sessions in BACKGROUND (don't await)
      const cleanupStale = async () => {
        try {
          const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
          await supabase.from("live_sessions").delete().lt('last_ping', oneMinuteAgo);
          
          const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
          await supabase.from("live_sessions").delete().is('last_ping', null).lt('start_time', fiveMinsAgo);
        } catch (e) {
          console.warn('Background cleanup failed:', e);
        }
      };
      cleanupStale();

      // 2. Fetch data in PARALLEL
      const [sessionsRes, liveSessionsRes, challengesRes] = await Promise.all([
        supabase.from("sessions").select("*").order("start_time", { ascending: false }),
        supabase.from("live_sessions").select("*"),
        supabase.from("challenges").select("*")
      ]);

      let sessions = sessionsRes.data;
      let sessionsError = sessionsRes.error;
      
      if (sessionsError) {
        console.error('Supabase sessions fetch error:', sessionsError);
        if (sessionsError.message.includes('start_time')) {
          const { data: retrySessions, error: retryError } = await supabase.from("sessions").select("*");
          if (!retryError && retrySessions) {
            sessions = retrySessions;
            sessionsError = null;
          }
        }
      }

      const liveSessions = liveSessionsRes.data;
      const liveError = liveSessionsRes.error;
      const challenges = challengesRes.data || [];

      let liveErrorMsg: string | null = null;
      if (liveError) {
        console.error('Supabase live_sessions fetch error:', liveError);
        if (liveError.code === 'PGRST116' || liveError.message.includes('does not exist')) {
          liveErrorMsg = 'Таблица live_sessions не найдена.';
        } else {
          liveErrorMsg = `Ошибка Live: ${liveError.message}`;
        }
      }

      console.log(`Fetched ${sessions?.length || 0} sessions, ${liveSessions?.length || 0} live sessions, ${challenges.length} challenges`);
      
      setData({
        sessions: sessions || [],
        live_sessions: liveSessions || [],
        challenges: challenges,
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
          last_ping: new Date().toISOString(),
          type: practiceMode
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
      
      // Check for personal best BEFORE saving
      const userSessions = data.sessions.filter(s => s.telegram_id === user.id);
      const previousBest = userSessions.length > 0 
        ? Math.max(...userSessions.map(s => s.duration_seconds)) 
        : 0;

      if (duration > previousBest && previousBest > 0) {
        setNewPersonalBest(duration);
      }

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
          start_time: new Date().toISOString(),
          type: practiceMode
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

      // 3. Update active challenges (ONLY for nails)
      if (practiceMode === 'nails') {
        const activeChallenges = (data.challenges || []).filter(c => 
          c.status === 'active' && (c.creator_id === user.id || c.opponent_id === user.id)
        );

        for (const challenge of activeChallenges) {
          const isCreator = challenge.creator_id === user.id;
          const updateData = isCreator 
            ? { creator_total_seconds: challenge.creator_total_seconds + duration }
            : { opponent_total_seconds: challenge.opponent_total_seconds + duration };
          
          await supabase.from("challenges").update(updateData).eq('id', challenge.id);
        }
      }

      console.log('Session saved and live session removed');
      
      // Check for new achievements
      const newSessions = [...data.sessions, { 
        telegram_id: user.id, 
        duration_seconds: duration, 
        start_time: new Date().toISOString() 
      } as any];
      const unlocked = checkNewAchievements(data.sessions, newSessions, user.id);
      if (unlocked.length > 0) {
        console.log('New achievements unlocked:', unlocked);
        setNewlyUnlocked(unlocked);
        
        // Haptic feedback via Telegram WebApp for iPhone
        try {
          const tg = (window as any).Telegram?.WebApp;
          if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('heavy');
            setTimeout(() => {
              tg.HapticFeedback.notificationOccurred('success');
            }, 100);
          }
        } catch (e) {
          console.error('Haptic error:', e);
        }
      }

      await refreshData();
    } catch (err: any) {
      console.error('Failed to save session to Supabase:', err);
      setError(`Ошибка сохранения: ${err.message || 'Неизвестная ошибка'}`);
    }
  };

  const createChallenge = async () => {
    if (!user) return '';
    // More robust unique ID: timestamp + random string
    const challengeId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const { error: challengeError } = await supabase
      .from("challenges")
      .insert({
        id: challengeId,
        creator_id: user.id,
        creator_name: user.first_name,
        creator_photo: user.photo,
        opponent_id: null,
        opponent_name: null,
        opponent_photo: null,
        status: 'pending',
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        creator_total_seconds: 0,
        opponent_total_seconds: 0
      });

    if (challengeError) throw challengeError;
    return challengeId;
  };

  const acceptChallenge = async (challengeId: string) => {
    if (!user) return;
    
    // 1. Fetch challenge to check if it's yours
    const { data: challenge, error: fetchError } = await supabase
      .from("challenges")
      .select("*")
      .eq('id', challengeId)
      .single();

    if (fetchError || !challenge) throw new Error('Челлендж не найден');
    
    // If user is already the opponent, just refresh and return
    if (challenge.opponent_id === user.id) {
      await refreshData();
      return;
    }

    if (challenge.creator_id === user.id) {
      console.log('Cannot accept your own challenge');
      return;
    }
    
    if (challenge.status !== 'pending') {
      // If it's already active but not with us, we can't join
      throw new Error('Этот вызов уже принят кем-то другим');
    }

    const { error: challengeError } = await supabase
      .from("challenges")
      .update({
        opponent_id: user.id,
        opponent_name: user.first_name,
        opponent_photo: user.photo,
        status: 'active'
      })
      .eq('id', challengeId);

    if (challengeError) throw challengeError;
    await refreshData();
  };

  const leaveChallenge = async (challengeId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from("challenges")
      .update({ status: 'completed' })
      .eq('id', challengeId);

    if (error) throw error;
    await refreshData();
  };

  // Add a helper to check for expired challenges
  useEffect(() => {
    if (data.challenges && data.challenges.length > 0) {
      const checkExpirations = async () => {
        const now = new Date();
        const expired = data.challenges!.filter(c => 
          c.status === 'active' && new Date(c.end_date) < now
        );

        for (const challenge of expired) {
          await supabase
            .from("challenges")
            .update({ status: 'completed' })
            .eq('id', challenge.id);
        }
        
        if (expired.length > 0) {
          await refreshData();
        }
      };
      checkExpirations();
    }
  }, [data.challenges]);

  return (
    <AppContext.Provider value={{ 
      user, data, loading, error, isPracticing, 
      newlyUnlocked, newPersonalBest, showAchievements, practiceMode, setPracticeMode, setShowAchievements, clearNewlyUnlocked, clearNewPersonalBest,
      refreshData, startPractice, endPractice, createChallenge, acceptChallenge, leaveChallenge
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
