import React from 'react';
import { useApp } from '../context/AppContext';

export const SocialFeed: React.FC = () => {
  const { data } = useApp();

  if (!data) return null;

  const today = new Date().toDateString();
  const todayPractices = (data?.sessions || [])
    .filter(s => {
      try {
        return s.date && new Date(s.date).toDateString() === today;
      } catch (e) {
        return false;
      }
    })
    .sort((a, b) => {
      try {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } catch (e) {
        return 0;
      }
    });

  if (todayPractices.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Сегодня практиковали</h3>
      <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar">
        {todayPractices.map((session) => {
          const user = (data?.users || []).find(u => u.telegram_id === session.telegram_id);
          return (
            <div 
              key={session.session_id} 
              className="flex-shrink-0 bg-zinc-900 p-4 rounded-3xl border border-zinc-800 flex items-center gap-3 min-w-[200px]"
            >
              <img 
                src={user?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}`} 
                alt={user?.name || 'User'} 
                className="w-10 h-10 rounded-full border border-zinc-700 object-cover" 
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <div className="font-bold text-sm truncate">{user?.name || 'Участник'}</div>
                <div className="text-emerald-500 text-xs font-bold">{Math.floor(session.duration_seconds / 60)} мин {session.mood}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
