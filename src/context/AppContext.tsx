import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppData, User } from '../types';
import { googleSheetsService } from '../services/googleSheetsService';

interface AppContextType {
  user: User | null;
  data: AppData | null;
  loading: boolean;
  refreshData: () => Promise<void>;
  startPractice: (intention: string) => Promise<void>;
  endPractice: (duration: number, intention: string, mood: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    try {
      const newData = await googleSheetsService.fetchData();
      setData(newData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        // Telegram WebApp initialization
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
            
            // Register/Update user in Google Sheets (don't let it block init)
            googleSheetsService.upsertUser(newUser).catch(e => 
              console.error('Background user upsert failed:', e)
            );
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
        setLoading(false);
      }
    };

    initApp();
    
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  const startPractice = async (intention: string) => {
    if (!user) return;
    await googleSheetsService.startSession(user.telegram_id, intention);
    await refreshData();
  };

  const endPractice = async (duration: number, intention: string, mood: string) => {
    if (!user) return;
    await googleSheetsService.endSession(user.telegram_id, duration, intention, mood);
    await refreshData();
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
