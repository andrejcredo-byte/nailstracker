import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Pause, Smile, Meh, Frown, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDuration } from '../utils';
import confetti from 'canvas-confetti';

export const Timer: React.FC = () => {
  const { user, data, startPractice, endPractice } = useApp();
  const [isPracticing, setIsPracticing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showIntentionModal, setShowIntentionModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [intention, setIntention] = useState('');
  const timerRef = useRef<any>(null);

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
    if (isPracticing && !isPaused) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPracticing, isPaused]);

  const handleStart = () => {
    if (!intention.trim()) return;
    
    // Haptic feedback on start
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }

    const currentIntention = intention;
    setShowIntentionModal(false);
    setIsPracticing(true);
    setSeconds(0);
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

    // Trigger haptic feedback
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('medium');
      // Also try notification for good measure if supported
      setTimeout(() => {
        tg.HapticFeedback.notificationOccurred('success');
      }, 50);
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
      {!isPracticing ? (
        <button
          onClick={() => setShowIntentionModal(true)}
          className="w-full py-8 bg-emerald-500 text-black rounded-3xl font-bold text-2xl flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-transform"
        >
          <Play fill="currentColor" size={28} />
          НАЧАТЬ ПРАКТИКУ
        </button>
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
              className="flex-1 py-4 bg-zinc-800 rounded-2xl flex items-center justify-center gap-2 font-bold active:bg-zinc-700"
            >
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
              {isPaused ? 'Продолжить' : 'Пауза'}
            </button>
            <button
              onClick={handleEnd}
              className="flex-1 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl flex items-center justify-center gap-2 font-bold active:bg-red-500/20"
            >
              <Square size={20} fill="currentColor" />
              Завершить
            </button>
          </div>
        </div>
      )}

      {/* Intention Modal */}
      {showIntentionModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md bg-zinc-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 space-y-6 border-t border-zinc-800 sm:border">
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
                className="flex-1 py-4 bg-zinc-800 text-white rounded-2xl font-bold"
              >
                Отмена
              </button>
              <button
                onClick={handleStart}
                disabled={!intention.trim()}
                className="flex-[2] py-4 bg-emerald-500 text-black rounded-2xl font-bold disabled:opacity-50"
              >
                Погнали
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mood Modal */}
      {showMoodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
          <div className="w-full max-w-md bg-zinc-900 rounded-[2.5rem] p-8 space-y-8 text-center border border-zinc-800">
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
          </div>
        </div>
      )}
    </div>
  );
};
