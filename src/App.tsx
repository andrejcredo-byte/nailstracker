/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppProvider, useApp } from './context/AppContext';
import { Timer } from './components/Timer';
import { LiveSessions } from './components/LiveSessions';
import { Leaderboard } from './components/Leaderboard';
import { PersonalStats } from './components/PersonalStats';
import { SocialFeed } from './components/SocialFeed';
import { Loader2, Frown } from 'lucide-react';

function Dashboard() {
  const { user, loading, data, refreshData } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-zinc-500 font-medium animate-pulse tracking-wide">Загружаем твою энергию...</p>
      </div>
    );
  }

  if (!user) {
    return (
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
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-12">
      {/* Header */}
      <header className="p-6 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-40 border-b border-zinc-900/50">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black tracking-tighter uppercase italic text-white">Sadhu Tracker</h1>
          <p className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase">Energy & Focus</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden xs:block">
            <div className="text-sm font-bold truncate max-w-[120px]">{user.name}</div>
            <div className="text-[10px] text-zinc-500 font-mono">@{user.username || 'user'}</div>
          </div>
          <img 
            src={user.photo} 
            alt={user.name} 
            className="w-10 h-10 rounded-full border-2 border-zinc-800 object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
            }}
          />
        </div>
      </header>

      <main className="px-6 mt-6 space-y-10">
        {!data ? (
          <div className="py-12 text-center space-y-4 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800">
            <p className="text-zinc-500 text-sm">Проблемы с подключением к базе данных...</p>
            <button 
              onClick={refreshData}
              className="text-emerald-500 text-xs font-bold uppercase tracking-widest"
            >
              Попробовать снова
            </button>
          </div>
        ) : (
          <>
            <LiveSessions />
            <Timer />
            <SocialFeed />
            <PersonalStats />
            <Leaderboard />
          </>
        )}
      </main>

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
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}
