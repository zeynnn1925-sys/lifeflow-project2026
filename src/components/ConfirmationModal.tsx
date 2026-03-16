import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  type === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 transition-all"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onCancel();
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all ${
                    type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/20' : 'bg-deep-space-blue hover:bg-deep-space-blue/90 shadow-lg shadow-deep-space-blue/20'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
            
            <button 
              onClick={onCancel}
              className="absolute top-4 right-4 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all"
            >
              <X className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
