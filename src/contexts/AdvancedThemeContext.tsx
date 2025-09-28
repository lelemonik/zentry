import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { offlineDB } from '@/lib/offline-db';

export interface CustomTheme {
  id: string;
  name: string;
  type: 'preset' | 'custom';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
  };
  wallpaper?: {
    type: 'color' | 'gradient' | 'image';
    value: string;
    opacity?: number;
  };
  effects: {
    glassEffect: boolean;
    blur: number;
    shadows: boolean;
    animations: boolean;
  };
  createdAt: number;
  lastModified: number;
}

interface AdvancedThemeContextType {
  currentTheme: CustomTheme;
  themes: CustomTheme[];
  isDarkMode: boolean;
  initialized: boolean;
  setTheme: (theme: CustomTheme) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
  createCustomTheme: (theme: Omit<CustomTheme, 'id' | 'createdAt' | 'lastModified'>) => Promise<CustomTheme>;
  updateTheme: (themeId: string, updates: Partial<CustomTheme>) => Promise<void>;
  deleteTheme: (themeId: string) => Promise<void>;
  exportTheme: (themeId: string) => CustomTheme | null;
  importTheme: (theme: CustomTheme) => Promise<void>;
  resetToDefault: () => Promise<void>;
  applyWallpaper: (wallpaper: CustomTheme['wallpaper']) => void;
  syncThemePreferences: () => Promise<void>;
  getSystemThemePreference: () => boolean;
  clearThemePreferences: () => Promise<void>;
}

const AdvancedThemeContext = createContext<AdvancedThemeContextType | null>(null);

export const useAdvancedTheme = () => {
  const context = useContext(AdvancedThemeContext);
  if (!context) {
    throw new Error('useAdvancedTheme must be used within an AdvancedThemeProvider');
  }
  return context;
};

// Default preset themes
const DEFAULT_THEMES: CustomTheme[] = [
  {
    id: 'default-light',
    name: 'Default Light',
    type: 'preset',
    colors: {
      primary: 'hsl(210, 60%, 55%)',
      secondary: 'hsl(260, 40%, 60%)',
      accent: 'hsl(160, 50%, 55%)',
      background: 'hsl(0, 0%, 100%)',
      surface: 'hsl(0, 0%, 98%)',
      text: 'hsl(0, 0%, 9%)',
      textMuted: 'hsl(0, 0%, 45%)',
      border: 'hsl(0, 0%, 89%)',
    },
    wallpaper: {
      type: 'gradient',
      value: 'linear-gradient(135deg, hsl(210, 60%, 95%) 0%, hsl(260, 40%, 95%) 100%)',
      opacity: 0.3
    },
    effects: {
      glassEffect: true,
      blur: 8,
      shadows: true,
      animations: true
    },
    createdAt: Date.now(),
    lastModified: Date.now()
  },
  {
    id: 'default-dark',
    name: 'Default Dark',
    type: 'preset',
    colors: {
      primary: 'hsl(210, 60%, 65%)',
      secondary: 'hsl(260, 40%, 70%)',
      accent: 'hsl(160, 50%, 65%)',
      background: 'hsl(0, 0%, 9%)',
      surface: 'hsl(0, 0%, 13%)',
      text: 'hsl(0, 0%, 98%)',
      textMuted: 'hsl(0, 0%, 65%)',
      border: 'hsl(0, 0%, 20%)',
    },
    wallpaper: {
      type: 'gradient',
      value: 'linear-gradient(135deg, hsl(210, 60%, 15%) 0%, hsl(260, 40%, 15%) 100%)',
      opacity: 0.3
    },
    effects: {
      glassEffect: true,
      blur: 8,
      shadows: true,
      animations: true
    },
    createdAt: Date.now(),
    lastModified: Date.now()
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    type: 'preset',
    colors: {
      primary: 'hsl(200, 80%, 50%)',
      secondary: 'hsl(180, 70%, 45%)',
      accent: 'hsl(160, 60%, 50%)',
      background: 'hsl(200, 20%, 98%)',
      surface: 'hsl(200, 30%, 96%)',
      text: 'hsl(200, 15%, 10%)',
      textMuted: 'hsl(200, 10%, 40%)',
      border: 'hsl(200, 20%, 85%)',
    },
    wallpaper: {
      type: 'gradient',
      value: 'linear-gradient(135deg, hsl(200, 80%, 85%) 0%, hsl(180, 70%, 85%) 50%, hsl(160, 60%, 85%) 100%)',
      opacity: 0.4
    },
    effects: {
      glassEffect: true,
      blur: 12,
      shadows: true,
      animations: true
    },
    createdAt: Date.now(),
    lastModified: Date.now()
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    type: 'preset',
    colors: {
      primary: 'hsl(25, 90%, 60%)',
      secondary: 'hsl(10, 80%, 50%)',
      accent: 'hsl(45, 90%, 55%)',
      background: 'hsl(25, 20%, 97%)',
      surface: 'hsl(25, 30%, 94%)',
      text: 'hsl(25, 15%, 15%)',
      textMuted: 'hsl(25, 10%, 45%)',
      border: 'hsl(25, 20%, 85%)',
    },
    wallpaper: {
      type: 'gradient',
      value: 'linear-gradient(135deg, hsl(25, 90%, 85%) 0%, hsl(10, 80%, 80%) 50%, hsl(45, 90%, 85%) 100%)',
      opacity: 0.4
    },
    effects: {
      glassEffect: true,
      blur: 10,
      shadows: true,
      animations: true
    },
    createdAt: Date.now(),
    lastModified: Date.now()
  },
  {
    id: 'forest-calm',
    name: 'Forest Calm',
    type: 'preset',
    colors: {
      primary: 'hsl(140, 60%, 45%)',
      secondary: 'hsl(120, 50%, 40%)',
      accent: 'hsl(80, 60%, 50%)',
      background: 'hsl(140, 20%, 97%)',
      surface: 'hsl(140, 30%, 94%)',
      text: 'hsl(140, 15%, 15%)',
      textMuted: 'hsl(140, 10%, 45%)',
      border: 'hsl(140, 20%, 85%)',
    },
    wallpaper: {
      type: 'gradient',
      value: 'linear-gradient(135deg, hsl(140, 60%, 85%) 0%, hsl(120, 50%, 85%) 50%, hsl(80, 60%, 85%) 100%)',
      opacity: 0.4
    },
    effects: {
      glassEffect: true,
      blur: 8,
      shadows: true,
      animations: true
    },
    createdAt: Date.now(),
    lastModified: Date.now()
  }
];

interface AdvancedThemeProviderProps {
  children: ReactNode;
}

export const AdvancedThemeProvider: React.FC<AdvancedThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentThemeState] = useState<CustomTheme>(DEFAULT_THEMES[0]);
  const [themes, setThemes] = useState<CustomTheme[]>(DEFAULT_THEMES);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize themes from storage
  useEffect(() => {
    const initializeThemes = async () => {
      try {
        console.log('Initializing theme system...');
        
        // First, try to load from IndexedDB (more reliable)
        let savedThemeId = localStorage.getItem('selectedThemeId');
        let savedDarkMode = localStorage.getItem('isDarkMode') === 'true';
        
        try {
          await offlineDB.init();
          const userPreferences = await offlineDB.getUserPreferences();
          
          if (userPreferences?.themePreference) {
            const { isDarkMode: dbDarkMode, currentThemeId, lastUpdated } = userPreferences.themePreference;
            
            // Use IndexedDB data if it's more recent or if localStorage is empty
            if (lastUpdated && currentThemeId) {
              savedDarkMode = dbDarkMode;
              savedThemeId = currentThemeId;
              console.log('Loaded theme preference from IndexedDB:', { savedDarkMode, savedThemeId, lastUpdated });
            }
          }
        } catch (dbError) {
          console.warn('Could not load from IndexedDB, falling back to localStorage:', dbError);
        }
        
        // Detect system preference if no saved preference exists
        if (savedDarkMode === null || localStorage.getItem('isDarkMode') === null) {
          const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
          savedDarkMode = systemDarkMode;
          console.log('No saved preference found, using system preference:', systemDarkMode);
        }
        
        // Apply dark mode class immediately for instant rendering
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(savedDarkMode ? 'dark' : 'light');
        
        setIsDarkMode(savedDarkMode);

        // Load custom themes from IndexedDB
        try {
          await offlineDB.init();
          const customThemes = await offlineDB.getAll('themes') || [];
          const allThemes = [...DEFAULT_THEMES, ...customThemes];
          setThemes(allThemes);

          // Set current theme
          if (savedThemeId && savedThemeId !== 'default-light' && savedThemeId !== 'default-dark') {
            const savedTheme = allThemes.find(t => t.id === savedThemeId);
            if (savedTheme) {
              setCurrentThemeState(savedTheme);
              applyThemeToDOM(savedTheme, savedDarkMode);
            } else {
              // Theme not found, use default
              const defaultTheme = savedDarkMode ? DEFAULT_THEMES[1] : DEFAULT_THEMES[0];
              setCurrentThemeState(defaultTheme);
              applyThemeToDOM(defaultTheme, savedDarkMode);
            }
          } else {
            // Use default theme based on dark mode preference
            const defaultTheme = savedDarkMode ? DEFAULT_THEMES[1] : DEFAULT_THEMES[0];
            setCurrentThemeState(defaultTheme);
            applyThemeToDOM(defaultTheme, savedDarkMode);
          }
        } catch (error) {
          console.error('Error loading custom themes:', error);
          // Fallback to default themes only
          const defaultTheme = savedDarkMode ? DEFAULT_THEMES[1] : DEFAULT_THEMES[0];
          setCurrentThemeState(defaultTheme);
          applyThemeToDOM(defaultTheme, savedDarkMode);
        }

        setInitialized(true);
      } catch (error) {
        console.error('Error initializing themes:', error);
        setInitialized(true);
      }
    };

    initializeThemes();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      console.log('System theme changed to:', e.matches ? 'dark' : 'light');
      
      // Only auto-switch if user hasn't explicitly set a preference
      const hasExplicitPreference = localStorage.getItem('isDarkMode') !== null;
      
      if (!hasExplicitPreference) {
        console.log('No explicit user preference, following system theme');
        const systemDarkMode = e.matches;
        setIsDarkMode(systemDarkMode);
        
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(systemDarkMode ? 'dark' : 'light');
        
        applyThemeToDOM(currentTheme, systemDarkMode);
      }
    };

    // Add listener for system theme changes
    if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemThemeChange);
    } else {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleSystemThemeChange);
      } else {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      }
    };
  }, [currentTheme]);

  // Auto-save theme preferences periodically
  useEffect(() => {
    if (!initialized) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        const themePreference = {
          isDarkMode,
          currentThemeId: currentTheme.id,
          lastUpdated: new Date().toISOString()
        };
        await offlineDB.saveUserPreferences({ themePreference });
        console.log('Auto-saved theme preferences');
      } catch (error) {
        console.warn('Auto-save theme preferences failed:', error);
      }
    }, 30000); // Save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [isDarkMode, currentTheme.id, initialized]);

  const applyThemeToDOM = (theme: CustomTheme, darkMode: boolean) => {
    const root = document.documentElement;
    
    console.log('Applying theme to DOM:', theme.id, 'darkMode:', darkMode);
    
    // Apply dark/light mode class first with transition
    root.style.setProperty('--theme-transition', 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease');
    root.classList.remove('light', 'dark');
    root.classList.add(darkMode ? 'dark' : 'light');
    
    // Force browser reflow to ensure class is applied
    root.offsetHeight;
    
    console.log('Applied class:', darkMode ? 'dark' : 'light');

    // Check if this is a default theme - if so, don't override CSS variables, just use the class
    const isDefaultTheme = theme.id === 'default-light' || theme.id === 'default-dark';
    console.log('Is default theme:', isDefaultTheme);
    
    if (!isDefaultTheme) {
      // Apply color variables using Tailwind CSS variable names only for custom themes
      // Convert HSL string to space-separated values for Tailwind with validation
      const hslToTailwind = (hslString: string): string => {
        const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (match) {
          const [, h, s, l] = match;
          // Validate HSL values
          const hue = Math.max(0, Math.min(360, parseInt(h)));
          const saturation = Math.max(0, Math.min(100, parseInt(s)));
          const lightness = Math.max(0, Math.min(100, parseInt(l)));
          return `${hue} ${saturation}% ${lightness}%`;
        }
        return hslString; // fallback
      };

      // Map theme colors to Tailwind CSS variables with error handling
      try {
        root.style.setProperty('--primary', hslToTailwind(theme.colors.primary));
        root.style.setProperty('--secondary', hslToTailwind(theme.colors.secondary));
        root.style.setProperty('--accent', hslToTailwind(theme.colors.accent));
        root.style.setProperty('--background', hslToTailwind(theme.colors.background));
        root.style.setProperty('--foreground', hslToTailwind(theme.colors.text));
        root.style.setProperty('--muted', hslToTailwind(theme.colors.surface));
        root.style.setProperty('--muted-foreground', hslToTailwind(theme.colors.textMuted));
        root.style.setProperty('--border', hslToTailwind(theme.colors.border));
        root.style.setProperty('--card', hslToTailwind(theme.colors.surface));
        root.style.setProperty('--card-foreground', hslToTailwind(theme.colors.text));
        
        // Set foreground colors for better contrast
        root.style.setProperty('--primary-foreground', darkMode ? '220 30% 8%' : '0 0% 98%');
        root.style.setProperty('--secondary-foreground', darkMode ? '220 30% 8%' : '0 0% 98%');
        root.style.setProperty('--accent-foreground', darkMode ? '220 30% 8%' : '0 0% 98%');
        
        // Also apply the custom color variables for backward compatibility
        Object.entries(theme.colors).forEach(([key, value]) => {
          root.style.setProperty(`--color-${key}`, value);
        });
        
        console.log('Custom theme colors applied successfully');
      } catch (error) {
        console.error('Error applying custom theme colors:', error);
      }
    } else {
      // For default themes, remove any custom CSS variable overrides to let CSS handle it
      const cssVars = [
        '--primary', '--secondary', '--accent', '--background', '--foreground', 
        '--muted', '--muted-foreground', '--border', '--card', '--card-foreground',
        '--primary-foreground', '--secondary-foreground', '--accent-foreground'
      ];
      cssVars.forEach(cssVar => {
        root.style.removeProperty(cssVar);
      });
      
      // Also remove custom color variables
      Object.keys(theme.colors).forEach(key => {
        root.style.removeProperty(`--color-${key}`);
      });
      
      console.log('Default theme applied, custom overrides cleared');
    }

    // Apply wallpaper
    if (theme.wallpaper) {
      applyWallpaperToDOM(theme.wallpaper);
    }

    // Apply effects
    root.style.setProperty('--blur-amount', `${theme.effects.blur}px`);
    root.style.setProperty('--glass-opacity', theme.effects.glassEffect ? '0.1' : '0');
    root.classList.toggle('no-shadows', !theme.effects.shadows);
    root.classList.toggle('no-animations', !theme.effects.animations);
  };

  const applyWallpaperToDOM = (wallpaper: CustomTheme['wallpaper']) => {
    const body = document.body;
    
    if (!wallpaper) {
      body.style.removeProperty('background-image');
      body.style.removeProperty('background-size');
      body.style.removeProperty('background-position');
      body.style.removeProperty('background-repeat');
      return;
    }

    switch (wallpaper.type) {
      case 'color':
        body.style.backgroundColor = wallpaper.value;
        body.style.removeProperty('background-image');
        break;
      case 'gradient':
        body.style.backgroundImage = wallpaper.value;
        body.style.backgroundSize = 'cover';
        body.style.backgroundPosition = 'center';
        body.style.backgroundRepeat = 'no-repeat';
        break;
      case 'image':
        body.style.backgroundImage = `url(${wallpaper.value})`;
        body.style.backgroundSize = 'cover';
        body.style.backgroundPosition = 'center';
        body.style.backgroundRepeat = 'no-repeat';
        break;
    }

    // Apply opacity overlay if specified
    if (wallpaper.opacity !== undefined && wallpaper.opacity < 1) {
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = isDarkMode ? 'black' : 'white';
      overlay.style.opacity = (1 - wallpaper.opacity).toString();
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '-1';
      overlay.id = 'wallpaper-overlay';
      
      // Remove existing overlay
      const existingOverlay = document.getElementById('wallpaper-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }
      
      body.appendChild(overlay);
    }
  };

  const setTheme = async (theme: CustomTheme) => {
    try {
      console.log('Setting theme:', theme.id);
      
      setCurrentThemeState(theme);
      applyThemeToDOM(theme, isDarkMode);
      
      // Persist to localStorage for immediate access
      localStorage.setItem('selectedThemeId', theme.id);
      
      // Persist to IndexedDB for robust storage
      try {
        const themePreference = {
          isDarkMode,
          currentThemeId: theme.id,
          lastUpdated: new Date().toISOString()
        };
        await offlineDB.saveUserPreferences({ themePreference });
      } catch (dbError) {
        console.warn('Failed to save theme to IndexedDB:', dbError);
      }
      
      console.log('Theme set successfully:', theme.id);
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  };

  const toggleDarkMode = async () => {
    const newDarkMode = !isDarkMode;
    console.log('Toggling dark mode:', isDarkMode, '->', newDarkMode);
    
    try {
      // Add transition class before changing
      const root = document.documentElement;
      root.style.setProperty('transition', 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease');
      
      // Update state first
      setIsDarkMode(newDarkMode);
      
      // Apply the class immediately for instant visual feedback
      root.classList.remove('light', 'dark');
      root.classList.add(newDarkMode ? 'dark' : 'light');
      
      // Force browser reflow
      root.offsetHeight;
      
      // Persist to localStorage for immediate access
      localStorage.setItem('isDarkMode', newDarkMode.toString());
      
      // Persist to IndexedDB for robust storage
      try {
        const themePreference = {
          isDarkMode: newDarkMode,
          currentThemeId: currentTheme.id,
          lastUpdated: new Date().toISOString()
        };
        await offlineDB.saveUserPreferences({ themePreference });
        console.log('Theme preference saved to IndexedDB');
      } catch (dbError) {
        console.warn('Failed to save theme preference to IndexedDB:', dbError);
        // Continue with localStorage fallback
      }
      
      // Apply the full theme with the new mode
      applyThemeToDOM(currentTheme, newDarkMode);
      
      // Remove transition after animation completes
      setTimeout(() => {
        root.style.removeProperty('transition');
      }, 300);
      
      // Dispatch custom event for components that need to react to theme changes
      const themeChangeEvent = new CustomEvent('themeChange', {
        detail: { isDarkMode: newDarkMode, theme: currentTheme }
      });
      document.dispatchEvent(themeChangeEvent);
      
      console.log('Dark mode toggled successfully:', {
        previousMode: isDarkMode,
        newMode: newDarkMode,
        currentTheme: currentTheme.id,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error toggling dark mode:', error);
      // Revert state on error
      setIsDarkMode(isDarkMode);
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(isDarkMode ? 'dark' : 'light');
      
      // Show error message to user (could be enhanced with a toast notification)
      console.warn('Theme toggle failed, reverted to previous state');
    }
  };

  const createCustomTheme = async (themeData: Omit<CustomTheme, 'id' | 'createdAt' | 'lastModified'>): Promise<CustomTheme> => {
    const newTheme: CustomTheme = {
      ...themeData,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'custom',
      createdAt: Date.now(),
      lastModified: Date.now()
    };

    try {
      // Save to IndexedDB
      await offlineDB.add('themes', newTheme);
      
      // Update local state
      setThemes(prev => [...prev, newTheme]);
      
      return newTheme;
    } catch (error) {
      console.error('Error creating custom theme:', error);
      throw error;
    }
  };

  const updateTheme = async (themeId: string, updates: Partial<CustomTheme>): Promise<void> => {
    try {
      const updatedTheme = {
        ...themes.find(t => t.id === themeId)!,
        ...updates,
        lastModified: Date.now()
      };

      // Update in IndexedDB
      await offlineDB.update('themes', updatedTheme);
      
      // Update local state
      setThemes(prev => prev.map(t => t.id === themeId ? updatedTheme : t));
      
      // Update current theme if it's the one being modified
      if (currentTheme.id === themeId) {
        setCurrentThemeState(updatedTheme);
        applyThemeToDOM(updatedTheme, isDarkMode);
      }
    } catch (error) {
      console.error('Error updating theme:', error);
      throw error;
    }
  };

  const deleteTheme = async (themeId: string): Promise<void> => {
    try {
      // Don't allow deletion of preset themes
      const theme = themes.find(t => t.id === themeId);
      if (theme?.type === 'preset') {
        throw new Error('Cannot delete preset themes');
      }

      // Remove from IndexedDB
      await offlineDB.delete('themes', themeId);
      
      // Update local state
      setThemes(prev => prev.filter(t => t.id !== themeId));
      
      // If current theme is being deleted, switch to default
      if (currentTheme.id === themeId) {
        const defaultTheme = isDarkMode ? DEFAULT_THEMES[1] : DEFAULT_THEMES[0];
        setTheme(defaultTheme);
      }
    } catch (error) {
      console.error('Error deleting theme:', error);
      throw error;
    }
  };

  const exportTheme = (themeId: string): CustomTheme | null => {
    return themes.find(t => t.id === themeId) || null;
  };

  const importTheme = async (theme: CustomTheme): Promise<void> => {
    try {
      // Generate new ID to avoid conflicts
      const importedTheme: CustomTheme = {
        ...theme,
        id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'custom',
        createdAt: Date.now(),
        lastModified: Date.now()
      };

      await createCustomTheme(importedTheme);
    } catch (error) {
      console.error('Error importing theme:', error);
      throw error;
    }
  };

  const applyWallpaper = (wallpaper: CustomTheme['wallpaper']) => {
    const updatedTheme = {
      ...currentTheme,
      wallpaper,
      lastModified: Date.now()
    };
    
    setCurrentThemeState(updatedTheme);
    applyWallpaperToDOM(wallpaper);
    
    // Save if it's a custom theme
    if (currentTheme.type === 'custom') {
      updateTheme(currentTheme.id, { wallpaper });
    }
  };

  // Sync theme preferences across storage methods
  const syncThemePreferences = async () => {
    try {
      const themePreference = {
        isDarkMode,
        currentThemeId: currentTheme.id,
        lastUpdated: new Date().toISOString()
      };
      
      // Save to both localStorage and IndexedDB
      localStorage.setItem('isDarkMode', isDarkMode.toString());
      localStorage.setItem('selectedThemeId', currentTheme.id);
      await offlineDB.saveUserPreferences({ themePreference });
      
      console.log('Theme preferences synced successfully');
    } catch (error) {
      console.error('Failed to sync theme preferences:', error);
      throw error;
    }
  };

  // Get system theme preference
  const getSystemThemePreference = (): boolean => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  // Clear all theme preferences and reset to system default
  const clearThemePreferences = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('isDarkMode');
      localStorage.removeItem('selectedThemeId');
      
      // Clear IndexedDB
      await offlineDB.saveUserPreferences({ themePreference: null });
      
      // Reset to system preference and default theme
      const systemDarkMode = getSystemThemePreference();
      const defaultTheme = systemDarkMode ? DEFAULT_THEMES[1] : DEFAULT_THEMES[0];
      
      setIsDarkMode(systemDarkMode);
      setCurrentThemeState(defaultTheme);
      applyThemeToDOM(defaultTheme, systemDarkMode);
      
      console.log('Theme preferences cleared, reset to system default');
    } catch (error) {
      console.error('Failed to clear theme preferences:', error);
      throw error;
    }
  };

  // Enhanced reset to default with better error handling
  const resetToDefault = async () => {
    try {
      const defaultTheme = isDarkMode ? DEFAULT_THEMES[1] : DEFAULT_THEMES[0];
      await setTheme(defaultTheme);
      console.log('Reset to default theme successfully');
    } catch (error) {
      console.error('Failed to reset to default theme:', error);
      throw error;
    }
  };

  const value: AdvancedThemeContextType = {
    currentTheme,
    themes,
    isDarkMode,
    initialized,
    setTheme,
    toggleDarkMode,
    createCustomTheme,
    updateTheme,
    deleteTheme,
    exportTheme,
    importTheme,
    resetToDefault,
    applyWallpaper,
    syncThemePreferences,
    getSystemThemePreference,
    clearThemePreferences
  };

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading themes...</p>
        </div>
      </div>
    );
  }

  return (
    <AdvancedThemeContext.Provider value={value}>
      {children}
    </AdvancedThemeContext.Provider>
  );
};