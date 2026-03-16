import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, query } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from './AuthContext';
import { Transaction, RecurringTransaction, Category, Task, Target, Achievement, NotificationSetting, DailyQuote, AIProductivityPlan } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface DataContextType {
  transactions: Transaction[];
  recurringTransactions: RecurringTransaction[];
  categories: Category[];
  tasks: Task[];
  targets: Target[];
  unlockedAchievements: { id: string, unlockedAt: string }[];
  notificationSettings: NotificationSetting[];
  dailyQuote: DailyQuote | null;
  aiPlan: AIProductivityPlan | null;
  
  saveTransaction: (t: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  saveRecurringTransaction: (t: RecurringTransaction) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;
  saveCategory: (c: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  saveTask: (t: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  saveTarget: (t: Target) => Promise<void>;
  deleteTarget: (id: string) => Promise<void>;
  saveUnlockedAchievement: (id: string, unlockedAt: string) => Promise<void>;
  saveNotificationSetting: (s: NotificationSetting) => Promise<void>;
  saveDailyQuote: (q: DailyQuote) => Promise<void>;
  saveAIPlan: (p: AIProductivityPlan) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<{ id: string, unlockedAt: string }[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([]);
  const [dailyQuote, setDailyQuote] = useState<DailyQuote | null>(null);
  const [aiPlan, setAiPlan] = useState<AIProductivityPlan | null>(null);
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    throw error;
  }

  const handleError = (err: unknown, operationType: OperationType, path: string | null) => {
    try {
      handleFirestoreError(err, operationType, path);
    } catch (e) {
      if (e instanceof Error) {
        setError(e);
      } else {
        setError(new Error(String(e)));
      }
    }
  };

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setRecurringTransactions([]);
      setCategories([]);
      setTasks([]);
      setTargets([]);
      setUnlockedAchievements([]);
      setNotificationSettings([]);
      setDailyQuote(null);
      setAiPlan(null);
      return;
    }

    const userId = user.uid;

    const unsubTransactions = onSnapshot(collection(db, `users/${userId}/transactions`), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => doc.data() as Transaction));
    }, (error) => {
      handleError(error, OperationType.GET, `users/${userId}/transactions`);
    });

    const unsubRecurring = onSnapshot(collection(db, `users/${userId}/recurring_transactions`), (snapshot) => {
      setRecurringTransactions(snapshot.docs.map(doc => doc.data() as RecurringTransaction));
    }, (error) => {
      handleError(error, OperationType.GET, `users/${userId}/recurring_transactions`);
    });

    const unsubCategories = onSnapshot(collection(db, `users/${userId}/categories`), (snapshot) => {
      setCategories(snapshot.docs.map(doc => doc.data() as Category));
    }, (error) => {
      handleError(error, OperationType.GET, `users/${userId}/categories`);
    });

    const unsubTasks = onSnapshot(collection(db, `users/${userId}/tasks`), (snapshot) => {
      setTasks(snapshot.docs.map(doc => doc.data() as Task));
    }, (error) => {
      handleError(error, OperationType.GET, `users/${userId}/tasks`);
    });

    const unsubTargets = onSnapshot(collection(db, `users/${userId}/targets`), (snapshot) => {
      setTargets(snapshot.docs.map(doc => doc.data() as Target));
    }, (error) => {
      handleError(error, OperationType.GET, `users/${userId}/targets`);
    });

    const unsubAchievements = onSnapshot(collection(db, `users/${userId}/unlocked_achievements`), (snapshot) => {
      setUnlockedAchievements(snapshot.docs.map(doc => doc.data() as { id: string, unlockedAt: string }));
    }, (error) => {
      handleError(error, OperationType.GET, `users/${userId}/unlocked_achievements`);
    });

    const unsubSettings = onSnapshot(collection(db, `users/${userId}/notification_settings`), (snapshot) => {
      setNotificationSettings(snapshot.docs.map(doc => doc.data() as NotificationSetting));
    }, (error) => {
      handleError(error, OperationType.GET, `users/${userId}/notification_settings`);
    });

    const unsubQuote = onSnapshot(doc(db, `users/${userId}/daily_quote/current`), (doc) => {
      if (doc.exists()) {
        setDailyQuote(doc.data() as DailyQuote);
      } else {
        setDailyQuote(null);
      }
    }, (error) => {
      handleError(error, OperationType.GET, `users/${userId}/daily_quote/current`);
    });

    const unsubPlan = onSnapshot(doc(db, `users/${userId}/ai_plan/current`), (doc) => {
      if (doc.exists()) {
        setAiPlan(doc.data() as AIProductivityPlan);
      } else {
        setAiPlan(null);
      }
    }, (error) => {
      handleError(error, OperationType.GET, `users/${userId}/ai_plan/current`);
    });

    return () => {
      unsubTransactions();
      unsubRecurring();
      unsubCategories();
      unsubTasks();
      unsubTargets();
      unsubAchievements();
      unsubSettings();
      unsubQuote();
      unsubPlan();
    };
  }, [user]);

  const saveTransaction = async (t: Transaction) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/transactions/${t.id}`), { ...t, userId: user.uid });
    } catch (error) {
      handleError(error, OperationType.WRITE, `users/${user.uid}/transactions/${t.id}`);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/transactions/${id}`));
    } catch (error) {
      handleError(error, OperationType.DELETE, `users/${user.uid}/transactions/${id}`);
    }
  };

  const saveRecurringTransaction = async (t: RecurringTransaction) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/recurring_transactions/${t.id}`), { ...t, userId: user.uid });
    } catch (error) {
      handleError(error, OperationType.WRITE, `users/${user.uid}/recurring_transactions/${t.id}`);
    }
  };

  const deleteRecurringTransaction = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/recurring_transactions/${id}`));
    } catch (error) {
      handleError(error, OperationType.DELETE, `users/${user.uid}/recurring_transactions/${id}`);
    }
  };

  const saveCategory = async (c: Category) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/categories/${c.id}`), { ...c, userId: user.uid });
    } catch (error) {
      handleError(error, OperationType.WRITE, `users/${user.uid}/categories/${c.id}`);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/categories/${id}`));
    } catch (error) {
      handleError(error, OperationType.DELETE, `users/${user.uid}/categories/${id}`);
    }
  };

  const saveTask = async (t: Task) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/tasks/${t.id}`), { ...t, userId: user.uid });
    } catch (error) {
      handleError(error, OperationType.WRITE, `users/${user.uid}/tasks/${t.id}`);
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/tasks/${id}`));
    } catch (error) {
      handleError(error, OperationType.DELETE, `users/${user.uid}/tasks/${id}`);
    }
  };

  const saveTarget = async (t: Target) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/targets/${t.id}`), { ...t, userId: user.uid });
    } catch (error) {
      handleError(error, OperationType.WRITE, `users/${user.uid}/targets/${t.id}`);
    }
  };

  const deleteTarget = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/targets/${id}`));
    } catch (error) {
      handleError(error, OperationType.DELETE, `users/${user.uid}/targets/${id}`);
    }
  };

  const saveUnlockedAchievement = async (id: string, unlockedAt: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/unlocked_achievements/${id}`), { id, unlockedAt, userId: user.uid });
    } catch (error) {
      handleError(error, OperationType.WRITE, `users/${user.uid}/unlocked_achievements/${id}`);
    }
  };

  const saveNotificationSetting = async (s: NotificationSetting) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/notification_settings/${s.id}`), { ...s, userId: user.uid });
    } catch (error) {
      handleError(error, OperationType.WRITE, `users/${user.uid}/notification_settings/${s.id}`);
    }
  };

  const saveDailyQuote = async (q: DailyQuote) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/daily_quote/current`), { ...q, userId: user.uid });
    } catch (error) {
      handleError(error, OperationType.WRITE, `users/${user.uid}/daily_quote/current`);
    }
  };

  const saveAIPlan = async (p: AIProductivityPlan) => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/ai_plan/current`), { ...p, userId: user.uid });
    } catch (error) {
      handleError(error, OperationType.WRITE, `users/${user.uid}/ai_plan/current`);
    }
  };

  return (
    <DataContext.Provider value={{
      transactions, recurringTransactions, categories, tasks, targets, unlockedAchievements, notificationSettings, dailyQuote, aiPlan,
      saveTransaction, deleteTransaction, saveRecurringTransaction, deleteRecurringTransaction, saveCategory, deleteCategory,
      saveTask, deleteTask, saveTarget, deleteTarget, saveUnlockedAchievement, saveNotificationSetting, saveDailyQuote, saveAIPlan
    }}>
      {children}
    </DataContext.Provider>
  );
};
