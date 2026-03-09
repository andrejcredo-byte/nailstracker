import React from 'react';
import { useApp } from '../context/AppContext';
import { Terminal, X, AlertCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DebugLogs: React.FC = () => {
  const { logs } = useApp();
  const [isOpen, setIsOpen] = React.useState(false);

  if (logs.length === 0) return null;

  const hasError = logs.some(l => l.type === 'error');

  return (
    <div className="fixed bottom-20 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 max-h-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-2 text-zinc-400">
                <Terminal size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Логи системы</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[10px]">
              {logs.map((log, i) => (
                <div key={i} className={`p-2 rounded-lg flex gap-2 ${log.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800/50 text-zinc-400'}`}>
                  <span className="opacity-50 shrink-0">{log.timestamp}</span>
                  <span className="break-words">{log.message}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 ${
          hasError ? 'bg-red-500 text-white animate-pulse' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
        }`}
      >
        {hasError ? <AlertCircle size={24} /> : <Terminal size={24} />}
      </button>
    </div>
  );
};
