import React from 'react';
import { Trophy, Clock, Target, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Leaderboard: React.FC = () => {
  const { data } = useApp();
  const sessions = data?.sessions || [];

  const leaderboard = React.useMemo(() => {
    try {
      return Object.values(
        (sessions || [])
          .filter(s => s && s.telegram_id && s.type === 'nails')
          .reduce((acc: any, session) => {
            const id = session.telegram_id;
            if (!acc[id]) {
              acc[id] = {
                telegram_id: id,
                name: session.name || 'Аноним',
                username: session.username,
                photo_url: session.photo_url,
                total_sessions: 0,
                total_duration_seconds: 0,
                average_duration: 0,
                last_session_time: session.start_time,
              }
            }

            acc[id].total_sessions += 1;
            acc[id].total_duration_seconds += (Number(session.duration_seconds) || 0);
            acc[id].average_duration = acc[id].total_duration_seconds / acc[id].total_sessions;
            
            if (session.start_time && (!acc[id].last_session_time || new Date(session.start_time) > new Date(acc[id].last_session_time))) {
              acc[id].last_session_time = session.start_time;
              if (session.name) acc[id].name = session.name;
              if (session.username) acc[id].username = session.username;
              if (session.photo_url) acc[id].photo_url = session.photo_url;
            }

            return acc;
          }, {})
      ).sort((a: any, b: any) => b.total_duration_seconds - a.total_duration_seconds);
    } catch (e) {
      return [];
    }
  }, [sessions]);

  const openProfile = (username?: string) => {
    if (!username) return;
    const url = `https://t.me/${username}`;
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Trophy size={14} className="text-amber-500" />
          Лидерборд (по времени)
        </h3>
      </div>
      
      <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800">
        <div className="overflow-x-auto">
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
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <button 
                          onClick={() => openProfile(u.username)}
                          disabled={!u.username}
                          className={`block transition-transform ${u.username ? 'active:scale-95 cursor-pointer' : 'cursor-default'}`}
                        >
                          <img 
                            src={u.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=random`}
                            alt={u.name}
                            className="w-8 h-8 rounded-full border border-zinc-800 object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=random`;
                            }}
                          />
                        </button>
                        <div className="absolute -top-1 -left-1 w-4 h-4 bg-zinc-900 rounded-full flex items-center justify-center text-[8px] font-bold border border-zinc-800 text-zinc-500">
                          {idx + 1}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <button 
                          onClick={() => openProfile(u.username)}
                          disabled={!u.username}
                          className={`font-bold text-sm text-left ${u.username ? 'hover:text-emerald-500 cursor-pointer' : 'cursor-default'}`}
                        >
                          {u.name || 'Аноним'}
                        </button>
                        <span className="text-[10px] text-zinc-500">
                          {(() => {
                            if (!u.last_session_time) return '---';
                            const d = new Date(u.last_session_time);
                            return isNaN(d.getTime()) ? '---' : d.toLocaleDateString();
                          })()}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center font-mono text-sm text-zinc-300">
                    {u.total_sessions}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-mono font-bold text-emerald-500">
                        {Math.floor(u.total_duration_seconds / 60)}м {u.total_duration_seconds % 60}с
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase">
                        ср: {Math.floor(u.average_duration / 60)}м
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-zinc-500 text-sm italic">
                    Пока нет данных для рейтинга
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
