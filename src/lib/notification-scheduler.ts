import { offlineDB } from './offline-db';

export interface ReminderOptions {
  id: string;
  title: string;
  body: string;
  triggerTime: number;
  type: 'task' | 'schedule' | 'custom';
  entityId: string; // ID of the task/schedule this reminder is for
  repeatInterval?: number; // Minutes to repeat (0 = no repeat)
  snoozeCount?: number;
  maxSnoozes?: number;
  isActive?: boolean;
}

class NotificationScheduler {
  private scheduledTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private serviceWorker: ServiceWorker | null = null;

  constructor() {
    this.initServiceWorker();
  }

  private async initServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        this.serviceWorker = registration.active;
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
      } catch (error) {
        console.error('Failed to initialize service worker for notifications:', error);
      }
    }
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;
    
    switch (type) {
      case 'notification-click':
        this.handleNotificationClick(data);
        break;
      case 'notification-action':
        this.handleNotificationAction(data);
        break;
    }
  }

  private async handleNotificationClick(data: any): Promise<void> {
    console.log('Notification clicked:', data);
    
    // Navigate to relevant page based on notification type
    if (data.type === 'task') {
      window.location.href = '/dashboard?tab=tasks';
    } else if (data.type === 'schedule') {
      window.location.href = '/dashboard?tab=schedule';
    } else {
      // Default navigation to home for authenticated users
      window.location.href = '/';
    }
  }

  private async handleNotificationAction(data: any): Promise<void> {
    const { action, reminderId } = data;
    
    switch (action) {
      case 'complete':
        await this.handleCompleteAction(reminderId);
        break;
      case 'snooze':
        await this.handleSnoozeAction(reminderId, 10); // 10 minute snooze
        break;
      case 'dismiss':
        await this.cancelReminder(reminderId);
        break;
    }
  }

  private async handleCompleteAction(reminderId: string): Promise<void> {
    try {
      const reminder = await offlineDB.get('reminders', reminderId);
      if (reminder && reminder.type === 'task') {
        // Mark task as completed
        const task = await offlineDB.get('tasks', reminder.entityId);
        if (task) {
          task.completed = true;
          task.completedAt = Date.now();
          await offlineDB.updateTask(task);
        }
      }
      
      // Deactivate the reminder
      await offlineDB.deactivateReminder(reminderId);
    } catch (error) {
      console.error('Error handling complete action:', error);
    }
  }

  private async handleSnoozeAction(reminderId: string, minutes: number): Promise<void> {
    try {
      const reminder = await offlineDB.get('reminders', reminderId);
      if (reminder) {
        const maxSnoozes = reminder.maxSnoozes || 3;
        const currentSnoozes = reminder.snoozeCount || 0;
        
        if (currentSnoozes < maxSnoozes) {
          // Create new reminder for snooze time
          const snoozeTime = Date.now() + (minutes * 60 * 1000);
          const snoozeReminder: ReminderOptions = {
            ...reminder,
            id: `${reminder.id}-snooze-${currentSnoozes + 1}`,
            triggerTime: snoozeTime,
            snoozeCount: currentSnoozes + 1,
            title: `⏰ ${reminder.title} (Snoozed)`,
          };
          
          await this.scheduleReminder(snoozeReminder);
        }
        
        // Deactivate original reminder
        await offlineDB.deactivateReminder(reminderId);
      }
    } catch (error) {
      console.error('Error handling snooze action:', error);
    }
  }

  async scheduleReminder(options: ReminderOptions): Promise<string> {
    try {
      // Request notification permission if not granted
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      
      if (Notification.permission !== 'granted') {
        throw new Error('Notification permission not granted');
      }

      // Save reminder to IndexedDB
      await offlineDB.addReminder(options);
      
      // Calculate delay
      const delay = options.triggerTime - Date.now();
      
      if (delay <= 0) {
        // Show notification immediately
        await this.showNotification(options);
        return options.id;
      }

      // For short delays (< 30 minutes), use setTimeout
      if (delay <= 30 * 60 * 1000) {
        const timeoutId = setTimeout(() => {
          this.showNotification(options);
        }, delay);
        
        this.scheduledTimeouts.set(options.id, timeoutId);
      } else {
        // For longer delays, register with service worker
        await this.scheduleWithServiceWorker(options);
      }

      // Set up recurring reminder if specified
      if (options.repeatInterval && options.repeatInterval > 0) {
        await this.scheduleRecurringReminder(options);
      }

      return options.id;
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      throw error;
    }
  }

  private async scheduleWithServiceWorker(options: ReminderOptions): Promise<void> {
    if (this.serviceWorker) {
      this.serviceWorker.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        payload: options
      });
    }
  }

  private async scheduleRecurringReminder(options: ReminderOptions): Promise<void> {
    const nextTriggerTime = options.triggerTime + (options.repeatInterval! * 60 * 1000);
    
    const recurringReminder: ReminderOptions = {
      ...options,
      id: `${options.id}-recurring-${Date.now()}`,
      triggerTime: nextTriggerTime
    };

    // Schedule the next occurrence
    setTimeout(() => {
      this.scheduleReminder(recurringReminder);
    }, 1000); // Small delay to prevent conflicts
  }

  private async showNotification(options: ReminderOptions): Promise<void> {
    try {
      const notificationOptions: NotificationOptions & { 
        vibrate?: number[];
        actions?: Array<{ action: string; title: string }>;
      } = {
        body: options.body,
        icon: '/icon-192x192.svg',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        data: {
          reminderId: options.id,
          type: options.type,
          entityId: options.entityId
        },
        actions: []
      };

      // Add context-specific actions
      if (options.type === 'task') {
        notificationOptions.actions = [
          {
            action: 'complete',
            title: '✓ Mark Complete'
          },
          {
            action: 'snooze',
            title: '⏰ Snooze 10min'
          }
        ];
      } else if (options.type === 'schedule') {
        notificationOptions.actions = [
          {
            action: 'snooze',
            title: '⏰ Snooze 10min'
          },
          {
            action: 'dismiss',
            title: '✕ Dismiss'
          }
        ];
      }

      // Show browser notification
      const notification = new Notification(options.title, notificationOptions);
      
      // Auto-close after 10 seconds if not interacted with
      setTimeout(() => {
        notification.close();
      }, 10000);

      notification.onclick = () => {
        this.handleNotificationClick(notificationOptions.data);
        notification.close();
      };

      // Play notification sound if supported
      await this.playNotificationSound();

    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  private async playNotificationSound(): Promise<void> {
    try {
      // Create a short notification beep
      if ('AudioContext' in window || 'webkitAudioContext' in window) {
        const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  async cancelReminder(reminderId: string): Promise<void> {
    try {
      // Clear setTimeout if exists
      const timeoutId = this.scheduledTimeouts.get(reminderId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.scheduledTimeouts.delete(reminderId);
      }

      // Cancel with service worker
      if (this.serviceWorker) {
        this.serviceWorker.postMessage({
          type: 'CANCEL_NOTIFICATION',
          payload: { id: reminderId }
        });
      }

      // Deactivate in database
      await offlineDB.deactivateReminder(reminderId);
    } catch (error) {
      console.error('Error canceling reminder:', error);
    }
  }

  async getActiveReminders(): Promise<ReminderOptions[]> {
    return await offlineDB.getActiveReminders();
  }

  async getUpcomingReminders(limit = 10): Promise<ReminderOptions[]> {
    const reminders = await offlineDB.getUpcomingReminders();
    return reminders.slice(0, limit);
  }

  // Utility methods for common scheduling scenarios
  async scheduleTaskReminder(task: any, reminderMinutes: number): Promise<string> {
    if (!task.dueDate) {
      throw new Error('Task must have a due date to schedule reminder');
    }

    const dueTime = new Date(task.dueDate).getTime();
    const triggerTime = dueTime - (reminderMinutes * 60 * 1000);

    const reminder: ReminderOptions = {
      id: `task-reminder-${task.id}`,
      title: `📋 Task Reminder`,
      body: `"${task.title}" is due in ${reminderMinutes} minutes`,
      triggerTime,
      type: 'task',
      entityId: task.id,
      maxSnoozes: 3
    };

    return await this.scheduleReminder(reminder);
  }

  async scheduleScheduleReminder(schedule: any, reminderMinutes: number): Promise<string> {
    if (!schedule.date || !schedule.time) {
      throw new Error('Schedule must have date and time to set reminder');
    }

    const scheduleDateTime = new Date(`${schedule.date}T${schedule.time}`).getTime();
    const triggerTime = scheduleDateTime - (reminderMinutes * 60 * 1000);

    const reminder: ReminderOptions = {
      id: `schedule-reminder-${schedule.id}`,
      title: `📅 ${schedule.subject || 'Schedule Reminder'}`,
      body: `"${schedule.subject}" starts in ${reminderMinutes} minutes`,
      triggerTime,
      type: 'schedule',
      entityId: schedule.id,
      maxSnoozes: 2
    };

    return await this.scheduleReminder(reminder);
  }

  async scheduleRecurringScheduleReminder(schedule: any, reminderMinutes: number, repeatDays: number[]): Promise<string> {
    // Schedule reminders for specific days of the week
    const reminders: Promise<string>[] = [];
    
    for (const dayOfWeek of repeatDays) {
      const nextOccurrence = this.getNextWeekdayDate(dayOfWeek, schedule.time);
      const triggerTime = nextOccurrence.getTime() - (reminderMinutes * 60 * 1000);
      
      const reminder: ReminderOptions = {
        id: `schedule-recurring-${schedule.id}-${dayOfWeek}`,
        title: `📅 ${schedule.subject || 'Recurring Schedule'}`,
        body: `"${schedule.subject}" starts in ${reminderMinutes} minutes`,
        triggerTime,
        type: 'schedule',
        entityId: schedule.id,
        repeatInterval: 7 * 24 * 60, // Repeat weekly
        maxSnoozes: 2
      };

      reminders.push(this.scheduleReminder(reminder));
    }

    const results = await Promise.all(reminders);
    return results[0]; // Return first reminder ID
  }

  private getNextWeekdayDate(dayOfWeek: number, time: string): Date {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    const targetDate = new Date(now);
    targetDate.setHours(hours, minutes, 0, 0);
    
    // Calculate days until target day of week
    const daysUntilTarget = (dayOfWeek - now.getDay() + 7) % 7;
    if (daysUntilTarget === 0 && targetDate <= now) {
      // If it's today but time has passed, schedule for next week
      targetDate.setDate(targetDate.getDate() + 7);
    } else {
      targetDate.setDate(targetDate.getDate() + daysUntilTarget);
    }
    
    return targetDate;
  }

  // Initialize scheduler and load existing reminders
  async initialize(): Promise<void> {
    try {
      console.log('Initializing notification scheduler...');
      
      // Request notification permission
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      // Load and reschedule active reminders
      const activeReminders = await this.getActiveReminders();
      let rescheduledCount = 0;

      for (const reminder of activeReminders) {
        const timeRemaining = reminder.triggerTime - Date.now();
        
        if (timeRemaining > 0) {
          // Reschedule future reminders
          try {
            await this.scheduleReminder(reminder);
            rescheduledCount++;
          } catch (error) {
            console.error('Failed to reschedule reminder:', reminder.id, error);
          }
        } else {
          // Deactivate past reminders
          await offlineDB.deactivateReminder(reminder.id);
        }
      }

      console.log(`Notification scheduler initialized. Rescheduled ${rescheduledCount} reminders.`);
    } catch (error) {
      console.error('Failed to initialize notification scheduler:', error);
    }
  }
}

// Create and export singleton instance
export const notificationScheduler = new NotificationScheduler();