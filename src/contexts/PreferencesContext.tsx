import React, { createContext, useContext } from 'react';
import { usePersistedState } from '@/hooks/use-local-storage';

interface UserPreferences {
  notifications: boolean;
  showCompletedTasks: boolean;
  autoSave: boolean;
  animationsEnabled: boolean;
}

interface PreferencesContextType {
  preferences: UserPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const defaultPreferences: UserPreferences = {
  notifications: true,
  showCompletedTasks: true,
  autoSave: true,
  animationsEnabled: true,
};

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = usePersistedState<UserPreferences>('userPreferences', defaultPreferences);

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Apply animation preference to document body
  React.useEffect(() => {
    const body = document.body;
    
    if (preferences.animationsEnabled) {
      body.classList.remove('disable-animations');
    } else {
      body.classList.add('disable-animations');
    }
    
    return () => {
      body.classList.remove('disable-animations');
    };
  }, [preferences.animationsEnabled]);

  const value = {
    preferences,
    setPreferences,
    updatePreference
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}

export type { UserPreferences };