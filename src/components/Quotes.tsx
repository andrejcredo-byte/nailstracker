import React, { useState, useEffect } from 'react';
import { Quote, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const QUOTES = [
  "Твое тело — это храм, но только если ты за ним ухаживаешь.",
  "Боль — это просто информация. Слушай её, но не давай ей управлять собой.",
  "Самый сложный шаг — это шаг на гвозди. Остальное — просто дыхание.",
  "Тишина внутри рождается в моменты самого сильного напряжения.",
  "Ты сильнее, чем твой ум пытается тебе внушить.",
  "Практика — это не то, что ты делаешь. Это то, кем ты становишься.",
  "Гвозди не меняют жизнь. Они меняют тебя, а ты меняешь жизнь.",
  "Дыши. В каждом вдохе — новая возможность начать сначала.",
  "Твое спокойствие — твоя суперсила.",
  "Маленькие шаги каждый день приводят к большим переменам."
];

export const Quotes: React.FC = () => {
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    setQuoteIdx(Math.floor(Math.random() * QUOTES.length));
  }, []);

  const nextQuote = () => {
    setQuoteIdx((prev) => (prev + 1) % QUOTES.length);
  };

  return (
    <div className="bg-zinc-900/50 rounded-[2.5rem] p-8 border border-zinc-800 relative overflow-hidden group">
      <div className="absolute -top-4 -left-4 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors">
        <Quote size={120} />
      </div>
      
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-500">
            <Quote size={14} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Мудрость дня</span>
          </div>
          <button 
            onClick={nextQuote}
            className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.p 
            key={quoteIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-xl font-medium text-white leading-relaxed italic"
          >
            «{QUOTES[quoteIdx]}»
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};
