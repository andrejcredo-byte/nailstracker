import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { Achievement } from '../constants/achievements';
import { X, Sparkles } from 'lucide-react';

interface AchievementPopupProps {
  achievements: Achievement[];
  onClose: () => void;
}

export const AchievementPopup: React.FC<AchievementPopupProps> = ({ achievements, onClose }) => {
  useEffect(() => {
    if (achievements.length > 0) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [achievements]);

  const [currentIndex, setCurrentIndex] = React.useState(0);

  if (achievements.length === 0) return null;

  const current = achievements[currentIndex];

  const handleNext = () => {
    if (currentIndex < achievements.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 1.1, opacity: 0 }}
          className="w-full max-w-md bg-zinc-900 rounded-[3rem] p-8 border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)] relative overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/20 blur-[80px] -z-10" />

          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center text-center space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-emerald-500">
                <Sparkles size={20} />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">Новое достижение!</span>
                <Sparkles size={20} />
              </div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                🎉 Поздравляем!
              </h2>
            </div>

            <div className="relative">
              <div className="w-32 h-32 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-black shadow-[0_0_30px_rgba(16,185,129,0.4)] relative z-10">
                <current.icon size={64} strokeWidth={2.5} />
              </div>
              {/* Animated Rings */}
              <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-[2.5rem] animate-ping opacity-20" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-white">{current.name}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {current.description}
              </p>
            </div>

            {achievements.length > 1 && (
              <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                Достижение {currentIndex + 1} из {achievements.length}
              </div>
            )}

            <button
              onClick={handleNext}
              className="w-full py-5 bg-emerald-500 text-black rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform"
            >
              {currentIndex < achievements.length - 1 ? 'ДАЛЕЕ' : 'КРУТО!'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
