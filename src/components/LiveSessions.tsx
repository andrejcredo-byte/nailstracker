import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Clock, RefreshCw, Wind, Zap } from 'lucide-react';

export const LiveSessions: React.FC = () => {
  const { data, user, refreshData } = useApp();
  const liveSessions = data?.live_sessions || [];
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

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
        <div className="flex items-center gap-2 text-emerald-500">
          <Sparkles size={16} />
          <h3 className="text-xs font-bold uppercase tracking-widest">Сейчас практикует: ({liveSessions.length})</h3>
        </div>
        <button 
          onClick={handleRefresh}
          className={`p-2 hover:bg-zinc-900 rounded-full transition-all ${isRefreshing ? 'animate-spin text-emerald-500' : 'text-zinc-600'}`}
        >
          <RefreshCw size={14} />
        </button>
      </div>
      
      {data.live_error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-4 text-center">
          <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider">{data.live_error}</p>
        </div>
      )}
      
      {liveSessions.length === 0 && !data.live_error ? (
        <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl p-6 text-center">
          <p className="text-zinc-600 text-xs italic">Сейчас никто не практикует. Будь первым!</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {liveSessions.map((session) => {
            const isMe = String(session.telegram_id) === String(user?.id);
            const isMeditation = session.type === 'meditation';
            const startTime = session.start_time ? new Date(session.start_time) : null;
            const elapsedMins = (!startTime || isNaN(startTime.getTime())) ? 0 : Math.floor((Date.now() - startTime.getTime()) / 60000);
            
            return (
              <div 
                key={session.telegram_id}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors duration-500 ${
                  isMe 
                    ? (isMeditation ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-emerald-500/10 border-emerald-500/20') 
                    : 'bg-zinc-900 border-zinc-800'
                } animate-in fade-in zoom-in duration-300`}
              >
                <div className="relative">
                  <button 
                    onClick={() => openProfile(session.username)}
                    disabled={!session.username}
                    className={`block transition-transform ${session.username ? 'active:scale-95 cursor-pointer' : 'cursor-default'}`}
                  >
                    <img 
                      src={session.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.name || 'U')}&background=random`}
                      alt={session.name}
                      className={`w-8 h-8 rounded-full border object-cover ${isMeditation ? 'border-indigo-500/30' : 'border-zinc-800'}`}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(session.name || 'U')}&background=random`;
                      }}
                    />
                  </button>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black animate-pulse ${
                    isMeditation ? 'bg-indigo-400' : 'bg-emerald-500'
                  }`} />
                </div>
                
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openProfile(session.username)}
                      disabled={!session.username}
                      className={`text-xs font-bold truncate max-w-[80px] text-left ${
                        session.username 
                          ? (isMeditation ? 'hover:text-indigo-400' : 'hover:text-emerald-500') 
                          : 'cursor-default'
                      }`}
                    >
                      {isMe ? 'Ты' : session.name}
                    </button>
                    {isMeditation ? <Wind size={10} className="text-indigo-400" /> : <Zap size={10} className="text-emerald-500" />}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                    <Clock size={10} />
                    <span>{elapsedMins}м</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
