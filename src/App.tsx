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
import { Loader2, Frown, RefreshCw, Trophy } from 'lucide-react';

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
    newlyUnlocked, clearNewlyUnlocked, showAchievements, setShowAchievements 
  } = useApp();
  console.log('Dashboard render:', { hasUser: !!user, loading, hasData: !!data, error });

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-zinc-500 font-medium animate-pulse tracking-wide">Загружаем твою энергию...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-12 overflow-x-hidden">
      {/* Error Toast */}
      {error && (
        <div className="fixed top-20 left-6 right-6 z-50 bg-red-500 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <Frown size={20} />
            <span className="text-sm font-bold">{error}</span>
          </div>
          <button onClick={() => window.location.reload()} className="p-1 hover:bg-white/20 rounded-lg">
            <RefreshCw size={16} />
          </button>
        </div>
      )}
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
          <header className="p-6 flex items-center justify-between sticky top-0 bg-black z-40 border-b border-zinc-900">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black tracking-tighter uppercase italic text-white">Sadhu Tracker</h1>
          <p className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase">Energy & Focus</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAchievements(true)}
            className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center border border-amber-500/20 active:scale-90 transition-transform"
          >
            <Trophy size={20} />
          </button>
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

      <main className="px-6 mt-6 space-y-10">
        <Quotes />
        <Timer />
        <LiveSessions />
        <PersonalStats />
        <Leaderboard />
      </main>

      {/* Achievements UI */}
      {showAchievements && <AchievementsScreen />}
      {newlyUnlocked.length > 0 && (
        <AchievementPopup 
          achievements={newlyUnlocked} 
          onClose={clearNewlyUnlocked} 
        />
      )}

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
