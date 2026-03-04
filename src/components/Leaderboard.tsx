import React from 'react';
import { Trophy, Flame, Clock, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateStreak } from '../utils';

export const Leaderboard: React.FC = () => {
  const { data } = useApp();

  if (!data) return null;

  const stats = data.users.map(user => {
    const userSessions = data.sessions.filter(s => s.telegram_id === user.telegram_id);
    const today = new Date().toDateString();
    const todaySeconds = userSessions
      .filter(s => new Date(s.date).toDateString() === today)
      .reduce((acc, s) => acc + s.duration_seconds, 0);

    const bestSeconds = Math.max(0, ...userSessions.map(s => s.duration_seconds));
    
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const recentSessions = userSessions.filter(s => new Date(s.date) > last7Days);
    const avgSeconds = recentSessions.length > 0 
      ? recentSessions.reduce((acc, s) => acc + s.duration_seconds, 0) / 7 
      : 0;

    return {
      ...user,
      streak: calculateStreak(data.sessions, user.telegram_id),
      todaySeconds,
      avgSeconds,
      bestSeconds
    };
  }).sort((a, b) => b.streak - a.streak || b.todaySeconds - a.todaySeconds);

  return (
    <div className="space-y-4">
      <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Лидерборд</h3>
      <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-bottom border-zinc-800 bg-zinc-800/30">
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Участник</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">Серия</th>
                <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Сегодня</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {stats.map((u, idx) => (
                <tr key={u.telegram_id} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={u.photo} alt={u.name} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                        {idx < 3 && (
                          <div className="absolute -top-1 -left-1 bg-amber-500 rounded-full p-0.5 border border-zinc-900">
                            <Trophy size={8} className="text-black" />
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-sm">{u.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-orange-500 font-bold">
                      <Flame size={14} fill="currentColor" />
                      {u.streak}
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono text-sm text-zinc-400">
                    {Math.floor(u.todaySeconds / 60)}м
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
