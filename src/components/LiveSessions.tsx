import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDuration } from '../utils';

export const LiveSessions: React.FC = () => {
  const { data, user: currentUser } = useApp();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const liveSessions = (data?.live_sessions || []);

  if (liveSessions.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Сейчас на гвоздях</h3>
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
      </div>
      <div className="space-y-3">
        {liveSessions.map((session) => {
          const user = (data?.users || []).find(u => u.telegram_id === session.telegram_id);
          const elapsed = Math.floor((now - new Date(session.start_time).getTime()) / 1000);
          
          return (
            <div
              key={session.telegram_id}
              className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/50"
            >
              <div className="flex items-center gap-3">
                <img
                  src={user?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}`}
                  alt={user?.name || 'User'}
                  className="w-10 h-10 rounded-full border border-zinc-700 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{user?.name || 'Участник'} {session.telegram_id === currentUser?.telegram_id && '(Вы)'}</div>
                  <div className="text-zinc-500 text-xs truncate max-w-[150px]">«{session.intention || 'Без намерения'}»</div>
                </div>
              </div>
              <div className="font-mono font-bold text-emerald-500 ml-2">
                {(() => {
                  try {
                    const start = new Date(session.start_time).getTime();
                    if (isNaN(start)) return '00:00';
                    const elapsed = Math.max(0, Math.floor((now - start) / 1000));
                    return formatDuration(elapsed);
                  } catch (e) {
                    return '00:00';
                  }
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
