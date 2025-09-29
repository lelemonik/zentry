import {
  loadData,
  loadNotes,
  loadTasks,
  loadSchedules
} from './universal-sync';

interface PreloadedData {
  schedules?: any[];
  tasks?: any[];
  notes?: any[];
  userData?: any;
  userProfile?: any;
  errors?: Record<string, Error>;
}

class DataPreloader {
  private static instance: DataPreloader;
  private preloadedData: PreloadedData = {};
  private preloadPromises: Record<string, Promise<any>> = {};
  private isPreloading = false;

  static getInstance(): DataPreloader {
    if (!DataPreloader.instance) {
      DataPreloader.instance = new DataPreloader();
    }
    return DataPreloader.instance;
  }

  // Start preloading all user data concurrently
  async preloadUserData(userId: string): Promise<PreloadedData> {
    if (this.isPreloading) {
      // Return existing promises if already preloading
      return this.waitForPreload();
    }

    this.isPreloading = true;
    this.preloadedData = { errors: {} };

    console.log('🚀 Starting concurrent data preload for user:', userId);

    // Start all requests concurrently
    const promises = {
      schedules: this.preloadWithErrorHandling('schedules', () => loadSchedules(userId)),
      tasks: this.preloadWithErrorHandling('tasks', () => loadTasks(userId)),
      notes: this.preloadWithErrorHandling('notes', () => loadNotes(userId)),
      userData: this.preloadWithErrorHandling('userData', () => loadData(userId)),
      userProfile: null // No specific profile loader available
    };

    // Wait for all to complete (don't fail if one fails)
    await Promise.allSettled([
      promises.schedules,
      promises.tasks,
      promises.notes,
      promises.userData,
      promises.userProfile
    ]);

    this.isPreloading = false;
    console.log('✅ Data preload completed:', this.preloadedData);
    
    return this.preloadedData;
  }

  private async preloadWithErrorHandling(key: string, loader: () => Promise<any>): Promise<void> {
    try {
      const startTime = performance.now();
      const data = await loader();
      const endTime = performance.now();
      
      this.preloadedData[key as keyof PreloadedData] = data;
      console.log(`✅ ${key} loaded in ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      console.error(`❌ Failed to preload ${key}:`, error);
      this.preloadedData.errors![key] = error as Error;
    }
  }

  private async waitForPreload(): Promise<PreloadedData> {
    // Wait for current preload to finish
    while (this.isPreloading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return this.preloadedData;
  }

  // Get preloaded data for a specific type
  getPreloadedData<T>(type: keyof Omit<PreloadedData, 'errors'>): T | null {
    return (this.preloadedData[type] as T) || null;
  }

  // Check if data was preloaded successfully
  hasPreloadedData(type: keyof Omit<PreloadedData, 'errors'>): boolean {
    return this.preloadedData[type] !== undefined && !this.preloadedData.errors?.[type];
  }

  // Clear preloaded data (useful when user logs out)
  clearPreloadedData(): void {
    this.preloadedData = { errors: {} };
    this.preloadPromises = {};
    this.isPreloading = false;
  }

  // Get preload error for a specific type
  getPreloadError(type: string): Error | null {
    return this.preloadedData.errors?.[type] || null;
  }
}

export const dataPreloader = DataPreloader.getInstance();

// Hook for using preloaded data
export function usePreloadedData<T>(type: keyof Omit<PreloadedData, 'errors'>) {
  const data = dataPreloader.getPreloadedData<T>(type);
  const hasData = dataPreloader.hasPreloadedData(type);
  const error = dataPreloader.getPreloadError(type);
  
  return {
    data,
    hasData,
    error,
    isLoading: !hasData && !error
  };
}