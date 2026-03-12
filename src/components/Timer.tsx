import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Pause, Smile, Meh, Frown, Sparkles, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDuration } from '../utils';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { MEDITATION_MESSAGES } from '../constants/meditationMessages';

export const Timer: React.FC = () => {
  const { user, data, startPractice, endPractice, practiceMode, setBackButton } = useApp();
  const [isPracticing, setIsPracticing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepSeconds, setPrepSeconds] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [accumulatedTime, setAccumulatedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [meditationDuration, setMeditationDuration] = useState(10); // in minutes
  const [showIntentionModal, setShowIntentionModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [intention, setIntention] = useState('');
  const timerWorkerRef = useRef<Worker | null>(null);
  const wakeLockRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gongRef = useRef<HTMLAudioElement | null>(null);
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Web Worker for background timing
  useEffect(() => {
    const workerCode = `
      let timer = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (timer) clearInterval(timer);
          timer = setInterval(() => {
            self.postMessage('tick');
          }, 1000);
        } else if (e.data === 'stop') {
          clearInterval(timer);
          timer = null;
        }
      };
    `;
    try {
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      timerWorkerRef.current = new Worker(url);

      return () => {
        timerWorkerRef.current?.terminate();
        URL.revokeObjectURL(url);
      };
    } catch (e) {
      console.error("Failed to initialize Web Worker:", e);
    }
  }, []);

  useEffect(() => {
    gongRef.current = new Audio('/singingbowl.mp3');
    // Silent audio trick to keep the app alive in background
    silentAudioRef.current = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
    if (silentAudioRef.current) {
      silentAudioRef.current.loop = true;
    }
  }, []);

  useEffect(() => {
    if (showIntentionModal && practiceMode === 'meditation' && scrollRef.current) {
      const itemHeight = 48;
      scrollRef.current.scrollTop = (meditationDuration - 1) * itemHeight;
    }
  }, [showIntentionModal, practiceMode]);
  const activeChallenge = data.challenges?.find(c => c.status === 'active' && (c.creator_id === user?.id || c.opponent_id === user?.id));

  // Screen Wake Lock logic
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err: any) {
          // Silent fail
        }
      }
    };

    // For Nails mode, we definitely want to keep the screen on.
    // For Meditation, we also try to keep it on to ensure the gong plays,
    // but the user can still manually lock it.
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
            const sTime = new Date(startTimeStr).getTime();
            if (!isNaN(sTime)) {
              const now = Date.now();
              const elapsed = Math.floor((now - sTime) / 1000);
              setAccumulatedTime(elapsed);
              setStartTime(now);
              setSeconds(elapsed);
              setIntention(live.intention || '');
              setIsPracticing(true);
              
              // Start silent audio to prevent sleep
              silentAudioRef.current?.play().catch(() => {});
            }
          }
        }
      } catch (e) {
        // Silent fail
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
            const now = Date.now();
            setStartTime(now);
            setAccumulatedTime(0);
            setSeconds(practiceMode === 'meditation' ? meditationDuration * 60 : 0);
            
            // Start silent audio to prevent sleep
            silentAudioRef.current?.play().catch(() => {});
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else if (isPracticing && !isPaused && startTime) {
      // Start Web Worker timer
      timerWorkerRef.current?.postMessage('start');
      
      // Setup Media Session to keep app alive
      try {
        if ('mediaSession' in navigator && (window as any).MediaMetadata) {
          const nav = navigator as any;
          nav.mediaSession.playbackState = 'playing';
          nav.mediaSession.metadata = new (window as any).MediaMetadata({
            title: practiceMode === 'meditation' ? 'Медитация' : 'Гвоздестояние',
            artist: 'Твоя СИЛА',
            album: intention || 'Практика',
            artwork: [{ src: 'https://picsum.photos/seed/zen/512/512', sizes: '512x512', type: 'image/png' }]
          });
        }
      } catch (e) {
        console.error("MediaSession error:", e);
      }

      // Ensure silent audio is playing to keep app alive
      if (silentAudioRef.current && silentAudioRef.current.paused) {
        silentAudioRef.current.play().catch(() => {});
      }

      const handleTick = () => {
        const now = Date.now();
        const currentElapsed = Math.floor((now - startTime) / 1000);
        const totalElapsed = accumulatedTime + currentElapsed;

        if (practiceMode === 'meditation') {
          const remaining = Math.max(0, meditationDuration * 60 - totalElapsed);
          setSeconds(remaining);
          
          if (remaining === 0) {
            timerWorkerRef.current?.postMessage('stop');
            
            if (silentAudioRef.current) {
              silentAudioRef.current.pause();
            }

            if (gongRef.current) {
              gongRef.current.currentTime = 0;
              gongRef.current.volume = 0;
              // Play immediately - we pre-warmed this in handleStart
              gongRef.current.play().then(() => {
                // Smooth fade in
                let vol = 0;
                const fadeIn = setInterval(() => {
                  vol += 0.05;
                  if (vol >= 1) {
                    if (gongRef.current) gongRef.current.volume = 1;
                    clearInterval(fadeIn);
                  } else {
                    if (gongRef.current) gongRef.current.volume = vol;
                  }
                }, 50);

                setTimeout(() => {
                  // Smooth fade out
                  let outVol = 1;
                  const fadeOut = setInterval(() => {
                    outVol -= 0.02;
                    if (outVol <= 0) {
                      if (gongRef.current) {
                        gongRef.current.volume = 0;
                        gongRef.current.pause();
                      }
                      clearInterval(fadeOut);
                    } else {
                      if (gongRef.current) gongRef.current.volume = outVol;
                    }
                  }, 100);
                }, 12000);
              }).catch(e => console.error("Gong background play failed:", e));
            }
            handleEnd();
          }
        } else {
          setSeconds(totalElapsed);
          // Haptic feedback every minute
          if (totalElapsed > 0 && totalElapsed % 60 === 0) {
            const tg = (window as any).Telegram?.WebApp;
            if (tg?.HapticFeedback) {
              tg.HapticFeedback.notificationOccurred('success');
            }
          }
        }
      };

      if (timerWorkerRef.current) {
        timerWorkerRef.current.onmessage = handleTick;
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPracticing, isPaused, isPreparing, practiceMode, meditationDuration, startTime, accumulatedTime]);

  useEffect(() => {
    const anyModalOpen = showIntentionModal || showMoodModal || showMessageModal;
    setBackButton(anyModalOpen, () => {
      setShowIntentionModal(false);
      setShowMoodModal(false);
      setShowMessageModal(false);
    });
  }, [showIntentionModal, showMoodModal, showMessageModal]);

  const handleStart = () => {
    if (!intention.trim()) return;
    
    // Pre-warm audio: play and immediately pause/reset
    // This "unlocks" the audio context for background use later
    if (gongRef.current) {
      gongRef.current.volume = 0;
      gongRef.current.play().then(() => {
        gongRef.current?.pause();
        if (gongRef.current) gongRef.current.currentTime = 0;
      }).catch(() => {});
    }

    if (silentAudioRef.current) {
      silentAudioRef.current.play().catch(() => {});
    }

    // Haptic feedback on start for iPhone
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
      }
    } catch (e) {
      // Silent fail
    }

    const currentIntention = intention;
    setShowIntentionModal(false);
    setIsPreparing(true);
    setPrepSeconds(5);
    setIsPaused(false);
    
    // Запускаем в фоне
    startPractice(currentIntention).catch(error => {
      // Silent fail
    });
  };

  const togglePause = () => {
    if (isPaused) {
      // Resuming
      setStartTime(Date.now());
      setIsPaused(false);
      silentAudioRef.current?.play().catch(() => {});
    } else {
      // Pausing
      if (startTime) {
        const elapsedSinceStart = Math.floor((Date.now() - startTime) / 1000);
        setAccumulatedTime(prev => prev + elapsedSinceStart);
      }
      setStartTime(null);
      setIsPaused(true);
      silentAudioRef.current?.pause();
    }
  };

  const handleEnd = () => {
    setIsPracticing(false);
    setIsPaused(false);
    setStartTime(null);
    silentAudioRef.current?.pause();
    timerWorkerRef.current?.postMessage('stop');
    
    // Clear Media Session
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
    }
    
    if (practiceMode === 'meditation') {
      const randomMsg = MEDITATION_MESSAGES[Math.floor(Math.random() * MEDITATION_MESSAGES.length)];
      setCurrentMessage(randomMsg);
      setShowMessageModal(true);
    } else {
      setShowMoodModal(true);
    }
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
      // Silent fail
    }

    // Не ждем завершения сетевого запроса, закрываем модалку сразу
    const currentSeconds = practiceMode === 'meditation' 
      ? (meditationDuration * 60) - seconds 
      : seconds;
    const currentIntention = intention;
    
    setShowMoodModal(false);
    setSeconds(0);
    setIntention('');
    setIsPracticing(false);
    setIsPaused(false);

    // Запускаем сохранение в фоне
    endPractice(currentSeconds, currentIntention, mood).catch(e => {
      // Silent fail
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
              onClick={togglePause}
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
              <div className="space-y-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 text-center">Длительность (минуты)</div>
                <div className="relative h-40 flex items-center justify-center overflow-hidden">
                  {/* Selection Highlight */}
                  <div className="absolute inset-x-0 h-12 border-y border-indigo-500/30 bg-indigo-500/5 pointer-events-none" />
                  
                  <div 
                    ref={scrollRef}
                    className="w-full h-full overflow-y-auto no-scrollbar snap-y snap-mandatory py-14"
                    onScroll={(e) => {
                      const element = e.currentTarget;
                      const itemHeight = 48; // h-12 is 48px
                      const index = Math.round(element.scrollTop / itemHeight);
                      const value = index + 1;
                      if (value >= 1 && value <= 120 && value !== meditationDuration) {
                        setMeditationDuration(value);
                        // Subtle haptic on scroll
                        try {
                          const tg = (window as any).Telegram?.WebApp;
                          if (tg?.HapticFeedback) {
                            tg.HapticFeedback.impactOccurred('light');
                          }
                        } catch (e) {}
                      }
                    }}
                  >
                    {Array.from({ length: 120 }, (_, i) => i + 1).map(m => (
                      <div 
                        key={m}
                        className={`h-12 flex items-center justify-center snap-center transition-all duration-200 ${
                          meditationDuration === m 
                            ? 'text-3xl font-black text-white' 
                            : 'text-xl font-bold text-zinc-600 opacity-40'
                        }`}
                      >
                        {m}
                      </div>
                    ))}
                  </div>
                  
                  {/* Gradient Overlays */}
                  <div className="absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-[#1A1C2E] to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-[#1A1C2E] to-transparent pointer-events-none" />
                </div>
              </div>
            )}

            <textarea
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder={practiceMode === 'nails' ? "Например: Спокойствие и ясность ума..." : "Например: Глубокое расслабление..."}
              className={`w-full rounded-2xl p-4 text-white placeholder:text-zinc-600 outline-none min-h-[100px] resize-none transition-all ${
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

      {/* Meditation Message Modal */}
      <AnimatePresence>
        {showMessageModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="w-full max-w-md bg-[#1A1C2E] rounded-[3rem] p-10 text-center border border-indigo-500/20 space-y-8 shadow-2xl shadow-indigo-500/10"
            >
              <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto">
                <Heart size={40} fill="currentColor" className="animate-pulse" />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.3em]">Послание для тебя</h3>
                <p className="text-xl font-medium leading-relaxed text-indigo-50">
                  {currentMessage}
                </p>
              </div>

              <button
                onClick={() => {
                  if (gongRef.current) {
                    gongRef.current.pause();
                  }
                  setShowMessageModal(false);
                  setShowMoodModal(true);
                }}
                className="w-full py-5 bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
              >
                Принять с благодарностью
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
