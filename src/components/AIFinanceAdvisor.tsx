import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Transaction, Category } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIFinanceAdvisorProps {
  transactions: Transaction[];
  categories: Category[];
}

export default function AIFinanceAdvisor({ transactions, categories }: AIFinanceAdvisorProps) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getAdvice = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API key is missing. Please set VITE_GEMINI_API_KEY in your environment.");
      }

      const ai = new GoogleGenAI({ apiKey });

      const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      
      const allocation = { needs: 0, wants: 0, savings: 0 };
      const expensesByCategory: Record<string, number> = {};

      transactions.filter(t => t.type === 'expense').forEach(t => {
        const cat = categories.find(c => c.id === t.category || c.name === t.category);
        const catName = cat?.name || t.category;
        
        if (cat?.group === 'Needs') allocation.needs += t.amount;
        else if (cat?.group === 'Wants') allocation.wants += t.amount;
        else if (cat?.group === 'Savings & Debt') allocation.savings += t.amount;

        expensesByCategory[catName] = (expensesByCategory[catName] || 0) + t.amount;
      });

      const totalExpense = allocation.needs + allocation.wants + allocation.savings;
      const targetNeeds = totalIncome * 0.5;
      const targetWants = totalIncome * 0.3;
      const targetSavings = totalIncome * 0.2;

      const prompt = `
        You are an expert financial advisor. The user wants to strictly follow the 50/30/20 budgeting rule (50% Needs, 30% Wants, 20% Savings).
        Please analyze their current finances and provide specific, actionable advice on how to adjust their spending to hit these targets exactly.
        
        Current Financial Data:
        - Total Income: Rp ${totalIncome.toLocaleString()}
        - Total Expenses: Rp ${totalExpense.toLocaleString()}
        
        Current Allocation:
        - Needs: Rp ${allocation.needs.toLocaleString()} (Target: Rp ${targetNeeds.toLocaleString()})
        - Wants: Rp ${allocation.wants.toLocaleString()} (Target: Rp ${targetWants.toLocaleString()})
        - Savings: Rp ${allocation.savings.toLocaleString()} (Target: Rp ${targetSavings.toLocaleString()})
        
        Expenses by Category:
        ${Object.entries(expensesByCategory).map(([cat, amount]) => `- ${cat}: Rp ${amount.toLocaleString()}`).join('\n')}
        
        Please provide your advice in ${language === 'id' ? 'Indonesian' : 'English'}. Keep it concise, practical, and formatted with bullet points or short paragraphs. Focus on exactly what they need to cut or increase to hit the 50/30/20 targets perfectly.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setAdvice(response.text || "No advice generated.");
    } catch (err: any) {
      console.error("AI Advisor Error:", err);
      setError(err.message || "Failed to generate advice. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-deep-space-blue to-zinc-900 p-6 rounded-3xl border border-black/10 shadow-lg text-white mt-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-sunflower-gold shrink-0" />
            {language === 'id' ? 'Penasihat AI 50/30/20' : '50/30/20 AI Advisor'}
          </h3>
          <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">
            {language === 'id' 
              ? 'Dapatkan rekomendasi AI untuk mencapai alokasi 50/30/20 yang tepat.' 
              : 'Get AI recommendations to achieve the exact 50/30/20 allocation.'}
          </p>
        </div>
        <button
          onClick={getAdvice}
          disabled={loading}
          className="w-full sm:w-auto px-4 py-2 bg-sunflower-gold text-deep-space-blue dark:text-blue-400 font-bold rounded-xl hover:bg-sunflower-gold/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {language === 'id' ? 'Menganalisis...' : 'Analyzing...'}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {language === 'id' ? 'Minta Saran AI' : 'Get AI Advice'}
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-flag-red/20 border border-flag-red/30 p-4 rounded-xl flex items-start gap-3 text-flag-red mb-4">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {advice && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white/5 border border-white/10 p-5 rounded-2xl prose prose-invert prose-sm max-w-none"
        >
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{advice}</ReactMarkdown>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
