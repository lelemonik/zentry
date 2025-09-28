// IndexedDB wrapper for offline data storage
class OfflineDB {
  private db: IDBDatabase | null = null;
  private dbName = 'ZentryOfflineDB';
  private dbVersion = 3;

  // Initialize the database
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('dueDate', 'dueDate', { unique: false });
          taskStore.createIndex('completed', 'completed', { unique: false });
          taskStore.createIndex('hasReminder', 'hasReminder', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('schedules')) {
          const scheduleStore = db.createObjectStore('schedules', { keyPath: 'id' });
          scheduleStore.createIndex('date', 'date', { unique: false });
          scheduleStore.createIndex('time', 'time', { unique: false });
          scheduleStore.createIndex('hasReminder', 'hasReminder', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('notes')) {
          const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
          noteStore.createIndex('lastModified', 'lastModified', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('pendingSync')) {
          const syncStore = db.createObjectStore('pendingSync', { keyPath: 'id' });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('reminders')) {
          const reminderStore = db.createObjectStore('reminders', { keyPath: 'id' });
          reminderStore.createIndex('triggerTime', 'triggerTime', { unique: false });
          reminderStore.createIndex('type', 'type', { unique: false });
          reminderStore.createIndex('isActive', 'isActive', { unique: false });
        }

        if (!db.objectStoreNames.contains('themes')) {
          const themeStore = db.createObjectStore('themes', { keyPath: 'id' });
          themeStore.createIndex('type', 'type', { unique: false });
          themeStore.createIndex('createdAt', 'createdAt', { unique: false });
          themeStore.createIndex('lastModified', 'lastModified', { unique: false });
        }

        if (!db.objectStoreNames.contains('userPreferences')) {
          const prefStore = db.createObjectStore('userPreferences', { keyPath: 'key' });
          prefStore.createIndex('lastModified', 'lastModified', { unique: false });
        }

        if (!db.objectStoreNames.contains('userProfiles')) {
          const profileStore = db.createObjectStore('userProfiles', { keyPath: 'id' });
          profileStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('userData')) {
          const userDataStore = db.createObjectStore('userData', { keyPath: 'id' });
          userDataStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
    });
  }

  // Generic method to add data
  async add(storeName: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Generic method to update data
  async update(storeName: string, data: any): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      } catch (error) {
        reject(new Error(`Store '${storeName}' not found. Available stores: ${Array.from(this.db!.objectStoreNames).join(', ')}`));
      }
    });
  }

  // Generic method to get data by ID
  async get(storeName: string, id: string): Promise<any> {
    if (!this.db) {
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Generic method to get all data from a store
  async getAll(storeName: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Generic method to delete data
  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Get data by index
  async getByIndex(storeName: string, indexName: string, value: any): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Task-specific methods
  async addTask(task: any): Promise<void> {
    const taskWithDefaults = {
      id: task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      lastModified: Date.now(),
      completed: false,
      hasReminder: false,
      ...task
    };
    
    await this.add('tasks', taskWithDefaults);
    
    // Add to pending sync if offline
    if (!navigator.onLine) {
      await this.addToPendingSync('task', 'add', taskWithDefaults);
    }
  }

  async updateTask(task: any): Promise<void> {
    task.lastModified = Date.now();
    await this.update('tasks', task);
    
    // Add to pending sync if offline
    if (!navigator.onLine) {
      await this.addToPendingSync('task', 'update', task);
    }
  }

  async getTasks(): Promise<any[]> {
    return await this.getAll('tasks');
  }

  async getUpcomingTasks(): Promise<any[]> {
    const tasks = await this.getTasks();
    const now = Date.now();
    
    return tasks.filter(task => 
      !task.completed && 
      task.dueDate && 
      new Date(task.dueDate).getTime() > now
    ).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  // Schedule-specific methods
  async addSchedule(schedule: any): Promise<void> {
    const scheduleWithDefaults = {
      id: schedule.id || `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      lastModified: Date.now(),
      hasReminder: false,
      ...schedule
    };
    
    await this.add('schedules', scheduleWithDefaults);
    
    // Add to pending sync if offline
    if (!navigator.onLine) {
      await this.addToPendingSync('schedule', 'add', scheduleWithDefaults);
    }
  }

  async updateSchedule(schedule: any): Promise<void> {
    schedule.lastModified = Date.now();
    await this.update('schedules', schedule);
    
    // Add to pending sync if offline
    if (!navigator.onLine) {
      await this.addToPendingSync('schedule', 'update', schedule);
    }
  }

  async getSchedules(): Promise<any[]> {
    return await this.getAll('schedules');
  }

  async getTodaySchedules(): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0];
    return await this.getByIndex('schedules', 'date', today);
  }

  // Note-specific methods
  async addNote(note: any): Promise<void> {
    const noteWithDefaults = {
      id: note.id || `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      lastModified: Date.now(),
      ...note
    };
    
    await this.add('notes', noteWithDefaults);
    
    // Add to pending sync if offline
    if (!navigator.onLine) {
      await this.addToPendingSync('note', 'add', noteWithDefaults);
    }
  }

  async updateNote(note: any): Promise<void> {
    note.lastModified = Date.now();
    await this.update('notes', note);
    
    // Add to pending sync if offline
    if (!navigator.onLine) {
      await this.addToPendingSync('note', 'update', note);
    }
  }

  async getNotes(): Promise<any[]> {
    return await this.getAll('notes');
  }

  // Reminder methods
  async addReminder(reminder: any): Promise<void> {
    const reminderWithDefaults = {
      id: reminder.id || `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      isActive: true,
      ...reminder
    };
    
    await this.add('reminders', reminderWithDefaults);
  }

  async getActiveReminders(): Promise<any[]> {
    return await this.getByIndex('reminders', 'isActive', true);
  }

  async getUpcomingReminders(): Promise<any[]> {
    const reminders = await this.getActiveReminders();
    const now = Date.now();
    
    return reminders.filter(reminder => 
      reminder.triggerTime > now
    ).sort((a, b) => a.triggerTime - b.triggerTime);
  }

  async deactivateReminder(id: string): Promise<void> {
    const reminder = await this.get('reminders', id);
    if (reminder) {
      reminder.isActive = false;
      await this.update('reminders', reminder);
    }
  }

  // Pending sync methods
  async addToPendingSync(type: string, action: string, data: any): Promise<void> {
    const syncItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      action,
      data,
      timestamp: Date.now()
    };
    
    await this.add('pendingSync', syncItem);
  }

  async getPendingSync(): Promise<any[]> {
    return await this.getAll('pendingSync');
  }

  async removePendingSync(id: string): Promise<void> {
    await this.delete('pendingSync', id);
  }

  // Clear all pending sync items
  async clearPendingSync(): Promise<void> {
    const pendingItems = await this.getPendingSync();
    for (const item of pendingItems) {
      await this.removePendingSync(item.id);
    }
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    const stores = ['tasks', 'schedules', 'notes', 'pendingSync', 'reminders'];
    
    for (const storeName of stores) {
      const items = await this.getAll(storeName);
      for (const item of items) {
        await this.delete(storeName, item.id);
      }
    }
  }

  async exportData(): Promise<any> {
    return {
      tasks: await this.getTasks(),
      schedules: await this.getSchedules(),
      notes: await this.getNotes(),
      reminders: await this.getActiveReminders(),
      exportDate: new Date().toISOString()
    };
  }

  async importData(data: any): Promise<void> {
    // Clear existing data
    await this.clearAllData();
    
    // Import new data
    if (data.tasks) {
      for (const task of data.tasks) {
        await this.add('tasks', task);
      }
    }
    
    if (data.schedules) {
      for (const schedule of data.schedules) {
        await this.add('schedules', schedule);
      }
    }
    
    if (data.notes) {
      for (const note of data.notes) {
        await this.add('notes', note);
      }
    }
    
    if (data.reminders) {
      for (const reminder of data.reminders) {
        await this.add('reminders', reminder);
      }
    }
  }

  // User preferences management
  async saveUserPreferences(preferences: any): Promise<void> {
    const prefData = {
      key: 'userPreferences',
      data: preferences,
      lastModified: new Date()
    };
    await this.update('userPreferences', prefData);
  }

  async getUserPreferences(): Promise<any> {
    const result = await this.get('userPreferences', 'userPreferences');
    return result ? result.data : null;
  }

  async saveUserProfile(profile: any): Promise<void> {
    const profileData = {
      key: 'userProfile',
      data: profile,
      lastModified: new Date()
    };
    await this.update('userPreferences', profileData);
  }

  async getUserProfile(): Promise<any> {
    const result = await this.get('userPreferences', 'userProfile');
    return result ? result.data : null;
  }

  // Method to clear/reset the database
  async clearDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close();
        this.db = null;
      }
      
      const deleteRequest = indexedDB.deleteDatabase(this.dbName);
      deleteRequest.onerror = () => reject(deleteRequest.error);
      deleteRequest.onsuccess = () => resolve();
    });
  }
}

// Create and export singleton instance
export const offlineDB = new OfflineDB();

// Initialize the database
export const initOfflineDB = async (): Promise<void> => {
  try {
    await offlineDB.init();
    console.log('Offline database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize offline database:', error);
    throw error;
  }
};