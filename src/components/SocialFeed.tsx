import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ChevronDown, ChevronUp, Clock, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SocialFeed: React.FC = () => {
  const { data } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const sessions = data?.sessions || [];

  const sortedSessions = [...(sessions || [])]
    .filter(s => s && s.created_at)
    .sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  if (sortedSessions.length === 0) return null;

  const displaySessions = isExpanded ? sortedSessions.slice(0, 20) : sortedSessions.slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-500">
          <MessageSquare size={14} />
          <h3 className="text-xs font-bold uppercase tracking-widest">Лента практик</h3>
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1 hover:text-emerald-400 transition-colors"
        >
          {isExpanded ? 'Свернуть' : 'Развернуть'}
          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {displaySessions.map((session, idx) => (
            <motion.div 
              key={session.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-zinc-900/50 p-4 rounded-3xl border border-zinc-800/50 flex items-start gap-4 hover:border-zinc-700 transition-colors"
            >
              <div className="relative shrink-0">
                <img 
                  src={session.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(session.name || 'U')}&background=random`}
                  alt={session.name}
                  className="w-10 h-10 rounded-full border border-zinc-800 object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(session.name || 'U')}&background=random`;
                  }}
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-zinc-900 rounded-full flex items-center justify-center text-[10px] border border-zinc-800">
                  {session.mood || '🧘'}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="font-bold text-sm truncate text-white">{session.name || 'Участник'}</div>
                  <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="text-emerald-500 text-xs font-bold mt-0.5">
                  {Math.floor(session.duration_seconds / 60)} мин {session.duration_seconds % 60} сек
                </div>
                {session.intention && (
                  <p className="text-zinc-400 text-xs mt-1 italic line-clamp-2 leading-relaxed">
                    «{session.intention}»
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
