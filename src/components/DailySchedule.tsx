import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Clock, CheckCircle2, Circle, ChevronLeft, ChevronRight, Calendar as CalendarIcon, List } from 'lucide-react';
import { Task } from '../types';
import { motion, AnimatePresence } from 'motion/react';

import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { exportTasks } from '../services/exportService';
import { ConfirmationModal } from './ConfirmationModal';

type ScheduleView = 'daily' | 'weekly' | 'monthly';

export default function DailySchedule() {
  const { language, t } = useLanguage();
  const { tasks, saveTask, deleteTask: deleteTaskFromDb } = useData();

  const [view, setView] = useState<ScheduleView>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !date) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      date,
      startTime,
      endTime,
      completed: false,
    };

    saveTask(newTask);
    setTitle('');
    setStartTime('');
    setEndTime('');
  };

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      saveTask({ ...task, completed: !task.completed });
    }
  };

  const deleteTask = (id: string) => {
    deleteTaskFromDb(id);
    setTaskToDelete(null);
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const changeMonth = (months: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + months);
    setSelectedDate(newDate);
  };

  const filteredTasks = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return tasks.filter(t => t.date === dateStr);
  }, [tasks, selectedDate]);

  const weekDays = useMemo(() => {
    const days = [];
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  }, [selectedDate]);

  const monthDays = useMemo(() => {
    const days = [];
    const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const lastDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    
    // Padding for start of month
    const startPadding = firstDayOfMonth.getDay();
    for (let i = 0; i < startPadding; i++) {
      const day = new Date(firstDayOfMonth);
      day.setDate(firstDayOfMonth.getDate() - (startPadding - i));
      days.push({ date: day, isCurrentMonth: false });
    }
    
    // Days of current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push({ date: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i), isCurrentMonth: true });
    }
    
    // Padding for end of month
    const endPadding = 42 - days.length; // 6 rows of 7 days
    for (let i = 1; i <= endPadding; i++) {
      const day = new Date(lastDayOfMonth);
      day.setDate(lastDayOfMonth.getDate() + i);
      days.push({ date: day, isCurrentMonth: false });
    }
    
    return days;
  }, [selectedDate]);

  const renderDailyView = () => (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 overflow-hidden">
      <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-1">
          <button onClick={() => changeDate(-1)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 text-center flex-1 truncate">
            {selectedDate.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </h3>
          <button onClick={() => changeDate(1)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors shrink-0">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <Clock className="w-5 h-5 text-zinc-400 dark:text-zinc-500 hidden sm:block shrink-0" />
      </div>
      <div className="divide-y divide-zinc-100">
        <AnimatePresence initial={false}>
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 dark:text-zinc-500">
              {t('noTasks')}
            </div>
          ) : (
            filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  backgroundColor: task.completed ? 'rgba(244, 244, 245, 0.5)' : 'rgba(255, 255, 255, 0)'
                }}
                exit={{ opacity: 0, x: -20 }}
                className={`p-4 flex items-center justify-between group transition-colors ${
                  task.completed ? 'bg-zinc-50/50' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleTask(task.id)}
                    className={`transition-colors ${task.completed ? 'text-vivid-tangerine' : 'text-zinc-300 hover:text-zinc-400 dark:text-zinc-500'}`}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={task.completed ? 'completed' : 'pending'}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                      </motion.div>
                    </AnimatePresence>
                  </motion.button>
                  <div>
                    <motion.div 
                      animate={{ 
                        color: task.completed ? '#a1a1aa' : '#18181b',
                        opacity: task.completed ? 0.6 : 1
                      }}
                      className={`font-medium ${task.completed ? 'line-through' : ''}`}
                    >
                      {task.title}
                    </motion.div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.startTime} {task.endTime && `- ${task.endTime}`}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setTaskToDelete(task.id)}
                  className="p-2 text-zinc-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  const renderWeeklyView = () => (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 overflow-hidden">
      <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => changeDate(-7)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {t('weekOf')} {weekDays[0].toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric' })}
          </h3>
          <button onClick={() => changeDate(7)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 divide-x divide-zinc-100 min-h-[400px] min-w-[500px]">
          {weekDays.map((day, idx) => {
          const year = day.getFullYear();
          const month = String(day.getMonth() + 1).padStart(2, '0');
          const d = String(day.getDate()).padStart(2, '0');
          const dayStr = `${year}-${month}-${d}`;
          const dayTasks = tasks.filter(t => t.date === dayStr);
          
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          const isToday = dayStr === todayStr;
          
          return (
            <div key={idx} className={`p-2 space-y-2 ${isToday ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''}`}>
              <div className="text-center pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                  {day.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'short' })}
                </div>
                <div className={`text-sm font-black ${isToday ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                  {day.getDate()}
                </div>
              </div>
              <div className="space-y-1">
                {dayTasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`text-[10px] p-1.5 rounded-lg border ${
                      task.completed ? 'bg-vivid-tangerine/10 border-vivid-tangerine/20 text-vivid-tangerine' : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 text-zinc-700'
                    } truncate`}
                    title={task.title}
                  >
                    {task.startTime} {task.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );

  const renderMonthlyView = () => (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 overflow-hidden">
      <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {selectedDate.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          <div className="grid grid-cols-7 text-center border-b border-zinc-100 dark:border-zinc-800">
            {(language === 'id' ? ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map(d => (
              <div key={d} className="py-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-y divide-zinc-100">
            {monthDays.map((dayObj, idx) => {
          const year = dayObj.date.getFullYear();
          const month = String(dayObj.date.getMonth() + 1).padStart(2, '0');
          const d = String(dayObj.date.getDate()).padStart(2, '0');
          const dayStr = `${year}-${month}-${d}`;
          const dayTasks = tasks.filter(t => t.date === dayStr);
          
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          const isToday = dayStr === todayStr;
          
          const selYear = selectedDate.getFullYear();
          const selMonth = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const selDay = String(selectedDate.getDate()).padStart(2, '0');
          const isSelected = dayStr === `${selYear}-${selMonth}-${selDay}`;
          
          return (
            <div 
              key={idx} 
              onClick={() => {
                setSelectedDate(dayObj.date);
                setView('daily');
              }}
              className={`min-h-[100px] p-1.5 cursor-pointer transition-colors relative group ${
                !dayObj.isCurrentMonth ? 'bg-zinc-50/50 opacity-40' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
              } ${isSelected ? 'bg-deep-space-blue/5 dark:bg-blue-400/5 ring-1 ring-inset ring-deep-space-blue dark:ring-blue-400' : isToday ? 'bg-zinc-50/80' : ''}`}
            >
              <div className={`text-[10px] font-bold mb-1.5 w-6 h-6 flex items-center justify-center rounded-full ${
                isSelected ? 'bg-deep-space-blue text-white shadow-sm' : 
                isToday ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100' : 
                'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:text-zinc-100'
              }`}>
                {dayObj.date.getDate()}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map(task => (
                  <div 
                    key={task.id} 
                    className={`w-full px-1.5 py-0.5 rounded text-[9px] truncate font-medium border ${
                      task.completed 
                        ? 'bg-vivid-tangerine/10 border-vivid-tangerine/20 text-vivid-tangerine' 
                        : 'bg-deep-space-blue/5 dark:bg-blue-400/5 border-deep-space-blue/10 dark:border-blue-400/10 text-deep-space-blue dark:text-blue-400'
                    }`}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 text-center bg-zinc-100 dark:bg-zinc-800 rounded py-0.5">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t('schedule')}</h2>
        <div className="flex items-center bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <button
            onClick={() => exportTasks(tasks)}
            className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-deep-space-blue dark:hover:text-blue-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg transition-all mr-1"
            title={t('exportCSV')}
          >
            <List className="w-4 h-4 rotate-90" />
          </button>
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-1" />
          <button
            onClick={() => setView('daily')}
            className={`p-2 rounded-lg transition-all ${view === 'daily' ? 'bg-deep-space-blue text-white shadow-md' : 'text-zinc-500 dark:text-zinc-400 hover:text-deep-space-blue dark:hover:text-blue-400'}`}
            title={t('dailyView')}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('weekly')}
            className={`p-2 rounded-lg transition-all ${view === 'weekly' ? 'bg-deep-space-blue text-white shadow-md' : 'text-zinc-500 dark:text-zinc-400 hover:text-deep-space-blue dark:hover:text-blue-400'}`}
            title={t('weeklyView')}
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('monthly')}
            className={`p-2 rounded-lg transition-all ${view === 'monthly' ? 'bg-deep-space-blue text-white shadow-md' : 'text-zinc-500 dark:text-zinc-400 hover:text-deep-space-blue dark:hover:text-blue-400'}`}
            title={t('monthlyView')}
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 lg:sticky lg:top-24 h-fit">
          <form onSubmit={addTask} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 space-y-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">{t('addSchedule')}</h3>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1">{t('activity')}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-deep-space-blue dark:ring-blue-400 transition-all"
                placeholder="e.g. Morning Run, Meeting"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1">{t('date')}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-deep-space-blue dark:ring-blue-400 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1">{t('startTime')}</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-deep-space-blue dark:ring-blue-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1">{t('endTime')}</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-deep-space-blue dark:ring-blue-400 transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-deep-space-blue text-white py-3 rounded-xl font-semibold hover:bg-deep-space-blue/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-deep-space-blue/20"
            >
              <Plus className="w-5 h-5" />
              {t('addToSchedule')}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={view + selectedDate.toISOString()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {view === 'daily' && renderDailyView()}
              {view === 'weekly' && renderWeeklyView()}
              {view === 'monthly' && renderMonthlyView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!taskToDelete}
        title={t('deleteTask')}
        message={t('deleteTaskConfirm')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        type="danger"
        onConfirm={() => taskToDelete && deleteTask(taskToDelete)}
        onCancel={() => setTaskToDelete(null)}
      />
    </motion.div>
  );
}
