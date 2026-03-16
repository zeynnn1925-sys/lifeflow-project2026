import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Star, Award, Zap, Target, CheckCircle2, Lock } from 'lucide-react';
import { Achievement, Target as TargetType, Transaction, Task } from '../types';
import { motion, AnimatePresence } from 'motion/react';

import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_target',
    title: 'first_step_title',
    description: 'first_step_desc',
    icon: 'Target',
    points: 100,
    requirement: { type: 'target_complete', value: 1 }
  },
  {
    id: 'target_master',
    title: 'goal_crusher_title',
    description: 'goal_crusher_desc',
    icon: 'Zap',
    points: 500,
    requirement: { type: 'target_complete', value: 5 }
  },
  {
    id: 'saver_pro',
    title: 'smart_saver_title',
    description: 'smart_saver_desc',
    icon: 'Award',
    points: 300,
    requirement: { type: 'finance_balance', value: 1000000 }
  },
  {
    id: 'task_warrior',
    title: 'productivity_king_title',
    description: 'productivity_king_desc',
    icon: 'Trophy',
    points: 1000,
    requirement: { type: 'task_streak', value: 10 }
  }
];

export default function AchievementSystem() {
  const { t } = useLanguage();
  const { unlockedAchievements, saveUnlockedAchievement, targets, transactions, tasks } = useData();

  const stats = useMemo(() => {
    const completedTargets = targets.filter(t => t.currentValue >= t.targetValue).length;
    const balance = transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
    const completedTasks = tasks.filter(t => t.completed).length;

    return { completedTargets, balance, completedTasks };
  }, [targets, transactions, tasks]);

  useEffect(() => {
    const newUnlocked = [...unlockedAchievements];
    let changed = false;

    INITIAL_ACHIEVEMENTS.forEach(achievement => {
      if (newUnlocked.some(a => a.id === achievement.id)) return;

      let met = false;
      if (achievement.requirement.type === 'target_complete' && stats.completedTargets >= achievement.requirement.value) met = true;
      if (achievement.requirement.type === 'finance_balance' && stats.balance >= achievement.requirement.value) met = true;
      if (achievement.requirement.type === 'task_streak' && stats.completedTasks >= achievement.requirement.value) met = true;

      if (met) {
        newUnlocked.push({ id: achievement.id, unlockedAt: new Date().toISOString() });
        changed = true;
        saveUnlockedAchievement(achievement.id, new Date().toISOString());
      }
    });
  }, [stats, unlockedAchievements, saveUnlockedAchievement]);

  const totalPoints = INITIAL_ACHIEVEMENTS
    .filter(a => unlockedAchievements.some(ua => ua.id === a.id))
    .reduce((acc, a) => acc + a.points, 0);

  const getIcon = (iconName: string, unlocked: boolean) => {
    const props = { className: `w-6 h-6 ${unlocked ? 'text-deep-space-blue dark:text-blue-400' : 'text-zinc-300'}` };
    switch (iconName) {
      case 'Target': return <Target {...props} />;
      case 'Zap': return <Zap {...props} />;
      case 'Award': return <Award {...props} />;
      case 'Trophy': return <Trophy {...props} />;
      default: return <Star {...props} />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="bg-deep-space-blue p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black mb-2">{t('yourAchievements')}</h2>
            <p className="text-zinc-400 dark:text-zinc-500">{t('achievementDesc')}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-vivid-tangerine">{totalPoints}</div>
            <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">{t('totalPoints')}</div>
          </div>
        </div>
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-vivid-tangerine/10 rounded-full blur-3xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INITIAL_ACHIEVEMENTS.map((achievement, index) => {
          const isUnlocked = unlockedAchievements.some(ua => ua.id === achievement.id);
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className={`p-6 rounded-3xl border transition-all ${
                isUnlocked 
                  ? 'bg-white dark:bg-zinc-900 border-black/5 dark:border-white/5 shadow-sm' 
                  : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  isUnlocked ? 'bg-zinc-100 dark:bg-zinc-800' : 'bg-zinc-200 dark:bg-zinc-700'
                }`}>
                  {isUnlocked ? getIcon(achievement.icon, true) : <Lock className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />}
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                  isUnlocked ? 'bg-vivid-tangerine/10 text-vivid-tangerine' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                }`}>
                  {achievement.points} PTS
                </div>
              </div>
              
              <h3 className={`font-bold text-lg ${isUnlocked ? 'text-deep-space-blue dark:text-blue-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                {t(achievement.title as any)}
              </h3>
              <p className={`text-sm mt-1 ${isUnlocked ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                {t(achievement.description as any)}
              </p>

              {isUnlocked && (
                <div className="mt-4 flex items-center gap-2 text-vivid-tangerine text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  {t('unlocked')}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
