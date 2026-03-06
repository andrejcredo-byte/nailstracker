import { ACHIEVEMENTS, Achievement } from '../constants/achievements';
import { calculateStreak } from '../utils';

export interface AchievementProgress {
  achievement: Achievement;
  currentValue: number;
  isUnlocked: boolean;
  progressPercent: number;
}

export function getAchievementsProgress(sessions: any[], telegramId: string): AchievementProgress[] {
  if (!sessions || !telegramId) return ACHIEVEMENTS.map(a => ({
    achievement: a,
    currentValue: 0,
    isUnlocked: false,
    progressPercent: 0
  }));

  const userSessions = sessions.filter(s => s.telegram_id === telegramId);
  const totalSeconds = userSessions.reduce((acc, s) => acc + (Number(s.duration_seconds) || 0), 0);
  const bestSingleSession = Math.max(0, ...userSessions.map(s => Number(s.duration_seconds) || 0));
  const streak = calculateStreak(sessions, telegramId);
  const totalSessions = userSessions.length;

  return ACHIEVEMENTS.map(achievement => {
    let currentValue = 0;
    
    switch (achievement.category) {
      case 'first_steps':
        if (achievement.id === 'first_step') {
          currentValue = totalSessions;
        } else {
          currentValue = bestSingleSession;
        }
        break;
      case 'regularity':
        currentValue = streak;
        break;
      case 'total_practice':
        currentValue = totalSeconds;
        break;
      case 'extreme_sessions':
        currentValue = bestSingleSession;
        break;
    }

    const isUnlocked = currentValue >= achievement.goal;
    const progressPercent = Math.min(100, (currentValue / achievement.goal) * 100);

    return {
      achievement,
      currentValue,
      isUnlocked,
      progressPercent
    };
  });
}

export function checkNewAchievements(oldSessions: any[], newSessions: any[], telegramId: string): Achievement[] {
  const oldProgress = getAchievementsProgress(oldSessions, telegramId);
  const newProgress = getAchievementsProgress(newSessions, telegramId);

  const newlyUnlocked: Achievement[] = [];

  newProgress.forEach((newP, index) => {
    const oldP = oldProgress[index];
    if (newP.isUnlocked && !oldP.isUnlocked) {
      newlyUnlocked.push(newP.achievement);
    }
  });

  return newlyUnlocked;
}
