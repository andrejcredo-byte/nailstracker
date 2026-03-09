/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Timer } from './components/Timer';
import { LiveSessions } from './components/LiveSessions';
import { Leaderboard } from './components/Leaderboard';
import { PersonalStats } from './components/PersonalStats';
import { Quotes } from './components/Quotes';
import { AchievementPopup } from './components/AchievementPopup';
import { AchievementsScreen } from './components/AchievementsScreen';
import { Heatmap } from './components/Heatmap';
import { Challenges } from './components/Challenges';
import { PersonalBestPopup } from './components/PersonalBestPopup';
import { Loader2, Frown, RefreshCw, Trophy, Sword } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto">
            <RefreshCw size={40} className="animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Что-то пошло не так</h2>
            <p className="text-zinc-500">Произошла ошибка при отрисовке интерфейса.</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-white text-black rounded-2xl font-bold"
          >
            Перезагрузить приложение
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function Dashboard() {
  const { 
    user, loading, error, data, refreshData, 
    newlyUnlocked, clearNewlyUnlocked, showAchievements, setShowAchievements,
    newPersonalBest, clearNewPersonalBest, acceptChallenge,
    practiceMode, setPracticeMode
  } = useApp();

  React.useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    const params = new URLSearchParams(window.location.search);
    
    // Check both URL and Telegram start_param
    const challengeId = params.get('challenge') || tg?.initDataUnsafe?.start_param;
    
    if (challengeId && user && !user.is_mock) {
      // If it's a Telegram start_param, it might be prefixed (e.g. challenge_abc123)
      const cleanId = challengeId.startsWith('challenge_') 
        ? challengeId.replace('challenge_', '') 
        : challengeId;

      // Check if we already handled this ID to avoid infinite loops
      const hasHandled = sessionStorage.getItem(`handled_challenge_${cleanId}`);
      if (hasHandled) return;

      acceptChallenge(cleanId).then(() => {
        sessionStorage.setItem(`handled_challenge_${cleanId}`, 'true');
        // Clear param from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Show success notification via Telegram
        if (tg?.showAlert) {
          tg.showAlert('Вызов принят! Битва началась. ⚔️');
        }
      }).catch(err => {
        console.error('Challenge accept error:', err);
        // Only show error if it's not "already accepted" or similar
        if (tg?.showAlert) {
          tg.showAlert('Не удалось принять вызов. Возможно, он уже неактивен или ты уже в битве.');
        }
      });
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
          <Loader2 className="text-emerald-500" size={40} />
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]"
        >
          Загружаем твою энергию...
        </motion.p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-700 pb-12 overflow-x-hidden ${
      practiceMode === 'nails' 
        ? 'bg-black text-white selection:bg-emerald-500 selection:text-black' 
        : 'bg-[#0F1121] text-[#E0E7FF] selection:bg-[#A5B4FC] selection:text-black'
    }`}>
      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-6 right-6 z-50 bg-red-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Frown size={20} />
              <span className="text-sm font-bold">{error}</span>
            </div>
            <button onClick={() => window.location.reload()} className="p-1 hover:bg-white/20 rounded-lg">
              <RefreshCw size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Mode Banner */}
      {user.is_mock && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">
            Режим предпросмотра: практика не будет сохранена в историю
          </span>
        </div>
      )}

      {/* Header */}
      {!user ? (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <Frown size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Ошибка авторизации</h2>
            <p className="text-zinc-500">Не удалось получить данные профиля из Telegram.</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-white text-black rounded-2xl font-bold"
          >
            Обновить страницу
          </button>
        </div>
      ) : (
        <>
          <header className={`p-6 flex items-center justify-between sticky top-0 backdrop-blur-xl z-40 border-b transition-colors duration-700 ${
            practiceMode === 'nails' ? 'bg-black/80 border-zinc-900' : 'bg-[#0F1121]/80 border-indigo-900/30'
          }`}>
            <div className="space-y-0.5">
              <h1 className="text-2xl font-black tracking-tighter uppercase italic text-white">ZenFlow</h1>
              <p className={`text-[10px] font-bold tracking-[0.2em] uppercase transition-colors duration-700 ${
                practiceMode === 'nails' ? 'text-zinc-500' : 'text-indigo-400'
              }`}>Energy & Focus</p>
            </div>
            <div className="flex items-center gap-3">
              {practiceMode === 'nails' && (
                <button 
                  onClick={() => setShowAchievements(true)}
                  className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center border border-amber-500/20 active:scale-90 transition-transform"
                >
                  <Trophy size={20} />
                </button>
              )}
              <div className="text-right hidden xs:block">
                <div className="text-sm font-bold truncate max-w-[120px]">{user.first_name}</div>
                <div className="text-[10px] text-zinc-500 font-mono">@{user.username || 'user'}</div>
              </div>
              <img 
                src={user.photo} 
                alt={user.first_name} 
                className="w-10 h-10 rounded-full border-2 border-zinc-800 object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name)}&background=random`;
                }}
              />
            </div>
          </header>

          <main className="px-6 mt-6 space-y-8">
            {/* Mode Switcher */}
            <div className="flex justify-center">
              <div className={`p-1 rounded-2xl flex gap-1 transition-colors duration-700 ${
                practiceMode === 'nails' ? 'bg-zinc-900' : 'bg-indigo-900/30'
              }`}>
                <button
                  onClick={() => setPracticeMode('nails')}
                  className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                    practiceMode === 'nails' 
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Гвозди
                </button>
                <button
                  onClick={() => setPracticeMode('meditation')}
                  className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                    practiceMode === 'meditation' 
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Медитация
                </button>
              </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Quotes />
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Timer />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Heatmap />
            </motion.div>

            {practiceMode === 'nails' && (
              <>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Challenges />
                </motion.div>
                
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                  <LiveSessions />
                </motion.div>
              </>
            )}
            
            {practiceMode === 'nails' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <PersonalStats />
              </motion.div>
            )}

            {practiceMode === 'nails' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                <Leaderboard />
              </motion.div>
            )}
          </main>

          {/* Popups */}
          <AnimatePresence>
            {showAchievements && <AchievementsScreen key="achievements" />}
            
            {newlyUnlocked.length > 0 && (
              <AchievementPopup 
                key="achievement-popup"
                achievements={newlyUnlocked} 
                onClose={clearNewlyUnlocked} 
              />
            )}

            {newPersonalBest && (
              <PersonalBestPopup 
                key="pb-popup"
                duration={newPersonalBest}
                onClose={clearNewPersonalBest}
              />
            )}
          </AnimatePresence>
        </>
      )}

      <footer className="mt-12 px-6 py-8 border-t border-zinc-900 text-center">
        <p className="text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-bold">
          Создано для осознанной практики • 2026
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Dashboard />
      </AppProvider>
    </ErrorBoundary>
  );
}
