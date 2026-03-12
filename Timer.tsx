import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Pause, Smile, Meh, Frown, Sparkles, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDuration } from '../utils';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { MEDITATION_MESSAGES } from '../constants/meditationMessages';

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
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [intention, setIntention] = useState('');
  
  // Рефы для аудио-движка
  const gongRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  const timerRef = useRef<any>(null);
  const wakeLockRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Инициализация аудио при загрузке
  useEffect(() => {
    const audio = new Audio('/singingbowl.mp3');
    audio.crossOrigin = "anonymous";
    gongRef.current = audio;

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Функция для настройки Web Audio API (вызывается один раз)
  const initAudioEngine = () => {
    if (!audioContextRef.current && gongRef.current) {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const gainNode = ctx.createGain();
      const source = ctx.createMediaElementSource(gongRef.current);

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      audioContextRef.current = ctx;
      gainNodeRef.current = gainNode;
      sourceNodeRef.current = source;
    }
  };

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
          console.error(`${err.name}, ${err.message}`);
        }
      }
    };

    if (isPracticing && !isPaused) {
      requestWakeLock();
    } else {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null;
        });
      }
    }

    return () => {
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, [isPracticing, isPaused]);

  // Основная логика таймера и звука
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
              
              // ЗАПУСК ГОНГА БЕЗ ЩЕЛЧКА
              if (gongRef.current && audioContextRef.current && gainNodeRef.current) {
                const ctx = audioContextRef.current;
                const gain = gainNodeRef.current;
                const now = ctx.currentTime;

                // Сбрасываем трек
                gongRef.current.currentTime = 0;
                
                // 1. Мгновенно в ноль (убирает щелчок)
                gain.gain.cancelScheduledValues(now);
                gain.gain.setValueAtTime(0.0001, now);
                
                // 2. Плавный экспоненциальный взлет (очень красиво звучит)
                gain.gain.exponentialRampToValueAtTime(1.0, now + 4.0); 

                gongRef.current.play().catch(e => console.error('Gong play error:', e));
                
                // 3. Плавное затухание через 12 секунд
                const fadeOutStart = now + 12;
                gain.gain.setValueAtTime(1.0, fadeOutStart);
                gain.gain.exponentialRampToValueAtTime(0.0001, fadeOutStart + 3.0);

                setTimeout(() => {
                  if (gongRef.current) gongRef.current.pause();
                }, 15500);
              }

              handleEnd();
              return 0;
            }
            return s - 1;
          }
          
          const newSeconds = s + 1;
          if (newSeconds > 0 && newSeconds % 60 === 0) {
            const tg = (window as any).Telegram?.WebApp;
            if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
          }
          return newSeconds;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPracticing, isPaused, isPreparing, practiceMode, meditationDuration]);

  const handleStart = async () => {
    if (!intention.trim()) return;
    
    // Инициализируем и "будим" аудио-движок по клику (важно для iOS)
    initAudioEngine();
    if (audioContextRef.current) {
      await audioContextRef.current.resume();
    }

    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
    } catch (e) {}

    setShowIntentionModal(false);
    setIsPreparing(true);
    setPrepSeconds(5);
    setIsPaused(false);
    
    startPractice(intention).catch(error => console.error('Start practice error:', error));
  };

  const handleEnd = () => {
    setIsPracticing(false);
    setIsPaused(false);
    
    if (practiceMode === 'meditation') {
      const randomMsg = MEDITATION_MESSAGES[Math.floor(Math.random() * MEDITATION_MESSAGES.length)];
      setCurrentMessage(randomMsg);
      setShowMessageModal(true);
    } else {
      setShowMoodModal(true);
    }
  };

  const submitPractice = (mood: string) => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#ffffff']
    });

    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('heavy');
        setTimeout(() => tg.HapticFeedback.notificationOccurred('success'), 100);
      }
    } catch (e) {}

    const currentSeconds = practiceMode === 'meditation' ? (meditationDuration * 60) - seconds : seconds;
    
    setShowMoodModal(false);
    setSeconds(0);
    setIntention('');
    setIsPracticing(false);
    setIsPaused(false);

    endPractice(currentSeconds, intention, mood).catch(e => console.error('End session error:', e));
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
              <div className="space-y-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 text-center">Длительность (минуты)</div>
                <div className="relative h-40 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-x-0 h-12 border-y border-indigo-500/30 bg-indigo-500/5 pointer-events-none" />
                  <div 
                    ref={scrollRef}
                    className="w-full h-full overflow-y-auto no-scrollbar snap-y snap-mandatory py-14"
                    onScroll={(e) => {
                      const element = e.currentTarget;
                      const itemHeight = 48;
                      const index = Math.round(element.scrollTop / itemHeight);
                      const value = index + 1;
                      if (value >= 1 && value <= 120 && value !== meditationDuration) {
                        setMeditationDuration(value);
                        try {
                          const tg = (window as any).Telegram?.WebApp;
                          if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
                        } catch (e) {}
                      }
                    }}
                  >
                    {Array.from({ length: 120 }, (_, i) => i + 1).map(m => (
                      <div key={m} className={`h-12 flex items-center justify-center snap-center transition-all duration-200 ${meditationDuration === m ? 'text-3xl font-black text-white' : 'text-xl font-bold text-zinc-600 opacity-40'}`}>
                        {m}
                      </div>
                    ))}
                  </div>
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
              <button onClick={() => setShowIntentionModal(false)} className="flex-1 py-4 bg-zinc-800 text-white rounded-2xl font-bold">Отмена</button>
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
                <p className="text-xl font-medium leading-relaxed text-indigo-50">{currentMessage}</p>
              </div>
              <button
                onClick={() => {
                  if (gongRef.current) gongRef.current.pause();
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
                {practiceMode === 'nails' ? `Ты простоял ${formatDuration(seconds)}. Как самочувствие?` : `Медитация окончена. Как ты себя чувствуешь?`}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: <Smile size={32} />, label: 'Хорошо', emoji: '🙂', color: practiceMode === 'nails' ? 'text-emerald-500 bg-emerald-500/10' : 'text-indigo-400 bg-indigo-500/10' },
                { icon: <Meh size={32} />, label: 'Нормально', emoji: '😐', color: 'text-amber-500 bg-amber-500/10' },
                { icon: <Frown size={32} />, label: 'Тяжело', emoji: '😣', color: 'text-red-500 bg-red-500/10' },
              ].map((m) => (
                <button key={m.emoji} onClick={() => submitPractice(m.emoji)} className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all active:scale-90 ${m.color}`}>
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
