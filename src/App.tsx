import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  Calendar, 
  Target as TargetIcon, 
  Menu, 
  X,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  PieChart,
  Trophy,
  Settings,
  Bell,
  Zap,
  CreditCard,
  Globe,
  Sparkles,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import FinanceTracker from './components/FinanceTracker';
import DailySchedule from './components/DailySchedule';
import DailyTargets from './components/DailyTargets';
import FinanceReports from './components/FinanceReports';
import AchievementSystem from './components/AchievementSystem';
import NotificationSettings from './components/NotificationSettings';
import AIPlanner from './components/AIPlanner';
import DigitalClock from './components/DigitalClock';
import { Logo } from './components/Logo';
import Login from './components/Login';
import { View, Transaction, Task, Target } from './types';
import { useLanguage } from './contexts/LanguageContext';
import { useAuth } from './contexts/AuthContext';
import { notificationService } from './services/notificationService';

import { ErrorBoundary } from './components/ErrorBoundary';
import { useData } from './contexts/DataContext';
import { useTheme } from './contexts/ThemeContext';

interface UINotification {
  id: string;
  title: string;
  message: string;
  type: 'schedule' | 'finance' | 'target' | 'achievement';
  time: string;
}

export default function App() {
  const { user, loading, signOut } = useAuth();
  const { transactions, tasks, targets, unlockedAchievements, dailyQuote, notificationSettings } = useData();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<UINotification[]>([]);
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  // Check for localStorage availability
  useEffect(() => {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
    } catch (e) {
      console.error('LocalStorage is not available:', e);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Initial check
    notificationService.checkAndNotify(notificationSettings, targets, tasks);

    // Check every minute
    const interval = setInterval(() => {
      notificationService.checkAndNotify(notificationSettings, targets, tasks);
    }, 60000);

    return () => clearInterval(interval);
  }, [notificationSettings, targets, tasks]);

  useEffect(() => {
    const generateNotifications = () => {
      const newNotifications: UINotification[] = [];
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // 1. Check Tasks
      const todaysTasks = tasks.filter(t => t.date === today && !t.completed);
      if (todaysTasks.length > 0) {
        newNotifications.push({
          id: 'tasks_today',
          title: t('schedule'),
          message: `${todaysTasks.length} ${t('tasksRemaining')}`,
          type: 'schedule',
          time: t('justNow')
        });
      }

      // 2. Check Targets
      const nearCompletionTargets = targets.filter(t => (t.currentValue / t.targetValue) >= 0.8 && t.currentValue < t.targetValue);
      if (nearCompletionTargets.length > 0) {
        newNotifications.push({
          id: 'targets_near',
          title: t('targets'),
          message: `${nearCompletionTargets.length} ${t('targetsNear')}`,
          type: 'target',
          time: t('justNow')
        });
      }

      // 3. Check Achievements
      const recentAchievements = unlockedAchievements.filter(a => {
        if (!a.unlockedAt) return false;
        const unlockDate = new Date(a.unlockedAt);
        // Unlocked in the last 24 hours
        return (now.getTime() - unlockDate.getTime()) < 24 * 60 * 60 * 1000;
      });
      
      if (recentAchievements.length > 0) {
        newNotifications.push({
          id: 'achievements_recent',
          title: t('achievements'),
          message: `${recentAchievements.length} ${t('achievementsRecent')}`,
          type: 'achievement',
          time: t('todayText')
        });
      }

      setNotifications(newNotifications);
    };

    generateNotifications();
    const interval = setInterval(generateNotifications, 60000); // Update every minute
    
    return () => {
      clearInterval(interval);
    };
  }, [t, tasks, targets, unlockedAchievements]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-deep-space-blue/20 dark:border-blue-400/20 border-t-deep-space-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Helper to get summary data for dashboard
  const getSummary = () => {
    const balance = transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
    const completedTasks = tasks.filter(t => t.completed).length;
    const avgTargetProgress = targets.length > 0 
      ? targets.reduce((acc, t) => acc + (t.currentValue / t.targetValue), 0) / targets.length 
      : 0;

    return { balance, completedTasks, totalTasks: tasks.length, targetProgress: avgTargetProgress * 100 };
  };

  const summary = getSummary();

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'finance', label: t('finance'), icon: Wallet },
    { id: 'reports', label: t('analytics'), icon: PieChart },
    { id: 'schedule', label: t('schedule'), icon: Calendar },
    { id: 'ai_planner', label: t('aiPlanner'), icon: Sparkles },
    { id: 'targets', label: t('targets'), icon: TargetIcon },
    { id: 'achievements', label: t('achievements'), icon: Trophy },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  const renderView = () => {
    return (
      <ErrorBoundary>
        {(() => {
          switch (activeView) {
            case 'finance': return (
        <div className="relative -m-4 lg:-m-8 p-4 lg:p-8 min-h-[calc(100vh-4rem)] overflow-hidden rounded-3xl">
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
            style={{ 
              backgroundImage: 'url("https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2011&auto=format&fit=crop")',
            }}
          />
          <div className="absolute inset-0 z-0 bg-white/40 backdrop-blur-[2px]" />
          <div className="relative z-10">
            <FinanceTracker />
          </div>
        </div>
      );
      case 'reports': return (
        <div className="relative -m-4 lg:-m-8 p-4 lg:p-8 min-h-[calc(100vh-4rem)] overflow-hidden rounded-3xl">
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
            style={{ 
              backgroundImage: 'url("https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop")',
            }}
          />
          <div className="absolute inset-0 z-0 bg-white/40 backdrop-blur-[2px]" />
          <div className="relative z-10">
            <FinanceReports />
          </div>
        </div>
      );
      case 'schedule': return (
        <div className="relative -m-4 lg:-m-8 p-4 lg:p-8 min-h-[calc(100vh-4rem)] overflow-hidden rounded-3xl">
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
            style={{ 
              backgroundImage: 'url("https://images.unsplash.com/photo-1506784365847-bbad939e9335?q=80&w=2068&auto=format&fit=crop")',
            }}
          />
          <div className="absolute inset-0 z-0 bg-white/40 backdrop-blur-[2px]" />
          <div className="relative z-10">
            <DailySchedule />
          </div>
        </div>
      );
      case 'ai_planner': return (
        <div className="relative -m-4 lg:-m-8 p-4 lg:p-8 min-h-[calc(100vh-4rem)] overflow-hidden rounded-3xl">
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
            style={{ 
              backgroundImage: 'url("https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=2070&auto=format&fit=crop")',
            }}
          />
          <div className="absolute inset-0 z-0 bg-white/40 backdrop-blur-[2px]" />
          <div className="relative z-10">
            <AIPlanner />
          </div>
        </div>
      );
      case 'targets': return (
        <div className="relative -m-4 lg:-m-8 p-4 lg:p-8 min-h-[calc(100vh-4rem)] overflow-hidden rounded-3xl">
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
            style={{ 
              backgroundImage: 'url("https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?q=80&w=2070&auto=format&fit=crop")',
            }}
          />
          <div className="absolute inset-0 z-0 bg-white/40 backdrop-blur-[2px]" />
          <div className="relative z-10">
            <DailyTargets />
          </div>
        </div>
      );
      case 'achievements': return (
        <div className="relative -m-4 lg:-m-8 p-4 lg:p-8 min-h-[calc(100vh-4rem)] overflow-hidden rounded-3xl">
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
            style={{ 
              backgroundImage: 'url("https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop")',
            }}
          />
          <div className="absolute inset-0 z-0 bg-white/40 backdrop-blur-[2px]" />
          <div className="relative z-10">
            <AchievementSystem />
          </div>
        </div>
      );
      case 'settings': return (
        <div className="relative -m-4 lg:-m-8 p-4 lg:p-8 min-h-[calc(100vh-4rem)] overflow-hidden rounded-3xl">
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
            style={{ 
              backgroundImage: 'url("https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop")',
            }}
          />
          <div className="absolute inset-0 z-0 bg-white/40 backdrop-blur-[2px]" />
          <div className="relative z-10">
            <NotificationSettings />
          </div>
        </div>
      );
      default: return (
        <div className="relative -m-4 lg:-m-8 p-4 lg:p-8 min-h-[calc(100vh-4rem)] overflow-hidden rounded-3xl">
          {/* Background Image */}
          <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-50"
            style={{ 
              backgroundImage: 'url("https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop")',
            }}
          />
          {/* Subtle Overlay */}
          <div className="absolute inset-0 z-0 bg-white/30 backdrop-blur-[1px]" />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 space-y-8"
          >
            <header>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight font-sans no-underline"
            >
              {t('welcome')} {user?.displayName?.split(' ')[0] || ''}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-zinc-500 dark:text-zinc-400 mt-1 italic font-medium"
            >
              "{t('slogan')}"
            </motion.p>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-zinc-400 dark:text-zinc-500 text-sm mt-2"
            >
              {t('happeningToday')}
            </motion.p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-vivid-tangerine/10 rounded-2xl flex items-center justify-center text-vivid-tangerine">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{t('finance')}</span>
              </div>
              <div className="text-3xl font-black text-deep-space-blue dark:text-blue-400">Rp {summary.balance.toLocaleString()}</div>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">{t('balance')}</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-sunflower-gold/10 rounded-2xl flex items-center justify-center text-sunflower-gold">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{t('schedule')}</span>
              </div>
              <div className="text-3xl font-black text-deep-space-blue dark:text-blue-400">{summary.completedTasks} / {summary.totalTasks}</div>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">{t('completedTasks')}</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-black/5 dark:border-white/5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-flag-red/10 rounded-2xl flex items-center justify-center text-flag-red">
                  <TargetIcon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{t('targets')}</span>
              </div>
              <div className="text-3xl font-black text-deep-space-blue dark:text-blue-400">{Math.round(summary.targetProgress)}%</div>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">{t('overallProgress')}</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.section 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45 }}
              className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-black/5 dark:border-white/5 lg:col-span-2"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t('dailyInspiration')}</h2>
                <Sparkles className="text-vivid-tangerine w-5 h-5" />
              </div>
              <div 
                className="cursor-pointer group"
                onClick={() => setActiveView('ai_planner')}
              >
                <p className="text-lg italic text-zinc-600 dark:text-zinc-400 group-hover:text-deep-space-blue dark:hover:text-blue-400 transition-colors">
                  {dailyQuote 
                    ? `"${dailyQuote.text}"`
                    : "Click to get your daily dose of inspiration..."}
                </p>
                <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500 mt-2">
                  {dailyQuote 
                    ? `— ${dailyQuote.author}`
                    : ""}
                </p>
              </div>
            </motion.section>

            <motion.section 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-black/5 dark:border-white/5"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t('quickActions')}</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveView('finance')}
                  className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-left group"
                >
                  <Wallet className="w-6 h-6 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:text-zinc-100 mb-2 transition-colors" />
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">{t('expense')}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{t('trackSpending')}</div>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveView('schedule')}
                  className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-left group"
                >
                  <Calendar className="w-6 h-6 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:text-zinc-100 mb-2 transition-colors" />
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">{t('newTask')}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{t('planNextHour')}</div>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveView('ai_planner')}
                  className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-left group"
                >
                  <Sparkles className="w-6 h-6 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:text-zinc-100 mb-2 transition-colors" />
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">{t('aiPlanner')}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{t('aiPlanDesc')}</div>
                </motion.button>
              </div>
            </motion.section>

            <motion.section 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-deep-space-blue p-8 rounded-3xl shadow-xl text-white relative overflow-hidden"
            >
              <div className="relative z-10">
                <h2 className="text-xl font-bold mb-2">{t('stayProductive')}</h2>
                <p className="text-zinc-300 text-sm mb-6">{t('stayProductiveDesc')}</p>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveView('targets')}
                  className="bg-vivid-tangerine text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-vivid-tangerine/90 transition-all flex items-center gap-2"
                >
                  {t('viewTargets')} <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/5 rounded-full blur-3xl" 
              />
              <motion.div 
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ 
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute -left-8 -top-8 w-32 h-32 bg-vivid-tangerine/10 rounded-full blur-2xl" 
              />
            </motion.section>
          </div>
        </motion.div>
      </div>
    );
  }
  })()}
  </ErrorBoundary>
  );
};

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-zinc-950 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-transform duration-300 lg:relative lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col p-6">
          <div className="mb-10 px-2">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-white dark:bg-zinc-900 rounded-lg flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-800">
                <Logo className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-deep-space-blue dark:text-blue-400 tracking-tight">{t('appName')}</span>
            </div>
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-11 leading-tight">{t('slogan')}</p>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item, index) => (
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                key={item.id}
                onClick={() => {
                  setActiveView(item.id as View);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  activeView === item.id 
                    ? 'bg-deep-space-blue text-white shadow-lg shadow-deep-space-blue/20' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-deep-space-blue dark:hover:text-blue-400'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </motion.button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
            {/* Language Switcher */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                <Globe className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">{t('language')}</span>
              </div>
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                <button 
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${language === 'en' ? 'bg-white dark:bg-zinc-900 text-deep-space-blue dark:text-blue-400 shadow-sm' : 'text-zinc-400 dark:text-zinc-500'}`}
                >
                  EN
                </button>
                <button 
                  onClick={() => setLanguage('id')}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${language === 'id' ? 'bg-white dark:bg-zinc-900 text-deep-space-blue dark:text-blue-400 shadow-sm' : 'text-zinc-400 dark:text-zinc-500'}`}
                >
                  ID
                </button>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-800" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 font-bold">
                    {user?.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="overflow-hidden">
                  <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{user?.displayName || t('userAccount')}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user?.email || t('freePlan')}</div>
                </div>
              </div>
              <button 
                onClick={signOut}
                className="w-full py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 dark:border-zinc-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-zinc-500 dark:text-zinc-400 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:bg-zinc-800 rounded-lg lg:hidden"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            <button
              onClick={toggleTheme}
              className="p-2 text-zinc-500 dark:text-zinc-400 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:bg-zinc-800 rounded-full transition-colors"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-zinc-500 dark:text-zinc-400 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:bg-zinc-800 rounded-full relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-900" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{t('notifications')}</span>
                      {notifications.length > 0 && (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest">{notifications.length} {t('newNotifications')}</span>
                      )}
                    </div>
                    <div className="divide-y divide-zinc-50 max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">
                          {t('noNotifications')}
                        </div>
                      ) : (
                        notifications.map(notification => (
                          <div key={notification.id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              notification.type === 'schedule' ? 'bg-blue-50 text-blue-600' :
                              notification.type === 'target' ? 'bg-amber-50 text-amber-600' :
                              notification.type === 'achievement' ? 'bg-emerald-50 text-emerald-600' :
                              'bg-rose-50 text-rose-600'
                            }`}>
                              {notification.type === 'schedule' && <Calendar className="w-4 h-4" />}
                              {notification.type === 'target' && <TargetIcon className="w-4 h-4" />}
                              {notification.type === 'achievement' && <Trophy className="w-4 h-4" />}
                              {notification.type === 'finance' && <CreditCard className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{notification.title}</div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400">{notification.message}</div>
                              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 font-medium">{notification.time}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <button className="w-full p-3 text-xs font-bold text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:text-zinc-100 transition-colors bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
                      {t('viewAllNotifications')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <DigitalClock />
          </div>
        </header>

        <div className="p-4 lg:p-8 max-w-6xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
