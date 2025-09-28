import { useCallback, useEffect, useState } from 'react';
import { useAdvancedTheme } from '@/contexts/AdvancedThemeContext';

/**
 * Enhanced hook for managing theme preferences with additional utilities
 */
export const useThemePreferences = () => {
  const {
    isDarkMode,
    toggleDarkMode,
    syncThemePreferences,
    getSystemThemePreference,
    clearThemePreferences,
    currentTheme,
    initialized
  } = useAdvancedTheme();

  const [isToggling, setIsToggling] = useState(false);
  const [lastToggleTime, setLastToggleTime] = useState<number>(0);

  // Debounced toggle to prevent rapid switching
  const debouncedToggleDarkMode = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastToggle = now - lastToggleTime;
    
    // Prevent rapid toggling (minimum 300ms between toggles)
    if (timeSinceLastToggle < 300) {
      return;
    }

    setIsToggling(true);
    setLastToggleTime(now);

    try {
      await toggleDarkMode();
      
      // Add haptic feedback on supported devices
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error('Failed to toggle dark mode:', error);
    } finally {
      setIsToggling(false);
    }
  }, [toggleDarkMode, lastToggleTime]);

  // Check if current theme matches system preference
  const isFollowingSystemTheme = useCallback(() => {
    const systemDarkMode = getSystemThemePreference();
    return isDarkMode === systemDarkMode;
  }, [isDarkMode, getSystemThemePreference]);

  // Sync preferences manually
  const syncPreferences = useCallback(async () => {
    try {
      await syncThemePreferences();
      return true;
    } catch (error) {
      console.error('Failed to sync theme preferences:', error);
      return false;
    }
  }, [syncThemePreferences]);

  // Reset to system default
  const resetToSystemDefault = useCallback(async () => {
    try {
      await clearThemePreferences();
      return true;
    } catch (error) {
      console.error('Failed to reset theme preferences:', error);
      return false;
    }
  }, [clearThemePreferences]);

  // Get theme status information
  const getThemeStatus = useCallback(() => {
    const systemDarkMode = getSystemThemePreference();
    const followingSystem = isFollowingSystemTheme();
    
    return {
      isDarkMode,
      systemPrefersDark: systemDarkMode,
      isFollowingSystem: followingSystem,
      currentThemeName: currentTheme.name,
      isDefaultTheme: currentTheme.type === 'preset',
      initialized
    };
  }, [isDarkMode, isFollowingSystemTheme, currentTheme, initialized, getSystemThemePreference]);

  // Auto-sync when preferences change (debounced)
  useEffect(() => {
    if (!initialized) return;

    const syncTimeout = setTimeout(() => {
      syncPreferences();
    }, 1000);

    return () => clearTimeout(syncTimeout);
  }, [isDarkMode, currentTheme.id, initialized, syncPreferences]);

  return {
    // Core theme state
    isDarkMode,
    currentTheme,
    initialized,
    
    // Toggle functions
    toggleDarkMode: debouncedToggleDarkMode,
    isToggling,
    
    // Utility functions
    isFollowingSystemTheme,
    syncPreferences,
    resetToSystemDefault,
    getThemeStatus,
    getSystemThemePreference,
    
    // Status information
    themeStatus: getThemeStatus()
  };
};

/**
 * Hook for components that need theme-aware styling
 */
export const useThemeAwareStyles = () => {
  const { isDarkMode, currentTheme } = useAdvancedTheme();

  const getThemeClass = useCallback((lightClass: string, darkClass: string) => {
    return isDarkMode ? darkClass : lightClass;
  }, [isDarkMode]);

  const getThemeColor = useCallback((colorKey: keyof typeof currentTheme.colors) => {
    return currentTheme.colors[colorKey];
  }, [currentTheme.colors]);

  const getContrastColor = useCallback(() => {
    return isDarkMode ? '#ffffff' : '#000000';
  }, [isDarkMode]);

  const getThemeVariables = useCallback(() => {
    return {
      '--theme-primary': currentTheme.colors.primary,
      '--theme-secondary': currentTheme.colors.secondary,
      '--theme-accent': currentTheme.colors.accent,
      '--theme-background': currentTheme.colors.background,
      '--theme-text': currentTheme.colors.text,
      '--theme-border': currentTheme.colors.border,
    } as React.CSSProperties;
  }, [currentTheme.colors]);

  return {
    isDarkMode,
    currentTheme,
    getThemeClass,
    getThemeColor,
    getContrastColor,
    getThemeVariables
  };
};

/**
 * Hook for managing theme transitions and animations
 */
export const useThemeTransitions = () => {
  const { isDarkMode, currentTheme } = useAdvancedTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const triggerThemeTransition = useCallback(() => {
    setIsTransitioning(true);
    
    // Add transition classes to root element
    const root = document.documentElement;
    root.style.transition = 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease';
    
    setTimeout(() => {
      root.style.transition = '';
      setIsTransitioning(false);
    }, 300);
  }, []);

  // Auto-trigger transition on theme changes
  useEffect(() => {
    if (currentTheme.effects.animations) {
      triggerThemeTransition();
    }
  }, [isDarkMode, currentTheme.id, currentTheme.effects.animations, triggerThemeTransition]);

  return {
    isTransitioning,
    triggerThemeTransition
  };
};