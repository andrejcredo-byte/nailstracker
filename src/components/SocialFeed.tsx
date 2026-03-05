import React from 'react';
import { useApp } from '../context/AppContext';
import { formatDuration } from '../utils';

export const SocialFeed: React.FC = () => {
  const { data } = useApp();
  const sessions = data?.sessions || [];

  const sortedSessions = [...(sessions || [])]
    .filter(s => s && s.created_at)
    .sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  if (sortedSessions.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Лента практик</h3>
      <div className="space-y-3">
        {sortedSessions.slice(0, 10).map((session) => (
          <div 
            key={session.id} 
            className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold shrink-0">
              {session.mood || '🧘'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div className="font-bold text-sm truncate text-white">{session.name || 'Участник'}</div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="text-emerald-500 text-xs font-bold mt-0.5">
                {Math.floor(session.duration_seconds / 60)} мин {session.duration_seconds % 60} сек
              </div>
              {session.intention && (
                <p className="text-zinc-400 text-xs mt-1 italic line-clamp-2">
                  «{session.intention}»
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
