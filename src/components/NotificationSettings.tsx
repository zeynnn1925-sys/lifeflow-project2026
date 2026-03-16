import React, { useState, useEffect } from 'react';
import { Bell, Clock, Calendar, Target, CreditCard, Save, CheckCircle2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { NotificationSetting } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { notificationService } from '../services/notificationService';

import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';

export default function NotificationSettings() {
  const { t } = useLanguage();
  const { notificationSettings: settings, saveNotificationSetting } = useData();

  const [showSaved, setShowSaved] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(notificationService.hasPermission());

  const handleRequestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setPermissionGranted(granted);
  };

  const toggleSetting = (id: string) => {
    const setting = settings.find(s => s.id === id);
    if (setting) {
      saveNotificationSetting({ ...setting, enabled: !setting.enabled });
    }
  };

  const updateTime = (id: string, time: string) => {
    const setting = settings.find(s => s.id === id);
    if (setting) {
      saveNotificationSetting({ ...setting, time });
    }
  };

  const saveSettings = () => {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  };

  const getIcon = (type: NotificationSetting['type']) => {
    switch (type) {
      case 'schedule': return <Calendar className="w-5 h-5" />;
      case 'bill': return <CreditCard className="w-5 h-5" />;
      case 'target': return <Target className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-black/5 dark:border-white/5">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-900 dark:text-zinc-100">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t('notificationSettings')}</h2>
            <p className="text-zinc-500 dark:text-zinc-400">{t('notificationDesc')}</p>
          </div>
        </div>

        <div className="space-y-6">
          {settings.map((setting, index) => (
            <motion.div 
              key={setting.id} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-sm">
                    {getIcon(setting.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 capitalize">{t(setting.type as any)} {t('reminders')}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('getNotifiedAbout')} {t(setting.type as any)}.</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting(setting.id)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    setting.enabled ? 'bg-deep-space-blue' : 'bg-zinc-200 dark:bg-zinc-700'
                  }`}
                >
                  <motion.div
                    animate={{ x: setting.enabled ? 24 : 4 }}
                    className="absolute top-1 w-4 h-4 bg-white dark:bg-zinc-900 rounded-full shadow-sm"
                  />
                </button>
              </div>

              <AnimatePresence>
                {setting.enabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{t('reminderTime')}</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                        <input
                          type="time"
                          value={setting.time}
                          onChange={(e) => updateTime(setting.id, e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-space-blue dark:ring-blue-400 transition-all text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{t('frequency')}</label>
                      <select
                        value={setting.frequency}
                        onChange={(e) => saveNotificationSetting({ ...setting, frequency: e.target.value as any })}
                        className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-deep-space-blue dark:ring-blue-400 transition-all text-sm"
                      >
                        <option value="daily">{t('daily')}</option>
                        <option value="weekly">{t('weekly')}</option>
                        <option value="once">{t('once')}</option>
                      </select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={saveSettings}
            className="bg-deep-space-blue text-white px-8 py-3 rounded-2xl font-bold hover:bg-deep-space-blue/90 transition-all flex items-center gap-2 shadow-lg shadow-deep-space-blue/20"
          >
            <Save className="w-5 h-5" />
            {t('saveChanges')}
          </button>

          <AnimatePresence>
            {showSaved && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 text-vivid-tangerine font-bold text-sm"
              >
                <CheckCircle2 className="w-5 h-5" />
                {t('settingsSaved')}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className={`p-8 rounded-3xl border shadow-sm flex flex-col md:flex-row items-center gap-6 ${
          permissionGranted ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
        }`}
      >
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
          permissionGranted ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
        }`}>
          {permissionGranted ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className={`text-xl font-bold ${permissionGranted ? 'text-emerald-900' : 'text-rose-900'}`}>
            {permissionGranted ? t('notificationsEnabled') : t('notificationsDisabled')}
          </h3>
          <p className={`text-sm mt-1 ${permissionGranted ? 'text-emerald-600' : 'text-rose-600'}`}>
            {permissionGranted ? t('settingsSaved') : t('requestPermissionDesc')}
          </p>
        </div>
        {!permissionGranted && (
          <button
            onClick={handleRequestPermission}
            className="bg-rose-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 shrink-0"
          >
            {t('enableBrowserNotifications')}
          </button>
        )}
        {permissionGranted && (
          <button
            onClick={() => notificationService.sendNotification('LifeFlow Test!', { body: t('testNotificationSent') })}
            className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 shrink-0"
          >
            {t('testNotification')}
          </button>
        )}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-vivid-tangerine/10 p-6 rounded-3xl border border-vivid-tangerine/20 flex items-start gap-4"
      >
        <div className="w-10 h-10 bg-vivid-tangerine rounded-xl flex items-center justify-center text-white shrink-0">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-deep-space-blue dark:text-blue-400">{t('proTip')}</h4>
          <p className="text-vivid-tangerine text-sm mt-1">
            {t('proTipDesc')}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
