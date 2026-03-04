import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Square, Pause, Smile, Meh, Frown, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDuration } from '../utils';

export const Timer: React.FC = () => {
  const { user, data, startPractice, endPractice } = useApp();
  const [isPracticing, setIsPracticing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showIntentionModal, setShowIntentionModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [intention, setIntention] = useState('');
  const timerRef = useRef<any>(null);

  // Check if user is already in a live session
  useEffect(() => {
    if (data?.live_sessions && user) {
      const live = data.live_sessions.find(s => s.telegram_id === user.telegram_id);
      if (live && !isPracticing) {
        const startTime = new Date(live.start_time).getTime();
        const now = Date.now();
        setSeconds(Math.floor((now - startTime) / 1000));
        setIntention(live.intention);
        setIsPracticing(true);
      }
    }
  }, [data, user]);

  useEffect(() => {
    if (isPracticing && !isPaused) {
      timerRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPracticing, isPaused]);

  const handleStart = async () => {
    if (!intention.trim()) return;
    setShowIntentionModal(false);
    await startPractice(intention);
    setIsPracticing(true);
    setSeconds(0);
  };

  const handleEnd = () => {
    setIsPracticing(false);
    setIsPaused(false);
    setShowMoodModal(true);
  };

  const submitPractice = async (mood: string) => {
    await endPractice(seconds, intention, mood);
    setShowMoodModal(false);
    setSeconds(0);
    setIntention('');
  };

  return (
    <div className="w-full space-y-6">
      {!isPracticing ? (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowIntentionModal(true)}
          className="w-full py-8 bg-emerald-500 text-black rounded-3xl font-bold text-2xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20"
        >
          <Play fill="currentColor" size={28} />
          НАЧАТЬ ПРАКТИКУ
        </motion.button>
      ) : (
        <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 flex flex-col items-center space-y-6">
          <div className="text-zinc-500 uppercase tracking-widest text-xs font-bold">Текущая практика</div>
          <div className="text-7xl font-mono font-bold tracking-tighter tabular-nums">
            {formatDuration(seconds)}
          </div>
          {intention && (
            <div className="text-zinc-400 italic text-center">
              «{intention}»
            </div>
          )}
          <div className="flex gap-4 w-full">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex-1 py-4 bg-zinc-800 rounded-2xl flex items-center justify-center gap-2 font-bold"
            >
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
              {isPaused ? 'Продолжить' : 'Пауза'}
            </button>
            <button
              onClick={handleEnd}
              className="flex-1 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl flex items-center justify-center gap-2 font-bold"
            >
              <Square size={20} fill="currentColor" />
              Завершить
            </button>
          </div>
        </div>
      )}

      {/* Intention Modal */}
      <AnimatePresence>
        {showIntentionModal && (
          <motion.div
            key="intention-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowIntentionModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-zinc-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 space-y-6 border-t border-zinc-800 sm:border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">Твое намерение?</h3>
                <p className="text-zinc-500 text-sm">Сформулируй запрос на эту практику</p>
              </div>
              <textarea
                autoFocus
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="Например: Спокойствие и ясность ума..."
                className="w-full bg-zinc-800 rounded-2xl p-4 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[120px] resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowIntentionModal(false)}
                  className="flex-1 py-4 bg-zinc-800 text-white rounded-2xl font-bold active:scale-95 transition-transform"
                >
                  Отмена
                </button>
                <button
                  onClick={handleStart}
                  disabled={!intention.trim()}
                  className="flex-[2] py-4 bg-emerald-500 text-black rounded-2xl font-bold disabled:opacity-50 active:scale-95 transition-transform"
                >
                  Погнали
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mood Modal */}
      <AnimatePresence>
        {showMoodModal && (
          <motion.div
            key="mood-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-zinc-900 rounded-[2.5rem] p-8 space-y-8 text-center border border-zinc-800"
            >
              <div className="space-y-2">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white">Практика завершена!</h3>
                <p className="text-zinc-500">Ты простоял {formatDuration(seconds)}. Как самочувствие?</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: <Smile size={32} />, label: 'Хорошо', emoji: '🙂', color: 'text-emerald-500 bg-emerald-500/10' },
                  { icon: <Meh size={32} />, label: 'Нормально', emoji: '😐', color: 'text-amber-500 bg-amber-500/10' },
                  { icon: <Frown size={32} />, label: 'Тяжело', emoji: '😣', color: 'text-red-500 bg-red-500/10' },
                ].map((m) => (
                  <button
                    key={m.emoji}
                    onClick={() => submitPractice(m.emoji)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all active:scale-90 ${m.color}`}
                  >
                    {m.icon}
                    <span className="text-xs font-bold uppercase tracking-wider">{m.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
