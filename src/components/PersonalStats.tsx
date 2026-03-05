import React from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { Flame, Trophy, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateStreak } from '../utils';

export const PersonalStats: React.FC = () => {
  const { user, data } = useApp();
  const sessions = data?.sessions || [];

  if (!user) return null;

  const userSessions = (sessions || []).filter(s => s.telegram_id === user.id);
  const streak = calculateStreak(sessions || [], user.id);
  const bestSeconds = Math.max(0, ...userSessions.map(s => Number(s.duration_seconds) || 0));
  
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const recentSessions = userSessions.filter(s => {
    try {
      return s.start_time && new Date(s.start_time) > last7Days;
    } catch (e) {
      return false;
    }
  });
  const avgSeconds = recentSessions.length > 0 
    ? recentSessions.reduce((acc, s) => acc + (Number(s.duration_seconds) || 0), 0) / 7 
    : 0;

  // Chart data
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toDateString();
    const dayName = d.toLocaleDateString('ru-RU', { weekday: 'short' });
    
    const daySessions = userSessions.filter(s => {
      try {
        return s.start_time && new Date(s.start_time).toDateString() === dateStr;
      } catch (e) {
        return false;
      }
    });
    
    const seconds = daySessions.reduce((acc, s) => acc + (Number(s.duration_seconds) || 0), 0);
    
    return {
      name: dayName || '?',
      minutes: Math.floor(seconds / 60) || 0,
      fullDate: dateStr
    };
  });

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

      <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-400">
            <Calendar size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Последние 7 дней</span>
          </div>
          <div className="text-xs text-zinc-500">Среднее: {Math.floor(avgSeconds / 60)}м/день</div>
        </div>

        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#71717a', fontSize: 12 }}
                dy={10}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-zinc-800 border border-zinc-700 p-2 rounded-lg text-xs shadow-xl">
                        <p className="font-bold">{payload[0].value} мин</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="minutes" radius={[6, 6, 6, 6]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.minutes > 0 ? '#10b981' : '#27272a'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
