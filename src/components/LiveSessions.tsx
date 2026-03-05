import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Clock } from 'lucide-react';

export const LiveSessions: React.FC = () => {
  const { data, user } = useApp();
  const liveSessions = data?.live_sessions || [];

  if (liveSessions.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-emerald-500">
        <Sparkles size={16} />
        <h3 className="text-xs font-bold uppercase tracking-widest">Сейчас в практике ({liveSessions.length})</h3>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {liveSessions.map((session) => {
          const isMe = session.telegram_id === user?.id;
          const startTime = new Date(session.start_time);
          const elapsedMins = Math.floor((Date.now() - startTime.getTime()) / 60000);
          
          return (
            <div 
              key={session.telegram_id}
              className={`flex items-center gap-3 p-3 rounded-2xl border ${
                isMe ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-zinc-900 border-zinc-800'
              } animate-in fade-in zoom-in duration-300`}
            >
              <div className="relative">
                <img 
                  src={session.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.name || 'U')}&background=random`}
                  alt={session.name}
                  className="w-8 h-8 rounded-full border border-zinc-800 object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(session.name || 'U')}&background=random`;
                  }}
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black animate-pulse" />
              </div>
              
              <div className="flex flex-col">
                <span className="text-xs font-bold truncate max-w-[80px]">
                  {isMe ? 'Ты' : session.name}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                  <Clock size={10} />
                  <span>{elapsedMins}м</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
