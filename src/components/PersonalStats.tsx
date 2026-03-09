import React from 'react';
import { Flame, Trophy, Wind, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateStreak, formatDuration } from '../utils';

export const PersonalStats: React.FC = () => {
  const { user, data } = useApp();
  const sessions = data?.sessions || [];

  if (!user) return null;

  const userSessions = (sessions || []).filter(s => s.telegram_id === user.id);
  const nailsSessions = userSessions.filter(s => s.type === 'nails');
  const meditationSessions = userSessions.filter(s => s.type === 'meditation');
  
  const streak = calculateStreak(sessions || [], user.id);
  const bestNailsSeconds = Math.max(0, ...nailsSessions.map(s => Number(s.duration_seconds) || 0));
  const totalMeditationSeconds = meditationSessions.reduce((acc, s) => acc + (Number(s.duration_seconds) || 0), 0);
  
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
            <Zap size={18} fill="currentColor" />
            <span className="text-xs font-bold uppercase tracking-wider">Рекорд</span>
          </div>
          <div className="text-3xl font-bold">{Math.floor(bestNailsSeconds / 60)} <span className="text-sm font-normal text-zinc-500">мин.</span></div>
        </div>

        <div className="col-span-2 bg-zinc-900 p-5 rounded-3xl border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center">
              <Wind size={20} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Медитация</div>
              <div className="text-lg font-bold text-indigo-100">{formatDuration(totalMeditationSeconds)}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Сессий</div>
            <div className="text-lg font-bold text-indigo-100">{meditationSessions.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
