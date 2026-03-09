import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function calculateStreak(sessions: any[], telegramId: string): number {
  if (!sessions || !telegramId) return 0;
  
  const userSessions = sessions
    .filter(s => s.telegram_id == telegramId && s.type === 'nails' && s.start_time && !isNaN(new Date(s.start_time).getTime()))
    .map(s => new Date(s.start_time).toDateString())
    .filter((v, i, a) => a.indexOf(v) === i) // unique dates
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (userSessions.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  // Check if practiced today or yesterday
  const lastPractice = new Date(userSessions[0]);
  lastPractice.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((currentDate.getTime() - lastPractice.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays > 1) return 0;

  for (let i = 0; i < userSessions.length; i++) {
    const practiceDate = new Date(userSessions[i]);
    practiceDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(currentDate);
    expectedDate.setDate(currentDate.getDate() - i);
    
    // If we started checking from today but they only practiced yesterday, 
    // we need to adjust the expected date if the first session is yesterday
    if (i === 0 && diffDays === 1) {
      // streak starts from yesterday
    }

    if (practiceDate.toDateString() === expectedDate.toDateString()) {
      streak++;
    } else if (i === 0 && diffDays === 1) {
        // Handle the case where they skipped today but practiced yesterday
        const yesterday = new Date(currentDate);
        yesterday.setDate(currentDate.getDate() - 1);
        if (practiceDate.toDateString() === yesterday.toDateString()) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1); // shift the window
        } else {
            break;
        }
    } else {
      break;
    }
  }

  return streak;
}
