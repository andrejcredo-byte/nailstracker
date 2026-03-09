import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { formatDuration, calculateStreak } from '../utils';
import { Calendar, Info } from 'lucide-react';

export const Heatmap: React.FC = () => {
  const { data, user, practiceMode } = useApp();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const isMeditation = practiceMode === 'meditation';

  const mySessions = useMemo(() => {
    if (!user) return [];
    return data.sessions.filter(s => s.telegram_id === user.id && s.type === practiceMode);
  }, [data.sessions, user, practiceMode]);

  const streak = useMemo(() => {
    if (!user) return 0;
    // We need a way to calculate streak for specific type
    return calculateStreak(data.sessions.filter(s => s.type === practiceMode), user.id);
  }, [data.sessions, user, practiceMode]);

  const last30Days = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const daySessions = mySessions.filter(s => s.start_time.startsWith(dateStr));
      const totalSeconds = daySessions.reduce((acc, s) => acc + s.duration_seconds, 0);
      
      days.push({
        date: dateStr,
        totalSeconds,
        count: daySessions.length,
        label: d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
      });
    }
    return days;
  }, [mySessions]);

  const getIntensityClass = (seconds: number) => {
    if (seconds === 0) return 'bg-zinc-800/50';
    
    if (isMeditation) {
      if (seconds < 600) return 'bg-indigo-900/40 text-indigo-400'; // < 10 min
      if (seconds < 1200) return 'bg-indigo-700/60 text-indigo-200'; // < 20 min
      if (seconds < 2400) return 'bg-indigo-500 text-white'; // < 40 min
      return 'bg-indigo-400 text-white ring-2 ring-indigo-400/50'; // > 40 min
    }

    if (seconds < 300) return 'bg-emerald-900/40 text-emerald-400'; // < 5 min
    if (seconds < 900) return 'bg-emerald-700/60 text-emerald-200'; // < 15 min
    if (seconds < 1800) return 'bg-emerald-500 text-black'; // < 30 min
    return 'bg-emerald-400 text-black ring-2 ring-emerald-400/50'; // > 30 min
  };

  const selectedDayData = useMemo(() => {
    if (!selectedDay) return null;
    return last30Days.find(d => d.date === selectedDay);
  }, [selectedDay, last30Days]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[2.5rem] p-6 border space-y-6 transition-colors duration-700 ${
        isMeditation ? 'bg-indigo-900/10 border-indigo-900/20' : 'bg-zinc-900/50 border-zinc-800'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors duration-700 ${
            isMeditation ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
          }`}>
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Карта дисциплины</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              {isMeditation ? 'Медитация' : 'Гвозди'} • 30 дней
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-black tracking-tighter transition-colors duration-700 ${
            isMeditation ? 'text-indigo-400' : 'text-emerald-500'
          }`}>{streak}</div>
          <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Дней подряд</div>
        </div>
      </div>

      <div className="grid grid-cols-10 gap-2">
        {last30Days.map((day) => (
          <motion.button
            key={day.date}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedDay(day.date === selectedDay ? null : day.date)}
            className={`aspect-square rounded-lg transition-all duration-300 ${getIntensityClass(day.totalSeconds)} ${selectedDay === day.date ? 'ring-2 ring-white' : ''}`}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedDayData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/10">
              <div className="space-y-1">
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{selectedDayData.label}</div>
                <div className="text-sm font-bold">
                  {selectedDayData.totalSeconds > 0 
                    ? `Практика: ${formatDuration(selectedDayData.totalSeconds)}`
                    : 'Нет практики'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Сессий</div>
                <div className="text-sm font-bold">{selectedDayData.count}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm bg-zinc-800/50" />
          <div className={`w-2 h-2 rounded-sm ${isMeditation ? 'bg-indigo-900/40' : 'bg-emerald-900/40'}`} />
          <div className={`w-2 h-2 rounded-sm ${isMeditation ? 'bg-indigo-700/60' : 'bg-emerald-700/60'}`} />
          <div className={`w-2 h-2 rounded-sm ${isMeditation ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
          <div className={`w-2 h-2 rounded-sm ${isMeditation ? 'bg-indigo-400' : 'bg-emerald-400'}`} />
        </div>
        <div className="flex items-center gap-1 text-[8px] text-zinc-500 font-bold uppercase tracking-widest">
          <Info size={10} />
          Нажми на день для деталей
        </div>
      </div>
    </motion.div>
  );
};
