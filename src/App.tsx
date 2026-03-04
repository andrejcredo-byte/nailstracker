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
import { Loader2 } from 'lucide-react';

function Dashboard() {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
        <p className="text-zinc-500 font-medium animate-pulse">Загружаем твою энергию...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-12">
      {/* Header */}
      <header className="p-6 flex items-center justify-between sticky top-0 bg-black/80 backdrop-blur-md z-40">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">Трекер Гвоздестояния</h1>
          <p className="text-zinc-500 text-xs font-bold tracking-widest uppercase">Твой путь к себе</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold">{user?.name}</div>
            <div className="text-xs text-zinc-500">@{user?.username}</div>
          </div>
          <img 
            src={user?.photo} 
            alt={user?.name} 
            className="w-10 h-10 rounded-full border-2 border-zinc-800"
            referrerPolicy="no-referrer"
          />
        </div>
      </header>

      <main className="px-6 space-y-10">
        {/* Live Section */}
        <LiveSessions />

        {/* Timer Section */}
        <Timer />

        {/* Social Section */}
        <SocialFeed />

        {/* Stats Section */}
        <PersonalStats />

        {/* Leaderboard Section */}
        <Leaderboard />
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
