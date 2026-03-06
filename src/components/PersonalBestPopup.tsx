import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatDuration } from '../utils';

interface PersonalBestPopupProps {
  duration: number;
  onClose: () => void;
}

export const PersonalBestPopup: React.FC<PersonalBestPopupProps> = ({ duration, onClose }) => {
  useEffect(() => {
    const duration_confetti = 3 * 1000;
    const animationEnd = Date.now() + duration_confetti;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration_confetti);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 100 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.5, opacity: 0, y: 100 }}
        className="w-full max-w-sm bg-zinc-900 rounded-[3rem] p-8 border border-emerald-500/30 text-center space-y-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
        
        <div className="relative">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(16,185,129,0.3)]"
          >
            <Trophy size={48} className="text-black" />
          </motion.div>
          <motion.div
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute -top-2 -right-2 text-amber-400"
          >
            <Star fill="currentColor" size={24} />
          </motion.div>
          <motion.div
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
            className="absolute -bottom-2 -left-2 text-emerald-400"
          >
            <Sparkles size={24} />
          </motion.div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Новый рекорд!</h2>
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Ты превзошел самого себя</p>
        </div>

        <div className="bg-emerald-500/10 rounded-3xl p-6 border border-emerald-500/20">
          <div className="text-5xl font-black tracking-tighter text-emerald-500 tabular-nums">
            {formatDuration(duration)}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-sm active:scale-95 transition-transform"
        >
          Продолжить
        </button>
      </motion.div>
    </div>
  );
};
