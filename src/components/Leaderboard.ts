import React from 'react';
import { Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Leaderboard: React.FC = () => {
  const { data } = useApp();
  const sessions = data?.sessions || [];

  const leaderboard = Object.values(
    (sessions || []).reduce((acc: any, session) => {
      if (!acc[session.telegram_id]) {
        acc[session.telegram_id] = {
          telegram_id: session.telegram_id,
          name: session.name,
          total_sessions: 0,
          total_duration_seconds: 0,
          last_session_time: session.created_at
        }
      }

      acc[session.telegram_id].total_sessions += 1;
      acc[session.telegram_id].total_duration_seconds += (session.duration_seconds || 0);
      
      if (new Date(session.created_at) > new Date(acc[session.telegram_id].last_session_time)) {
        acc[session.telegram_id].last_session_time = session.created_at;
        acc[session.telegram_id].name = session.name;
      }

      return acc;
    }, {})
  ).sort((a: any, b: any) => b.total_duration_seconds - a.total_duration_seconds);

  return (
    <div className="space-y-4">
      <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
        <Trophy size={14} className="text-amber-500" />
        Лидерборд (по времени)
      </h3>
      <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-800/30">
              <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Участник</th>
              <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">Сессий</th>
              <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Всего</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {leaderboard.map((u: any, idx) => (
              <tr key={u.telegram_id} className="hover:bg-zinc-800/20 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <span className="w-6 text-zinc-600 font-mono text-xs">{idx + 1}</span>
                  <span className="font-bold text-sm">{u.name || 'Аноним'}</span>
                </td>
                <td className="p-4 text-center font-mono text-sm text-zinc-400">{u.total_sessions}</td>
                <td className="p-4 text-right font-mono font-bold text-emerald-500">
                  {Math.floor(u.total_duration_seconds / 60)}м
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};