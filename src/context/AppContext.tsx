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
  setBackButton: (visible: boolean, onClick?: () => void) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData>({ sessions: [], challenges: [], live_sessions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPracticing, setIsPracticing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
  const [newPersonalBest, setNewPersonalBest] = useState<number | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [practiceMode, setPracticeMode] = useState<'nails' | 'meditation'>('nails');

  const clearNewlyUnlocked = () => setNewlyUnlocked([]);
  const clearNewPersonalBest = () => setNewPersonalBest(null);

  const refreshData = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      setError('Конфигурация Supabase не настроена. Пожалуйста, добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в настройки (Settings -> Secrets).');
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch data with individual error handling to be more resilient
      const sessionsPromise = supabase.from("sessions").select("*").order("start_time", { ascending: false });
      const liveSessionsPromise = supabase.from("live_sessions").select("*");
      const challengesPromise = supabase.from("challenges").select("*");

      const [sessionsRes, liveSessionsRes, challengesRes] = await Promise.allSettled([
        sessionsPromise,
        liveSessionsPromise,
        challengesPromise
      ]);

      let sessions = sessionsRes.status === 'fulfilled' ? sessionsRes.value.data : [];
      let sessionsError = sessionsRes.status === 'fulfilled' ? sessionsRes.value.error : null;
      
      if (sessionsError) {
        console.error("Sessions error:", sessionsError);
        // Retry without order if it fails (sometimes happens with missing indexes)
        if (sessionsError.message.includes('start_time')) {
          const { data: retrySessions } = await supabase.from("sessions").select("*");
          if (retrySessions) sessions = retrySessions;
        }
      }

      const liveSessions = liveSessionsRes.status === 'fulfilled' ? liveSessionsRes.value.data : [];
      const liveError = liveSessionsRes.status === 'fulfilled' ? liveSessionsRes.value.error : null;
      const challenges = challengesRes.status === 'fulfilled' ? challengesRes.value.data : [];

      let liveErrorMsg: string | null = null;
      if (liveError) {
        if (liveError.code === 'PGRST116' || liveError.message.includes('does not exist')) {
          liveErrorMsg = 'Таблица live_sessions не найдена.';
        } else if (liveError.message.includes('NetworkError') || liveError.message.includes('fetch') || liveError.message.includes('Load failed')) {
          liveErrorMsg = 'Ошибка сети. Проверьте VPN или подключение.';
        } else {
          liveErrorMsg = `Ошибка Live: ${liveError.message}`;
        }
      }

      setData({
        sessions: sessions || [],
        live_sessions: liveSessions || [],
        challenges: challenges || [],
        live_error: liveErrorMsg
      });
      setError(null);
    } catch (err: any) {
      console.error("Refresh data error:", err);
      if (err.message?.includes('NetworkError') || err.message?.includes('fetch') || err.message?.includes('Load failed')) {
        setError('Ошибка сети. Проверьте VPN или подключение к Supabase.');
      } else {
        setError(`Ошибка загрузки данных: ${err.message || 'Неизвестная ошибка'}`);
      }
    }
  };

  useEffect(() => {
    const initApp = async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        setError('Конфигурация Supabase отсутствует. Проверьте переменные окружения.');
      }

      const tg = (window as any).Telegram?.WebApp;
      
      if (tg && tg.initDataUnsafe?.user) {
        tg.ready();
        tg.expand();
        
        // Handle theme changes
        const handleThemeChange = () => {
          const colorScheme = tg.colorScheme;
          document.documentElement.classList.toggle('dark', colorScheme === 'dark');
        };
        tg.onEvent('themeChanged', handleThemeChange);
        handleThemeChange();

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

      // 2. Subscribe to real-time updates for live sessions
      const channel = supabase
        .channel('live_sessions_changes')
        .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'live_sessions' }, () => {
          refreshData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    initApp();
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
        // Silent fail
      }
    };

    const pingInterval = setInterval(sendPing, 20000); // Ping every 20 seconds
    return () => clearInterval(pingInterval);
  }, [isPracticing, user]);

  const startPractice = async (intention: string) => {
    if (isProcessing) return;
    if (!user || user.is_mock) {
      setIsPracticing(true);
      return;
    }
    
    setIsProcessing(true);
    try {
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
        if (liveError.message.includes('NetworkError') || liveError.message.includes('fetch') || liveError.message.includes('Load failed')) {
          setError('Ошибка сети при запуске. Проверьте VPN (Supabase может быть заблокирован).');
        } else {
          setError(`Ошибка запуска Live: ${liveError.message}`);
        }
      } else {
        setIsPracticing(true);
        refreshData(); // Don't await to speed up UI
      }
    } catch (err: any) {
      console.error("Start practice error:", err);
      setError(`Ошибка: ${err.message || 'Не удалось запустить сессию'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const endPractice = async (duration: number, intention: string, mood: string) => {
    if (isProcessing) return;
    setIsPracticing(false);
    if (!user || user.is_mock) {
      return;
    }
    
    setIsProcessing(true);
    try {
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
        console.error("End practice insert error:", insertError);
        if (insertError.message.includes('NetworkError') || insertError.message.includes('fetch') || insertError.message.includes('Load failed')) {
          setError('Ошибка сети при сохранении. Проверьте VPN.');
        } else {
          setError(`Ошибка сохранения: ${insertError.message}`);
        }
        setIsProcessing(false);
        return;
      }

      // 2. Remove from live sessions
      await supabase
        .from("live_sessions")
        .delete()
        .eq('telegram_id', user.id);

      // 3. Update active challenges (ONLY for nails)
      if (practiceMode === 'nails') {
        const activeChallenges = (data.challenges || []).filter(c => 
          c.status === 'active' && (c.creator_id === user.id || c.opponent_id === user.id)
        );

        for (const challenge of activeChallenges) {
          const isCreator = challenge.creator_id === user.id;
          
          // Use RPC or a more robust update if possible, but for now we'll fetch fresh data
          // to avoid overwriting opponent's progress
          const { data: freshChallenge } = await supabase
            .from("challenges")
            .select("*")
            .eq('id', challenge.id)
            .single();

          if (freshChallenge) {
            const updateData = isCreator 
              ? { creator_total_seconds: (freshChallenge.creator_total_seconds || 0) + duration }
              : { opponent_total_seconds: (freshChallenge.opponent_total_seconds || 0) + duration };
            
            await supabase.from("challenges").update(updateData).eq('id', challenge.id);
          }
        }
      }

      // Check for new achievements
      const newSessions = [...data.sessions, { 
        telegram_id: user.id, 
        duration_seconds: duration, 
        start_time: new Date().toISOString() 
      } as any];
      const unlocked = checkNewAchievements(data.sessions, newSessions, user.id);
      if (unlocked.length > 0) {
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
          // Silent fail
        }
      }

      await refreshData();
    } catch (err: any) {
      setError(`Ошибка сохранения: ${err.message || 'Неизвестная ошибка'}`);
    } finally {
      setIsProcessing(false);
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

  const setBackButton = (visible: boolean, onClick?: () => void) => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.BackButton) return;

    if (visible) {
      tg.BackButton.show();
      if (onClick) {
        tg.BackButton.offClick();
        tg.BackButton.onClick(onClick);
      }
    } else {
      tg.BackButton.hide();
      tg.BackButton.offClick();
    }
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
      refreshData, startPractice, endPractice, createChallenge, acceptChallenge, leaveChallenge, setBackButton
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
