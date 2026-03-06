import React from 'react';
import { Flame, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateStreak } from '../utils';

export const PersonalStats: React.FC = () => {
  const { user, data } = useApp();
  const sessions = data?.sessions || [];

  if (!user) return null;

  const userSessions = (sessions || []).filter(s => s.telegram_id === user.id);
  const streak = calculateStreak(sessions || [], user.id);
  const bestSeconds = Math.max(0, ...userSessions.map(s => Number(s.duration_seconds) || 0));
  
  return (
    <div className="space-y-6">
      <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Твои достижения</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-1">
          <div className="flex items-center gap-2 text-orange-500">
            <Flame size={18} fill="currentColor" />
            <span className="text-xs font-bold uppercase tracking-wider">Серия</span>
          </div>
          <div className="text-3xl font-bold">{streak} <span className="text-sm font-normal text-zinc-500">дн.</span></div>
        </div>
        
        <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-1">
          <div className="flex items-center gap-2 text-emerald-500">
            <Trophy size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Рекорд</span>
          </div>
          <div className="text-3xl font-bold">{Math.floor(bestSeconds / 60)} <span className="text-sm font-normal text-zinc-500">мин.</span></div>
        </div>
      </div>
    </div>
  );
};
