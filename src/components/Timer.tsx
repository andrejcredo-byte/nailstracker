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
  const [meditationDuration, setMeditationDuration] = useState(10);
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
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Движок Pure Zen Audio
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const isSourceConnected = useRef(false);

  // Инициализация Web Worker
  useEffect(() => {
    const workerCode = `
      let timer = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (timer) clearInterval(timer);
          timer = setInterval(() => { self.postMessage('tick'); }, 1000);
        } else if (e.data === 'stop') {
          clearInterval(timer);
          timer = null;
        }
      };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    timerWorkerRef.current = new Worker(url);

    return () => {
      timerWorkerRef.current?.terminate();
      URL.revokeObjectURL(url);
    };
  }, []);

  // Предзагрузка аудио
  useEffect(() => {
    const audio = new Audio('/singingbowl.mp3');
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    gongRef.current = audio;
    
    try {
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.expand();
        tg.isClosingConfirmationEnabled = true;
      }
    } catch (e) {}

    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Инициализация Web Audio API (вызывается при клике)
  const initAudioEngine = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (!isSourceConnected.current && gongRef.current && audioContextRef.current) {
      const gainNode = audioContextRef.current.createGain();
      const source = audioContextRef.current.createMediaElementSource(gongRef.current);
      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      gainNodeRef.current = gainNode;
      isSourceConnected.current = true;
    }
  };

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
            initAudioEngine();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else if (isPracticing && !isPaused && startTime) {
      timerWorkerRef.current?.postMessage('start');
      
      const handleTick = () => {
        const now = Date.now();
        const currentElapsed = Math.floor((now - startTime) / 1000);
        const totalElapsed = accumulatedTime + currentElapsed;

        if (practiceMode === 'meditation') {
          const remaining = Math.max(0, meditationDuration * 60 - totalElapsed);
          setSeconds(remaining);
          
          if (remaining === 0 && totalElapsed > 5) {
            timerWorkerRef.current?.postMessage('stop');
            
            // ЗАПУСК ГОНГА БЕЗ ЩЕЛЧКА
            if (gongRef.current && audioContextRef.current && gainNodeRef.current) {
              const ctx = audioContextRef.current;
              const gain = gainNodeRef.current;
              const audioNow = ctx.currentTime;

              if (ctx.state === 'suspended') ctx.resume();
              
              gongRef.current.currentTime = 0;
              gain.gain.cancelScheduledValues(audioNow);
              gain.gain.setValueAtTime(0.0001, audioNow);
              gain.gain.exponentialRampToValueAtTime(1.0, audioNow + 4.0); 

              gongRef.current.play().catch(() => {});

              const fadeOutStart = audioNow + 12;
              gain.gain.setValueAtTime(1.0, fadeOutStart);
              gain.gain.exponentialRampToValueAtTime(0.0001, fadeOutStart + 3.0);

              setTimeout(() => { if (gongRef.current) gongRef.current.pause(); }, 16000);
            }
            handleEnd();
          }
        } else {
          setSeconds(totalElapsed);
          if (totalElapsed > 0 && totalElapsed % 60 === 0) {
            const tg = (window as any).Telegram?.WebApp;
            if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
          }
        }
      };

      if (timerWorkerRef.current) timerWorkerRef.current.onmessage = handleTick;
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isPracticing, isPaused, isPreparing, practiceMode, meditationDuration, startTime, accumulatedTime]);

  const handleStart = () => {
    if (!intention.trim()) return;
    initAudioEngine();
    if (silentAudioRef.current) silentAudioRef.current.play().catch(() => {});
    
    setShowIntentionModal(false);
    setIsPreparing(true);
    setPrepSeconds(5);
    setIsPaused(false);
    startPractice(intention).catch(() => {});
  };

  const handleEnd = () => {
    setIsPracticing(false);
    setIsPaused(false);
    setStartTime(null);
    timerWorkerRef.current?.postMessage('stop');
    
    if (practiceMode === 'meditation') {
      const randomMsg = MEDITATION_MESSAGES[Math.floor(Math.random() * MEDITATION_MESSAGES.length)];
      setCurrentMessage(randomMsg);
      setShowMessageModal(true);
    } else {
      setShowMoodModal(true);
    }
  };

  const submitPractice = (mood: string) => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    const currentSeconds = practiceMode === 'meditation' ? (meditationDuration * 60) - seconds : seconds;
    setShowMoodModal(false);
    setSeconds(0);
    setIntention('');
    setIsPracticing(false);
    endPractice(currentSeconds, intention, mood).catch(() => {});
  };

  const togglePause = () => {
    if (isPaused) {
      setStartTime(Date.now());
      setIsPaused(false);
      audioContextRef.current?.resume();
    } else {
      if (startTime) setAccumulatedTime(prev => prev + Math.floor((Date.now() - startTime) / 1000));
      setStartTime(null);
      setIsPaused(true);
      audioContextRef.current?.suspend();
    }
  };

  return (
    <div className="w-full space-y-6">
      <audio ref={silentAudioRef} loop playsInline src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==" />
      <div className="select-none">
        {!isPracticing && !isPreparing ? (
          <button onClick={() => setShowIntentionModal(true)} className={`w-full py-8 rounded-3xl font-bold text-2xl flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all duration-500 ${practiceMode === 'nails' ? 'bg-emerald-500 text-black shadow-emerald-500/20' : 'bg-indigo-500 text-white shadow-indigo-500/20'}`}>
            <Play fill="currentColor" size={28} /> {practiceMode === 'nails' ? 'НАЧАТЬ ПРАКТИКУ' : 'НАЧАТЬ МЕДИТАЦИЮ'}
          </button>
        ) : isPreparing ? (
          <div className={`w-full py-12 rounded-3xl flex flex-col items-center justify-center space-y-4 border transition-colors duration-700 ${practiceMode === 'nails' ? 'bg-zinc-900 border-zinc-800' : 'bg-indigo-900/20 border-indigo-800/30'}`}>
            <div className="text-zinc-500 uppercase tracking-widest text-xs font-bold">Приготовьтесь...</div>
            <motion.div key={prepSeconds} initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`text-8xl font-black italic ${practiceMode === 'nails' ? 'text-emerald-500' : 'text-indigo-400'}`}>{prepSeconds}</motion.div>
          </div>
        ) : (
          <motion.div animate={practiceMode === 'meditation' && !isPaused ? { scale: [1, 1.03, 1] } : {}} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className={`rounded-3xl p-8 border flex flex-col items-center space-y-6 relative overflow-hidden transition-colors duration-700 ${practiceMode === 'nails' ? 'bg-zinc-900 border-zinc-800' : 'bg-indigo-900/20 border-indigo-800/30'}`}>
            <div className="text-zinc-500 uppercase tracking-widest text-xs font-bold">{practiceMode === 'nails' ? 'Текущая практика' : 'Глубокое дыхание'}</div>
            <div className={`text-7xl font-mono font-bold tracking-tighter tabular-nums transition-colors duration-700 ${practiceMode === 'nails' ? 'text-white' : 'text-indigo-100'}`}>{formatDuration(seconds)}</div>
            {intention && <div className="text-zinc-400 italic text-center">«{intention}»</div>}
            <div className="flex gap-4 w-full">
              <button onClick={togglePause} className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold active:scale-95 transition-all ${practiceMode === 'nails' ? 'bg-zinc-800 text-white' : 'bg-indigo-900/40 text-indigo-100 border border-indigo-800/30'}`}>
                {isPaused ? <Play size={20} /> : <Pause size={20} />} {isPaused ? 'Продолжить' : 'Пауза'}
              </button>
              <button onClick={handleEnd} className="flex-1 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl flex items-center justify-center gap-2 font-bold active:scale-95 transition-all">
                <Square size={20} fill="currentColor" /> Завершить
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Модалки */}
      {showIntentionModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 space-y-6 border-t sm:border transition-colors duration-700 ${practiceMode === 'nails' ? 'bg-zinc-900 border-zinc-800' : 'bg-[#1A1C2E] border-indigo-900/30'}`}>
            <h3 className="text-2xl font-bold text-white">{practiceMode === 'nails' ? 'Твое намерение?' : 'Настрой на медитацию'}</h3>
            {practiceMode === 'meditation' && (
              <div className="relative h-40 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-x-0 h-12 border-y border-indigo-500/30 bg-indigo-500/5 pointer-events-none" />
                <div ref={scrollRef} className="w-full h-full overflow-y-auto no-scrollbar snap-y snap-mandatory py-14" onScroll={(e) => {
                  const val = Math.round(e.currentTarget.scrollTop / 48) + 1;
                  if (val !== meditationDuration) setMeditationDuration(val);
                }}>
                  {Array.from({ length: 120 }, (_, i) => i + 1).map(m => (
                    <div key={m} className={`h-12 flex items-center justify-center snap-center transition-all ${meditationDuration === m ? 'text-3xl font-black text-white' : 'text-xl text-zinc-600 opacity-40'}`}>{m}</div>
                  ))}
                </div>
              </div>
            )}
            <textarea value={intention} onChange={(e) => setIntention(e.target.value)} placeholder="Например: Спокойствие..." className={`w-full rounded-2xl p-4 text-white outline-none min-h-[100px] resize-none ${practiceMode === 'nails' ? 'bg-zinc-800' : 'bg-indigo-900/20'}`} />
            <div className="flex gap-3">
              <button onClick={() => setShowIntentionModal(false)} className="flex-1 py-4 bg-zinc-800 text-white rounded-2xl font-bold">Отмена</button>
              <button onClick={handleStart} disabled={!intention.trim()} className={`flex-[2] py-4 rounded-2xl font-bold ${practiceMode === 'nails' ? 'bg-emerald-500 text-black' : 'bg-indigo-500 text-white'}`}>Погнали</button>
            </div>
          </div>
        </div>
      )}

      {/* Сообщение после медитации */}
      <AnimatePresence>
        {showMessageModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-md bg-[#1A1C2E] rounded-[3rem] p-10 text-center border border-indigo-500/20 space-y-8">
              <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto"><Heart size={40} fill="currentColor" className="animate-pulse" /></div>
              <p className="text-xl font-medium text-indigo-50">{currentMessage}</p>
              <button onClick={() => { if (gongRef.current) gongRef.current.pause(); setShowMessageModal(false); setShowMoodModal(true); }} className="w-full py-5 bg-indigo-500 text-white rounded-2xl font-bold">Принять с благодарностью</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модалка настроения */}
      {showMoodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className={`w-full max-w-md rounded-[2.5rem] p-8 space-y-8 text-center border ${practiceMode === 'nails' ? 'bg-zinc-900 border-zinc-800' : 'bg-[#1A1C2E] border-indigo-900/30'}`}>
            <h3 className="text-2xl font-bold text-white">Практика завершена!</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: <Smile size={32} />, label: 'Хорошо', emoji: '🙂', color: practiceMode === 'nails' ? 'text-emerald-500' : 'text-indigo-400' },
                { icon: <Meh size={32} />, label: 'Нормально', emoji: '😐', color: 'text-amber-500' },
                { icon: <Frown size={32} />, label: 'Тяжело', emoji: '😣', color: 'text-red-500' },
              ].map((m) => (
                <button key={m.emoji} onClick={() => submitPractice(m.emoji)} className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${m.color} bg-white/5`}>
                  {m.icon} <span className="text-xs font-bold uppercase">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
