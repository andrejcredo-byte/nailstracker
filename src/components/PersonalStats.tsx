import React, { useState } from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { Flame, Trophy, Calendar, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateStreak } from '../utils';
import { motion, AnimatePresence } from 'motion/react';

export const PersonalStats: React.FC = () => {
  const { user, data } = useApp();
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const sessions = data?.sessions || [];

  if (!user) return null;

  const userSessions = (sessions || []).filter(s => s.telegram_id === user.id);
  const streak = calculateStreak(sessions || [], user.id);
  const bestSeconds = Math.max(0, ...userSessions.map(s => Number(s.duration_seconds) || 0));
  
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const recentSessions = userSessions.filter(s => {
    try {
      return s.start_time && new Date(s.start_time.replace(' ', 'T')) > last7Days;
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
        return s.start_time && new Date(s.start_time.replace(' ', 'T')).toDateString() === dateStr;
      } catch (e) {
        return false;
      }
    }).sort((a, b) => new Date(b.start_time.replace(' ', 'T')).getTime() - new Date(a.start_time.replace(' ', 'T')).getTime());
    
    const seconds = daySessions.reduce((acc, s) => acc + (Number(s.duration_seconds) || 0), 0);
    
    return {
      name: dayName || '?',
      minutes: Math.floor(seconds / 60) || 0,
      seconds: seconds % 60,
      totalSeconds: seconds,
      sessionsCount: daySessions.length,
      sessions: daySessions, // Store raw sessions for detail view
      fullDate: d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
      dateStr: dateStr
    };
  });

  const handleBarClick = (data: any) => {
    if (selectedDay?.dateStr === data.dateStr) {
      setSelectedDay(null);
    } else {
      setSelectedDay(data);
    }
  };

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
                content={() => null} 
              />
              <Bar 
                dataKey="minutes" 
                radius={[6, 6, 6, 6]}
                onClick={handleBarClick}
                className="cursor-pointer"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={selectedDay?.dateStr === entry.dateStr ? '#34d399' : (entry.minutes > 0 ? '#10b981' : '#27272a')} 
                    stroke={selectedDay?.dateStr === entry.dateStr ? '#fff' : 'none'}
                    strokeWidth={2}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <AnimatePresence mode="wait">
          {selectedDay && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-4 border-t border-zinc-800 overflow-hidden space-y-3"
            >
              <div className="flex items-center justify-between px-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  {selectedDay.fullDate}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                  Всего: {selectedDay.minutes}м {selectedDay.seconds}с
                </div>
              </div>

              <div className="space-y-2">
                {selectedDay.sessions.length > 0 ? (
                  selectedDay.sessions.map((s: any, idx: number) => (
                    <div 
                      key={s.id || idx} 
                      className="bg-zinc-800/50 border border-zinc-800 p-3 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                          {selectedDay.sessions.length - idx}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">Сессия</span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {new Date(s.start_time.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-emerald-500 font-mono">
                        {Math.floor(s.duration_seconds / 60)}м {s.duration_seconds % 60}с
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-zinc-600 text-xs italic">
                    В этот день практик не было
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!selectedDay && (
          <div className="flex items-center gap-2 justify-center text-zinc-600 text-[10px] font-bold uppercase tracking-widest animate-pulse">
            <Info size={10} />
            Нажми на столбец для деталей
          </div>
        )}
      </div>
    </div>
  );
};
