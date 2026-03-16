import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, TrendingUp, TrendingDown, Wallet, PieChart, 
  ShoppingBag, Coffee, Home, Car, Smartphone, Heart, Briefcase, 
  Music, Gamepad, Book, Plane, Utensils, Zap, DollarSign, Gift, Trophy,
  X, ChevronDown, Check, Settings2, Users, ShieldCheck, CreditCard, Landmark
} from 'lucide-react';
import { Transaction, Category, RecurringTransaction } from '../types';
import { motion, AnimatePresence } from 'motion/react';

import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { exportTransactions } from '../services/exportService';
import { ConfirmationModal } from './ConfirmationModal';

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingBag, Coffee, Home, Car, Smartphone, Heart, Briefcase, 
  Music, Gamepad, Book, Plane, Utensils, Zap, DollarSign, Gift, Trophy,
  Users, ShieldCheck, CreditCard, Landmark
};

const DEFAULT_CATEGORIES: Category[] = [
  // Income
  { id: 'i1', name: 'Regular Income', icon: 'Briefcase', type: 'income', color: '#f77f00', group: 'Pendapatan Rutin' },
  { id: 'i2', name: 'Irregular Income', icon: 'Gift', type: 'income', color: '#f77f00', group: 'Pendapatan Tidak Rutin' },
  { id: 'i3', name: 'Passive/Investment', icon: 'Landmark', type: 'income', color: '#f77f00', group: 'Pendapatan Pasif' },
  
  // Expenses - Needs
  { id: 'e1', name: 'Housing', icon: 'Home', type: 'expense', color: '#d62828', group: 'Needs' },
  { id: 'e2', name: 'Utilities', icon: 'Zap', type: 'expense', color: '#d62828', group: 'Needs' },
  { id: 'e3', name: 'Food', icon: 'Utensils', type: 'expense', color: '#d62828', group: 'Needs' },
  { id: 'e4', name: 'Transport', icon: 'Car', type: 'expense', color: '#d62828', group: 'Needs' },
  { id: 'e5', name: 'Health', icon: 'Heart', type: 'expense', color: '#d62828', group: 'Needs' },
  
  // Expenses - Wants
  { id: 'e6', name: 'Entertainment', icon: 'Gamepad', type: 'expense', color: '#eae2b7', group: 'Wants' },
  { id: 'e7', name: 'Social', icon: 'Users', type: 'expense', color: '#eae2b7', group: 'Wants' },
  { id: 'e8', name: 'Personal Care', icon: 'ShoppingBag', type: 'expense', color: '#eae2b7', group: 'Wants' },
  
  // Expenses - Savings & Debt
  { id: 'e9', name: 'Emergency Fund', icon: 'ShieldCheck', type: 'expense', color: '#fcbf49', group: 'Savings & Debt' },
  { id: 'e10', name: 'Investment', icon: 'PieChart', type: 'expense', color: '#fcbf49', group: 'Savings & Debt' },
  { id: 'e11', name: 'Debt', icon: 'CreditCard', type: 'expense', color: '#fcbf49', group: 'Savings & Debt' },
];

export default function FinanceTracker() {
  const { language, t } = useLanguage();
  const { 
    transactions, 
    recurringTransactions, 
    categories, 
    saveTransaction, 
    deleteTransaction: deleteTransactionFromDb,
    saveRecurringTransaction,
    deleteRecurringTransaction: deleteRecurringTransactionFromDb,
    saveCategory,
    deleteCategory: deleteCategoryFromDb
  } = useData();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories.find(c => c.type === 'expense')?.id || '');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [activeTab, setActiveTab] = useState<'recent' | 'recurring'>('recent');
  
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('ShoppingBag');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [newCatGroup, setNewCatGroup] = useState('');
  const [newCatColor, setNewCatColor] = useState(() => {
    try {
      return localStorage.getItem('lifeflow_new_cat_color') || '#d62828';
    } catch (e) {
      return '#d62828';
    }
  });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const getTranslatedCategoryName = (name: string) => {
    const keyMap: Record<string, any> = {
      'Housing': 'housing',
      'Utilities': 'utilities',
      'Food': 'food',
      'Transport': 'transport',
      'Health': 'health',
      'Entertainment': 'entertainment',
      'Social': 'social',
      'Personal Care': 'personalCare',
      'Emergency Fund': 'emergencyFund',
      'Investment': 'investment',
      'Debt': 'debt',
      'Regular Income': 'regularIncome',
      'Irregular Income': 'irregularIncome',
      'Passive/Investment': 'passiveInvestment'
    };
    return keyMap[name] ? t(keyMap[name]) : name;
  };

  const getTranslatedGroupName = (group: string) => {
    const keyMap: Record<string, any> = {
      'Needs': 'needs',
      'Wants': 'wants',
      'Savings & Debt': 'savingsDebt',
      'Pendapatan Rutin': 'regularIncome',
      'Pendapatan Tidak Rutin': 'irregularIncome',
      'Pendapatan Pasif': 'passiveInvestment'
    };
    return keyMap[group] ? t(keyMap[group]) : group;
  };

  useEffect(() => {
    localStorage.setItem('lifeflow_new_cat_color', newCatColor);
  }, [newCatColor]);

  // Process recurring transactions
  useEffect(() => {
    if (recurringTransactions.length === 0) return;

    let hasChanges = false;
    const now = new Date();

    recurringTransactions.forEach(rt => {
      let lastProcessed = new Date(rt.lastProcessedDate);
      let nextDueDate = new Date(lastProcessed);

      if (rt.frequency === 'daily') nextDueDate.setDate(nextDueDate.getDate() + 1);
      else if (rt.frequency === 'weekly') nextDueDate.setDate(nextDueDate.getDate() + 7);
      else if (rt.frequency === 'monthly') nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      else if (rt.frequency === 'yearly') nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);

      let currentRt = { ...rt };

      while (nextDueDate <= now) {
        hasChanges = true;
        saveTransaction({
          id: crypto.randomUUID(),
          description: rt.description,
          amount: rt.amount,
          type: rt.type,
          category: rt.category,
          date: nextDueDate.toISOString(),
          isBill: true
        });
        
        currentRt.lastProcessedDate = nextDueDate.toISOString();
        lastProcessed = new Date(currentRt.lastProcessedDate);
        nextDueDate = new Date(lastProcessed);

        if (rt.frequency === 'daily') nextDueDate.setDate(nextDueDate.getDate() + 1);
        else if (rt.frequency === 'weekly') nextDueDate.setDate(nextDueDate.getDate() + 7);
        else if (rt.frequency === 'monthly') nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        else if (rt.frequency === 'yearly') nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
      }

      if (hasChanges) {
        saveRecurringTransaction(currentRt);
      }
    });
  }, [recurringTransactions, saveTransaction, saveRecurringTransaction]);

  const addTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !selectedCategoryId) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const now = new Date().toISOString();

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      description,
      amount: parsedAmount,
      type,
      category: selectedCategoryId,
      date: now,
      isBill: isRecurring,
      notes: notes
    };

    if (isRecurring) {
      const newRecurring: RecurringTransaction = {
        id: crypto.randomUUID(),
        description,
        amount: parsedAmount,
        type,
        category: selectedCategoryId,
        frequency: recurringFrequency,
        startDate: now,
        lastProcessedDate: now,
        notes: notes
      };
      saveRecurringTransaction(newRecurring);
    }

    saveTransaction(newTransaction);
    setDescription('');
    setAmount('');
    setNotes('');
    setIsRecurring(false);
  };

  const addCategory = () => {
    if (!newCatName) return;

    if (editingCategoryId) {
      const categoryToUpdate = categories.find(c => c.id === editingCategoryId);
      if (categoryToUpdate) {
        saveCategory({
          ...categoryToUpdate,
          name: newCatName,
          icon: newCatIcon,
          type: newCatType,
          group: newCatGroup || (newCatType === 'income' ? 'Pendapatan Rutin' : 'Needs'),
          color: newCatColor
        });
      }
      setEditingCategoryId(null);
    } else {
      const newCat: Category = {
        id: crypto.randomUUID(),
        name: newCatName,
        icon: newCatIcon,
        type: newCatType,
        group: newCatGroup || (newCatType === 'income' ? 'Pendapatan Rutin' : 'Needs'),
        color: newCatColor,
      };
      saveCategory(newCat);
    }

    setNewCatName('');
    setNewCatGroup('');
  };

  const editCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setNewCatName(cat.name);
    setNewCatIcon(cat.icon);
    setNewCatType(cat.type);
    setNewCatGroup(cat.group || '');
    setNewCatColor(cat.color);
    // Scroll to top of modal content
    const modalContent = document.getElementById('category-modal-content');
    if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingCategoryId(null);
    setNewCatName('');
    setNewCatGroup('');
    // Optionally reset color to default or keep it
  };

  const deleteCategory = (id: string) => {
    deleteCategoryFromDb(id);
    if (selectedCategoryId === id) {
      setSelectedCategoryId(categories.find(c => c.id !== id && c.type === type)?.id || '');
    }
  };

  const deleteTransaction = (id: string) => {
    deleteTransactionFromDb(id);
  };

  const deleteRecurringTransaction = (id: string) => {
    deleteRecurringTransactionFromDb(id);
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const filteredCategories = categories.filter(c => c.type === type);

  const getCategory = (id: string) => categories.find(c => c.id === id);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-black/5 dark:border-white/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">{t('totalBalance')}</span>
            <Wallet className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
          </div>
          <div className={`text-3xl font-semibold ${balance >= 0 ? 'text-deep-space-blue dark:text-blue-400' : 'text-flag-red'}`}>
            Rp {balance.toLocaleString()}
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-black/5 dark:border-white/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">{t('income')}</span>
            <TrendingUp className="w-5 h-5 text-vivid-tangerine" />
          </div>
          <div className="text-3xl font-semibold text-vivid-tangerine">
            Rp {totalIncome.toLocaleString()}
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-black/5 dark:border-white/5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">{t('expense')}</span>
            <TrendingDown className="w-5 h-5 text-flag-red" />
          </div>
          <div className="text-3xl font-semibold text-flag-red">
            Rp {totalExpense.toLocaleString()}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 h-fit">
          <form onSubmit={addTransaction} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('addTransaction')}</h3>
              <button 
                type="button"
                onClick={() => {
                  setNewCatType(type);
                  setIsManagingCategories(true);
                }}
                className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                title={t('manageCategories')}
              >
                <Settings2 className="w-4 h-4" />
              </button>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1">{t('description')}</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                placeholder="e.g. Salary, Coffee, Rent"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1">{t('amount')}</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1">{t('notes')}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all resize-none"
                placeholder={t('notes')}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('income');
                  setSelectedCategoryId(categories.find(c => c.type === 'income')?.id || '');
                }}
                className={`py-2 rounded-xl text-sm font-medium transition-all ${
                  type === 'income' ? 'bg-vivid-tangerine text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-700'
                }`}
              >
                {t('income')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  setSelectedCategoryId(categories.find(c => c.type === 'expense')?.id || '');
                }}
                className={`py-2 rounded-xl text-sm font-medium transition-all ${
                  type === 'expense' ? 'bg-flag-red text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-700'
                }`}
              >
                {t('expense')}
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-1">Category</label>
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(
                  filteredCategories.reduce((acc, cat) => {
                    const group = cat.group || 'Other';
                    if (!acc[group]) acc[group] = [];
                    acc[group].push(cat);
                    return acc;
                  }, {} as Record<string, Category[]>)
                ).map(([group, cats]) => (
                  <div key={group} className="space-y-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{getTranslatedGroupName(group)}</span>
                    <div className="grid grid-cols-2 gap-2">
                      {(cats as Category[]).map(cat => {
                        const Icon = ICON_MAP[cat.icon] || ShoppingBag;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategoryId(cat.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm ${
                              selectedCategoryId === cat.id
                                ? 'border-deep-space-blue dark:border-blue-400 bg-deep-space-blue text-white'
                                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 bg-white dark:bg-zinc-900'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="truncate">{getTranslatedCategoryName(cat.name)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 text-deep-space-blue dark:text-blue-400 focus:ring-deep-space-blue dark:ring-blue-400"
                />
                <span className="text-sm font-medium text-zinc-700">{t('recurring')}</span>
              </label>
              
              {isRecurring && (
                <select
                  value={recurringFrequency}
                  onChange={(e) => setRecurringFrequency(e.target.value as any)}
                  className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-deep-space-blue dark:ring-blue-400 transition-all text-sm shadow-sm"
                >
                  <option value="daily">{t('daily')}</option>
                  <option value="weekly">{t('weekly')}</option>
                  <option value="monthly">{t('monthly')}</option>
                  <option value="yearly">{t('yearly')}</option>
                </select>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-deep-space-blue text-white py-3 rounded-xl font-semibold hover:bg-deep-space-blue/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-deep-space-blue/20"
            >
              <Plus className="w-5 h-5" />
              {t('addTransaction')}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-black/5 dark:border-white/5 overflow-hidden">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab('recent')}
                  className={`text-lg font-semibold transition-colors ${activeTab === 'recent' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:text-zinc-400'}`}
                >
                  {t('recentTransactions')}
                </button>
                <button
                  onClick={() => setActiveTab('recurring')}
                  className={`text-lg font-semibold transition-colors ${activeTab === 'recurring' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:text-zinc-400'}`}
                >
                  {t('recurring')}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportTransactions(transactions)}
                  className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-deep-space-blue dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                  title={t('exportCSV')}
                >
                  <DollarSign className="w-5 h-5" />
                </button>
                <PieChart className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
              </div>
            </div>
            <div className="divide-y divide-zinc-100 max-h-[600px] overflow-y-auto">
              <AnimatePresence initial={false}>
                {activeTab === 'recent' ? (
                  transactions.length === 0 ? (
                    <div className="p-12 text-center text-zinc-400 dark:text-zinc-500">
                      {t('noTransactions')}
                    </div>
                  ) : (
                    transactions.map((t) => {
                      const cat = getCategory(t.category);
                      const Icon = cat ? (ICON_MAP[cat.icon] || ShoppingBag) : (t.type === 'income' ? TrendingUp : TrendingDown);
                      return (
                        <motion.div
                          key={t.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${cat?.color || (t.type === 'income' ? '#f77f00' : '#d62828')}20`, color: cat?.color || (t.type === 'income' ? '#f77f00' : '#d62828') }}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-deep-space-blue dark:text-blue-400 truncate">{t.description}</div>
                              {t.notes && <div className="text-xs text-zinc-400 dark:text-zinc-500 italic truncate max-w-[200px]">{t.notes}</div>}
                              <div className="text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span>{new Date(t.date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')}</span>
                                <span className="w-1 h-1 bg-zinc-300 rounded-full hidden sm:block" />
                                <span className="truncate">{getTranslatedCategoryName(cat?.name || 'Uncategorized')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4 sm:w-auto w-full pl-14 sm:pl-0">
                            <div className={`font-semibold ${t.type === 'income' ? 'text-vivid-tangerine' : 'text-flag-red'}`}>
                              {t.type === 'income' ? '+' : '-'} Rp {t.amount.toLocaleString()}
                            </div>
                            <button
                              onClick={() => deleteTransaction(t.id)}
                              className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 transition-colors shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                  )
                ) : (
                  recurringTransactions.length === 0 ? (
                    <div className="p-12 text-center text-zinc-400 dark:text-zinc-500">
                      {t('noRecurringTransactions')}
                    </div>
                  ) : (
                    recurringTransactions.map((rt) => {
                      const cat = getCategory(rt.category);
                      const Icon = cat ? (ICON_MAP[cat.icon] || ShoppingBag) : (rt.type === 'income' ? TrendingUp : TrendingDown);
                      return (
                        <motion.div
                          key={rt.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${cat?.color || (rt.type === 'income' ? '#f77f00' : '#d62828')}20`, color: cat?.color || (rt.type === 'income' ? '#f77f00' : '#d62828') }}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-deep-space-blue dark:text-blue-400 truncate">{rt.description}</div>
                              {rt.notes && <div className="text-xs text-zinc-400 dark:text-zinc-500 italic truncate max-w-[200px]">{rt.notes}</div>}
                              <div className="text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="capitalize">{t(rt.frequency)}</span>
                                <span className="w-1 h-1 bg-zinc-300 rounded-full hidden sm:block" />
                                <span className="truncate">{getTranslatedCategoryName(cat?.name || 'Uncategorized')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4 sm:w-auto w-full pl-14 sm:pl-0">
                            <div className={`font-semibold ${rt.type === 'income' ? 'text-vivid-tangerine' : 'text-flag-red'}`}>
                              {rt.type === 'income' ? '+' : '-'} Rp {rt.amount.toLocaleString()}
                            </div>
                            <button
                              onClick={() => deleteRecurringTransaction(rt.id)}
                              className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 transition-colors shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                  )
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Category Management Modal */}
      <AnimatePresence>
        {isManagingCategories && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsManagingCategories(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t('manageCategories')}</h3>
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest hover:text-rose-600 transition-colors"
                  >
                    {t('resetCategories')}
                  </button>
                </div>
                <button 
                  onClick={() => {
                    setIsManagingCategories(false);
                    setEditingCategoryId(null);
                    setNewCatName('');
                    setNewCatGroup('');
                  }}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all"
                >
                  <X className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                </button>
              </div>

              <div id="category-modal-content" className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Add/Edit Category */}
                <div className="space-y-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
                      {editingCategoryId ? t('editCategory') : t('newCategory')}
                    </h4>
                    {editingCategoryId && (
                      <button 
                        onClick={cancelEdit}
                        className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:text-zinc-100 uppercase tracking-widest"
                      >
                        {t('cancel')}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder={t('categoryName')}
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-deep-space-blue dark:ring-blue-400 transition-all bg-white dark:bg-zinc-900"
                    />
                    <select
                      value={newCatGroup}
                      onChange={(e) => setNewCatGroup(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-deep-space-blue dark:ring-blue-400 transition-all bg-white dark:bg-zinc-900 text-sm"
                    >
                      <option value="">{t('selectGroup')}</option>
                      {newCatType === 'income' ? (
                        <>
                          <option value="Pendapatan Rutin">Pendapatan Rutin</option>
                          <option value="Pendapatan Tidak Rutin">Pendapatan Tidak Rutin</option>
                          <option value="Pendapatan Pasif">Pendapatan Pasif</option>
                        </>
                      ) : (
                        <>
                          <option value="Needs">Needs (Wajib)</option>
                          <option value="Wants">Wants (Gaya Hidup)</option>
                          <option value="Savings & Debt">Savings & Debt</option>
                        </>
                      )}
                    </select>
                    <div className="flex gap-2 md:col-span-2">
                      <button
                        onClick={() => {
                          setNewCatType('income');
                          setNewCatGroup('Pendapatan Rutin');
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                          newCatType === 'income' ? 'bg-vivid-tangerine text-white' : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        {t('income')}
                      </button>
                      <button
                        onClick={() => {
                          setNewCatType('expense');
                          setNewCatGroup('Needs');
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                          newCatType === 'expense' ? 'bg-flag-red text-white' : 'bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        {t('expense')}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">{t('selectIcon')}</label>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                      {Object.keys(ICON_MAP).map(iconName => {
                        const Icon = ICON_MAP[iconName];
                        return (
                          <button
                            key={iconName}
                            onClick={() => setNewCatIcon(iconName)}
                            className={`p-2 rounded-lg transition-all ${
                              newCatIcon === iconName 
                                ? 'bg-zinc-900 text-white' 
                                : 'bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">{t('categoryColor')}</label>
                    <div className="flex flex-wrap gap-2 items-center">
                      {[
                        '#003049', '#f77f00', '#fcbf49', '#eae2b7', '#d62828',
                        '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#71717a'
                      ].map(color => (
                        <button
                          key={color}
                          onClick={() => setNewCatColor(color)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            newCatColor === color ? 'border-deep-space-blue dark:border-blue-400 scale-110 shadow-md' : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 transition-all">
                        <input
                          type="color"
                          value={newCatColor}
                          onChange={(e) => setNewCatColor(e.target.value)}
                          className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={addCategory}
                    className="w-full bg-deep-space-blue text-white py-2 rounded-xl font-bold text-sm hover:bg-deep-space-blue/90 transition-all"
                  >
                    {editingCategoryId ? t('updateCategory') : t('createCategory')}
                  </button>
                </div>

                {/* Categories List */}
                <div className="space-y-6">
                  {(['income', 'expense'] as const).map((catType) => (
                    <div key={catType} className="space-y-3">
                      <h4 className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${
                        catType === 'income' ? 'text-vivid-tangerine' : 'text-flag-red'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${catType === 'income' ? 'bg-vivid-tangerine' : 'bg-flag-red'}`} />
                        {catType === 'income' ? t('incomeCategories') : t('expenseCategories')}
                      </h4>
                      <div className="divide-y divide-zinc-100 bg-zinc-50/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 px-4">
                        {categories.filter(c => c.type === catType).length === 0 ? (
                          <div className="py-4 text-xs text-zinc-400 dark:text-zinc-500 text-center italic">{t('noCategories')}</div>
                        ) : (
                          categories.filter(c => c.type === catType).map(cat => {
                            const Icon = ICON_MAP[cat.icon] || ShoppingBag;
                            return (
                              <div key={cat.id} className="py-3 flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                                  >
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div className="text-sm font-bold text-deep-space-blue dark:text-blue-400">{getTranslatedCategoryName(cat.name)}</div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => editCategory(cat)}
                                    className="p-2 text-zinc-300 hover:text-deep-space-blue dark:hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <Plus className="w-4 h-4 rotate-45" /> {/* Using Plus rotated as a simple edit/configure icon if Settings2 is too big */}
                                  </button>
                                  <button
                                    onClick={() => deleteCategory(cat.id)}
                                    className="p-2 text-zinc-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={showResetConfirm}
        title={t('resetCategories')}
        message="Reset all categories to defaults? This will not delete your transactions but may affect their category labels."
        confirmText={t('reset')}
        cancelText={t('cancel')}
        type="danger"
        onConfirm={async () => {
          // Delete all current categories
          for (const cat of categories) {
            await deleteCategory(cat.id);
          }
          // Add default categories
          for (const cat of DEFAULT_CATEGORIES) {
            await saveCategory(cat);
          }
          setShowResetConfirm(false);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </motion.div>
  );
}
