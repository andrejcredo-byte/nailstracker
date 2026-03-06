import React from 'react';
import { motion } from 'motion/react';
import { X, Trophy, Lock, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getAchievementsProgress } from '../utils/achievementLogic';
import { ACHIEVEMENTS, AchievementCategory } from '../constants/achievements';

export const AchievementsScreen: React.FC = () => {
  const { user, data, setShowAchievements } = useApp();
  
  if (!user) return null;

  const progress = getAchievementsProgress(data.sessions, user.id);
  
  const categories: { id: AchievementCategory; name: string }[] = [
    { id: 'first_steps', name: 'Первые шаги' },
    { id: 'regularity', name: 'Регулярность' },
    { id: 'total_practice', name: 'Общая практика' },
    { id: 'extreme_sessions', name: 'Экстремальные сессии' },
  ];

  const formatProgress = (current: number, goal: number, unit: string) => {
    if (unit === 'seconds') {
      const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
      };
      return `${formatTime(current)} / ${formatTime(goal)}`;
    }
    if (unit === 'hours') {
      return `${(current / 3600).toFixed(1)} / ${(goal / 3600).toFixed(1)} ч`;
    }
    if (unit === 'days') {
      return `${current} / ${goal} дн.`;
    }
    if (unit === 'sessions') {
      return `${current} / ${goal} сес.`;
    }
    return `${current} / ${goal}`;
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black overflow-y-auto pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-md p-6 border-b border-zinc-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
            <Trophy size={24} />
          </div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">Достижения</h2>
        </div>
        <button 
          onClick={() => setShowAchievements(false)}
          className="p-3 bg-zinc-900 rounded-2xl text-zinc-400 hover:text-white transition-colors border border-zinc-800"
        >
          <X size={24} />
        </button>
      </header>

      <main className="p-6 space-y-12">
        {categories.map((category) => (
          <section key={category.id} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-900" />
              <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em]">
                {category.name}
              </h3>
              <div className="h-px flex-1 bg-zinc-900" />
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
              {progress
                .filter((p) => p.achievement.category === category.id)
                .map((p) => (
                  <motion.div
                    key={p.achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={`relative p-5 rounded-[2rem] border transition-all duration-500 ${
                      p.isUnlocked
                        ? 'bg-zinc-900 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]'
                        : 'bg-zinc-900/40 border-zinc-800/50 grayscale opacity-60'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center relative ${
                        p.isUnlocked ? 'bg-emerald-500 text-black shadow-lg' : 'bg-zinc-800 text-zinc-600'
                      }`}>
                        <p.achievement.icon size={32} strokeWidth={2.5} />
                        {p.isUnlocked && (
                          <div className="absolute -top-2 -right-2 bg-white text-emerald-500 rounded-full p-0.5 shadow-lg">
                            <CheckCircle2 size={16} fill="currentColor" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className={`text-sm font-bold ${p.isUnlocked ? 'text-white' : 'text-zinc-500'}`}>
                          {p.achievement.name}
                        </h4>
                        <p className="text-[10px] text-zinc-500 leading-tight">
                          {p.achievement.description}
                        </p>
                      </div>

                      {!p.isUnlocked && (
                        <div className="w-full space-y-2">
                          <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-zinc-600">
                            <span>Прогресс</span>
                            <span>{Math.round(p.progressPercent)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              whileInView={{ width: `${p.progressPercent}%` }}
                              className="h-full bg-zinc-600 rounded-full"
                            />
                          </div>
                          <div className="text-[10px] font-mono text-zinc-600">
                            {formatProgress(p.currentValue, p.achievement.goal, p.achievement.unit)}
                          </div>
                        </div>
                      )}
                      
                      {p.isUnlocked && (
                        <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          Разблокировано
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};
