import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Pause, Smile, Meh, Frown, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDuration } from '../utils';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';

export const Timer: React.FC = () => {
  const { user, data, startPractice, endPractice, practiceMode } = useApp();
  const [isPracticing, setIsPracticing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepSeconds, setPrepSeconds] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [meditationDuration, setMeditationDuration] = useState(10); // in minutes
  const [showIntentionModal, setShowIntentionModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [intention, setIntention] = useState('');
  const timerRef = useRef<any>(null);
  const wakeLockRef = useRef<any>(null);
  const gongRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    gongRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); // Fallback to a CDN gong if local is missing
    // If you have a local file, you can use: gongRef.current = new Audio('/assets/gong.mp3');
  }, []);

  const activeChallenge = data.challenges?.find(c => c.status === 'active' && (c.creator_id === user?.id || c.opponent_id === user?.id));

  // Screen Wake Lock logic
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          console.log('Screen Wake Lock is active');
        } catch (err: any) {
          console.error(`${err.name}, ${err.message}`);
        }
      }
    };

    if (isPracticing && !isPaused) {
      requestWakeLock();
      
      // Re-request wake lock if page becomes visible again
      const handleVisibilityChange = () => {
        if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
          requestWakeLock();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    } else {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null;
          console.log('Screen Wake Lock released');
        });
      }
    }

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, [isPracticing, isPaused]);

  useEffect(() => {
    const liveSessions = (data?.live_sessions || []);
    if (liveSessions.length > 0 && user) {
      try {
        const live = liveSessions.find(s => s.telegram_id === user.id);
        if (live && !isPracticing) {
          const startTimeStr = live.start_time;
          if (startTimeStr) {
            const startTime = new Date(startTimeStr).getTime();
            if (!isNaN(startTime)) {
              const now = Date.now();
              setSeconds(Math.max(0, Math.floor((now - startTime) / 1000)));
              setIntention(live.intention || '');
              setIsPracticing(true);
            }
          }
        }
      } catch (e) {
        console.error('Error resuming live session:', e);
      }
    }
  }, [data, user, isPracticing]);

  useEffect(() => {
    let interval: any;
    if (isPreparing) {
      interval = setInterval(() => {
        setPrepSeconds(s => {
          if (s <= 1) {
            clearInterval(interval);
            setIsPreparing(false);
            setIsPracticing(true);
            setSeconds(practiceMode === 'meditation' ? meditationDuration * 60 : 0);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else if (isPracticing && !isPaused) {
      interval = setInterval(() => {
        setSeconds(s => {
          if (practiceMode === 'meditation') {
            if (s <= 1) {
              clearInterval(interval);
              gongRef.current?.play().catch(e => console.error('Gong error:', e));
              handleEnd();
              return 0;
            }
            return s - 1;
          }
          
          const newSeconds = s + 1;
          // Haptic feedback every minute
          if (newSeconds > 0 && newSeconds % 60 === 0) {
            const tg = (window as any).Telegram?.WebApp;
            if (tg?.HapticFeedback) {
              tg.HapticFeedback.notificationOccurred('success');
            }
          }
          return newSeconds;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPracticing, isPaused, isPreparing, practiceMode, meditationDuration]);

  const handleStart = () => {
    if (!intention.trim()) return;
    
    // Haptic feedback on start for iPhone
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
      }
    } catch (e) {
      console.error('Haptic error:', e);
    }

    const currentIntention = intention;
    setShowIntentionModal(false);
    setIsPreparing(true);
    setPrepSeconds(5);
    setIsPaused(false);
    
    // Запускаем в фоне
    startPractice(currentIntention).catch(error => {
      console.error('Failed to start practice:', error);
    });
  };

  const handleEnd = () => {
    setIsPracticing(false);
    setIsPaused(false);
    setShowMoodModal(true);
  };

  const submitPractice = (mood: string) => {
    // Trigger confetti
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#ffffff']
    });

    // Trigger heavy haptic feedback for iPhone
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('heavy');
        setTimeout(() => {
          tg.HapticFeedback.notificationOccurred('success');
        }, 100);
      }
    } catch (e) {
      console.error('Haptic error:', e);
    }

    // Не ждем завершения сетевого запроса, закрываем модалку сразу
    const currentSeconds = seconds;
    const currentIntention = intention;
    
    setShowMoodModal(false);
    setSeconds(0);
    setIntention('');
    setIsPracticing(false);
    setIsPaused(false);

    // Запускаем сохранение в фоне
    endPractice(currentSeconds, currentIntention, mood).catch(e => {
      console.error('End session error:', e);
    });
  };

  return (
    <div className="w-full space-y-6">
      {!isPracticing && !isPreparing ? (
        <button
          onClick={() => setShowIntentionModal(true)}
          className={`w-full py-8 rounded-3xl font-bold text-2xl flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all duration-500 ${
            practiceMode === 'nails' 
              ? 'bg-emerald-500 text-black shadow-emerald-500/20' 
              : 'bg-indigo-500 text-white shadow-indigo-500/20'
          }`}
        >
          <Play fill="currentColor" size={28} />
          {practiceMode === 'nails' ? 'НАЧАТЬ ПРАКТИКУ' : 'НАЧАТЬ МЕДИТАЦИЮ'}
        </button>
      ) : isPreparing ? (
        <div className={`w-full py-12 rounded-3xl flex flex-col items-center justify-center space-y-4 border transition-colors duration-700 ${
          practiceMode === 'nails' ? 'bg-zinc-900 border-zinc-800' : 'bg-indigo-900/20 border-indigo-800/30'
        }`}>
          <div className="text-zinc-500 uppercase tracking-widest text-xs font-bold">Приготовьтесь...</div>
          <motion.div 
            key={prepSeconds}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-8xl font-black italic ${practiceMode === 'nails' ? 'text-emerald-500' : 'text-indigo-400'}`}
          >
            {prepSeconds}
          </motion.div>
        </div>
      ) : (
        <motion.div 
          animate={practiceMode === 'meditation' && !isPaused ? {
            scale: [1, 1.03, 1],
          } : {}}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`rounded-3xl p-8 border flex flex-col items-center space-y-6 relative overflow-hidden transition-colors duration-700 ${
            practiceMode === 'nails' ? 'bg-zinc-900 border-zinc-800' : 'bg-indigo-900/20 border-indigo-800/30'
          }`}
        >
          {activeChallenge && practiceMode === 'nails' && (
            <div className="absolute top-0 right-0 bg-emerald-500 text-black px-4 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={10} />
              Битва активна
            </div>
          )}
          <div className="text-zinc-500 uppercase tracking-widest text-xs font-bold">
            {practiceMode === 'nails' ? 'Текущая практика' : 'Глубокое дыхание'}
          </div>
          <div className={`text-7xl font-mono font-bold tracking-tighter tabular-nums transition-colors duration-700 ${
            practiceMode === 'nails' ? 'text-white' : 'text-indigo-100'
          }`}>
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
              className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold active:scale-95 transition-all ${
                practiceMode === 'nails' ? 'bg-zinc-800 text-white' : 'bg-indigo-900/40 text-indigo-100 border border-indigo-800/30'
              }`}
            >
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
              {isPaused ? 'Продолжить' : 'Пауза'}
            </button>
            <button
              onClick={handleEnd}
              className="flex-1 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl flex items-center justify-center gap-2 font-bold active:scale-95 transition-all"
            >
              <Square size={20} fill="currentColor" />
              Завершить
            </button>
          </div>
        </motion.div>
      )}

      {/* Intention Modal */}
      {showIntentionModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 space-y-6 border-t sm:border transition-colors duration-700 ${
            practiceMode === 'nails' ? 'bg-zinc-900 border-zinc-800' : 'bg-[#1A1C2E] border-indigo-900/30'
          }`}>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">
                {practiceMode === 'nails' ? 'Твое намерение?' : 'Настрой на медитацию'}
              </h3>
              <p className="text-zinc-500 text-sm">
                {practiceMode === 'nails' ? 'Сформулируй запрос на эту практику' : 'Выбери время и сформулируй намерение'}
              </p>
            </div>

            {practiceMode === 'meditation' && (
              <div className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Длительность (мин)</div>
                <div className="flex gap-2">
                  {[5, 10, 15, 20].map(m => (
                    <button
                      key={m}
                      onClick={() => setMeditationDuration(m)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                        meditationDuration === m 
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                          : 'bg-indigo-900/20 text-indigo-400 border border-indigo-800/30'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <textarea
              autoFocus
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder={practiceMode === 'nails' ? "Например: Спокойствие и ясность ума..." : "Например: Глубокое расслабление..."}
              className={`w-full rounded-2xl p-4 text-white placeholder:text-zinc-600 outline-none min-h-[120px] resize-none transition-all ${
                practiceMode === 'nails' 
                  ? 'bg-zinc-800 focus:ring-2 focus:ring-emerald-500' 
                  : 'bg-indigo-900/20 focus:ring-2 focus:ring-indigo-500 border border-indigo-800/30'
              }`}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowIntentionModal(false)}
                className="flex-1 py-4 bg-zinc-800 text-white rounded-2xl font-bold"
              >
                Отмена
              </button>
              <button
                onClick={handleStart}
                disabled={!intention.trim()}
                className={`flex-[2] py-4 rounded-2xl font-bold disabled:opacity-50 transition-colors ${
                  practiceMode === 'nails' ? 'bg-emerald-500 text-black' : 'bg-indigo-500 text-white'
                }`}
              >
                Погнали
              </button>
            </div>
          </div>
        </div>
      )}

      {showMoodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className={`w-full max-w-md rounded-[2.5rem] p-8 space-y-8 text-center border transition-colors duration-700 ${
            practiceMode === 'nails' ? 'bg-zinc-900 border-zinc-800' : 'bg-[#1A1C2E] border-indigo-900/30'
          }`}>
            <div className="space-y-2">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                practiceMode === 'nails' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'
              }`}>
                <Sparkles size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white">Практика завершена!</h3>
              <p className="text-zinc-500">
                {practiceMode === 'nails' 
                  ? `Ты простоял ${formatDuration(seconds)}. Как самочувствие?`
                  : `Медитация окончена. Как ты себя чувствуешь?`
                }
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: <Smile size={32} />, label: 'Хорошо', emoji: '🙂', color: practiceMode === 'nails' ? 'text-emerald-500 bg-emerald-500/10' : 'text-indigo-400 bg-indigo-500/10' },
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
          </div>
        </div>
      )}
    </div>
  );
};
