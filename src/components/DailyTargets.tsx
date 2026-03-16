import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Target as TargetIcon, Flame, Heart, Briefcase, User } from 'lucide-react';
import { Target } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmationModal } from './ConfirmationModal';

import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';

export default function DailyTargets() {
  const { t } = useLanguage();
  const { targets, saveTarget, deleteTarget: deleteTargetFromDb } = useData();

  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState<Target['category']>('personal');
  const [targetToDelete, setTargetToDelete] = useState<string | null>(null);

  const addTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetValue) return;

    const newTarget: Target = {
      id: crypto.randomUUID(),
      title,
      targetValue: parseFloat(targetValue),
      currentValue: 0,
      unit,
      category,
    };

    saveTarget(newTarget);
    setTitle('');
    setTargetValue('');
    setUnit('');
  };

  const updateProgress = (id: string, amount: number) => {
    const target = targets.find(t => t.id === id);
    if (target) {
      const newValue = Math.max(0, Math.min(target.targetValue, target.currentValue + amount));
      saveTarget({ ...target, currentValue: newValue });
    }
  };

  const deleteTarget = (id: string) => {
    deleteTargetFromDb(id);
    setTargetToDelete(null);
  };

  const getCategoryIcon = (cat: Target['category']) => {
    switch (cat) {
      case 'health': return <Heart className="w-5 h-5" />;
      case 'work': return <Briefcase className="w-5 h-5" />;
      case 'finance': return <Briefcase className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (cat: Target['category']) => {
    switch (cat) {
      case 'health': return 'text-flag-red bg-flag-red/10';
      case 'work': return 'text-deep-space-blue dark:text-blue-400 bg-deep-space-blue/10 dark:bg-blue-400/10';
      case 'finance': return 'text-vivid-tangerine bg-vivid-tangerine/10';
      default: return 'text-sunflower-gold bg-sunflower-gold/10';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      <div className="lg:col-span-1 lg:sticky lg:top-24 h-fit">
        <form onSubmit={addTarget} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 space-y-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{t('setNewTarget')}</h3>
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1">{t('goalName')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-deep-space-blue dark:ring-blue-400 transition-all"
              placeholder="e.g. Drink Water, Read Pages"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1">{t('targetValue')}</label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-deep-space-blue dark:ring-blue-400 transition-all"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1">{t('unit')}</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-deep-space-blue dark:ring-blue-400 transition-all"
                placeholder="Liters, Pages"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1">{t('category')}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Target['category'])}
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-deep-space-blue dark:ring-blue-400 transition-all bg-white dark:bg-zinc-900"
            >
              <option value="personal">{t('personal')}</option>
              <option value="health">{t('health')}</option>
              <option value="work">{t('work')}</option>
              <option value="finance">{t('finance')}</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-deep-space-blue text-white py-3 rounded-xl font-semibold hover:bg-deep-space-blue/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-deep-space-blue/20"
          >
            <Plus className="w-5 h-5" />
            {t('setTarget')}
          </button>
        </form>
      </div>

      <div className="lg:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence initial={false}>
            {targets.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-zinc-900 p-12 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 text-center text-zinc-400 dark:text-zinc-500">
                {t('noTargets')}
              </div>
            ) : (
              targets.map((target) => {
                const progress = (target.currentValue / target.targetValue) * 100;
                return (
                  <motion.div
                    key={target.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getCategoryColor(target.category)}`}>
                          {getCategoryIcon(target.category)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">{target.title}</h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{target.category}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setTargetToDelete(target.id)}
                        className="p-1 text-zinc-300 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                          {target.currentValue} / {target.targetValue} {target.unit}
                        </span>
                        <span className="text-zinc-900 dark:text-zinc-100 font-bold">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className={`h-full transition-all ${progress === 100 ? 'bg-vivid-tangerine' : 'bg-deep-space-blue'}`}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => updateProgress(target.id, -1)}
                        className="flex-1 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all font-medium text-sm"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => updateProgress(target.id, 1)}
                        className="flex-1 py-2 rounded-lg bg-deep-space-blue text-white hover:bg-deep-space-blue/90 transition-all font-medium text-sm"
                      >
                        +1
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!targetToDelete}
        title={t('deleteTarget')}
        message={t('deleteTargetConfirm')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        type="danger"
        onConfirm={() => targetToDelete && deleteTarget(targetToDelete)}
        onCancel={() => setTargetToDelete(null)}
      />
    </motion.div>
  );
}
