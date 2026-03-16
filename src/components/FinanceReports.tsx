import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Transaction, Category } from '../types';
import { Filter, TrendingUp, PieChart as PieChartIcon, Download, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';

import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import AIFinanceAdvisor from './AIFinanceAdvisor';
import { exportTransactions } from '../services/exportService';

export default function FinanceReports() {
  const { language, t } = useLanguage();
  const { transactions, categories } = useData();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [hiddenData, setHiddenData] = useState<string[]>([]);
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);

  const getCategoryName = (idOrName: string) => {
    const cat = categories.find(c => c.id === idOrName || c.name === idOrName);
    return cat ? cat.name : idOrName;
  };

  const COLORS = ['#f77f00', '#d62828', '#fcbf49', '#eae2b7', '#003049'];

  const chartData = useMemo(() => {
    const data: Record<string, { name: string; income: number; expense: number }> = {};

    transactions.forEach(t => {
      const date = new Date(t.date);
      let key = '';
      
      if (period === 'daily') {
        key = date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric' });
      } else if (period === 'weekly') {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        key = language === 'id' ? `Minggu ${weekNum}` : `Week ${weekNum}`;
      } else {
        key = date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'short' });
      }

      if (!data[key]) {
        data[key] = { name: key, income: 0, expense: 0 };
      }

      if (t.type === 'income') data[key].income += t.amount;
      else data[key].expense += t.amount;
    });

    return Object.values(data).slice(-7);
  }, [transactions, period]);

  const categoryData = useMemo(() => {
    const data: Record<string, { value: number, color: string }> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = categories.find(c => c.id === t.category || c.name === t.category);
      const name = cat ? cat.name : t.category;
      const color = cat ? cat.color : '#d62828';
      if (!data[name]) data[name] = { value: 0, color };
      data[name].value += t.amount;
    });
    return Object.entries(data)
      .map(([name, { value, color }]) => ({ name, value, color }))
      .filter(item => !hiddenCategories.includes(item.name));
  }, [transactions, hiddenCategories, categories]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.filter(t => t.type === 'expense').forEach(t => cats.add(getCategoryName(t.category)));
    return Array.from(cats);
  }, [transactions, categories]);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);

  const budgetAllocation = useMemo(() => {
    const allocation = {
      needs: 0,
      wants: 0,
      savings: 0,
    };

    transactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = categories.find(c => c.id === t.category || c.name === t.category);
      if (cat?.group === 'Needs') allocation.needs += t.amount;
      else if (cat?.group === 'Wants') allocation.wants += t.amount;
      else if (cat?.group === 'Savings & Debt') allocation.savings += t.amount;
    });

    const total = allocation.needs + allocation.wants + allocation.savings || 1;
    return [
      { name: `${t('needs')} (50%)`, value: allocation.needs, percent: Math.round((allocation.needs / total) * 100), target: 50, color: '#d62828' },
      { name: `${t('wants')} (30%)`, value: allocation.wants, percent: Math.round((allocation.wants / total) * 100), target: 30, color: '#eae2b7' },
      { name: `${t('savings')} (20%)`, value: allocation.savings, percent: Math.round((allocation.savings / total) * 100), target: 20, color: '#fcbf49' },
    ];
  }, [transactions, categories]);

  const toggleData = (dataKey: string) => {
    setHiddenData(prev => 
      prev.includes(dataKey) ? prev.filter(k => k !== dataKey) : [...prev, dataKey]
    );
  };

  const toggleCategory = (category: string) => {
    setHiddenCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleExport = () => {
    exportTransactions(transactions);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800">
          <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-8 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{entry.name}</span>
              </div>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Rp {entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t('analytics')}</h2>
          <p className="text-zinc-500 dark:text-zinc-400">{t('analyticsDesc')}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t('exportCSV')}</span>
          </button>
          
          <div className="flex items-center bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            {(['daily', 'weekly', 'monthly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  period === p ? 'bg-deep-space-blue text-white shadow-md' : 'text-zinc-500 dark:text-zinc-400 hover:text-deep-space-blue dark:hover:text-blue-400'
                }`}
              >
                {t(p)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Existing Charts */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-vivid-tangerine" />
              {t('incomeVsExpense')}
            </h3>
            <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1 rounded-lg">
              {t('clickLegend')}
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f4f4f5' }} />
                <Legend 
                  iconType="circle" 
                  wrapperStyle={{ paddingTop: '20px' }} 
                  onClick={(e) => toggleData(String(e.dataKey))}
                  style={{ cursor: 'pointer' }}
                />
                {!hiddenData.includes('income') && (
                  <Bar dataKey="income" name={t('income')} fill="#f77f00" radius={[4, 4, 0, 0]} />
                )}
                {!hiddenData.includes('expense') && (
                  <Bar dataKey="expense" name={t('expense')} fill="#d62828" radius={[4, 4, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Filter className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
              {t('budgetHealth')} (50/30/20)
            </h3>
          </div>
          <div className="space-y-6">
            {budgetAllocation.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{item.name}</div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-widest">{t('target')}: {item.target}%</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-black ${item.percent > item.target ? 'text-flag-red' : 'text-vivid-tangerine'}`}>
                      {item.percent}%
                    </div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">Rp {item.value.toLocaleString()}</div>
                  </div>
                </div>
                <div className="relative group">
                  <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percent}%` }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                    Rp {item.value.toLocaleString()}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
                  </div>
                </div>
                {item.percent > item.target && (
                  <p className="text-[10px] text-flag-red font-medium italic">
                    {t('overspendingMsg').replace('{percent}', (item.percent - item.target).toString())}
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <AIFinanceAdvisor transactions={transactions} categories={categories} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
            {t('expenseBreakdown')}
          </h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-1 h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="lg:col-span-2 flex flex-wrap gap-2 content-start">
            {allCategories.map((cat, idx) => {
              const catObj = categories.find(c => c.name === cat);
              const catColor = catObj ? catObj.color : COLORS[idx % COLORS.length];
              return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border flex items-center gap-2 ${
                  hiddenCategories.includes(cat)
                    ? 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 text-zinc-300'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 shadow-sm hover:border-zinc-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: catColor }} />
                {cat}
              </button>
            )})}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-vivid-tangerine/10 p-6 rounded-3xl border border-vivid-tangerine/20">
          <div className="text-vivid-tangerine text-sm font-bold uppercase tracking-widest mb-1">{t('totalSavings')}</div>
          <div className="text-3xl font-black text-deep-space-blue dark:text-blue-400">Rp {(totalIncome - totalExpense).toLocaleString()}</div>
          <div className="mt-2 text-vivid-tangerine/60 text-xs font-medium">{t('netBalanceDesc')}</div>
        </div>
        <div className="bg-flag-red/10 p-6 rounded-3xl border border-flag-red/20">
          <div className="text-flag-red text-sm font-bold uppercase tracking-widest mb-1">{t('burnRate')}</div>
          <div className="text-3xl font-black text-deep-space-blue dark:text-blue-400">Rp {Math.round(totalExpense / (chartData.length || 1)).toLocaleString()}</div>
          <div className="mt-2 text-flag-red/60 text-xs font-medium">{t('burnRateDesc').replace('{period}', t(period))}</div>
        </div>
        <div className="bg-deep-space-blue p-6 rounded-3xl border border-deep-space-blue/20 dark:border-blue-400/20">
          <div className="text-sunflower-gold text-sm font-bold uppercase tracking-widest mb-1">{t('savingsRate')}</div>
          <div className="text-3xl font-black text-white">
            {totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0}%
          </div>
          <div className="mt-2 text-zinc-400 dark:text-zinc-500 text-xs font-medium">{t('savingsRateDesc')}</div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
            {t('transactionHistory')}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800">{t('date')}</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800">{t('description')}</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800">{t('category')}</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800">{t('type')}</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 text-right">{t('amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 dark:text-zinc-500 italic">
                    {t('noTransactions')}
                  </td>
                </tr>
              ) : (
                [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{tx.description}</div>
                      {tx.notes && <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 italic">{tx.notes}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {getCategoryName(tx.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        tx.type === 'income' ? 'bg-vivid-tangerine/10 text-vivid-tangerine' : 'bg-flag-red/10 text-flag-red'
                      }`}>
                        {t(tx.type)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold text-right whitespace-nowrap ${
                      tx.type === 'income' ? 'text-vivid-tangerine' : 'text-flag-red'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'} Rp {tx.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
