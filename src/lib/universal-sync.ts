// Universal Data Sync Service
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { auth, db, isUsingDemoConfig } from './firebase';
import { offlineDB } from './offline-db';

export interface SyncData {
  id: string;
  data: any;
  updatedAt: number;
  syncedAt?: number;
  userId: string;
}

export interface UserProfileSync {
  displayName: string;
  email: string;
  bio: string;
  location: string;
  website: string;
  phone: string;
  joinDate: string;
  photoURL: string;
}

export interface UserDataSync {
  displayName: string;
  email: string;
  university: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate?: string;
  dueTime?: string;
  hasReminder: boolean;
  reminderMinutes: number;
  reminderId?: string;
  createdAt: Date;
  lastModified?: number;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string; // ISO date string (YYYY-MM-DD)
  startTime: string;
  endTime: string;
  color: string;
  hasReminder: boolean;
  reminderMinutes: number;
  reminderId?: string;
  isRecurring: boolean;
  eventType: 'class' | 'meeting' | 'appointment' | 'personal' | 'work' | 'other';
  createdAt?: Date;
  lastModified?: number;
}

// Keep ClassItem for backward compatibility, mapping to EventItem
export interface ClassItem extends Omit<EventItem, 'title' | 'description' | 'eventType'> {
  name: string;
  organizer: string;
}

export class UniversalSync {
  private static instance: UniversalSync;
  private listeners: Map<string, () => void> = new Map();
  private autoSaveTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private isOnline: boolean = navigator.onLine;

  private constructor() {
    this.setupNetworkListeners();
    this.setupAuthListener();
  }

  public static getInstance(): UniversalSync {
    if (!UniversalSync.instance) {
      UniversalSync.instance = new UniversalSync();
    }
    return UniversalSync.instance;
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('🌐 Network online - triggering sync');
      this.isOnline = true;
      this.syncPendingChanges();
    });

    window.addEventListener('offline', () => {
      console.log('🌐 Network offline - data will be cached locally');
      this.isOnline = false;
    });
  }

  private setupAuthListener() {
    if (!auth || isUsingDemoConfig) {
      console.log('🔄 UniversalSync: Using offline-only sync (Firebase not configured)');
      return;
    }

    // Listen for auth state changes to sync data when user logs in
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('👤 UniversalSync: User authenticated - setting up real-time sync for:', user.email);
        this.setupRealtimeListeners(user.uid);
        // Sync any pending local changes to Firestore
        await this.syncPendingChanges();
      } else {
        console.log('👤 UniversalSync: User logged out - stopping real-time sync');
        this.clearListeners();
      }
    });
  }

  private setupRealtimeListeners(userId: string) {
    if (!db || isUsingDemoConfig) return;

    // Listen for profile changes
    const profileDocRef = doc(db, 'userProfiles', userId);
    const unsubscribeProfile = onSnapshot(profileDocRef, (doc) => {
      if (doc.exists()) {
        console.log('📱 Received profile update from another device');
        const data = doc.data();
        this.handleRemoteUpdate('userProfiles', userId, data);
      }
    }, (error) => {
      console.error('Profile listener error:', error);
    });

    // Listen for user data changes
    const userDataDocRef = doc(db, 'userData', userId);
    const unsubscribeUserData = onSnapshot(userDataDocRef, (doc) => {
      if (doc.exists()) {
        console.log('📱 Received user data update from another device');
        const data = doc.data();
        this.handleRemoteUpdate('userData', userId, data);
      }
    }, (error) => {
      console.error('User data listener error:', error);
    });

    // Listen for notes changes
    const notesDocRef = doc(db, 'notes', userId);
    const unsubscribeNotes = onSnapshot(notesDocRef, (doc) => {
      if (doc.exists()) {
        console.log('📱 Received notes update from another device');
        const data = doc.data();
        this.handleRemoteUpdate('notes', userId, data);
      }
    }, (error) => {
      console.error('Notes listener error:', error);
    });

    // Listen for tasks changes
    const tasksDocRef = doc(db, 'tasks', userId);
    const unsubscribeTasks = onSnapshot(tasksDocRef, (doc) => {
      if (doc.exists()) {
        console.log('📱 Received tasks update from another device');
        const data = doc.data();
        this.handleRemoteUpdate('tasks', userId, data);
      }
    }, (error) => {
      console.error('Tasks listener error:', error);
    });

    // Listen for schedules changes
    const schedulesDocRef = doc(db, 'schedules', userId);
    const unsubscribeSchedules = onSnapshot(schedulesDocRef, (doc) => {
      if (doc.exists()) {
        console.log('📱 Received schedules update from another device');
        const data = doc.data();
        this.handleRemoteUpdate('schedules', userId, data);
      }
    }, (error) => {
      console.error('Schedules listener error:', error);
    });

    // Store unsubscribe functions
    this.listeners.set('profile', unsubscribeProfile);
    this.listeners.set('userData', unsubscribeUserData);
    this.listeners.set('notes', unsubscribeNotes);
    this.listeners.set('tasks', unsubscribeTasks);
    this.listeners.set('schedules', unsubscribeSchedules);
  }

  private clearListeners() {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }

  private async handleRemoteUpdate(collection: string, userId: string, remoteData: any) {
    try {
      // Get local data to compare timestamps
      const localData = await offlineDB.get(collection, userId);
      
      if (!localData || (remoteData.updatedAt && remoteData.updatedAt > localData.updatedAt)) {
        console.log(`📥 Applying remote update for ${collection}`);
        
        // Update local storage with remote data
        await offlineDB.update(collection, {
          id: userId,
          data: remoteData.data || remoteData,
          updatedAt: remoteData.updatedAt || Date.now(),
          syncedAt: Date.now()
        });

        // Trigger UI updates by dispatching custom events
        window.dispatchEvent(new CustomEvent(`${collection}Updated`, {
          detail: { userId, data: remoteData.data || remoteData }
        }));
      }
    } catch (error) {
      console.error(`Error handling remote update for ${collection}:`, error);
    }
  }

  // Auto-save with debouncing
  public async autoSave(collection: string, userId: string, data: any, delay: number = 2000) {
    // Clear existing timeout for this collection
    const timeoutKey = `${collection}_${userId}`;
    const existingTimeout = this.autoSaveTimeouts.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout for auto-save
    const timeout = setTimeout(async () => {
      console.log(`💾 Auto-saving ${collection} for user ${userId}`);
      await this.saveData(collection, userId, data);
      this.autoSaveTimeouts.delete(timeoutKey);
    }, delay);

    this.autoSaveTimeouts.set(timeoutKey, timeout);
  }

  // Universal save function
  public async saveData(collection: string, userId: string, data: any): Promise<void> {
    const timestamp = Date.now();
    
    // Always save to local storage first (for offline functionality)
    try {
      await offlineDB.init();
      await offlineDB.update(collection, {
        id: userId,
        data,
        updatedAt: timestamp,
        syncedAt: this.isOnline && !isUsingDemoConfig ? timestamp : undefined
      });
      console.log(`💾 Saved ${collection} locally`);
    } catch (error) {
      console.error(`Failed to save ${collection} locally:`, error);
    }

    // Save to Firestore if online and configured
    if (this.isOnline && !isUsingDemoConfig && db && auth?.currentUser) {
      try {
        const docRef = doc(db, collection, userId);
        await setDoc(docRef, {
          ...data,
          updatedAt: timestamp,
          syncedAt: serverTimestamp(),
          userId
        }, { merge: true });
        
        console.log(`☁️ Synced ${collection} to Firestore`);
        
        // Update local record to mark as synced
        await offlineDB.update(collection, {
          id: userId,
          data,
          updatedAt: timestamp,
          syncedAt: timestamp
        });
      } catch (error) {
        console.error(`Failed to sync ${collection} to Firestore:`, error);
        // Mark for pending sync
        await this.markForPendingSync(collection, userId, data, timestamp);
      }
    } else if (!this.isOnline) {
      // Mark for pending sync when offline
      await this.markForPendingSync(collection, userId, data, timestamp);
    }
  }

  private async markForPendingSync(collection: string, userId: string, data: any, timestamp: number) {
    try {
      await offlineDB.update('pendingSync', {
        id: `${collection}_${userId}`,
        collection,
        userId,
        data,
        updatedAt: timestamp
      });
      console.log(`📋 Marked ${collection} for pending sync`);
    } catch (error) {
      console.error('Failed to mark for pending sync:', error);
    }
  }

  // Load data with fallback priority: Local -> Firestore -> Default
  public async loadData(collection: string, userId: string): Promise<any> {
    console.log(`🔍 Loading ${collection} for user ${userId}...`);
    
    // Try local storage first for faster loading
    try {
      await offlineDB.init();
      const localData = await offlineDB.get(collection, userId);
      if (localData && localData.data) {
        console.log(`💾 Loaded ${collection} from local storage`, localData.data);
        return localData.data;
      }
    } catch (error) {
      console.error(`Failed to load ${collection} from local storage:`, error);
    }

    // Try Firestore if local data not available and we're online
    if (this.isOnline && !isUsingDemoConfig && db && auth?.currentUser) {
      try {
        const docRef = doc(db, collection, userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const firestoreData = docSnap.data();
          console.log(`☁️ Loaded ${collection} from Firestore`, firestoreData);
          
          // Update local storage with Firestore data
          try {
            await offlineDB.update(collection, {
              id: userId,
              data: firestoreData,
              updatedAt: firestoreData.updatedAt || Date.now(),
              syncedAt: Date.now()
            });
          } catch (localSaveError) {
            console.error('Failed to save Firestore data locally:', localSaveError);
          }
          
          return firestoreData;
        } else {
          console.log(`� No ${collection} document found in Firestore`);
        }
      } catch (error) {
        console.error(`Failed to load ${collection} from Firestore:`, error);
      }
    }

    // Return appropriate default based on collection type
    console.log(`📁 No ${collection} data found, returning empty default`);
    
    // Return empty structure based on collection type
    switch (collection) {
      case 'notes':
        return { notes: [] };
      case 'tasks':
        return { tasks: [] };
      case 'schedules':
        return { schedules: [] };
      default:
        return {};
    }
  }

  // Sync all pending changes
  public async syncPendingChanges(): Promise<void> {
    if (!this.isOnline || isUsingDemoConfig || !db || !auth?.currentUser) {
      return;
    }

    try {
      const pendingItems = await offlineDB.getAll('pendingSync');
      console.log(`🔄 Syncing ${pendingItems.length} pending changes`);
      
      for (const item of pendingItems) {
        try {
          const { collection, userId, data, updatedAt } = item.data || item;
          
          const docRef = doc(db, collection, userId);
          await setDoc(docRef, {
            ...data,
            updatedAt,
            syncedAt: serverTimestamp(),
            userId
          }, { merge: true });
          
          // Remove from pending sync
          await offlineDB.delete('pendingSync', item.id);
          console.log(`✅ Synced pending ${collection} for ${userId}`);
        } catch (error) {
          console.error('Failed to sync pending item:', error);
        }
      }
    } catch (error) {
      console.error('Failed to sync pending changes:', error);
    }
  }

  // Clear all data (for logout)
  public async clearUserData(userId: string): Promise<void> {
    try {
      // Clear local data
      await offlineDB.delete('userProfiles', userId);
      await offlineDB.delete('userData', userId);
      await offlineDB.delete('notes', userId);
      await offlineDB.delete('tasks', userId);
      await offlineDB.delete('schedules', userId);
      
      // Clear pending sync items for this user
      const pendingItems = await offlineDB.getAll('pendingSync');
      for (const item of pendingItems) {
        if (item.data?.userId === userId) {
          await offlineDB.delete('pendingSync', item.id);
        }
      }
      
      console.log(`🗑️ Cleared local data for user ${userId}`);
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  }

  // Force sync from Firestore (useful for manual refresh)
  public async forceSyncFromFirestore(userId: string): Promise<void> {
    if (!this.isOnline || isUsingDemoConfig || !db || !auth?.currentUser) {
      throw new Error('Cannot sync: offline or Firebase not configured');
    }

    const collections = ['userProfiles', 'userData', 'notes', 'tasks', 'schedules'];
    
    for (const collection of collections) {
      try {
        const docRef = doc(db, collection, userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          await offlineDB.update(collection, {
            id: userId,
            data,
            updatedAt: data.updatedAt || Date.now(),
            syncedAt: Date.now()
          });
          
          // Trigger UI update
          window.dispatchEvent(new CustomEvent(`${collection}Updated`, {
            detail: { userId, data }
          }));
        }
      } catch (error) {
        console.error(`Failed to force sync ${collection}:`, error);
      }
    }
  }
}

// Create singleton instance
export const universalSync = UniversalSync.getInstance();

// Export convenience functions
export const autoSave = universalSync.autoSave.bind(universalSync);
export const saveData = universalSync.saveData.bind(universalSync);
export const loadData = universalSync.loadData.bind(universalSync);
export const syncPendingChanges = universalSync.syncPendingChanges.bind(universalSync);
export const forceSyncFromFirestore = universalSync.forceSyncFromFirestore.bind(universalSync);

// Specific convenience functions for notes, tasks, and schedules
export const saveNotes = async (userId: string, notes: Note[]) => {
  return universalSync.saveData('notes', userId, { notes });
};

// Migration function to move data from localStorage to IndexedDB
const migrateLocalStorageData = async (userId: string): Promise<void> => {
  try {
    console.log('🔄 Checking for localStorage data to migrate...');
    
    // Check for legacy notes data
    const legacyNotes = localStorage.getItem('notes');
    if (legacyNotes) {
      try {
        const notes = JSON.parse(legacyNotes);
        if (Array.isArray(notes) && notes.length > 0) {
          console.log('📦 Migrating notes from localStorage to IndexedDB:', notes.length, 'items');
          await universalSync.saveData('notes', userId, { notes });
          localStorage.removeItem('notes');
        }
      } catch (error) {
        console.error('Error migrating notes:', error);
      }
    }
    
    // Check for legacy tasks data
    const legacyTasks = localStorage.getItem('tasks');
    if (legacyTasks) {
      try {
        const tasks = JSON.parse(legacyTasks);
        if (Array.isArray(tasks) && tasks.length > 0) {
          console.log('📦 Migrating tasks from localStorage to IndexedDB:', tasks.length, 'items');
          await universalSync.saveData('tasks', userId, { tasks });
          localStorage.removeItem('tasks');
        }
      } catch (error) {
        console.error('Error migrating tasks:', error);
      }
    }
    
    // Check for legacy schedules data
    const legacySchedules = localStorage.getItem('classes');
    if (legacySchedules) {
      try {
        const schedules = JSON.parse(legacySchedules);
        if (Array.isArray(schedules) && schedules.length > 0) {
          console.log('📦 Migrating schedules from localStorage to IndexedDB:', schedules.length, 'items');
          await universalSync.saveData('schedules', userId, { schedules });
          localStorage.removeItem('classes');
        }
      } catch (error) {
        console.error('Error migrating schedules:', error);
      }
    }
  } catch (error) {
    console.error('Error during data migration:', error);
  }
};

export const loadNotes = async (userId: string): Promise<Note[]> => {
  console.log('loadNotes: Loading notes for user:', userId);
  
  // Check for migration on first load
  await migrateLocalStorageData(userId);
  
  const data = await universalSync.loadData('notes', userId);
  console.log('loadNotes: Raw data received:', data);
  const notes = data?.notes || [];
  console.log('loadNotes: Returning notes:', notes);
  return notes;
};

export const autoSaveNotes = async (userId: string, notes: Note[], delay?: number) => {
  return universalSync.autoSave('notes', userId, { notes }, delay);
};

export const saveTasks = async (userId: string, tasks: Task[]) => {
  return universalSync.saveData('tasks', userId, { tasks });
};

export const loadTasks = async (userId: string): Promise<Task[]> => {
  console.log('loadTasks: Loading tasks for user:', userId);
  
  // Check for migration on first load
  await migrateLocalStorageData(userId);
  
  const data = await universalSync.loadData('tasks', userId);
  console.log('loadTasks: Raw data received:', data);
  const tasks = data?.tasks || [];
  console.log('loadTasks: Returning tasks:', tasks);
  return tasks;
};

export const autoSaveTasks = async (userId: string, tasks: Task[], delay?: number) => {
  return universalSync.autoSave('tasks', userId, { tasks }, delay);
};

export const saveSchedules = async (userId: string, schedules: EventItem[]) => {
  return universalSync.saveData('schedules', userId, { schedules });
};

export const loadSchedules = async (userId: string): Promise<EventItem[]> => {
  console.log('loadSchedules: Loading schedules for user:', userId);
  
  // Check for migration on first load
  await migrateLocalStorageData(userId);
  
  const data = await universalSync.loadData('schedules', userId);
  console.log('loadSchedules: Raw data received:', data);
  const schedules = data?.schedules || [];
  console.log('loadSchedules: Returning schedules:', schedules);
  return schedules;
};

export const autoSaveSchedules = async (userId: string, schedules: EventItem[], delay?: number) => {
  return universalSync.autoSave('schedules', userId, { schedules }, delay);
};

export default universalSync;