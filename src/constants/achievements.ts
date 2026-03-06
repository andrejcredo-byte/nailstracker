import { LucideIcon, Footprints, Timer, Zap, Target, Medal, Crown, Flame, Trophy, Calendar, Clock, Star, Shield, Heart, Zap as Bolt } from 'lucide-react';

export type AchievementCategory = 'first_steps' | 'regularity' | 'total_practice' | 'extreme_sessions';

export interface Achievement {
  id: string;
  category: AchievementCategory;
  name: string;
  description: string;
  icon: any;
  goal: number; // in seconds, days, or sessions depending on category
  unit: 'seconds' | 'days' | 'sessions' | 'hours';
}

export const ACHIEVEMENTS: Achievement[] = [
  // 1. Первые шаги
  {
    id: 'first_step',
    category: 'first_steps',
    name: 'Первый шаг',
    description: 'Твоя самая первая сессия на гвоздях',
    icon: Footprints,
    goal: 1,
    unit: 'sessions'
  },
  {
    id: '60_seconds',
    category: 'first_steps',
    name: '60 секунд мужества',
    description: 'Простоять 1 минуту',
    icon: Timer,
    goal: 60,
    unit: 'seconds'
  },
  {
    id: '3_minutes',
    category: 'first_steps',
    name: '3 минуты силы',
    description: 'Простоять 3 минуты',
    icon: Zap,
    goal: 180,
    unit: 'seconds'
  },
  {
    id: '5_minutes',
    category: 'first_steps',
    name: '5 минут',
    description: 'Важный психологический барьер преодолен',
    icon: Target,
    goal: 300,
    unit: 'seconds'
  },
  {
    id: '10_minutes',
    category: 'first_steps',
    name: '10 минут',
    description: 'Серьезная и глубокая практика',
    icon: Medal,
    goal: 600,
    unit: 'seconds'
  },
  {
    id: '20_minutes',
    category: 'first_steps',
    name: '20 минут',
    description: 'Уровень глубокой медитации',
    icon: Crown,
    goal: 1200,
    unit: 'seconds'
  },

  // 2. Регулярность
  {
    id: 'streak_3',
    category: 'regularity',
    name: '3 дня подряд',
    description: 'Начало положено, дисциплина крепнет',
    icon: Flame,
    goal: 3,
    unit: 'days'
  },
  {
    id: 'streak_7',
    category: 'regularity',
    name: '7 дней подряд',
    description: 'Целая неделя осознанности',
    icon: Calendar,
    goal: 7,
    unit: 'days'
  },
  {
    id: 'streak_14',
    category: 'regularity',
    name: '14 дней подряд',
    description: 'Две недели — привычка формируется',
    icon: Star,
    goal: 14,
    unit: 'days'
  },
  {
    id: 'streak_30',
    category: 'regularity',
    name: '30 дней подряд',
    description: 'Месяц на гвоздях — ты кремень!',
    icon: Shield,
    goal: 30,
    unit: 'days'
  },
  {
    id: 'streak_90',
    category: 'regularity',
    name: '90 дней подряд',
    description: 'Три месяца — новый уровень жизни',
    icon: Heart,
    goal: 90,
    unit: 'days'
  },
  {
    id: 'streak_365',
    category: 'regularity',
    name: 'Год на гвоздях',
    description: 'Легендарное достижение. Ты — мастер',
    icon: Trophy,
    goal: 365,
    unit: 'days'
  },

  // 3. Общая практика
  {
    id: 'total_1h',
    category: 'total_practice',
    name: '1 час практики',
    description: 'Суммарное время на гвоздях',
    icon: Clock,
    goal: 3600,
    unit: 'seconds'
  },
  {
    id: 'total_5h',
    category: 'total_practice',
    name: '5 часов практики',
    description: 'Ты уже опытный практик',
    icon: Clock,
    goal: 18000,
    unit: 'seconds'
  },
  {
    id: 'total_10h',
    category: 'total_practice',
    name: '10 часов практики',
    description: 'Десять часов чистого фокуса',
    icon: Medal,
    goal: 36000,
    unit: 'seconds'
  },
  {
    id: 'total_50h',
    category: 'total_practice',
    name: '50 часов практики',
    description: 'Половина пути к сотне',
    icon: Star,
    goal: 180000,
    unit: 'seconds'
  },
  {
    id: 'total_100h',
    category: 'total_practice',
    name: '100 часов практики',
    description: 'Невероятный результат и выдержка',
    icon: Crown,
    goal: 360000,
    unit: 'seconds'
  },

  // 4. Экстремальные сессии
  {
    id: 'single_15',
    category: 'extreme_sessions',
    name: '15 минут за раз',
    description: 'Предел для многих, но не для тебя',
    icon: Bolt,
    goal: 900,
    unit: 'seconds'
  },
  {
    id: 'single_30',
    category: 'extreme_sessions',
    name: '30 минут за раз',
    description: 'Железная воля и спокойствие',
    icon: Bolt,
    goal: 1800,
    unit: 'seconds'
  },
  {
    id: 'single_45',
    category: 'extreme_sessions',
    name: '45 минут за раз',
    description: 'За гранью обычных возможностей',
    icon: Trophy,
    goal: 2700,
    unit: 'seconds'
  },
  {
    id: 'single_60',
    category: 'extreme_sessions',
    name: 'Час на гвоздях',
    description: 'Абсолютный рекорд выносливости',
    icon: Crown,
    goal: 3600,
    unit: 'seconds'
  },
];
