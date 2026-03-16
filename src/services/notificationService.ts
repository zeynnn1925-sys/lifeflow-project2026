import { NotificationSetting, Target, Task } from '../types';

class NotificationService {
  private permission: NotificationPermission = 'default';

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    
    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  hasPermission(): boolean {
    return this.permission === 'granted';
  }

  sendNotification(title: string, options?: NotificationOptions) {
    if (this.hasPermission()) {
      new Notification(title, {
        icon: '/favicon.ico', // Default icon
        ...options
      });
    }
  }

  private setLocalStorage(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Ignore
    }
  }

  private getLocalStorage(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  checkAndNotify(settings: NotificationSetting[], targets: Target[], tasks: Task[]) {
    if (!settings || settings.length === 0) return;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const today = now.toISOString().split('T')[0];

    settings.forEach(setting => {
      if (!setting.enabled || !setting.time) return;

      // Check if it's time to notify
      if (setting.time === currentTime) {
        const lastNotifiedKey = `last_notified_${setting.type}_${today}`;
        if (this.getLocalStorage(lastNotifiedKey)) return;

        // Smart Logic for different types
        if (setting.type === 'target') {
          this.handleTargetNotification(targets, today, lastNotifiedKey);
        } else if (setting.type === 'schedule') {
          this.handleScheduleNotification(tasks, today, lastNotifiedKey);
        } else if (setting.type === 'bill') {
          this.handleBillNotification(today, lastNotifiedKey);
        }
      }
    });
  }

  private handleTargetNotification(targets: Target[], today: string, lastNotifiedKey: string) {
    if (!targets || targets.length === 0) return;

    const incompleteTargets = targets.filter(t => t.currentValue < t.targetValue);

    if (incompleteTargets.length > 0) {
      this.sendNotification('Target Harian Belum Tercapai!', {
        body: `Kamu masih punya ${incompleteTargets.length} target yang belum selesai hari ini. Semangat!`,
        tag: 'target-reminder'
      });
      this.setLocalStorage(lastNotifiedKey, 'true');
    }
  }

  private handleScheduleNotification(tasks: Task[], today: string, lastNotifiedKey: string) {
    if (!tasks || tasks.length === 0) return;

    const todaysTasks = tasks.filter(t => t.date === today && !t.completed);

    if (todaysTasks.length > 0) {
      this.sendNotification('Jadwal Hari Ini', {
        body: `Ada ${todaysTasks.length} aktivitas yang belum selesai di jadwalmu.`,
        tag: 'schedule-reminder'
      });
      this.setLocalStorage(lastNotifiedKey, 'true');
    }
  }

  private handleBillNotification(today: string, lastNotifiedKey: string) {
    // Similar logic for bills if needed
    // For now, just a simple reminder
    this.sendNotification('Pengingat Tagihan', {
      body: 'Jangan lupa cek tagihanmu minggu ini!',
      tag: 'bill-reminder'
    });
    this.setLocalStorage(lastNotifiedKey, 'true');
  }
}

export const notificationService = new NotificationService();
