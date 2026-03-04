import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppData, User, Session, LiveSession } from '../types';
import { googleSheetsService } from '../services/googleSheetsService';

interface AppContextType {
  user: User | null;
  data: AppData;
  loading: boolean;
  refreshData: () => Promise<void>;
  startPractice: (intention: string) => Promise<void>;
  endPractice: (duration: number, intention: string, mood: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData>({ users: [], sessions: [], live_sessions: [] });
  const [loading, setLoading] = useState(true);
  const [pendingSessions, setPendingSessions] = useState<Session[]>([]);

  const refreshData = async () => {
    try {
      const newData = await googleSheetsService.fetchData();
      
      // Защита от некорректных данных с сервера
      const safeNewData = {
        users: Array.isArray(newData?.users) ? newData.users : [],
        sessions: Array.isArray(newData?.sessions) ? newData.sessions : [],
        live_sessions: Array.isArray(newData?.live_sessions) ? newData.live_sessions : []
      };

      // Фильтруем pendingSessions: оставляем только те, которых еще нет в newData.sessions
      setPendingSessions(prev => {
        const newPending = prev.filter(ps => 
          !safeNewData.sessions.some(s => 
            s.telegram_id === ps.telegram_id && 
            Math.abs(new Date(s.date).getTime() - new Date(ps.date).getTime()) < 5000 // Погрешность 5 сек
          )
        );
        
        // Обновляем данные, объединяя серверные и оставшиеся локальные (pending)
        setData({
          ...safeNewData,
          sessions: [...newPending, ...safeNewData.sessions]
        });
        
        return newPending;
      });
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      // Принудительный тайм-аут загрузки (7 секунд)
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.warn('Loading timeout reached, forcing app to show');
          setLoading(false);
        }
      }, 7000);

      try {
        const tg = (window as any).Telegram?.WebApp;
        
        if (tg) {
          tg.ready();
          tg.expand();
          
          const tgUser = tg.initDataUnsafe?.user;
          
          if (tgUser) {
            const newUser: User = {
              telegram_id: String(tgUser.id),
              username: tgUser.username || '',
              name: tgUser.first_name || 'User',
              photo: tgUser.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(tgUser.first_name || 'U')}&background=random`,
              created_at: new Date().toISOString(),
            };
            setUser(newUser);
            googleSheetsService.upsertUser(newUser).catch(console.error);
          } else {
            setUser({
              telegram_id: 'unknown',
              username: 'guest',
              name: 'Гость',
              photo: `https://ui-avatars.com/api/?name=Guest&background=random`,
              created_at: new Date().toISOString(),
            });
          }
        } else {
          console.log('Running outside of Telegram. Using mock user.');
          const mockUser: User = {
            telegram_id: '123456789',
            username: 'dev_sadhu',
            name: 'Разработчик',
            photo: 'https://picsum.photos/seed/dev/100',
            created_at: new Date().toISOString(),
          };
          setUser(mockUser);
        }

        await refreshData();
      } catch (error) {
        console.error('Critical init error:', error);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    initApp();
    
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  const startPractice = async (intention: string) => {
    if (!user) return;
    
    // Оптимистично добавляем в live_sessions
    const optimisticLive: LiveSession = {
      telegram_id: user.telegram_id,
      start_time: new Date().toISOString(),
      intention: intention
    };

    setData(prev => ({
      ...prev,
      live_sessions: [optimisticLive, ...prev.live_sessions.filter(s => s.telegram_id !== user.telegram_id)]
    }));

    try {
      await googleSheetsService.startSession(user.telegram_id, intention);
      await refreshData();
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const endPractice = async (duration: number, intention: string, mood: string) => {
    if (!user) return;
    
    const optimisticSession: Session = {
      session_id: 'temp-' + Date.now(),
      telegram_id: user.telegram_id,
      duration_seconds: duration,
      date: new Date().toISOString(),
      intention: intention,
      mood: mood
    };

    // Добавляем в список ожидающих подтверждения
    setPendingSessions(prev => [optimisticSession, ...prev]);
    
    // Обновляем текущий UI
    setData(prev => ({
      ...prev,
      sessions: [optimisticSession, ...prev.sessions],
      live_sessions: prev.live_sessions.filter(s => s.telegram_id !== user.telegram_id)
    }));

    try {
      await googleSheetsService.endSession(user.telegram_id, duration, intention, mood);
      await refreshData();
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  return (
    <AppContext.Provider value={{ user, data, loading, refreshData, startPractice, endPractice }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
