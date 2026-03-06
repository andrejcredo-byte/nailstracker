import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { formatDuration } from '../utils';
import { Sword, Users, Trophy, Share2, RefreshCw, Loader2 } from 'lucide-react';

export const Challenges: React.FC = () => {
  const { user, data, refreshData } = useApp();
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const myChallenges = useMemo(() => {
    if (!user) return [];
    return (data.challenges || []).filter(c => c.creator_id === user.id || c.opponent_id === user.id);
  }, [data.challenges, user]);

  const activeChallenge = useMemo(() => {
    return myChallenges.find(c => c.status === 'active');
  }, [myChallenges]);

  const pendingChallenges = useMemo(() => {
    return myChallenges.filter(c => c.status === 'pending' && c.opponent_id === user?.id);
  }, [myChallenges, user]);

  const completedChallenges = useMemo(() => {
    return myChallenges.filter(c => c.status === 'completed').sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
  }, [myChallenges]);

  const handleCreateChallenge = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const challengeId = await useApp().createChallenge();
      
      const botUsername = 'nailstrackerbot'; 
      const shareUrl = `https://t.me/${botUsername}/app?startapp=challenge_${challengeId}`;
      
      const messageText = `🔥 ВЫЗОВ ПРИНЯТ? 🔥\n\nЯ вызываю тебя на 7-дневную битву в Sadhu Tracker! 🧘‍♂️🦶\n\nДавай узнаем, кто из нас сильнее духом и сможет простоять на гвоздях дольше за эту неделю. Победитель забирает всё! 🏆\n\nПринимай вызов по ссылке:`;
      
      const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(messageText)}`;
      
      const tg = (window as any).Telegram?.WebApp;
      
      // Haptic feedback for "Heavy" action
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('heavy');
      }

      if (tg?.openTelegramLink) {
        tg.openTelegramLink(telegramShareUrl);
      } else {
        window.open(telegramShareUrl, '_blank');
      }
      
      setShowCreate(false);
    } catch (e) {
      console.error('Failed to create challenge:', e);
    } finally {
      setLoading(false);
    }
  };

  const copyChallengeLink = async (id: string) => {
    const botUsername = 'nailstrackerbot';
    const shareUrl = `https://t.me/${botUsername}/app?startapp=challenge_${id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.showAlert) {
        tg.showAlert('Ссылка скопирована! Отправь её другу.');
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (activeChallenge) {
    const isCreator = activeChallenge.creator_id === user?.id;
    const myTotal = isCreator ? activeChallenge.creator_total_seconds : activeChallenge.opponent_total_seconds;
    const opponentTotal = isCreator ? activeChallenge.opponent_total_seconds : activeChallenge.creator_total_seconds;
    const opponentName = isCreator ? activeChallenge.opponent_name : activeChallenge.creator_name;
    const opponentPhoto = isCreator ? activeChallenge.opponent_photo : activeChallenge.creator_photo;
    
    const diff = myTotal - opponentTotal;
    const leading = diff >= 0;
    const daysLeft = Math.max(0, Math.ceil((new Date(activeChallenge.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-emerald-500 rounded-[2.5rem] p-6 text-black space-y-6 shadow-xl shadow-emerald-500/20"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center">
              <Sword size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase italic leading-none">Активный Челлендж</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{daysLeft} дней осталось</p>
            </div>
          </div>
          <Trophy size={24} className={leading ? 'animate-bounce' : 'opacity-20'} />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-center space-y-2">
            <img src={user?.photo} alt="Me" className="w-16 h-16 rounded-full border-4 border-black/10 mx-auto object-cover" />
            <div className="text-xs font-bold truncate">Я</div>
            <div className="text-xl font-black tracking-tighter">{formatDuration(myTotal)}</div>
          </div>
          
          <div className="text-2xl font-black italic opacity-20">VS</div>

          <div className="flex-1 text-center space-y-2">
            <img src={opponentPhoto || ''} alt="Opponent" className="w-16 h-16 rounded-full border-4 border-black/10 mx-auto object-cover" />
            <div className="text-xs font-bold truncate">{opponentName || 'Оппонент'}</div>
            <div className="text-xl font-black tracking-tighter">{formatDuration(opponentTotal)}</div>
          </div>
        </div>

        <div className="bg-black/10 rounded-2xl p-4 text-center">
          <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">
            {leading ? 'Ты лидируешь на' : 'Ты отстаешь на'}
          </div>
          <div className="text-lg font-black tracking-tighter">
            {formatDuration(Math.abs(diff))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/50 rounded-[2.5rem] p-6 border border-zinc-800 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center border border-indigo-500/20">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold">Челленджи</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">7-дневные битвы</p>
          </div>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-colors"
        >
          Вызвать друга
        </button>
      </div>

      <AnimatePresence>
        {pendingChallenges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Входящие вызовы</div>
            {pendingChallenges.map(challenge => (
              <div key={challenge.id} className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={challenge.creator_photo} alt={challenge.creator_name} className="w-10 h-10 rounded-full border border-zinc-800" />
                  <div>
                    <div className="text-sm font-bold">{challenge.creator_name}</div>
                    <div className="text-[10px] text-zinc-500">Вызывает тебя на битву!</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => copyChallengeLink(challenge.id)}
                    className="p-2 bg-zinc-800 text-zinc-400 rounded-xl hover:text-white transition-colors"
                  >
                    <Share2 size={16} />
                  </button>
                  <button 
                    onClick={() => useApp().acceptChallenge(challenge.id)}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-transform"
                  >
                    Принять
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {completedChallenges.length > 0 && (
        <div className="space-y-3">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">История битв</div>
          {completedChallenges.slice(0, 2).map(challenge => {
            const isCreator = challenge.creator_id === user?.id;
            const myTotal = isCreator ? challenge.creator_total_seconds : challenge.opponent_total_seconds;
            const opponentTotal = isCreator ? challenge.opponent_total_seconds : challenge.creator_total_seconds;
            const won = myTotal > opponentTotal;
            
            return (
              <div key={challenge.id} className="bg-zinc-800/30 border border-zinc-800/50 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${won ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-700/50 text-zinc-500'}`}>
                    <Trophy size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{won ? 'Победа!' : 'Поражение'}</div>
                    <div className="text-[10px] text-zinc-500">Против {isCreator ? challenge.opponent_name : challenge.creator_name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold">{formatDuration(myTotal)}</div>
                  <button 
                    onClick={() => setShowCreate(true)}
                    className="text-[8px] font-bold uppercase text-indigo-500 hover:underline"
                  >
                    Реванш
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeChallenge === undefined && pendingChallenges.length === 0 && completedChallenges.length === 0 && (
        <div className="bg-zinc-800/30 rounded-2xl p-8 text-center space-y-4 border border-zinc-800/50">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-600">
            <Sword size={32} />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-bold">Нет активных челленджей</div>
            <p className="text-xs text-zinc-500">Вызови друга и узнай, кто из вас сильнее духом!</p>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-zinc-900 rounded-[2.5rem] p-8 space-y-8 text-center border border-zinc-800"
          >
            <div className="space-y-2">
              <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sword size={32} />
              </div>
              <h3 className="text-2xl font-bold text-white">Вызвать друга</h3>
              <p className="text-zinc-500">7 дней. Кто простоит дольше — тот победил.</p>
            </div>
            
            <div className="bg-zinc-800/50 rounded-2xl p-6 text-left space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center text-xs font-bold">1</div>
                <div className="text-sm text-zinc-300">Создай ссылку-приглашение</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center text-xs font-bold">2</div>
                <div className="text-sm text-zinc-300">Отправь её другу в Telegram</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center text-xs font-bold">3</div>
                <div className="text-sm text-zinc-300">Битва начнется, как только он примет вызов</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-4 bg-zinc-800 text-white rounded-2xl font-bold"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateChallenge}
                disabled={loading}
                className="flex-[2] py-4 bg-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
                {loading ? 'Создаем...' : 'Отправить вызов'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
